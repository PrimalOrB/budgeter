import React from "react";
import { titleCaseString } from '../../utils/helpers'

const InlineSelectInput = ( { prop, input, setInput, label, optionList } ) => {

    function updateInput( e ){
        const { name, value } = e.target
        setInput( { ...input, [name]: value, error: null } )
    }

    return (
        <div className={ 'form-inline-select' } >
            <label htmlFor={ prop }>{ label }</label>
            <select name={ prop } type="number" value={ input[prop] } onChange={ updateInput }>
                <option disabled></option>
                { optionList.map( option => {
                    return <option key={ option._id || option } value={ option._id || option }>{ titleCaseString( option.title || option ) }</option>
                })}
            </select>
        </div>
    )
};

export default InlineSelectInput;
