import React, { useState, useEffect } from "react";
import { ButtonContainer }from '../components/Menus'
import { useMutation } from '@apollo/client'
import { QUERY_ALL_USER_BUDGETS } from '../utils/mutations'
import { useStoreContext } from '../utils/GlobalState'

const Home = () => {

  const [ state ] = useStoreContext();
  const { currentUser } = state

  const [ budgetState, setBudgetState ] = useState( [] )

  const [ queryBudgets, { loading: queryLoading, error: queryError }] = useMutation(QUERY_ALL_USER_BUDGETS, {
    variables: { 
      input: {
        _id: currentUser._id
      }
    },
    update: ( cache, data ) => {
      try {
        if( data.data.queryUserBudgets ){
          const buttons = []
          data.data.queryUserBudgets.map( x => {
            return buttons.push( { title: x.title, desc: x.desc, link: `/budget/${ x._id }` } )
          })
          buttons.push( { title: 'Create New Budget +', desc: 'test', link: '/add-budget', disabled: true } )
          setBudgetState( [ ...buttons ] )
        }
      } catch (e) {
        console.error( queryError );
      }
    }
  })

  // onload run query
  useEffect(()=>{
    if( currentUser?._id ){
      queryBudgets()
    }
  },[ currentUser ])
  
  return (
    <>
      <ButtonContainer title={ 'Your Budgets'} buttons={ budgetState }/>
    </>
  )

};

export default Home;
