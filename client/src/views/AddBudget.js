import React, { useState, useEffect } from "react";
import { ActionButton } from '../components/Buttons'
import { InlineTextInput, InlineTextareaInput, InlineListDisplay, InlineEmailInput } from '../components/Forms'
import { InlineError, InlineNotification } from '../components/Notifications'
import { useStoreContext } from '../utils/GlobalState'
import { isEmail } from '../utils/helpers'
import { useMutation } from '@apollo/client'
import { CREATE_NEW_BUDGET } from '../utils/mutations'
import { useHistory } from "react-router-dom";

const AddBudget = () => {
  
  const [ formInput, setFormInput ] = useState( { title: '', desc: '', email: '', owner: null, emails: [], error: null } ) 
  
  const [ state ] = useStoreContext();

  const history = useHistory();

  useEffect(()=>{
    if( state?.currentUser ){
      setFormInput( {
        ...formInput,
        owner: state.currentUser.email
      } )
    }
  },[ state ])

  function validateForm( form ){
    if( form.title === undefined || form.desc === undefined || form.owner === undefined ){
      return false
    }
    if( form.title.length > 0 && form.desc.length > 0 && form.owner !== null && isEmail( form.owner) ){
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

  const [ processSumbit, { loading: createdLoading, error: createdError }] = useMutation(CREATE_NEW_BUDGET, {
    variables: { 
      input: {
        owner: formInput.owner,
        emails: formInput.emails,
        title: formInput.title,
        desc: formInput.desc
      }
    },
    update: ( cache, data ) => {
      try {
        if( data ){
          return history.push( `/budget/${ data.data.createBudget._id }` );
        }
      } catch (e) {
        console.error( createdError );
      }
  }
  })

  return (
    <section>
      <h2 className="container-title">Create New Budget</h2>
      <form autoComplete="off">
        <InlineTextInput prop={ 'title' } input={ formInput } setInput={ setFormInput } label={ 'Budget Title' }/>
        <InlineTextareaInput prop={ 'desc' } input={ formInput } setInput={ setFormInput } label={ 'Description' }/>
        <InlineListDisplay input={ formInput } setInput={ setFormInput } label={ 'Owners' }/>
        <InlineEmailInput prop={ 'email' } input={ formInput } setInput={ setFormInput } label={ 'Add More Owners' } placeholder={ "Type or paste email addresses and press `Enter`" }/> 
        { formInput.error && <InlineError text={ formInput.error }/> }
      </form>
      <hr/>
      { createdLoading ? <InlineNotification text={ 'Submit processing' }/> :  <ActionButton action={ sumbitForm } text={ 'Submit' } additionalClass={ null } /> }
    </section>
  )

};

export default AddBudget;
