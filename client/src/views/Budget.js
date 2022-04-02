import React, { useState, useEffect } from "react";
import { useParams } from "react-router";
import { useMutation } from '@apollo/client'
import { QUERY_CURRENT_BUDGET } from '../utils/mutations'
import { useStoreContext } from '../utils/GlobalState'
import { InlineError } from '../components/Notifications'
import { SpinLoader } from '../components/Loaders'

const Budget = () => {

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

  return (
    <>
      { queryLoading && <SpinLoader /> }
      { budgetState?.title && <h3>Title { budgetState.title }</h3>}
      { budgetState?.desc && <h3>Description { budgetState.desc }</h3>}
    </>
  )

};

export default Budget;
