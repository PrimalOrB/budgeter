const css = require("./css.cjs");
const { fixRounding, copyObject, toCurrency } = require("../utils/helpers.cjs");
const { format } = require("date-fns");

function monthlyUserReportTemplate(data, user) {
  const matchedUserData = data.months[0].userData.find((users) =>
    users.userID._id.equals(user)
  );
  const defaultGroup = {
    categoryID: "",
    categoryTitle: "",
    valueTotal: 0,
    valueIndividual: 0,
    entries: [],
  };

  // SHARED EXPENSES
  const sharedExpenseRows = [],
    sharedExpenseStrings = [];
  let sharedExpenseTotal = [0, 0];
  copyObject(data.months[0].entries)
    .filter(
      (entry) =>
        entry.valueType === "expense" &&
        entry.individualEntry === false
    )
    .map((entry) => {
      let indexOfCategory = sharedExpenseRows.findIndex(
        (category) => category.categoryID === entry.categoryID
      );

      sharedExpenseTotal[0] = fixRounding(
        sharedExpenseTotal[0] +
          entry.value * matchedUserData.percentOfTotalIncome,
        2
      );
      sharedExpenseTotal[1] = fixRounding(
        sharedExpenseTotal[1] + entry.value,
        2
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
        <td class="w-4 ml-1-r">${category.categoryTitle}</td>
        <td class="w-1 c">${toCurrency(category.valueIndividual)}</td>
        <td class="w-1 c">${toCurrency(category.valueTotal)}</td>
      </tr>`,
    ];
    category.entries
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((entry, i) => {
        categoryStr.push(
          `<tr class="entry ${i % 2 === 0 ? "alternate-e" : "alternate-o"}">
            <td class="w-4 flex w-10">
              <span class="w-6-r c date">${new Date(
                entry.createdAt
              ).toLocaleDateString()}</span>
              <span class="w-8">${entry.title}</span>
            </td>
            <td class="w-1 c ${entry.valueIndividual < 0 ? "negative" : ""}">${toCurrency(entry.valueIndividual)}</td>
            <td class="w-1 c ${entry.value < 0 ? "negative" : ""}">${toCurrency(
            entry.value
          )}</td>
          </tr>`
        );
      });
    sharedExpenseStrings.push(categoryStr);
  });
  let sharedExpenses = `<table>
  <thead>
    <tr>
      <th class="ml-05-r flex">
        <span class="col-w">Shared Expenses: </span>
        <span class="totals fs-1 col-w ml-2-r">${toCurrency(
          sharedExpenseTotal[0]
        )} of ${toCurrency(sharedExpenseTotal[1])}</span> 
      </th>
      <th class="c fs-1">${matchedUserData.userID.userInitials} Portion</th>
      <th class="c fs-1">All</th>
    </tr>
  </thead>
  <tbody>`;
  sharedExpenseStrings.map((group) => {
    group.map((str) => {
      return (sharedExpenses += str);
    });
  });
  sharedExpenses += `</tbody></table>`;

  // INDIVIDUAL EXPENSES
  const individualExpenseRows = [],
    individualExpenseStrings = [];
  let individualExpenseTotal = [0];
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

      individualExpenseTotal[0] = fixRounding(
        individualExpenseTotal[0] + entry.value,
        2
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
        <td class="w-5 ml-1-r">${category.categoryTitle}</td>
        <td class="w-1 c">${toCurrency(category.valueTotal)}</td>
      </tr>`,
    ];
    category.entries
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((entry, i) => {
        categoryStr.push(
          `<tr class="entry ${i % 2 === 0 ? "alternate-e" : "alternate-o"}">
          <td class="w-4 flex w-10">
            <span class="w-6-r c date">${new Date(
              entry.createdAt
            ).toLocaleDateString()}</span>
            <span class="w-8">${entry.title}</span>
          </td>
          <td class="w-1 c ${entry.value < 0 ? "negative" : ""}">${toCurrency(
            entry.value
          )}</td>
        </tr>`
        );
      });
    individualExpenseStrings.push(categoryStr);
  });
  let individualExpenses = `<table>
  <thead>
    <tr>
      <th class="ml-05-r flex">
        <span class="col-w">Individual Expenses:</span>
        <span class="totals fs-1 col-w ml-2-r">${toCurrency(
          individualExpenseTotal[0]
        )}</span> 
      </th>
      <th class="c fs-1">${matchedUserData.userID.userInitials} Only</th>
    </tr>
  </thead>
  <tbody>`;
  individualExpenseStrings.map((group) => {
    group.map((str) => {
      return (individualExpenses += str);
    });
  });
  individualExpenses += `</tbody></table>`;

  // SHARED INCOME
  const sharedIncomeRows = [],
    sharedIncomeStrings = [];
  let sharedIncomeTotal = [0, 0];
  copyObject(data.months[0].entries)
    .filter(
      (entry) =>
        entry.valueType === "income" &&
        entry.individualEntry === false 
    )
    .map((entry) => {
      let indexOfCategory = sharedIncomeRows.findIndex(
        (category) => category.categoryID === entry.categoryID
      );

      sharedIncomeTotal[0] = fixRounding(
        sharedIncomeTotal[0] +
          entry.value * matchedUserData.percentOfTotalIncome,
        2
      );
      sharedIncomeTotal[1] = fixRounding(sharedIncomeTotal[1] + entry.value, 2);

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
      if( entry.userID._id === user ){
        entry.valueIndividual = entry.value
        sharedIncomeRows[indexOfCategory].valueIndividual = fixRounding(
          sharedIncomeRows[indexOfCategory].valueIndividual +
            entry.value,
          2
        );
      }
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
        <td class="w-4 ml-1-r">${category.categoryTitle}</td>
        <td class="w-1 c">${toCurrency(category.valueIndividual)}</td>
        <td class="w-1 c">${toCurrency(category.valueTotal)}</td>
      </tr>`,
    ];
    category.entries
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((entry, i) => {
        categoryStr.push(
          `<tr class="entry ${i % 2 === 0 ? "alternate-e" : "alternate-o"}">
          <td class="w-4 flex w-10">
            <span class="w-6-r c date">${new Date(
              entry.createdAt
            ).toLocaleDateString()}</span>
            <span class="w-8">${entry.title}</span>
          </td>
          <td class="w-1 c ${entry.valueIndividual < 0 ? "negative" : ""}">${entry.valueIndividual > 0 ? toCurrency(entry.valueIndividual) : ''}</td>
          <td class="w-1 c ${entry.value < 0 ? "negative" : ""}">${toCurrency(
            entry.value
          )}</td>
        </tr>`
        );
      });
    sharedIncomeStrings.push(categoryStr);
  });
  let sharedIncome = `<table>
  <thead>
    <tr>
      <th class="ml-05-r flex">
        <span class="col-w">Shared Income:</span>
        <span class="totals fs-1 col-w ml-2-r">${toCurrency(
          sharedIncomeTotal[0]
        )} of ${toCurrency(sharedIncomeTotal[1])}</span> 
      </th>
      <th class="c fs-1">${matchedUserData.userID.userInitials} Only</th>
      <th class="c fs-1">All</th>
    </tr>
  </thead>
  <tbody>`;
  sharedIncomeStrings.map((group) => {
    group.map((str) => {
      return (sharedIncome += str);
    });
  });
  sharedIncome += `</tbody></table>`;

  // INDIVIDUAL INCOME
  const individualIncomeRows = [],
    individualIncomeStrings = [];
  let individualIncomeTotal = [0];
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

      individualIncomeTotal[0] = fixRounding(
        individualIncomeTotal[0] + entry.value,
        2
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
        <td class="w-5 ml-1-r">${category.categoryTitle}</td>
        <td class="w-1 c">${toCurrency(category.valueTotal)}</td>
      </tr>`,
    ];
    category.entries
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((entry, i) => {
        categoryStr.push(
          `<tr class="entry ${i % 2 === 0 ? "alternate-e" : "alternate-o"}">
            <td class="w-4 flex w-10">
              <span class="w-6-r c date">${new Date(
                entry.createdAt
              ).toLocaleDateString()}</span>
              <span class="w-8">${entry.title}</span>
            </td>
            <td class="w-1 c ${entry.value < 0 ? "negative" : ""}">${toCurrency(
            entry.value
          )}</td>
          </tr>`
        );
      });
    individualIncomeStrings.push(categoryStr);
  });
  let individualIncome = `<table>
  <thead>
    <tr>
      <th class="ml-05-r flex">
        <span class="col-w">Individual Income:</span>
        <span class="totals fs-1 col-w ml-2-r">${toCurrency(
          individualIncomeTotal[0]
        )}</span> 
      </th>
      <th class="c fs-1">${matchedUserData.userID.userInitials} Only</th>
    </tr>
  </thead>
  <tbody>`;
  individualIncomeStrings.map((group) => {
    group.map((str) => {
      return (individualIncome += str);
    });
  });
  individualIncome += `</tbody></table>`;

  // TRANSFERS
  const transfersStrings = [];
  const transferVals = [0, 0];
  copyObject(data.months[0].entries)
    .filter(
      (entry) =>
        entry.valueType === "transfer" &&
        (entry.userID._id === user || entry.toUserID._id === user)
    )
    .map((entry, i) => {
      if (entry.userID._id === user) {
        transferVals[0] = fixRounding(transferVals[0] + entry.value, 2);
        transfersStrings.push(
          `<tr class="entry ${i % 2 === 0 ? "alternate-e" : "alternate-o"}">
            <td class="w-4 flex w-10">
              <span class="w-6-r c date">${new Date(
                entry.createdAt
              ).toLocaleDateString()}</span>
              <span class="w-8">${entry.title}</span>
            </td>
            <td class="w-1 c negative">${toCurrency(entry.value * -1)}</td>
          </tr>`
        );
      }
      if (entry.toUserID._id === user) {
        transferVals[1] = fixRounding(transferVals[1] + entry.value, 2);
        transfersStrings.push(
          `<tr class="entry ${i % 2 === 0 ? "alternate-e" : "alternate-o"}">
            <td class="w-4 flex w-10">
              <span class="w-6-r c date">${new Date(
                entry.createdAt
              ).toLocaleDateString()}</span>
              <span class="w-8">${entry.title}</span>
            </td>
            <td class="w-1 c">${toCurrency(entry.value)}</td>
          </tr>`
        );
      }
      return;
    });

  let transfers = `<table>
      <thead>
        <tr>
          <th class="ml-05-r flex">
            <span class="col-w">Transfers</span>
            <span class="totals fs-1 col-w ml-2-r">${toCurrency(
              transferVals[0]
            )} Out / ${toCurrency(transferVals[1])} In</span> 
          </th>          
          <th class="c fs-1"></th>
        </tr>
      </thead>
    <tbody>
    <tr class="category">
      <td class="w-5 ml-1-r"></td>
      <td class="w-1 c"></td>
    </tr>`;
  transfersStrings.map((str) => {
    return (transfers += str);
  });
  transfers += `</tbody></table>`;

  

  // SUMMARY
  let summary = `
    <table>
      <thead>
        <tr>
          <th class="ml-05-r flex">
            <span class="col-w">Summary: ${matchedUserData.userID.userInitials} - ${ data.months[0].label }</span>
          </th>
        </tr>
      </thead>
    </table>
    <table class="mt-0">
      <tbody>
        ${
          matchedUserData.responsibilityBalance === 0
          ?
          `<tr class="category">
            <td class="w-15-r ml-1-r">Values Balanced</td>
            <td class="w-7"></td>
          </tr>`
          :
          matchedUserData.responsibilityBalance > 0
          ?
          `<tr class="category">
            <td class="w-15-r ml-1-r">Balance To Pay</td>
            <td class="w-7">${toCurrency(matchedUserData.responsibilityBalance)}</td>
          </tr>`
          :
          `<tr class="category">
            <td class="w-15-r ml-1-r">Balance Owed</td>
            <td class="w-7">${toCurrency(Math.abs(matchedUserData.responsibilityBalance))}</td>
          </tr>`
        }
        <tr class="category">
          <td class="w-15-r ml-1-r">Shared Responsibility</td>
          <td class="w-7">${toCurrency(matchedUserData.responsibilityTotal)} ( ${fixRounding(matchedUserData.percentOfTotalIncome * 100,1)}% Of Shared Expenses )</td>
        </tr>
        <tr class="category">
          <td class="w-15-r ml-1-r">Remaining Balance</td>
          <td class="w-7">${toCurrency(matchedUserData.finalPersonalBalance)}</td>
        </tr>
        <tr class="category">
          <td class="w-15-r ml-1-r">Shared Expenses</td>
          <td class="w-7">${toCurrency(
            sharedExpenseTotal[0]
          )} of ${toCurrency(sharedExpenseTotal[1])}</td>
        </tr>
        <tr class="category">
          <td class="w-15-r ml-1-r">Individual Expenses</td>
          <td class="w-7">${toCurrency(
            individualExpenseTotal[0]
          )}</td>
        </tr>
        <tr class="category">
          <td class="w-15-r ml-1-r">Shared Income</td>
          <td class="w-7">${toCurrency(
            sharedIncomeTotal[0]
          )} of ${toCurrency(sharedIncomeTotal[1])}</td>
        </tr>
        <tr class="category">
          <td class="w-15-r ml-1-r">Individual Income</td>
          <td class="w-7">${toCurrency(
            individualIncomeTotal[0]
          )}</td>
        </tr>      
        <tr class="category">
          <td class="w-15-r ml-1-r">Transfers</td>
          <td class="w-7">${toCurrency(
            transferVals[0]
          )} Out / ${toCurrency(transferVals[1])} In</td>
        </tr>
      </tbody>
    </table>
  `;

  // html tempalte to have data added
  return `
  <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <style>${css}</style>
      </head>
      <body id="print-body">
        ${summary}
        ${sharedExpenses}
        ${individualExpenses}
        ${sharedIncome}
        ${individualIncome}
        ${transfers}
      </body>
  </html>
`;
}

module.exports = monthlyUserReportTemplate;
