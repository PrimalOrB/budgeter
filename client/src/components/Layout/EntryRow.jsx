import React from "react";
import { MdPerson, MdPeople } from "react-icons/md";
import { FiArrowRight } from "react-icons/fi";
import { toCurrency, formatEntryDate } from "../../utils/helpers";

// amount style: income/expense, negative values are refunds/reversals
export function entryAmountClass(entry) {
  if (entry.valueType === "transfer") {
    return "transfer-text";
  }
  if (entry.valueType === "income") {
    return entry.value < 0 ? "reverse" : "positive";
  }
  return entry.value < 0 ? "credit" : "negative";
}

export const UserAvatar = ({ user }) => (
  <span
    className="initials-icon noselect"
    style={{
      backgroundColor: user.userColor ? `#${user.userColor}` : undefined,
    }}
    title={user.email}
  >
    {(user.userInitials || user.email[0]).toUpperCase()}
  </span>
);

// transfers show who paid whom instead of the shared/individual icon
export const TransferDirection = ({ entry }) => (
  <span
    className="transfer-direction"
    title={`${entry.userID.email} → ${entry.toUserID?.email}`}
  >
    <UserAvatar user={entry.userID} />
    <FiArrowRight className="transfer-arrow" aria-label="to" />
    {entry.toUserID && <UserAvatar user={entry.toUserID} />}
  </span>
);

const EntryRow = ({ entry, category, onSelect, compact }) => {
  const isTransfer = entry.valueType === "transfer";
  const label = isTransfer ? "Transfer" : category?.title || "—";
  // a transfer's title is an optional note
  const text = isTransfer && compact ? entry.title || "Transfer" : entry.title;

  return (
    <li className={`entry-row${compact ? " entry-row-compact" : ""}`}>
      <button
        type="button"
        className="entry-row-button"
        onClick={() => onSelect(entry)}
      >
        <span className="entry-main">
          {!compact && <span className="entry-category">{label}</span>}
          {text && <span className="entry-title">{text}</span>}
        </span>
        <span className="entry-date">
          {formatEntryDate(entry.effectiveDate, "MMM d")}
        </span>
        <span className={`entry-amount ${entryAmountClass(entry)}`}>
          {toCurrency(Math.abs(entry.value))}
        </span>
        <span className="entry-meta">
          {isTransfer ? (
            <TransferDirection entry={entry} />
          ) : (
            <>
              <UserAvatar user={entry.userID} />
              <span
                className="individual-icon"
                title={entry.individualEntry ? "Individual" : "Shared"}
              >
                {entry.individualEntry ? <MdPerson /> : <MdPeople />}
              </span>
            </>
          )}
        </span>
      </button>
    </li>
  );
};

export default EntryRow;
