import React from "react";
import { Link } from 'react-router-dom'

const PrimaryButton = ( { title, desc, link, disabled } ) => {

  return (
    <Link 
      className={ `primary-button${ disabled ? ' primary-button-disabled' : '' }` } 
      to={ link }
    >
      <h3 className={ `primary-button-title` } >
        { title }
      </h3>
    </Link>
  )
};

export default PrimaryButton;
