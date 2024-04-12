import React from "react";

const ActionButton = ( { action, text, additionalClass } ) => (
  <span onClick={ () => action() } className={ `nav-button${ additionalClass ? ` ${ additionalClass }` : '' } noselect` }>{ text }</span>
);

export default ActionButton;
