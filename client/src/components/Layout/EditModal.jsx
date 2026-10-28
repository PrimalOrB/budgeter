import React, { useState, useEffect } from "react";
import { useMutation } from "@apollo/client";
import { useMetaLink, useVehicleName } from "../../utils/metaLinks";
import { FiEdit2, FiX, FiTrash2 } from "react-icons/fi";
import { DELETE_ENTRY } from "../../utils/mutations";
import { ActionButton } from "../Buttons";
import { titleCaseString, toCurrency, formatEntryDate } from "../../utils/helpers";
import { entryAmountClass, TransferDirection } from "./EntryRow";

const FuelSummary = ({ entry }) => {
  const vehicleName = useVehicleName(entry.mileage.vehicleID);
  const metaLink = useMetaLink(entry);
  const { pricePerLitre, litres, distance } = entry.mileage;
  const parts = [
    vehicleName,
    litres != null && `${litres} L`,
    pricePerLitre != null && `$${pricePerLitre.toFixed(3)}/L`,
    distance != null && `${distance} km`,
    litres && distance && `${((litres / distance) * 100).toFixed(1)} L/100 km`,
  ].filter(Boolean);
  return (
    <div className="modal-fuel">
      {parts.map((part) => (
        <span key={part}>{part}</span>
      ))}
      {metaLink && (
        <button type="button" className="modal-fuel-link" onClick={metaLink.open}>
          <metaLink.icon aria-hidden="true" /> Fuel log
        </button>
      )}
    </div>
  );
};

const EditModal = ({
  setPageState,
  editingModal,
  setEditingModal,
  editingTransaction,
  setEditingTransaction,
  onDataChanged,
}) => {
  const [editingType, setEditingType] = useState("");
  // deleting takes a second click to confirm
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const [deleteEntry, { loading: deleting }] = useMutation(DELETE_ENTRY, {
    onCompleted: () => {
      cancelEditing();
      setPageState("dashboard");
      onDataChanged?.();
    },
    onError: (err) => setDeleteError(err.message),
  });

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
    setConfirmingDelete(false);
    setDeleteError(null);
    return setEditingModal(false);
  };

  const confirmDelete = () =>
    deleteEntry({
      variables: {
        budgetID: editingTransaction.budgetID,
        entryID: editingTransaction._id,
      },
    });

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
            {entry.mileage && <FuelSummary entry={entry} />}
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
        {deleteError && (
          <div className="banner banner-error modal-banner" role="alert">
            {deleteError}
          </div>
        )}
        {confirmingDelete ? (
          <div className="modal-confirm">
            <p>
              Delete this {editingType} permanently? This can't be undone.
            </p>
            <div className="modal-actions">
              <ActionButton
                action={() => setConfirmingDelete(false)}
                text={"Keep it"}
                additionalClass={"btn-secondary"}
                disabled={deleting}
              />
              <ActionButton
                action={confirmDelete}
                icon={FiTrash2}
                text={deleting ? "Deleting…" : "Delete"}
                additionalClass={"btn-danger"}
                disabled={deleting}
              />
            </div>
          </div>
        ) : (
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
        )}
        {isEntry && !confirmingDelete && (
          <button
            type="button"
            className="modal-delete"
            onClick={() => setConfirmingDelete(true)}
          >
            <FiTrash2 aria-hidden="true" />
            Delete {editingType}
          </button>
        )}
      </div>
    </div>
  );
};

export default EditModal;
