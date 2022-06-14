import React from "react";

const InlineSwitchTwoWay = ( { prop, input, setInput, label, placeholder, decimals, falseIcon, trueIcon } ) => {

    function updateInput( e ){
        const { name } = e.target
        setInput( { ...input, [name]: !input[prop], error: null } )
    }

    return (
        <div className={ 'form-inline-checkbox' } >
            <label htmlFor={ prop }>{ label }</label>
            <div>
                <div className={ 'form-inline-checkbox-svg' }>
                    { falseIcon() }
                </div>
                <div className={ 'form-inline-checkbox-container' }>
                    <input name={ prop } id={ prop } checked={ input[prop] } onChange={ updateInput } type="checkbox"/>
                    <label className={ input[prop] && 'checked' } htmlFor={ prop }>
                        <span className={ 'switch-handle' } />
                    </label>
                </div>
                <div className={ 'form-inline-checkbox-svg' }>
                    { trueIcon() }
                </div>
            </div>
        </div>
    )
};

export default InlineSwitchTwoWay;
