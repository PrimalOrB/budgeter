// HTML -> PDF with one shared headless Chromium. Launching a browser per
// request costs seconds, so it is started on first use, reused, and closed
// after a quiet minute to give the memory back.
const puppeteer = require("puppeteer");
const { escapeHtml } = require("./helpers.cjs");

const IDLE_MS = 60 * 1000;
let browserPromise = null;
let idleTimer = null;
let activeJobs = 0;

function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer
      .launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] })
      .then((browser) => {
        // if Chromium dies, start a fresh one next time
        browser.on("disconnected", () => {
          browserPromise = null;
        });
        return browser;
      })
      .catch((err) => {
        browserPromise = null;
        throw err;
      });
  }
  return browserPromise;
}

function scheduleClose() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(async () => {
    if (activeJobs === 0 && browserPromise) {
      const browser = await browserPromise.catch(() => null);
      browserPromise = null;
      await browser?.close().catch(() => {});
    }
  }, IDLE_MS);
  idleTimer.unref?.();
}

const footerTemplate = (left) => `
  <div style="width:100%; padding:0 0.5in; font-family:Arial, sans-serif; font-size:7pt; color:#9a9aa5; display:flex; justify-content:space-between;">
    <span>${escapeHtml(left)}</span>
    <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
  </div>`;

async function renderPdf(html, { footer = "" } = {}) {
  activeJobs += 1;
  clearTimeout(idleTimer);
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    // web fonts are optional; don't wait forever if they can't load
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 8000 }).catch(() => {});
    await page.evaluate(() => document.fonts?.ready).catch(() => {});
    return await page.pdf({
      format: "Letter",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: footerTemplate(footer),
      margin: { top: "0.5in", bottom: "0.6in", left: "0.5in", right: "0.5in" },
    });
  } finally {
    await page.close().catch(() => {});
    activeJobs -= 1;
    scheduleClose();
  }
}

module.exports = { renderPdf };
