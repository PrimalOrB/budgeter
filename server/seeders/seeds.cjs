const faker = require("faker");
const db = require("../config/connection.cjs");
const { Entry } = require("../models/index.cjs");
const { dateToMonthStr } = require("../utils/helpers.cjs");

db.once("open", async () => {
  const allEntries = await Entry.find();

  console.log("found " + allEntries.length + ' entries');

  console.log("Adding Month String To Entries:");
  const addMonthStr = allEntries.map(async (entry, i) => {

    const dateStr = dateToMonthStr(entry.createdAt);
    console.log("- set " + i + ": " + dateStr);

    entry.monthString = dateStr;

    await Entry.findOneAndUpdate(
      { _id: entry._id },
      { ...entry },
      { new: true, runValidators: true }
    );
  });

  await Promise.all(addMonthStr);

  console.log("all done!");
  process.exit(0);
});
