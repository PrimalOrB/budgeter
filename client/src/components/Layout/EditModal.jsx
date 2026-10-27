import React, { useState, useEffect } from "react";
import { FiEdit2, FiX } from "react-icons/fi";
import { ActionButton } from "../Buttons";
import { titleCaseString, toCurrency, formatEntryDate } from "../../utils/helpers";
import { entryAmountClass, TransferDirection } from "./EntryRow";

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

  // close on Escape
  useEffect(() => {
    if (!editingModal) {
      return;
    }
    const onKeyDown = (e) => e.key === "Escape" && cancelEditing();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingModal]);

  if (!editingModal) {
    return null;
  }

  const isEntry = editingType === "transaction" || editingType === "transfer";
  const entry = editingTransaction;

  return (
    <div className="modal-pane" role="dialog" aria-modal="true">
      <div className="modal-bg" onClick={cancelEditing}></div>
      <div className="modal-window">
        <div className="modal-header">
          <span className="modal-eyebrow">
            {titleCaseString(isEntry ? entry?.valueType || "" : editingType)}
          </span>
          <button
            type="button"
            className="icon-button icon-button-sm"
            onClick={cancelEditing}
            aria-label="Close"
          >
            <FiX />
          </button>
        </div>
        {isEntry && entry?._id ? (
          <>
            {entry.valueType === "transfer" ? (
              <div className="modal-transfer">
                <TransferDirection entry={entry} />
                <span>
                  {entry.userID?.userInitials} to {entry.toUserID?.userInitials}
                </span>
              </div>
            ) : (
              <h2 className="modal-title">{entry.title}</h2>
            )}
            <p className={`modal-amount ${entryAmountClass(entry)}`}>
              {toCurrency(Math.abs(entry.value))}
            </p>
            {entry.valueType === "transfer" && entry.title && (
              <p className="modal-note">{entry.title}</p>
            )}
            <dl className="detail-list">
              <dt>Effective date</dt>
              <dd>{formatEntryDate(entry.effectiveDate)}</dd>
              <dt>Created</dt>
              <dd>
                {formatEntryDate(entry.createdAt, "MMM d, yyyy 'at' h:mm a")}
              </dd>
              <dt>{entry.valueType === "transfer" ? "From" : "By"}</dt>
              <dd>{entry.userID?.email}</dd>
              {entry.valueType === "transfer" && (
                <>
                  <dt>To</dt>
                  <dd>{entry.toUserID?.email}</dd>
                </>
              )}
              {entry.valueType !== "transfer" && (
                <>
                  <dt>Split</dt>
                  <dd>{entry.individualEntry ? "Individual" : "Shared"}</dd>
                </>
              )}
            </dl>
          </>
        ) : (
          <h2 className="modal-title">{entry?.title}</h2>
        )}
        <div className="modal-actions">
          <ActionButton
            action={cancelEditing}
            text={"Cancel"}
            additionalClass={"btn-secondary"}
          />
          <ActionButton
            action={setEditing}
            icon={FiEdit2}
            text={`Edit ${editingType}`}
            additionalClass={"btn-primary"}
          />
        </div>
      </div>
    </div>
  );
};

export default EditModal;
