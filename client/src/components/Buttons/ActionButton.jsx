import React from "react";

const ActionButton = ({ action, text, additionalClass, disabled }) => {
  return (
    <>
      {disabled ? (
        <span
          className={`nav-button ${
            additionalClass ? ` ${additionalClass}` : ""
          } noselect nav-button-disabled`}
        >
          {text}
        </span>
      ) : (
        <span
          onClick={() => action()}
          className={`nav-button ${
            additionalClass ? ` ${additionalClass}` : ""
          } noselect`}
        >
          {text}
        </span>
      )}
    </>
  );
};

export default ActionButton;
