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
  BudgetCategoryExpandableTitle,
  BudgetCategoryExpandableList,
  BudgetCategoryEntriesExpandableList,
} from "../components/Layout";
import { InlineBarTotal, InlineBarPerUser } from "../components/Charts";
import {
  FaCaretUp,
  FaCaretDown,
  FaFolder,
  FaHome,
  FaListUl,
} from "react-icons/fa";
import { toCurrency } from "../utils/helpers";

const Reports = ({
  budgetState,
  categories,
  setErrorState,
  setPageState,
  setEditingModal,
  setEditingTransaction,
}) => {
  const { id: _id } = useParams();

  const [state] = useStoreContext();
  const { currentUser } = state;
  const [data, setData] = useState({});

  const initialFormState = {
    userID: currentUser._id,
    startDate: sub(new Date(), { months: 3 }),
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

  return (
    <section className="full-container">
      <Title text={`Reports`} />
      <form autoComplete="off">
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
      </form>
      <ActionButton
        action={runGetCustomReport}
        text={"Get Report"}
        additionalClass={"large-button"}
      />
      {reportData?.requestCustomReport ? (
        <>
          <section
            id="month-summary"
            key={`results`}
            className="margin-top-full"
          >
            <h4 className="sub-container-description section-list-title noselect">
              {format(formInput.startDate, "MMM d, yyyy")} -{" "}
              {format(formInput.endDate, "MMM d, yyyy")}
            </h4>
            <ul className="monthly-group-detail border-b-l-rad-none border-b-r-rad-none border_b_none">
              <BudgetCategoryExpandableTitle
                data={reportData.requestCustomReport}
                title={"Balance"}
                expandedProp={"balance"}
                expandedState={expandedState}
                totalProp={"balance"}
                individualProp={"balanceIndividual"}
                setExpandedState={setExpandedState}
              />
              {expandedState.balance && (
                <React.Fragment>
                  <InlineBarTotal
                    key={`report_iR`}
                    inputData={reportData.requestCustomReport}
                    title={["Income to Expenses Ratio", "Income", "Expenses"]}
                    valueProp={["incomeTotal", "expenseTotal"]}
                  />
                  <InlineBarTotal
                    key={`report_sR`}
                    inputData={reportData.requestCustomReport}
                    title={[
                      "Shared Income to Expenses Ratio",
                      "Income",
                      "Expenses",
                    ]}
                    valueProp={["sharedIncomeTotal", "sharedExpenseTotal"]}
                  />
                  {/* <InlineBarPerUser
              key={`report_sIn`}
              inputData={reportData.requestCustomReport}
              title={"Shared Income By User"}
              valueProp={"sharedIncomeTotal"}
            /> */}
                  {/* <InlineBarPerUser
              key={`report_sOut`}
              inputData={reportData.requestCustomReport}
              title={"Shared Expenses By User"}
              valueProp={"sharedExpenseTotal"}
            /> */}
                  {/* <InlineBarPerUser
              key={`report_tIn`}
              inputData={reportData.requestCustomReport}
              title={"Total Income By User"}
              valueProp={"incomeTotal"}
            /> */}
                  {/* <InlineBarPerUser
              key={`report_tOut`}
              inputData={reportData.requestCustomReport}
              title={"Total Expenses By User"}
              valueProp={"expenseTotal"}
            /> */}
                  {/* <InlineBarPerUser
              key={`report_uR`}
              inputData={reportData.requestCustomReport}
              title={"User Resposibility"}
              valueProp={"responsibilityTotal"}
            /> */}
                  {/* <InlineBarBalance
              key={`report_B`}
              inputData={reportData.requestCustomReport}
              title={"Balance"}
              valueProp={"userBalance"}
              total={"expensesShared"}
            /> */}
                  {/* {reportData.requestCustomReport.userData.map((user) => {
              return (
                <InlineBarPerUserBalance
                  key={`report_${user.userID._id}`}
                  inputData={user}
                  title={`${user.userInitials} Balance`}
                  valueProp={"balancedIncome"}
                  total={"balancedExpenses"}
                />
              );
            })} */}
                </React.Fragment>
              )}
            </ul>
            {/* expenses section */}
            <ul className="monthly-group-detail border-b-l-rad-none border-b-r-rad-none border_b_none border-t-l-rad-none border-t-r-rad-none">
              <BudgetCategoryExpandableTitle
                data={reportData.requestCustomReport}
                title={"Expenses"}
                expandedProp={"expense"}
                individualProp={"expenseIndividual"}
                totalProp={"expenseTotal"}
                expandedState={expandedState}
                setExpandedState={setExpandedState}
              />
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
                        setEditingModal={setEditingModal}
                        setEditingTransaction={setEditingTransaction}
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
              <BudgetCategoryExpandableTitle
                data={reportData.requestCustomReport}
                title={"Income"}
                expandedProp={"income"}
                individualProp={"incomeIndividual"}
                totalProp={"incomeTotal"}
                expandedState={expandedState}
                setExpandedState={setExpandedState}
              />
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
                        setEditingModal={setEditingModal}
                        setEditingTransaction={setEditingTransaction}
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
              <BudgetCategoryExpandableTitle
                data={reportData.requestCustomReport}
                title={"Transfers"}
                expandedProp={"transfers"}
                totalProp={"transferTotals"}
                expandedState={expandedState}
                setExpandedState={setExpandedState}
              />
              {expandedState.transfers &&
                [...reportData.requestCustomReport.entries]
                  .filter((entry) => entry.valueType === "transfer")
                  .map((transfer) => {
                    return (
                      <BudgetCategoryEntriesExpandableList
                        key={transfer._id}
                        entry={transfer}
                        setPageState={setPageState}
                        setEditingModal={setEditingModal}
                        setEditingTransaction={setEditingTransaction}
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
