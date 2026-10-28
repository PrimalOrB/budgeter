import React from "react";
import { MdPerson, MdPeople } from "react-icons/md";
import { FiArrowRight } from "react-icons/fi";
import { toCurrency, formatEntryDate } from "../../utils/helpers";
import { useMetaLink, entryMetaStat } from "../../utils/metaLinks";

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

// sits inside the row button, so it's a span that stops the row's click;
// keyboard users reach the same link from the entry dialog
const MetaLinkIcon = ({ link }) => (
  <span
    className="entry-meta-link"
    title={link.label}
    onClick={(e) => {
      e.stopPropagation();
      link.open();
    }}
  >
    <link.icon aria-hidden="true" />
  </span>
);

const EntryRow = ({ entry, category, onSelect, compact }) => {
  const isTransfer = entry.valueType === "transfer";
  const label = isTransfer ? "Transfer" : category?.title || "—";
  // a transfer's title is an optional note
  const text = isTransfer && compact ? entry.title || "Transfer" : entry.title;
  const metaLink = useMetaLink(entry);
  const metaStat = entryMetaStat(entry);

  return (
    <li className={`entry-row${compact ? " entry-row-compact" : ""}`}>
      <button
        type="button"
        className="entry-row-button"
        onClick={() => onSelect(entry)}
      >
        <span className="entry-main">
          {!compact && (
            <span className="entry-category">
              {label}
              {metaLink && <MetaLinkIcon link={metaLink} />}
            </span>
          )}
          {text && (
            <span className="entry-title">
              {text}
              {metaStat && <span className="entry-meta-stat">{metaStat}</span>}
              {compact && metaLink && <MetaLinkIcon link={metaLink} />}
            </span>
          )}
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
