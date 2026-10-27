import React from "react";
import { Link } from 'react-router-dom'
import { FiArrowRight, FiPlus } from 'react-icons/fi'
import { shortenedString } from '../../utils/helpers'

const PrimaryButton = ( { title, desc, link, disabled } ) => {

  return (
    <Link 
      className={ `primary-button${ disabled ? ' primary-button-disabled' : '' }` } 
      to={ link }
    >
      <h3 className={ `primary-button-title` } >
        { shortenedString( title, 40 ) }
      </h3>
      { desc &&
        <span className={ `primary-button-description` } >
          { shortenedString( desc, 90 ) }
        </span>
      }
      <span className="primary-button-icon" aria-hidden="true">
        { disabled ? <FiPlus /> : <FiArrowRight /> }
      </span>
    </Link>
  )
};

export default PrimaryButton;
