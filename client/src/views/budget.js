import React, { useState, useEffect } from "react";
import { useParams } from 'react-router';
import { useMutation } from '@apollo/client'
import { QUERY_CURRENT_BUDGET } from '../utils/mutations'
import { useStoreContext } from '../utils/GlobalState'
import { InlineError } from '../components/Notifications'
import { FullPageSpinLoader } from '../components/Loaders'
import { NavStateContainer } from '../components/Menus'
import { MultiMonthBudgetOverview } from '../components/Charts'
import { Title } from '../components/Layout'
import { AddCategory, AddTransactionEntry, EditTransactionEntry, AddTransferEntry, EditTransferEntry, RecentTransactions, AllCategories, EditCategory, MonthSummary } from './'
import { parseBudgetData } from '../utils/helpers'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { FaCaretUp, FaCaretDown, FaFolder, FaFolderPlus, FaHome } from 'react-icons/fa'
import { BiTransferAlt } from 'react-icons/bi'

const Budget = () => {
  
  const { id: _id, tab } = useParams();
  const [ pageState, setPageState ] = useState( tab === undefined ? 'dashboard' : tab )

  const [ state ] = useStoreContext();
  const { currentUser } = state

  const [ budgetState, setBudgetState ] = useState( {} )
  const [ parsedBudgetState, setParsedBudgetState ] = useState( null )
  const [ errorState, setErrorState ] = useState()
  const [ editingTransaction, setEditingTransaction ] = useState( null )

  const [ highlightMonthState, setHighlightMonthState ] = useState( format( new Date(), 'M/yy' ) )

  const [ paginateState, setPaginatState ] = useState( { limit: 6, offset: 0, page: 0, length: 0 })

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
          setPaginatState( { ...paginateState, length: data.data.queryBudget.entries.length })
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
    { text: 'Overview', desc: '', link: `dashboard`, svg: FaHome, svgClass: 'icon-margin' },
    { text: 'Add Expense', desc: '', link: `add-expense`, svg: FaCaretDown, svgClass:'sub' },
    { text: 'Add Income', desc: '', link: `add-income`, svg: FaCaretUp, svgClass:'add' },
    { text: 'Transfer', desc: '', link: `add-transfer`, svg: BiTransferAlt, svgClass:'transfer' },
    { text: 'Categories', desc: '', link: `categories`, svg: FaFolder, svgClass: 'icon-margin' },
    { text: 'Add Category', desc: '', link: `add-category`, svg: FaFolderPlus, svgClass: 'icon-margin' },
  ]

  return (
    <>
      
      { budgetState?.title && 
        <>
            <Title id={ "budget-title" } text={ budgetState.title } additionalClass={ 'margin-bottom-none noselect' }/>
            <NavStateContainer id={ "budget-menu" } buttons={ buttons } state={ pageState } setState={ setPageState } addClass={ "margin-top-none" }/>
              { pageState === "dashboard" && (
                <>
                  <h3 id="budget-description" className="container-description noselect">{ budgetState.desc }</h3>
                  { parsedBudgetState &&
                    <MultiMonthBudgetOverview data={ parsedBudgetState } highlightMonthState={ highlightMonthState } setHighlightMonthState={ setHighlightMonthState }/>
                  }
                  <RecentTransactions categories={ budgetState.categories } transactions={ budgetState.entries.sort( ( a, b ) => b.createdAt - a.createdAt ).slice( paginateState.offset, paginateState.limit + paginateState.offset ) } paginateState={ paginateState } setPaginatState={ setPaginatState } />
                  <MonthSummary highlightMonthState={ highlightMonthState } categories={ budgetState.categories } setPageState={ setPageState } setEditingTransaction={ setEditingTransaction } transactions={ budgetState.entries
                    .filter( entry => entry.createdAt >= startOfMonth( new Date( `20${Number( highlightMonthState.split('/')[1] )}`, Number( highlightMonthState.split('/')[0] ) ) - 1, 1 ) && entry.createdAt <= endOfMonth( new Date( `20${Number( highlightMonthState.split('/')[1] )}`, Number( highlightMonthState.split('/')[0] ) ) - 1, 1 ) )
                    .sort( ( a, b ) => b.createdAt - a.createdAt ) } />

                </>
              )}
              { pageState === "add-expense" && (
                <>
                  <AddTransactionEntry categoryType={ 'expense' } budgetState={ budgetState } setPageState={ setPageState } refetch={ queryBudget }/>
                </>
              )}
              { pageState === "add-income" && (
                <>
                  <AddTransactionEntry categoryType={ 'income' } budgetState={ budgetState } setPageState={ setPageState } refetch={ queryBudget }/>
                </>
              )}
              { pageState === "add-transfer" && (
                <>
                  <AddTransferEntry categoryType={ 'transfer' } budgetState={ budgetState } setPageState={ setPageState } refetch={ queryBudget }/>
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
              { pageState === "edit-transaction" && (
                <>
                  <EditTransactionEntry editingID={ editingTransaction } budgetState={ budgetState } setPageState={ setPageState } setBudgetState={ setBudgetState }/>
                </>
              )} 
              { pageState === "edit-transfer" && (
                <>
                  <EditTransferEntry editingID={ editingTransaction } budgetState={ budgetState } setPageState={ setPageState } setBudgetState={ setBudgetState }/>
                </>
              )} 
              { pageState === "edit-category" && (
                <>
                  <EditCategory/>
                </>
              )}            
          </>
        }
        { queryLoading && <section className="full-container"><FullPageSpinLoader /></section> }
    </>
  )

};

export default Budget;
