import React, { useState } from 'react';
import { ActionButton } from '../components/Buttons'
import { InlineTextInput, BudgetValueRangeGroup, InlineSelectInput } from '../components/Forms'
import { InlineError, InlineNotification } from '../components/Notifications'
import { useMutation } from '@apollo/client'
import { CREATE_NEW_BUDGET_CATEGORY } from '../utils/mutations'
import { useHistory } from 'react-router-dom'
import { Title } from '../components/Layout'
import { startOfMonth, endOfMonth, add  } from 'date-fns'
import { dateRemoveTZ } from '../utils/helpers'

const AddCategory = ( { id } ) => {

  const initialRange = { order: 0, effectiveStartDate: dateRemoveTZ( startOfMonth( new Date() ) ), effectiveEndDate: null, budgetedValue: 0 } 

  const [ formInput, setFormInput ] = useState( { budgetID: id, title: '', categoryType: '', budgetedValueRange: [ { ...initialRange } ] } ) 

  const history = useHistory();

  function validateForm( form ){
    if( form.title === undefined || form.budgetID === undefined || form.categoryType === undefined || form.budgetedValueRange.length === 0 ){
      return false
    }
    if( form.title.length > 0 && form.budgetID.length > 0 && form.categoryType.length > 0 && form.budgetedValueRange.length > 0 ){
      return true
    }
    return false
  }

  const addNewRange = () => {
    const currentRanges = [ ...formInput.budgetedValueRange ]
    let lastEntry = currentRanges.pop()

    // apply end date to current last entry, and add new entry which starts after
    if( !lastEntry.effectiveEndDate ){
      const lastDate = Math.max( dateRemoveTZ( endOfMonth( new Date() ) ), dateRemoveTZ( endOfMonth( add( lastEntry.effectiveStartDate, { months: 1 } ) ) ) )
      lastEntry.effectiveEndDate = dateRemoveTZ( endOfMonth( lastDate ) )
      let newRange = { ...initialRange, order: formInput.budgetedValueRange.length, effectiveStartDate: dateRemoveTZ( startOfMonth( add( lastDate, { months: 1 } ) ) ) }
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

  // console.log( formInput )

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

  const [ processSumbit, { loading: createdLoading, error: createdError }] = useMutation(CREATE_NEW_BUDGET_CATEGORY, {
    variables: { 
      input: {
        budgetID: formInput.budgetID,
        categoryType: formInput.categoryType,
        title: formInput.title,
        budgetedValueRange: formInput.budgetedValueRange.map(({ error, ...rest }) => rest)
      }
    },
    update: ( cache, data ) => {
      try {
        if( data ){
          return history.push( `/budget/${ formInput.budgetID }` );
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
        <InlineSelectInput prop={ 'categoryType' } input={ formInput } setInput={ setFormInput } label={ 'Type' } optionList={ ['income','expense']  }/>
        <InlineTextInput prop={ 'title' } input={ formInput } setInput={ setFormInput } label={ 'Category Name' }/>
        { formInput.budgetedValueRange.map( ( range, i ) => {
          return (
            <BudgetValueRangeGroup key={ `${ i }_range` } index={ i } parentProp={ 'budgetedValueRange' } input={ formInput } setInput={ setFormInput } triggerDateAudit={ handleDateRanges }/>
          )
        })}
        { formInput.error && <InlineError text={ formInput.error }/> }
      </form>
      <hr/>
      <ActionButton action={ addNewRange } text={ 'Add Another Range' } additionalClass={ null } />
      <hr/>
      { createdLoading ? <InlineNotification text={ 'Submit processing' }/> :  <ActionButton action={ sumbitForm } text={ 'Submit' } additionalClass={ null } /> }
    </section>
  )

};

export default AddCategory;
