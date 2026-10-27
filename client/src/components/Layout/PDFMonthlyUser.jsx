import React from "react";
import StatementButton from "./StatementButton";

// one-month statement for a user, from the month summary
const PDFMonthlyUser = ({ user, month, budget }) => (
  <StatementButton
    budgetID={budget._id}
    user={user.userID}
    startMonth={month.label}
    endMonth={month.label}
  />
);

export default PDFMonthlyUser;
