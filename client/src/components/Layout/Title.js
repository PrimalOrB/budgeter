import React from "react";

const Title = ( { text, additionalClass } ) => (
  <span className={ `title grad-bg ${ additionalClass }` }>{ text }
  </span>
);

export default Title;
