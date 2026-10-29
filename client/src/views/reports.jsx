import React, { useState, useEffect } from "react";
import { Title } from "../components/Layout";
import { useParams } from "react-router-dom";
import { useLazyQuery } from "@apollo/client";
import { useStoreContext } from "../utils/GlobalState";
import { QUERY_CUSTOM_REPORT } from "../utils/queries";
import { sub, format } from "date-fns";
import { ActionButton } from "../components/Buttons";
import { InlineUserInput, InlineMonthInput } from "../components/Forms";
import {
  StatementButton,
  BudgetCategoryExpandableTitle,
  BudgetCategoryExpandableList,
  BudgetCategoryEntriesExpandableList,
} from "../components/Layout";
import { InlineBarTotal } from "../components/Charts";
import { FiUsers } from "react-icons/fi";
import { LuCar } from "react-icons/lu";
import VehicleReports from "./vehicleReport";

// "yyyy-MM" month picker values -> the report's date range and labels.
// Reports cover whole months: the 1st of the start month to the last day of
// the end month (stored at 12:00 UTC like effective dates).
const monthKeyParts = (key) => key.split("-").map(Number);
const monthStart = (key) => {
  const [year, month] = monthKeyParts(key);
  return new Date(Date.UTC(year, month - 1, 1, 12));
};
const monthEnd = (key) => {
  const [year, month] = monthKeyParts(key);
  return new Date(Date.UTC(year, month, 0, 12));
};
const monthLabel = (key) => {
  const [year, month] = monthKeyParts(key);
  return `${month}/${String(year).slice(-2)}`;
};
const monthTitle = (key) => {
  const [year, month] = monthKeyParts(key);
  return format(new Date(year, month - 1, 1), "MMM yyyy");
};

const PersonReports = ({
  budgetState,
  categories,
  setErrorState,
  setPageState,
  setEditingModal,
  setEditingTransaction,
  header,
}) => {
  const { id: _id } = useParams();

  const [state] = useStoreContext();
  const { currentUser } = state;
  const [data, setData] = useState({});

  const initialFormState = {
    userID: currentUser._id,
    startMonth: format(sub(new Date(), { months: 3 }), "yyyy-MM"),
    endMonth: format(new Date(), "yyyy-MM"),
  };
  const [formInput, setFormInput] = useState({ ...initialFormState });
  const [expandedState, setExpandedState] = useState({
    income: false,
    expense: false,
    balance: false,
    transfers: false,
  });

  const [auditState, setAuditState] = useState({ pass: false });
  // the months the shown report was run for (the pickers may have moved on)
  const [reportRange, setReportRange] = useState(null);
  const statementUser = budgetState.ownerIDs.find(
    (owner) => owner._id === formInput.userID
  );

  function audit() {
    const currentAuditState = { ...auditState },
      currentFormState = { ...formInput };

    const auditField = [];

    const monthRequired = ["startMonth", "endMonth"];
    monthRequired.map((field) => {
      currentAuditState[field] = /^\d{4}-\d{2}$/.test(currentFormState[field] || "");
      auditField.push(currentAuditState[field]);
    });
    // start can't be after end
    if (currentAuditState.startMonth && currentAuditState.endMonth &&
        currentFormState.startMonth > currentFormState.endMonth) {
      currentAuditState.startMonth = false;
      currentAuditState.endMonth = false;
      auditField.push(false);
    }

    const textRequired = ["userID"];
    textRequired.map((field) => {
      currentAuditState[field] = currentFormState[field].length > 0;
      auditField.push(currentAuditState[field]);
    });

    currentAuditState.pass =
      auditField.filter((x) => x === true).length === auditField.length;

    setAuditState({ ...currentAuditState });
    return;
  }

  useEffect(() => {
    audit();
  }, [formInput]);

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
      startDate: monthStart(formInput.startMonth),
      endDate: monthEnd(formInput.endMonth),
    };
    setReportRange({ start: formInput.startMonth, end: formInput.endMonth });
    getCustomReport({ variables });
  }

  return (
    <section className="full-container">
      {header}
      <form autoComplete="off">
        <InlineUserInput
          prop={"userID"}
          input={formInput}
          setInput={setFormInput}
          label={"User"}
          optionList={budgetState.ownerIDs}
          auditState={auditState}
        />
        <div className="month-range">
          <InlineMonthInput
            prop={"startMonth"}
            input={formInput}
            setInput={setFormInput}
            label={"From"}
            max={formInput.endMonth}
            auditState={auditState}
          />
          <InlineMonthInput
            prop={"endMonth"}
            input={formInput}
            setInput={setFormInput}
            label={"To"}
            min={formInput.startMonth}
            auditState={auditState}
          />
        </div>
      </form>
      <ActionButton
        action={runGetCustomReport}
        text={"Get Report"}
        additionalClass={"large-button"}
        disabled={!auditState.pass}
      />
      {auditState.pass && statementUser && (
        <div className="statement-row">
          <span>
            PDF statement for {statementUser.userInitials || statementUser.email},{" "}
            {formInput.startMonth === formInput.endMonth
              ? monthTitle(formInput.startMonth)
              : `${monthTitle(formInput.startMonth)} – ${monthTitle(formInput.endMonth)}`}
          </span>
          <StatementButton
            budgetID={_id}
            user={statementUser}
            startMonth={monthLabel(formInput.startMonth)}
            endMonth={monthLabel(formInput.endMonth)}
            text={"Download"}
          />
        </div>
      )}
      {reportData?.requestCustomReport ? (
        <>
          <section
            id="month-summary"
            key={`results`}
            className="card margin-top-full"
          >
            <h2 className="card-header card-title noselect">
              {reportRange &&
                (reportRange.start === reportRange.end
                  ? monthTitle(reportRange.start)
                  : `${monthTitle(reportRange.start)} – ${monthTitle(reportRange.end)}`)}
            </h2>
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

const REPORT_KINDS = [
  { value: "people", label: "People", icon: FiUsers },
  { value: "vehicles", label: "Vehicles", icon: LuCar },
];

// statements per person, or a vehicle's fuel and maintenance report
const Reports = (props) => {
  const [kind, setKind] = useState("people");
  const header = (
    <>
      <Title text={`Reports`} />
      <div className="segmented report-kind" role="radiogroup" aria-label="Report type">
        {REPORT_KINDS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={kind === value}
            className={`segmented-option${kind === value ? " segmented-active" : ""}`}
            onClick={() => setKind(value)}
          >
            <Icon />
            {label}
          </button>
        ))}
      </div>
    </>
  );

  return kind === "people" ? (
    <PersonReports {...props} header={header} />
  ) : (
    <section className="full-container">
      {header}
      <VehicleReports budgetState={props.budgetState} />
    </section>
  );
};

export default Reports;
