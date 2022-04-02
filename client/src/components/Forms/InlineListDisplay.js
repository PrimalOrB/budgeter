import React from "react";
import { ContactButton } from '../Buttons'
import { useStoreContext } from '../../utils/GlobalState'

const InlineListDisplay = ( { input, setInput, label } ) => {

    const [ state ] = useStoreContext();
    const { currentUser } = state;

    return (
        <div className={ 'form-inline-text' }> 
            <label>{ label }</label>
            <div className="container-flex margin-top-half">
            { currentUser?.email && <ContactButton input={ input } setInput={ setInput } text={ currentUser.email } deletable={ false }/>}
            { input?.emails.map( ( x, i ) => {
                return <ContactButton key={ `${ i } _owners` } input={ input } setInput={ setInput } text={ x }/>
            })}
            </div> 
        </div>
    )
};

export default InlineListDisplay;
