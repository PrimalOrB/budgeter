import jsPDF from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";
import { toCurrency } from "../utils/helpers";

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

  const expenseCategories = [];
  const incomeCategories = [];
  const transferRows = []

  // build categories
  categories.map((category) => {
    if (category.categoryType === "expense") {
      expenseCategories.push({
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
      incomeCategories.push({
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
    const category = expenseCategories.find(
      (category) => category._id === expense.categoryID
    );
    if (expense.userID._id === user.userID && expense.individualEntry) {
      category.individualValue += expense.value;
      category.individualEntries.push([
        format(expense.createdAt, "M/dd/yy"),
        expense.title,
        toCurrency(expense.value),
      ]);
    }
    if (!expense.individualEntry) {
      category.sharedTotalValue += expense.value;
      category.sharedResponsibilityValue += (expense.value * user.portionSharedIncome);
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
    const category = incomeCategories.find(
      (category) => category._id === income.categoryID
    );
    if (income.userID._id === user.userID && income.individualEntry) {
      category.individualValue += income.value;
      category.individualEntries.push([
        format(income.createdAt, "M/dd/yy"),
        income.title,
        toCurrency(income.value),
      ]);
    }
    if (!income.individualEntry) {
      category.sharedTotalValue += income.value;
      category.sharedResponsibilityValue += (income.value * user.portionSharedIncome);
      category.sharedEntries.push([
        format(income.createdAt, "M/dd/yy"),
        income.title,
        toCurrency(income.value),
        toCurrency(income.value * user.portionSharedIncome),
      ]);
    }
  });

  // map transfers
  transfers.map(transfer => {
    if( transfer.userID._id === user.userID || transfer.toUserID._id === user.userID){
        transferRows.push([
            format(transfer.createdAt, "M/dd/yy"),
            toCurrency(transfer.value),
            transfer.userID.userInitials,
            'to',
            transfer.toUserID.userInitials,
          ])
    }

  })

  const doc = new jsPDF();
  doc.showHead = "firstPage";

  const colors = {
    dark: [43, 45, 66],
    mid: [113,169,247],
    light: [],
    white: [255,255,255]
  }

  const tableTitleStyle = {
    0: {
      font: "helvetica",
      halign: "left",
      fontStyle: "bold",
      textColor: [255, 255, 255],
      fillColor: colors.dark,
      fontSize: 14,
      cellWidth: 182,
    },
  };

  const table4SubTitleStyle = {
    0: {
      font: "helvetica",
      halign: "left",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 112,
      fontSize: 10,
      textColor: colors.dark,
      fillColor: colors.mid
    },
    1: {
      font: "helvetica",
      halign: "center",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 35,
      fontSize: 10,
      textColor: colors.dark,
      fillColor: colors.mid
    },
    2: {
      font: "helvetica",
      halign: "center",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 35,
      fontSize: 10,
      textColor: colors.dark,
      fillColor: colors.mid
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
      fillColor: colors.mid
    },
    1: {
      font: "helvetica",
      halign: "center",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 35,
      fontSize: 10,
      textColor: colors.dark,
      fillColor: colors.mid
    },
    2: {
      font: "helvetica",
      halign: "center",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 35,
      fontSize: 10,
      textColor: colors.dark,
      fillColor: colors.mid
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

  const table2SubTitleStyle = {
    0: {
      font: "helvetica",
      halign: "left",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 147,
      fontSize: 10,
      textColor: colors.dark,
      fillColor: colors.mid
    },
    1: {
      font: "helvetica",
      halign: "center",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 35,
      fontSize: 10,
      textColor: colors.dark,
      fillColor: colors.mid
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



  doc.autoTable({
    columnStyles: tableTitleStyle,
    body: [[`${user.userInitials} - ${format(date, "M/dd/yy")} Summary`]],
    startY: 20,
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

  const expenseSharedPost = expenseCategories.filter( category => category.sharedTotalValue > 0 )
  if( expenseSharedPost.length ){
    doc.autoTable({
        columnStyles: tableTitleStyle,
        body: [["Shared Expenses"]],
        startY: doc.lastAutoTable.finalY + 6,
        pageBreak: "auto",
    });
    expenseSharedPost.map( category => {
        doc.autoTable({
            columnStyles: table3SubTitleStyle,
            body: [[category.title, toCurrency(category.sharedTotalValue), toCurrency(category.sharedResponsibilityValue)]],
            startY: doc.lastAutoTable.finalY,
            pageBreak: "auto",
        });
        category.sharedEntries.map( entry => {
            doc.autoTable({
                columnStyles: table4EntryStyle,
                body: [entry],
                startY: doc.lastAutoTable.finalY,
                pageBreak: "auto",
            });
        })
    })
  }

  const incomeSharedPost = incomeCategories.filter( category => category.sharedTotalValue > 0 )
  if( incomeSharedPost.length ){
    doc.autoTable({
        columnStyles: tableTitleStyle,
        body: [["Shared Income"]],
        startY: doc.lastAutoTable.finalY + 6,
        pageBreak: "auto",
    });
    incomeSharedPost.map( category => {
        doc.autoTable({
            columnStyles: table3SubTitleStyle,
            body: [[category.title, toCurrency(category.sharedTotalValue), toCurrency(category.sharedResponsibilityValue)]],
            startY: doc.lastAutoTable.finalY,
            pageBreak: "auto",
        });
        category.sharedEntries.map( entry => {
            doc.autoTable({
                columnStyles: table4EntryStyle,
                body: [entry],
                startY: doc.lastAutoTable.finalY,
                pageBreak: "auto",
            });
        })
    })
  }

  const expensesIndividualPost = expenseCategories.filter( category => category.individualValue > 0 )
  if( expensesIndividualPost.length ){
    doc.autoTable({
        columnStyles: tableTitleStyle,
        body: [["Shared Expenses"]],
        startY: doc.lastAutoTable.finalY + 6,
        pageBreak: "auto",
    });
    expensesIndividualPost.map( category => {
        doc.autoTable({
            columnStyles: table2SubTitleStyle,
            body: [[category.title, toCurrency(category.individualValue)]],
            startY: doc.lastAutoTable.finalY,
            pageBreak: "auto",
        });
        category.individualEntries.map( entry => {
            doc.autoTable({
                columnStyles: table3EntryStyle,
                body: [entry],
                startY: doc.lastAutoTable.finalY,
                pageBreak: "auto",
            });
        })
    })
  }

  const incomeIndividualPost = incomeCategories.filter( category => category.individualValue > 0 )
  if( incomeIndividualPost.length ){
    doc.autoTable({
        columnStyles: tableTitleStyle,
        body: [["Shared Expenses"]],
        startY: doc.lastAutoTable.finalY + 6,
        pageBreak: "auto",
    });
    incomeIndividualPost.map( category => {
        doc.autoTable({
            columnStyles: table2SubTitleStyle,
            body: [[category.title, toCurrency(category.individualValue)]],
            startY: doc.lastAutoTable.finalY,
            pageBreak: "auto",
        });
        category.individualEntries.map( entry => {
            doc.autoTable({
                columnStyles: table3EntryStyle,
                body: [entry],
                startY: doc.lastAutoTable.finalY,
                pageBreak: "auto",
            });
        })
    })
  }

  console.log( transferRows )

  if (transferRows.length) {
    doc.autoTable({
      columnStyles: tableTitleStyle,
      body: [["Transfers"]],
      startY: doc.lastAutoTable.finalY + 6,
      pageBreak: "auto",
    });
    doc.autoTable({
      columnStyles: table5EntryStyle,
      body: transferRows,
      startY: doc.lastAutoTable.finalY,
      pageBreak: "auto",
    });
  }

  doc.save(`report_${format(date, "M/dd/yy")}.pdf`);
};

export default generatePDF;
