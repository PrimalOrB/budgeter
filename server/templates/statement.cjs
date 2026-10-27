// pdfmake document for a person's budget statement (see reports/statement.cjs),
// rendered by utils/pdf.cjs. Leads with the bottom line, then shows how it
// was reached, then the supporting detail.
//
// Uses the built-in PDF fonts (Helvetica), which only cover the Western
// character set: use "-" rather than a minus sign, and draw arrows.
const { format } = require("date-fns");
const { toCurrency } = require("../utils/helpers.cjs");

const PAGE_WIDTH = 612; // US Letter, points
const MARGIN = 36; // 0.5in
const WIDTH = PAGE_WIDTH - MARGIN * 2;
const GAP = 16;
const HALF = (WIDTH - GAP) / 2;

const C = {
  text: "#18181b",
  muted: "#6b6b76",
  subtle: "#9a9aa5",
  border: "#e4e4e8",
  surface: "#f6f6f8",
  accent: "#4f46e5",
  barTotal: "#d9dbe6",
  barSolid: "#8b8fd9",
  positive: "#047857",
  positiveSoft: "#ecfdf5",
  positiveBorder: "#a7f3d0",
  negative: "#be123c",
  negativeSoft: "#fff1f3",
  negativeBorder: "#fecdd6",
  transfer: "#d97706",
};

// ---- formatting --------------------------------------------------------------
const money = (value) => toCurrency(Math.abs(value || 0));
const isZero = (value) => Math.abs(value || 0) < 0.005;
const signedMoney = (value) => `${value < 0 && !isZero(value) ? "-" : ""}${money(value)}`;
const plusMinus = (value) =>
  `${isZero(value) ? "" : value < 0 ? "-" : "+"}${money(value)}`;
// fixed sign for a calculation line, dropped when the amount is zero
const lessMoney = (value) => (isZero(value) ? money(0) : `-${money(value)}`);
const plusMoney = (value) => (isZero(value) ? money(0) : `+${money(value)}`);
const pct = (rate, digits = 1) => `${(rate * 100).toFixed(digits).replace(/\.0$/, "")}%`;

const labelToDate = (label) => {
  const [month, year] = label.split("/").map(Number);
  return new Date(2000 + year, month - 1, 1);
};
const monthName = (label, pattern = "MMM yyyy") => format(labelToDate(label), pattern);
const entryDate = (entry) => format(new Date(entry.effectiveDate ?? entry.createdAt), "MMM d");
const nameOf = (user) => user?.userInitials || user?.email || "someone";

function periodLabel(months) {
  const first = months[0].label;
  const last = months[months.length - 1].label;
  if (first === last) {
    return monthName(first, "MMMM yyyy");
  }
  const sameYear = labelToDate(first).getFullYear() === labelToDate(last).getFullYear();
  return `${monthName(first, sameYear ? "MMMM" : "MMMM yyyy")} - ${monthName(last, "MMMM yyyy")}`;
}

function splitLabel(month) {
  return month.splitMethod === "percentage"
    ? `Fixed ${pct(month.rate)}`
    : `By income ${pct(month.rate)}`;
}

// "EL owes you" / "You owe EL" / "All square"
function settleUp(statement) {
  const { settlement } = statement.totals;
  const single = statement.others.length === 1;
  const counterpart = single ? nameOf(statement.others[0]) : "the others";
  if (isZero(settlement)) {
    return { tone: "neutral", label: "All square", detail: "Nothing to settle for this period" };
  }
  return settlement > 0
    ? { tone: "negative", label: `You owe ${counterpart}`, detail: "Your share of shared costs is more than you covered" }
    : { tone: "positive", label: single ? `${counterpart} owes you` : "The others owe you", detail: "You covered more than your share of shared costs" };
}

const toneColor = (tone) =>
  tone === "positive" ? C.positive : tone === "negative" ? C.negative : C.text;

