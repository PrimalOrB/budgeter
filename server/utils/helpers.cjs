const { format, sub } = require("date-fns");

function extractPropAsStrToArr(input, field) {
  var output = [];
  for (var i = 0; i < input.length; ++i) output.push(String(input[i][field]));
  return output;
}

function dateToMonthStr(date) {
  return format(date, "M/yy");
}

function fixRounding(value, precision) {
  const roundingFactor = Math.pow(10, precision),
    isNegative = value < 0,
    rounded = Math.round(Math.abs(value) * roundingFactor) / roundingFactor;
  return rounded > 0 ? rounded * (isNegative ? -1 : 1) : 0;
}

function createMonthLabelFromOffset(offset) {
  const createDate = sub(new Date(), { months: offset }),
    label = dateToMonthStr(createDate);
  return label;
}

function createMonthObj(label, offset) {
  const month = {
    label,
    incomeTotal: 0,
    expenseTotal: 0,
    transferTotals: 0,
    sharedIncomeTotal: 0,
    sharedExpenseTotal: 0,
    userData: [],
    entries: [],
    incomeCategories: [],
    expenseCategories: [],
  };
  if (offset !== undefined) {
    month.order = offset;
  }
  return month;
}

function createMonthlyUserObj() {
  return (defaultUser = {
    userID: {},
    incomeTotal: 0,
    expenseTotal: 0,
    balanceOfTransfer: 0,
    individualIncomeTotal: 0,
    individualExpenseTotal: 0,
    sharedIncomeTotal: 0,
    sharedExpenseTotal: 0,
    percentOfTotalIncome: 0,
    responsibilityTotal: 0,
    responsibilityBalance: 0,
    currentPersonalBalance: 0,
    finalPersonalBalance: 0,
  });
}

function createMonthlyCategoryObj() {
  return (defaultUser = {
    categoryID: {},
    total: 0,
  });
}

function parseMonthlyEntries(month) {
  const monthData = { ...month };
  const userData = [];
  month.entries.map((entry) => {
    let indexOfUser = userData.findIndex((user) =>
        user.userID?._id.equals(entry.userID._id)
      ),
      indexOfToUser = -1;

    // create user if userID does not exist
    if (indexOfUser < 0) {
      const createdUser = copyObject(createMonthlyUserObj());
      createdUser.userID = entry.userID;
      indexOfUser = userData.length;
      userData[indexOfUser] = createdUser;
    }
    // create user if toUserID does not exist (transfers)
    if (entry?.toUserID) {
      indexOfToUser = userData.findIndex((user) =>
        user.userID?._id.equals(entry.toUserID._id)
      );
      if (indexOfToUser < 0) {
        const createdUser = copyObject(createMonthlyUserObj());
        createdUser.userID = entry.toUserID;
        indexOfToUser = userData.length;
        userData[indexOfToUser] = createdUser;
      }
    }

    // income
    if (entry.valueType === "income") {
      monthData.incomeTotal = fixRounding(
        monthData.incomeTotal + entry.value,
        2
      );
      userData[indexOfUser].incomeTotal = fixRounding(
        userData[indexOfUser].incomeTotal + entry.value,
        2
      );

      // get monthly category value
      let indexOfCategory = monthData.incomeCategories.findIndex((category) =>
        category.categoryID?._id.equals(entry.categoryID._id)
      );
      if (indexOfCategory < 0) {
        const createdCategory = copyObject(createMonthlyCategoryObj());
        createdCategory.categoryID = entry.categoryID;
        indexOfCategory = monthData.incomeCategories.length;
        monthData.incomeCategories[indexOfCategory] = createdCategory;
      }
      monthData.incomeCategories[indexOfCategory].total += fixRounding(
        entry.value,
        2
      );

      if (!entry.individualEntry) {
        monthData.sharedIncomeTotal = fixRounding(
          monthData.sharedIncomeTotal + entry.value,
          2
        );
        userData[indexOfUser].sharedIncomeTotal = fixRounding(
          userData[indexOfUser].sharedIncomeTotal + entry.value,
          2
        );
      } else {
        userData[indexOfUser].individualIncomeTotal = fixRounding(
          userData[indexOfUser].individualIncomeTotal + entry.value,
          2
        );
      }
    }
    // expenses
    if (entry.valueType === "expense") {
      monthData.expenseTotal = fixRounding(
        monthData.expenseTotal + entry.value,
        2
      );
      userData[indexOfUser].expenseTotal = fixRounding(
        userData[indexOfUser].expenseTotal + entry.value,
        2
      );

      // get monthly category value
      let indexOfCategory = monthData.expenseCategories.findIndex((category) =>
        category.categoryID?._id.equals(entry.categoryID._id)
      );
      if (indexOfCategory < 0) {
        const createdCategory = copyObject(createMonthlyCategoryObj());
        createdCategory.categoryID = entry.categoryID;
        indexOfCategory = monthData.expenseCategories.length;
        monthData.expenseCategories[indexOfCategory] = createdCategory;
      }
      monthData.expenseCategories[indexOfCategory].total += fixRounding(
        entry.value,
        2
      );

      if (!entry.individualEntry) {
        monthData.sharedExpenseTotal = fixRounding(
          monthData.sharedExpenseTotal + entry.value,
          2
        );
        userData[indexOfUser].sharedExpenseTotal = fixRounding(
          userData[indexOfUser].sharedExpenseTotal + entry.value,
          2
        );
      } else {
        userData[indexOfUser].individualExpenseTotal = fixRounding(
          userData[indexOfUser].individualExpenseTotal + entry.value,
          2
        );
      }
    }
    // transfers
    if (entry.valueType === "transfer") {
      monthData.transferTotals = fixRounding(
        monthData.transferTotals + entry.value,
        2
      );
      userData[indexOfUser].balanceOfTransfer = fixRounding(
        userData[indexOfUser].balanceOfTransfer - entry.value,
        2
      );
      userData[indexOfToUser].balanceOfTransfer = fixRounding(
        userData[indexOfToUser].balanceOfTransfer + entry.value,
        2
      );
    }
  });
  monthData.userData = userData;
  return monthData;
}

function parseMonthlyBalances(month) {
  month.userData.map((user, i) => {
    // Responsibility
    user.percentOfTotalIncome =
      user.sharedIncomeTotal / month.sharedIncomeTotal;
    user.responsibilityTotal = fixRounding(
      month.sharedExpenseTotal * user.percentOfTotalIncome,
      2
    );
    // Balance
    user.responsibilityBalance = fixRounding(
      user.responsibilityTotal -
        user.sharedExpenseTotal +
        user.balanceOfTransfer,
      2
    );
    // Remainder
    user.currentPersonalBalance = fixRounding(
      user.incomeTotal - user.expenseTotal + user.balanceOfTransfer,
      2
    );
    user.finalPersonalBalance = fixRounding(
      user.incomeTotal -
        user.expenseTotal +
        user.balanceOfTransfer -
        user.responsibilityBalance,
      2
    );
  });
  return month;
}

function copyObject(obj) {
  return JSON.parse(JSON.stringify(obj));
}

module.exports = {
  extractPropAsStrToArr,
  dateToMonthStr,
  fixRounding,
  copyObject,
  createMonthLabelFromOffset,
  createMonthObj,
  parseMonthlyEntries,
  parseMonthlyBalances,
};
