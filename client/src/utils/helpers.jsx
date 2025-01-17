import { sub, format, startOfMonth } from "date-fns";

export function commaSeparatedNumberDisplay(value) {
  return Math.floor(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function toCurrency(input) {
  if (isNaN(input)) {
    return "$" + 0;
  }
  const isNegative = input < 0,
    dollars = Math.floor(Math.abs(input)),
    cents = (input - dollars).toFixed(2).split(".")[1];
  return (
    "$" +
    (isNegative ? "-" : "") +
    commaSeparatedNumberDisplay(dollars) +
    "." +
    cents
  );}

export function fixRounding(value, precision) {
  const roundingFactor = Math.pow(10, precision),
    isNegative = value < 0,
    rounded = Math.round(Math.abs(value) * roundingFactor) / roundingFactor;
  return rounded > 0 ? rounded * (isNegative ? -1 : 1) : 0;
}

export function randomHexColor() {
  return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
}

export function isEmail(email) {
  return /[\w\d.-]+@[\w\d.-]+\.[\w\d.-]+/.test(email);
}

export function shortenedString(input, length) {
  if (input.length < length) {
    return input;
  }
  return `${input.substring(0, length)}...`;
}

export function dateRemoveTZ(date) {
  const inputDate = new Date(date);
  const dateOnly = new Date(
    inputDate.valueOf() - inputDate.getTimezoneOffset() * 60 * 1000
  );
  return dateOnly;
}

export function dateAddTZ(date) {
  const inputDate = new Date(date);
  const dateOnly = new Date(
    inputDate.valueOf() + inputDate.getTimezoneOffset() * 60 * 1000
  );
  return dateOnly;
}

export function titleCaseString(str) {
  const isUpperCase = isStringUppercase(str);
  if (isUpperCase) {
    return str;
  }
  let sentence = str.toLowerCase().split(" ");
  for (let i = 0; i < sentence.length; i++) {
    sentence[i] = sentence[i][0].toUpperCase() + sentence[i].slice(1);
  }
  return sentence.join(" ");
}

export function isStringUppercase(str) {
  const split = str.split("");
  let fails = 0;
  split.map((letter) => {
    if (letter !== letter.toUpperCase()) {
      return fails++;
    }
    return null;
  });
  if (fails > 0) {
    return false;
  }
  return true;
}

export function sumNumericArray(arr) {
  return arr.reduce((a, b) => a + b, 0);
}

export function sumPropArray(arr, prop) {
  return arr.reduce((a, b) => a + (b[prop] || 0), 0);
}

export function dateToMonthStr(date) {
  return format(date, "M/yy");
}

export function parseBudgetData({ budget, date, duration }) {
  let months = new Array(duration).fill().map((x, i) => {
    const createDate = sub(new Date(date), { months: i });
    return {
      label: format(createDate, "M/yy"),
      date: startOfMonth(createDate),
      incomeTotal: 0,
      expenseTotal: 0,
      budgetedIncomeTotal: 0,
      budgetedExpenseTotal: 0,
      transferTotal: 0,
    };
  });

  months = months.reverse();

  budget.entries.map((entry) => {
    console.log(entry.createdAt);
    let matchedMonth = months.filter(
      (month) => month.label === format(entry.createdAt, "M/yy")
    );
    if (matchedMonth.length === 1) {
      if (entry.valueType === "income") {
        return (matchedMonth[0].incomeTotal += entry.value);
      }
      if (entry.valueType === "expense") {
        return (matchedMonth[0].expenseTotal += entry.value);
      }
      if (entry.valueType === "transfer") {
        return (matchedMonth[0].transferTotal += entry.value);
      }
    }
    return null;
  });

  return months;
}
