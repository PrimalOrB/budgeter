import React from "react";
import { titleCaseString } from '../../utils/helpers'

const InlineSelectInput = ( { prop, input, setInput, label, optionList, auditState } ) => {

    function updateInput( e ){
        const { name, value } = e.target
        setInput( { ...input, [name]: value } )
    }

    return (
        <div className={ 'form-inline-select' } >
            <label className={ 'noselect' } htmlFor={ prop }>{ label }</label>
            <select className={ `${auditState[prop] ? 'audit-pass': 'audit-fail' }` } name={ prop } type="number" value={ input[prop] } onChange={ updateInput }>
                <option disabled></option>
                { optionList.map( option => {
                    if( option.email ){
                        option.title = option.email
                    }
                    return <option key={ option._id || option } value={ option._id || option }>{ titleCaseString( option.title || option ) }</option>
                })}
            </select>
        </div>
    )
};

export default InlineSelectInput;
