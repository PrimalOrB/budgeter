import React, { useState } from "react";
import { FaCaretDown, FaCaretUp } from 'react-icons/fa'
import { MdSubdirectoryArrowRight } from 'react-icons/md'
import { BudgetCategoryEntriesExpandableList } from './'

const BudgetCategoryExpandableList = ( { category, data } ) => {

    const [ expandedState, setExpandedState ] = useState( false )

    return (
        <>
        <li className="flex nowrap flex-just-space-around f-full" onClick={ () => setExpandedState( !expandedState) }>
            <span className="f0 margin-right-half">
                { MdSubdirectoryArrowRight() }
            </span>
            <span className="f0 margin-right-half">
                { expandedState ? FaCaretUp() : FaCaretDown() }
            </span>
            <span className="f1 bold noselect">
                { category }
            </span>          
        </li>
        { expandedState && 
            data.map( entry => {
                return (
                    <BudgetCategoryEntriesExpandableList key={ entry._id } entry={ entry } />
                )
            })
        }
        </>
    )
};

export default BudgetCategoryExpandableList;
