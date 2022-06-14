import React, { useState } from 'react'
import { ActionButton } from '../components/Buttons'
import { InlineNumberInput, InlineDateInput, InlineUserInput } from '../components/Forms'
import { InlineError, InlineNotification } from '../components/Notifications'
import { Title } from '../components/Layout'
import { useMutation } from '@apollo/client'
import { EDIT_TRANSFER } from '../utils/mutations'
import { useHistory } from 'react-router-dom'

const EditTransferEntry = ( { budgetState, editingID } ) => {

  const history = useHistory();

  const incomingEditData = budgetState.entries.find( x => x._id === editingID )

  const initialFormState = { value: incomingEditData.value, createdAt: incomingEditData.createdAt, userID: incomingEditData.userID._id, toUserID: incomingEditData.toUserID._id  }
  
  const [ formInput, setFormInput ] = useState( { ...initialFormState } ) 

  function validateForm( form ){
    if( form.value === undefined || form.userID === '' || form.toUserID === ''  ){
      return false
    }
    if( form.value !== 0 && form.userID !== '' && form.toUserID !== '' ){
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

  const [ processSumbit, { loading: createdLoading, error: createdError }] = useMutation(EDIT_TRANSFER, {
    variables: { 
      input: { 
        entryID: editingID,
        value: formInput.value,
        budgetID: budgetState._id,
        createdAt: formInput.createdAt,
        userID: formInput.userID,
        toUserID: formInput.toUserID
      }
    },
    update: ( cache, data ) => {
      try {
        if( data ){
          history.push( `/budget/${ budgetState._id }` );
          return window.location.reload()
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
        <InlineUserInput prop={ 'userID' } input={ formInput } setInput={ setFormInput } label={ 'From User' } optionList={ budgetState.ownerIDs }/>
        <InlineNumberInput prop={ `value` } input={ formInput } setInput={ setFormInput } label={ 'Value' }/>      
        <InlineDateInput prop={ `createdAt` } input={ formInput } setInput={ setFormInput } label={ 'Transaction Date' }/>
        <InlineUserInput prop={ 'toUserID' } input={ formInput } setInput={ setFormInput } label={ 'To User' } optionList={ budgetState.ownerIDs }/>
        { formInput.error && <InlineError text={ formInput.error }/> }
      </form>
      { createdLoading ? <InlineNotification text={ 'Submit processing' }/> :  <ActionButton action={ sumbitForm } text={ 'Submit' } additionalClass={ null } /> }
    </section>
  )

};

export default EditTransferEntry;
