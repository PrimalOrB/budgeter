import React, { useState } from 'react'
import { format } from 'date-fns'
import { toCurrency, sumPropArray } from '../utils/helpers'
import { SingleMonthCategoryCost } from '../components/Charts'
import { BudgetCategoryExpandableList, BudgetCategoryEntriesExpandableList } from '../components/Layout'
import { FaCaretDown, FaCaretUp } from 'react-icons/fa'

const MonthSummary = ( { highlightMonthState, categories, transactions } ) => {
  
  const date = new Date( `20${Number( highlightMonthState.split('/')[1] )}`, Number( highlightMonthState.split('/')[0] ) - 1, 1 )

  const [ expandedState, setExpandedState ] = useState( { income: false, expense: false, balance: false, transfers: false } )

  const uniqueUsers = [...new Set(transactions.map (entry => entry.userID._id ) ) ]
    .map( userID => { return { 
      userID, 
      incomeTotal: 0, 
      expensesTotal: 0, 
      incomeShared: 0, 
      expensesShared: 0, 
      transfersOut: 0, 
      transfersIn: 0,
      portionTotalExpenses: 0,
      portionTotalIncome: 0,
      balanceTotal: 0,
      portionSharedExpenses: 0,
      portionSharedIncome: 0,
      balanceShared: 0,
      responsibleExpenses: 0
     } } )
  // add expenses to users
  const expenseByMonth = transactions.filter( entry => entry.valueType === 'expense' )
    .map( entry => {
      const matchUser = uniqueUsers.findIndex( user => { return user.userID === entry.userID._id } )
      if( matchUser >= 0 ){
        uniqueUsers[matchUser].expensesTotal  += entry.value
      }
      return entry
    })
  const expenseByMonthShared = transactions.filter( entry => entry.valueType === 'expense' && !entry.individualEntry )
    .map( entry => {
      const matchUser = uniqueUsers.findIndex( user => { return user.userID === entry.userID._id } )
      if( matchUser >= 0 ){
        uniqueUsers[matchUser].expensesShared  += entry.value
      }
      return entry
    })
  // add income to users
  const incomeByMonth = transactions.filter( entry => entry.valueType === 'income' )
    .map( entry => {
      const matchUser = uniqueUsers.findIndex( user => { return user.userID === entry.userID._id } )
      if( matchUser >= 0 ){
        uniqueUsers[matchUser].incomeTotal  += entry.value
      }
      return entry
    })
  const incomeByMonthShared = transactions.filter( entry => entry.valueType === 'income' && !entry.individualEntry )
    .map( entry => {
      const matchUser = uniqueUsers.findIndex( user => { return user.userID === entry.userID._id } )
      if( matchUser >= 0 ){
        uniqueUsers[matchUser].incomeShared  += entry.value
      }
      return entry
    })
  // add transfers to users
  const transferByMonth = transactions.filter( entry => entry.valueType === 'transfer' ).map( entry => {
    const matchUserOut = uniqueUsers.findIndex( user => { return user.userID === entry.userID._id } )
    if( matchUserOut >= 0 ){
      uniqueUsers[matchUserOut].transfersOut  += entry.value
    }
    const matchUserIn = uniqueUsers.findIndex( user => { return user.userID === entry.toUserID._id } )
    if( matchUserIn >= 0 ){
      uniqueUsers[matchUserIn].transfersIn  += entry.value
    }
    return entry
  })
  // run balances
  uniqueUsers.map( user => {
    user.portionSharedExpenses = user.expensesShared / sumPropArray( expenseByMonthShared, 'value' )
    user.portionSharedIncome = user.incomeShared  / sumPropArray( incomeByMonthShared, 'value' )
    user.responsibleExpenses = sumPropArray( expenseByMonthShared, 'value' ) * user.portionSharedIncome
    user.balanceAfterTransfer = user.responsibleExpenses - user.transfersOut + user.transfersIn
    user.subUserBalance = user.balanceAfterTransfer - user.portionSharedExpenses
    return user.userBalance = user.subUserBalance - user.portionSharedExpenses
  })
  
  console.log( uniqueUsers )

  return (
    <section id="month-summary" >
      <h4 className="sub-container-description section-list-title">{ format( date, "MMMM yyyy" ) }</h4>
      <div className="dual-doughnut-container">
        <SingleMonthCategoryCost valueType="expense" activeDate={ date } highlightMonthState={ highlightMonthState } categories={ categories.filter( category => category.categoryType === 'expense' ) } transactions={ expenseByMonth } />
        <SingleMonthCategoryCost valueType="income" activeDate={ date } highlightMonthState={ highlightMonthState } categories={ categories.filter( category => category.categoryType === 'income' ) } transactions={ incomeByMonth } />
      </div>

        {/* balances section */}
      <ul className="monthly-group-detail border-b-l-rad-none border-b-r-rad-none border_b_none">        
        <li className="flex nowrap flex-just-space-around f-full" onClick={ () => setExpandedState( { ...expandedState, balance: !expandedState.balance } ) }>
          <span className="f0 margin-right-half">
            { expandedState.balance ? FaCaretUp() : FaCaretDown() }
          </span>
          <span className="f1 bold noselect">
            Balance
          </span>
          <span className="f1 bold right">
            { toCurrency( sumPropArray( incomeByMonth, 'value' ) - sumPropArray( expenseByMonth, 'value' ) ) }
          </span>
        </li>
        { expandedState.balance &&
           uniqueUsers.map( user => {
             return (
              <ul key={ user.userID }>
                { user.userID }
                  <li>Total Expenses: { toCurrency( user.expensesTotal ) }</li>
                  <li>Total Income: { toCurrency( user.incomeTotal ) }</li>
                  <li>Shared Expenses: { toCurrency( user.expensesShared ) }</li>
                  <li>Shared Income: { toCurrency( user.incomeShared ) }</li>
                  <li>Transfers Out: { toCurrency( user.transfersOut ) }</li>
                  <li>Transfers In: { toCurrency( user.transfersIn ) }</li>
                  <li>Total Expenses %: { ( user.portionTotalExpenses * 100 ).toFixed(1) }%</li>
                  <li>Total Income %: { ( user.portionSharedIncome * 100 ).toFixed(1) }%</li>
                  <li>User Expense Responsibility: { toCurrency( user.responsibleExpenses ) }</li>
                  <li>User After Transfers: { toCurrency( user.balanceAfterTransfer ) }</li>
                  <li>User Balance: { toCurrency( user.subUserBalance ) }</li>
                  <li>Final Balance: { toCurrency( user.userBalance ) }</li>
              </ul>
             )
           })
        }
      </ul> 

        {/* expenses section */}
      <ul className="monthly-group-detail border-b-l-rad-none border-b-r-rad-none border_b_none border-t-l-rad-none border-t-r-rad-none">        
        <li className="flex nowrap flex-just-space-around f-full" onClick={ () => setExpandedState( { ...expandedState, expense: !expandedState.expense } ) }>
          <span className="f0 margin-right-half">
            { expandedState.expense ? FaCaretUp() : FaCaretDown() }
          </span>
          <span className="f1 bold noselect">
            Expenses
          </span>
          <span className="f1 bold right">
            { toCurrency( sumPropArray( expenseByMonth, 'value' ) ) }
          </span>
        </li>
        { expandedState.expense &&
           [ ...new Set( categories.map( category => category._id ) ) ].map( entry => {

            const category = categories.filter( category => category._id === entry )
            const entries = expenseByMonth.filter( entry => entry.categoryID === category[0]._id )
            
            if( entries.length === 0 ){
              return null
            }

            return (
              <BudgetCategoryExpandableList key={ `exp_${ category[0]._id }` } category={ category[0].title } data={ entries } />
            )
          })
        }
      </ul>   

        {/* income section */}
      <ul className="monthly-group-detail border-b-l-rad-none border-b-r-rad-none border_b_none border-t-l-rad-none border-t-r-rad-none">        
        <li className="flex nowrap flex-just-space-around f-full" onClick={ () => setExpandedState( { ...expandedState, income: !expandedState.income } ) }>
          <span className="f0 margin-right-half">
            { expandedState.income ? FaCaretUp() : FaCaretDown() }
          </span>
          <span className="f1 bold noselect">
            Income
          </span>
          <span className="f1 bold right">
            { toCurrency( sumPropArray( incomeByMonth, 'value' ) ) }
          </span>
        </li>
        { expandedState.income &&
           [ ...new Set( categories.map( category => category._id ) ) ].map( entry => {

            const category = categories.filter( category => category._id === entry )
            const entries = incomeByMonth.filter( entry => entry.categoryID === category[0]._id )

            if( entries.length === 0 ){
              return null
            }

            return (
              <BudgetCategoryExpandableList key={ `inc_${ category[0]._id }` } category={ category[0].title } data={ entries } />
            )
          })
        }
      </ul>  

        {/* transfer section */}
      <ul className="monthly-group-detail border-t-l-rad-none border-t-r-rad-none">        
        <li className="flex nowrap flex-just-space-around f-full" onClick={ () => setExpandedState( { ...expandedState, transfers: !expandedState.transfers } ) }>
          <span className="f0 margin-right-half">
            { expandedState.transfers ? FaCaretUp() : FaCaretDown() }
          </span>
          <span className="f1 bold noselect">
            Transfers
          </span>
          <span className="f1 bold right">
            { toCurrency( sumPropArray( transferByMonth, 'value' ) ) }
          </span>
        </li>
        { expandedState.transfers &&
          transferByMonth.map( transfer => {
            return ( 
              <BudgetCategoryEntriesExpandableList key={ transfer._id } entry={ transfer } />
            )
          })
        }
      </ul>  
    </section>
  )

};

export default MonthSummary;
