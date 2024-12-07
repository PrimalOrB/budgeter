import React, { useState } from "react";
import { format } from "date-fns";
import { toCurrency, sumPropArray } from "../utils/helpers";
import {
  InlineBarTotal,
  InlineBarPerUser,
  InlineBarBalance,
  InlineBarPerUserBalance,
} from "../components/Charts";
import {
  BudgetCategoryExpandableList,
  BudgetCategoryEntriesExpandableList,
  PDFMonthlyUse,
} from "../components/Layout";
import { FaCaretDown, FaCaretUp } from "react-icons/fa";

const MonthSummary = ({
  budget,
  highlightMonthState,
  categories,
  transactions,
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

  const uniqueUsers = [
    ...new Set(transactions.map((entry) => entry.userID._id)),
  ].map((userID) => {
    const matchUser = transactions.find(
      (entry) => entry.userID._id === userID
    ).userID;
    return {
      userID,
      userColor: matchUser.userColor,
      userInitials: matchUser.userInitials,
      incomeTotal: 0,
      expensesTotal: 0,
      incomeShared: 0,
      expensesShared: 0,
      transfersOut: 0,
      transfersIn: 0,
      portionTotalExpenses: 0,
      portionTotalIncome: 0,
      balanceTotal: 0,
      portionSharedExpenses: 0,
      portionSharedIncome: 0,
      balanceShared: 0,
      responsibleExpenses: 0,
    };
  });

  // add expenses to users
  const expenseByMonth = transactions
    .filter((entry) => entry.valueType === "expense")
    .map((entry) => {
      const matchUser = uniqueUsers.findIndex((user) => {
        return user.userID === entry.userID._id;
      });
      if (matchUser >= 0) {
        uniqueUsers[matchUser].expensesTotal += entry.value;
      }
      return entry;
    });
  const expenseByMonthShared = transactions
    .filter((entry) => entry.valueType === "expense" && !entry.individualEntry)
    .map((entry) => {
      const matchUser = uniqueUsers.findIndex((user) => {
        return user.userID === entry.userID._id;
      });
      if (matchUser >= 0) {
        uniqueUsers[matchUser].expensesShared += entry.value;
      }
      return entry;
    });

  // add income to users
  const incomeByMonth = transactions
    .filter((entry) => entry.valueType === "income")
    .map((entry) => {
      const matchUser = uniqueUsers.findIndex((user) => {
        return user.userID === entry.userID._id;
      });
      if (matchUser >= 0) {
        uniqueUsers[matchUser].incomeTotal += entry.value;
      }
      return entry;
    });
  const incomeByMonthShared = transactions
    .filter((entry) => entry.valueType === "income" && !entry.individualEntry)
    .map((entry) => {
      const matchUser = uniqueUsers.findIndex((user) => {
        return user.userID === entry.userID._id;
      });
      if (matchUser >= 0) {
        uniqueUsers[matchUser].incomeShared += entry.value;
      }
      return entry;
    });

  // add transfers to users
  const transferByMonth = transactions
    .filter((entry) => entry.valueType === "transfer")
    .map((entry) => {
      const matchUserOut = uniqueUsers.findIndex((user) => {
        return user.userID === entry.userID._id;
      });
      if (matchUserOut >= 0) {
        uniqueUsers[matchUserOut].transfersOut += entry.value;
      }
      const matchUserIn = uniqueUsers.findIndex((user) => {
        return user.userID === entry.toUserID._id;
      });
      if (matchUserIn >= 0) {
        uniqueUsers[matchUserIn].transfersIn += entry.value;
      }
      return entry;
    });

  // run balances
  uniqueUsers.map((user) => {
    user.portionSharedExpenses =
      user.expensesShared / sumPropArray(expenseByMonthShared, "value");
    user.portionSharedIncome =
      user.incomeShared / sumPropArray(incomeByMonthShared, "value");
    user.portionTotalExpenses =
      user.expensesTotal / sumPropArray(expenseByMonth, "value");
    user.portionTotalIncome =
      user.incomeTotal / sumPropArray(incomeByMonth, "value");
    user.responsibleExpenses = Number(
      (
        sumPropArray(expenseByMonthShared, "value") * user.portionSharedIncome
      ).toFixed(2)
    );
    user.balanceAfterTransfer =
      user.responsibleExpenses - user.transfersOut + user.transfersIn;
    user.balancedIncome = user.incomeTotal + user.transfersIn;
    user.balancedExpenses = user.expensesTotal + user.transfersOut;
    user.userBalance = user.balanceAfterTransfer - user.expensesShared;
    return user;
  });

  return (
    <section id="month-summary" key={`${date}_results`}>
      <h4 className="sub-container-description section-list-title noselect">
        {format(date, "MMMM yyyy")}
      </h4>

      {/* balances section */}
      <ul className="monthly-group-detail border-b-l-rad-none border-b-r-rad-none border_b_none">
        <li
          className="flex nowrap flex-just-space-around f-full"
          onClick={() =>
            setExpandedState({
              ...expandedState,
              balance: !expandedState.balance,
            })
          }
        >
          <span className="f0 margin-right-half">
            {expandedState.balance ? FaCaretUp() : FaCaretDown()}
          </span>
          <span className="f1 bold noselect">Balance</span>
          <span className="f1 bold right noselect">
            {toCurrency(
              sumPropArray(incomeByMonth, "value") -
                sumPropArray(expenseByMonth, "value")
            )}
          </span>
        </li>
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
            {toCurrency(sumPropArray(expenseByMonth, "value"))}
          </span>
        </li>
        {expandedState.expense &&
          [...new Set(categories.map((category) => category._id))].map(
            (entry) => {
              const category = categories.filter(
                (category) => category._id === entry
              );
              const entries = expenseByMonth.filter(
                (entry) => entry.categoryID === category[0]._id
              );

              if (entries.length === 0) {
                return null;
              }

              return (
                <BudgetCategoryExpandableList
                  key={`exp_${category[0]._id}`}
                  category={category[0].title}
                  data={entries}
                  setPageState={setPageState}
                  setEditingTransaction={setEditingTransaction}
                />
              );
            }
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
            {toCurrency(sumPropArray(incomeByMonth, "value"))}
          </span>
        </li>
        {expandedState.income &&
          [...new Set(categories.map((category) => category._id))].map(
            (entry) => {
              const category = categories.filter(
                (category) => category._id === entry
              );
              const entries = incomeByMonth.filter(
                (entry) => entry.categoryID === category[0]._id
              );

              if (entries.length === 0) {
                return null;
              }

              return (
                <BudgetCategoryExpandableList
                  key={`inc_${category[0]._id}`}
                  category={category[0].title}
                  data={entries}
                  setPageState={setPageState}
                  setEditingTransaction={setEditingTransaction}
                />
              );
            }
          )}
      </ul>

      {/* transfer section */}
      <ul className="monthly-group-detail border-b-l-rad-none border-b-r-rad-none border_b_none border-t-l-rad-none border-t-r-rad-none">
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
            {toCurrency(sumPropArray(transferByMonth, "value"))}
          </span>
        </li>
        {expandedState.transfers &&
          transferByMonth.map((transfer) => {
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
        <li
          className="flex nowrap flex-just-space-around f-full"
          onClick={() =>
            setExpandedState({
              ...expandedState,
              reports: !expandedState.reports,
            })
          }
        >
          <span className="f0 margin-right-half">
            {expandedState.reports ? FaCaretUp() : FaCaretDown()}
          </span>
          <span className="f1 bold noselect">Reports</span>
        </li>
        {expandedState.reports &&
          (uniqueUsers.length ? (
            <li className="flex nowrap flex-just-space-around f-full">
              {uniqueUsers.map((user) => {
                return (
                  <PDFMonthlyUse
                    key={`${user.userID}_rpt`}
                    user={user}
                    date={date}
                    categories={categories}
                    expenses={expenseByMonth}
                    incomes={incomeByMonth}
                    transfers={transferByMonth}
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
