import React, { useState } from 'react'
import { format } from 'date-fns'
import { toCurrency } from '../utils/helpers'
import { SingleMonthCategoryCost } from '../components/Charts'
import { FaCaretDown, FaCaretUp } from 'react-icons/fa'

const MonthSummary = ( { highlightMonthState, categories, transactions } ) => {
  
  const date = new Date( `20${Number( highlightMonthState.split('/')[1] )}`, Number( highlightMonthState.split('/')[0] ) - 1, 1 )

  const [ expandedState, setExpandedState ] = useState( { income: false, expense: false } )

  const expenseByMonth = transactions.filter( entry => entry.valueType === 'expense' )
  const incomeByMonth = transactions.filter( entry => entry.valueType === 'income' )

  return (
    <section id="month-summary" >
      <h4 className="sub-container-description section-list-title">{ format( date, "MMMM yyyy" ) }</h4>
      <div className="dual-doughnut-container">
        <SingleMonthCategoryCost valueType="expense" activeDate={ date } highlightMonthState={ highlightMonthState } categories={ categories.filter( category => category.categoryType === 'expense' ) } transactions={ expenseByMonth } />
        <SingleMonthCategoryCost valueType="income" activeDate={ date } highlightMonthState={ highlightMonthState } categories={ categories.filter( category => category.categoryType === 'income' ) } transactions={ incomeByMonth } />
      </div>

      <ul className="monthly-group-detail border-b-l-rad-none border-b-r-rad-none border_b_none">        
        <li className="flex nowrap flex-just-space-around f-full" onClick={ () => setExpandedState( { ...expandedState, expense: !expandedState.expense } )  }>
          <span className="f0 margin-right-half">
            { expandedState.expense ? FaCaretUp() : FaCaretDown() }
          </span>
          <span className="f1 bold">
            Expenses
          </span>
        </li>
        { expandedState.expense &&
           expenseByMonth.map( entry => {
             return (
             <li key={ entry._id }>
               { entry.value }
             </li>
             )
           })
        }
      </ul>   

      <ul className="monthly-group-detail border-t-l-rad-none border-t-r-rad-none">        
        <li className="flex nowrap flex-just-space-around f-full" onClick={ () => setExpandedState( { ...expandedState, income: !expandedState.income } )  }>
          <span className="f0 margin-right-half">
            { expandedState.income ? FaCaretUp() : FaCaretDown() }
          </span>
          <span className="f1 bold">
            Income
          </span>
        </li>
        { expandedState.income &&
           incomeByMonth.map( entry => {
             return (
             <li key={ entry._id }>
               { entry.value }
             </li>
             )
           })
        }
      </ul>   
    </section>
  )

};

export default MonthSummary;
