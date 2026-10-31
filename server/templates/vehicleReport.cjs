// pdfmake document for a vehicle's fuel and maintenance over whole months,
// rendered by utils/pdf.cjs. Summary figures first, then monthly charts, then
// every fill-up and maintenance record in the period.
//
// Charts are drawn with pdfmake's own shapes and text, so they need nothing
// beyond the built-in Helvetica (Western characters only: "-" not a minus).
const { format } = require("date-fns");
const { toCurrency, dateToMonthStr } = require("../utils/helpers.cjs");
const { tireStints } = require("../utils/tires.cjs");

const PAGE_WIDTH = 612; // US Letter, points
const MARGIN = 36; // 0.5in
const WIDTH = PAGE_WIDTH - MARGIN * 2;

const C = {
  text: "#18181b",
  muted: "#6b6b76",
  subtle: "#9a9aa5",
  border: "#e4e4e8",
  grid: "#ededf1",
  surface: "#f6f6f8",
  accent: "#4f46e5",
  accentSoft: "#e3e4fb",
  dot: "#b9bac6",
  maintenance: "#d97706",
  winter: "#2563eb",
  summer: "#ea580c",
  allSeason: "#8b8b96",
};
const DAY = 24 * 60 * 60 * 1000;

// ---- formatting --------------------------------------------------------------
const money = (value) => toCurrency(value || 0);
const km = (value) => `${Math.round(value || 0).toLocaleString("en-US")} km`;
const fixed = (value, digits) => (value === null || value === undefined ? "-" : value.toFixed(digits));
const labelToDate = (label) => {
  const [month, year] = label.split("/").map(Number);
  return new Date(2000 + year, month - 1, 1);
};
const monthName = (label, pattern = "MMM yyyy") => format(labelToDate(label), pattern);
const entryDate = (entry) => format(new Date(entry.effectiveDate ?? entry.createdAt), "MMM d, yyyy");
const nameOf = (user) => user?.userInitials || user?.email || "";
const sum = (items, value) => items.reduce((total, item) => total + (value(item) || 0), 0);

function periodLabel(months) {
  const first = months[0];
  const last = months[months.length - 1];
  if (first === last) {
    return monthName(first, "MMMM yyyy");
  }
  const sameYear = labelToDate(first).getFullYear() === labelToDate(last).getFullYear();
  return `${monthName(first, sameYear ? "MMMM" : "MMMM yyyy")} - ${monthName(last, "MMMM yyyy")}`;
}

// ---- figures -------------------------------------------------------------------
// weighted like the vehicle page: $/L is spend / litres, L/100 km is litres / km
function fuelFigures(fills) {
  const priced = fills.filter((f) => f.entry.mileage.pricePerLitre && f.entry.mileage.litres);
  const pricedLitres = sum(priced, (f) => f.entry.mileage.litres);
  const measured = fills.filter((f) => f.entry.mileage.litres && f.entry.mileage.distance);
  const measuredKm = sum(measured, (f) => f.entry.mileage.distance);
  return {
    count: fills.length,
    cost: sum(fills, (f) => f.entry.value),
    distance: sum(fills, (f) => f.entry.mileage.distance),
    litres: sum(fills, (f) => f.entry.mileage.litres),
    pricePerLitre: pricedLitres
      ? sum(priced, (f) => f.entry.mileage.pricePerLitre * f.entry.mileage.litres) / pricedLitres
      : null,
    litresPer100km: measuredKm ? (sum(measured, (f) => f.entry.mileage.litres) * 100) / measuredKm : null,
  };
}

// ---- building blocks -----------------------------------------------------------
const th = (text, alignment = "left") => ({ text: text.toUpperCase(), style: "th", alignment });
const num = (text, extra = {}) => ({ text, alignment: "right", noWrap: true, ...extra });

function dataLayout({ footer = false } = {}) {
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
    paddingTop: () => 3,
    paddingBottom: () => 3,
  };
}

function section(title, subtitle, body, top = 18) {
  return {
    margin: [0, top, 0, 0],
    stack: [
      {
        columns: [
          { text: title, style: "h2", width: "auto" },
          { text: subtitle || "", style: "sectionSub", alignment: "right" },
        ],
        headlineLevel: 1,
      },
      { canvas: [{ type: "line", x1: 0, y1: 3, x2: WIDTH, y2: 3, lineWidth: 1, lineColor: C.text }], margin: [0, 0, 0, 3] },
      body,
    ],
  };
}

