import React from "react";

const Title = ( { text, additionalClass, id, subtitle } ) => {

  id = id || ''

  return (
    <div id={ id } className={ `title ${ additionalClass ? additionalClass : '' }` }>
      <h1 className="title-text">{ text }</h1>
      { subtitle && <p className="title-subtitle">{ subtitle }</p> }
    </div>
  )
};

export default Title;
