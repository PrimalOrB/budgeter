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
    const isUpperCase = isStringUppercase( str )
    if( isUpperCase ){
        return str
    }
    let sentence = str.toLowerCase().split(" ");
    for( let i = 0; i < sentence.length; i++ ){
        sentence[i] = sentence[i][0].toUpperCase() + sentence[i].slice(1);
    }
    return sentence.join(' ')
}

export function isStringUppercase( str ){
    const split = str.split('')
    let fails = 0
    split.map( letter => {
        if( letter !== letter.toUpperCase() ){
            return fails++
        }
        return null
    })
    if( fails > 0 ){
        return false
    }
    return true
}

export function sumNumericArray( arr ){
    return arr.reduce((a, b) => a + b, 0)
}

export function sumPropArray( arr, prop ){
    return arr.reduce((a, b) => a + (b[prop] || 0), 0)
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
            budgetedExpenseTotal: 0,
            transferTotal: 0
         }
    } )

    months = months.reverse()

    budget.categories.map( category => {
        // map through months
        months.map( month => {
            // map through ranges
            category.budgetedValueRange.map( range => {
                // if no end date, and month >= range start date, then add
                if( range.effectiveEndDate === null && month.date >= dateAddTZ( new Date( range.effectiveStartDate ) ) ){
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

    budget.entries.map( entry => {
        let matchedMonth = months.filter( month => month.label === format( entry.createdAt , 'M/yy' ) )
        if( matchedMonth.length === 1 ){
            if( entry.valueType === 'income' ){
                return matchedMonth[0].incomeTotal += entry.value
            }
            if( entry.valueType === 'expense' ){
                return matchedMonth[0].expenseTotal += entry.value
            }
            if( entry.valueType === 'transfer' ){
                return matchedMonth[0].transferTotal += entry.value
            }
        }
        return null
    })

    return months
}