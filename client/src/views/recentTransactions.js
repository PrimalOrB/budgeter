import React from 'react'
import { format } from 'date-fns'
import { toCurrency } from '../utils/helpers'
import { MdPerson, MdPeople } from 'react-icons/md'

const RecentTransactions = ( { categories, transactions } ) => {
  
  return (
    <section id="recent-transactions" >
      <h4 className="sub-container-description section-list-title">Recent Transactions</h4>
      <ul className="section-list">
        { transactions.length === 0 &&
          <li className={ 'flex-transaction-line-sm border-bot-hightlight-1 f-valign' }>No Recent Transactions</li>
        }
        { transactions.map( entry => {
          let type
          if( entry.valueType === "income" && entry.value > 0){
            type = 1
          }
          if( entry.valueType === "income" && entry.value < 0){
            type = 3
          }
          if( entry.valueType === "expense" && entry.value > 0){
            type = 0
          }
          if( entry.valueType === "expense" && entry.value < 0){
            type = 2
          }
          if( entry.valueType === "transfer"){
            type = 4
          }

          return ( 
            <li key={ `recent_${ entry._id }` } className={ 'flex-transaction-line-sm border-bot-hightlight-1 f-valign' }>
              <div className="flex f1 wrap padding-top-sm">
                { entry.valueType === 'transfer' ?
                  <span className="margin-right-half colon bold f0 font-medium">
                    Transfer
                  </span>
                :
                  <span className="margin-right-half colon bold f0 font-medium">
                    { categories.filter( category => category._id === entry.categoryID )[0].title }
                  </span>
                }
                <span className='f1 font-medium margin-left-half margin-right-half ellipsis'>
                  { entry.title }
                </span>
                <span className="indent-1 italic font-small f-full padding-bottom-sm">
                  { format( entry.createdAt, 'M/dd/yy' ) }
                </span>
              </div>
              <span className={ `bold f0${ type === 0 ? ' negative' : ''}${ type === 1 ? ' positive' : ''}${ type === 2 ? ' credit' : ''}${ type === 3 ? ' reverse' : ''}${ type === 4 ? ' transfer-text' : ''}` }>
                { toCurrency( Math.abs( entry.value ) ) }
              </span>
              <span className='f0 initials-icon' style={{ backgroundColor: entry.userID.userColor ? `#${ entry.userID.userColor }` : '#BBBBBB' }}  title={ entry.userID.email }>
                  { entry.userID.userInitials ? entry.userID.userInitials.toUpperCase() : entry.userID.email[0].toUpperCase() }
              </span>
              <span className='f0 individual-icon margin-left-half' title={ entry.individualEntry ? 'Individual' : 'Shared' }>
                { entry.individualEntry ? MdPerson() : MdPeople() }
            </span>
            </li> )
        })}
      </ul>
    
    </section>
  )

};

export default RecentTransactions;
