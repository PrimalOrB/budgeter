// Backfill fuel details from a CSV of fill-ups onto existing fuel entries.
//
//   node seeders/seed-fuel.cjs [--apply] [--csv ../fuel_seed.csv]
//     [--email primalorb@gmail.com] [--category Fuel]
//     [--days 1] [--tolerance 0.03] [--tz America/Toronto]
//
// CSV columns: date, $/litre, # litres, # km. Each row is matched to one of
// the person's entries in the category whose date is within --days and whose
// amount is within --tolerance of price x litres. Matched entries get the
// fuel details (their amount is left as charged) and are linked to the
// person's default vehicle, a blue 2017 Subaru WRX, created if needed.
//
// Without --apply nothing is written: the report shows what would change.
// Safe to re-run: matches are recomputed and the same details re-applied.
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const db = require("../config/connection.cjs");
const { User, Budget, Category, Entry } = require("../models/index.cjs");

const VEHICLE = { make: "Subaru", model: "WRX", year: 2017, color: "Blue" };
const DAY = 24 * 60 * 60 * 1000;

function parseArgs(argv) {
  const args = {
    apply: false,
    csv: path.join(__dirname, "../../fuel_seed.csv"),
    email: "primalorb@gmail.com",
    category: "Fuel",
    days: 1,
    tolerance: 0.03,
    tz: "America/Toronto",
  };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i].replace(/^--/, "");
    if (flag === "apply") {
      args.apply = true;
    } else if (flag in args) {
      args[flag] = typeof args[flag] === "number" ? Number(argv[++i]) : argv[++i];
    } else {
      throw new Error(`Unknown option --${flag}`);
    }
  }
  return args;
}

// a calendar day as a comparable number, so "within 1 day" means dates
const dayNumber = (year, month, day) => Date.UTC(year, month - 1, day) / DAY;

// the calendar day a stored timestamp falls on in the given timezone
function dayInZone(date, tz) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  return dayNumber(get("year"), get("month"), get("day"));
}

// rows with obvious data-entry slips are corrected and the fix recorded
function parseCsv(file) {
  const [, ...lines] = fs.readFileSync(file, "utf8").trim().split(/\r?\n/);
  return lines
    .map((line, i) => {
      const [stamp, price, litres, km] = line.split(",").map((s) => s.trim());
      const [datePart] = stamp.split(" ");
      const [month, day, year] = datePart.split("/").map(Number);
      const row = {
        line: i + 2,
        stamp,
        day: dayNumber(year, month, day),
        date: new Date(Date.UTC(year, month - 1, day, 12)),
        pricePerLitre: Number(price),
        litres: Number(litres),
        distance: km === "" || km === undefined ? undefined : Number(km),
        fixes: [],
      };
      if (row.pricePerLitre >= 20) {
        row.pricePerLitre = Math.round(row.pricePerLitre * 10) / 1000;
        row.fixes.push(`price ${price} read as cents -> ${row.pricePerLitre}`);
      }
      if (row.litres > 100 && row.distance !== undefined && row.distance < 100) {
        [row.litres, row.distance] = [row.distance, row.litres];
        row.fixes.push(`litres/km swapped -> ${row.litres} L, ${row.distance} km`);
      }
      if (row.distance === undefined) {
        row.fixes.push("no km recorded");
      }
      row.total = row.pricePerLitre * row.litres;
      return row;
    })
    .filter((row) => Number.isFinite(row.total) && row.total > 0);
}

// pair rows with entries, closest amounts first, each used at most once
function match(rows, entries, { days, tolerance, tz }) {
  const pairs = [];
  rows.forEach((row) => {
    entries.forEach((entry) => {
      const dayGap = Math.abs(dayInZone(entry.effectiveDate, tz) - row.day);
      const amountGap = Math.abs(entry.value - row.total) / row.total;
      if (dayGap <= days && amountGap <= tolerance) {
        pairs.push({ row, entry, dayGap, amountGap });
      }
    });
  });
  pairs.sort((a, b) => a.amountGap - b.amountGap || a.dayGap - b.dayGap);

  const usedRows = new Set();
  const usedEntries = new Set();
  const matches = [];
  pairs.forEach((pair) => {
    const id = String(pair.entry._id);
    if (!usedRows.has(pair.row) && !usedEntries.has(id)) {
      usedRows.add(pair.row);
      usedEntries.add(id);
      matches.push(pair);
    }
  });
  return { matches, usedRows, usedEntries };
}

