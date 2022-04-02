import React from "react";

const InlineTextInput = ( { prop, input, setInput, label, placeholder } ) => {

    function updateInput( e ){
        const { name, value } = e.target
        setInput( { ...input, [name]: value.trim() })
    }

    function handleKeyDown(e){
        if (['Enter', 'Tab', ','].includes(e.key)) {
          e.preventDefault();
          
          let email = input[prop].trim();

          console.log( email )
            
          if (email) {
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
