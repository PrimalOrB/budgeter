import React from "react";
import { FiSlash, FiNavigation } from "react-icons/fi";

// extra data a category's entries can carry (see the server's META_TYPES)
export const TRACKING_TYPES = [
  {
    value: "",
    label: "None",
    icon: FiSlash,
    hint: "Entries are just an amount and description.",
  },
  {
    value: "mileage",
    label: "Mileage",
    icon: FiNavigation,
    hint: "Fuel purchases can record the vehicle, price per litre, litres and km driven.",
  },
];

const InlineTrackingInput = ({ prop = "metaType", input, setInput, label = "Tracking" }) => {
  const current = input[prop] || "";
  const selected = TRACKING_TYPES.find((type) => type.value === current) || TRACKING_TYPES[0];

  return (
    <div className="form-inline-checkbox">
      <span className="form-label">{label}</span>
      <div className="segmented" role="radiogroup" aria-label={label}>
        {TRACKING_TYPES.map(({ value, label: text, icon: Icon }) => (
          <button
            key={value || "none"}
            type="button"
            role="radio"
            aria-checked={current === value}
            className={`segmented-option${current === value ? " segmented-active" : ""}`}
            onClick={() => setInput({ ...input, [prop]: value })}
          >
            <Icon />
            {text}
          </button>
        ))}
      </div>
      <span className="form-hint">{selected.hint}</span>
    </div>
  );
};

export default InlineTrackingInput;
