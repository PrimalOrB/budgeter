import React, { useState, useEffect } from "react";
import { useParams } from "react-router";
import { useMutation } from '@apollo/client'
import { QUERY_CURRENT_BUDGET } from '../utils/mutations'
import { useStoreContext } from '../utils/GlobalState'
import { InlineError } from '../components/Notifications'
import { SpinLoader } from '../components/Loaders'
import { NavStateContainer }from '../components/Menus'
import { Title } from '../components/Layout'
import { AddCategory } from './'

const Budget = () => {
  
  const defaultPage = "home"
  const [ pageState, setPageState ] = useState( defaultPage )

  const { id: _id } = useParams();
  const [ state ] = useStoreContext();
  const { currentUser } = state

  const [ budgetState, setBudgetState ] = useState( {} )
  const [ errorState, setErrorState ] = useState()

  const [ queryBudget, { loading: queryLoading, error: queryError }] = useMutation(QUERY_CURRENT_BUDGET, {
    variables: { 
      input: {
        user: currentUser._id,
        budget: _id
      }
    },
    update: ( cache, data ) => {
      try {
        if( data.data.queryBudget ){
          setBudgetState( { ...data.data.queryBudget } )
        }
      } catch (e) {
        console.log( e )
      }
    },
    onError: (err) => {
      setErrorState( err.message )
    }
  })

  // onload run query
  useEffect(()=>{
    if( currentUser?._id ){
      queryBudget()
    }
  },[ currentUser ])
  
  if( errorState ){
    return (
      <InlineError text={ errorState} />
    )
  }

  // buttons
  const buttons = [
    { text: 'Overview', desc: '', link: `home` },
    { text: 'Add Debit -', desc: '', link: `add-debit` },
    { text: 'Add Credit +', desc: '', link: `add-credit` },
    { text: 'Add Category +', desc: '', link: `add-category` }
  ]

  return (
    <>
      { queryLoading && <SpinLoader /> }
      { budgetState?.title && <section className="">
          <Title text={ budgetState.title } additionalClass={ 'margin-bottom-none' }/>
          <NavStateContainer buttons={ buttons } state={ pageState } setState={ setPageState }/>
          { pageState === "home" && (
            <>
            <h3 className="container-description">{ budgetState.desc }</h3>
            </>
          )}
          { pageState === "add-category" && (
            <>
            <AddCategory id={ _id }/>
            </>
          )}
        </section>}
    </>
  )

};

export default Budget;
