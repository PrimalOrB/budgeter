import React, { useState, useEffect } from "react";
import { InlineTextInput, InlineTextareaInput, InlineListDisplay } from '../components/Forms'
import { InlineError } from '../components/Notifications'
import { useStoreContext } from '../utils/GlobalState'

const AddBudget = () => {

  const [ formInput, setFormInput ] = useState( { owner: null, emails: [], error: null } ) 

  const [ state ] = useStoreContext();

  useEffect(()=>{
    if( state?.currentUser ){
      setFormInput( {
        ...formInput,
        owner: state.currentUser.email
      } )
    }
  },[ state ])

  return (
    <section>
      <h2 className="container-title">Create New Budget</h2>
      <form autoComplete="off">
        <InlineTextInput prop={ 'title' } input={ formInput } setInput={ setFormInput } label={ 'Budget Title' }/>
        <InlineTextareaInput prop={ 'desc' } input={ formInput } setInput={ setFormInput } label={ 'Description' }/>
        <InlineListDisplay input={ formInput } setInput={ setFormInput } label={ 'Owners' }/>
        <InlineTextInput prop={ 'email' } input={ formInput } setInput={ setFormInput } label={ 'Add More Owners' } placeholder={ "Type or paste email addresses and press `Enter`" }/> 
        { formInput.error && <InlineError text={ formInput.error }/> }
      </form>
    </section>
  )

};

export default AddBudget;
