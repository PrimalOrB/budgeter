import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  monthLabelToDate,
  shiftMonthLabel,
  compareMonthLabels,
  monthWindow,
  mergeMonths,
  toEffectiveDate,
  dateInputToEffectiveDate,
  toCurrency,
  fixRounding,
  isEmail,
  shortenedString,
  titleCaseString,
  sumPropArray,
  parseBudgetData,
} from "../src/utils/helpers.js";

describe("month labels", () => {
  test("parse M/yy into the first of the month", () => {
    const date = monthLabelToDate("5/26");
    assert.equal(date.getFullYear(), 2026);
    assert.equal(date.getMonth(), 4);
    assert.equal(date.getDate(), 1);
  });
  test("shift across year boundaries", () => {
    assert.equal(shiftMonthLabel("12/25", 1), "1/26");
    assert.equal(shiftMonthLabel("1/26", -1), "12/25");
    assert.equal(shiftMonthLabel("3/26", -15), "12/24");
  });
  test("compare chronologically, not as strings", () => {
    assert.ok(compareMonthLabels("10/25", "9/25") > 0);
    assert.ok(compareMonthLabels("12/25", "1/26") < 0);
    assert.equal(compareMonthLabels("4/26", "4/26"), 0);
  });
  test("monthWindow lists months oldest first, ending at the label", () => {
    assert.deepEqual(monthWindow("2/26", 4), ["11/25", "12/25", "1/26", "2/26"]);
  });
});

describe("mergeMonths", () => {
  test("replaces months by label and keeps the rest", () => {
    const merged = mergeMonths(
      [{ label: "1/26", v: 1 }, { label: "2/26", v: 1 }],
      [{ label: "2/26", v: 2 }, { label: "3/26", v: 2 }]
    );
    assert.deepEqual(merged, [
      { label: "1/26", v: 1 },
      { label: "2/26", v: 2 },
      { label: "3/26", v: 2 },
    ]);
  });
  test("handles missing inputs", () => {
    assert.deepEqual(mergeMonths(undefined, [{ label: "1/26" }]), [{ label: "1/26" }]);
    assert.deepEqual(mergeMonths(), []);
  });
});

describe("effective dates", () => {
  test("are stored at 12:00 UTC on the chosen day", () => {
    assert.equal(
      dateInputToEffectiveDate("2026-03-09").toISOString(),
      "2026-03-09T12:00:00.000Z"
    );
    assert.equal(
      toEffectiveDate(new Date(2026, 2, 9, 23, 30)).toISOString(),
      "2026-03-09T12:00:00.000Z"
    );
  });
});

describe("formatting", () => {
  test("toCurrency", () => {
    assert.equal(toCurrency(1234.5), "$1,234.50");
    assert.equal(toCurrency(-0.004), "$0.00");
    assert.equal(toCurrency(-3), "-$3.00");
    assert.equal(toCurrency(undefined), "$0.00");
  });
  test("fixRounding", () => {
    assert.equal(fixRounding(0.1 + 0.2, 2), 0.3);
  });
  test("titleCaseString keeps all-caps words as they are", () => {
    assert.equal(titleCaseString("gas station"), "Gas Station");
    assert.equal(titleCaseString("ATM"), "ATM");
  });
  test("shortenedString", () => {
    assert.equal(shortenedString("short", 10), "short");
    assert.equal(shortenedString("a long description", 6), "a long...");
  });
  test("isEmail", () => {
    assert.ok(isEmail("someone@example.com"));
    assert.ok(!isEmail("someone@example"));
  });
  test("sumPropArray treats missing values as zero", () => {
    assert.equal(sumPropArray([{ v: 2 }, {}, { v: 3 }], "v"), 5);
  });
});

describe("parseBudgetData", () => {
  test("buckets entries into months, oldest first", () => {
    const months = parseBudgetData({
      date: new Date(2026, 2, 15),
      duration: 3,
      budget: {
        entries: [
          { effectiveDate: new Date(2026, 2, 2), valueType: "income", value: 100 },
          { effectiveDate: new Date(2026, 2, 5), valueType: "expense", value: 40 },
          { effectiveDate: new Date(2026, 0, 20), valueType: "transfer", value: 10 },
          { effectiveDate: new Date(2025, 0, 1), valueType: "expense", value: 999 },
        ],
      },
    });
    assert.deepEqual(
      months.map((m) => [m.label, m.incomeTotal, m.expenseTotal, m.transferTotal]),
      [
        ["1/26", 0, 0, 10],
        ["2/26", 0, 0, 0],
        ["3/26", 100, 40, 0],
      ]
    );
  });
});
