import React from "react";
import { format } from "date-fns";
import { toCurrency } from "../utils/helpers";
import { MdPerson, MdPeople } from "react-icons/md";
import { FaCaretLeft, FaCaretRight } from "react-icons/fa";

const RecentTransactions = ({
  budget,
  categories,
  paginateState,
  setPaginateState,
  setEditingModal,
  setEditingTransaction,
}) => {
  function incrementPage() {
    setPaginateState({
      ...paginateState,
      offset: paginateState.offset + paginateState.limit,
      page: paginateState.page + 1,
    });
  }

  function decrementPage() {
    setPaginateState({
      ...paginateState,
      offset: paginateState.offset - paginateState.limit,
      page: paginateState.page - 1,
    });
  }

  let transactions = [];
  budget.months.map((month) => {
    transactions = [...transactions, ...month.entries];
  });
  transactions.sort((a, b) => b.createdAt - a.createdAt);

  const setAsEditing = (entry) => {
    setEditingModal(true);
    return setEditingTransaction(entry);
  };

  return (
    <section id="recent-transactions">
      <div className="sub-container-description section-list-title">
        {paginateState.page === 0 ? (
          <span className="margin-width-auto svg-sq-1-5 svg-fill-secondary">
            {FaCaretLeft()}
          </span>
        ) : (
          <span
            className="margin-width-auto svg-sq-1-5 svg-fill-highlight"
            onClick={decrementPage}
          >
            {FaCaretLeft()}
          </span>
        )}
        <h4 className="padding-0-3 noselect">Recent Transactions</h4>
        {paginateState.page + paginateState.offset > paginateState.length ? (
          <span className="margin-width-auto svg-sq-1-5 svg-fill-secondary">
            {FaCaretRight()}
          </span>
        ) : (
          <span
            className="margin-width-auto svg-sq-1-5 svg-fill-highlight"
            onClick={incrementPage}
          >
            {FaCaretRight()}
          </span>
        )}
      </div>
      <ul className="section-list">
        {transactions.length === 0 && (
          <li
            className={
              "flex-transaction-line-sm border-bot-hightlight-1 f-valign"
            }
          >
            No Recent Transactions
          </li>
        )}
        {transactions
          .slice(
            paginateState.offset,
            paginateState.limit + paginateState.offset
          )
          .map((entry) => {
            let type;
            if (entry.valueType === "income" && entry.value > 0) {
              type = 1;
            }
            if (entry.valueType === "income" && entry.value < 0) {
              type = 3;
            }
            if (entry.valueType === "expense" && entry.value > 0) {
              type = 0;
            }
            if (entry.valueType === "expense" && entry.value < 0) {
              type = 2;
            }
            if (entry.valueType === "transfer") {
              type = 4;
            }

            return (
              <li
                onClick={() => setAsEditing(entry)}
                key={`recent_${entry._id}`}
                className={
                  "flex-transaction-line-sm border-bot-hightlight-1 f-valign"
                }
              >
                <div className="flex f1 wrap padding-top-sm">
                  {entry.valueType === "transfer" ? (
                    <span className="margin-right-half colon bold f0 font-medium noselect">
                      Transfer
                    </span>
                  ) : (
                    <span className="margin-right-half colon bold f0 font-medium noselect">
                      {
                        categories.filter(
                          (category) => category._id === entry.categoryID
                        )[0].title
                      }
                    </span>
                  )}
                  <span className="f1 font-medium margin-left-half margin-right-half ellipsis noselect">
                    {entry.title}
                  </span>
                  <span className="indent-1 italic font-small f-full padding-bottom-sm noselect">
                    {format(entry.createdAt, "M/dd/yy")}
                  </span>
                </div>
                <span
                  className={`bold noselect f0${type === 0 ? " negative" : ""}${
                    type === 1 ? " positive" : ""
                  }${type === 2 ? " credit" : ""}${
                    type === 3 ? " reverse" : ""
                  }${type === 4 ? " transfer-text" : ""}`}
                >
                  {toCurrency(Math.abs(entry.value))}
                </span>
                <span
                  className="f0 initials-icon noselect"
                  style={{
                    backgroundColor: entry.userID.userColor
                      ? `#${entry.userID.userColor}`
                      : "#BBBBBB",
                  }}
                  title={entry.userID.email}
                >
                  {entry.userID.userInitials
                    ? entry.userID.userInitials.toUpperCase()
                    : entry.userID.email[0].toUpperCase()}
                </span>
                <span
                  className="f0 individual-icon margin-left-half noselect"
                  title={entry.individualEntry ? "Individual" : "Shared"}
                >
                  {entry.individualEntry ? MdPerson() : MdPeople()}
                </span>
              </li>
            );
          })}
      </ul>
    </section>
  );
};

export default RecentTransactions;
