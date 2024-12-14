import React, { useState, useEffect } from "react";
import { ActionButton } from "../Buttons";
import { titleCaseString } from "../../utils/helpers";

const EditModal = ({
  setPageState,
  editingModal,
  setEditingModal,
  editingTransaction,
  setEditingTransaction,
}) => {
  const [editingType, setEditingType] = useState("");

  useEffect(() => {
    if (editingTransaction?.__typename) {
      let type;
      if (
        (editingTransaction.__typename === "Entry" ||
          editingTransaction.__typename === "ReportEntry") &&
        editingTransaction.valueType === "transfer"
      ) {
        type = "transfer";
      } else if (
        (editingTransaction.__typename === "Entry" ||
          editingTransaction.__typename === "ReportEntry") &&
        ["expense", "income"].includes(editingTransaction.valueType)
      ) {
        type = "transaction";
      } else if (editingTransaction.__typename === "Category") {
        type = "category";
      } else {
        type = "";
      }
      return setEditingType(type);
    }
  }, [editingTransaction]);

  const setEditing = () => {
    setEditingTransaction(editingTransaction._id);
    setPageState(`edit-${editingType}`);
    return setEditingModal(false);
  };

  const cancelEditing = () => {
    setEditingTransaction(null);
    setEditingType("");
    return setEditingModal(false);
  };

  return (
    <>
      <div className={`modal-pane ${editingModal ? "" : "modal-hidden"}`}>
        <div className="modal-window">
          <ActionButton
            action={setEditing}
            text={`Edit ${titleCaseString(editingType)}`}
            additionalClass={"large-button margin-top-none"}
          />
          <ActionButton
            action={cancelEditing}
            text={"Cancel"}
            additionalClass={"large-button"}
          />
        </div>
        <div className="modal-bg" onClick={cancelEditing}></div>
      </div>
    </>
  );
};

export default EditModal;
