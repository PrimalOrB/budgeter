import React, { useState } from "react";
import { Title } from "../components/Layout";
import { useParams } from "react-router-dom";
import { useLazyQuery } from "@apollo/client";
import { useStoreContext } from "../utils/GlobalState";
import { QUERY_CUSTOM_REPORT } from "../utils/queries";
import { sub } from "date-fns";
import { ActionButton } from "../components/Buttons";

const Reports = ({ setErrorState }) => {
  const { id: _id } = useParams();

  const [state] = useStoreContext();
  const { currentUser } = state;
  const [data, setData] = useState({});

  let [getCustomReport, { data: reportData, error }] = useLazyQuery(QUERY_CUSTOM_REPORT,{
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'no-cache',
    onCompleted: async (response) => {
      if (response.requestCustomReport) {
        return setData(response.requestCustomReport);
      }
      return response;
    },
    onError: (err) => {
      setErrorState(err.message);
    },
  });

  function runGetCustomReport(){
    const variables = {
      budgetID: _id,
      userID: currentUser._id,
      startDate: sub(new Date(), { months: 11 }),
      endDate: new Date(),
    }
    getCustomReport({variables})
  }

  console.log(reportData)

  return (
    <section className="full-container">
      <Title text={`Reports`} />
      <div>TBD</div>
      <ActionButton
        action={runGetCustomReport}
        text={"Get Report"}
        additionalClass={"large-button"}
      />
    </section>
  );
};

export default Reports;
