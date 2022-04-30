import React from "react";

const InlineDateInput = ( { prop, input, setInput, label, min } ) => {

    function updateInput( e ){
        const { name, value } = e.target
        setInput( { ...input, [name]: value, error: null } )
    }

    return (
        <div className={ 'form-inline-text' } >
            <label htmlFor={ prop }>{ label }</label>
            <input name={ prop } type="date" onChange={ updateInput } min={ min } autoComplete="off"/>
        </div>
    )
};

export default InlineDateInput;
