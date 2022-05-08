import { sub, format, startOfMonth } from 'date-fns'

export function commaSeparatedNumberDisplay( value ){
    return Math.floor( value ).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function toCurrency( input ){
    if( isNaN( input ) ){
        return '$'+0
    }
    let dollars = Math.floor( input )
    let cents = ( input - dollars ).toFixed(2).split('.')[1]
    return '$'+ commaSeparatedNumberDisplay( dollars )+'.'+cents
}


export function randomHexColor(){
    return `#${ Math.floor(Math.random()*16777215).toString(16) }`
}


export function isEmail(email) {
    return /[\w\d.-]+@[\w\d.-]+\.[\w\d.-]+/.test(email);
}

export function shortenedString( input, length ){
    if( input.length < length ){
        return input
    }
    return `${ input.substring(0,length) }...`
}

export function dateRemoveTZ( date ){
    const inputDate = new Date( date );
    const dateOnly = new Date( inputDate.valueOf() - inputDate.getTimezoneOffset() * 60 * 1000 );
    return dateOnly
}

export function dateAddTZ( date ){
    const inputDate = new Date( date );
    const dateOnly = new Date( inputDate.valueOf() + inputDate.getTimezoneOffset() * 60 * 1000 );
    return dateOnly
}

export function titleCaseString( str ){
    let sentence = str.toLowerCase().split(" ");
    for(let i = 0; i< sentence.length; i++){
        sentence[i] = sentence[i][0].toUpperCase() + sentence[i].slice(1);
    }
    return sentence
}

export function parseBudgetData( { budget, date, duration } ){
    let months = new Array( duration ).fill().map( ( x, i ) => {
        const createDate = sub( new Date( date ), { months: i } )
        return { 
            label: format( createDate , 'M/yy' ), 
            date: startOfMonth( createDate ),
            incomeTotal: 0,
            expenseTotal: 0,
            budgetedIncomeTotal: 0,
            budgetedExpenseTotal: 0
         }
    } )

    budget.categories.map( category => {
        // map through months
        months.map( month => {
            // map through ranges
            category.budgetedValueRange.map( range => {
                // if no end date, and month >= range start date, then add
                if( range.effectiveEndDate === null && month.date >= dateAddTZ( new Date( range.effectiveStartDate ) ) ){
                    console.log( category.categoryType )
                    if( category.categoryType === 'income' ){
                        return month.budgetedIncomeTotal += range.budgetedValue
                    }
                    if( category.categoryType === 'expense' ){
                        return month.budgetedExpenseTotal += range.budgetedValue
                    }
                }
                // if month >= range start date, and month < range end date then add
                if( month.date < dateAddTZ( new Date( range.effectiveEndDate ) ) && month.date >= dateAddTZ( new Date( range.effectiveStartDate ) ) ){
                    if( category.categoryType === 'income' ){
                        return month.budgetedIncomeTotal += range.budgetedValue
                    }
                    if( category.categoryType === 'expense' ){
                        return month.budgetedExpenseTotal += range.budgetedValue
                    }
                }
                return null
            })
            return null
        } )
        return null
    } )

    budget.entries.map( expense => {
        let matchedMonth = months.filter( month => month.label === format( expense.createdAt , 'M/yy' ) )
        console.log( matchedMonth )
        if( matchedMonth.length === 1 ){
            if( expense.valueType === 'income' ){
                return matchedMonth[0].incomeTotal += expense.value
            }
            if( expense.valueType === 'expense' ){
                return matchedMonth[0].expenseTotal += expense.value
            }
        }
        return null
    })

    console.log( months )

    return { months }
}