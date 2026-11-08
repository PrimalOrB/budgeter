const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const {
  toCurrency,
  fixRounding,
  monthLabelToKey,
  resolveSplitSetting,
  createMonthObj,
  parseMonthlyEntries,
  parseMonthlyBalances,
} = require("../utils/helpers.cjs");

// stands in for a mongoose ObjectId (loading mongoose takes seconds)
let lastId = 0;
class FakeId {
  constructor() {
    this.id = String(++lastId);
  }
  equals(other) {
    return String(other) === this.id;
  }
  toString() {
    return this.id;
  }
}
const user = () => ({ _id: new FakeId() });
const category = () => ({ _id: new FakeId() });

const entry = (fields) => ({
  individualEntry: false,
  categoryID: fields.categoryID || category(),
  ...fields,
});

const month = (entries) => ({ ...createMonthObj("5/26"), entries });
const findUser = (data, u) =>
  data.userData.find((x) => x.userID._id.equals(u._id));

describe("toCurrency", () => {
  test("formats with commas and two decimals", () => {
    assert.equal(toCurrency(1234567.891), "$1,234,567.89");
    assert.equal(toCurrency(5), "$5.00");
  });
  test("negatives, and no negative zero", () => {
    assert.equal(toCurrency(-12.5), "-$12.50");
    assert.equal(toCurrency(-0.001), "$0.00");
  });
  test("non-numbers fall back to zero", () => {
    assert.equal(toCurrency("abc"), "$0.00");
  });
});

describe("fixRounding", () => {
  test("removes floating point noise", () => {
    assert.equal(fixRounding(0.1 + 0.2, 2), 0.3);
    assert.equal(fixRounding(-0.001, 2), 0);
  });
});

describe("monthLabelToKey", () => {
  test("converts M/yy to yyyy-MM", () => {
    assert.equal(monthLabelToKey("5/26"), "2026-05");
    assert.equal(monthLabelToKey("12/09"), "2009-12");
  });
});

describe("resolveSplitSetting", () => {
  const settings = [
    { effectiveMonth: "2026-03", method: "percentage", shares: [] },
    { effectiveMonth: "2025-01", method: "proportional", shares: [] },
  ];
  test("picks the latest setting on or before the month", () => {
    assert.equal(resolveSplitSetting(settings, "2026-02").effectiveMonth, "2025-01");
    assert.equal(resolveSplitSetting(settings, "2026-03").effectiveMonth, "2026-03");
    assert.equal(resolveSplitSetting(settings, "2027-01").effectiveMonth, "2026-03");
  });
  test("months before the first setting use the first setting", () => {
    assert.equal(resolveSplitSetting(settings, "2020-01").effectiveMonth, "2025-01");
  });
  test("no settings gives the proportional default", () => {
    assert.equal(resolveSplitSetting([], "2026-01").method, "proportional");
    assert.equal(resolveSplitSetting(undefined, "2026-01").method, "proportional");
  });
});

describe("parseMonthlyEntries", () => {
  test("totals income, expenses and categories per user", () => {
    const a = user();
    const b = user();
    const groceries = category();
    const data = parseMonthlyEntries(
      month([
        entry({ userID: a, valueType: "income", value: 3000 }),
        entry({ userID: b, valueType: "income", value: 1000 }),
        entry({ userID: a, valueType: "expense", value: 100.1, categoryID: groceries }),
        entry({ userID: b, valueType: "expense", value: 50.2, categoryID: groceries }),
        entry({ userID: b, valueType: "expense", value: 20, individualEntry: true }),
      ])
    );
    assert.equal(data.incomeTotal, 4000);
    assert.equal(data.expenseTotal, 170.3);
    assert.equal(data.sharedExpenseTotal, 150.3);
    assert.equal(data.expenseCategories.length, 2);
    const groceryTotal = data.expenseCategories.find((c) =>
      c.categoryID._id.equals(groceries._id)
    ).total;
    assert.equal(fixRounding(groceryTotal, 2), 150.3);
    assert.equal(findUser(data, b).individualExpenseTotal, 20);
    assert.equal(findUser(data, b).sharedExpenseTotal, 50.2);
  });

  test("transfers move balance from sender to receiver", () => {
    const a = user();
    const b = user();
    const data = parseMonthlyEntries(
      month([entry({ userID: a, toUserID: b, valueType: "transfer", value: 75 })])
    );
    assert.equal(data.transferTotals, 75);
    assert.equal(findUser(data, a).balanceOfTransfer, -75);
    assert.equal(findUser(data, b).balanceOfTransfer, 75);
  });
});

describe("parseMonthlyBalances", () => {
  test("proportional split follows shared income", () => {
    const a = user();
    const b = user();
    const data = parseMonthlyBalances(
      parseMonthlyEntries(
        month([
          entry({ userID: a, valueType: "income", value: 3000 }),
          entry({ userID: b, valueType: "income", value: 1000 }),
          entry({ userID: a, valueType: "expense", value: 400 }),
        ])
      )
    );
    const ua = findUser(data, a);
    const ub = findUser(data, b);
    assert.equal(ua.percentOfTotalIncome, 0.75);
    assert.equal(ua.responsibilityTotal, 300);
    assert.equal(ub.responsibilityTotal, 100);
    // a paid 400 but is responsible for 300, so b owes a 100
    assert.equal(ua.responsibilityBalance, -100);
    assert.equal(ub.responsibilityBalance, 100);
  });

  test("a transfer settles what is owed", () => {
    const a = user();
    const b = user();
    const data = parseMonthlyBalances(
      parseMonthlyEntries(
        month([
          entry({ userID: a, valueType: "income", value: 1000 }),
          entry({ userID: b, valueType: "income", value: 1000 }),
          entry({ userID: a, valueType: "expense", value: 200 }),
          entry({ userID: b, toUserID: a, valueType: "transfer", value: 100 }),
        ])
      )
    );
    assert.equal(findUser(data, a).responsibilityBalance, 0);
    assert.equal(findUser(data, b).responsibilityBalance, 0);
  });

  test("no shared income gives zero responsibility, not NaN", () => {
    const a = user();
    const data = parseMonthlyBalances(
      parseMonthlyEntries(month([entry({ userID: a, valueType: "expense", value: 10 })]))
    );
    assert.equal(findUser(data, a).percentOfTotalIncome, 0);
    assert.equal(findUser(data, a).responsibilityTotal, 0);
  });

  test("percentage split adds owners with no entries that month", () => {
    const a = user();
    const b = user();
    const setting = {
      method: "percentage",
      shares: [
        { userID: a._id, percent: 60 },
        { userID: b._id, percent: 40 },
      ],
    };
    const data = parseMonthlyBalances(
      parseMonthlyEntries(month([entry({ userID: a, valueType: "expense", value: 500 })])),
      setting,
      [a, b]
    );
    assert.equal(data.splitMethod, "percentage");
    assert.equal(data.userData.length, 2);
    assert.equal(findUser(data, a).responsibilityTotal, 300);
    assert.equal(findUser(data, b).responsibilityTotal, 200);
    assert.equal(findUser(data, b).responsibilityBalance, 200);
  });
});
