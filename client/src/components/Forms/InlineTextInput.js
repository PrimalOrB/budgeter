import React from "react";
import { isEmail } from '../../utils/helpers'

const InlineTextInput = ( { prop, input, setInput, label, placeholder } ) => {

    function updateInput( e ){
        const { name, value } = e.target
        setInput( { ...input, [name]: value.trim() })
    }

    function isInList(email) {
        return input.emails.includes(email);
      }

    function isValid(email) {
        var error = null;
        
        if (!isEmail(email)) {
          error = `${email} is not a valid email address.`;
        }
        
        if (isInList(email)) {
          error = `${email} has already been added.`;
        }
        
        if (error) {
            setInput({
                ...input,
                error
             });
          
          return false;
        }
        
        return true;
    }

    function handleKeyDown(e){
        if (['Enter', 'Tab', ','].includes(e.key)) {
          e.preventDefault();
          
          let email = input[prop].trim();

          console.log( email, isValid( email ) )
            
          if ( isValid( email )) {
            setInput({
                ...input,
                emails: [...input.emails, email],
                [prop]: ''
            });
          }
        }
      };

    return (
        <div className={ 'form-inline-text' } >
            <label htmlFor={ prop }>{ label }</label>
            <input name={ prop } type="text" onChange={ updateInput } onKeyDown={ handleKeyDown } placeholder={ placeholder } value={ input[prop] }/>
        </div>
    )
};

export default InlineTextInput;
