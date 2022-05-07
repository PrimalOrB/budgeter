import React, { useState } from "react";
import { InlineSelectInput, InlineTextareaInput, InlineNumberInput } from '../components/Forms'
import { Title } from '../components/Layout'


const AddTransactionEntry = ( { id, budgetState } ) => {

  const [ formInput, setFormInput ] = useState( { category: '', title: '', value: 0 } ) 

  console.log( formInput )

  return (
    <section>
      <Title text={ `Add Debit -` } />
      <form autoComplete="off">
        <InlineSelectInput prop={ 'category' } input={ formInput } setInput={ setFormInput } label={ 'Category' } optionList={ budgetState.categories }/>
        <InlineTextareaInput prop={ 'title' } input={ formInput } setInput={ setFormInput } label={ 'Description' }/>
        <InlineNumberInput prop={ `value` } input={ formInput } setInput={ setFormInput } label={ 'Monthly Value' } min={ 0 }/>
      
      </form>
    </section>
  )

};

export default AddTransactionEntry;
