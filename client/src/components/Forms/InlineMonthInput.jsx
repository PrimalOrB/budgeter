import React from "react";

// month/year picker; the value is "yyyy-MM"
const InlineMonthInput = ({ prop, input, setInput, label, min, max, auditState }) => {
  const updateInput = (e) => {
    const { name, value } = e.target;
    if (value) {
      setInput({ ...input, [name]: value });
    }
  };

  return (
    <div className={"form-inline-date"}>
      <label className={"noselect"} htmlFor={prop}>
        {label}
      </label>
      <input
        className={`${auditState?.[prop] ? "audit-pass" : "audit-fail"}`}
        id={prop}
        name={prop}
        type="month"
        value={input[prop] || ""}
        min={min}
        max={max}
        onChange={updateInput}
      />
    </div>
  );
};

export default InlineMonthInput;
