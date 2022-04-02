import React, { useState, useEffect } from "react";
import { InlineTextInput, InlineTextareaInput } from '../components/Forms'
import { ContactButton } from '../components/Buttons'
import { useStoreContext } from '../utils/GlobalState'

const AddBudget = () => {

  const [ formInput, setFormInput ] = useState( { emails: [] } ) 

  const [ state ] = useStoreContext();
  const { currentUser } = state;

  console.log( formInput )

  return (
    <section>
      <h2 className="container-title">Create New Budget</h2>
      <form autoComplete="off">
        <InlineTextInput prop={ 'title' } input={ formInput } setInput={ setFormInput } label={ 'Budget Title' }/>
        <InlineTextareaInput prop={ 'desc' } input={ formInput } setInput={ setFormInput } label={ 'Description' }/>
        <InlineTextInput prop={ 'email' } input={ formInput } setInput={ setFormInput } label={ 'Add More Users' } placeholder={ "Type or paste email addresses and press `Enter`" }/> 
        <div className="container-flex margin-top-half">
          { currentUser?.email && <ContactButton input={ formInput } setInput={ setFormInput } text={ currentUser.email } deletable={ false }/>}
          { formInput?.emails.map( ( x, i ) => {
            return <ContactButton key={ `${ i } _owners` } input={ formInput } setInput={ setFormInput } text={ x }/>
          })}
        </div>
      </form>
    </section>
  )

};

export default AddBudget;
