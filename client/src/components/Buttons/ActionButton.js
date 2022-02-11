import React from "react";

const ActionButton = ( { action, text } ) => (
  <span onClick={ () => action() }className="nav-button">{ text }</span>
);

export default ActionButton;
