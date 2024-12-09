import jsPDF from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";
import { toCurrency } from "./helpers";

const generatePDF = ({
  user,
  date,
  categories,
  expenses,
  incomes,
  transfers,
}) => {
  // stop col error
  console.error = () => {};

  const allData = {
    totalSharedValue: 0,
    totalSharedResponsibilityValue: 0,
    totalIndividualValue: 0,
    totalSharedIncomeValue: 0,
    totalSharedIncomeResponsibilityValue: 0,
    totalIncomeIndividualValue: 0,
    transfersBalance: 0,
    expenseCategories: [],
    incomeCategories: [],
    transferRows: [],
  };

  // build categories
  categories.map((category) => {
    if (category.categoryType === "expense") {
      allData.expenseCategories.push({
        _id: category._id,
        title: category.title,
        sharedTotalValue: 0,
        sharedResponsibilityValue: 0,
        sharedEntries: [],
        individualValue: 0,
        individualEntries: [],
      });
    }
    if (category.categoryType === "income") {
      allData.incomeCategories.push({
        _id: category._id,
        title: category.title,
        sharedTotalValue: 0,
        sharedResponsibilityValue: 0,
        sharedEntries: [],
        individualValue: 0,
        individualEntries: [],
      });
    }
  });

  // map expenses
  expenses.map((expense) => {
    // find category
    const category = allData.expenseCategories.find(
      (category) => category._id === expense.categoryID
    );
    if (expense.userID._id === user.userID && expense.individualEntry) {
      allData.totalIndividualValue += expense.value;
      category.individualValue += expense.value;
      category.individualEntries.push([
        format(expense.createdAt, "M/dd/yy"),
        expense.title,
        toCurrency(expense.value),
      ]);
    }
    if (!expense.individualEntry) {
      allData.totalSharedValue += expense.value;
      allData.totalSharedResponsibilityValue +=
        expense.value * user.portionSharedIncome;
      category.sharedTotalValue += expense.value;
      category.sharedResponsibilityValue +=
        expense.value * user.portionSharedIncome;
      category.sharedEntries.push([
        format(expense.createdAt, "M/dd/yy"),
        expense.title,
        toCurrency(expense.value),
        toCurrency(expense.value * user.portionSharedIncome),
      ]);
    }
  });

  // map incomes
  incomes.map((income) => {
    // find category
    const category = allData.incomeCategories.find(
      (category) => category._id === income.categoryID
    );
    if (income.userID._id === user.userID && income.individualEntry) {
      allData.totalIncomeIndividualValue += income.value;
      category.individualValue += income.value;
      category.individualEntries.push([
        format(income.createdAt, "M/dd/yy"),
        income.title,
        toCurrency(income.value),
      ]);
    }
    if (!income.individualEntry) {

      allData.totalSharedIncomeValue += income.value;

      if( income.userID._id === user.userID ){
        allData.totalSharedIncomeResponsibilityValue +=
            income.value;
          category.sharedTotalValue += income.value;
          category.sharedResponsibilityValue +=
            income.value;

        category.sharedEntries.push([
            format(income.createdAt, "M/dd/yy"),
            `( ${ income.userID.userInitials } )  ${ income.title }`,
            toCurrency(income.value),
            toCurrency(income.value),
          ]);
      } else {

          category.sharedTotalValue += income.value;

          category.sharedEntries.push([
            format(income.createdAt, "M/dd/yy"),
            `( ${ income.userID.userInitials } )  ${ income.title }`,
            toCurrency(income.value),
            '-',
          ]);
      }

    }
  });

  // map transfers
  transfers.map((transfer) => {
    if (
      transfer.userID._id === user.userID ||
      transfer.toUserID._id === user.userID
    ) {
      if (transfer.userID._id === user.userID) {
        allData.transfersBalance -= transfer.value;
        allData.transferRows.push([
          format(transfer.createdAt, "M/dd/yy"),
          toCurrency(-transfer.value),
          transfer.userID.userInitials,
          "to",
          transfer.toUserID.userInitials,
        ]);
      }
      if (transfer.toUserID._id === user.userID) {
        allData.transfersBalance += transfer.value;
        allData.transferRows.push([
          format(transfer.createdAt, "M/dd/yy"),
          toCurrency(transfer.value),
          transfer.userID.userInitials,
          "to",
          transfer.toUserID.userInitials,
        ]);
      }
    }
  });

  const doc = new jsPDF();
  doc.showHead = "firstPage";

  const colors = {
    dark: [43, 45, 66],
    mid: [113, 169, 247],
    light: [],
    white: [255, 255, 255],
    red: [255, 0, 0],
    green: [0, 128, 0],
  };

  const tableTitleStyle = {
    0: {
      font: "helvetica",
      halign: "left",
      fontStyle: "bold",
      textColor: colors.white,
      fillColor: colors.dark,
      fontSize: 14,
      cellWidth: 182,
    },
  };

  const balanceTitleStylePos = {
    0: {
      font: "helvetica",
      halign: "center",
      fontStyle: "bold",
      textColor: colors.white,
      fillColor: colors.green,
      fontSize: 12,
      cellWidth: 182,
    },
  };

  const balanceTitleStyleNeg = {
    0: {
      font: "helvetica",
      halign: "center",
      fontStyle: "bold",
      textColor: colors.white,
      fillColor: colors.red,
      fontSize: 12,
      cellWidth: 182,
    },
  };

  const table5EntryStyle = {
    0: {
      font: "helvetica",
      halign: "center",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 25,
      fontSize: 9,
    },
    1: {
      font: "helvetica",
      halign: "center",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 107,
      fontSize: 9,
    },
    2: {
      font: "helvetica",
      halign: "center",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 20,
      fontSize: 9,
    },
    3: {
      font: "helvetica",
      halign: "center",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 10,
      fontSize: 9,
    },
    4: {
      font: "helvetica",
      halign: "center",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 20,
      fontSize: 9,
    },
  };

  const table3SubTitleStyle = {
    0: {
      font: "helvetica",
      halign: "left",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 112,
      fontSize: 10,
      textColor: colors.dark,
      fillColor: colors.mid,
    },
    1: {
      font: "helvetica",
      halign: "center",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 35,
      fontSize: 10,
      textColor: colors.dark,
      fillColor: colors.mid,
    },
    2: {
      font: "helvetica",
      halign: "center",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 35,
      fontSize: 10,
      textColor: colors.dark,
      fillColor: colors.mid,
    },
  };

  const table4EntryStyle = {
    0: {
      font: "helvetica",
      halign: "center",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 25,
      fontSize: 9,
    },
    1: {
      font: "helvetica",
      halign: "left",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 87,
      fontSize: 9,
    },
    2: {
      font: "helvetica",
      halign: "center",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 35,
      fontSize: 9,
    },
    3: {
      font: "helvetica",
      halign: "center",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 35,
      fontSize: 9,
    },
  };

  const table4TotalsStyle = {
    0: {
      font: "helvetica",
      halign: "center",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 25,
      fontSize: 10,
      fontStyle: "bold",
      textColor: colors.white,
      fillColor: colors.dark,
    },
    1: {
      font: "helvetica",
      halign: "center",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 87,
      fontSize: 10,
      fontStyle: "bold",
      textColor: colors.white,
      fillColor: colors.dark,
    },
    2: {
      font: "helvetica",
      halign: "center",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 35,
      fontSize: 10,
      fontStyle: "bold",
      textColor: colors.white,
      fillColor: colors.dark,
    },
    3: {
      font: "helvetica",
      halign: "center",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 35,
      fontSize: 10,
      fontStyle: "bold",
      textColor: colors.white,
      fillColor: colors.dark,
    },
  };

  const table2SubTitleStyle = {
    0: {
      font: "helvetica",
      halign: "left",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 147,
      fontSize: 10,
      textColor: colors.dark,
      fillColor: colors.mid,
    },
    1: {
      font: "helvetica",
      halign: "center",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 35,
      fontSize: 10,
      textColor: colors.dark,
      fillColor: colors.mid,
    },
  };

  const table3EntryStyle = {
    0: {
      font: "helvetica",
      halign: "center",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 25,
      fontSize: 9,
    },
    1: {
      font: "helvetica",
      halign: "left",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 122,
      fontSize: 9,
    },
    2: {
      font: "helvetica",
      halign: "center",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 35,
      fontSize: 9,
    },
  };

  const table3TotalsStyle = {
    0: {
      font: "helvetica",
      halign: "center",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 25,
      fontSize: 10,
      fontStyle: "bold",
      textColor: colors.white,
      fillColor: colors.dark,
    },
    1: {
      font: "helvetica",
      halign: "center",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 122,
      fontSize: 10,
      fontStyle: "bold",
      textColor: colors.white,
      fillColor: colors.dark,
    },
    2: {
      font: "helvetica",
      halign: "center",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 35,
      fontSize: 10,
      fontStyle: "bold",
      textColor: colors.white,
      fillColor: colors.dark,
    },
  };

  doc.autoTable({
    columnStyles: tableTitleStyle,
    body: [[`${user.userInitials} - ${format(date, "M/dd/yy")} Summary`]],
    startY: 20,
    pageBreak: "auto",
  });

  doc.autoTable({
    columnStyles:
      user.balancedIncome - user.balancedExpenses > 0
        ? balanceTitleStylePos
        : balanceTitleStyleNeg,
    body: [
      [
        `${
          user.balancedIncome - user.balancedExpenses > 0
            ? "Balance " +
              toCurrency(user.balancedIncome - user.balancedExpenses)
            : "Balance " +
              toCurrency(user.balancedIncome - user.balancedExpenses)
        }`,
      ],
    ],
    startY: doc.lastAutoTable.finalY,
    pageBreak: "auto",
  });

  if (user.userBalance !== 0) {
    doc.autoTable({
      columnStyles: tableTitleStyle,
      body: [
        [
          `${
            user.userBalance > 0
              ? "You Owe " + toCurrency(user.userBalance)
              : "You Are Owed " + toCurrency(Math.abs(user.userBalance))
          }`,
        ],
      ],
      startY: doc.lastAutoTable.finalY + 6,
      pageBreak: "auto",
    });
  }

  const expenseSharedPost = allData.expenseCategories.filter(
    (category) => category.sharedTotalValue > 0
  );
  if (expenseSharedPost.length) {
    doc.autoTable({
      columnStyles: tableTitleStyle,
      body: [["Shared Expenses"]],
      startY: doc.lastAutoTable.finalY + 6,
      pageBreak: "auto",
    });
    expenseSharedPost.map((category) => {
      doc.autoTable({
        columnStyles: table3SubTitleStyle,
        body: [
          [
            category.title,
            toCurrency(category.sharedTotalValue),
            toCurrency(category.sharedResponsibilityValue),
          ],
        ],
        startY: doc.lastAutoTable.finalY,
        pageBreak: "auto",
      });
      category.sharedEntries.map((entry) => {
        doc.autoTable({
          columnStyles: table4EntryStyle,
          body: [entry],
          startY: doc.lastAutoTable.finalY,
          pageBreak: "auto",
        });
      });
    });
    doc.autoTable({
      columnStyles: table4TotalsStyle,
      body: [
        [
          "",
          "Totals",
          toCurrency(allData.totalSharedValue),
          toCurrency(allData.totalSharedResponsibilityValue),
        ],
      ],
      startY: doc.lastAutoTable.finalY,
      pageBreak: "auto",
    });
  }

  const incomeSharedPost = allData.incomeCategories.filter(
    (category) => category.sharedTotalValue > 0
  );
  if (incomeSharedPost.length) {
    doc.autoTable({
      columnStyles: tableTitleStyle,
      body: [["Shared Income"]],
      startY: doc.lastAutoTable.finalY + 6,
      pageBreak: "auto",
    });
    doc.autoTable({
        columnStyles: table4TotalsStyle,
        body: [
          [
            "",
            "",
            "All",
            `${ user.userInitials } Only`,
          ],
        ],
        startY: doc.lastAutoTable.finalY,
        pageBreak: "auto",
      });
    incomeSharedPost.map((category) => {
      doc.autoTable({
        columnStyles: table3SubTitleStyle,
        body: [
          [
            category.title,
            toCurrency(category.sharedTotalValue),
            toCurrency(category.sharedResponsibilityValue),
          ],
        ],
        startY: doc.lastAutoTable.finalY,
        pageBreak: "auto",
      });
      category.sharedEntries.map((entry) => {
        doc.autoTable({
          columnStyles: table4EntryStyle,
          body: [entry],
          startY: doc.lastAutoTable.finalY,
          pageBreak: "auto",
        });
      });
    });
    doc.autoTable({
      columnStyles: table4TotalsStyle,
      body: [
        [
          "",
          "Totals",
          toCurrency(allData.totalSharedIncomeValue),
          toCurrency(allData.totalSharedIncomeResponsibilityValue),
        ],
      ],
      startY: doc.lastAutoTable.finalY,
      pageBreak: "auto",
    });
  }

  const expensesIndividualPost = allData.expenseCategories.filter(
    (category) => category.individualValue > 0
  );
  if (expensesIndividualPost.length) {
    doc.autoTable({
      columnStyles: tableTitleStyle,
      body: [["Individual Expenses"]],
      startY: doc.lastAutoTable.finalY + 6,
      pageBreak: "auto",
    });
    expensesIndividualPost.map((category) => {
      doc.autoTable({
        columnStyles: table2SubTitleStyle,
        body: [[category.title, toCurrency(category.individualValue)]],
        startY: doc.lastAutoTable.finalY,
        pageBreak: "auto",
      });
      category.individualEntries.map((entry) => {
        doc.autoTable({
          columnStyles: table3EntryStyle,
          body: [entry],
          startY: doc.lastAutoTable.finalY,
          pageBreak: "auto",
        });
      });
    });
    doc.autoTable({
      columnStyles: table3TotalsStyle,
      body: [["", "Totals", toCurrency(allData.totalIndividualValue)]],
      startY: doc.lastAutoTable.finalY,
      pageBreak: "auto",
    });
  }

  const incomeIndividualPost = allData.incomeCategories.filter(
    (category) => category.individualValue > 0
  );
  if (incomeIndividualPost.length) {
    doc.autoTable({
      columnStyles: tableTitleStyle,
      body: [["Individual Income"]],
      startY: doc.lastAutoTable.finalY + 6,
      pageBreak: "auto",
    });
    incomeIndividualPost.map((category) => {
      doc.autoTable({
        columnStyles: table2SubTitleStyle,
        body: [[category.title, toCurrency(category.individualValue)]],
        startY: doc.lastAutoTable.finalY,
        pageBreak: "auto",
      });
      category.individualEntries.map((entry) => {
        doc.autoTable({
          columnStyles: table3EntryStyle,
          body: [entry],
          startY: doc.lastAutoTable.finalY,
          pageBreak: "auto",
        });
      });
    });
    doc.autoTable({
      columnStyles: table3TotalsStyle,
      body: [["", "Totals", toCurrency(allData.totalIncomeIndividualValue)]],
      startY: doc.lastAutoTable.finalY,
      pageBreak: "auto",
    });
  }

  if (allData.transferRows.length) {
    doc.autoTable({
      columnStyles: tableTitleStyle,
      body: [["Transfers"]],
      startY: doc.lastAutoTable.finalY + 6,
      pageBreak: "auto",
    });
    doc.autoTable({
      columnStyles: table5EntryStyle,
      body: allData.transferRows,
      startY: doc.lastAutoTable.finalY,
      pageBreak: "auto",
    });
    doc.autoTable({
      columnStyles: table3TotalsStyle,
      body: [["", "Totals", toCurrency(allData.transfersBalance)]],
      startY: doc.lastAutoTable.finalY,
      pageBreak: "auto",
    });
  }

  doc.save(`report_${format(date, "M/dd/yy")}.pdf`);
};

export default generatePDF;
