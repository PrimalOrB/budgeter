const css = require("./css.cjs");
const { fixRounding, copyObject, toCurrency } = require("../utils/helpers.cjs");

function monthlyUserReportTemplate(data, user) {
  const matchedUserData = data.months[0].userData.find((users) =>
    users.userID._id.equals(user)
  );

  // let list = ``

  // data.map(line => {
  //   list = list +
  //   `<tr class="${line.isCertified ? '' : 'no-cal'}">
  //       <td class="left ${line.isCertified ? 'line-cal' : 'line-no-cal'}">${line.internalDesignation}</td>
  //       <td>${isNaN(Number(line.lastCertification)) ? '-' : new Date(line.lastCertification).toLocaleDateString()}</td>
  //       <td>${isNaN(Number(line.nextCertification)) ? '-' : new Date(line.nextCertification).toLocaleDateString()}</td>
  //       <td>${line.department.departmentName}</td>
  //     </tr>`
  // })
  const defaultGroup = {
    categoryID: "",
    categoryTitle: "",
    valueTotal: 0,
    valueIndividual: 0,
    entries: [],
  };

  // SHARED EXPENSES
  const sharedExpenses = [`<table><tbody>`, null, `</tbody></table>`],
    sharedExpenseRows = [],
    sharedExpenseStrings = [];
  copyObject(data.months[0].entries)
    .filter(
      (entry) =>
        entry.valueType === "expense" &&
        entry.individualEntry === false &&
        entry.userID._id === user
    )
    .map((entry) => {
      let indexOfCategory = sharedExpenseRows.findIndex(
        (category) => category.categoryID === entry.categoryID
      );

      // create category grouping if categoryID does not exist
      if (indexOfCategory < 0) {
        const createdCategoryGroup = copyObject(defaultGroup);
        createdCategoryGroup.categoryID = entry.categoryID;
        createdCategoryGroup.categoryTitle = data.categories.find((category) =>
          category._id.equals(entry.categoryID)
        ).title;
        indexOfCategory = sharedExpenseRows.length;
        sharedExpenseRows[indexOfCategory] = createdCategoryGroup;
      }
      entry.valueIndividual = fixRounding(
        entry.value * matchedUserData.percentOfTotalIncome,
        2
      );
      sharedExpenseRows[indexOfCategory].valueIndividual = fixRounding(
        sharedExpenseRows[indexOfCategory].valueIndividual +
          entry.valueIndividual,
        2
      );
      sharedExpenseRows[indexOfCategory].valueTotal = fixRounding(
        sharedExpenseRows[indexOfCategory].valueTotal + entry.value,
        2
      );
      sharedExpenseRows[indexOfCategory].entries.push(entry);
      return;
    });
  sharedExpenseRows.map((category) => {
    const categoryStr = [
      `<tr class="category">
        <td>${category.categoryTitle}</td>
        <td>${toCurrency(category.valueIndividual)}</td>
        <td>${toCurrency(category.valueTotal)}</td>
      </tr>`,
    ];
    category.entries.map((entry) => {
      categoryStr.push(
        `<tr class="entry">
          <td>${entry.title}</td>
          <td>${toCurrency(entry.valueIndividual)}</td>
          <td>${toCurrency(entry.value)}</td>
        </tr>`
      );
    });
    sharedExpenseStrings.push(categoryStr);
  });
  sharedExpenses[1] = sharedExpenseStrings.join("");
  const sharedExpensesOutput = sharedExpenses.join("");

  // INDIVIDUAL EXPENSES
  const individualExpenses = [`<table><tbody>`, null, `</tbody></table>`],
    individualExpenseRows = [],
    individualExpenseStrings = [];
  copyObject(data.months[0].entries)
    .filter(
      (entry) =>
        entry.valueType === "expense" &&
        entry.individualEntry === true &&
        entry.userID._id === user
    )
    .map((entry) => {
      let indexOfCategory = individualExpenseRows.findIndex(
        (category) => category.categoryID === entry.categoryID
      );

      // create category grouping if categoryID does not exist
      if (indexOfCategory < 0) {
        const createdCategoryGroup = copyObject(defaultGroup);
        createdCategoryGroup.categoryID = entry.categoryID;
        createdCategoryGroup.categoryTitle = data.categories.find((category) =>
          category._id.equals(entry.categoryID)
        ).title;
        indexOfCategory = individualExpenseRows.length;
        individualExpenseRows[indexOfCategory] = createdCategoryGroup;
      }
      entry.valueIndividual = fixRounding(
        entry.value * matchedUserData.percentOfTotalIncome,
        2
      );
      individualExpenseRows[indexOfCategory].valueTotal = fixRounding(
        individualExpenseRows[indexOfCategory].valueTotal + entry.value,
        2
      );
      individualExpenseRows[indexOfCategory].entries.push(entry);
      return;
    });
  individualExpenseRows.map((category) => {
    const categoryStr = [
      `<tr class="category">
        <td>${category.categoryTitle}</td>
        <td>${toCurrency(category.valueTotal)}</td>
      </tr>`,
    ];
    category.entries.map((entry) => {
      categoryStr.push(
        `<tr class="entry">
          <td>${entry.title}</td>
          <td>${toCurrency(entry.value)}</td>
        </tr>`
      );
    });
    individualExpenseStrings.push(categoryStr);
  });
  individualExpenses[1] = individualExpenseStrings.join("");
  const individualExpensesOutput = individualExpenses.join("");

  // SHARED INCOME
  const sharedIncome = [`<table><tbody>`, null, `</tbody></table>`],
    sharedIncomeRows = [],
    sharedIncomeStrings = [];
  copyObject(data.months[0].entries)
    .filter(
      (entry) =>
        entry.valueType === "income" &&
        entry.individualEntry === false &&
        entry.userID._id === user
    )
    .map((entry) => {
      let indexOfCategory = sharedIncomeRows.findIndex(
        (category) => category.categoryID === entry.categoryID
      );

      // create category grouping if categoryID does not exist
      if (indexOfCategory < 0) {
        const createdCategoryGroup = copyObject(defaultGroup);
        createdCategoryGroup.categoryID = entry.categoryID;
        createdCategoryGroup.categoryTitle = data.categories.find((category) =>
          category._id.equals(entry.categoryID)
        ).title;
        indexOfCategory = sharedIncomeRows.length;
        sharedIncomeRows[indexOfCategory] = createdCategoryGroup;
      }
      entry.valueIndividual = fixRounding(
        entry.value * matchedUserData.percentOfTotalIncome,
        2
      );
      sharedIncomeRows[indexOfCategory].valueIndividual = fixRounding(
        sharedIncomeRows[indexOfCategory].valueIndividual +
          entry.valueIndividual,
        2
      );
      sharedIncomeRows[indexOfCategory].valueTotal = fixRounding(
        sharedIncomeRows[indexOfCategory].valueTotal + entry.value,
        2
      );
      sharedIncomeRows[indexOfCategory].entries.push(entry);
      return;
    });
  sharedIncomeRows.map((category) => {
    const categoryStr = [
      `<tr class="category">
      <td>${category.categoryTitle}</td>
      <td>${toCurrency(category.valueIndividual)}</td>
      <td>${toCurrency(category.valueTotal)}</td>
    </tr>`,
    ];
    category.entries.map((entry) => {
      categoryStr.push(
        `<tr class="entry">
        <td>${entry.title}</td>
        <td>${toCurrency(entry.valueIndividual)}</td>
        <td>${toCurrency(entry.value)}</td>
      </tr>`
      );
    });
    sharedIncomeStrings.push(categoryStr);
  });
  sharedIncome[1] = sharedIncomeStrings.join("");
  const sharedIncomeOutput = sharedIncome.join("");

  

  // INDIVIDUAL INCOME
  const individualIncome = [`<table><tbody>`, null, `</tbody></table>`],
    individualIncomeRows = [],
    individualIncomeStrings = [];
  copyObject(data.months[0].entries)
    .filter(
      (entry) =>
        entry.valueType === "income" &&
        entry.individualEntry === true &&
        entry.userID._id === user
    )
    .map((entry) => {
      let indexOfCategory = individualIncomeRows.findIndex(
        (category) => category.categoryID === entry.categoryID
      );

      // create category grouping if categoryID does not exist
      if (indexOfCategory < 0) {
        const createdCategoryGroup = copyObject(defaultGroup);
        createdCategoryGroup.categoryID = entry.categoryID;
        createdCategoryGroup.categoryTitle = data.categories.find((category) =>
          category._id.equals(entry.categoryID)
        ).title;
        indexOfCategory = individualIncomeRows.length;
        individualIncomeRows[indexOfCategory] = createdCategoryGroup;
      }
      entry.valueIndividual = fixRounding(
        entry.value * matchedUserData.percentOfTotalIncome,
        2
      );
      individualIncomeRows[indexOfCategory].valueTotal = fixRounding(
        individualIncomeRows[indexOfCategory].valueTotal + entry.value,
        2
      );
      individualIncomeRows[indexOfCategory].entries.push(entry);
      return;
    });
    individualIncomeRows.map((category) => {
    const categoryStr = [
      `<tr class="category">
        <td>${category.categoryTitle}</td>
        <td>${toCurrency(category.valueTotal)}</td>
      </tr>`,
    ];
    category.entries.map((entry) => {
      categoryStr.push(
        `<tr class="entry">
          <td>${entry.title}</td>
          <td>${toCurrency(entry.value)}</td>
        </tr>`
      );
    });
    individualIncomeStrings.push(categoryStr);
  });
  individualIncome[1] = individualIncomeStrings.join("");
  const individualIncomeOutput = individualIncome.join("");

  // html tempalte to have data added
  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <style>${css}</style>
    </head>
    <body id="print-body">
      ${sharedExpensesOutput}
      ${individualExpensesOutput}
      ${sharedIncomeOutput}
      ${individualIncomeOutput}
    </body>
</html>
`;
}

module.exports = monthlyUserReportTemplate;
