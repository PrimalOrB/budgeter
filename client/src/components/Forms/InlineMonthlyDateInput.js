import React from "react";
import { startOfMonth, endOfMonth, format, add } from 'date-fns'

const InlineMonthlyDateInput = ( { prop, input, setInput, label, minDate, maxDate, startDate } ) => {

    const parseDate = ( e ) => {
        const { value } = e.target
        let newState = { ...input }
        if( startDate ){
            newState[prop] = startOfMonth( add( new Date( value ), { days: 1 } ) )
        }
        if( !startDate ){
            newState[prop] = endOfMonth( add( new Date( value ), { days: 1 } ) )
        }
        setInput( { ...newState } )
    }

    return (
        <div className={ 'form-inline-date-monthly' } >
            <label htmlFor={ prop }>{ label }</label>
            { ( !minDate && !maxDate ) &&
                <input name={ prop } type="month" onChange={ parseDate } value={ String( format( new Date( input[prop] ), 'yyyy-MM' ) ) }/>
            }
            { ( !minDate && maxDate ) &&
                <input name={ prop } type="month" onChange={ parseDate } max={ String( format( maxDate, 'yyyy-MM' ) )} value={ String( format( new Date( input[prop] ), 'yyyy-MM' ) ) }/>
            }
            { ( minDate && !maxDate ) &&
                <input name={ prop } type="month" onChange={ parseDate } min={ String( format( minDate, 'yyyy-MM' ) )} value={ String( format( new Date( input[prop] ), 'yyyy-MM' ) ) }/>
            }
            { ( minDate && maxDate ) &&
                <input name={ prop } type="month" onChange={ parseDate } min={ String( format( minDate, 'yyyy-MM' ) )} max={ String( format( maxDate, 'yyyy-MM' ) ) } value={ String( format( new Date( input[prop] ), 'yyyy-MM' ) ) }/>
            }
        </div>
    )
};

export default InlineMonthlyDateInput;
