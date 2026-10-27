// pdfmake document definition -> PDF buffer. Pure JavaScript: no browser,
// no system packages, nothing to install on the host.
const pdfmake = require("pdfmake");

// the built-in PDF fonts, so no font files ship with the server
const STANDARD_FONTS = {
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
};
const STANDARD_FONT_NAMES = new Set(Object.values(STANDARD_FONTS.Helvetica));

pdfmake.setFonts(STANDARD_FONTS);
// documents are built from budget data, so never let them fetch URLs or
// read files; the only "files" allowed are the built-in font names
pdfmake.setUrlAccessPolicy(() => false);
pdfmake.setLocalAccessPolicy((path) => STANDARD_FONT_NAMES.has(path));

async function renderPdf(docDefinition) {
  return pdfmake.createPdf(docDefinition).getBuffer();
}

module.exports = { renderPdf };
