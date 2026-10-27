import React from "react";

const ActionButton = ({ action, text, additionalClass, disabled, icon }) => {
  return (
    <button
      type="button"
      onClick={() => action()}
      disabled={disabled}
      className={`btn${additionalClass ? ` ${additionalClass}` : ""} noselect`}
    >
      {icon && icon()}
      {text}
    </button>
  );
};

export default ActionButton;
