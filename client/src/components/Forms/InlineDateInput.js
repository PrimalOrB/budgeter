import React from "react";
import { format } from 'date-fns'
import { dateAddTZ } from '../../utils/helpers'

const InlineDateInput = ( { prop, input, setInput, label, placeholder } ) => {

    const updateInput = ( e ) => {
        const { name, value } = e.target
        setInput( { ...input, [name]:  dateAddTZ( value ), error: null } )
    }

    return (
        <div className={ 'form-inline-date' } >
            <label htmlFor={ prop }>{ label }</label>
            <input name={ prop } type="date" value={ String( format( new Date( input[prop] ), 'yyyy-MM-dd' ) ) } onChange={ updateInput } placeholder={ placeholder } autoComplete="off"/>
        </div>
    )
};

export default InlineDateInput;