// ---- building blocks -----------------------------------------------------------
function avatar(user) {
  const color = user?.userColor ? `#${user.userColor}` : C.subtle;
  const text = (user?.userInitials || user?.email?.[0] || "?").toUpperCase();
  return {
    width: 13,
    stack: [
      { canvas: [{ type: "ellipse", x: 6.5, y: 6.5, r1: 6.5, r2: 6.5, color }] },
      { text, bold: true, fontSize: 5, color: "#ffffff", alignment: "center", relativePosition: { x: 0, y: -9.6 } },
    ],
  };
}

const arrow = () => ({
  width: 12,
  canvas: [
    { type: "line", x1: 2, y1: 6.5, x2: 10, y2: 6.5, lineWidth: 1.1, lineColor: C.transfer },
    { type: "polyline", points: [{ x: 7.2, y: 4.2 }, { x: 10, y: 6.5 }, { x: 7.2, y: 8.8 }], lineWidth: 1.1, lineColor: C.transfer },
  ],
});

const direction = (entry) => ({
  columns: [avatar(entry.userID), arrow(), avatar(entry.toUserID)],
  columnGap: 1,
});

// title + a small grey count, e.g. "Eating Out  48"
const withCount = (title, count) => ({
  text: [title, { text: `  ${count}`, fontSize: 6.5, color: C.subtle }],
});

// horizontal bar scaled to the largest row; `inner` shades part of it
function bar(value, max, inner, width = 120) {
  if (!(max > 0) || !(value > 0)) {
    return { text: "" };
  }
  const w = Math.max(2, (value / max) * width);
  const innerW = inner === undefined ? w : Math.min(w, Math.max(0, (inner / value) * w));
  const shapes = [{ type: "rect", x: 0, y: 2, w, h: 5, r: 1.5, color: inner === undefined ? C.barSolid : C.barTotal }];
  if (inner !== undefined && innerW > 0) {
    shapes.push({ type: "rect", x: 0, y: 2, w: innerW, h: 5, r: 1.5, color: C.accent });
  }
  return { canvas: shapes };
}

const th = (text, alignment = "left") => ({ text: text.toUpperCase(), style: "th", alignment });
const num = (text, extra = {}) => ({ text, alignment: "right", noWrap: true, ...extra });

// light rules between rows; an optional bold total row at the bottom
function dataLayout({ footer = false, compact = false } = {}) {
  return {
    hLineWidth: (i, node) => {
      const rows = node.table.body.length;
      if (i === 0) return 0;
      if (footer && i === rows - 1) return 1.2;
      if (footer && i === rows) return 0;
      return 0.5;
    },
    hLineColor: (i, node) => (footer && i === node.table.body.length - 1 ? C.text : C.border),
    vLineWidth: () => 0,
    paddingLeft: (i) => (i === 0 ? 0 : 4),
    paddingRight: (i, node) => (i === node.table.widths.length - 1 ? 0 : 4),
    paddingTop: () => (compact ? 2.5 : 3.5),
    paddingBottom: () => (compact ? 2.5 : 3.5),
  };
}

const calcLayout = {
  hLineWidth: (i, node) => (i === 0 || i === node.table.body.length ? 0 : i === node.table.body.length - 1 ? 1.2 : 0.5),
  hLineColor: (i, node) => (i === node.table.body.length - 1 ? C.text : C.border),
  vLineWidth: () => 0,
  paddingLeft: () => 0,
  paddingRight: () => 0,
  paddingTop: (i, node) => (i === node.table.body.length - 1 ? 5 : 3.5),
  paddingBottom: () => 3.5,
};

function section(title, subtitle, body, width = WIDTH, top = 18) {
  return {
    margin: [0, top, 0, 0],
    stack: [
      {
        columns: [
          { text: title, style: "h2", width: "auto" },
          { text: subtitle || "", style: "sectionSub", alignment: "right" },
        ],
        // keep a heading with the content that follows it
        headlineLevel: 1,
      },
      { canvas: [{ type: "line", x1: 0, y1: 3, x2: width, y2: 3, lineWidth: 1, lineColor: C.text }], margin: [0, 0, 0, 3] },
      body,
    ],
  };
}

const empty = (text) => ({ text, color: C.subtle, margin: [0, 6, 0, 0] });
const note = (text, extra = {}) => ({ text, style: "note", ...extra });

