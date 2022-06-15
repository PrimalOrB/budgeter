import React from "react";
import { startOfMonth, endOfMonth, format, add } from 'date-fns'
import { dateAddTZ, dateRemoveTZ } from '../../utils/helpers'

const InlineMonthlyDateInput = ( { prop, input, setInput, label, minDate, maxDate, startDate } ) => {

    const parseDate = ( e ) => {
        const { value } = e.target
        let newState = { ...input }
        if( startDate ){
            newState[prop] = dateRemoveTZ( startOfMonth( add( new Date( value ), { days: 1 } ) ) )
        }
        if( !startDate ){
            newState[prop] = dateRemoveTZ( endOfMonth( add( new Date( value ), { days: 1 } ) ) )
        }
        setInput( { ...newState } )
    }

    return (
        <div className={ 'form-inline-date-monthly' } >
            <label className={ 'noselect' } htmlFor={ prop }>{ label }</label>
            { ( !minDate && !maxDate ) &&
                <input name={ prop } type="month" onChange={ parseDate } value={ String( format( dateAddTZ( new Date( input[prop] ) ), 'yyyy-MM' ) ) } required="required"/>
            }
            { ( !minDate && maxDate ) &&
                <input name={ prop } type="month" onChange={ parseDate } max={ String( format( dateAddTZ( maxDate ), 'yyyy-MM' ) )} value={ String( format( dateAddTZ( new Date( input[prop] ) ), 'yyyy-MM' ) ) } required="required"/>
            }
            { ( minDate && !maxDate ) &&
                <input name={ prop } type="month" onChange={ parseDate } min={ String( format( dateAddTZ( minDate ), 'yyyy-MM' ) )} value={ String( format( dateAddTZ( new Date( input[prop] ) ), 'yyyy-MM' ) ) } required="required"/>
            }
            { ( minDate && maxDate ) &&
                <input name={ prop } type="month" onChange={ parseDate } min={ String( format( dateAddTZ( minDate ), 'yyyy-MM' ) )} max={ String( format( dateAddTZ( maxDate ), 'yyyy-MM' ) ) } value={ String( format( dateAddTZ( new Date( input[prop] ) ), 'yyyy-MM' ) ) } required="required"/>
            }
        </div>
    )
};

export default InlineMonthlyDateInput;
