  const css = `* {
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: Arial, Helvetica, sans-serif;
    }
    
    #print-body {
      height: calc(5.5in - 0.5in);
      width: calc(8.5in - 0.5in);
      border: 1px solid #000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
    }    
`;

module.exports = css