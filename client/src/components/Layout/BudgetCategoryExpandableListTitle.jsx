import React from "react";
import { FiChevronDown } from "react-icons/fi";
import { toCurrency } from "../../utils/helpers";

const BudgetCategoryExpandableTitle = ({
  data,
  title,
  expandedProp,
  individualProp,
  totalProp,
  definedValue,
  expandedState,
  setExpandedState,
}) => {
  const isExpanded = !!expandedState[expandedProp];
  const value = totalProp
    ? data[totalProp]
    : definedValue !== undefined
    ? definedValue
    : null;

  return (
    <li className="group-header">
      <button
        type="button"
        className="group-header-button"
        aria-expanded={isExpanded}
        onClick={() =>
          setExpandedState({
            ...expandedState,
            [expandedProp]: !isExpanded,
          })
        }
      >
        <FiChevronDown
          className={`chevron${isExpanded ? " chevron-open" : ""}`}
          aria-hidden="true"
        />
        <span className="group-title noselect">{title}</span>
        {individualProp && (
          <span className="personal-cost noselect" title="Your share">
            {toCurrency(data[individualProp])}
          </span>
        )}
        {value !== null && (
          <span className="group-total noselect">{toCurrency(value)}</span>
        )}
      </button>
    </li>
  );
};

export default BudgetCategoryExpandableTitle;
