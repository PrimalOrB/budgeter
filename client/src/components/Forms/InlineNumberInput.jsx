import React, { useRef, useState } from "react";
import { FiPlus, FiMinus } from "react-icons/fi";

// up to $999,999,999.99
const MAX_CENTS = 99999999999;

function formatCents(cents, negative) {
  const amount = (cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${negative ? "-" : ""}$${amount}`;
}

// Bank-style amount entry: digits stream in from the right as cents
// (1 -> $0.01, 12 -> $0.12, 123 -> $1.23). Typing "-" or using the
// sign button flips the sign for refunds / reversals.
const InlineNumberInput = ({
  prop,
  input,
  setInput,
  label,
  placeholder,
  auditState,
  min,
}) => {
  const inputRef = useRef(null);
  const allowNegative = min === undefined || min < 0;

  // a value of 0 can't carry a sign, so remember "-$0.00" separately
  const [negativeZero, setNegativeZero] = useState(false);

  const numericValue = Number(input[prop]) || 0;
  const cents = Math.round(Math.abs(numericValue) * 100);
  const isNegative = numericValue < 0 || (cents === 0 && negativeZero);

  const commit = (nextCents, negative) => {
    const capped = Math.min(nextCents, MAX_CENTS);
    const signed = allowNegative && negative;
    setNegativeZero(signed && capped === 0);
    setInput({ ...input, [prop]: ((signed ? -1 : 1) * capped) / 100 });
  };

  // keep the caret at the end, where new digits arrive
  const moveCaretToEnd = () => {
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (el && document.activeElement === el) {
        el.setSelectionRange(el.value.length, el.value.length);
      }
    });
  };

  const updateInput = (e) => {
    const raw = e.target.value;
    // each "-" typed toggles the sign; the display already holds one when negative
    const minusCount = (raw.match(/-/g) || []).length;
    const digits = raw.replace(/\D/g, "").replace(/^0+/, "");
    commit(Number(digits || 0), minusCount % 2 === 1);
    moveCaretToEnd();
  };

  const toggleSign = () => {
    commit(cents, !isNegative);
    inputRef.current?.focus();
    moveCaretToEnd();
  };

  return (
    <div className={`form-inline-number`}>
      <label className={"noselect"} htmlFor={prop}>
        {label}
      </label>
      <div className="amount-input">
        <input
          ref={inputRef}
          className={`${auditState?.[prop] ? "audit-pass" : "audit-fail"}${
            isNegative ? " amount-negative" : ""
          }`}
          id={prop}
          name={prop}
          type="text"
          inputMode="numeric"
          value={formatCents(cents, isNegative)}
          onChange={updateInput}
          onFocus={moveCaretToEnd}
          onClick={moveCaretToEnd}
          placeholder={placeholder}
          autoComplete="off"
        />
        {allowNegative && (
          <button
            type="button"
            className={`amount-sign${isNegative ? " amount-sign-negative" : ""}`}
            onClick={toggleSign}
            title={isNegative ? "Make positive" : "Make negative (refund / reversal)"}
            aria-label={isNegative ? "Make positive" : "Make negative"}
          >
            {isNegative ? <FiMinus /> : <FiPlus />}
          </button>
        )}
      </div>
    </div>
  );
};

export default InlineNumberInput;
