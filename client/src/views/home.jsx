import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { ButtonContainer }from '../components/Menus'
import { LoginButton } from '../components/Buttons'
import { useMutation } from '@apollo/client'
import { QUERY_ALL_USER_BUDGETS } from '../utils/mutations'
import { useStoreContext } from '../utils/GlobalState'
import { SpinLoader } from '../components/Loaders'
import { InlineError } from '../components/Notifications'

const Home = () => {

  const { isAuthenticated } = useAuth0();
  const [ state ] = useStoreContext();
  const { currentUser } = state

  const [ budgetState, setBudgetState ] = useState( [] )

  const [ queryBudgets, { loading: queryLoading, error: queryError }] = useMutation(QUERY_ALL_USER_BUDGETS, {
    variables: {
      input: {
        _id: currentUser._id
      }
    },
    onCompleted: ( data ) => {
      const buttons = data.queryUserBudgets.map( x => ( { title: x.title, desc: x.desc, link: `/budget/${ x._id }` } ) )
      buttons.push( { title: 'Create new budget', desc: 'Share a budget with others by email', link: '/add-budget', disabled: true } )
      setBudgetState( buttons )
    },
    onError: () => {}
  })

  // onload run query
  useEffect(()=>{
    if( currentUser?._id ){
      queryBudgets()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[ currentUser ])

  if( !isAuthenticated ){
    return (
      <section className="hero">
        <span className="hero-eyebrow">Shared budgeting</span>
        <h1 className="hero-title">Know where every dollar goes.</h1>
        <p className="hero-text">
          Track shared and individual income and expenses, split responsibility
          fairly, and see each month at a glance.
        </p>
        <LoginButton additionalClass="btn-primary btn-lg" />
      </section>
    )
  }

  return (
    <div className="page">
      { queryError && <InlineError text={ queryError.message } /> }
      { queryLoading && budgetState.length === 0 && <SpinLoader /> }
      { budgetState.length > 0 &&
        <ButtonContainer title={ 'Your budgets'} buttons={ budgetState } span={ 'full-width-section' }/>
      }
    </div>
  )

};

export default Home;
