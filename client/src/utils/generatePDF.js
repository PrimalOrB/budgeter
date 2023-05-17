import jsPDF from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";
import { toCurrency } from "../utils/helpers";

const generatePDF = ({
  user,
  date,
  expensesIndividual,
  expensesShared,
  incomeIndividual,
  incomeShared,
  transfers,
}) => {
  // stop col error
  console.error = () => {};

  const doc = new jsPDF();
  doc.showHead = "firstPage";

  const expenseSharedCol = ["Date", "Title", "Total Expense", "Responsibility"];
  const expenseSharedRow = [];
  expensesShared.forEach((expense) => {
    const expenseData = [
      format(expense.createdAt, "M/dd/yy"),
      expense.title,
      toCurrency(expense.value),
      toCurrency(expense.value * user.portionSharedIncome),
    ];
    expenseSharedRow.push(expenseData);
  });

  const incomeSharedCol = ["Date", "Title", "Total Income", "Responsibility"];
  const incomeSharedRow = [];

  incomeShared.forEach((income) => {
    const incomeData = [
      format(income.createdAt, "M/dd/yy"),
      income.title,
      toCurrency(income.value),
      toCurrency(income.value * user.portionSharedIncome),
    ];
    incomeSharedRow.push(incomeData);
  });
  const expenseCol = ["Date", "Title", "Individual Expense"];
  const expenseRow = [];

  expensesIndividual.forEach((expense) => {
    const expenseData = [
      format(expense.createdAt, "M/dd/yy"),
      expense.title,
      toCurrency(expense.value),
    ];
    expenseRow.push(expenseData);
  });
  const incomeCol = ["Date", "Title", "Individual Income"];
  const incomeRow = [];

  incomeIndividual.forEach((income) => {
    const incomeData = [
      format(income.createdAt, "M/dd/yy"),
      income.title,
      toCurrency(income.value),
      toCurrency(income.value * user.portionSharedIncome),
    ];
    incomeRow.push(incomeData);
  });

  const transferCol = ["Date", "Transfer Value", "From", "To"];
  const transferRow = [];
  transfers.forEach((transfer) => {
    const incomeData = [
      format(transfer.createdAt, "M/dd/yy"),
      toCurrency(transfer.value),
      transfer.userID.userInitials,
      transfer.toUserID.userInitials,
    ];
    transferRow.push(incomeData);
  });

  const titleStyle = {
    0: {
      font: "helvetica",
      halign: "left",
      fontStyle: "bold",
      textColor: [255, 255, 255],
      fillColor: [43, 45, 66],
      fontSize: 14,
      cellWidth: 182,
    },
  };

  const headerStyles = {
    font: "helvetica",
    halign: "center",
    cellPadding: 1,
    fillColor: [77,80,107],
    fontSize: 10,
  };

  const columnStyles4 = {
    0: {
      font: "helvetica",
      halign: "center",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 30,
      fontSize: 9,
    },
    1: {
      font: "helvetica",
      halign: "left",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 82,
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

  const columnStyles4Total = {
    0: {
      font: "helvetica",
      halign: "center",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 30,
      fontStyle: "bold",
      cellPadding: 1,
      textColor: [255, 255, 255],
      fillColor: [77,80,107],
      fontSize: 10,
    },
    1: {
      font: "helvetica",
      halign: "left",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 82,
      fontStyle: "bold",
      cellPadding: 1,
      textColor: [255, 255, 255],
      fillColor: [77,80,107],
      fontSize: 10,
    },
    2: {
      font: "helvetica",
      halign: "center",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 35,
      fontStyle: "bold",
      cellPadding: 1,
      textColor: [255, 255, 255],
      fillColor: [77,80,107],
      fontSize: 10,
    },
    3: {
      font: "helvetica",
      halign: "center",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 35,
      fontStyle: "bold",
      cellPadding: 1,
      textColor: [255, 255, 255],
      fillColor: [77,80,107],
      fontSize: 10,
    },
  };

  const columnStyles3Total = {
    0: {
      font: "helvetica",
      halign: "center",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 30,
      fontStyle: "bold",
      cellPadding: 1,
      textColor: [255, 255, 255],
      fillColor: [77,80,107],
      fontSize: 10,
    },
    1: {
      font: "helvetica",
      halign: "left",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 117,
      fontStyle: "bold",
      cellPadding: 1,
      textColor: [255, 255, 255],
      fillColor: [77,80,107],
      fontSize: 10,
    },
    2: {
      font: "helvetica",
      halign: "center",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 35,
      fontStyle: "bold",
      cellPadding: 1,
      textColor: [255, 255, 255],
      fillColor: [77,80,107],
      fontSize: 10,
    },
  };

  const columnStyles4Alt = {
    0: {
      font: "helvetica",
      halign: "center",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 32,
      fontSize: 9,
    },
    1: {
      font: "helvetica",
      halign: "center",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 50,
      fontSize: 9,
    },
    2: {
      font: "helvetica",
      halign: "center",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 50,
      fontSize: 9,
    },
    3: {
      font: "helvetica",
      halign: "center",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 50,
      fontSize: 9,
    },
  };

  const columnStyles3 = {
    0: {
      font: "helvetica",
      halign: "center",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 30,
      fontSize: 9,
    },
    1: {
      font: "helvetica",
      halign: "left",
      overflow: "linebreak",
      cellPadding: 1,
      cellWidth: 117,
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

  if (expenseSharedRow.length) {
    doc.autoTable({
      columnStyles: titleStyle,
      body: [["Shared Expenses"]],
      startY: 20,
      pageBreak: "auto",
    });
    doc.autoTable({
      head: [expenseSharedCol],
      headStyles: headerStyles,
      columnStyles: columnStyles4,
      body: expenseSharedRow,
      startY: doc.lastAutoTable.finalY,
      pageBreak: "auto",
    });
    doc.autoTable({
      columnStyles: columnStyles4Total,
      body: [
        [
          "",
          "Totals",
          toCurrency(user.expensesShared / user.portionSharedExpenses),
          toCurrency(user.expensesShared),
        ],
      ],
      startY: doc.lastAutoTable.finalY,
      pageBreak: "auto",
    });
  }

  if (incomeSharedRow.length) {
    doc.autoTable({
      columnStyles: titleStyle,
      body: [["Shared Income"]],
      startY: doc.lastAutoTable.finalY + 12,
      pageBreak: "auto",
    });
    doc.autoTable({
      head: [incomeSharedCol],
      headStyles: headerStyles,
      columnStyles: columnStyles4,
      body: incomeSharedRow,
      startY: doc.lastAutoTable.finalY,
      pageBreak: "auto",
    });
    doc.autoTable({
      columnStyles: columnStyles4Total,
      body: [
        [
          "",
          "Totals",
          toCurrency(user.incomeShared / user.portionSharedIncome),
          toCurrency(user.incomeShared),
        ],
      ],
      startY: doc.lastAutoTable.finalY,
      pageBreak: "auto",
    });
  }

  if (expenseRow.length) {
    doc.autoTable({
      columnStyles: titleStyle,
      body: [["Individual Expenses"]],
      startY: doc.lastAutoTable.finalY + 12,
      pageBreak: "auto",
    });
    doc.autoTable({
      head: [expenseCol],
      headStyles: headerStyles,
      columnStyles: columnStyles3,
      body: expenseRow,
      startY: doc.lastAutoTable.finalY,
      pageBreak: "auto",
    });
    doc.autoTable({
      columnStyles: columnStyles3Total,
      body: [
        ["", "Totals", toCurrency(user.expensesTotal - user.expensesShared)],
      ],
      startY: doc.lastAutoTable.finalY,
      pageBreak: "auto",
    });
  }

  if (incomeRow.length) {
    doc.autoTable({
        columnStyles: titleStyle,
        body: [["Individual Income"]],
        startY: doc.lastAutoTable.finalY + 12,
        pageBreak: "auto",
      });
    doc.autoTable({
      head: [incomeCol],
      headStyles: headerStyles,
      columnStyles: columnStyles3,
      body: incomeRow,
      startY: doc.lastAutoTable.finalY,
      pageBreak: "auto",
    });
    doc.autoTable({
      columnStyles: columnStyles3Total,
      body: [["", "Totals", toCurrency(user.incomeTotal - user.incomeShared)]],
      startY: doc.lastAutoTable.finalY,
      pageBreak: "auto",
    });
  }

  if (transferRow.length) {
    doc.autoTable({
        columnStyles: titleStyle,
        body: [["Transfers"]],
        startY: doc.lastAutoTable.finalY + 12,
        pageBreak: "auto",
      });
    doc.autoTable({
      head: [transferCol],
      headStyles: headerStyles,
      columnStyles: columnStyles4Alt,
      body: transferRow,
      startY: doc.lastAutoTable.finalY,
      pageBreak: "auto",
    });
  }


  doc.text(`${user.userInitials} - ${format(date, "M/dd/yy")} Summary`, 14, 15);

  doc.save(`report_${ format(date, "M/dd/yy") }.pdf`);
};

export default generatePDF;
