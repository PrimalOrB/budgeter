import React, { useState, useEffect } from "react";
import { useParams } from 'react-router';
import { useMutation } from '@apollo/client'
import { QUERY_CURRENT_BUDGET } from '../utils/mutations'
import { useStoreContext } from '../utils/GlobalState'
import { InlineError } from '../components/Notifications'
import { SpinLoader } from '../components/Loaders'
import { NavStateContainer } from '../components/Menus'
import { MultiMonthBudgetOverview } from '../components/Charts'
import { Title } from '../components/Layout'
import { AddCategory, AddTransactionEntry, RecentTransactions, AllCategories, EditCategory, MonthSummary } from './'
import { parseBudgetData } from '../utils/helpers'
import { format, startOfMonth, endOfMonth } from 'date-fns'

const Budget = () => {
  
  const { id: _id, tab } = useParams();
  const [ pageState, setPageState ] = useState( tab === undefined ? 'dashboard' : tab )

  const [ state ] = useStoreContext();
  const { currentUser } = state

  const [ budgetState, setBudgetState ] = useState( {} )
  const [ parsedBudgetState, setParsedBudgetState ] = useState( null )
  const [ errorState, setErrorState ] = useState()

  const [ highlightMonthState, setHighlightMonthState ] = useState( format( new Date(), 'M/yy' ) )

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
          setParsedBudgetState( parseBudgetData( { budget: { ...data.data.queryBudget }, date: new Date(), duration: 6 } ) )
          setHighlightMonthState( format( new Date(), 'M/yy' ) )
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[ currentUser ])
  
  if( errorState ){
    return (
      <InlineError text={ errorState } />
    )
  }

  // buttons
  const buttons = [
    { text: 'Overview', desc: '', link: `dashboard` },
    { text: 'Add Expense -', desc: '', link: `add-expense` },
    { text: 'Add Income +', desc: '', link: `add-income` },
    { text: 'Categories', desc: '', link: `categories` },
    { text: 'Add Category +', desc: '', link: `add-category` }
  ]

  return (
    <>
      
      { budgetState?.title && 
        <>
          {/* <section className=""> */}
            <Title id={ "budget-title" } text={ budgetState.title } additionalClass={ 'margin-bottom-none' }/>
            <NavStateContainer id={ "budget-menu" } buttons={ buttons } state={ pageState } setState={ setPageState } addClass={ "margin-top-none" }/>
          {/* </section>
          <section className="budget-container"> */}
              { pageState === "dashboard" && (
                <>
                  <h3 id="budget-description" className="container-description">{ budgetState.desc }</h3>
                  { parsedBudgetState &&
                    <MultiMonthBudgetOverview data={ parsedBudgetState } highlightMonthState={ highlightMonthState } setHighlightMonthState={ setHighlightMonthState }/>
                  }
                  <RecentTransactions categories={ budgetState.categories } transactions={ budgetState.entries.sort( ( a, b ) => b.createdAt - a.createdAt ).slice( 0, 6 ) } />
                  <MonthSummary highlightMonthState={ highlightMonthState }categories={ budgetState.categories } transactions={ budgetState.entries
                    .filter( entry => entry.createdAt >= startOfMonth( new Date( `20${Number( highlightMonthState.split('/')[1] )}`, Number( highlightMonthState.split('/')[0] ) ) - 1, 1 ) && entry.createdAt <= endOfMonth( new Date( `20${Number( highlightMonthState.split('/')[1] )}`, Number( highlightMonthState.split('/')[0] ) ) - 1, 1 ) )
                    .sort( ( a, b ) => b.createdAt - a.createdAt ) } />

                </>
              )}
              { pageState === "add-expense" && (
                <>
                  <AddTransactionEntry categoryType={ 'expense' } budgetState={ budgetState } refetch={ queryBudget }/>
                </>
              )}
              { pageState === "add-income" && (
                <>
                  <AddTransactionEntry categoryType={ 'income' } budgetState={ budgetState } refetch={ queryBudget }/>
                </>
              )}
              { pageState === "categories" && (
                <>
                  <AllCategories categories={ budgetState.categories } setPageState={ setPageState }/>
                </>
              )}
              { pageState === "add-category" && (
                <>
                  <AddCategory id={ _id }/>
                </>
              )}
              { pageState === "edit-category" && (
                <>
                  <EditCategory/>
                </>
              )}            
            {/* </section> */}
          </>
        }
        { queryLoading && <SpinLoader /> }
    </>
  )

};

export default Budget;
