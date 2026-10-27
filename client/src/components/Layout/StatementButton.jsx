import React, { useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { FiDownload } from "react-icons/fi";
import { REQUEST_STATEMENT_PDF } from "../../utils/queries";

// downloads one person's PDF statement for whole months startMonth..endMonth
const StatementButton = ({
  budgetID,
  user,
  startMonth,
  endMonth,
  text,
  additionalClass = "btn-secondary",
}) => {
  const [errorState, setErrorState] = useState(null);

  const [getStatement, { loading }] = useLazyQuery(REQUEST_STATEMENT_PDF, {
    fetchPolicy: "no-cache",
    onCompleted: async ({ requestStatement }) => {
      const response = await fetch(
        `data:application/pdf;base64,${requestStatement.blob}`
      );
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = requestStatement.filename || "statement.pdf";
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 0);
    },
    onError: (err) => setErrorState(err.message),
  });

  const download = () => {
    setErrorState(null);
    getStatement({
      variables: { budgetID, userID: user._id, startMonth, endMonth },
    });
  };

  return (
    <button
      type="button"
      className={`btn ${additionalClass}`}
      onClick={download}
      disabled={loading}
      title={errorState || `Download ${user.email}'s statement`}
    >
      {loading ? <span className="spinner spinner-sm" /> : <FiDownload />}
      {text || `${user.userInitials || user.email} statement`}
    </button>
  );
};

export default StatementButton;
