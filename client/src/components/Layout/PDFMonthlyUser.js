import React from "react";
import generatePDF from "../../utils/generatePDF";

const PDFMonthlyUser = ({
  user,
  date,
  categories,
  expensesIndividual,
  expensesShared,
  incomeIndividual,
  incomeShared,
  transfers,
}) => {

  return (
    <>
      <button
        className="primary-button"
        onClick={() =>
          generatePDF({
            user,
            date,
            categories,
            expensesIndividual,
            expensesShared,
            incomeIndividual,
            incomeShared,
            transfers,
          })
        }
      >
        {user.userInitials}
      </button>
    </>
  );
};

export default PDFMonthlyUser;