const empty = (text) => ({ text, color: C.subtle, margin: [0, 6, 0, 0] });

// a summary box like the vehicle page's stats
function statBox(width, label, value, detail) {
  const height = 46;
  return {
    width,
    stack: [
      { canvas: [{ type: "rect", x: 0, y: 0, w: width, h: height, r: 5, color: "#ffffff", lineColor: C.border, lineWidth: 0.75 }] },
      {
        relativePosition: { x: 9, y: -height + 8 },
        stack: [
          { text: label.toUpperCase(), style: "kpiLabel" },
          { text: value, fontSize: 13, bold: true, margin: [0, 3, 0, 0] },
          { text: detail || "", fontSize: 6.5, color: C.muted, margin: [0, 1, 0, 0] },
        ],
      },
    ],
  };
}

function statRow(stats, top) {
  const gap = 8;
  const width = (WIDTH - gap * (stats.length - 1)) / stats.length;
  return {
    margin: [0, top, 0, 0],
    columnGap: gap,
    columns: stats.map(([label, value, detail]) => statBox(width, label, value, detail)),
  };
}

// ---- charts --------------------------------------------------------------------
const AXIS_WIDTH = 34;
const PLOT_WIDTH = WIDTH - AXIS_WIDTH;

// three "nice" steps from 0 (or a floor) to just above max
function niceScale(min, max) {
  const span = max - min || Math.abs(max) || 1;
  const raw = span / 3;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= raw);
  const low = Math.floor(min / step) * step;
  return { low, high: low + step * 3, step };
}

// a plot area with gridlines and y labels; `shapes(x, y)` draws the data
function chartFrame({ months, height, low, high, step, label, shapes }) {
  const slot = PLOT_WIDTH / months.length;
  const x = (index) => slot * (index + 0.5);
  const y = (value) => height - ((value - low) / (high - low)) * height;

  const values = [];
  for (let v = high; v >= low - step / 2; v -= step) {
    values.push(v);
  }
  const grid = values.map((v) => ({
    type: "line", x1: 0, y1: y(v), x2: PLOT_WIDTH, y2: y(v), lineWidth: 0.5, lineColor: C.grid,
  }));

  // y labels centred on their gridlines: each label's top margin closes the
  // gap left after the one above it
  const LINE = 7.5;
  const yLabels = values.map((v, i) => ({
    text: label(v),
    fontSize: 6.5,
    color: C.subtle,
    alignment: "right",
    margin: [0, i === 0 ? y(v) - LINE / 2 : y(v) - y(values[i - 1]) - LINE, 5, 0],
  }));

  // month labels every 1, 2, 3, 6 or 12 months: at most a dozen, and each
  // with room for "Jan 22". A label spans its run of months, centred on the
  // first of them.
  const LABEL_WIDTH = 30;
  const every =
    [1, 2, 3, 6, 12].find((n) => months.length / n <= 12 && slot * n >= LABEL_WIDTH) || 12;
  const xLabels = [];
  for (let i = 0; i < months.length; i += every) {
    const span = Math.min(every, months.length - i);
    xLabels.push({
      text: monthName(months[i], months.length > 12 ? "MMM yy" : "MMM"),
      fontSize: 6.5,
      color: C.subtle,
      noWrap: true,
      width: slot * span,
      alignment: every === 1 ? "center" : "left",
      margin: [every === 1 ? 0 : slot / 2 - LABEL_WIDTH / 2 + 4, 0, 0, 0],
    });
  }

  return {
    stack: [
      {
        columns: [
          { width: AXIS_WIDTH, stack: yLabels },
          { width: PLOT_WIDTH, canvas: [...grid, ...shapes(x, y, slot)] },
        ],
        columnGap: 0,
      },
      { columns: [{ width: AXIS_WIDTH, text: "" }, ...xLabels], columnGap: 0, margin: [0, 4, 0, 0] },
    ],
  };
}

