// Builds a single person's statement for a run of months from the same
// month calculations the dashboard uses (parseMonthlyEntries/Balances), so
// the PDF can never disagree with the app.
const { fixRounding } = require("../utils/helpers.cjs");

const round = (value) => fixRounding(value, 2);
const sum = (rows, key) => round(rows.reduce((total, row) => total + (row[key] || 0), 0));
const idOf = (ref) => String(ref?._id ?? ref ?? "");
const effectiveDate = (entry) => entry.effectiveDate ?? entry.createdAt;

function blankUserMonth() {
  return {
    incomeTotal: 0,
    expenseTotal: 0,
    sharedIncomeTotal: 0,
    sharedExpenseTotal: 0,
    individualIncomeTotal: 0,
    individualExpenseTotal: 0,
    balanceOfTransfer: 0,
    percentOfTotalIncome: 0,
    responsibilityTotal: 0,
    responsibilityBalance: 0,
    finalPersonalBalance: 0,
  };
}

// group items ({ entry, ... }) by category, summing values per item
function byCategory(items, categories, valueOf) {
  const groups = new Map();
  items.forEach((item) => {
    const { entry } = item;
    const id = idOf(entry.categoryID);
    if (!groups.has(id)) {
      const category = categories.find((c) => idOf(c) === id);
      groups.set(id, { title: category?.title || "Uncategorized", count: 0, entries: [] });
    }
    const group = groups.get(id);
    group.count += 1;
    group.entries.push(item);
    item.categoryTitle = group.title;
    Object.entries(valueOf(item)).forEach(([key, value]) => {
      group[key] = round((group[key] || 0) + value);
    });
  });
  return [...groups.values()];
}

/**
 * @param budget   budget with categories and ownerIDs populated
 * @param months   months from populateMonths, any order
 * @param userID   the person the statement is for
 */
function buildStatement({ budget, months, userID }) {
  const user = budget.ownerIDs.find((owner) => idOf(owner) === String(userID));
  const others = budget.ownerIDs.filter((owner) => idOf(owner) !== String(userID));
  const sorted = [...months].sort((a, b) => {
    const [am, ay] = a.label.split("/").map(Number);
    const [bm, by] = b.label.split("/").map(Number);
    return ay - by || am - bm;
  });

  const monthRows = [];
  const shared = [];
  const individualExpenses = [];
  const sharedIncome = [];
  const individualIncome = [];
  const transfers = [];

  sorted.forEach((month) => {
    const mine = month.userData.find((u) => idOf(u.userID) === String(userID)) || blankUserMonth();
    const rate = mine.percentOfTotalIncome || 0;

    const isMine = (entry) => idOf(entry.userID) === String(userID);
    const sharedEntries = month.entries.filter((e) => e.valueType === "expense" && !e.individualEntry);
    let transfersIn = 0;
    let transfersOut = 0;

    month.entries.forEach((entry) => {
      if (entry.valueType === "expense") {
        if (!entry.individualEntry) {
          shared.push({ entry, rate, yourShare: round(entry.value * rate), youPaid: isMine(entry) ? entry.value : 0 });
        } else if (isMine(entry)) {
          individualExpenses.push({ entry });
        }
      }
      if (entry.valueType === "income") {
        if (!entry.individualEntry) {
          sharedIncome.push({ entry, yours: isMine(entry) ? entry.value : 0 });
        } else if (isMine(entry)) {
          individualIncome.push({ entry });
        }
      }
      if (entry.valueType === "transfer") {
        const from = idOf(entry.userID) === String(userID);
        const to = idOf(entry.toUserID) === String(userID);
        if (from || to) {
          if (from) transfersOut += entry.value;
          if (to) transfersIn += entry.value;
          transfers.push({ entry, direction: from ? "out" : "in" });
        }
      }
    });

    monthRows.push({
      label: month.label,
      splitMethod: month.splitMethod || "proportional",
      rate,
      householdSharedExpenses: round(month.sharedExpenseTotal),
      householdSharedIncome: round(month.sharedIncomeTotal),
      sharedEntryCount: sharedEntries.length,
      income: round(mine.incomeTotal),
      sharedIncome: round(mine.sharedIncomeTotal),
      individualIncome: round(mine.individualIncomeTotal),
      yourShare: round(mine.responsibilityTotal),
      sharedPaid: round(mine.sharedExpenseTotal),
      individualExpenses: round(mine.individualExpenseTotal),
      transfersIn: round(transfersIn),
      transfersOut: round(transfersOut),
      // > 0: you owe the others, < 0: they owe you (same as the dashboard)
      settlement: round(mine.responsibilityBalance),
      net: round(mine.finalPersonalBalance),
    });
  });

  const totals = {
    householdSharedExpenses: sum(monthRows, "householdSharedExpenses"),
    householdSharedIncome: sum(monthRows, "householdSharedIncome"),
    income: sum(monthRows, "income"),
    sharedIncome: sum(monthRows, "sharedIncome"),
    individualIncome: sum(monthRows, "individualIncome"),
    yourShare: sum(monthRows, "yourShare"),
    sharedPaid: sum(monthRows, "sharedPaid"),
    individualExpenses: sum(monthRows, "individualExpenses"),
    transfersIn: sum(monthRows, "transfersIn"),
    transfersOut: sum(monthRows, "transfersOut"),
    settlement: sum(monthRows, "settlement"),
    net: sum(monthRows, "net"),
  };
  totals.effectiveRate = totals.householdSharedExpenses
    ? totals.yourShare / totals.householdSharedExpenses
    : 0;
  totals.yourCosts = round(totals.yourShare + totals.individualExpenses);

  const categories = budget.categories;
  const byTotal = (a, b) => (b.total || 0) - (a.total || 0);
  const byDate = (a, b) => effectiveDate(a.entry) - effectiveDate(b.entry);

  return {
    budget: { title: budget.title },
    user,
    others,
    months: monthRows,
    totals,
    sharedByCategory: byCategory(shared, categories, (s) => ({
      total: s.entry.value,
      yourShare: s.yourShare,
      youPaid: s.youPaid,
    })).sort(byTotal),
    individualByCategory: byCategory(individualExpenses, categories, (s) => ({
      total: s.entry.value,
    })).sort(byTotal),
    sharedIncomeByCategory: byCategory(sharedIncome, categories, (s) => ({
      total: s.entry.value,
      yours: s.yours,
    })).sort(byTotal),
    individualIncomeByCategory: byCategory(individualIncome, categories, (s) => ({
      total: s.entry.value,
    })).sort(byTotal),
    transfers: transfers.sort(byDate),
    detail: {
      shared: shared.sort(byDate),
      individualExpenses: individualExpenses.sort(byDate),
    },
  };
}

module.exports = { buildStatement };
