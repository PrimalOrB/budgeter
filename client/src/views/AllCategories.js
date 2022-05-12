import React from "react";
import { Title } from '../components/Layout'
import { format } from 'date-fns'
import { toCurrency } from '../utils/helpers'
import { FaEdit } from 'react-icons/fa'
import { useHistory } from "react-router-dom";

const AllCategories = ( { categories, setPageState } ) => { 

  const history = useHistory();

  const setEdit = ( { budget, category } ) => {
    setPageState( 'edit-category' )
    history.push( `/budget/${ budget }/edit-category/${ category }`)
  }
  
  return (
    <section>
      <Title text={ `Manage Categories` } />
      <h4 className="sub-container-description section-list-title">Expense Categories</h4>
      <ul className="section-list">
        { categories.filter( category => category.categoryType === 'expense' ).length === 0 
          ?
            <li className={ 'flex-transaction-line-sm border-bot-hightlight-1 f-valign flex-center' } onClick={ () => setPageState( 'add-category' ) }>Click To Add Expense Categories</li>
          : 
          categories.filter( category => category.categoryType === 'expense' ).map( category => {
            let currentRange = { effectiveStartDate: null, effectiveEndDate: null }

            const filteredRanged = category.budgetedValueRange.filter( date => date.effectiveStartDate <= new Date() && ( date.effectiveEndDate >= new Date() || date.effectiveEndDate === null ) )
            if( filteredRanged.length > 0 ){
              currentRange = filteredRanged.sort( ( a, b ) => b.effectiveStartDate - a.effectiveStartDate )[0]
            }

            return (
              <li key={ `exp_${ category.title }` } className={ `flex border-bot-hightlight-1` }>
                <span className='f1 font-medium bold indent-1 '>
                  { category.title }
                </span>
                <span className='f2 font-medium center'>
                  { currentRange.effectiveStartDate 
                    ?
                    toCurrency( currentRange.budgetedValue )
                    :
                    'No Current Value'
                  }
                </span>
                <span className='f2 font-medium center'>
                  { currentRange.effectiveStartDate 
                    ?
                    `${ format( currentRange.effectiveStartDate, 'M/yy' ) } to ${ currentRange.effectiveEndDate ? format( currentRange.effectiveEndDate, 'M/yy' ) : 'Current' }`
                    :
                    "No Current Range"
                  }
                  
                </span>
                <span className='f0 font-medium bold endent-1' onClick={ () => setEdit( { budget: category.budgetID, category: category._id } ) }>
                  { FaEdit() }
                </span>
              </li>
            )
          } )
        }
      </ul>
      <h4 className="sub-container-description section-list-title">Income Categories</h4>
      <ul className="section-list">
        { categories.filter( category => category.categoryType === 'income' ).length === 0 &&
          <li className={ 'flex-transaction-line-sm border-bot-hightlight-1 f-valign flex-center' } onClick={ () => setPageState( 'add-category' ) }>Click To Add Expense Categories</li>
        }
        { categories.filter( category => category.categoryType === 'income' ).map( category => {
          let currentRange = { effectiveStartDate: null, effectiveEndDate: null }

          const filteredRanged = category.budgetedValueRange.filter( date => date.effectiveStartDate <= new Date() && ( date.effectiveEndDate >= new Date() || date.effectiveEndDate === null ) )
          if( filteredRanged.length > 0 ){
            currentRange = filteredRanged.sort( ( a, b ) => b.effectiveStartDate - a.effectiveStartDate )[0]
          }

          return (
            <li key={ `exp_${ category.title }` } className={ `flex border-bot-hightlight-1` }>
              <span className='f1 font-medium bold indent-1 '>
                { category.title }
              </span>
              <span className='f2 font-medium center'>
                  { currentRange.effectiveStartDate 
                    ?
                    toCurrency( currentRange.budgetedValue )
                    :
                    'No Current Value'
                  }
                </span>
                <span className='f2 font-medium center'>
                  { currentRange.effectiveStartDate 
                    ?
                    `${ format( currentRange.effectiveStartDate, 'M/yy' ) } to ${ currentRange.effectiveEndDate ? format( currentRange.effectiveEndDate, 'M/yy' ) : 'Current' }`
                    :
                    "No Current Range"
                  }
                  
                </span>
              <span className='f0 font-medium bold endent-1'>
                { FaEdit() }
              </span>
            </li>
          )
        } )}
      </ul>
    </section>
  )

};

export default AllCategories;
