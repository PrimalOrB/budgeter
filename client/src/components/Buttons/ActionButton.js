import React from "react";

const ActionButton = ( { action, text, additionalClass } ) => (
  <span onClick={ () => action() } className={ `nav-button ${ additionalClass }` }>{ text }</span>
);

export default ActionButton;
