import React from "react";

const InlineUserInput = ( { prop, input, setInput, label, optionList, auditState } ) => {

    function updateInput( e ){
        const { name, value } = e.target
        setInput( { ...input, [name]: value, error: null } )
    }

    return (
        <div className={ 'form-inline-select' } >
            <label className={ 'noselect' } htmlFor={ prop }>{ label }</label>
            <select className={ `${auditState[prop] ? 'audit-pass': 'audit-fail' }` } name={ prop } type="number" value={ input[prop] } onChange={ updateInput }>
                <option disabled></option>
                { optionList.map( option => {
                    return <option key={ option._id || option } value={ option._id || option }>{ option.email }</option>
                })}
            </select>
        </div>
    )
};

export default InlineUserInput;
