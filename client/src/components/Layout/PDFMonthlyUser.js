import React, { useState } from "react";
import { FaCaretDown, FaCaretUp } from "react-icons/fa";
import { MdSubdirectoryArrowRight } from "react-icons/md";
import { BudgetCategoryEntriesExpandableList } from "./";
import { sumPropArray, toCurrency } from "../../utils/helpers";
import generatePDF from "../../utils/generatePDF";

const PDFMonthlyUser = ({
  user,
  date,
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