// monthly L/100 km line over each fill-up's own figure
function efficiencyChart(months, fillsByMonth) {
  const monthly = months.map((m) => fuelFigures(fillsByMonth.get(m) || []).litresPer100km);
  const points = months.flatMap((m, i) =>
    (fillsByMonth.get(m) || [])
      .filter((f) => f.litresPer100km)
      .map((f, j, list) => ({ i, offset: (j + 1) / (list.length + 1) - 0.5, value: f.litresPer100km }))
  );
  const values = [...monthly.filter((v) => v !== null), ...points.map((p) => p.value)];
  if (!values.length) {
    return null;
  }
  const { low, high, step } = niceScale(Math.min(...values) * 0.95, Math.max(...values) * 1.03);
  const height = 120;

  return chartFrame({
    months,
    height,
    low,
    high,
    step,
    label: (v) => v.toFixed(Number.isInteger(step) ? 0 : 1),
    shapes: (x, y, slot) => {
      const line = monthly
        .map((v, i) => (v === null ? null : { x: x(i), y: y(v) }))
        .filter(Boolean);
      return [
        ...points.map((p) => ({ type: "ellipse", x: x(p.i) + p.offset * slot, y: y(p.value), r1: 1.6, r2: 1.6, color: C.dot })),
        ...(line.length > 1
          ? [{ type: "polyline", points: line, lineWidth: 1.6, lineColor: C.accent, lineCap: "round" }]
          : []),
        ...line.map((p) => ({ type: "ellipse", x: p.x, y: p.y, r1: 2.2, r2: 2.2, color: "#ffffff", lineColor: C.accent, lineWidth: 1.2 })),
      ];
    },
  });
}

// monthly spend, fuel stacked under maintenance
function spendChart(months, fillsByMonth, maintenanceByMonth) {
  const rows = months.map((m) => ({
    fuel: sum(fillsByMonth.get(m) || [], (f) => f.entry.value),
    maintenance: sum(maintenanceByMonth.get(m) || [], (e) => e.value),
  }));
  const max = Math.max(...rows.map((r) => r.fuel + r.maintenance));
  if (!(max > 0)) {
    return null;
  }
  const { low, high, step } = niceScale(0, max);
  const height = 110;

  return chartFrame({
    months,
    height,
    low,
    high,
    step,
    label: (v) => `$${Math.round(v).toLocaleString("en-US")}`,
    shapes: (x, y, slot) => {
      const w = Math.max(1.5, Math.min(18, slot * 0.6));
      return rows.flatMap((r, i) => {
        const shapes = [];
        if (r.fuel > 0) {
          shapes.push({ type: "rect", x: x(i) - w / 2, y: y(r.fuel), w, h: y(0) - y(r.fuel), color: C.accent });
        }
        if (r.maintenance > 0) {
          const top = y(r.fuel + r.maintenance);
          shapes.push({ type: "rect", x: x(i) - w / 2, y: top, w, h: y(r.fuel) - top, color: C.maintenance });
        }
        return shapes;
      });
    },
  });
}

const legend = (items) => ({
  columns: items.map(([color, text, round]) => ({
    width: "auto",
    columns: [
      {
        width: 10,
        canvas: [
          round
            ? { type: "ellipse", x: 4, y: 5, r1: 2, r2: 2, color }
            : { type: "rect", x: 0, y: 3, w: 8, h: 4, r: 1, color },
        ],
      },
      { width: "auto", text, fontSize: 7, color: C.muted, margin: [2, 1, 10, 0] },
    ],
  })),
  margin: [AXIS_WIDTH, 6, 0, 0],
});

// ---- tires ---------------------------------------------------------------------
const seasonColor = (season) =>
  season === "winter" ? C.winter : season === "summer" ? C.summer : C.allSeason;
// "Michelin Pilot Sport 4S (2025)": the year the set first went on
const tireName = (tire) =>
  tire.firstDate ? `${tire.brand} (${new Date(tire.firstDate).getFullYear()})` : tire.brand;
const seasonName = (season) =>
  season === "winter" ? "Winter" : season === "summer" ? "Summer" : "All-season";

