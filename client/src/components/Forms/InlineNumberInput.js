import React from "react";

const InlineNumberInput = ( { prop, input, setInput, label, placeholder } ) => {

    function updateInput( e ){
        const { name, value } = e.target
        setInput( { ...input, [name]: value, error: null } )
    }

    return (
        <div className={ 'form-inline-text' } >
            <label htmlFor={ prop }>{ label }</label>
            <input name={ prop } type="number" min="0" onChange={ updateInput } placeholder={ placeholder } autoComplete="off"/>
        </div>
    )
};

export default InlineNumberInput;
