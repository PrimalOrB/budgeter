import React from "react";
import generatePDF from "../../utils/generatePDF";

const PDFMonthlyUser = ({
  user,
  date,
  // categories,
  // expenses,
  // incomes,
  // transfers,
}) => {
    
  return (
    <>
      <button
        className="primary-button"
        onClick={() =>
          generatePDF({
            user,
            date,
            // categories,
            // expenses,
            // incomes,
            // transfers,
          })
        }
      >
        {user.userID.userInitials}
      </button>
    </>
  );
};

export default PDFMonthlyUser;