// a small sun, snowflake or half-disc drawn in the season's colour
function seasonGlyph(season) {
  const color = seasonColor(season);
  const cx = 4.5;
  const cy = 5.5;
  if (season === "summer") {
    const rays = Array.from({ length: 8 }, (_, i) => {
      const a = (i * Math.PI) / 4;
      return { type: "line", x1: cx + Math.cos(a) * 3, y1: cy + Math.sin(a) * 3, x2: cx + Math.cos(a) * 4.4, y2: cy + Math.sin(a) * 4.4, lineWidth: 0.8, lineColor: color };
    });
    return { width: 12, canvas: [{ type: "ellipse", x: cx, y: cy, r1: 2, r2: 2, color }, ...rays] };
  }
  if (season === "winter") {
    const arms = [0, 60, 120].map((deg) => {
      const a = (deg * Math.PI) / 180;
      return { type: "line", x1: cx - Math.cos(a) * 4.2, y1: cy - Math.sin(a) * 4.2, x2: cx + Math.cos(a) * 4.2, y2: cy + Math.sin(a) * 4.2, lineWidth: 0.9, lineColor: color };
    });
    return { width: 12, canvas: arms };
  }
  return { width: 12, canvas: [{ type: "ellipse", x: cx, y: cy, r1: 3.6, r2: 3.6, lineWidth: 0.9, lineColor: color }] };
}

// Each set's time on the car within the period. km are the stint's km in
// proportion to the days of it that fall in the period.
function tiresInPeriod(log, periodStart, periodEnd) {
  const stints = tireStints(log.vehicle.tireChanges, log.vehicle.odometer);
  const byTire = new Map();
  stints.forEach((s) => {
    const from = Math.max(s.fromDate.getTime(), periodStart.getTime());
    const to = Math.min(s.toDate.getTime(), periodEnd.getTime());
    if (to <= from) {
      return;
    }
    const length = s.toDate - s.fromDate;
    const share = length > 0 ? (to - from) / length : 1;
    const row = byTire.get(s.tireID) || { days: 0, km: 0, bars: [], current: false };
    row.days += (to - from) / DAY;
    row.km += s.km * share;
    row.bars.push({ from, to, current: s.current });
    row.current = row.current || (s.current && periodEnd.getTime() >= Date.now() - DAY);
    byTire.set(s.tireID, row);
  });
  return (log.tires || [])
    .filter((t) => byTire.has(String(t._id)))
    .map((t) => ({ tire: t, ...byTire.get(String(t._id)) }));
}

function tireTimeline(rows, periodStart, periodEnd) {
  const LABEL = 150;
  const width = WIDTH - LABEL;
  const span = periodEnd - periodStart;
  const x = (time) => ((time - periodStart) / span) * width;
  return {
    stack: rows.map((row) => ({
      columns: [
        {
          width: LABEL,
          columns: [seasonGlyph(row.tire.season), { width: "*", text: tireName(row.tire), fontSize: 7.5, margin: [2, 1, 4, 0] }],
        },
        {
          width,
          canvas: [
            { type: "rect", x: 0, y: 2, w: width, h: 8, r: 2, color: C.surface },
            ...row.bars.map((bar) => ({
              type: "rect",
              x: x(bar.from),
              y: 2,
              w: Math.max(1.5, x(bar.to) - x(bar.from)),
              h: 8,
              r: 2,
              color: seasonColor(row.tire.season),
              ...(bar.current ? { lineColor: C.text, lineWidth: 0.8 } : {}),
            })),
          ],
        },
      ],
      margin: [0, 2, 0, 2],
    })),
  };
}

