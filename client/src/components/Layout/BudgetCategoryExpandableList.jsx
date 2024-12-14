import React, { useState } from "react";
import { FaCaretDown, FaCaretUp } from "react-icons/fa";
import { MdSubdirectoryArrowRight } from "react-icons/md";
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
      <li
        className="flex nowrap flex-just-space-around f-full"
        onClick={() => setExpandedState(!expandedState)}
      >
        <span className="f0 margin-right-half">
          {MdSubdirectoryArrowRight()}
        </span>
        <span className="f0 margin-right-half">
          {expandedState ? FaCaretUp() : FaCaretDown()}
        </span>
        <span className="f1 bold noselect">{category.title}</span>
        {category?.totalIndividual ? (
          <span className="f1 italic noselect right margin-right-full personal-cost">
            {toCurrency(category.totalIndividual)}
          </span>
        ) : (
          <></>
        )}
        <span className="f0 italic noselect right margin-right-full">
          {toCurrency(category.total)}
        </span>
      </li>
      {expandedState &&
        data.map((entry) => {
          return (
            <BudgetCategoryEntriesExpandableList
              key={entry._id}
              entry={entry}
              setEditingModal={setEditingModal}
              setEditingTransaction={setEditingTransaction}
            />
          );
        })}
    </>
  );
};

export default BudgetCategoryExpandableList;
