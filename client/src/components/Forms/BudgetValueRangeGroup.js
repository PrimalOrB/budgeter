import React, { useEffect, useState } from "react";
import { InlineNumberInput, InlineMonthlyDateInput } from './'
import { add, sub } from 'date-fns'

const BudgetValueRangeGroup = ( { index, parentProp, input, setInput, triggerDateAudit } ) => {

    const [ rangeState, setRangeState ] = useState( {
        order: input[parentProp][index].order,
        effectiveStartDate: input[parentProp][index].effectiveStartDate,
        effectiveEndDate: input[parentProp][index].effectiveEndDate,
        budgetedValue: input[parentProp][index].budgetedValue
    } )

    useEffect(()=>{
        // if date change, send for audit to ensure no overlap
        let newState = { ...input }
        let auditRequired = false
        if( 
            input[parentProp][index].effectiveStartDate !== rangeState.effectiveStartDate ||
            input[parentProp][index].effectiveEndDate !== rangeState.effectiveEndDate )
            {
            auditRequired = true
        }
        newState[parentProp][index] = { ...rangeState }
        if( auditRequired ){
            const audit = triggerDateAudit( newState ) 
            if( audit ){
                return
            }
        }
        return setInput( { ...newState } )
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[rangeState])


    return (
        <div className={ 'form-input-range-group' } >
            <InlineNumberInput prop={ `budgetedValue` } input={ input[parentProp][index] } setInput={ setRangeState } label={ 'Monthly Value' } min={ 0 }/>
            { !input[parentProp][index].effectiveEndDate && 
                <InlineMonthlyDateInput 
                    prop={ 'effectiveStartDate' } 
                    input={ input[parentProp][index] } 
                    setInput={ setRangeState } 
                    label={ 'Start Date' } 
                    minDate={ input[parentProp][index - 1] ? add( input[parentProp][index-1].effectiveEndDate, { months: 1 } ) : null } 
                    maxDate={ null} 
                    startDate={ true }/>
            }
            { input[parentProp][index].effectiveEndDate && 
                <>
                <InlineMonthlyDateInput 
                    prop={ 'effectiveStartDate' } 
                    input={ input[parentProp][index] } 
                    setInput={ setRangeState } 
                    label={ 'Start Date' } 
                    minDate={ input[parentProp][index - 1] ? add( input[parentProp][index - 1].effectiveEndDate, { months: 1 } ) : null } 
                    maxDate={ input[parentProp][index + 1] ? sub( input[parentProp][index + 1].effectiveStartDate, { months: 1 } ) : null } 
                    startDate={ true }/>
                <InlineMonthlyDateInput 
                    prop={ 'effectiveEndDate' } 
                    input={ input[parentProp][index] } 
                    setInput={ setRangeState } 
                    label={ 'End Date' } 
                    minDate={ input[parentProp][index - 1] ? add( input[parentProp][index - 1].effectiveEndDate, { months: 1 } ) : input[parentProp][index].effectiveStartDate } 
                    maxDate={ input[parentProp][index + 1] ? sub( input[parentProp][index + 1].effectiveStartDate, { months: 1} ) : null } 
                    startDate={ false }/>
                </>
            }
        </div>
    )
};

export default BudgetValueRangeGroup;
