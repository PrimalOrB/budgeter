import React, { useState, useEffect } from "react";
import { useParams } from "react-router";
import { useMutation } from "@apollo/client";
import { QUERY_CURRENT_BUDGET } from "../utils/mutations";
import { useStoreContext } from "../utils/GlobalState";
import { InlineError } from "../components/Notifications";
import { FullPageSpinLoader } from "../components/Loaders";
import { NavStateContainer } from "../components/Menus";
import { MultiMonthBudgetOverview } from "../components/Charts";
import { Title } from "../components/Layout";
import {
  AddCategory,
  AddTransactionEntry,
  EditTransactionEntry,
  AddTransferEntry,
  EditTransferEntry,
  RecentTransactions,
  AllCategories,
  EditCategory,
  MonthSummary,
  Reports,
} from ".";
import { dateToMonthStr } from "../utils/helpers";
import { format } from "date-fns";
import {
  FaCaretUp,
  FaCaretDown,
  FaFolder,
  FaHome,
  FaListUl,
} from "react-icons/fa";
import { BiTransferAlt } from "react-icons/bi";

const Budget = ({
  pageState,
  setPageState,
  editingModal,
  setEditingModal,
  editingTransaction,
  setEditingTransaction,
}) => {
  const { id: _id } = useParams();

  const [state] = useStoreContext();
  const { currentUser } = state;

  const [v, setV] = useState(0);
  const [budgetState, setBudgetState] = useState({});
  const [errorState, setErrorState] = useState();

  const [highlightMonthState, setHighlightMonthState] = useState(
    format(new Date(), "M/yy")
  );

  const [paginateState, setPaginateState] = useState({
    limit: 6,
    offset: 0,
    page: 0,
    length: 0,
  });

  const [queryBudget, { loading: queryLoading, error: queryError }] =
    useMutation(QUERY_CURRENT_BUDGET, {
      variables: {
        input: {
          user: currentUser._id,
          budget: _id,
        },
      },
      update: (cache, data) => {
        try {
          if (data.data.queryBudget) {
            setV(v + 1);
            setPaginateState({
              ...paginateState,
              length: data.data.queryBudget.entries.length,
            });
            setBudgetState({ ...data.data.queryBudget });
            setHighlightMonthState(dateToMonthStr(new Date()));
          }
        } catch (e) {
          console.log(e);
        }
      },
      onError: (err) => {
        setErrorState(err.message);
      },
    });

  // onload run query
  useEffect(() => {
    if (currentUser?._id) {
      queryBudget();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  if (errorState) {
    return <InlineError text={errorState} />;
  }

  // buttons
  const buttons = [
    {
      text: "Overview",
      desc: "",
      link: `dashboard`,
      svg: FaHome,
      svgClass: "icon-margin",
    },
    {
      text: "Add Expense",
      desc: "",
      link: `add-expense`,
      svg: FaCaretDown,
      svgClass: "sub",
    },
    {
      text: "Add Income",
      desc: "",
      link: `add-income`,
      svg: FaCaretUp,
      svgClass: "add",
    },
    {
      text: "Transfer",
      desc: "",
      link: `add-transfer`,
      svg: BiTransferAlt,
      svgClass: "transfer",
    },
    {
      text: "Reports",
      desc: "",
      link: `reports`,
      svg: FaListUl,
      svgClass: "icon-margin",
    },
    {
      text: "Categories",
      desc: "",
      link: `categories`,
      svg: FaFolder,
      svgClass: "icon-margin",
    },
  ];

  return (
    <>
      {/* <EditModal/> */}
      {budgetState?.title && (
        <>
          <Title
            id={"budget-title"}
            text={budgetState.title}
            additionalClass={"margin-bottom-none noselect"}
          />
          <NavStateContainer
            id={"budget-menu"}
            buttons={buttons}
            state={pageState}
            setState={setPageState}
            addClass={"margin-top-none"}
          />
          {pageState === "dashboard" && (
            <>
              <h3
                id="budget-description"
                className="container-description noselect"
              >
                {budgetState.desc}
              </h3>
              {budgetState && (
                <MultiMonthBudgetOverview
                  key={`monthly_${v}`}
                  budget={budgetState}
                  highlightMonthState={highlightMonthState}
                  setHighlightMonthState={setHighlightMonthState}
                />
              )}
              <RecentTransactions
                key={`recent_${v}`}
                budget={budgetState}
                categories={budgetState.categories}
                paginateState={paginateState}
                setPaginateState={setPaginateState}
                setEditingModal={setEditingModal}
                setEditingTransaction={setEditingTransaction}
              />
              <MonthSummary
                key={`summary_${v}`}
                highlightMonthState={highlightMonthState}
                budget={budgetState}
                categories={budgetState.categories}
                setPageState={setPageState}
                setEditingModal={setEditingModal}
                setEditingTransaction={setEditingTransaction}
              />
            </>
          )}
          {pageState === "add-expense" && (
            <>
              <AddTransactionEntry
                categoryType={"expense"}
                budgetState={budgetState}
                setPageState={setPageState}
                refetch={queryBudget}
              />
            </>
          )}
          {pageState === "add-income" && (
            <>
              <AddTransactionEntry
                categoryType={"income"}
                budgetState={budgetState}
                setPageState={setPageState}
                refetch={queryBudget}
              />
            </>
          )}
          {pageState === "add-transfer" && (
            <>
              <AddTransferEntry
                categoryType={"transfer"}
                budgetState={budgetState}
                setPageState={setPageState}
                refetch={queryBudget}
              />
            </>
          )}
          {pageState === "categories" && (
            <>
              <AllCategories
                categories={budgetState.categories}
                setPageState={setPageState}
                setEditingModal={setEditingModal}
                setEditingTransaction={setEditingTransaction}
              />
            </>
          )}
          {pageState === "add-category" && (
            <>
              <AddCategory
                id={_id}
                refetch={queryBudget}
                setPageState={setPageState}
              />
            </>
          )}
          {pageState === "edit-transaction" && (
            <>
              <EditTransactionEntry
                editingID={editingTransaction}
                budgetState={budgetState}
                refetch={queryBudget}
                setPageState={setPageState}
              />
            </>
          )}
          {pageState === "edit-transfer" && (
            <>
              <EditTransferEntry
                editingID={editingTransaction}
                budgetState={budgetState}
                refetch={queryBudget}
                setPageState={setPageState}
              />
            </>
          )}
          {pageState === "edit-category" && (
            <>
              <EditCategory
                refetch={queryBudget}
                setPageState={setPageState}
                editingTransaction={editingTransaction}
              />
            </>
          )}
          {pageState === "reports" && (
            <>
              <Reports
                budgetState={budgetState}
                categories={budgetState.categories}
                setErrorState={setErrorState}
                setPageState={setPageState}
                setEditingModal={setEditingModal}
                setEditingTransaction={setEditingTransaction}
              />
            </>
          )}
        </>
      )}
      {queryLoading && (
        <section className="full-container">
          <FullPageSpinLoader />
        </section>
      )}
    </>
  );
};

export default Budget;
