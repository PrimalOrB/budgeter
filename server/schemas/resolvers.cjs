const { User, Budget, Category, Entry } = require("../models/index.cjs");
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
const statementTemplate = require("../templates/statement.cjs");
const {
  eachMonthOfInterval,
  isBefore,
  isAfter,
  isEqual,
  startOfDay,
} = require("date-fns");

const CATEGORY_TYPES = ["income", "expense"];

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
function monthLabelsBetween(startMonth, endMonth) {
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
  if (labels.length > MAX_MONTHS_PER_REQUEST) {
    throw inputError(`A statement can cover at most ${MAX_MONTHS_PER_REQUEST} months`);
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
  const pdf = await renderPdf(statementTemplate(statement), {
    footer: `${budget.title} · ${statement.user.email}`,
  });

  const slug = (label) => label.replace("/", "-");
  const initials = statement.user.userInitials || "statement";
  return {
    blob: Buffer.from(pdf).toString("base64"),
    filename: `${initials}_${slug(startMonth)}${startMonth === endMonth ? "" : `_to_${slug(endMonth)}`}.pdf`,
  };
}

// fall back to createdAt for entries saved before effectiveDate existed
const effectiveDateResolver = (entry) => entry.effectiveDate ?? entry.createdAt;

const resolvers = {
  Date: dateScalar,

  Entry: {
    effectiveDate: effectiveDateResolver,
  },

  ReportEntry: {
    effectiveDate: effectiveDateResolver,
  },

  Budget: {
    splitSettings: (budget) =>
      [...(budget.splitSettings || [])].sort((a, b) =>
        a.effectiveMonth < b.effectiveMonth ? -1 : 1
      ),
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

      const category = await Category.create({ budgetID, title, categoryType });

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
      });

      await Category.updateOne({ _id: category._id }, { $inc: { countUse: 1 } });

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
      if (entry.categoryID) {
        await Category.updateOne(
          { _id: entry.categoryID, countUse: { $gt: 0 } },
          { $inc: { countUse: -1 } }
        );
      }

      return entry._id;
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
