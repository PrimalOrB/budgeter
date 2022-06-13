import React, { useState } from 'react'
import { ActionButton } from '../components/Buttons'
import { InlineNumberInput, InlineDateInput, InlineUserInput } from '../components/Forms'
import { InlineError, InlineNotification } from '../components/Notifications'
import { Title } from '../components/Layout'
import { useMutation } from '@apollo/client'
import { CREATE_NEW_TRANSFER } from '../utils/mutations'
import { useStoreContext } from '../utils/GlobalState'

const AddTransferEntry = ( { categoryType, budgetState, refetch } ) => {

  const [ state ] = useStoreContext();
  
  const initialFormState = { value: 0, createdAt: new Date(), userID: state.currentUser._id, toUserID: ''  }
  
  const [ formInput, setFormInput ] = useState( { ...initialFormState } ) 

  function validateForm( form ){
    if( form.value === undefined || form.userID === form.toUserID || form.userID === '' || form.toUserID === ''  ){
      return false
    }
    if( form.value !== 0 && form.userID !== form.toUserID && form.userID !== '' && form.toUserID !== '' ){
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

  const [ processSumbit, { loading: createdLoading, error: createdError }] = useMutation(CREATE_NEW_TRANSFER, {
    variables: { 
      input: { 
        value: formInput.value,
        budgetID: budgetState._id,
        createdAt: formInput.createdAt,
        userID: formInput.userID,
        toUserID: formInput.userID
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
    <section className="full-container">
      <Title text={ `Add ${ categoryType }` } />
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

export default AddTransferEntry;
