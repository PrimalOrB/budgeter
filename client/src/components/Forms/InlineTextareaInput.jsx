import React from "react";

const InlineTextboxInput = ( { prop, input, setInput, label, auditState, placeholder, rows = 3 } ) => {

    function updateInput( e ){
        const { name, value } = e.target
        setInput( { ...input, [name]: value })
    }

    return (
        <div className={ 'form-inline-text' }>
            <label className={ 'noselect' } htmlFor={ prop }>{ label }</label>
            <textarea id={ prop } className={ `${auditState[prop] ? 'audit-pass': 'audit-fail' }` } name={ prop } rows={ rows } onChange={ updateInput } value={ input[prop] } placeholder={ placeholder } />
        </div>
    )
};

export default InlineTextboxInput;
