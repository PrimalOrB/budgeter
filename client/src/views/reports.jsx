import React, { useState } from "react";
import { Title } from "../components/Layout";
import { useParams } from "react-router-dom";
import { useLazyQuery } from "@apollo/client";
import { useStoreContext } from "../utils/GlobalState";
import { QUERY_CUSTOM_REPORT } from "../utils/queries";
import { sub, format } from "date-fns";
import { ActionButton } from "../components/Buttons";
import { InlineUserInput, InlineDateInput } from "../components/Forms";
import {
  BudgetCategoryExpandableList,
  BudgetCategoryEntriesExpandableList,
} from "../components/Layout";
import {
  FaCaretUp,
  FaCaretDown,
  FaFolder,
  FaHome,
  FaListUl,
} from "react-icons/fa";
import { toCurrency } from "../utils/helpers";

const Reports = ({ budgetState, categories, setErrorState, setPageState }) => {
  const { id: _id } = useParams();

  const [state] = useStoreContext();
  const { currentUser } = state;
  const [data, setData] = useState({});

  const initialFormState = {
    userID: currentUser._id,
    startDate: sub(new Date(), { days: 3 }),
    endDate: new Date(),
  };
  const [formInput, setFormInput] = useState({ ...initialFormState });
  const [expandedState, setExpandedState] = useState({
    income: false,
    expense: false,
    balance: false,
    transfers: false,
  });

  let [getCustomReport, { data: reportData, error }] = useLazyQuery(
    QUERY_CUSTOM_REPORT,
    {
      fetchPolicy: "network-only",
      nextFetchPolicy: "no-cache",
      onCompleted: async (response) => {
        if (response.requestCustomReport) {
          return setData(response.requestCustomReport);
        }
        return response;
      },
      onError: (err) => {
        setErrorState(err.message);
      },
    }
  );

  function runGetCustomReport() {
    const variables = {
      budgetID: _id,
      userID: formInput.userID,
      startDate: formInput.startDate,
      endDate: formInput.endDate,
    };
    getCustomReport({ variables });
  }

  console.log(reportData?.requestCustomReport);

  return (
    <section className="full-container">
      <Title text={`Reports`} />
      <div>TBD</div>
      <InlineUserInput
        prop={"userID"}
        input={formInput}
        setInput={setFormInput}
        label={"User"}
        optionList={budgetState.ownerIDs}
      />
      <InlineDateInput
        prop={`startDate`}
        input={formInput}
        setInput={setFormInput}
        label={"Start Date"}
      />
      <InlineDateInput
        prop={`endDate`}
        input={formInput}
        setInput={setFormInput}
        label={"End Date"}
      />
      <ActionButton
        action={runGetCustomReport}
        text={"Get Report"}
        additionalClass={"large-button"}
      />
      {reportData?.requestCustomReport ? (
        <>
          <section id="month-summary" key={`results`}>
            <h4 className="sub-container-description section-list-title noselect">
              {format(formInput.startDate, "MMM d, yyyy")} -{" "}
              {format(formInput.endDate, "MMM d, yyyy")}
            </h4>
            {/* expenses section */}
            <ul className="monthly-group-detail border-b-l-rad-none border-b-r-rad-none border_b_none border-t-l-rad-none border-t-r-rad-none">
              <li
                className="flex nowrap flex-just-space-around f-full"
                onClick={() =>
                  setExpandedState({
                    ...expandedState,
                    expense: !expandedState.expense,
                  })
                }
              >
                <span className="f0 margin-right-half">
                  {expandedState.expense ? FaCaretUp() : FaCaretDown()}
                </span>
                <span className="f1 bold noselect">Expenses</span>
                <span className="f1 bold right noselect">
                  {toCurrency(reportData.requestCustomReport.expenseTotal)}
                </span>
              </li>
              {expandedState.expense ? (
                [...reportData.requestCustomReport.expenseCategories].map(
                  (entry) => {
                    const findCategory = categories.find(
                      (category) => category._id === entry.categoryID
                    );

                    const category = { ...entry, title: findCategory.title };

                    const entries = reportData.requestCustomReport.entries
                      .filter((entry) => entry.valueType === "expense")
                      .filter((entry) => entry.categoryID === findCategory._id);

                    if (entries.length === 0) {
                      return null;
                    }

                    return (
                      <BudgetCategoryExpandableList
                        key={`exp_${category.categoryID}`}
                        category={category}
                        data={entries}
                        setPageState={setPageState}
                      />
                    );
                  }
                )
              ) : (
                <></>
              )}
            </ul>

            {/* income section */}
            <ul className="monthly-group-detail border-b-l-rad-none border-b-r-rad-none border_b_none border-t-l-rad-none border-t-r-rad-none">
              <li
                className="flex nowrap flex-just-space-around f-full"
                onClick={() =>
                  setExpandedState({
                    ...expandedState,
                    income: !expandedState.income,
                  })
                }
              >
                <span className="f0 margin-right-half">
                  {expandedState.income ? FaCaretUp() : FaCaretDown()}
                </span>
                <span className="f1 bold noselect">Income</span>
                <span className="f1 bold right noselect">
                  {toCurrency(reportData.requestCustomReport.incomeTotal)}
                </span>
              </li>
              {expandedState.income ? (
                [...reportData.requestCustomReport.incomeCategories].map(
                  (entry) => {
                    const findCategory = categories.find(
                      (category) => category._id === entry.categoryID
                    );

                    const category = { ...entry, title: findCategory.title };

                    const entries = reportData.requestCustomReport.entries
                      .filter((entry) => entry.valueType === "income")
                      .filter((entry) => entry.categoryID === findCategory._id);

                    if (entries.length === 0) {
                      return null;
                    }

                    return (
                      <BudgetCategoryExpandableList
                        key={`exp_${category.categoryID}`}
                        category={category}
                        data={entries}
                        setPageState={setPageState}
                      />
                    );
                  }
                )
              ) : (
                <></>
              )}
            </ul>

            {/* transfer section */}
            <ul className="monthly-group-detail border-t-l-rad-none border-t-r-rad-none">
              <li
                className="flex nowrap flex-just-space-around f-full"
                onClick={() =>
                  setExpandedState({
                    ...expandedState,
                    transfers: !expandedState.transfers,
                  })
                }
              >
                <span className="f0 margin-right-half">
                  {expandedState.transfers ? FaCaretUp() : FaCaretDown()}
                </span>
                <span className="f1 bold noselect">Transfers</span>
                <span className="f1 bold right noselect">
                  {toCurrency(reportData.requestCustomReport.transferTotals)}
                </span>
              </li>
              {expandedState.transfers &&
                [...reportData.requestCustomReport.entries]
                  .filter((entry) => entry.valueType === "transfer")
                  .map((transfer) => {
                    return (
                      <BudgetCategoryEntriesExpandableList
                        key={transfer._id}
                        entry={transfer}
                        setPageState={setPageState}
                      />
                    );
                  })}
            </ul>
          </section>
        </>
      ) : (
        <></>
      )}
    </section>
  );
};

export default Reports;
