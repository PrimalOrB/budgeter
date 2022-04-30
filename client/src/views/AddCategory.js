import React, { useState } from "react";
import { ActionButton } from '../components/Buttons'
import { InlineTextInput, BudgetValueRangeGroup } from '../components/Forms'
import { InlineError, InlineNotification } from '../components/Notifications'
import { isEmail } from '../utils/helpers'
import { useMutation } from '@apollo/client'
import { CREATE_NEW_BUDGET } from '../utils/mutations'
import { useHistory } from "react-router-dom";
import { Title } from '../components/Layout'
import { startOfMonth, endOfMonth, add, differenceInMonths  } from 'date-fns'

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
    console.log( currentRanges, lastEntry )
    if( lastEntry.effectiveEndDate ){
      console.log( 'exsting' )
      let newRange = { ...initialRange, effectiveStartDate: startOfMonth( add( lastEntry.effectiveEndDate, { months: 1 } ) ) }
      currentRanges.push( { ...lastEntry } )
      currentRanges.push( { ...newRange } )
    } else if ( currentRanges.length === 0 ) {
      console.log( 'new' )
      lastEntry.effectiveEndDate = endOfMonth( new Date() )
      currentRanges.push( { ...lastEntry } )
      let newRange = { ...initialRange, effectiveStartDate: startOfMonth( add( endOfMonth( new Date() ), { months: 1 } ) ) }
      currentRanges.push( { ...newRange } )
    } else {
      console.log( 'new addon' )
      lastEntry.effectiveEndDate = endOfMonth( new Date( currentRanges[currentRanges.length - 1 ].effectiveStartDate ) )
      currentRanges.push( { ...lastEntry } )
      let newRange = { ...initialRange, effectiveStartDate: startOfMonth( add( lastEntry.effectiveEndDate, { months: 1 } ) ) }
      currentRanges.push( { ...newRange } )
    }


    return setFormInput( { ...formInput, budgetedValueRange: [ ...currentRanges ] } )
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

  console.log( formInput )

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
            <BudgetValueRangeGroup key={ `${ i }_range` } index={ i } parentProp={ 'budgetedValueRange' } input={ formInput } setInput={ setFormInput }/>
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
