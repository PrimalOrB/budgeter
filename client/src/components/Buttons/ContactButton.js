import React from "react";

const ContactButton = ( { input, setInput, text, deletable } ) => {

  deletable = deletable === undefined ? true : deletable

  console.log( deletable )

  function handleDelete( toBeDeleted ){
    setInput({
      ...input,
      emails: input.emails.filter(email => email !== toBeDeleted)
    });
  };

  return (
    <div className={ `contact-chip ${ deletable ? '' : 'no-delete' }` }>
    {text}  
    { deletable &&
    <button
      type="button"
      className="button"
      onClick={ () => handleDelete( text ) }
    >
      &times;
    </button>
    }  
  </div>
  )
};

export default ContactButton;
