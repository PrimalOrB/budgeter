import React, { useState } from "react";
import { ActionButton } from '../components/Buttons'
import { InlineTextInput, BudgetValueRangeGroup } from '../components/Forms'
import { InlineError, InlineNotification } from '../components/Notifications'
import { isEmail } from '../utils/helpers'
import { useMutation } from '@apollo/client'
import { CREATE_NEW_BUDGET } from '../utils/mutations'
import { useHistory } from "react-router-dom";
import { Title } from '../components/Layout'
import { startOfMonth, endOfMonth, add  } from 'date-fns'

const AddCategory = ( { id } ) => {

  const initialRange = { order: 0, effectiveStartDate: startOfMonth( new Date() ), effectiveEndDate: null, budgetedValue: 0 } 

  const [ formInput, setFormInput ] = useState( { budgetID: id, title: '', budgetedValueRange: [ { ...initialRange } ] } ) 

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

  const addNewRange = () => {
    const currentRanges = [ ...formInput.budgetedValueRange ]
    let lastEntry = currentRanges.pop()

    // apply end date to current last entry, and add new entry which starts after
    if( !lastEntry.effectiveEndDate ){
      const lastDate = Math.max( endOfMonth( new Date() ), endOfMonth( lastEntry.effectiveStartDate ) )
      lastEntry.effectiveEndDate = endOfMonth( lastDate )
      let newRange = { ...initialRange, order: formInput.budgetedValueRange.length, effectiveStartDate: startOfMonth( add( lastDate, { months: 1 } ) ) }
      currentRanges.push( { ...lastEntry } )
      currentRanges.push( { ...newRange } )
    }

    return setFormInput( { ...formInput, budgetedValueRange: [ ...currentRanges ] } )
  }

  const handleDateRanges = ( arr ) => {

    const error = []
    arr.budgetedValueRange.map( ( x, i ) => {
      if( x.effectiveEndDate ){
        if( x.effectiveEndDate < arr.budgetedValueRange[i].effectiveStartDate ){
          error.push( true )
        }
      }
      if( x.effectiveStartDate && i > 0 ){
        if( x.effectiveStartDate < arr.budgetedValueRange[i-1].effectiveEndDate ){
          error.push( true )
        }
      }
      return i
    } )

    if( error.length > 1 ){
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
        { formInput.budgetedValueRange.map( ( range, i ) => {
          return (
            <BudgetValueRangeGroup key={ `${ i }_range` } index={ i } parentProp={ 'budgetedValueRange' } input={ formInput } setInput={ setFormInput } triggerDateAudit={ handleDateRanges }/>
          )
        })}
        <ActionButton action={ addNewRange } text={ 'Add Another Range' } additionalClass={ null } />
        { formInput.error && <InlineError text={ formInput.error }/> }
      </form>
      <hr/>
      { createdLoading ? <InlineNotification text={ 'Submit processing' }/> :  <ActionButton action={ sumbitForm } text={ 'Submit' } additionalClass={ null } /> }
    </section>
  )

};

export default AddCategory;
