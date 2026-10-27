// HTML for a person's budget statement (see reports/statement.cjs), rendered
// to PDF by utils/pdf.cjs. Leads with the bottom line, then shows how it was
// reached, then the supporting detail.
const { format } = require("date-fns");
const { toCurrency, escapeHtml } = require("../utils/helpers.cjs");

const esc = escapeHtml;
const money = (value) => toCurrency(Math.abs(value || 0));
const signed = (value) =>
  `${value < 0 ? "−" : value > 0 ? "+" : ""}${money(value)}`;
// fixed sign for a calculation line, dropped when the amount is zero
const lessMoney = (value) => (Math.abs(value) < 0.005 ? money(0) : `−${money(value)}`);
const plusMoney = (value) => (Math.abs(value) < 0.005 ? money(0) : `+${money(value)}`);
const pct = (rate, digits = 1) => `${(rate * 100).toFixed(digits).replace(/\.0$/, "")}%`;
const labelToDate = (label) => {
  const [month, year] = label.split("/").map(Number);
  return new Date(2000 + year, month - 1, 1);
};
const monthName = (label, pattern = "MMM yyyy") => format(labelToDate(label), pattern);
const entryDate = (entry) => format(new Date(entry.effectiveDate ?? entry.createdAt), "MMM d");
const initials = (user) => esc((user?.userInitials || user?.email?.[0] || "?").toUpperCase());
const nameOf = (user) => esc(user?.userInitials || user?.email || "someone");

function avatar(user) {
  const color = user?.userColor ? `#${esc(user.userColor)}` : "#9a9aa5";
  return `<span class="avatar" style="background:${color}">${initials(user)}</span>`;
}

function periodLabel(months) {
  const first = months[0].label;
  const last = months[months.length - 1].label;
  if (first === last) {
    return monthName(first, "MMMM yyyy");
  }
  const sameYear = labelToDate(first).getFullYear() === labelToDate(last).getFullYear();
  return `${monthName(first, sameYear ? "MMMM" : "MMMM yyyy")} – ${monthName(last, "MMMM yyyy")}`;
}

function splitLabel(month) {
  return month.splitMethod === "percentage"
    ? `Fixed ${pct(month.rate)}`
    : `By income ${pct(month.rate)}`;
}

// "EL owes you" / "You owe EL" / "All square"
function settleUp(statement) {
  const { settlement } = statement.totals;
  const counterpart =
    statement.others.length === 1 ? nameOf(statement.others[0]) : "the others";
  if (Math.abs(settlement) < 0.005) {
    return { tone: "neutral", label: "All square", detail: "Nothing to settle for this period" };
  }
  return settlement > 0
    ? { tone: "negative", label: `You owe ${counterpart}`, detail: "Your share of shared costs is more than you covered" }
    : { tone: "positive", label: `${statement.others.length === 1 ? counterpart : "The others"} ${statement.others.length === 1 ? "owes" : "owe"} you`, detail: "You covered more than your share of shared costs" };
}

// horizontal bar scaled to the largest row; `inner` shades part of it
function bar(value, max, inner) {
  if (!(max > 0) || !(value > 0)) {
    return "";
  }
  const width = Math.max(0.5, (value / max) * 100);
  const innerWidth = inner === undefined ? 100 : Math.min(100, Math.max(0, (inner / value) * 100));
  return `<div class="bar${inner === undefined ? " bar-solid" : ""}"><span style="width:${width.toFixed(1)}%"><i style="width:${innerWidth.toFixed(1)}%"></i></span></div>`;
}

function section(title, subtitle, body, extraClass = "") {
  return `<section class="${extraClass}">
    <div class="section-head"><h2>${title}</h2>${subtitle ? `<span>${subtitle}</span>` : ""}</div>
    ${body}
  </section>`;
}

function empty(text) {
  return `<p class="empty">${text}</p>`;
}

