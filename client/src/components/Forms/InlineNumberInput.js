import React, { useState} from "react";

const InlineNumberInput = ( { prop, input, setInput, label, placeholder, decimals } ) => {

    decimals = decimals || 2

    const [ inputControl, setInputControl ] = useState( { [prop]: input[prop] } )

    const focusLocalInput = ( e ) => {
        const { name } = e.target
        setInputControl( { ...inputControl, [name]: input[prop] > 0 ? input[prop] : '' } )
    }

    const updateInput = ( e ) => {
        const { name, value } = e.target
        setInputControl( { ...inputControl, [name]: Number( value ) } )
    }

    const setCorrectedInput = ( e ) => {
        const { name, value } = e.target
        const decimalNumber = Math.floor( Number( value ) * 100 ) / 100
        setInput( { ...input, [name]: decimalNumber, error: null } )
        setInputControl( { ...inputControl, [name]: Number( decimalNumber ) } )
    }

    return (
        <div className={ 'form-inline-number' } >
            <label htmlFor={ prop }>{ label }</label>
            <input name={ prop } type="number" value={ inputControl[prop] } step="0.01" onChange={ updateInput } onFocus={ focusLocalInput } onBlur={ setCorrectedInput } placeholder={ placeholder } autoComplete="off"/>
        </div>
    )
};

export default InlineNumberInput;
