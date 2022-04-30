import React, { useEffect, useState } from "react";
import { InlineNumberInput, InlineMonthlyDateInput } from './'

const BudgetValueRangeGroup = ( { index, parentProp, input, setInput } ) => {

    const [ rangeState, setRangeState ] = useState( 
        { 
            order: index, 
            effectiveStartDate: input[parentProp][index].effectiveStartDate, 
            effectiveEndDate: input[parentProp][index].effectiveEndDate, 
            budgetedValue: input[parentProp][index].budgetedValue 
        } 
    )

    useEffect(()=>{
        const newArr = [ ...input[parentProp] ]
        newArr[index] = { ...rangeState }
        setInput( { ...input, [parentProp]:[ ...newArr ] } )
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[ rangeState ])

    return (
        <div className={ 'form-input-range-group' } >
            <InlineNumberInput prop={ 'budgetedValue' } input={ rangeState } setInput={ setRangeState } label={ 'Monthly Value' } min={ 0 }/>
            <InlineMonthlyDateInput prop={ 'effectiveStartDate' } input={ rangeState } setInput={ setRangeState } label={ 'Start Month' } startDate={ true }/>
            { input[parentProp][index].effectiveEndDate && 
                <InlineMonthlyDateInput prop={ 'effectiveEndDate' } input={ rangeState } setInput={ setRangeState } label={ 'End Month' } startDate={ false }/>
            }
        </div>
    )
};

export default BudgetValueRangeGroup;