function kpiBox({ width, height, fill, border, label, value, valueColor, title, titleColor, detail, big }) {
  return {
    width,
    stack: [
      // the box is what takes up space; the text is laid over it
      { canvas: [{ type: "rect", x: 0, y: 0, w: width, h: height, r: 6, color: fill, lineColor: border, lineWidth: 0.75 }] },
      {
        relativePosition: { x: 10, y: -height + 10 },
        margin: [0, 0, 20, 0],
        stack: [
          { text: label.toUpperCase(), style: "kpiLabel" },
          { text: value, fontSize: big ? 20 : 16, bold: true, color: valueColor || C.text, margin: [0, 4, 0, 0] },
          title ? { text: title, fontSize: 9.5, bold: true, color: titleColor || C.text, margin: [0, 1, 0, 0] } : { text: "" },
          { text: detail, fontSize: 7, color: C.muted, margin: [0, 3, 0, 0] },
        ],
      },
    ],
  };
}

// ---- document ------------------------------------------------------------------
function statementDocument(statement, { footer = "" } = {}) {
  const { totals, months, user } = statement;
  const settle = settleUp(statement);
  const multiMonth = months.length > 1;
  const splitMethods = [...new Set(months.map((m) => m.splitMethod))];
  const netColor = totals.net < 0 ? C.negative : C.text;

  // header + bottom line
  const masthead = [
    { text: `BUDGET STATEMENT  ·  ${statement.budget.title.toUpperCase()}`, style: "eyebrow" },
    { text: periodLabel(months), style: "h1" },
    {
      columns: [
        {
          width: "*",
          columns: [
            avatar(user),
            { width: "auto", text: user.email, color: C.muted, margin: [5, 2, 0, 0] },
            multiMonth ? { width: "auto", text: `·   ${months.length} months`, color: C.muted, margin: [6, 2, 0, 0] } : { text: "" },
          ],
        },
        { width: "auto", text: `Generated ${format(new Date(), "MMM d, yyyy")}`, fontSize: 7.5, color: C.subtle, margin: [0, 3, 0, 0] },
      ],
      margin: [0, 6, 0, 0],
    },
    { canvas: [{ type: "line", x1: 0, y1: 8, x2: WIDTH, y2: 8, lineWidth: 1.5, lineColor: C.text }] },
  ];

  const kpiHeight = 84;
  const heroWidth = 205;
  const otherWidth = (WIDTH - heroWidth - 16) / 2;
  const heroColors = {
    positive: [C.positiveSoft, C.positiveBorder],
    negative: [C.negativeSoft, C.negativeBorder],
    neutral: [C.surface, C.border],
  }[settle.tone];

  const kpis = {
    margin: [0, 14, 0, 0],
    columnGap: 8,
    columns: [
      kpiBox({
        width: heroWidth, height: kpiHeight, fill: heroColors[0], border: heroColors[1], big: true,
        label: "Settle up", value: money(totals.settlement), valueColor: toneColor(settle.tone),
        title: settle.label, titleColor: toneColor(settle.tone), detail: settle.detail,
      }),
      kpiBox({
        width: otherWidth, height: kpiHeight, fill: "#ffffff", border: C.border,
        label: "Your net result", value: signedMoney(totals.net), valueColor: netColor,
        detail: "Income less your share of shared costs and your own spending",
      }),
      kpiBox({
        width: otherWidth, height: kpiHeight, fill: "#ffffff", border: C.border,
        label: "Your share of shared costs", value: money(totals.yourShare),
        detail: `${pct(totals.effectiveRate)} of ${money(totals.householdSharedExpenses)} shared · ${
          splitMethods.length === 1
            ? splitMethods[0] === "percentage" ? "fixed split" : "split by income"
            : "mixed split methods"
        }`,
      }),
    ],
  };

  // how it adds up
  const calcTable = (rows) => ({
    table: { widths: ["*", "auto"], body: rows },
    layout: calcLayout,
  });

  const settleRows = [
    ["Your share of shared expenses", num(money(totals.yourShare))],
    ["Shared expenses you paid", num(lessMoney(totals.sharedPaid))],
    ["Transfers you received", num(plusMoney(totals.transfersIn))],
    ["Transfers you sent", num(lessMoney(totals.transfersOut))],
    [
      { text: settle.label, bold: true, fontSize: 9.5, color: toneColor(settle.tone) },
      num(money(totals.settlement), { bold: true, fontSize: 9.5, color: toneColor(settle.tone) }),
    ],
  ];

  const resultRows = [
    ["Shared income you brought in", num(money(totals.sharedIncome))],
    ["Your individual income", num(money(totals.individualIncome))],
    ["Your share of shared expenses", num(lessMoney(totals.yourShare))],
    ["Your individual expenses", num(lessMoney(totals.individualExpenses))],
    [
      { text: "Net result", bold: true, fontSize: 9.5, color: netColor },
      num(signedMoney(totals.net), { bold: true, fontSize: 9.5, color: netColor }),
    ],
  ];

  const howItAddsUp = {
    columnGap: GAP,
    columns: [
      {
        width: HALF,
        stack: [
          section("How the settle-up adds up", "", calcTable(settleRows), HALF),
          note("Transfers between you count toward settling up: money you received adds to what you owe, money you sent reduces it."),
        ],
      },
      {
        width: HALF,
        stack: [
          section("Your result", "", calcTable(resultRows), HALF),
          note("What is left for you once everyone has settled up, counting only your share of shared costs."),
        ],
      },
    ],
  };

  // month by month
  const settleCell = (value, bold = false) =>
    num(
      `${value > 0 && !isZero(value) ? "You owe " : value < 0 && !isZero(value) ? "Owed to you " : ""}${money(value)}`,
      { color: value > 0 && !isZero(value) ? C.negative : value < 0 && !isZero(value) ? C.positive : C.text, bold }
    );

  const monthTable = multiMonth
    ? [
        section(
          "Month by month",
          "Each month is settled with the split that applied to it",
          {
            table: {
              headerRows: 1,
              dontBreakRows: true,
              widths: [52, "*", "auto", "auto", "auto", "auto", "auto", "auto"],
              body: [
                [th("Month"), th("Split"), th("Shared costs", "right"), th("Your share", "right"), th("You paid", "right"), th("Transfers", "right"), th("Settle up", "right"), th("Net", "right")],
                ...months.map((m) => [
                  monthName(m.label),
                  { text: splitLabel(m), color: C.muted },
                  num(money(m.householdSharedExpenses)),
                  num(money(m.yourShare)),
                  num(money(m.sharedPaid)),
                  num(plusMinus(m.transfersIn - m.transfersOut), { color: C.muted }),
                  settleCell(m.settlement),
                  num(signedMoney(m.net), { color: m.net < 0 ? C.negative : C.text }),
                ]),
                [
                  { text: "Total", bold: true, colSpan: 2 }, {},
                  num(money(totals.householdSharedExpenses), { bold: true }),
                  num(money(totals.yourShare), { bold: true }),
                  num(money(totals.sharedPaid), { bold: true }),
                  num(plusMinus(totals.transfersIn - totals.transfersOut), { bold: true }),
                  settleCell(totals.settlement, true),
                  num(signedMoney(totals.net), { bold: true, color: netColor }),
                ],
              ],
            },
            layout: dataLayout({ footer: true }),
          }
        ),
        note("Split \"by income\" is your share of the household's shared income that month; \"fixed\" is the percentage set in the budget's settings."),
      ]
    : [
        {
          margin: [0, 14, 0, 0],
          table: {
            widths: ["*"],
            body: [[{
              text: [
                { text: "Split this month: ", color: C.muted },
                { text: splitLabel(months[0]), bold: true },
                { text: months[0].splitMethod === "percentage" ? "  (fixed percentage from the budget settings)" : "  (your share of shared income)", color: C.muted },
              ],
              fillColor: C.surface,
              margin: [6, 3, 6, 3],
            }]],
          },
          layout: "noBorders",
        },
      ];

  // spending
  const sharedMax = Math.max(0, ...statement.sharedByCategory.map((c) => c.total));
  const sharedCategories = section(
    "Shared spending by category",
    `${money(totals.householdSharedExpenses)} shared · your share ${money(totals.yourShare)}`,
    statement.sharedByCategory.length
      ? {
          stack: [
            {
              table: {
                headerRows: 1,
                dontBreakRows: true,
                widths: ["*", 130, "auto", "auto", "auto"],
                body: [
                  [th("Category"), th(""), th("Household", "right"), th("Your share", "right"), th("You paid", "right")],
                  ...statement.sharedByCategory.map((c) => [
                    withCount(c.title, c.count),
                    bar(c.total, sharedMax, c.yourShare, 126),
                    num(signedMoney(c.total)),
                    num(signedMoney(c.yourShare), { bold: true }),
                    num(money(c.youPaid), { color: C.muted }),
                  ]),
                ],
              },
              layout: dataLayout(),
            },
            {
              margin: [0, 5, 0, 0],
              columns: [
                { width: 10, canvas: [{ type: "rect", x: 0, y: 1.5, w: 8, h: 5, r: 1.5, color: C.accent }] },
                { width: "auto", text: "Your share", style: "note", margin: [0, 0, 10, 0] },
                { width: 10, canvas: [{ type: "rect", x: 0, y: 1.5, w: 8, h: 5, r: 1.5, color: C.barTotal }] },
                { width: "auto", text: "Household total", style: "note" },
              ],
            },
          ],
        }
      : empty("No shared expenses in this period.")
  );

  const individualMax = Math.max(0, ...statement.individualByCategory.map((c) => c.total));
  const individualCategories = section(
    "Your individual spending",
    money(totals.individualExpenses),
    statement.individualByCategory.length
      ? {
          table: {
            headerRows: 1,
            dontBreakRows: true,
            widths: ["*", 180, "auto"],
            body: [
              [th("Category"), th(""), th("Total", "right")],
              ...statement.individualByCategory.map((c) => [
                withCount(c.title, c.count),
                bar(c.total, individualMax, undefined, 176),
                num(signedMoney(c.total), { bold: true }),
              ]),
            ],
          },
          layout: dataLayout(),
        }
      : empty("No individual expenses in this period.")
  );

  // income
  const incomeTable = (rows, withYours) =>
    rows.length
      ? {
          table: {
            headerRows: 1,
            dontBreakRows: true,
            widths: withYours ? ["*", "auto", "auto"] : ["*", "auto"],
            body: [
              withYours ? [th("Category"), th("Household", "right"), th("Yours", "right")] : [th("Category"), th("Total", "right")],
              ...rows.map((c) =>
                withYours
                  ? [withCount(c.title, c.count), num(money(c.total), { color: C.muted }), num(money(c.yours), { bold: true })]
                  : [withCount(c.title, c.count), num(money(c.total), { bold: true })]
              ),
            ],
          },
          layout: dataLayout({ compact: true }),
        }
      : empty("None in this period.");

  const income = {
    columnGap: GAP,
    columns: [
      { width: HALF, stack: [section("Shared income", `${money(totals.sharedIncome)} of ${money(totals.householdSharedIncome)}`, incomeTable(statement.sharedIncomeByCategory, true), HALF)] },
      { width: HALF, stack: [section("Individual income", money(totals.individualIncome), incomeTable(statement.individualIncomeByCategory, false), HALF)] },
    ],
  };

  // detail
  const transfers = section(
    "Transfers",
    `${money(totals.transfersIn)} received · ${money(totals.transfersOut)} sent`,
    statement.transfers.length
      ? {
          table: {
            headerRows: 1,
            dontBreakRows: true,
            widths: [34, 46, "*", "auto"],
            body: [
              [th("Date"), th("Between"), th("Note"), th("Amount", "right")],
              ...statement.transfers.map(({ entry, direction: dir }) => [
                { text: entryDate(entry), color: C.muted },
                direction(entry),
                { text: entry.title || "", color: C.muted },
                num(`${dir === "in" ? "+" : "-"}${money(entry.value)}`, { color: dir === "in" ? C.positive : C.negative }),
              ]),
            ],
          },
          layout: dataLayout({ compact: true }),
        }
      : empty("No transfers in this period."),
    WIDTH,
    6
  );

  const sharedDetail = section(
    "Shared expense detail",
    `${statement.detail.shared.length} entries`,
    statement.detail.shared.length
      ? {
          table: {
            headerRows: 1,
            dontBreakRows: true,
            widths: [34, 110, "*", 34, "auto", "auto"],
            body: [
              [th("Date"), th("Category"), th("Description"), th("Paid by"), th("Amount", "right"), th("Your share", "right")],
              ...statement.detail.shared.map(({ entry, yourShare, categoryTitle }) => [
                { text: entryDate(entry), color: C.muted },
                { text: categoryTitle, color: C.muted },
                entry.title,
                { columns: [avatar(entry.userID)] },
                num(signedMoney(entry.value)),
                num(signedMoney(yourShare), { bold: true }),
              ]),
            ],
          },
          layout: dataLayout({ compact: true }),
          fontSize: 8,
        }
      : empty("No shared expenses in this period.")
  );

  const individualDetail = section(
    "Individual expense detail",
    `${statement.detail.individualExpenses.length} entries`,
    statement.detail.individualExpenses.length
      ? {
          table: {
            headerRows: 1,
            dontBreakRows: true,
            widths: [34, 110, "*", "auto"],
            body: [
              [th("Date"), th("Category"), th("Description"), th("Amount", "right")],
              ...statement.detail.individualExpenses.map(({ entry, categoryTitle }) => [
                { text: entryDate(entry), color: C.muted },
                { text: categoryTitle, color: C.muted },
                entry.title,
                num(signedMoney(entry.value), { bold: true }),
              ]),
            ],
          },
          layout: dataLayout({ compact: true }),
          fontSize: 8,
        }
      : empty("No individual expenses in this period.")
  );

  const hasDetail =
    statement.transfers.length ||
    statement.detail.shared.length ||
    statement.detail.individualExpenses.length;

  const appendix = hasDetail
    ? [{ text: "DETAIL", style: "eyebrow", pageBreak: "before" }, transfers, sharedDetail, individualDetail]
    : [];

  return {
    pageSize: "LETTER",
    pageMargins: [MARGIN, MARGIN, MARGIN, MARGIN + 12],
    info: {
      title: `${statement.budget.title} statement - ${periodLabel(months)}`,
      author: "Budgeter",
      subject: user.email,
    },
    defaultStyle: { font: "Helvetica", fontSize: 8.5, color: C.text, lineHeight: 1.15 },
    styles: {
      eyebrow: { fontSize: 7.5, bold: true, color: C.accent, characterSpacing: 0.6, margin: [0, 0, 0, 4] },
      h1: { fontSize: 20, bold: true },
      h2: { fontSize: 10.5, bold: true },
      sectionSub: { fontSize: 7.5, color: C.muted, margin: [0, 2, 0, 0] },
      th: { fontSize: 6.5, bold: true, color: C.muted, characterSpacing: 0.4 },
      kpiLabel: { fontSize: 7, bold: true, color: C.muted, characterSpacing: 0.5 },
      note: { fontSize: 7, color: C.muted, margin: [0, 5, 0, 0] },
    },
    content: [
      ...masthead,
      kpis,
      howItAddsUp,
      ...monthTable,
      sharedCategories,
      individualCategories,
      income,
      ...appendix,
    ],
    footer: (currentPage, pageCount) => ({
      margin: [MARGIN, 14, MARGIN, 0],
      fontSize: 7,
      color: C.subtle,
      columns: [
        { text: footer },
        { text: `Page ${currentPage} of ${pageCount}`, alignment: "right" },
      ],
    }),
    // never leave a section heading alone at the bottom of a page
    pageBreakBefore: (node, { getFollowingNodesOnPage }) =>
      node.headlineLevel === 1 && getFollowingNodesOnPage().length < 6,
  };
}

module.exports = statementDocument;
