import React, { useState } from "react";
import { format } from "date-fns";
import { toCurrency } from "../utils/helpers";
import {
  InlineBarTotal,
  InlineBarPerUser,
  InlineBarBalance,
  InlineBarPerUserBalance,
} from "../components/Charts";
import {
  BudgetCategoryExpandableTitle,
  BudgetCategoryExpandableList,
  BudgetCategoryEntriesExpandableList,
  PDFMonthlyUser,
} from "../components/Layout";
import { FaCaretDown, FaCaretUp } from "react-icons/fa";

const MonthSummary = ({
  budget,
  highlightMonthState,
  categories,
  setPageState,
  setEditingTransaction,
}) => {
  const date = new Date(
    `20${Number(highlightMonthState.split("/")[1])}`,
    Number(highlightMonthState.split("/")[0]) - 1,
    1
  );

  const [expandedState, setExpandedState] = useState({
    income: false,
    expense: false,
    balance: false,
    transfers: false,
  });

  const monthData = budget.months.find(
    (month) => month.label === highlightMonthState
  );

  return (
    <section id="month-summary" key={`${date}_results`}>
      <h4 className="sub-container-description section-list-title noselect">
        {format(date, "MMMM yyyy")}
      </h4>

      {/* balances section */}
      <ul className="monthly-group-detail border-b-l-rad-none border-b-r-rad-none border_b_none">
        <BudgetCategoryExpandableTitle
          data={monthData}
          title={"Balance"}
          expandedProp={"balance"}
          expandedState={expandedState}
          definedValue={monthData.incomeTotal - monthData.expenseTotal}
          setExpandedState={setExpandedState}
        />
        {expandedState.balance && (
          <React.Fragment>
            <InlineBarTotal
              key={`${highlightMonthState}_iR`}
              inputData={monthData}
              title={["Income to Expenses Ratio", "Income", "Expenses"]}
              valueProp={["incomeTotal", "expenseTotal"]}
            />
            <InlineBarTotal
              key={`${highlightMonthState}_sR`}
              inputData={monthData}
              title={["Shared Income to Expenses Ratio", "Income", "Expenses"]}
              valueProp={["sharedIncomeTotal", "sharedExpenseTotal"]}
            />
            <InlineBarPerUser
              key={`${highlightMonthState}_sIn`}
              inputData={monthData}
              title={"Shared Income By User"}
              valueProp={"sharedIncomeTotal"}
            />
            <InlineBarPerUser
              key={`${highlightMonthState}_sOut`}
              inputData={monthData}
              title={"Shared Expenses By User"}
              valueProp={"sharedExpenseTotal"}
            />
            <InlineBarPerUser
              key={`${highlightMonthState}_tIn`}
              inputData={monthData}
              title={"Total Income By User"}
              valueProp={"incomeTotal"}
            />
            <InlineBarPerUser
              key={`${highlightMonthState}_tOut`}
              inputData={monthData}
              title={"Total Expenses By User"}
              valueProp={"expenseTotal"}
            />
            <InlineBarPerUser
              key={`${highlightMonthState}_uR`}
              inputData={monthData}
              title={"User Resposibility"}
              valueProp={"responsibilityTotal"}
            />
            <InlineBarBalance
              key={`${highlightMonthState}_B`}
              inputData={monthData}
              title={"Balance"}
              valueProp={"userBalance"}
              total={"expensesShared"}
            />
            {monthData.userData.map((user) => {
              return (
                <InlineBarPerUserBalance
                  key={`${highlightMonthState}_${user.userID._id}`}
                  inputData={user}
                  title={`${user.userInitials} Balance`}
                  valueProp={"balancedIncome"}
                  total={"balancedExpenses"}
                />
              );
            })}
          </React.Fragment>
        )}
      </ul>

      {/* expenses section */}
      <ul className="monthly-group-detail border-b-l-rad-none border-b-r-rad-none border_b_none border-t-l-rad-none border-t-r-rad-none">
        <BudgetCategoryExpandableTitle
          data={monthData}
          title={"Expenses"}
          expandedProp={"expense"}
          totalProp={"expenseTotal"}
          expandedState={expandedState}
          setExpandedState={setExpandedState}
        />
        {expandedState.expense ? (
          [...monthData.expenseCategories]
            .sort((a, b) => b.total - a.total)
            .map((entry) => {
              const findCategory = categories.find(
                (category) => category._id === entry.categoryID
              );

              const category = { ...entry, title: findCategory.title };

              const entries = monthData.entries
                .filter((entry) => entry.valueType === "expense")
                .filter((entry) => entry.categoryID === findCategory._id)
                .sort((a, b) => a.createdAt - b.createdAt);

              if (entries.length === 0) {
                return null;
              }

              return (
                <BudgetCategoryExpandableList
                  key={`exp_${category.categoryID}`}
                  category={category}
                  data={entries}
                  setPageState={setPageState}
                  setEditingTransaction={setEditingTransaction}
                />
              );
            })
        ) : (
          <></>
        )}
      </ul>

      {/* income section */}
      <ul className="monthly-group-detail border-b-l-rad-none border-b-r-rad-none border_b_none border-t-l-rad-none border-t-r-rad-none">
        <BudgetCategoryExpandableTitle
          data={monthData}
          title={"Income"}
          expandedProp={"income"}
          totalProp={"incomeTotal"}
          expandedState={expandedState}
          setExpandedState={setExpandedState}
        />
        {expandedState.income ? (
          [...monthData.incomeCategories]
            .sort((a, b) => b.total - a.total)
            .map((entry) => {
              const findCategory = categories.find(
                (category) => category._id === entry.categoryID
              );

              const category = { ...entry, title: findCategory.title };

              const entries = monthData.entries
                .filter((entry) => entry.valueType === "income")
                .filter((entry) => entry.categoryID === findCategory._id)
                .sort((a, b) => a.createdAt - b.createdAt);

              if (entries.length === 0) {
                return null;
              }

              return (
                <BudgetCategoryExpandableList
                  key={`exp_${category.categoryID}`}
                  category={category}
                  data={entries}
                  setPageState={setPageState}
                  setEditingTransaction={setEditingTransaction}
                />
              );
            })
        ) : (
          <></>
        )}
      </ul>

      {/* transfer section */}
      <ul className="monthly-group-detail border-b-l-rad-none border-b-r-rad-none border_b_none border-t-l-rad-none border-t-r-rad-none">
        <BudgetCategoryExpandableTitle
          data={monthData}
          title={"Transfers"}
          expandedProp={"transfers"}
          totalProp={"transferTotals"}
          expandedState={expandedState}
          setExpandedState={setExpandedState}
        />
        {expandedState.transfers &&
          [...monthData.entries]
            .filter((entry) => entry.valueType === "transfer")
            .sort((a, b) => a.createdAt - b.createdAt)
            .map((transfer) => {
              return (
                <BudgetCategoryEntriesExpandableList
                  key={transfer._id}
                  entry={transfer}
                  setPageState={setPageState}
                  setEditingTransaction={setEditingTransaction}
                />
              );
            })}
      </ul>

      {/* report section */}
      <ul className="monthly-group-detail border-t-l-rad-none border-t-r-rad-none">
        <BudgetCategoryExpandableTitle
          data={monthData}
          title={"Report"}
          expandedProp={"reports"}
          expandedState={expandedState}
          setExpandedState={setExpandedState}
        />
        {expandedState.reports &&
          (monthData.userData ? (
            <li className="flex nowrap flex-just-space-around f-full">
              {monthData.userData.map((user) => {
                return (
                  <PDFMonthlyUser
                    key={`${user.userID._id}_rpt`}
                    user={user}
                    date={date}
                    month={monthData}
                    budget={budget}
                  />
                );
              })}
            </li>
          ) : (
            <li className="flex nowrap flex-just-space-around f-full">Empty</li>
          ))}
      </ul>
    </section>
  );
};

export default MonthSummary;
