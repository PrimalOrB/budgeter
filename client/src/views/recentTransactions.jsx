import React from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { EntryRow } from "../components/Layout";
import useMediaQuery, { DESKTOP_QUERY } from "../utils/useMediaQuery";

// mobile shows a short page; desktop scrolls within the card, which is
// stretched to the height of the chart + month summary column
const PAGE_SIZE_MOBILE = 10;
const PAGE_SIZE_DESKTOP = 25;

const RecentTransactions = ({
  budget,
  categories,
  paginateState,
  setPaginateState,
  setEditingModal,
  setEditingTransaction,
}) => {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const limit = isDesktop ? PAGE_SIZE_DESKTOP : PAGE_SIZE_MOBILE;

  const setPage = (page) => setPaginateState({ ...paginateState, page });

  const transactions = budget.months
    .flatMap((month) => month.entries)
    .sort((a, b) => b.effectiveDate - a.effectiveDate || b.createdAt - a.createdAt);

  const pageCount = Math.max(1, Math.ceil(transactions.length / limit)),
    // stay in range when the page size changes or months are merged in
    page = Math.min(paginateState.page, pageCount - 1),
    offset = page * limit,
    isFirstPage = page === 0,
    isLastPage = page >= pageCount - 1;

  const setAsEditing = (entry) => {
    setEditingModal(true);
    return setEditingTransaction(entry);
  };

  return (
    <section id="recent-transactions" className="card">
      <div className="card-header">
        <h2 className="card-title noselect">Recent transactions</h2>
        <div className="pager">
          <span className="pager-label noselect">
            {page + 1} / {pageCount}
          </span>
          <button
            type="button"
            className="icon-button icon-button-sm"
            onClick={() => setPage(page - 1)}
            disabled={isFirstPage}
            aria-label="Newer transactions"
          >
            <FiChevronLeft />
          </button>
          <button
            type="button"
            className="icon-button icon-button-sm"
            onClick={() => setPage(page + 1)}
            disabled={isLastPage}
            aria-label="Older transactions"
          >
            <FiChevronRight />
          </button>
        </div>
      </div>
      <ul className="entry-list">
        {transactions.length === 0 && (
          <li className="empty-state">No recent transactions</li>
        )}
        {transactions
          .slice(offset, offset + limit)
          .map((entry) => (
            <EntryRow
              key={`recent_${entry._id}`}
              entry={entry}
              category={categories.find(
                (category) => category._id === entry.categoryID
              )}
              onSelect={setAsEditing}
            />
          ))}
      </ul>
    </section>
  );
};

export default RecentTransactions;
