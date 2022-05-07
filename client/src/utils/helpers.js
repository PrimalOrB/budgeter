export function toCurrency( input ){
    return '$'+input.toFixed(2)
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