import React from "react";

const ActionButtonSVG = ( { action, text, svg, additionalClass, svgClass } ) => (
  <span onClick={ () => action() } className={ `nav-button ${ additionalClass ? ` ${ additionalClass }` : '' }` }>
    <span className="mobile-hide">{ text }</span>
    <span className={ `${ svgClass }` }>{ svg() }</span>
  </span>
);

export default ActionButtonSVG;
