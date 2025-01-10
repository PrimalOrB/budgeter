import React, { useState } from "react";

const InlineNumberInput = ({
  prop,
  input,
  setInput,
  label,
  placeholder,
  decimals,
  auditState,
}) => {
  decimals = decimals || 2;

  const [inputControl, setInputControl] = useState({
    [prop]: `$${isNaN(Number(input[prop])) ? input[prop] : input[prop].toFixed(decimals)}`,
  });

  const focusLocalInput = (e) => {
    const { name } = e.target;
    return setInputControl({
      ...inputControl,
      [name]: input[prop] > 0 ? input[prop] : "",
    });
  };

  const updateInput = (e) => {
    const { name, value } = e.target;
    if( !isNaN(Number(value)) ){
      const decimalNumber = Math.round(Number(value) * 100) / 100
      setInput({ ...input, [name]: decimalNumber });
    }
    return setInputControl({ ...inputControl, [name]: value });
  };

  const setCorrectedInput = (e) => {
    const { name, value } = e.target;
    const decimalNumber = Math.round(Number(value) * 100) / 100,
    updateValue = isNaN(decimalNumber) ? value : decimalNumber
    setInput({ ...input, [name]: updateValue });
    return setInputControl({
      ...inputControl,
      [name]: `$${isNaN(decimalNumber) ? value : updateValue.toFixed(decimals)}`,
    });
  };

  return (
    <div className={`form-inline-number`}>
      <label className={"noselect"} htmlFor={prop}>
        {label}
      </label>
      <input
        className={`${auditState[prop] ? "audit-pass" : "audit-fail"}`}
        name={prop}
        type="text"
        pattern="\d*"
        value={inputControl[prop]}
        step="0.01"
        onChange={updateInput}
        onFocus={focusLocalInput}
        onBlur={setCorrectedInput}
        placeholder={placeholder}
        autoComplete="off"
      />
    </div>
  );
};

export default InlineNumberInput;
