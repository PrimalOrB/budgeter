import React, { useState, useEffect } from "react";
import { ActionButton } from '../components/Buttons'
import { InlineTextInput, InlineNumberInput, InlineDateInput } from '../components/Forms'
import { InlineError, InlineNotification } from '../components/Notifications'
import { isEmail } from '../utils/helpers'
import { useMutation } from '@apollo/client'
import { CREATE_NEW_BUDGET } from '../utils/mutations'
import { useHistory } from "react-router-dom";
import { Title } from '../components/Layout'

const AddCategory = () => {

  const [ formInput, setFormInput ] = useState( { title: '', effectiveStartDate: null, effectiveEndDate: '', budgetedValue: 0 } ) 

  const history = useHistory();

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
      // return processSumbit()
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
      <Title text={ `Create New Category` } />
      <form autoComplete="off">
        <InlineTextInput prop={ 'title' } input={ formInput } setInput={ setFormInput } label={ 'Category Name' }/>
        <InlineNumberInput prop={ 'budgetedValue' } input={ formInput } setInput={ setFormInput } label={ 'Monthly Value' } min={ 0 }/>
        <InlineDateInput prop={ 'budgetedValue' } input={ formInput } setInput={ setFormInput } label={ 'Start Month' }/>
        { formInput.error && <InlineError text={ formInput.error }/> }
      </form>
      <hr/>
      { createdLoading ? <InlineNotification text={ 'Submit processing' }/> :  <ActionButton action={ sumbitForm } text={ 'Submit' } additionalClass={ null } /> }
    </section>
  )

};

export default AddCategory;
