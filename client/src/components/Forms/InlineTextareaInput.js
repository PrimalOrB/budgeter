import React from "react";

const InlineTextboxInput = ( { prop, input, setInput, label } ) => {

    function updateInput( e ){
        const { name, value } = e.target
        setInput( { ...input, [name]: value.trim() })
    }

    return (
        <div className={ 'form-inline-text' }>
            <label htmlFor={ prop }>{ label }</label>
            <textarea name={ prop } rows={ 3 } onChange={ updateInput } value={ input[prop] } />
        </div>
    )
};

export default InlineTextboxInput;
