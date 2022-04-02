import React, { useState, useEffect } from "react";
import { useParams } from "react-router";
import { useMutation } from '@apollo/client'
import { QUERY_CURRENT_BUDGET } from '../utils/mutations'
import { useStoreContext } from '../utils/GlobalState'
import { InlineError } from '../components/Notifications'
import { SpinLoader } from '../components/Loaders'
import { ButtonContainer }from '../components/Menus'
import { Title } from '../components/Layout'

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
      { budgetState?.title && <section>
          <Title text={ budgetState.title } />
          <h3 className="container-description">{ budgetState.desc }</h3>
          {/* <div className="container-grid-full">
              { buttons.map( ( x, i ) => {
                  return <PrimaryButton key={ `${i}_budget` } title={ x.title } desc={ x.desc } disabled={ x.disabled || false } link={ x.link }/>
              })}
          </div> */}
        </section>}
    </>
  )

};

export default Budget;