function statementTemplate(statement) {
  const { totals, months, user } = statement;
  const settle = settleUp(statement);
  const multiMonth = months.length > 1;
  const splitMethods = [...new Set(months.map((m) => m.splitMethod))];

  // ---- header + bottom line -------------------------------------------------
  const header = `
    <header class="masthead">
      <div>
        <div class="eyebrow">Budget statement · ${esc(statement.budget.title)}</div>
        <h1>${periodLabel(months)}</h1>
        <div class="person">${avatar(user)}<span>${esc(user.email)}</span>${
          multiMonth ? `<span class="dot">·</span><span>${months.length} months</span>` : ""
        }</div>
      </div>
      <div class="generated">Generated ${format(new Date(), "MMM d, yyyy")}</div>
    </header>`;

  const kpis = `
    <div class="kpis">
      <div class="kpi kpi-hero ${settle.tone}">
        <div class="kpi-label">Settle up</div>
        <div class="kpi-value">${settle.tone === "neutral" ? "$0.00" : money(totals.settlement)}</div>
        <div class="kpi-title">${settle.label}</div>
        <div class="kpi-detail">${settle.detail}</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Your net result</div>
        <div class="kpi-value ${totals.net < 0 ? "negative" : ""}">${totals.net < 0 ? "−" : ""}${money(totals.net)}</div>
        <div class="kpi-detail">Income less your share of shared costs and your own spending</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Your share of shared costs</div>
        <div class="kpi-value">${money(totals.yourShare)}</div>
        <div class="kpi-detail">${pct(totals.effectiveRate)} of ${money(totals.householdSharedExpenses)} shared${
          splitMethods.length === 1
            ? splitMethods[0] === "percentage" ? " · fixed split" : " · split by income"
            : " · mixed split methods"
        }</div>
      </div>
    </div>`;

  // ---- how it adds up -------------------------------------------------------
  const settleRows = `
    <table class="calc">
      <tr><td>Your share of shared expenses</td><td>${money(totals.yourShare)}</td></tr>
      <tr><td>Shared expenses you paid</td><td>${lessMoney(totals.sharedPaid)}</td></tr>
      <tr><td>Transfers you received</td><td>${plusMoney(totals.transfersIn)}</td></tr>
      <tr><td>Transfers you sent</td><td>${lessMoney(totals.transfersOut)}</td></tr>
      <tr class="calc-total ${settle.tone}"><td>${settle.label}</td><td>${money(totals.settlement)}</td></tr>
    </table>
    <p class="note">Transfers between you count toward settling up: money you received adds to what you owe, money you sent reduces it.</p>`;

  const resultRows = `
    <table class="calc">
      <tr><td>Shared income you brought in</td><td>${money(totals.sharedIncome)}</td></tr>
      <tr><td>Your individual income</td><td>${money(totals.individualIncome)}</td></tr>
      <tr><td>Your share of shared expenses</td><td>${lessMoney(totals.yourShare)}</td></tr>
      <tr><td>Your individual expenses</td><td>${lessMoney(totals.individualExpenses)}</td></tr>
      <tr class="calc-total ${totals.net < 0 ? "negative" : ""}"><td>Net result</td><td>${totals.net < 0 ? "−" : ""}${money(totals.net)}</td></tr>
    </table>
    <p class="note">What is left for you once everyone has settled up, counting only your share of shared costs.</p>`;

  const howItAddsUp = `
    <div class="columns">
      ${section("How the settle-up adds up", "", settleRows)}
      ${section("Your result", "", resultRows)}
    </div>`;

  // ---- month by month -------------------------------------------------------
  const monthTable = multiMonth
    ? section(
        "Month by month",
        "Each month is settled with the split that applied to it",
        `<table class="data">
          <thead><tr>
            <th>Month</th><th>Split</th><th class="num">Shared costs</th><th class="num">Your share</th>
            <th class="num">You paid</th><th class="num">Transfers</th><th class="num">Settle up</th><th class="num">Net</th>
          </tr></thead>
          <tbody>
            ${months
              .map(
                (m) => `<tr>
                  <td>${monthName(m.label)}</td>
                  <td class="muted">${splitLabel(m)}</td>
                  <td class="num">${money(m.householdSharedExpenses)}</td>
                  <td class="num">${money(m.yourShare)}</td>
                  <td class="num">${money(m.sharedPaid)}</td>
                  <td class="num muted">${signed(round2(m.transfersIn - m.transfersOut))}</td>
                  <td class="num ${m.settlement > 0 ? "negative" : m.settlement < 0 ? "positive" : ""}">${
                    m.settlement > 0 ? "You owe " : m.settlement < 0 ? "Owed to you " : ""
                  }${money(m.settlement)}</td>
                  <td class="num ${m.net < 0 ? "negative" : ""}">${m.net < 0 ? "−" : ""}${money(m.net)}</td>
                </tr>`
              )
              .join("")}
          </tbody>
          <tfoot><tr>
            <td colspan="2">Total</td>
            <td class="num">${money(totals.householdSharedExpenses)}</td>
            <td class="num">${money(totals.yourShare)}</td>
            <td class="num">${money(totals.sharedPaid)}</td>
            <td class="num">${signed(round2(totals.transfersIn - totals.transfersOut))}</td>
            <td class="num ${settle.tone}">${settle.tone === "negative" ? "You owe " : settle.tone === "positive" ? "Owed to you " : ""}${money(totals.settlement)}</td>
            <td class="num ${totals.net < 0 ? "negative" : ""}">${totals.net < 0 ? "−" : ""}${money(totals.net)}</td>
          </tr></tfoot>
        </table>
        <p class="note">Split “by income” is your share of the household’s shared income that month; “fixed” is the percentage set in the budget’s settings.</p>`
      )
    : `<p class="split-line">Split this month: <strong>${splitLabel(months[0])}</strong> ${
        months[0].splitMethod === "percentage"
          ? "(fixed percentage from the budget settings)"
          : "(your share of shared income)"
      }</p>`;

  // ---- spending ------------------------------------------------------------
  const sharedMax = Math.max(0, ...statement.sharedByCategory.map((c) => c.total));
  const sharedCategories = section(
    "Shared spending by category",
    `${money(totals.householdSharedExpenses)} shared · your share ${money(totals.yourShare)}`,
    statement.sharedByCategory.length
      ? `<table class="data">
          <thead><tr><th>Category</th><th class="bar-col"></th><th class="num">Household</th><th class="num">Your share</th><th class="num">You paid</th></tr></thead>
          <tbody>${statement.sharedByCategory
            .map(
              (c) => `<tr>
                <td>${esc(c.title)} <span class="count">${c.count}</span></td>
                <td class="bar-col">${bar(c.total, sharedMax, c.yourShare)}</td>
                <td class="num">${c.total < 0 ? "−" : ""}${money(c.total)}</td>
                <td class="num strong">${c.yourShare < 0 ? "−" : ""}${money(c.yourShare)}</td>
                <td class="num muted">${money(c.youPaid)}</td>
              </tr>`
            )
            .join("")}</tbody>
        </table>
        <p class="note legend"><span class="swatch swatch-share"></span>Your share <span class="swatch swatch-total"></span>Household total</p>`
      : empty("No shared expenses in this period.")
  );

  const individualMax = Math.max(0, ...statement.individualByCategory.map((c) => c.total));
  const individualCategories = section(
    "Your individual spending",
    money(totals.individualExpenses),
    statement.individualByCategory.length
      ? `<table class="data">
          <thead><tr><th>Category</th><th class="bar-col"></th><th class="num">Total</th></tr></thead>
          <tbody>${statement.individualByCategory
            .map(
              (c) => `<tr>
                <td>${esc(c.title)} <span class="count">${c.count}</span></td>
                <td class="bar-col">${bar(c.total, individualMax)}</td>
                <td class="num strong">${c.total < 0 ? "−" : ""}${money(c.total)}</td>
              </tr>`
            )
            .join("")}</tbody>
        </table>`
      : empty("No individual expenses in this period.")
  );

  // ---- income --------------------------------------------------------------
  const incomeTable = (rows, withYours) =>
    rows.length
      ? `<table class="data compact">
          <thead><tr><th>Category</th>${withYours ? `<th class="num">Household</th><th class="num">Yours</th>` : `<th class="num">Total</th>`}</tr></thead>
          <tbody>${rows
            .map(
              (c) => `<tr><td>${esc(c.title)} <span class="count">${c.count}</span></td>${
                withYours
                  ? `<td class="num muted">${money(c.total)}</td><td class="num strong">${money(c.yours)}</td>`
                  : `<td class="num strong">${money(c.total)}</td>`
              }</tr>`
            )
            .join("")}</tbody>
        </table>`
      : empty("None in this period.");

  const income = `<div class="columns">
    ${section("Shared income", `${money(totals.sharedIncome)} of ${money(totals.householdSharedIncome)}`, incomeTable(statement.sharedIncomeByCategory, true))}
    ${section("Individual income", money(totals.individualIncome), incomeTable(statement.individualIncomeByCategory, false))}
  </div>`;

  // ---- transfers -----------------------------------------------------------
  const transfers = section(
    "Transfers",
    `${money(totals.transfersIn)} received · ${money(totals.transfersOut)} sent`,
    statement.transfers.length
      ? `<table class="data compact">
          <thead><tr><th class="date">Date</th><th>Between</th><th>Note</th><th class="num">Amount</th></tr></thead>
          <tbody>${statement.transfers
            .map(
              ({ entry, direction }) => `<tr>
                <td class="date">${entryDate(entry)}</td>
                <td class="nowrap">${avatar(entry.userID)}<span class="arrow">→</span>${avatar(entry.toUserID)}</td>
                <td class="muted">${esc(entry.title || "")}</td>
                <td class="num ${direction === "in" ? "positive" : "negative"}">${direction === "in" ? "+" : "−"}${money(entry.value)}</td>
              </tr>`
            )
            .join("")}</tbody>
        </table>`
      : empty("No transfers in this period.")
  );

  // ---- appendix ------------------------------------------------------------
  const sharedDetail = statement.detail.shared.length
    ? `<table class="data compact detail">
        <thead><tr><th class="date">Date</th><th>Category</th><th>Description</th><th>Paid by</th><th class="num">Amount</th><th class="num">Your share</th></tr></thead>
        <tbody>${statement.detail.shared
          .map(
            ({ entry, yourShare, categoryTitle }) => `<tr>
              <td class="date">${entryDate(entry)}</td>
              <td class="muted">${esc(categoryTitle)}</td>
              <td>${esc(entry.title)}</td>
              <td>${avatar(entry.userID)}</td>
              <td class="num">${entry.value < 0 ? "−" : ""}${money(entry.value)}</td>
              <td class="num strong">${yourShare < 0 ? "−" : ""}${money(yourShare)}</td>
            </tr>`
          )
          .join("")}</tbody>
      </table>`
    : empty("No shared expenses in this period.");

  const individualDetail = statement.detail.individualExpenses.length
    ? `<table class="data compact detail">
        <thead><tr><th class="date">Date</th><th>Category</th><th>Description</th><th class="num">Amount</th></tr></thead>
        <tbody>${statement.detail.individualExpenses
          .map(
            ({ entry, categoryTitle }) => `<tr>
              <td class="date">${entryDate(entry)}</td>
              <td class="muted">${esc(categoryTitle)}</td>
              <td>${esc(entry.title)}</td>
              <td class="num strong">${entry.value < 0 ? "−" : ""}${money(entry.value)}</td>
            </tr>`
          )
          .join("")}</tbody>
      </table>`
    : empty("No individual expenses in this period.");

  const hasDetail =
    statement.transfers.length ||
    statement.detail.shared.length ||
    statement.detail.individualExpenses.length;
  const appendix = !hasDetail ? "" : `<div class="appendix">
    <div class="appendix-title">Detail</div>
    ${transfers}
    ${section("Shared expense detail", `${statement.detail.shared.length} entries`, sharedDetail)}
    ${section("Individual expense detail", `${statement.detail.individualExpenses.length} entries`, individualDetail)}
  </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
  <style>${css}</style>
</head>
<body>
  ${header}
  ${kpis}
  ${howItAddsUp}
  ${monthTable}
  ${sharedCategories}
  ${individualCategories}
  ${income}
  ${appendix}
</body>
</html>`;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

const css = `
  :root {
    --text: #18181b; --muted: #6b6b76; --subtle: #9a9aa5;
    --border: #e4e4e8; --surface: #f6f6f8;
    --accent: #4f46e5; --accent-soft: #eef0ff;
    --positive: #047857; --positive-soft: #ecfdf5;
    --negative: #be123c; --negative-soft: #fff1f3;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    font-size: 9pt; line-height: 1.45; color: var(--text);
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
    font-feature-settings: "tnum";
  }
  h1 { font-size: 20pt; font-weight: 700; letter-spacing: -0.02em; line-height: 1.15; }
  h2 { font-size: 10.5pt; font-weight: 650; letter-spacing: -0.005em; }
  section { margin-top: 18pt; }
  .masthead { display: flex; justify-content: space-between; align-items: flex-end;
    padding-bottom: 12pt; border-bottom: 1.5pt solid var(--text); }
  .eyebrow { font-size: 8pt; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--accent); margin-bottom: 4pt; }
  .person { display: flex; align-items: center; gap: 6pt; margin-top: 6pt; color: var(--muted); }
  .dot { color: var(--subtle); }
  .generated { color: var(--subtle); font-size: 8pt; }
  .avatar { display: inline-flex; align-items: center; justify-content: center;
    width: 15pt; height: 15pt; border-radius: 50%; color: #fff;
    font-size: 6pt; font-weight: 700; letter-spacing: 0.02em; vertical-align: middle; }

  .kpis { display: grid; grid-template-columns: 1.25fr 1fr 1fr; gap: 8pt; margin-top: 14pt; }
  .kpi { border: 1px solid var(--border); border-radius: 8pt; padding: 10pt 12pt; }
  .kpi-label { font-size: 7.5pt; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--muted); }
  .kpi-value { font-size: 17pt; font-weight: 700; letter-spacing: -0.02em; margin-top: 4pt; }
  .kpi-title { font-size: 10pt; font-weight: 650; margin-top: 1pt; }
  .kpi-detail { font-size: 7.5pt; color: var(--muted); margin-top: 3pt; }
  .kpi-hero.positive { background: var(--positive-soft); border-color: #a7f3d0; }
  .kpi-hero.negative { background: var(--negative-soft); border-color: #fecdd6; }
  .kpi-hero.neutral { background: var(--surface); }
  .kpi-hero .kpi-value { font-size: 22pt; }

  .columns { display: grid; grid-template-columns: 1fr 1fr; gap: 16pt; }
  .section-head { display: flex; justify-content: space-between; align-items: baseline;
    padding-bottom: 4pt; margin-bottom: 4pt; border-bottom: 1px solid var(--text); }
  .section-head span { color: var(--muted); font-size: 8pt; }

  table { width: 100%; border-collapse: collapse; }
  tr { break-inside: avoid; }
  thead { display: table-header-group; }
  .calc td { padding: 3.5pt 0; border-bottom: 1px solid var(--border); }
  .calc td:last-child { text-align: right; white-space: nowrap; }
  .calc-total td { border-bottom: none; border-top: 1.5pt solid var(--text); padding-top: 5pt; font-weight: 700; font-size: 10pt; }

  .data th { text-align: left; font-size: 7pt; font-weight: 600; letter-spacing: 0.04em;
    text-transform: uppercase; color: var(--muted); padding: 4pt 6pt 4pt 0; border-bottom: 1px solid var(--border); }
  .data td { padding: 4pt 6pt 4pt 0; border-bottom: 1px solid var(--border); vertical-align: middle; }
  .data.compact td { padding-top: 2.5pt; padding-bottom: 2.5pt; }
  .data tfoot td { font-weight: 700; border-top: 1.5pt solid var(--text); border-bottom: none; padding-top: 5pt; }
  .data th:last-child, .data td:last-child { padding-right: 0; }
  .num { text-align: right !important; white-space: nowrap; }
  .date { width: 34pt; white-space: nowrap; color: var(--muted); }
  .strong { font-weight: 600; }
  .muted { color: var(--muted); }
  .nowrap { white-space: nowrap; }
  .count { display: inline-block; min-width: 12pt; padding: 0 3pt; margin-left: 3pt; border-radius: 6pt;
    background: var(--surface); color: var(--muted); font-size: 6.5pt; text-align: center; }
  .arrow { color: #d97706; margin: 0 3pt; font-weight: 700; }
  .positive { color: var(--positive); }
  .negative { color: var(--negative); }

  .bar-col { width: 30%; }
  .bar { height: 6pt; }
  .bar span { display: block; height: 100%; min-width: 2pt; border-radius: 1.5pt; background: #d9dbe6; overflow: hidden; }
  .bar i { display: block; height: 100%; background: var(--accent); }
  .bar-solid i { background: #8b8fd9; }

  .note { margin-top: 5pt; font-size: 7.5pt; color: var(--muted); }
  .legend { display: flex; align-items: center; gap: 4pt; }
  .swatch { display: inline-block; width: 8pt; height: 6pt; border-radius: 2pt; margin-left: 6pt; }
  .swatch:first-child { margin-left: 0; }
  .swatch-share { background: var(--accent); }
  .swatch-total { background: #d9dbe6; }
  .split-line { margin-top: 14pt; padding: 7pt 10pt; border-radius: 6pt; background: var(--surface); color: var(--muted); }
  .split-line strong { color: var(--text); }
  .empty { color: var(--subtle); padding: 6pt 0; }

  .appendix { break-before: page; }
  .appendix-title { font-size: 7.5pt; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--accent); }
  .appendix section:nth-child(2) { margin-top: 6pt; }
  .detail td { font-size: 8pt; }
`;

module.exports = statementTemplate;
