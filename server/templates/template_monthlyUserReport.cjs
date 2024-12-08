const css = require('./css.cjs')

function monthlyUserReportTemplate(data) {

  console.log( data )

  // let list = ``

  // data.map(line => {
  //   list = list +
  //   `<tr class="${line.isCertified ? '' : 'no-cal'}">
  //       <td class="left ${line.isCertified ? 'line-cal' : 'line-no-cal'}">${line.internalDesignation}</td>
  //       <td>${isNaN(Number(line.lastCertification)) ? '-' : new Date(line.lastCertification).toLocaleDateString()}</td>
  //       <td>${isNaN(Number(line.nextCertification)) ? '-' : new Date(line.nextCertification).toLocaleDateString()}</td>
  //       <td>${line.department.departmentName}</td>
  //     </tr>`
  // })

  // html tempalte to have data added
  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <style>${css}</style>
    </head>
    <body id="print-body">
    </body>
</html>
`;
}

module.exports = monthlyUserReportTemplate;
