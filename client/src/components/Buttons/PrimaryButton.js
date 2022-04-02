import React from "react";
import { Link } from 'react-router-dom'
import { shortenedString } from '../../utils/helpers'

const PrimaryButton = ( { title, desc, link, disabled } ) => {

  return (
    <Link 
      className={ `primary-button${ disabled ? ' primary-button-disabled' : '' }` } 
      to={ link }
    >
      <h3 className={ `primary-button-title` } >
        { shortenedString( title, 25 ) }
      </h3>
      <span className={ `primary-button-description` } >
        { shortenedString( desc, 125 ) }
      </span>

    </Link>
  )
};

export default PrimaryButton;
