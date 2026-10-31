const { User, Budget, Category, Entry, Vehicle, Tire } = require("../models/index.cjs");
const { tireStints, tireSummary } = require("../utils/tires.cjs");
const mongoose = require("mongoose");
const {
  signToken,
  requireUser,
  forbiddenError,
  inputError,
} = require("../utils/auth.cjs");
const dateScalar = require("./dateScalar.cjs");
const { GraphQLError } = require("graphql");
const {
  verifyAuth0IdToken,
  Auth0VerificationError,
} = require("../utils/auth0.cjs");
const {
  dateToMonthStr,
  createMonthLabelFromOffset,
  createMonthObj,
  createMonthlyCategoryObj,
  copyObject,
  parseMonthlyEntries,
  parseMonthlyBalances,
  fixRounding,
  SPLIT_METHODS,
  monthLabelToKey,
  dateToMonthKey,
  resolveSplitSetting,
} = require("../utils/helpers.cjs");
const { renderPdf } = require("../utils/pdf.cjs");
const { buildStatement } = require("../reports/statement.cjs");
const statementDocument = require("../templates/statement.cjs");
const vehicleReportDocument = require("../templates/vehicleReport.cjs");
const {
  eachMonthOfInterval,
  isBefore,
  isAfter,
  isEqual,
  startOfDay,
} = require("date-fns");

const CATEGORY_TYPES = ["income", "expense"];
// extra data a category's entries can carry
const META_TYPES = ["mileage", "maintenance"];
const MILEAGE_FIELDS = ["pricePerLitre", "litres", "distance"];
const TIRE_SEASONS = ["summer", "winter", "all-season"];

// "" / null clear the meta type; anything else must be a known type
function cleanMetaType(metaType) {
  if (metaType === null || metaType === undefined || metaType === "") {
    return undefined;
  }
  if (!META_TYPES.includes(metaType)) {
    throw inputError("Unknown tracking type");
  }
  return metaType;
}

