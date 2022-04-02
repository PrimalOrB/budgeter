export function interpolateVal (input, toInterpolate) {
    let keyInput1 = toInterpolate[toInterpolate.filter(key1 => key1.keyInput <= input).length - 1].keyInput;
    let keyInput2 = toInterpolate.filter(value => value.keyInput > input)[0].keyInput;
    let keyOutput1 = toInterpolate[toInterpolate.filter(key1 => key1.keyInput <= input).length - 1].keyOutput;
    let keyOutput2 = toInterpolate.filter(value => value.keyInput > input)[0].keyOutput;

    let inputPosition = (input - keyInput1) / (keyInput2 - keyInput1); // % position between keyInputs
    let output = ( (keyOutput2 - keyOutput1) * inputPosition) + keyOutput1;

    return output;   
};


export function toHHMMSS( input ){
    let sec_num = parseInt(input, 10); // don't forget the second param
    let hours   = Math.floor(sec_num / 3600);
    let minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    let seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return hours+':'+minutes+':'+seconds;
}

export function convertToImperial(measure, input) {
    if(measure === 'Imperial') {
        return input;
   } else {
       return input / 25.4;
   }
}

export function convertToMetric(measure, input) {
    if(measure === 'Metric') {
        return input;
   } else {
       return input * 25.4;
   }
}

export function toCurrency( input ){
    return '$'+input.toFixed(2)
}

export function toWeight( input ){
    return input.toFixed(3)+' lb'
}

export function minTommss(minutes){
    var sign = minutes < 0 ? "-" : "";
    var min = Math.floor(Math.abs(minutes));
    var sec = Math.floor((Math.abs(minutes) * 60) % 60);
    return `${sign + (min < 10 ? "" : "") + min + ":" + (sec < 10 ? "0" : "") + sec} m`;
}

export function dualUnitDisplay(input, iDec, mDec){
    return `${ input.toFixed(iDec) }'' ( ${ convertToMetric( 'Metric', input ).toFixed( mDec ) } mm )`
}

export default function fractionFix( input ){
    input = input.split('/')
    if( input.length > 1 ){
        input = input[0] / input[1]
    }
    return Number( input )
}

export function decToComma( input ){
    return String( input ).replace('.',',')
}

export function calcHelix( mtlDia, mtlLead, toolDia ){
    mtlDia = Math.floor( mtlDia )
    toolDia = toolDia || 0
    const blankHelix = Math.atan( ( ( Math.PI * mtlDia ) ) / mtlLead ) * ( 180 / Math.PI )
    const toolHelix = Math.atan( ( ( Math.PI * toolDia ) ) / ( ( Math.PI * mtlDia ) / Math.tan( blankHelix * ( Math.PI / 180 ) ) ) ) * ( 180 / Math.PI )
    return { blankHelix, toolHelix }
}

export function decodeCoolant( input ){
    let output = {}
    input = String( input ).replaceAll(',','.')
    output.rodCoolantHoles = Number( input.split(' ')[0].split('').slice(-1)[0] )
    output.rodCoolantIndex = []
    output.rodDiameter = Math.floor( Number( input.split(' ')[1].split('/')[0] ) / 100 )
    output.rodBoltCircle = Number( input.split(' ')[1].split('/')[1] )
    output.rodHoleDia = Number( input.split(' ')[1].split('/')[2] )
    output.rodLead = Number( input.split(' ')[1].split('/')[3].split('-')[0] )
    output.rodLength = Number( input.split(' ')[1].split('/')[3].split('-')[1] )
    return output
}

export function angularDisplay( input, precision ){
    if( isNaN( input ) ){
        return ''
    }
    return `${ input.toFixed( precision )}°`
}

export function randomHexColor(){
    return `#${ Math.floor(Math.random()*16777215).toString(16) }`
}

export function validateCoolantPN( input ){
    const reg =/([0-9]+(G|R)[0-9]) (\d{4,})\/((\d+),(\d+))\/((\d+),(\d+))\/((\d+),(\d+))-(\d{3})/
    const validatePN = input.match( reg )
    const output = validatePN !== null ? true : false
    return output
}

export function encodeCoolantLink( input ){
    const output = input.replaceAll('/','_')
    return output
}

export function decodeCoolantLink( input ){
    const output = input.replaceAll('_','/')
    return output
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