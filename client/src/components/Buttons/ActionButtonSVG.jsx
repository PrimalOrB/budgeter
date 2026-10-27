import React from "react";

const ActionButtonSVG = ( { action, text, svg, additionalClass, svgClass } ) => (
  <button type="button" onClick={ () => action() } className={ `tab ${ additionalClass ? ` ${ additionalClass }` : '' } noselect` }>
    <span className={ `tab-icon ${ svgClass }` }>{ svg() }</span>
    <span className="tab-label">{ text }</span>
  </button>
);

export default ActionButtonSVG;
