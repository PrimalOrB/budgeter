import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router';
import { ActionButton } from '../components/Buttons'
import { InlineTextInput, BudgetValueRangeGroup, InlineSelectInput } from '../components/Forms'
import { InlineError, InlineNotification } from '../components/Notifications'
import { useMutation } from '@apollo/client'
import { QUERY_BUDGET_CATEGORY, UPDATE_BUDGET_CATEGORY } from '../utils/mutations'
import { useNavigate  } from 'react-router-dom'
import { Title } from '../components/Layout'
import { startOfMonth, endOfMonth, add  } from 'date-fns'
import { dateRemoveTZ } from '../utils/helpers'

const EditCategory = () => {

  const { cat } = useParams();   

  const [ formInput, setFormInput ] = useState( { budgetID: null, title: '', categoryType: '', budgetedValueRange: [] } ) 
  const [ errorState, setErrorState ] = useState()

  const [ queryCategory, { loading: queryLoading, error: queryError }] = useMutation(QUERY_BUDGET_CATEGORY, {
    variables: { 
      input: {
        _id: cat
      }
    },
    update: ( cache, data ) => {
      try {
        if( data.data.queryCategory ){
          let newState = { ...data.data.queryCategory }
          setFormInput( { ...newState } )
        }
      } catch (e) {
        console.log( e )
      }
    },
    onError: (err) => {
      setErrorState( err.message )
    }
  })

  useEffect(()=>{
    if( cat !== undefined ){
      queryCategory()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  const initialRange = { order: 0, effectiveStartDate: dateRemoveTZ( startOfMonth( new Date() ) ), effectiveEndDate: null, budgetedValue: 0 } 

  const history = useNavigate ();

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

  const [ processSumbit, { loading: createdLoading, error: createdError }] = useMutation(UPDATE_BUDGET_CATEGORY, {
    variables: { 
      input: {
        categoryID: cat,
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
    <section className="full-container">
      <Title text={ `Edit Category` } />
      { errorState 
        ?
          <InlineError text={ errorState } />
        :
          <>
            <form autoComplete="off">
              <InlineSelectInput prop={ 'categoryType' } input={ formInput } setInput={ setFormInput } label={ 'Type' } optionList={ ['income','expense']  } disabled/>
              <InlineTextInput prop={ 'title' } input={ formInput } setInput={ setFormInput } label={ 'Category Name' }/>
              { formInput.budgetedValueRange.map( ( range, i ) => {
                return (
                  <BudgetValueRangeGroup key={ `${ i }_range` } index={ i } parentProp={ 'budgetedValueRange' } input={ formInput } setInput={ setFormInput } triggerDateAudit={ handleDateRanges }/>
                )
              })}
              { formInput.error && <InlineError text={ formInput.error }/> }
            </form>
            <ActionButton action={ addNewRange } text={ 'Add Another Range' } additionalClass={ 'large-button' } />
            { createdLoading ? <InlineNotification text={ 'Submit processing' }/> :  <ActionButton action={ sumbitForm } text={ 'Submit Edit' } additionalClass={ 'large-button' } /> }
          </>
      }
    </section>
  )

};

export default EditCategory;
