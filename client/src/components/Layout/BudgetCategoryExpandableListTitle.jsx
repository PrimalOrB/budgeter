import React, { useState } from "react";
import { FaCaretDown, FaCaretUp } from "react-icons/fa";
import { MdSubdirectoryArrowRight } from "react-icons/md";
import { BudgetCategoryEntriesExpandableList } from ".";
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
  return (
    <li
      className="flex nowrap flex-just-space-around f-full"
      onClick={() =>
        setExpandedState({
          ...expandedState,
          [expandedProp]: !expandedState[expandedProp],
        })
      }
    >
      <span className="f0 margin-right-half">
        {expandedState[expandedProp] ? FaCaretUp() : FaCaretDown()}
      </span>
      <span className="f1 bold noselect">{title}</span>
      {individualProp ? (
        <span className="f1 italic noselect right margin-right-full personal-cost">
          {individualProp ? toCurrency(data[individualProp]) : ""}
        </span>
      ) : (
        <></>
      )}
      <span className="f0 bold right noselect">
        {totalProp ? toCurrency(data[totalProp]) : ""}
        {definedValue ? toCurrency(definedValue) : ""}
      </span>
    </li>
  );
};

export default BudgetCategoryExpandableTitle;
