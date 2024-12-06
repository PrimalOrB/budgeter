const { format } = require("date-fns");

function extractPropAsStrToArr(input, field) {
  var output = [];
  for (var i = 0; i < input.length; ++i) output.push(String(input[i][field]));
  return output;
}

function dateToMonthStr(date) {
  return format(date, "M/yy");
}

function fixRounding(value, precision) {
  const roundingFactor = Math.pow(10, precision),
    isNegative = value < 0,
    rounded = Math.round(Math.abs(value) * roundingFactor) / roundingFactor;
  return rounded * (isNegative ? -1 : 1);
}

module.exports = { extractPropAsStrToArr, dateToMonthStr, fixRounding };
