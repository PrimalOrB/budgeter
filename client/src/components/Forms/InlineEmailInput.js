import React from "react";
import { isEmail } from '../../utils/helpers'

const InlineEmailInput = ( { prop, input, setInput, label, placeholder } ) => {

    function updateInput( e ){
        const { name, value } = e.target
        setInput( { ...input, [name]: value, error: null } )
    }

    function isInList( email ) {
        return input.emails.includes( email );
      }

    function isValid( email ) {
        var error = null;
        
        if (!isEmail( email ) ) {
          error = `${ email } is not a valid email address.`;
        }
        
        if (isInList( email) ) {
          error = `${ email } has already been added.`;
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
        if (['Enter'].includes(e.key)) {
          e.preventDefault();
          
          let email = input[prop].trim();
            
          if ( isValid( email ) ) {
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
            <label className={ 'noselect' } htmlFor={ prop }>{ label }</label>
            <input name={ prop } type="text" onChange={ updateInput } onKeyDown={ handleKeyDown } placeholder={ placeholder } value={ input[prop] } autoComplete="off"/>
        </div>
    )
};

export default InlineEmailInput;
