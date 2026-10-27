import React from "react";

// two-option segmented control; false option first, true option second
const InlineSwitchTwoWay = ( { prop, input, setInput, label, falseIcon, trueIcon, falseLabel = 'Shared', trueLabel = 'Individual' } ) => {

    const select = ( value ) => setInput( { ...input, [prop]: value, error: null } )

    return (
        <div className={ 'form-inline-checkbox' } >
            <span className={ 'form-label noselect' }>{ label }</span>
            <div className={ 'segmented' } role="radiogroup" aria-label={ label }>
                <button type="button" role="radio" aria-checked={ !input[prop] } className={ `segmented-option${ !input[prop] ? ' segmented-active' : '' }` } onClick={ () => select( false ) }>
                    { falseIcon() }{ falseLabel }
                </button>
                <button type="button" role="radio" aria-checked={ !!input[prop] } className={ `segmented-option${ input[prop] ? ' segmented-active' : '' }` } onClick={ () => select( true ) }>
                    { trueIcon() }{ trueLabel }
                </button>
            </div>
        </div>
    )
};

export default InlineSwitchTwoWay;
