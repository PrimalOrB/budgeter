import React from "react";
import { toCurrency } from '../../utils/helpers'
import { format } from 'date-fns'
import { FaEdit } from 'react-icons/fa'
import { MdSubdirectoryArrowRight, MdPerson, MdPeople } from 'react-icons/md'

const BudgetCategoryEntriesExpandableList = ( { entry, setPageState, setEditingTransaction } ) => {

    function setEdit( entry ){
        setEditingTransaction( entry._id )
        setPageState( 'edit-transaction' )
    }

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
    if( entry.valueType === "transfer" ){
        type = 4
    }

    return (
        <li key={ `recent_${ entry._id }` } className={ 'margin-left-full-half flex fullWidth f-valign' }>
            <span className="f0 margin-right-half">
                { MdSubdirectoryArrowRight() }
            </span>
            <span className="f1 italic">
                { format( entry.createdAt, 'M/dd/yy' ) }
            </span>
            <span className='f2 font-medium'>
                { entry.title }
            </span>
            <span className={ `bold right f1${ type === 0 ? ' negative' : ''}${ type === 1 ? ' positive' : ''}${ type === 2 ? ' credit' : ''}${ type === 3 ? ' reverse' : ''}${ type === 4 ? ' transfer-text' : ''}` }>
                { toCurrency( Math.abs( entry.value ) ) }
            </span>
            <span className='f0 initials-icon' style={{ backgroundColor: entry.userID.userColor ? `#${ entry.userID.userColor }` : '#BBBBBB' }}>
                { entry.userID.userInitials ? entry.userID.userInitials.toUpperCase() : entry.userID.email[0].toUpperCase() }
            </span>
            <span className='f0 individual-icon'>
                { entry.individualEntry ? MdPerson() : MdPeople() }
            </span>
            <span className='f0 individual-icon' onClick={ () => setEdit( entry ) }>
                { FaEdit() }
            </span>
        </li>
    )
};

export default BudgetCategoryEntriesExpandableList;
