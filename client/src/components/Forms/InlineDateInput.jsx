import React from "react";
import { format } from "date-fns";
import { dateInputToEffectiveDate } from "../../utils/helpers";

const InlineDateInput = ({
  prop,
  input,
  setInput,
  label,
  placeholder,
  auditState,
  hint,
}) => {
  const updateInput = (e) => {
    const { name, value } = e.target;
    if (value) {
      return setInput({ ...input, [name]: dateInputToEffectiveDate(value) });
    }
  };

  return (
    <div className={"form-inline-date"}>
      <label className={"noselect"} htmlFor={prop}>
        {label}
      </label>
      <input
        className={`${auditState[prop] ? "audit-pass" : "audit-fail"}`}
        id={prop}
        name={prop}
        type="date"
        value={input[prop] ? format(new Date(input[prop]), "yyyy-MM-dd") : ""}
        onChange={updateInput}
        placeholder={placeholder}
        autoComplete="off"
      />
      {hint && <span className="form-hint">{hint}</span>}
    </div>
  );
};

export default InlineDateInput;
