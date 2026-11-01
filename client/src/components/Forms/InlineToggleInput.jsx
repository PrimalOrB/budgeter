import React from "react";

// an on/off setting with a short explanation, e.g. a category's auto-pay
const InlineToggleInput = ({ prop, input, setInput, label, hint }) => {
  const on = Boolean(input[prop]);
  return (
    <div className="form-inline-checkbox form-toggle">
      <div className="form-toggle-row">
        <span className="form-label">{label}</span>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={label}
          className={`switch${on ? " switch-on" : ""}`}
          onClick={() => setInput({ ...input, [prop]: !on })}
        >
          <span className="switch-knob" />
        </button>
      </div>
      {hint && <span className="form-hint">{hint}</span>}
    </div>
  );
};

export default InlineToggleInput;
