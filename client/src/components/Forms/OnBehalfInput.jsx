import React from "react";
import { FiUsers } from "react-icons/fi";

// an expense one owner pays, or income one owner receives, for another: it's
// booked to the other owner alone, with a transfer for the money moved between
// them (income: other owner -> receiver; expense: payer -> other owner)
const OnBehalfInput = ({ input, setInput, owners, categoryType }) => {
  const enabled = Boolean(input.onBehalfEnabled);
  const others = owners.filter((owner) => owner._id !== input.userID);
  const isIncome = categoryType === "income";
  const verb = isIncome ? "Received" : "Paid";

  // only budgets with someone else to act for get the option
  if (!owners.length || owners.length < 2) {
    return null;
  }

  const toggle = () => {
    const next = !enabled;
    setInput({
      ...input,
      onBehalfEnabled: next,
      // pre-pick when there's only one other owner
      onBehalfOfUserID: next && others.length === 1 ? others[0]._id : "",
    });
  };

  const actor = owners.find((owner) => owner._id === input.userID)?.email;
  const beneficiary = owners.find((owner) => owner._id === input.onBehalfOfUserID)?.email;

  const summary = !beneficiary
    ? `Pick who this was ${verb.toLowerCase()} for.`
    : isIncome
    ? `Booked as individual income for ${beneficiary}, with a transfer from them to ${actor || "the receiver"} to show it's held for them.`
    : `Booked as an individual cost for ${beneficiary}, with a transfer to them from ${actor || "the payer"} for the money spent on their behalf.`;

  return (
    <div className={`fuel-panel${enabled ? " fuel-panel-open" : ""}`}>
      <div className="fuel-head">
        <span className="fuel-title">
          <FiUsers aria-hidden="true" /> {verb} for someone else
          <span className="fuel-optional">optional</span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          className={`switch${enabled ? " switch-on" : ""}`}
          onClick={toggle}
        >
          <span className="switch-knob" />
          <span className="sr-only">{verb} on behalf of another user</span>
        </button>
      </div>

      {enabled && (
        <div className="fuel-body">
          <label className="fuel-field fuel-field-wide">
            <span>On behalf of</span>
            <select
              className={input.onBehalfOfUserID ? "audit-pass" : "audit-fail"}
              value={input.onBehalfOfUserID}
              onChange={(e) => setInput({ ...input, onBehalfOfUserID: e.target.value })}
            >
              <option value="" disabled></option>
              {others.map((owner) => (
                <option key={owner._id} value={owner._id}>
                  {owner.email}
                </option>
              ))}
            </select>
          </label>
          <div className="fuel-summary">
            <span>{summary}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnBehalfInput;
