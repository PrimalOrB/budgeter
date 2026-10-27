import React, { useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { BudgetCategoryEntriesExpandableList } from ".";
import { toCurrency } from "../../utils/helpers";

const BudgetCategoryExpandableList = ({
  category,
  data,
  setEditingModal,
  setEditingTransaction,
}) => {
  const [expandedState, setExpandedState] = useState(false);

  return (
    <>
      <li className="category-row">
        <button
          type="button"
          className="category-row-button"
          aria-expanded={expandedState}
          onClick={() => setExpandedState(!expandedState)}
        >
          <FiChevronDown
            className={`chevron${expandedState ? " chevron-open" : ""}`}
            aria-hidden="true"
          />
          <span className="category-title noselect">{category.title}</span>
          <span className="category-count noselect">{data.length}</span>
          {category?.totalIndividual ? (
            <span className="personal-cost noselect" title="Your share">
              {toCurrency(category.totalIndividual)}
            </span>
          ) : null}
          <span className="category-total noselect">
            {toCurrency(category.total)}
          </span>
        </button>
      </li>
      {expandedState && (
        <li className="category-entries">
          <ul className="entry-list">
            {data.map((entry) => (
              <BudgetCategoryEntriesExpandableList
                key={entry._id}
                entry={entry}
                setEditingModal={setEditingModal}
                setEditingTransaction={setEditingTransaction}
              />
            ))}
          </ul>
        </li>
      )}
    </>
  );
};

export default BudgetCategoryExpandableList;
