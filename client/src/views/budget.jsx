import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router";
import { useMutation, useApolloClient } from "@apollo/client";
import { QUERY_CURRENT_BUDGET } from "../utils/mutations";
import { REQUEST_BUDGET_MONTHS } from "../utils/queries";
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
  BudgetSettings,
} from ".";
import {
  dateToMonthStr,
  shiftMonthLabel,
  compareMonthLabels,
  monthWindow,
  mergeMonths,
} from "../utils/helpers";

// months shown in the overview chart, and how many older months to fetch
// at once when paging back past what's loaded
const CHART_MONTHS = 6;
const FETCH_BATCH = 6;
import {
  FiGrid,
  FiMinusCircle,
  FiPlusCircle,
  FiRepeat,
  FiBarChart2,
  FiFolder,
  FiSettings,
} from "react-icons/fi";

const Budget = ({
  pageState,
  setPageState,
  editingModal,
  setEditingModal,
  editingTransaction,
  setEditingTransaction,
  dataVersion,
}) => {
  const { id: _id } = useParams();

  const [state] = useStoreContext();
  const { currentUser } = state;

  const [v, setV] = useState(0);
  const [budgetState, setBudgetState] = useState({});
  const [errorState, setErrorState] = useState();

  const currentMonth = dateToMonthStr(new Date());
  const [highlightMonthState, setHighlightMonthState] = useState(currentMonth);
  // last (newest) month shown in the overview chart
  const [windowEndState, setWindowEndState] = useState(currentMonth);
  const [loadingMonths, setLoadingMonths] = useState(false);
  const pendingMonths = useRef(new Set());

  const [paginateState, setPaginateState] = useState({ page: 0 });

  const client = useApolloClient();

  // fetch months that aren't loaded yet and merge them into the budget
  const fetchMonths = async (labels) => {
    const wanted = labels.filter((label) => !pendingMonths.current.has(label));
    if (!wanted.length) {
      return;
    }
    wanted.forEach((label) => pendingMonths.current.add(label));
    setLoadingMonths(true);
    try {
      const { data } = await client.query({
        query: REQUEST_BUDGET_MONTHS,
        variables: { budgetID: _id, months: wanted },
        fetchPolicy: "network-only",
      });
      setBudgetState((prev) => ({
        ...prev,
        months: mergeMonths(prev.months, data.requestBudgetMonths),
      }));
    } catch (err) {
      setErrorState(err.message);
    } finally {
      wanted.forEach((label) => pendingMonths.current.delete(label));
      setLoadingMonths(pendingMonths.current.size > 0);
    }
  };

  // move the focused month; the chart window slides to keep it in view
  const navigateMonth = (delta) => {
    const next = shiftMonthLabel(highlightMonthState, delta);
    if (compareMonthLabels(next, currentMonth) > 0) {
      return;
    }
    const windowStart = shiftMonthLabel(windowEndState, -(CHART_MONTHS - 1));
    let windowEnd = windowEndState;
    if (compareMonthLabels(next, windowStart) < 0) {
      windowEnd = shiftMonthLabel(next, CHART_MONTHS - 1);
    } else if (compareMonthLabels(next, windowEndState) > 0) {
      windowEnd = next;
    }
    setHighlightMonthState(next);
    setWindowEndState(windowEnd);

    // once the window reaches unloaded months, load them plus a batch further
    // back so the next few clicks don't each wait on the server
    const loaded = new Set((budgetState.months || []).map((m) => m.label));
    const visible = monthWindow(windowEnd, CHART_MONTHS);
    if (visible.some((label) => !loaded.has(label))) {
      const prefetch = monthWindow(shiftMonthLabel(visible[0], -1), FETCH_BATCH);
      fetchMonths(
        [...new Set([...visible, ...prefetch])].filter(
          (label) => !loaded.has(label)
        )
      );
    }
  };

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
            const fresh = data.data.queryBudget;
            const freshLabels = new Set(fresh.months.map((m) => m.label));
            // older months paged in earlier: keep them, and refresh them since
            // an edit may have moved entries into or out of them
            const older = (budgetState.months || [])
              .map((m) => m.label)
              .filter((label) => !freshLabels.has(label));

            setV((prev) => prev + 1);
            setBudgetState((prev) => ({
              ...fresh,
              months: mergeMonths(prev.months, fresh.months),
            }));
            if (older.length) {
              fetchMonths(older);
            }
          }
        } catch (e) {
          console.log(e);
        }
      },
      onError: (err) => {
        setErrorState(err.message);
      },
    });

  // onload run query, and again when the entry dialog changes data
  useEffect(() => {
    if (currentUser?._id) {
      queryBudget();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, dataVersion]);

  if (errorState) {
    return (
      <div className="page">
        <InlineError text={errorState} />
      </div>
    );
  }

  // buttons
  const buttons = [
    {
      text: "Overview",
      desc: "",
      link: `dashboard`,
      svg: FiGrid,
      svgClass: "icon-margin",
    },
    {
      text: "Add Expense",
      desc: "",
      link: `add-expense`,
      svg: FiMinusCircle,
      svgClass: "sub",
    },
    {
      text: "Add Income",
      desc: "",
      link: `add-income`,
      svg: FiPlusCircle,
      svgClass: "add",
    },
    {
      text: "Transfer",
      desc: "",
      link: `add-transfer`,
      svg: FiRepeat,
      svgClass: "transfer",
    },
    {
      text: "Reports",
      desc: "",
      link: `reports`,
      svg: FiBarChart2,
      svgClass: "icon-margin",
    },
    {
      text: "Categories",
      desc: "",
      link: `categories`,
      svg: FiFolder,
      svgClass: "icon-margin",
    },
    {
      text: "Settings",
      desc: "",
      link: `settings`,
      svg: FiSettings,
      svgClass: "icon-margin",
    },
  ];

  return (
    <>
      {/* <EditModal/> */}
      {budgetState?.title && (
        <div className="page budget-page">
          <Title
            id={"budget-title"}
            text={budgetState.title}
            subtitle={budgetState.desc}
          />
          <NavStateContainer
            id={"budget-menu"}
            buttons={buttons}
            state={pageState}
            setState={setPageState}
          />
          {pageState === "dashboard" && (
            <div className="dashboard-grid">
              <div className="dashboard-chart">
                <MultiMonthBudgetOverview
                  budget={budgetState}
                  windowEnd={windowEndState}
                  monthCount={CHART_MONTHS}
                  highlightMonthState={highlightMonthState}
                  setHighlightMonthState={setHighlightMonthState}
                  onNavigate={navigateMonth}
                  canGoForward={
                    compareMonthLabels(highlightMonthState, currentMonth) < 0
                  }
                  loading={loadingMonths}
                />
              </div>
              <div className="dashboard-recent">
                <RecentTransactions
                  budget={budgetState}
                  categories={budgetState.categories}
                  paginateState={paginateState}
                  setPaginateState={setPaginateState}
                  setEditingModal={setEditingModal}
                  setEditingTransaction={setEditingTransaction}
                />
              </div>
              <div className="dashboard-summary">
                <MonthSummary
                  key={`summary_${v}`}
                  highlightMonthState={highlightMonthState}
                  budget={budgetState}
                  categories={budgetState.categories}
                  setPageState={setPageState}
                  setEditingModal={setEditingModal}
                  setEditingTransaction={setEditingTransaction}
                />
              </div>
            </div>
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
          {pageState === "settings" && (
            <BudgetSettings
              key={`settings_${v}`}
              budgetState={budgetState}
              refetch={queryBudget}
            />
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
        </div>
      )}
      {queryLoading && <FullPageSpinLoader />}
    </>
  );
};

export default Budget;
