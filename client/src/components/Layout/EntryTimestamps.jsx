import React from "react";
import { FiClock } from "react-icons/fi";
import { formatEntryDate } from "../../utils/helpers";

// created/edited audit info; the effective date itself is edited in the form
const EntryTimestamps = ({ entry }) => {
  if (!entry?.createdAt) {
    return null;
  }

  const edited =
    entry.updatedAt && entry.updatedAt - entry.createdAt > 1000
      ? entry.updatedAt
      : null;

  return (
    <p className="entry-timestamps">
      <FiClock aria-hidden="true" />
      <span>
        Created {formatEntryDate(entry.createdAt, "MMM d, yyyy 'at' h:mm a")}
      </span>
      {edited && (
        <span>
          · Edited {formatEntryDate(edited, "MMM d, yyyy 'at' h:mm a")}
        </span>
      )}
    </p>
  );
};

export default EntryTimestamps;
