import React from "react";
import { toCurrency } from '../../utils/helpers'
import { format } from 'date-fns'
import { MdSubdirectoryArrowRight } from 'react-icons/md'

const BudgetCategoryEntriesExpandableList = ( { entry } ) => {

    console.log( entry )
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
            <span className={ `bold right f1${ type === 0 ? ' negative' : ''}${ type === 1 ? ' positive' : ''}${ type === 2 ? ' credit' : ''}${ type === 3 ? ' reverse' : ''}` }>
                { toCurrency( Math.abs( entry.value ) ) }
            </span>
            <span className='f0 initials-icon' style={{ backgroundColor: entry.userID.userColor ? `#${ entry.userID.userColor }` : '#BBBBBB' }}>
                { entry.userID.userInitials ? entry.userID.userInitials.toUpperCase() : entry.userID.email[0].toUpperCase() }
            </span>
        </li>
    )
};

export default BudgetCategoryEntriesExpandableList;
