import React from "react";
import EntryRow from "./EntryRow";

const BudgetCategoryEntriesExpandableList = ({
  entry,
  setEditingModal,
  setEditingTransaction,
}) => {
  const setAsEditing = (entry) => {
    setEditingModal(true);
    return setEditingTransaction(entry);
  };

  return <EntryRow entry={entry} onSelect={setAsEditing} compact />;
};

export default BudgetCategoryEntriesExpandableList;
