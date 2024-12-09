import React from "react";

const InlineSwitchTwoWay = ( { prop, input, setInput, label, falseIcon, trueIcon } ) => {

    function updateInput( e ){
        const { name } = e.target
        setInput( { ...input, [name]: !input[prop], error: null } )
    }

    return (
        <div className={ 'form-inline-checkbox' } >
            <label className={ 'noselect' } htmlFor={ prop }>{ label }</label>
            <div>
                <div className={ `form-inline-checkbox-svg${ !input[prop] ? ' svg-checked' : '' }` } onClick={ () => setInput( { ...input, [prop]: false, error: null } ) }>
                    { falseIcon() }
                </div>
                <div className={ 'form-inline-checkbox-container' }>
                    <input name={ prop } id={ prop } checked={ input[prop] } onChange={ updateInput } type="checkbox"/>
                    <label className={ input[prop] ? 'checked' : '' } htmlFor={ prop }>
                        <span className={ 'switch-handle' } />
                    </label>
                </div>
                <div className={ `form-inline-checkbox-svg${ input[prop] ? ' svg-checked' : '' }` } onClick={ () => setInput( { ...input, [prop]: true, error: null } ) }>
                    { trueIcon() }
                </div>
            </div>
        </div>
    )
};

export default InlineSwitchTwoWay;
