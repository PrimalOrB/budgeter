import React from "react";
import { ContactButton } from '../Buttons'

const InlineListDisplay = ( { input, setInput, label } ) => {
    return (
        <div className={ 'form-inline-text' }> 
            <label>{ label }</label>
            <div className="container-flex margin-top-half">
            { input?.owner && <ContactButton input={ input } setInput={ setInput } text={ input.owner } deletable={ false }/>}
            { input?.emails.map( ( x, i ) => {
                return <ContactButton key={ `${ i } _owners` } input={ input } setInput={ setInput } text={ x }/>
            })}
            </div> 
        </div>
    )
};

export default InlineListDisplay;
