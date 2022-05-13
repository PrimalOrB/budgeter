import React from "react";

const Title = ( { text, additionalClass, id } ) => {

  id = id || ''

  return (
    <span id={ id } className={ `title grad-bg ${ additionalClass }` }>
      { text }
    </span>

  )
};

export default Title;
