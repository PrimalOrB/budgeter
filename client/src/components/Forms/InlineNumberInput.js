import React from "react";

const InlineNumberInput = ( { prop, input, setInput, label, placeholder } ) => {

    function updateInput( e ){
        const { name, value } = e.target
        setInput( { ...input, [name]: Number( value ), error: null } )
    }

    return (
        <div className={ 'form-inline-number' } >
            <label htmlFor={ prop }>{ label }</label>
            <input name={ prop } type="number" min="0" value={ input[prop] } onChange={ updateInput } placeholder={ placeholder } autoComplete="off"/>
        </div>
    )
};

export default InlineNumberInput;
