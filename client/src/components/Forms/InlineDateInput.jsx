import React from "react";
import { format } from "date-fns";
import { dateAddTZ } from "../../utils/helpers";

const InlineDateInput = ({
  prop,
  input,
  setInput,
  label,
  placeholder,
  auditState,
}) => {
  const updateInput = (e) => {
    const { name, value } = e.target;
    if (value) {
      return setInput({ ...input, [name]: dateAddTZ(value) });
    }
  };

  return (
    <div className={"form-inline-date"}>
      <label className={"noselect"} htmlFor={prop}>
        {label}
      </label>
      <input
        className={`${auditState[prop] ? "audit-pass" : "audit-fail"}`}
        name={prop}
        type="date"
        value={String(format(new Date(input[prop]), "yyyy-MM-dd"))}
        onChange={updateInput}
        placeholder={placeholder}
        autoComplete="off"
      />
    </div>
  );
};

export default InlineDateInput;
