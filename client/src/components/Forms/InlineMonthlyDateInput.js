import React, { useEffect, useReducer } from "react";
import { getMonth, getYear, startOfMonth, endOfMonth } from 'date-fns'

function reducer( state, action ){
    switch ( action.type ) {
        case 'month':
            return { ...state, month: action.value ? Number( action.value ) : 0 };
        case 'year':
            return { ...state, year: action.value ? Number( action.value ) : 0 };
        default:
            throw new Error();
        }
}

const InlineMonthlyDateInput = ( { prop, input, setInput, label, startDate } ) => {
      
    const [ state, dispatch ] = useReducer ( reducer, { month: input[prop] ? getMonth( input[prop] ) + 1 : 0, year: input[prop] ? getYear( input[prop] ) : 0 } )

    useEffect(()=>{
        if( state.month && state.year ){
            const newDate = new Date( state.year, state.month - 1, 1 )
            let outputDate
            if( startDate ){
                outputDate = startOfMonth( newDate )
            } else {
                outputDate = endOfMonth( newDate )
            }
            setInput( { ...input, [prop]: outputDate, error: null } )
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[ state ])

    console.log( state )

    return (
        <div className={ 'form-inline-date-monthly' } >
            <label htmlFor={ prop }>{ label }</label>
            <input name={ prop } type="number" onChange={ ( e ) => dispatch( { type: 'month', value: e.target.value } ) } min="1" max="12" autoComplete="off" value={ state.month }/>
            <input name={ prop } type="number" onChange={ ( e ) => dispatch( { type: 'year', value: e.target.value } ) } autoComplete="off" value={ state.year }/>
        </div>
    )
};

export default InlineMonthlyDateInput;
