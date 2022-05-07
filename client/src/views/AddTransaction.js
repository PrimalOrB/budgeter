import React, { useState } from "react";
import { ActionButton } from '../components/Buttons'
import { InlineSelectInput, InlineTextareaInput, InlineNumberInput } from '../components/Forms'
import { InlineError, InlineNotification } from '../components/Notifications'
import { Title } from '../components/Layout'
import { useMutation } from '@apollo/client'
import { CREATE_NEW_TRANSACTION } from '../utils/mutations'

const AddTransactionEntry = ( { categoryType, budgetState, refetch } ) => {

  const initialFormState = { categoryID: '', title: '', value: 0 }

  const [ formInput, setFormInput ] = useState( { ...initialFormState } ) 

  function validateForm( form ){
    if( form.categoryID === undefined || form.title === undefined || form.value === undefined ){
      return false
    }
    if( form.categoryID.length > 0 && form.title.length > 0 && form.value !== 0 ){
      return true
    }
    return false
  }

  function sumbitForm(){
    // check form validity
    const valid = validateForm( formInput )

    // if is valid, procees
    if( valid ){
      setFormInput({
        ...formInput,
        error: null
      });

      // send to submit
      return processSumbit()
    }
    // return error
    setFormInput({
      ...formInput,
      error: 'Failed form validation'
    });
    return console.log( 'failed' )
  }

  const [ processSumbit, { loading: createdLoading, error: createdError }] = useMutation(CREATE_NEW_TRANSACTION, {
    variables: { 
      input: {
        title: formInput.title,
        value: formInput.value,
        budgetID: budgetState._id,
        categoryID: formInput.categoryID
      }
    },
    update: ( cache, data ) => {
      try {
        if( data ){
          refetch()
          return setFormInput( { ...initialFormState } )
        }
      } catch (e) {
        console.error( createdError );
      }
  }
  })

  return (
    <section>
      <Title text={ `Add ${ categoryType }` } />
      <form autoComplete="off">
        <InlineSelectInput prop={ 'categoryID' } input={ formInput } setInput={ setFormInput } label={ 'Category' } optionList={ budgetState.categories.filter( category => category.categoryType === categoryType ) }/>
        <InlineTextareaInput prop={ 'title' } input={ formInput } setInput={ setFormInput } label={ 'Description' }/>
        <InlineNumberInput prop={ `value` } input={ formInput } setInput={ setFormInput } label={ 'Monthly Value' } min={ 0 }/>      
        { formInput.error && <InlineError text={ formInput.error }/> }
      </form>
      { createdLoading ? <InlineNotification text={ 'Submit processing' }/> :  <ActionButton action={ sumbitForm } text={ 'Submit' } additionalClass={ null } /> }
    </section>
  )

};

export default AddTransactionEntry;
