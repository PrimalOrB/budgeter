import React, { useState } from "react";
import { InlineTextInput, InlineTextareaInput, InlineListDisplay } from '../components/Forms'

const AddBudget = () => {

  const [ formInput, setFormInput ] = useState( { emails: [] } ) 

  return (
    <section>
      <h2 className="container-title">Create New Budget</h2>
      <form autoComplete="off">
        <InlineTextInput prop={ 'title' } input={ formInput } setInput={ setFormInput } label={ 'Budget Title' }/>
        <InlineTextareaInput prop={ 'desc' } input={ formInput } setInput={ setFormInput } label={ 'Description' }/>
        <InlineListDisplay input={ formInput } setInput={ setFormInput } label={ 'Owners' }/>
        <InlineTextInput prop={ 'email' } input={ formInput } setInput={ setFormInput } label={ 'Add More Owners' } placeholder={ "Type or paste email addresses and press `Enter`" }/> 
      </form>
    </section>
  )

};

export default AddBudget;