const money = (n) => `$${n.toFixed(2)}`;

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const rows = parseCsv(args.csv);

  const user = await User.findOne({ email: args.email });
  if (!user) {
    throw new Error(`No user ${args.email}`);
  }
  const budgets = await Budget.find({ ownerIDs: user._id });
  const categories = await Category.find({
    budgetID: { $in: budgets.map((b) => b._id) },
    title: args.category,
  });
  if (categories.length !== 1) {
    throw new Error(
      `Expected one "${args.category}" category across ${args.email}'s budgets, found ${categories.length}`
    );
  }
  const category = categories[0];
  const budget = budgets.find((b) => b._id.equals(category.budgetID));

  const entries = await Entry.find({ categoryID: category._id, userID: user._id });
  const { matches, usedRows, usedEntries } = match(rows, entries, args);

  const firstEntryDay = Math.min(...entries.map((e) => dayInZone(e.effectiveDate, args.tz)));
  const unmatched = rows.filter((row) => !usedRows.has(row));
  const beforeBudget = unmatched.filter((row) => row.day < firstEntryDay - args.days);
  const noMatch = unmatched.filter((row) => row.day >= firstEntryDay - args.days);
  const gaps = matches.map((m) => m.amountGap).sort((a, b) => a - b);

  console.log(`${args.apply ? "APPLYING" : "DRY RUN (pass --apply to write)"}`);
  console.log(`Budget "${budget.title}", category "${category.title}", ${args.email}`);
  console.log(`CSV rows: ${rows.length}`);
  console.log(`  matched:                 ${matches.length}`);
  console.log(`  before the first entry:  ${beforeBudget.length}`);
  console.log(`  no matching entry:       ${noMatch.length}`);
  console.log(`Entries in category: ${entries.length}, without a CSV match: ${entries.length - usedEntries.size}`);
  if (gaps.length) {
    console.log(
      `Amount difference on matches: median ${(gaps[gaps.length >> 1] * 100).toFixed(2)}%, max ${(gaps[gaps.length - 1] * 100).toFixed(2)}%`
    );
  }

  const corrected = rows.filter((row) => row.fixes.length);
  if (corrected.length) {
    console.log("\nCorrected rows:");
    corrected.forEach((row) =>
      console.log(`  line ${row.line} ${row.stamp}: ${row.fixes.join("; ")}${usedRows.has(row) ? "" : " (unmatched)"}`)
    );
  }
  if (noMatch.length) {
    console.log("\nRows with no matching entry:");
    noMatch.forEach((row) => {
      const nearest = entries
        .map((e) => ({ e, gap: Math.abs(dayInZone(e.effectiveDate, args.tz) - row.day) }))
        .sort((a, b) => a.gap - b.gap)[0];
      console.log(
        `  line ${row.line} ${row.stamp}: ${money(row.total)} | nearest entry ${nearest.e.effectiveDate.toISOString().slice(0, 10)} ${money(nearest.e.value)} "${nearest.e.title}"${usedEntries.has(String(nearest.e._id)) ? " (already matched)" : ""}`
      );
    });
  }

  if (!args.apply) {
    return;
  }

  // the category tracks mileage
  if (category.metaType !== "mileage") {
    category.metaType = "mileage";
    await category.save();
  }

  // the vehicle, and it is the person's default
  let vehicle = budget.vehicles.find(
    (v) => v.make === VEHICLE.make && v.model === VEHICLE.model && v.year === VEHICLE.year
  );
  if (!vehicle) {
    budget.vehicles.push(VEHICLE);
    vehicle = budget.vehicles[budget.vehicles.length - 1];
  }
  budget.vehicles.forEach((v) => v.defaultFor.pull(user._id));
  vehicle.defaultFor.push(user._id);
  await budget.save();

  const result = await Entry.bulkWrite(
    matches.map(({ row, entry }) => ({
      updateOne: {
        filter: { _id: entry._id },
        update: {
          $set: {
            mileage: {
              vehicleID: vehicle._id,
              pricePerLitre: row.pricePerLitre,
              litres: row.litres,
              ...(row.distance !== undefined ? { distance: row.distance } : {}),
            },
          },
        },
        // backfilled details are not an edit of the entry
        timestamps: false,
      },
    }))
  );
  console.log(
    `\nUpdated ${result.modifiedCount} entries (${matches.length} matched) on ${VEHICLE.color} ${VEHICLE.year} ${VEHICLE.make} ${VEHICLE.model}, now ${args.email}'s default vehicle.`
  );
}

db.once("open", () =>
  run()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err.message);
      process.exit(1);
    })
);