// ---- document ------------------------------------------------------------------
function vehicleReportDocument(log, { months, footer = "" }) {
  const { vehicle } = log;
  const inPeriod = (entry) => months.includes(dateToMonthStr(new Date(entry.effectiveDate)));
  const fills = log.fills.filter((f) => inPeriod(f.entry));
  const maintenance = log.maintenance.filter(inPeriod);

  const byMonth = (items, entryOf) => {
    const map = new Map();
    items.forEach((item) => {
      const key = dateToMonthStr(new Date(entryOf(item).effectiveDate));
      map.set(key, [...(map.get(key) || []), item]);
    });
    return map;
  };
  const fillsByMonth = byMonth(fills, (f) => f.entry);
  const maintenanceByMonth = byMonth(maintenance, (e) => e);

  const fuel = fuelFigures(fills);
  const maintenanceCost = sum(maintenance, (e) => e.value);
  const startOdometer = fills.length ? fills[0].odometer - (fills[0].entry.mileage.distance || 0) : null;
  const endOdometer = fills.length ? fills[fills.length - 1].odometer : null;
  const totalCost = fuel.cost + maintenanceCost;

  const masthead = [
    { text: "VEHICLE REPORT", style: "eyebrow" },
    { text: vehicle.name, style: "h1" },
    {
      columns: [
        {
          width: "*",
          text: [
            periodLabel(months),
            ...[vehicle.color, vehicle.plate].filter(Boolean).map((part) => `  ·  ${part}`),
            startOdometer !== null ? `  ·  Odometer ${km(startOdometer)} to ${km(endOdometer)}` : "",
          ].join(""),
          color: C.muted,
        },
        { width: "auto", text: `Generated ${format(new Date(), "MMM d, yyyy")}`, fontSize: 7.5, color: C.subtle, margin: [0, 1, 0, 0] },
      ],
      margin: [0, 5, 0, 0],
    },
    { canvas: [{ type: "line", x1: 0, y1: 8, x2: WIDTH, y2: 8, lineWidth: 1.5, lineColor: C.text }] },
  ];

  const stats = [
    statRow([
      ["Fill-ups", fuel.count.toLocaleString("en-US")],
      ["Fuel spent", money(fuel.cost)],
      ["Driven", km(fuel.distance)],
      ["Litres", `${Math.round(fuel.litres).toLocaleString("en-US")} L`],
    ], 14),
    statRow([
      ["Avg price", fuel.pricePerLitre ? `$${fuel.pricePerLitre.toFixed(3)}/L` : "-"],
      ["Avg consumption", fuel.litresPer100km ? `${fuel.litresPer100km.toFixed(1)} L/100 km` : "-"],
      ["Maintenance", money(maintenanceCost), `${maintenance.length} record${maintenance.length === 1 ? "" : "s"}`],
      ["Total cost", money(totalCost), fuel.distance ? `${money(totalCost / fuel.distance)} per km` : ""],
    ], 8),
  ];

  const efficiency = efficiencyChart(months, fillsByMonth);
  const spend = spendChart(months, fillsByMonth, maintenanceByMonth);
  const charts = [
    efficiency &&
      section("Fuel consumption", "L/100 km by month, weighted by litres", {
        stack: [efficiency, legend([[C.accent, "Monthly"], [C.dot, "Each fill-up", true]])],
        margin: [0, 6, 0, 0],
      }),
    spend &&
      section("Spending", "By month", {
        stack: [spend, legend([[C.accent, "Fuel"], [C.maintenance, "Maintenance"]])],
        margin: [0, 6, 0, 0],
      }),
  ].filter(Boolean);

  const fillTable = fills.length
    ? {
        table: {
          headerRows: 1,
          dontBreakRows: true,
          widths: [62, 22, "*", "*", "*", "*", "*", "*"],
          body: [
            [th("Date"), th("By"), th("Litres", "right"), th("$/L", "right"), th("Cost", "right"), th("km", "right"), th("L/100 km", "right"), th("Odometer", "right")],
            ...fills.map((f) => {
              const { litres, pricePerLitre, distance } = f.entry.mileage;
              return [
                entryDate(f.entry),
                { text: nameOf(f.entry.userID), color: C.muted },
                num(fixed(litres, 3)),
                num(pricePerLitre ? `$${pricePerLitre.toFixed(3)}` : "-"),
                num(money(f.entry.value), { bold: true }),
                num(fixed(distance, 1)),
                num(fixed(f.litresPer100km, 1)),
                num(Math.round(f.odometer).toLocaleString("en-US"), { color: C.muted }),
              ];
            }),
            [
              { text: "Total", bold: true },
              "",
              num(fuel.litres.toFixed(1), { bold: true }),
              num(fuel.pricePerLitre ? `$${fuel.pricePerLitre.toFixed(3)}` : "-", { bold: true }),
              num(money(fuel.cost), { bold: true }),
              num(fuel.distance.toFixed(1), { bold: true }),
              num(fixed(fuel.litresPer100km, 1), { bold: true }),
              "",
            ],
          ],
        },
        layout: dataLayout({ footer: true }),
      }
    : empty("No fill-ups in this period.");

  const maintenanceTable = maintenance.length
    ? {
        table: {
          headerRows: 1,
          dontBreakRows: true,
          widths: [62, 22, 58, "*", 60],
          body: [
            [th("Date"), th("By"), th("Odometer", "right"), th("Note"), th("Cost", "right")],
            ...maintenance.map((e) => [
              entryDate(e),
              { text: nameOf(e.userID), color: C.muted },
              num(e.maintenance.odometer !== undefined && e.maintenance.odometer !== null ? km(e.maintenance.odometer) : "-", { color: C.muted }),
              e.title,
              num(money(e.value), { bold: true }),
            ]),
            [{ text: "Total", bold: true }, "", "", "", num(money(maintenanceCost), { bold: true })],
          ],
        },
        layout: dataLayout({ footer: true }),
      }
    : empty("No maintenance in this period.");

  // tires on the car during the period
  const periodStart = labelToDate(months[0]);
  const periodEnd = new Date(Math.min(
    new Date(labelToDate(months[months.length - 1]).getFullYear(), labelToDate(months[months.length - 1]).getMonth() + 1, 1).getTime(),
    Date.now()
  ));
  const tireRows = tiresInPeriod(log, periodStart, periodEnd);
  const tiresSection = tireRows.length
    ? section("Tires", "Sets on the car in this period", {
        stack: [
          tireTimeline(tireRows, periodStart, periodEnd),
          {
            margin: [0, 8, 0, 0],
            table: {
              headerRows: 1,
              dontBreakRows: true,
              widths: [14, "*", 54, 42, 52, 52, 56, 56],
              body: [
                [th(""), th("Tires"), th("Season"), th("Days", "right"), th("km here", "right"), th("km total", "right"), th("$/100 km", "right"), th("Cost here", "right")],
                ...tireRows.map((row) => [
                  seasonGlyph(row.tire.season),
                  { text: [tireName(row.tire), row.current ? { text: "  on the car", color: C.muted, fontSize: 7 } : row.tire.retired ? { text: "  retired", color: C.subtle, fontSize: 7 } : ""] },
                  { text: seasonName(row.tire.season), color: C.muted },
                  num(Math.round(row.days).toLocaleString("en-US")),
                  num(Math.round(row.km).toLocaleString("en-US")),
                  num(Math.round(row.tire.mileage).toLocaleString("en-US"), { color: C.muted }),
                  num(row.tire.costPer100km != null ? money(row.tire.costPer100km) : "-"),
                  num(row.tire.costPer100km != null ? money((row.tire.costPer100km * row.km) / 100) : "-", { bold: true }),
                ]),
              ],
            },
            layout: dataLayout(),
          },
          {
            text: "km here is each stint's distance in proportion to its days in the period. Cost here is that distance at the set's lifetime cost per 100 km.",
            fontSize: 7,
            color: C.muted,
            margin: [0, 5, 0, 0],
          },
        ],
        margin: [0, 6, 0, 0],
      })
    : null;

  return {
    pageSize: "LETTER",
    pageMargins: [MARGIN, MARGIN, MARGIN, MARGIN + 12],
    info: {
      title: `${vehicle.name} - ${periodLabel(months)}`,
      author: "Budgeter",
    },
    defaultStyle: { font: "Helvetica", fontSize: 8.5, color: C.text, lineHeight: 1.15 },
    styles: {
      eyebrow: { fontSize: 7.5, bold: true, color: C.accent, characterSpacing: 0.6, margin: [0, 0, 0, 4] },
      h1: { fontSize: 20, bold: true },
      h2: { fontSize: 10.5, bold: true },
      sectionSub: { fontSize: 7.5, color: C.muted, margin: [0, 2, 0, 0] },
      th: { fontSize: 6.5, bold: true, color: C.muted, characterSpacing: 0.4 },
      kpiLabel: { fontSize: 6.5, bold: true, color: C.muted, characterSpacing: 0.5 },
    },
    content: [
      ...masthead,
      ...stats,
      ...charts,
      ...(tiresSection ? [tiresSection] : []),
      section("Fill-ups", `${fills.length} in this period`, fillTable),
      section("Maintenance", `${maintenance.length} in this period`, maintenanceTable),
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
    pageBreakBefore: (node, { getFollowingNodesOnPage }) =>
      node.headlineLevel === 1 && getFollowingNodesOnPage().length < 6,
  };
}

module.exports = vehicleReportDocument;
