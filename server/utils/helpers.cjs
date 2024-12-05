function extractPropAsStrToArr(input, field) {
    var output = [];
    for (var i=0; i < input.length ; ++i)
        output.push( String( input[i][field] ) );
    return output;
}

module.exports = { extractPropAsStrToArr }