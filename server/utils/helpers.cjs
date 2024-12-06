const { format } = require('date-fns')

function extractPropAsStrToArr(input, field) {
    var output = [];
    for (var i=0; i < input.length ; ++i)
        output.push( String( input[i][field] ) );
    return output;
}

function dateToMonthStr(date) {
    console.log( date )
    return format(date, "M/yy");
  }

module.exports = { extractPropAsStrToArr, dateToMonthStr }