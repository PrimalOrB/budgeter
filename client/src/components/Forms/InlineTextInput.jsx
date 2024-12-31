import React from "react";

const InlineTextInput = ( { prop, input, setInput, label, placeholder, auditState } ) => {

    function updateInput( e ){
        const { name, value } = e.target
        setInput( { ...input, [name]: value, error: null } )
    }

    return (
        <div className={ 'form-inline-text' } >
            <label className={ 'noselect' } htmlFor={ prop }>{ label }</label>
            <input className={ `${auditState[prop] ? 'audit-pass': 'audit-fail' }` } name={ prop } type="text" onChange={ updateInput } value={ input[prop] } placeholder={ placeholder } autoComplete="off"/>
        </div>
    )
};

export default InlineTextInput;
