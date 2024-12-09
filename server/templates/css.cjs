const css = `
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: "Trebuchet MS", "Lucida Sans Unicode", "Lucida Grande",
      "Lucida Sans", Arial, sans-serif;
    color: #2b2d42;
  }

  #print-body {
    height: calc(11in - 0.5in);
    width: calc(8.5in - 0.5in);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
  }

  thead tr,
  thead tr > * {
    font-size: larger;
    background-color: #2b2d42;
    color: #edf2f4;
  }

  .col-w {
    color: #edf2f4;
  }

  thead tr:first-of-type {
    text-align: left;
  }

  .alternate-e {
    background-color: #ffffff;
  }

  .alternate-o {
    background-color: #edf2f4;
  }

  .category,
  .category > * {
    background-color: #8d99ae;
    color: #2b2d42;
    font-weight: bold;
    font-size: 0.8rem;
  }

  .category > .w-1 {
    font-size: 0.75rem;
  }

  .entry {
    font-size: 0.75rem;
  }

  .flex {
    display: flex;
  }

  .flex > .date,
  .flex > .totals {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .entry:first-child {
    padding-left: 2rem;
  }

  .date {
    font-size: 0.6rem;
    font-style: italic;
  }

  .negative {
    color: red;
  }

  .c {
    text-align: center;
  }

  .fs-1 {
    font-size: 1rem;
  }

  .w-1 {
    width: 10%;
  }

  .w-2 {
    width: 20%;
  }

  .w-3 {
    width: 30%;
  }

  .w-4 {
    width: 40%;
  }

  .w-5 {
    width: 50%;
  }

  .w-6 {
    width: 60%;
  }

  .w-7 {
    width: 70%;
  }

  .w-8 {
    width: 80%;
  }

  .w-9 {
    width: 90%;
  }

  .w-10 {
    width: 100%;
  }

  .w-1-r {
    width: 1rem;
  }

  .w-2-r {
    width: 2rem;
  }

  .w-3-r {
    width: 3rem;
  }

  .w-4-r {
    width: 4rem;
  }

  .w-5-r {
    width: 5rem;
  }

  .w-6-r {
    width: 6rem;
  }

  .w-7-r {
    width: 7rem;
  }

  .w-8-r {
    width: 8rem;
  }

  .w-9-r {
    width: 9rem;
  }

  .w-10-r {
    width: 10rem;
  }

  .ml-05-r {
    padding-left: 0.5rem;
  }

  .ml-1-r {
    padding-left: 1rem;
  }

  .ml-2-r {
    padding-left: 2rem;
  }

  .ml-3-r {
    padding-left: 3rem;
  }

  .ml-4-r {
    padding-left: 4rem;
  }

  .ml-5-r {
    padding-left: 5rem;
  }

  .ml-6-r {
    padding-left: 6rem;
  }

  .ml-7-r {
    padding-left: 7rem;
  }

  .ml-8-r {
    padding-left: 8rem;
  }

  .ml-9-r {
    padding-left: 9rem;
  }

  .ml-10-r {
    padding-left: 10rem;
  }

  .mt-0 {
    margin-top: 0 !important;
  }
`;

module.exports = css;