const vehicleName = (vehicle) =>
  [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ");

// distance and fill-up count per vehicle, from every entry logged against it,
// plus each vehicle's maintenance count and spend
async function vehicleTotals(budgetID) {
  const [fills, maintenance] = await Promise.all([
    fillTotals(budgetID),
    Entry.aggregate([
      { $match: { budgetID, "maintenance.vehicleID": { $exists: true } } },
      {
        $group: {
          _id: "$maintenance.vehicleID",
          maintenanceCount: { $sum: 1 },
          maintenanceCost: { $sum: "$value" },
        },
      },
    ]),
  ]);
  maintenance.forEach(({ _id, ...rest }) => {
    const key = String(_id);
    fills.set(key, { ...(fills.get(key) || {}), ...rest });
  });
  return fills;
}

async function fillTotals(budgetID) {
  const rows = await Entry.aggregate([
    { $match: { budgetID, "mileage.vehicleID": { $exists: true } } },
    {
      $group: {
        _id: "$mileage.vehicleID",
        totalDistance: { $sum: { $ifNull: ["$mileage.distance", 0] } },
        fillCount: { $sum: 1 },
      },
    },
  ]);
  return new Map(rows.map((row) => [String(row._id), row]));
}

function presentVehicle(vehicle, totals) {
  const total = totals.get(String(vehicle._id)) || {};
  const totalDistance = fixRounding(total.totalDistance || 0, 1);
  return {
    _id: vehicle._id,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    plate: vehicle.plate,
    color: vehicle.color,
    name: vehicleName(vehicle),
    totalDistance,
    fillCount: total.fillCount || 0,
    odometer: fixRounding((vehicle.odometerOffset || 0) + totalDistance, 1),
    maintenanceCount: total.maintenanceCount || 0,
    maintenanceCost: fixRounding(total.maintenanceCost || 0, 2),
    defaultFor: (vehicle.defaultFor || []).map(String),
    tireChanges: [...(vehicle.tireChanges || [])].sort((a, b) => a.odometer - b.odometer),
  };
}

// a vehicle's tires with their usage, given the presented vehicle
async function presentTires(vehicle) {
  const tires = await Tire.find({ vehicleID: vehicle._id }).sort({ createdAt: 1 });
  const stints = tireStints(vehicle.tireChanges, vehicle.odometer);
  return tires.map((tire) => ({ ...tire.toObject(), ...tireSummary(tire, stints) }));
}

function cleanTireFields(input) {
  const fields = {
    brand: String(input.brand || "").trim(),
    season: input.season,
    cost: input.cost ?? 0,
    initialOdometer: input.initialOdometer ?? 0,
  };
  if (!fields.brand) {
    throw inputError("Tires need a brand");
  }
  if (!TIRE_SEASONS.includes(fields.season)) {
    throw inputError("Season must be summer, winter or all-season");
  }
  ["cost", "initialOdometer"].forEach((field) => {
    if (!(Number.isFinite(fields[field]) && fields[field] >= 0)) {
      throw inputError(`${field} must be zero or more`);
    }
  });
  return fields;
}

async function loadTire(vehicle, tireID) {
  assertObjectId(tireID, "tire");
  const tire = await Tire.findOne({ _id: tireID, vehicleID: vehicle._id });
  if (!tire) {
    throw inputError("Those tires aren't on this vehicle's list");
  }
  return tire;
}

// add a change to a (loaded) vehicle and retire the sets coming off for good
async function addChange(vehicle, { tireID, odometer, date, retireTireIDs = [], entryID }) {
  if (!(Number.isFinite(odometer) && odometer >= 0)) {
    throw inputError("Odometer must be zero or more");
  }
  const tire = await loadTire(vehicle, tireID);
  const retiring = [];
  for (const id of retireTireIDs || []) {
    const retired = await loadTire(vehicle, id);
    if (!retired._id.equals(tire._id)) {
      retiring.push(retired._id);
    }
  }
  vehicle.tireChanges.push({ odometer, date, tireID: tire._id, retired: retiring, entryID });
  if (retiring.length) {
    await Tire.updateMany({ _id: { $in: retiring } }, { $set: { retired: true } });
  }
  if (tire.retired) {
    tire.retired = false;
    await tire.save();
  }
}

// take a change off a (loaded) vehicle, bringing back what it retired
async function removeChange(vehicle, change) {
  if (change.retired?.length) {
    await Tire.updateMany({ _id: { $in: change.retired } }, { $set: { retired: false } });
  }
  vehicle.tireChanges.pull(change._id);
}

// remove the tire change a maintenance entry logged, wherever it is
async function removeEntryTireChange(budgetID, entryID) {
  const vehicles = await Vehicle.find({ budgetID, "tireChanges.entryID": entryID });
  for (const vehicle of vehicles) {
    const linked = vehicle.tireChanges.filter((c) => c.entryID?.equals(entryID));
    for (const change of linked) {
      await removeChange(vehicle, change);
    }
    await vehicle.save();
  }
}

// a tire change sent with a maintenance entry needs a vehicle and odometer
function assertEntryTireChange(tireChange, maintenance) {
  if (!tireChange) {
    return;
  }
  if (!maintenance || !Number.isFinite(maintenance.odometer)) {
    throw inputError("A tire change needs a vehicle and odometer reading");
  }
  if (!tireChange.tireID && !tireChange.newTire) {
    throw inputError("Choose the tires going on, or add new ones");
  }
  if (tireChange.newTire) {
    cleanTireFields(tireChange.newTire);
  }
}

// replace the entry's tire change with the one sent (or none)
async function applyEntryTireChange(budget, entry, maintenance, tireChange) {
  await removeEntryTireChange(budget._id, entry._id);
  if (!tireChange) {
    return;
  }
  const vehicle = await loadVehicle(budget, maintenance.vehicleID);
  let { tireID } = tireChange;
  if (!tireID) {
    const tire = await Tire.create({ ...cleanTireFields(tireChange.newTire), vehicleID: vehicle._id });
    tireID = tire._id;
  }
  await addChange(vehicle, {
    tireID,
    odometer: maintenance.odometer,
    date: entry.effectiveDate,
    retireTireIDs: tireChange.retireTireIDs,
    entryID: entry._id,
  });
  await vehicle.save();
}

async function loadVehicle(budget, vehicleID) {
  assertObjectId(vehicleID, "vehicle");
  const vehicle = await Vehicle.findOne({ _id: vehicleID, budgetID: budget._id });
  if (!vehicle) {
    throw inputError("Vehicle isn't in this budget");
  }
  return vehicle;
}

// fuel details for a transaction, or null when none were given
async function cleanMileage(mileage, budget, category) {
  if (!mileage) {
    return null;
  }
  if (category.metaType !== "mileage") {
    throw inputError("This category doesn't track mileage");
  }
  await loadVehicle(budget, mileage.vehicleID);
  const cleaned = { vehicleID: mileage.vehicleID };
  MILEAGE_FIELDS.forEach((field) => {
    const value = mileage[field];
    if (value === null || value === undefined) {
      return;
    }
    if (!(Number.isFinite(value) && value >= 0)) {
      throw inputError(`${field} must be zero or more`);
    }
    cleaned[field] = value;
  });
  return cleaned;
}

async function cleanMaintenance(maintenance, budget, category) {
  if (!maintenance) {
    return null;
  }
  if (category.metaType !== "maintenance") {
    throw inputError("This category doesn't track maintenance");
  }
  await loadVehicle(budget, maintenance.vehicleID);
  const cleaned = { vehicleID: maintenance.vehicleID };
  const { odometer } = maintenance;
  if (odometer !== null && odometer !== undefined) {
    if (!(Number.isFinite(odometer) && odometer >= 0)) {
      throw inputError("odometer must be zero or more");
    }
    cleaned.odometer = odometer;
  }
  return cleaned;
}

// Fill-ups with the running odometer and L/100 km, and maintenance records,
// both oldest first. The odometer is the vehicle's offset plus every km
// logged, so the running total needs all fill-ups even for a date range.
async function buildVehicleLog(budget, vehicle) {
  const [fillEntries, maintenance, totals] = await Promise.all([
    Entry.find({ budgetID: budget._id, "mileage.vehicleID": vehicle._id })
      .sort({ effectiveDate: 1, createdAt: 1 })
      .populate("userID"),
    Entry.find({ budgetID: budget._id, "maintenance.vehicleID": vehicle._id })
      .sort({ effectiveDate: 1, createdAt: 1 })
      .populate("userID"),
    vehicleTotals(budget._id),
  ]);

  let odometer = vehicle.odometerOffset || 0;
  const fills = fillEntries.map((entry) => {
    const { litres, distance } = entry.mileage;
    odometer += distance || 0;
    return {
      entry,
      odometer: fixRounding(odometer, 1),
      litresPer100km:
        litres > 0 && distance > 0 ? (litres / distance) * 100 : null,
    };
  });

  return { vehicle: presentVehicle(vehicle, totals), fills, maintenance };
}

function assertObjectId(id, label) {
  if (!mongoose.isValidObjectId(id)) {
    throw inputError(`Invalid ${label}`);
  }
}

function assertDescription(title) {
  const trimmed = String(title ?? "").trim();
  if (!trimmed) {
    throw inputError("Description required");
  }
  return trimmed;
}

function assertValidDate(date, label = "date") {
  if (!(date instanceof Date) || isNaN(date)) {
    throw inputError(`Invalid ${label}`);
  }
}

// load a budget and ensure the signed-in user is one of its owners
async function loadBudgetForUser(budgetID, user, populate = []) {
  assertObjectId(budgetID, "budget");

  let query = Budget.findById(budgetID);
  populate.forEach((path) => (query = query.populate(path)));
  const budget = await query;

  if (!budget) {
    throw inputError("No Budget Found");
  }

  const owners = budget.ownerIDs.map((owner) => String(owner._id ?? owner));
  if (!owners.includes(String(user._id))) {
    throw forbiddenError("User Not Authorized");
  }

  return { budget, owners };
}

function assertOwner(owners, userID, label = "User") {
  if (!owners.includes(String(userID))) {
    throw inputError(`${label} is not a member of this budget`);
  }
}

async function loadCategoryInBudget(categoryID, budgetID) {
  assertObjectId(categoryID, "category");
  const category = await Category.findById(categoryID);
  if (!category || !category.budgetID.equals(budgetID)) {
    throw inputError("Category does not belong to this budget");
  }
  return category;
}

async function loadEntryInBudget(entryID, budgetID) {
  assertObjectId(entryID, "entry");
  const entry = await Entry.findById(entryID)
    .populate("userID")
    .populate("toUserID");
  if (!entry) {
    throw inputError("No Entry Found");
  }
  if (!entry.budgetID.equals(budgetID)) {
    throw forbiddenError("Budget Does Not Contain Entry");
  }
  return entry;
}

// fetch all entries for the given months in one query, then total them up
// using the split setting in force for each month. budget.ownerIDs must be
// populated.
async function populateMonths(budget, months) {
  const entries = await Entry.find({
    budgetID: budget._id,
    monthString: { $in: months.map((month) => month.label) },
  })
    .sort({ effectiveDate: 1 })
    .populate("userID")
    .populate("toUserID");

  months.forEach((month) => {
    month.entries = entries.filter(
      (entry) => entry.monthString === month.label
    );
  });

  return months
    .sort((a, b) => a.order - b.order)
    .map((month) =>
      parseMonthlyBalances(
        parseMonthlyEntries(month),
        resolveSplitSetting(budget.splitSettings, monthLabelToKey(month.label)),
        budget.ownerIDs
      )
    );
}

const MONTH_LABEL_PATTERN = /^(?:[1-9]|1[0-2])\/\d{2}$/;
const MAX_MONTHS_PER_REQUEST = 24;
// a vehicle report can cover its whole history
const MAX_VEHICLE_REPORT_MONTHS = 240;
const MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

// validate a split setting; percentage shares must be owners and total 100%
function validateSplitSetting({ effectiveMonth, method, shares = [] }, owners) {
  if (!MONTH_KEY_PATTERN.test(effectiveMonth || "")) {
    throw inputError("Effective month must be YYYY-MM");
  }
  if (!SPLIT_METHODS.includes(method)) {
    throw inputError("Split method must be proportional or percentage");
  }
  if (method === "proportional") {
    return [];
  }

  if (!shares.length) {
    throw inputError("Percentage split needs at least one share");
  }
  const seen = new Set();
  shares.forEach(({ userID, percent }) => {
    assertOwner(owners, userID);
    if (seen.has(String(userID))) {
      throw inputError("Each user can only have one share");
    }
    seen.add(String(userID));
    if (!(percent >= 0 && percent <= 100)) {
      throw inputError("Each share must be between 0% and 100%");
    }
  });
  const total = fixRounding(
    shares.reduce((sum, share) => sum + share.percent, 0),
    4
  );
  if (total !== 100) {
    throw inputError(`Shares must total 100% (currently ${total}%)`);
  }
  return shares.map(({ userID, percent }) => ({
    userID,
    percent: fixRounding(percent, 4),
  }));
}

// month labels from start to end inclusive, oldest first
function monthLabelsBetween(startMonth, endMonth, maxMonths = MAX_MONTHS_PER_REQUEST) {
  [startMonth, endMonth].forEach((label) => {
    if (!MONTH_LABEL_PATTERN.test(label)) {
      throw inputError(`Invalid month: ${label}`);
    }
  });
  const toDate = (label) => {
    const [month, year] = label.split("/").map(Number);
    return new Date(2000 + year, month - 1, 1);
  };
  const start = toDate(startMonth);
  const end = toDate(endMonth);
  if (start > end) {
    throw inputError("Start month must be before end month");
  }
  const labels = eachMonthOfInterval({ start, end }).map(dateToMonthStr);
  if (labels.length > maxMonths) {
    throw inputError(`A report can cover at most ${maxMonths} months`);
  }
  return labels;
}

async function createStatementPdf({ budgetID, userID, startMonth, endMonth }, context) {
  const authUser = requireUser(context);
  const labels = monthLabelsBetween(startMonth, endMonth);
  const { budget, owners } = await loadBudgetForUser(budgetID, authUser, [
    "categories",
    "ownerIDs",
  ]);
  assertOwner(owners, userID);

  const months = await populateMonths(
    budget,
    labels.map((label, i) => createMonthObj(label, i))
  );
  const statement = buildStatement({ budget, months, userID });
  const pdf = await renderPdf(
    statementDocument(statement, {
      footer: `${budget.title} · ${statement.user.email}`,
    })
  );

  const slug = (label) => label.replace("/", "-");
  const initials = statement.user.userInitials || "statement";
  return {
    blob: Buffer.from(pdf).toString("base64"),
    filename: `${initials}_${slug(startMonth)}${startMonth === endMonth ? "" : `_to_${slug(endMonth)}`}.pdf`,
  };
}

async function createVehicleReportPdf({ budgetID, vehicleID, startMonth, endMonth }, context) {
  const authUser = requireUser(context);
  const labels = monthLabelsBetween(startMonth, endMonth, MAX_VEHICLE_REPORT_MONTHS);
  const { budget } = await loadBudgetForUser(budgetID, authUser);
  const vehicle = await loadVehicle(budget, vehicleID);
  const log = await buildVehicleLog(budget, vehicle);
  log.tires = await presentTires(log.vehicle);

  const pdf = await renderPdf(
    vehicleReportDocument(log, {
      months: labels,
      footer: `${budget.title} · ${log.vehicle.name}`,
    })
  );
  const slug = (label) => label.replace("/", "-");
  const name = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join("-");
  return {
    blob: Buffer.from(pdf).toString("base64"),
    filename: `${name}_${slug(startMonth)}${startMonth === endMonth ? "" : `_to_${slug(endMonth)}`}.pdf`,
  };
}

// fall back to createdAt for entries saved before effectiveDate existed
const effectiveDateResolver = (entry) => entry.effectiveDate ?? entry.createdAt;

const resolvers = {
  Date: dateScalar,

  Entry: {
    effectiveDate: effectiveDateResolver,
    tireChange: async (entry) => {
      if (!entry.maintenance?.vehicleID) {
        return null;
      }
      const vehicle = await Vehicle.findOne(
        { _id: entry.maintenance.vehicleID, "tireChanges.entryID": entry._id },
        { tireChanges: 1 }
      );
      const change = vehicle?.tireChanges.find((c) => c.entryID?.equals(entry._id));
      return change ? { tireID: change.tireID, retireTireIDs: change.retired } : null;
    },
  },

  ReportEntry: {
    effectiveDate: effectiveDateResolver,
  },

  Budget: {
    vehicles: async (budget) => {
      const vehicles = await Vehicle.find({ budgetID: budget._id }).sort({ createdAt: 1 });
      if (!vehicles.length) {
        return [];
      }
      const totals = await vehicleTotals(budget._id);
      return vehicles.map((vehicle) => presentVehicle(vehicle, totals));
    },
    splitSettings: (budget) =>
      [...(budget.splitSettings || [])].sort((a, b) =>
        a.effectiveMonth < b.effectiveMonth ? -1 : 1
      ),
  },

  Vehicle: {
    tires: presentTires,
    tireStints: (vehicle) =>
      tireStints(vehicle.tireChanges, vehicle.odometer).map((stint) => ({
        ...stint,
        changeID: stint.change._id,
      })),
  },



  SplitShare: {
    userID: (share) => String(share.userID?._id ?? share.userID),
  },

  Query: {
    // kept for older clients: a one-month statement
    requestMonthlyUserReport: (parent, { month, user, budgetID }, context) =>
      createStatementPdf(
        { budgetID, userID: user, startMonth: month, endMonth: month },
        context
      ),

    requestStatement: (parent, args, context) => createStatementPdf(args, context),
    requestVehicleReport: (parent, args, context) => createVehicleReportPdf(args, context),

    requestSingleTransaction: async (
      parent,
      { entryID, budgetID },
      context
    ) => {
      const authUser = requireUser(context);
      await loadBudgetForUser(budgetID, authUser);
      return loadEntryInBudget(entryID, budgetID);
    },

    requestSingleTransfer: async (parent, { entryID, budgetID }, context) => {
      const authUser = requireUser(context);
      await loadBudgetForUser(budgetID, authUser);
      return loadEntryInBudget(entryID, budgetID);
    },

    requestBudgetMonths: async (parent, { budgetID, months }, context) => {
      const authUser = requireUser(context);
      if (months.length > MAX_MONTHS_PER_REQUEST) {
        throw inputError(`Request at most ${MAX_MONTHS_PER_REQUEST} months at a time`);
      }
      months.forEach((label) => {
        if (!MONTH_LABEL_PATTERN.test(label)) {
          throw inputError(`Invalid month: ${label}`);
        }
      });
      const { budget } = await loadBudgetForUser(budgetID, authUser, [
        "ownerIDs",
      ]);

      return populateMonths(
        budget,
        [...new Set(months)].map((label, i) => createMonthObj(label, i))
      );
    },

    vehicleLog: async (parent, { budgetID, vehicleID }, context) => {
      const authUser = requireUser(context);
      const { budget } = await loadBudgetForUser(budgetID, authUser);
      return buildVehicleLog(budget, await loadVehicle(budget, vehicleID));
    },

    requestCustomReport: async (
      parent,
      { budgetID, userID, startDate, endDate },
      context
    ) => {
      const authUser = requireUser(context);
      const { budget, owners } = await loadBudgetForUser(budgetID, authUser, [
        "ownerIDs",
      ]);
      assertOwner(owners, userID);
      assertValidDate(startDate, "start date");
      assertValidDate(endDate, "end date");

      if (isAfter(startOfDay(startDate), startOfDay(endDate))) {
        throw inputError("Start date must be before end date");
      }

      const createdMonths = eachMonthOfInterval({
        start: startDate,
        end: endDate,
      })
        .sort((a, b) => b - a)
        .map((date, i) => createMonthObj(dateToMonthStr(date), i));

      const populatedMonths = await populateMonths(budget, createdMonths);

      let reportTotals = {
        label: "",
        order: 1,
        balance: 0,
        incomeTotal: 0,
        expenseTotal: 0,
        balanceIndividual: 0,
        incomeIndividual: 0,
        expenseIndividual: 0,
        transferTotals: 0,
        sharedBalance: 0,
        sharedIncomeTotal: 0,
        sharedExpenseTotal: 0,
        userData: [],
        entries: [],
        incomeCategories: [],
        expenseCategories: [],
        averageResponsibilityRate: 0,
      };

      const responsibilityRates = [];

      // ADD TOTALS
      populatedMonths.map((month) => {
        // a user with no entries in a month has no share of it
        const monthUser = month.userData.find((user) =>
            user.userID._id.equals(userID)
          ),
          monthResponsibilityRate = monthUser?.percentOfTotalIncome ?? 0;
        responsibilityRates.push(monthResponsibilityRate);

        // MAP PER MONTH VALUES FOR USER
        month.entries.map((entry) => {
          const entryDate = startOfDay(effectiveDateResolver(entry)),
            beforeOrEqualToEndDate =
              isBefore(entryDate, startOfDay(endDate)) ||
              isEqual(entryDate, startOfDay(endDate)),
            afterOrEqualToStartDate =
              isAfter(entryDate, startOfDay(startDate)) ||
              isEqual(entryDate, startOfDay(startDate)),
            isCurrentUserEntry = entry.userID._id.equals(userID);

          if (!beforeOrEqualToEndDate || !afterOrEqualToStartDate) {
            return entry;
          }

          // INCOME / EXPENSE
          if (CATEGORY_TYPES.includes(entry.valueType)) {
            const isIncome = entry.valueType === "income",
              categoriesKey = isIncome ? "incomeCategories" : "expenseCategories",
              totalKey = isIncome ? "incomeTotal" : "expenseTotal",
              individualKey = isIncome ? "incomeIndividual" : "expenseIndividual",
              sharedKey = isIncome ? "sharedIncomeTotal" : "sharedExpenseTotal";

            // IS INDIVIDUAL & NOT CURRENT USER - DO NOT ADD ENTRY
            if (entry.individualEntry && !isCurrentUserEntry) {
              reportTotals[totalKey] = fixRounding(
                reportTotals[totalKey] + entry.value,
                2
              );
              return entry;
            }

            // FIND CATEGORY, IF CATEGORY DOES NOT EXIST, CREATE IT
            let indexOfCategory = reportTotals[categoriesKey].findIndex(
              (category) => category.categoryID?._id.equals(entry.categoryID._id)
            );
            if (indexOfCategory < 0) {
              const createdCategory = copyObject(createMonthlyCategoryObj());
              createdCategory.categoryID = entry.categoryID;
              indexOfCategory = reportTotals[categoriesKey].length;
              reportTotals[categoriesKey][indexOfCategory] = createdCategory;
            }
            const category = reportTotals[categoriesKey][indexOfCategory];

            reportTotals[totalKey] = fixRounding(
              reportTotals[totalKey] + entry.value,
              2
            );

            // individual entries count fully, shared entries by responsibility
            entry.valueIndividual = fixRounding(
              entry.individualEntry
                ? entry.value
                : entry.value * monthResponsibilityRate,
              2
            );
            reportTotals[individualKey] = fixRounding(
              reportTotals[individualKey] + entry.valueIndividual,
              2
            );
            if (!entry.individualEntry) {
              reportTotals[sharedKey] = fixRounding(
                reportTotals[sharedKey] + entry.value,
                2
              );
            }

            category.total = fixRounding(category.total + entry.value, 2);
            category.totalIndividual = fixRounding(
              category.totalIndividual + entry.valueIndividual,
              2
            );

            reportTotals.entries.push(entry);
          }

          // TRANSFERS
          if (entry.valueType === "transfer") {
            const isFromUser = entry.userID._id.equals(userID),
              isToUser = entry.toUserID._id.equals(userID);
            if (isFromUser || isToUser) {
              reportTotals.transferTotals = fixRounding(
                reportTotals.transferTotals + entry.value,
                2
              );
              reportTotals.entries.push(entry);
            }
          }
        });
      });

      // BALANCES
      reportTotals.balance = fixRounding(
        reportTotals.incomeTotal - reportTotals.expenseTotal,
        2
      );
      reportTotals.balanceIndividual = fixRounding(
        reportTotals.incomeIndividual - reportTotals.expenseIndividual,
        2
      );
      reportTotals.sharedBalance = fixRounding(
        reportTotals.sharedIncomeTotal - reportTotals.sharedExpenseTotal,
        2
      );
      reportTotals.averageResponsibilityRate = responsibilityRates.length
        ? responsibilityRates.reduce((a, b) => a + b, 0) /
          responsibilityRates.length
        : 0;

      // SORTING
      reportTotals.entries.sort(
        (a, b) => effectiveDateResolver(a) - effectiveDateResolver(b)
      );
      reportTotals.incomeCategories.sort((a, b) => b.total - a.total);
      reportTotals.expenseCategories.sort((a, b) => b.total - a.total);

      return reportTotals;
    },
  },

  Mutation: {
    // the email comes from a verified Auth0 ID token, never from the client
    login: async (parent, { idToken }) => {
      let identity;
      try {
        identity = await verifyAuth0IdToken(idToken);
      } catch (err) {
        if (!(err instanceof Auth0VerificationError)) {
          throw err;
        }
        console.warn(`Login rejected: ${err.message}`);
        // not UNAUTHENTICATED: the client reloads on that code
        throw new GraphQLError("Sign-in could not be verified", {
          extensions: { code: "LOGIN_FAILED" },
        });
      }
      const { email } = identity;

      // existing accounts may be stored with different letter case
      const user =
        (await User.findOne({ email }).collation({ locale: "en", strength: 2 })) ||
        (await User.create({ email }));

      return { token: signToken({ email: user.email, _id: user._id }) };
    },

    createBudget: async (parent, { input }, context) => {
      const authUser = requireUser(context);

      const ownerIDs = [authUser._id];
      const emails = (input.emails || []).filter(Boolean);
      if (emails.length) {
        const additionalOwners = await User.find({ email: { $in: emails } });
        additionalOwners.forEach((owner) => {
          if (!owner._id.equals(authUser._id)) {
            ownerIDs.push(owner._id);
          }
        });
      }

      return Budget.create({
        ownerIDs,
        title: input.title,
        desc: input.desc,
        splitSettings: [
          { effectiveMonth: dateToMonthKey(new Date()), method: "proportional" },
        ],
      });
    },

    createCategory: async (parent, { input }, context) => {
      const authUser = requireUser(context);
      const { budgetID, title, categoryType } = input;
      await loadBudgetForUser(budgetID, authUser);

      if (!CATEGORY_TYPES.includes(categoryType)) {
        throw inputError("Category type must be income or expense");
      }

      const category = await Category.create({
        budgetID,
        title,
        categoryType,
        metaType: cleanMetaType(input.metaType),
      });

      return Budget.findByIdAndUpdate(
        budgetID,
        { $push: { categories: category._id } },
        { new: true, runValidators: true }
      );
    },

    updateCategory: async (parent, { input }, context) => {
      const authUser = requireUser(context);
      const { categoryID, title } = input;
      assertObjectId(categoryID, "category");

      const category = await Category.findById(categoryID);
      if (!category) {
        throw inputError("No Category Found");
      }
      await loadBudgetForUser(category.budgetID, authUser);

      category.title = title;
      // only change the tracking type when the client sends the field
      if ("metaType" in input) {
        category.metaType = cleanMetaType(input.metaType);
      }
      return category.save();
    },

    createTransaction: async (parent, { input }, context) => {
      const authUser = requireUser(context);
      const { budgetID, categoryID, userID, value, effectiveDate } = input;
      const title = assertDescription(input.title);
      assertValidDate(effectiveDate, "effective date");

      const { budget, owners } = await loadBudgetForUser(budgetID, authUser);
      assertOwner(owners, userID);
      const category = await loadCategoryInBudget(categoryID, budget._id);
      const mileage = await cleanMileage(input.mileage, budget, category);
      const maintenance = await cleanMaintenance(input.maintenance, budget, category);
      assertEntryTireChange(input.tireChange, maintenance);

      const newEntry = await Entry.create({
        title,
        value,
        budgetID: budget._id,
        categoryID: category._id,
        userID,
        effectiveDate,
        monthString: dateToMonthStr(effectiveDate),
        valueType: category.categoryType,
        individualEntry: input.individualEntry || false,
        mileage: mileage || undefined,
        maintenance: maintenance || undefined,
      });

      await Category.updateOne({ _id: category._id }, { $inc: { countUse: 1 } });
      if (input.tireChange) {
        await applyEntryTireChange(budget, newEntry, maintenance, input.tireChange);
      }

      return Budget.findByIdAndUpdate(
        budget._id,
        { $push: { entries: newEntry._id } },
        { new: true }
      );
    },

    editTransaction: async (parent, { input }, context) => {
      const authUser = requireUser(context);
      const { entryID, budgetID, categoryID, userID, value, effectiveDate } =
        input;
      const title = assertDescription(input.title);
      assertValidDate(effectiveDate, "effective date");

      const { budget, owners } = await loadBudgetForUser(budgetID, authUser);
      assertOwner(owners, userID);
      const entry = await loadEntryInBudget(entryID, budget._id);
      if (entry.valueType === "transfer") {
        throw inputError("Use editTransfer for transfers");
      }
      const category = await loadCategoryInBudget(categoryID, budget._id);
      const mileage = await cleanMileage(input.mileage, budget, category);
      const maintenance = await cleanMaintenance(input.maintenance, budget, category);
      assertEntryTireChange(input.tireChange, maintenance);
      const cleared = [!mileage && "mileage", !maintenance && "maintenance"].filter(Boolean);

      // keep category usage counts accurate when an entry is re-categorized
      if (!entry.categoryID?.equals(category._id)) {
        await Category.bulkWrite([
          {
            updateOne: {
              filter: { _id: entry.categoryID },
              update: { $inc: { countUse: -1 } },
            },
          },
          {
            updateOne: {
              filter: { _id: category._id },
              update: { $inc: { countUse: 1 } },
            },
          },
        ]);
      }

      // the tire change follows the entry: replaced, or removed when none is sent
      await applyEntryTireChange(
        budget,
        { _id: entry._id, effectiveDate },
        maintenance,
        input.tireChange
      );

      // createdAt is left untouched; only the effective date moves
      return Entry.findByIdAndUpdate(
        entry._id,
        {
          title,
          value,
          categoryID: category._id,
          valueType: category.categoryType,
          effectiveDate,
          monthString: dateToMonthStr(effectiveDate),
          userID,
          individualEntry: input.individualEntry || false,
          // vehicle details are replaced, or removed when none are sent
          ...(mileage ? { mileage } : {}),
          ...(maintenance ? { maintenance } : {}),
          ...(cleared.length
            ? { $unset: Object.fromEntries(cleared.map((field) => [field, 1])) }
            : {}),
        },
        { new: true, runValidators: true }
      )
        .populate("userID")
        .populate("toUserID");
    },

    createTransfer: async (parent, { input }, context) => {
      const authUser = requireUser(context);
      const { budgetID, userID, toUserID, value, effectiveDate } = input;
      assertValidDate(effectiveDate, "effective date");

      const { budget, owners } = await loadBudgetForUser(budgetID, authUser);
      assertOwner(owners, userID, "From user");
      assertOwner(owners, toUserID, "To user");
      if (String(userID) === String(toUserID)) {
        throw inputError("Cannot transfer to the same user");
      }

      const [user, userTo] = await Promise.all([
        User.findById(userID),
        User.findById(toUserID),
      ]);

      const newEntry = await Entry.create({
        value,
        budgetID: budget._id,
        userID: user._id,
        toUserID: userTo._id,
        effectiveDate,
        monthString: dateToMonthStr(effectiveDate),
        valueType: "transfer",
        title: input.note?.trim() || "",
      });

      return Budget.findByIdAndUpdate(
        budget._id,
        { $push: { entries: newEntry._id } },
        { new: true }
      );
    },

    editTransfer: async (parent, { input }, context) => {
      const authUser = requireUser(context);
      const { entryID, budgetID, userID, toUserID, value, effectiveDate } =
        input;
      assertValidDate(effectiveDate, "effective date");

      const { budget, owners } = await loadBudgetForUser(budgetID, authUser);
      assertOwner(owners, userID, "From user");
      assertOwner(owners, toUserID, "To user");
      if (String(userID) === String(toUserID)) {
        throw inputError("Cannot transfer to the same user");
      }
      const entry = await loadEntryInBudget(entryID, budget._id);
      if (entry.valueType !== "transfer") {
        throw inputError("Entry is not a transfer");
      }

      const [user, userTo] = await Promise.all([
        User.findById(userID),
        User.findById(toUserID),
      ]);

      return Entry.findByIdAndUpdate(
        entry._id,
        {
          value,
          effectiveDate,
          monthString: dateToMonthStr(effectiveDate),
          userID: user._id,
          toUserID: userTo._id,
          title: input.note?.trim() || "",
        },
        { new: true, runValidators: true }
      )
        .populate("userID")
        .populate("toUserID");
    },

    queryBudget: async (parent, { input }, context) => {
      const authUser = requireUser(context);
      const lengthOfInitialQuery = 6;

      const { budget } = await loadBudgetForUser(input.budget, authUser, [
        "categories",
        "ownerIDs",
      ]);

      const createdMonths = new Array(lengthOfInitialQuery)
        .fill()
        .map((_, offset) =>
          createMonthObj(createMonthLabelFromOffset(offset), offset)
        );

      budget.months = await populateMonths(budget, createdMonths);

      return budget;
    },

    queryUserBudgets: async (parent, args, context) => {
      const authUser = requireUser(context);
      return Budget.find({ ownerIDs: authUser._id });
    },

    deleteEntry: async (parent, { budgetID, entryID }, context) => {
      const authUser = requireUser(context);
      const { budget } = await loadBudgetForUser(budgetID, authUser);
      const entry = await loadEntryInBudget(entryID, budget._id);

      await Entry.deleteOne({ _id: entry._id });
      await Budget.updateOne({ _id: budget._id }, { $pull: { entries: entry._id } });
      if (entry.maintenance) {
        await removeEntryTireChange(budget._id, entry._id);
      }
      if (entry.categoryID) {
        await Category.updateOne(
          { _id: entry.categoryID, countUse: { $gt: 0 } },
          { $inc: { countUse: -1 } }
        );
      }

      return entry._id;
    },

    saveVehicle: async (parent, { input }, context) => {
      const authUser = requireUser(context);
      const { budget } = await loadBudgetForUser(input.budgetID, authUser);

      const fields = {
        make: String(input.make || "").trim(),
        model: String(input.model || "").trim(),
        year: input.year ?? undefined,
        plate: String(input.plate || "").trim(),
        color: String(input.color || "").trim(),
      };
      if (!fields.make || !fields.model) {
        throw inputError("Make and model are required");
      }
      if (fields.year !== undefined && !(fields.year >= 1900 && fields.year <= 2100)) {
        throw inputError("Year must be between 1900 and 2100");
      }

      if (input.vehicleID) {
        const vehicle = await loadVehicle(budget, input.vehicleID);
        vehicle.set(fields);
        await vehicle.save();
      } else {
        await Vehicle.create({ ...fields, budgetID: budget._id });
      }
      return budget;
    },

    deleteVehicle: async (parent, { budgetID, vehicleID }, context) => {
      const authUser = requireUser(context);
      const { budget } = await loadBudgetForUser(budgetID, authUser);
      const vehicle = await loadVehicle(budget, vehicleID);

      const records = await Entry.countDocuments({
        budgetID: budget._id,
        $or: [
          { "mileage.vehicleID": vehicle._id },
          { "maintenance.vehicleID": vehicle._id },
        ],
      });
      if (records > 0) {
        throw inputError(
          `${vehicleName(vehicle)} has ${records} record${records === 1 ? "" : "s"} logged and can't be deleted`
        );
      }
      await Tire.deleteMany({ vehicleID: vehicle._id });
      await vehicle.deleteOne();
      return budget;
    },

    setDefaultVehicle: async (parent, { budgetID, vehicleID }, context) => {
      const authUser = requireUser(context);
      const { budget } = await loadBudgetForUser(budgetID, authUser);
      const chosen = vehicleID ? await loadVehicle(budget, vehicleID) : null;

      // one default per person
      await Vehicle.updateMany({ budgetID: budget._id }, { $pull: { defaultFor: authUser._id } });
      if (chosen) {
        await Vehicle.updateOne({ _id: chosen._id }, { $addToSet: { defaultFor: authUser._id } });
      }
      return budget;
    },

    setVehicleOdometer: async (parent, { budgetID, vehicleID, odometer }, context) => {
      const authUser = requireUser(context);
      const { budget } = await loadBudgetForUser(budgetID, authUser);
      const vehicle = await loadVehicle(budget, vehicleID);
      if (!(Number.isFinite(odometer) && odometer >= 0)) {
        throw inputError("Odometer must be zero or more");
      }

      // keep logged distances; shift the starting point so the total matches
      const totals = await vehicleTotals(budget._id);
      const logged = totals.get(String(vehicle._id))?.totalDistance || 0;
      const offset = fixRounding(odometer - logged, 1);
      const shift = fixRounding(offset - (vehicle.odometerOffset || 0), 1);
      vehicle.odometerOffset = offset;

      // maintenance readings and tire changes are on the same scale as the
      // fill-ups, so they move by the same amount; moving them isn't an
      // edit of the entries
      vehicle.tireChanges.forEach((change) => {
        change.odometer = Math.max(0, fixRounding(change.odometer + shift, 1));
      });
      if (shift) {
        await Entry.updateMany(
          {
            budgetID: budget._id,
            "maintenance.vehicleID": vehicle._id,
            "maintenance.odometer": { $type: "number" },
          },
          [
            {
              $set: {
                "maintenance.odometer": {
                  $max: [0, { $round: [{ $add: ["$maintenance.odometer", shift] }, 1] }],
                },
              },
            },
          ],
          { timestamps: false }
        );
      }
      await vehicle.save();
      return budget;
    },

    saveTire: async (parent, { budgetID, input }, context) => {
      const authUser = requireUser(context);
      const { budget } = await loadBudgetForUser(budgetID, authUser);
      const vehicle = await loadVehicle(budget, input.vehicleID);
      const fields = cleanTireFields(input);
      if (input.retired !== null && input.retired !== undefined) {
        fields.retired = Boolean(input.retired);
      }
      if (input.tireID) {
        const tire = await loadTire(vehicle, input.tireID);
        tire.set(fields);
        await tire.save();
      } else {
        await Tire.create({ ...fields, vehicleID: vehicle._id });
      }
      return budget;
    },

    deleteTire: async (parent, { budgetID, tireID }, context) => {
      const authUser = requireUser(context);
      const { budget } = await loadBudgetForUser(budgetID, authUser);
      assertObjectId(tireID, "tire");
      const tire = await Tire.findById(tireID);
      const vehicle = tire && (await loadVehicle(budget, tire.vehicleID));
      if (!tire || !vehicle) {
        throw inputError("Those tires aren't in this budget");
      }
      if (vehicle.tireChanges.some((c) => c.tireID.equals(tire._id))) {
        throw inputError(`${tire.brand} has been on the car; retire it instead of deleting it`);
      }
      await tire.deleteOne();
      return budget;
    },

    addTireChange: async (parent, { input }, context) => {
      const authUser = requireUser(context);
      const { budget } = await loadBudgetForUser(input.budgetID, authUser);
      assertValidDate(input.date, "date");
      const vehicle = await loadVehicle(budget, input.vehicleID);
      await addChange(vehicle, input);
      await vehicle.save();
      return budget;
    },

    deleteTireChange: async (parent, { budgetID, vehicleID, changeID }, context) => {
      const authUser = requireUser(context);
      const { budget } = await loadBudgetForUser(budgetID, authUser);
      const vehicle = await loadVehicle(budget, vehicleID);
      const change = vehicle.tireChanges.id(changeID);
      if (!change) {
        throw inputError("That tire change isn't on this vehicle");
      }
      await removeChange(vehicle, change);
      await vehicle.save();
      return budget;
    },

    // add a split setting, or replace the one starting the same month
    saveSplitSetting: async (parent, { input }, context) => {
      const authUser = requireUser(context);
      const { budget, owners } = await loadBudgetForUser(input.budgetID, authUser);

      const shares = validateSplitSetting(input, owners);
      const setting = {
        effectiveMonth: input.effectiveMonth,
        method: input.method,
        shares,
      };

      // a setting applies from its month onward, so it replaces any setting
      // starting in the same month or later
      budget.splitSettings = [
        ...budget.splitSettings.filter(
          (s) => s.effectiveMonth < input.effectiveMonth
        ),
        setting,
      ];
      return budget.save();
    },

    deleteSplitSetting: async (parent, { budgetID, settingID }, context) => {
      const authUser = requireUser(context);
      const { budget } = await loadBudgetForUser(budgetID, authUser);

      const setting = budget.splitSettings.id(settingID);
      if (!setting) {
        throw inputError("No Split Setting Found");
      }
      if (budget.splitSettings.length === 1) {
        throw inputError("A budget needs at least one split setting");
      }
      setting.deleteOne();
      return budget.save();
    },

    queryCategory: async (parent, { input }, context) => {
      const authUser = requireUser(context);
      assertObjectId(input._id, "category");

      const category = await Category.findById(input._id);
      if (!category) {
        throw inputError("No Category Found");
      }
      await loadBudgetForUser(category.budgetID, authUser);

      return category;
    },
  },
};

module.exports = resolvers;
