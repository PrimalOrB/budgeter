const monthlyUserReportTemplate = require("../templates/template_monthlyUserReport.cjs");
const puppeteer = require("puppeteer");

async function build_PDF_MonthlyReport(data, user) {
  const rendered = monthlyUserReportTemplate(data, user);

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  const page = await browser.newPage();

  await page.setContent(rendered, { waitUntil: ["domcontentloaded"] });
  const pdf = await page.pdf({
    width: "8.5in",
    height: "11in",
    printBackground: true,
    margin: {
      bottom: "0.25in",
      top: "0.25in",
      left: "0.25in",
      right: "0.25in",
    },
  });

  await browser.close();

  return pdf;
}

module.exports = build_PDF_MonthlyReport;
