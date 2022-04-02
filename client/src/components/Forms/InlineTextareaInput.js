import React from "react";

const InlineTextboxInput = ( { prop, input, setInput, label } ) => {

    function updateInput( e ){
        const { name, value } = e.target
        setInput( { ...input, [name]: value.trim() })
    }

    return (
        <div className={ 'form-inline-text' } onChange={ updateInput }>
            <label htmlFor={ prop }>{ label }</label>
            <textarea name={ prop } rows={ 3 } />
        </div>
    )
};

export default InlineTextboxInput;
