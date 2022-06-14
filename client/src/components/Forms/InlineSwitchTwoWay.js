import React from "react";

const InlineSwitchTwoWay = ( { prop, input, setInput, label, placeholder, decimals } ) => {

    function updateInput( e ){
        const { name } = e.target
        setInput( { ...input, [name]: !input[prop], error: null } )
    }

    return (
        <div className={ 'form-inline-checkbox' } >
            <input name={ prop } id={ prop } checked={ input[prop] } onChange={ updateInput } type="checkbox"/>
            <label className={ input[prop] && 'checked' } htmlFor={ prop }>
                <span className={ 'switch-handle' } />
            </label>
        </div>
    )
};

export default InlineSwitchTwoWay;
