import React, { useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { FiDownload } from "react-icons/fi";
import { REQUEST_STATEMENT_PDF } from "../../utils/queries";
import { savePdf } from "../../utils/download";

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
    onCompleted: ({ requestStatement }) => savePdf(requestStatement, "statement.pdf"),
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
