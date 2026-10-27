// Data migrations. Safe to re-run: each step only touches records that
// haven't been migrated yet.
//
// 1. Split Entry.createdAt into createdAt + effectiveDate. Before this change,
//    createdAt held the user-chosen transaction date. That value becomes
//    effectiveDate, and createdAt is reset to the real creation time,
//    recovered from the ObjectId timestamp.
// 2. Give every budget an initial split setting matching the original
//    behaviour (proportional to shared income), starting from its first month.
// 3. Clear auto-generated transfer titles ("Transfer from AO to EL"); the
//    title is now an optional note and the direction is shown with avatars.
require("dotenv").config();
const db = require("../config/connection.cjs");
const { Entry, Budget } = require("../models/index.cjs");
const { dateToMonthKey } = require("../utils/helpers.cjs");

async function migrateEffectiveDates() {
  const filter = { effectiveDate: { $exists: false } };
  const pending = await Entry.collection.countDocuments(filter);
  console.log(`${pending} entries need an effectiveDate`);

  if (pending > 0) {
    const result = await Entry.collection.updateMany(filter, [
      {
        $set: {
          effectiveDate: { $ifNull: ["$createdAt", { $toDate: "$_id" }] },
          createdAt: { $toDate: "$_id" },
          updatedAt: { $toDate: "$_id" },
        },
      },
    ]);
    console.log(`migrated ${result.modifiedCount} entries`);
  }

  await Entry.syncIndexes();
}

async function migrateSplitSettings() {
  const budgets = await Budget.find({
    $or: [{ splitSettings: { $exists: false } }, { splitSettings: { $size: 0 } }],
  });
  console.log(`${budgets.length} budgets need an initial split setting`);

  for (const budget of budgets) {
    const [firstEntry] = await Entry.find({ budgetID: budget._id })
      .sort({ effectiveDate: 1 })
      .limit(1);
    const start = firstEntry?.effectiveDate || budget.createdAt || new Date();

    budget.splitSettings = [
      { effectiveMonth: dateToMonthKey(start), method: "proportional" },
    ];
    await budget.save();
    console.log(`- ${budget.title}: proportional from ${dateToMonthKey(start)}`);
  }
}

async function migrateTransferTitles() {
  const result = await Entry.collection.updateMany(
    { valueType: "transfer", title: { $regex: /^Transfer from .+ to .+$/ } },
    { $set: { title: "" } }
  );
  console.log(`cleared ${result.modifiedCount} auto-generated transfer titles`);
}

db.once("open", async () => {
  await migrateEffectiveDates();
  await migrateSplitSettings();
  await migrateTransferTitles();
  console.log("all done!");
  process.exit(0);
});
