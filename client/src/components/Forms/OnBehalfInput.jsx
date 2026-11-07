import React from "react";
import { FiUsers } from "react-icons/fi";

// an expense one owner pays for another: the cost is booked to the other
// owner alone, and a transfer from them back to the payer settles it
const OnBehalfInput = ({ input, setInput, owners }) => {
  const enabled = Boolean(input.onBehalfEnabled);
  const others = owners.filter((owner) => owner._id !== input.userID);

  // only budgets with someone else to pay for get the option
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

  const payer = owners.find((owner) => owner._id === input.userID);
  const beneficiary = owners.find((owner) => owner._id === input.onBehalfOfUserID);

  return (
    <div className={`fuel-panel${enabled ? " fuel-panel-open" : ""}`}>
      <div className="fuel-head">
        <span className="fuel-title">
          <FiUsers aria-hidden="true" /> Paid for someone else
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
          <span className="sr-only">Paid on behalf of another user</span>
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
            <span>
              {beneficiary
                ? `Booked as an individual cost for ${beneficiary.email}, with a transfer from them to ${payer?.email || "the payer"} to pay it back.`
                : "Pick who this was paid for."}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnBehalfInput;
