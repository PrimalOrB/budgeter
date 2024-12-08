import React from "react";
import { toCurrency } from '../../utils/helpers'
import { format } from 'date-fns'
import { FaEdit } from 'react-icons/fa'
import { MdSubdirectoryArrowRight, MdPerson, MdPeople } from 'react-icons/md'

const BudgetCategoryEntriesExpandableList = ( { entry, setPageState, setEditingTransaction } ) => {

    function setEdit( { entry, type } ){
        console.log( entry )
        setEditingTransaction( entry._id )
        setPageState( `edit-${ type }` )
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
        <li key={ `recent_${ entry._id }` } className={ 'margin-left-full flex fullWidth f-valign' }>
            <span className='f0 individual-icon margin-right-full noselect' title={ entry.individualEntry ? 'Individual' : 'Shared' }>
                { entry.individualEntry ? MdPerson() : MdPeople() }
            </span>
            <span className="f0 margin-right-half noselect">
                { MdSubdirectoryArrowRight() }
            </span>
            <span className="f1 italic noselect">
                { format( entry.createdAt, 'M/dd/yy' ) }
            </span>
            <span className='f2 font-medium margin-left-half margin-right-half ellipsis noselect'>
                { entry.title }
            </span>
            <span className={ `bold right f1${ type === 0 ? ' negative' : ''}${ type === 1 ? ' positive' : ''}${ type === 2 ? ' credit' : ''}${ type === 3 ? ' reverse' : ''}${ type === 4 ? ' transfer-text' : ''} noselect` }>
                { toCurrency( Math.abs( entry.value ) ) }
            </span>
            <span className='f0 initials-icon noselect' style={{ backgroundColor: entry.userID.userColor ? `#${ entry.userID.userColor }` : '#BBBBBB' }} title={ entry.userID.email }>
                { entry.userID.userInitials ? entry.userID.userInitials.toUpperCase() : entry.userID.email[0].toUpperCase() }
            </span>
            
            { entry.valueType === 'transfer'
                ?
                <span className='f0 individual-icon noselect' title="Edit Transaction" onClick={ () => setEdit( { entry, type: 'transfer' } ) }>
                    { FaEdit() }
                </span>
                :
                <span className='f0 edit-icon noselect' title="Edit Transfer" onClick={ () => setEdit( { entry, type: 'transaction' } ) }>
                    { FaEdit() }
                </span>
            }
        </li>
    )
};

export default BudgetCategoryEntriesExpandableList;
