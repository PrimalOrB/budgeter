import React, { useState } from "react";
import generatePDF from "../../utils/generatePDF";
import { useLazyQuery } from "@apollo/client";
import { REQUEST_MONTHLY_USER_REPORT_PDF } from "../../utils/queries";

const PDFMonthlyUser = ({
  user,
  date,
  month,
  budget,
  // categories,
  // expenses,
  // incomes,
  // transfers,
}) => {
  const [printReq, setPrintReq] = useState(false);

  let [getMonthlyReport] = useLazyQuery(REQUEST_MONTHLY_USER_REPORT_PDF, {
    fetchPolicy: "network-only",
    onCompleted: async (response) => {
      const base64Response = await fetch(
        `data:application/pdf;base64,${response.requestMonthlyUserReport.blob}`
      );
      const blob = await base64Response.blob();
      var a = document.createElement("a"),
        url = URL.createObjectURL(blob);
      a.href = url;
      a.download = `${user.userID.userInitials}_${month.label}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setPrintReq(false);
      }, 0);
    },
    onError: (err) => {
      setErrorState(err.message);
    },
  });

  function requestMonthlyReport() {
    setPrintReq(true);
    getMonthlyReport({
      variables: {
        month: month.label,
        user: user.userID._id,
        budgetID: budget._id
      },
    });
  }

  return (
    <>
      <button className="primary-button" onClick={requestMonthlyReport}>
        {user.userID.userInitials}
      </button>
    </>
  );
};

export default PDFMonthlyUser;
