  const css = `* {
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: Arial, Helvetica, sans-serif;
    }
    
    #print-body {
      height: calc(11in - 0.5in);
      width: calc(8.5in - 0.5in);
      border: 1px solid #000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
    }   
    
    table {
      width: 100%;
      border-spacing: 0;
      border-collapse: collapse;
    }

    td {
      border-spacing: 0;
      border-collapse: collapse;
      border: 1px solid black;
    }

    .category,
    .category > *  {
      background-color: #4D4D4D;
      color: white;
      font-weight: bold;
    }

    .entry {
      font-size: 0.8rem;
    }

    .entry:first-child {
      margin-left: 2rem;
    }
`;

module.exports = css