import React, { useState } from 'react'
import { ActionButton } from '../components/Buttons'
import { InlineSelectInput, InlineTextareaInput, InlineNumberInput, InlineDateInput, InlineUserInput, InlineSwitchTwoWay } from '../components/Forms'
import { InlineError, InlineNotification } from '../components/Notifications'
import { Title } from '../components/Layout'
import { useMutation } from '@apollo/client'
import { EDIT_TRANSACTION } from '../utils/mutations'
import { MdPerson, MdPeople } from 'react-icons/md'

const EditTransactionEntry = ( { budgetState, setBudgetState, editingID, setPageState } ) => {

  const incomingEditData = budgetState.entries.find( x => x._id === editingID )

  console.log( incomingEditData )

  const initialFormState = { categoryID: incomingEditData.categoryID, title: incomingEditData.title, value: incomingEditData.value, createdAt: incomingEditData.createdAt, userID: incomingEditData.userID._id, individualEntry: incomingEditData.individualEntry || false  }
  
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

  const [ processSumbit, { loading: createdLoading, error: createdError }] = useMutation(EDIT_TRANSACTION, {
    variables: { 
      input: {
        entryID: editingID,
        title: formInput.title,
        value: formInput.value,
        budgetID: budgetState._id,
        categoryID: formInput.categoryID,
        createdAt: formInput.createdAt,
        userID: formInput.userID,
        individualEntry: formInput.individualEntry
      }
    },
    update: ( cache, data ) => {
      try {
        if( data ){
          const newBudgetState = { ...budgetState }
          newBudgetState.entries = [ ...newBudgetState.entries.filter( entry => entry._id !== data.data.editTransaction._id ), data.data.editTransaction ]
          setBudgetState( { ...newBudgetState } )
          return setPageState( 'dashboard' )
        }
      } catch (e) {
        console.error( createdError );
      }
    }
  })

  return (
    <section className="full-container">
      <Title text={ `Edit ${ incomingEditData.valueType }` } />
      <form autoComplete="off">
        <InlineSelectInput prop={ 'categoryID' } input={ formInput } setInput={ setFormInput } label={ 'Category' } optionList={ budgetState.categories.filter( category => category.categoryType === incomingEditData.valueType ) }/>
        <InlineTextareaInput prop={ 'title' } input={ formInput } setInput={ setFormInput } label={ 'Description' }/>
        <InlineNumberInput prop={ `value` } input={ formInput } setInput={ setFormInput } label={ 'Value' }/>      
        <InlineDateInput prop={ `createdAt` } input={ formInput } setInput={ setFormInput } label={ 'Transaction Date' }/>
        <InlineUserInput prop={ 'userID' } input={ formInput } setInput={ setFormInput } label={ 'User' } optionList={ budgetState.ownerIDs }/>
        <InlineSwitchTwoWay prop={ `individualEntry` } input={ formInput } setInput={ setFormInput } label={ `${ formInput.individualEntry ? 'Individual Entry' : 'Shared Entry' }` } falseIcon={ MdPeople } trueIcon={ MdPerson }/>   
        { formInput.error && <InlineError text={ formInput.error }/> }
      </form>
      { createdLoading ? <InlineNotification text={ 'Submit processing' }/> :  <ActionButton action={ sumbitForm } text={ 'Submit Edit' } additionalClass={ 'large-button' } /> }
    </section>
  )

};

export default EditTransactionEntry;
