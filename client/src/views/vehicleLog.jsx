import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import "chart.js/auto";
import { Chart } from "react-chartjs-2";
import { format, startOfMonth, addMonths, subMonths } from "date-fns";
import { FiArrowLeft, FiChevronDown, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { VEHICLE_LOG } from "../utils/queries";
import { toCurrency } from "../utils/helpers";
import { getChartColors, useTheme, withAlpha, fade } from "../utils/theme";
import useMediaQuery from "../utils/useMediaQuery";
import { SpinLoader } from "../components/Loaders";
import { InlineError } from "../components/Notifications";
import { UserAvatar } from "../components/Layout/EntryRow";
import { VehicleSwatch, formatKm } from "./vehicleSettings";

const DAY = 24 * 60 * 60 * 1000;

// Each metric says how a month is summarised: sums add up, rates are
// weighted (a month's $/L is what was paid / litres bought, and its L/100 km
// is litres / km driven), so a big fill-up counts for more than a top-up.
// Total km is the odometer, so a month shows its last reading. Maintenance
// charts the maintenance records rather than fill-ups.
const METRICS = [
  {
    key: "efficiency",
    label: "L/100 km",
    short: "L/100 km",
    fill: (f) => f.litresPer100km,
    month: (fills) => ratio(fills, (f) => f.litres * 100, (f) => f.distance, (f) => f.litres && f.distance),
    format: (v) => `${v.toFixed(1)} L/100 km`,
    axis: (v) => v.toFixed(1),
    summary: "Monthly average",
  },
  {
    key: "price",
    label: "Price per litre",
    short: "$/L",
    fill: (f) => f.pricePerLitre,
    month: (fills) => ratio(fills, (f) => f.pricePerLitre * f.litres, (f) => f.litres, (f) => f.pricePerLitre && f.litres),
    format: (v) => `$${v.toFixed(3)}`,
    axis: (v) => `$${v.toFixed(2)}`,
    summary: "Monthly average",
  },
  {
    key: "cost",
    label: "Fill cost",
    short: "Cost",
    fill: (f) => f.value,
    month: (fills) => sum(fills, (f) => f.value),
    format: (v) => toCurrency(v),
    axis: (v) => `$${Math.round(v)}`,
    summary: "Monthly total",
  },
  {
    key: "distance",
    label: "Km driven",
    short: "km",
    fill: (f) => f.distance,
    month: (fills) => sum(fills, (f) => f.distance),
    format: (v) => formatKm(v),
    axis: (v) => `${Math.round(v).toLocaleString("en-US")}`,
    summary: "Monthly total",
  },
  {
    key: "litres",
    label: "Litres filled",
    short: "L",
    fill: (f) => f.litres,
    month: (fills) => sum(fills, (f) => f.litres),
    format: (v) => `${v.toFixed(1)} L`,
    axis: (v) => `${Math.round(v)}`,
    summary: "Monthly total",
  },
  {
    key: "odometer",
    label: "Total km",
    fill: (f) => f.odometer,
    month: (fills) => (fills.length ? fills[fills.length - 1].odometer : null),
    format: (v) => formatKm(v),
    axis: (v) => (v ? `${Math.round(v / 1000).toLocaleString("en-US")}k` : "0"),
    summary: "End of month",
    atMonthEnd: true,
    noCompare: true,
  },
  {
    key: "maintenance",
    label: "Maintenance",
    source: "services",
    fill: (s) => s.value,
    month: (services) => sum(services, (s) => s.value),
    format: (v) => toCurrency(v),
    axis: (v) => `$${Math.round(v).toLocaleString("en-US")}`,
    summary: "Monthly total",
    // a month with no work cost nothing, rather than leaving a gap
    emptyAsZero: true,
  },
];

const RECORD = { fills: ["fill-up", "fill-ups"], services: ["record", "records"] };
const records = (metric, count) => `${count} ${RECORD[metric.source || "fills"][count === 1 ? 0 : 1]}`

const RANGES = [
  { key: 12, label: "12 months" },
  { key: 24, label: "24 months" },
  { key: 0, label: "All" },
];

function sum(fills, value) {
  const values = fills.map(value).filter((v) => Number.isFinite(v));
  return values.length ? values.reduce((a, b) => a + b, 0) : null;
}

function ratio(fills, numerator, denominator, usable) {
  const used = fills.filter(usable);
  const bottom = used.reduce((a, f) => a + denominator(f), 0);
  return bottom > 0 ? used.reduce((a, f) => a + numerator(f), 0) / bottom : null;
}

const monthKey = (date) => format(date, "yyyy-MM");

// How far each fill-up sits from the window's average, in standard
// deviations: within half of one reads as average (grey); further out fades
// up towards red above and green below, at full strength by 2.
function compareToAverage(values) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sd = Math.sqrt(values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length);
  return (v) => {
    const z = sd ? (v - mean) / sd : 0;
    const strength = Math.min(1, Math.max(0, (Math.abs(z) - 0.5) / 1.5));
    return { z, strength, vsMean: mean ? (v - mean) / mean : 0 };
  };
}

// maintenance records, with the reading and cost
function toServices(data) {
  return (data?.vehicleLog?.maintenance || []).map((entry) => ({
    entry,
    date: new Date(entry.effectiveDate),
    value: entry.value,
    odometer: entry.maintenance.odometer,
  }));
}

// a dot's radius for a maintenance cost, by area so big jobs stand out
// without dwarfing everything else
function serviceRadius(value, max) {
  return max > 0 ? 4 + 10 * Math.sqrt(Math.max(0, value) / max) : 4;
}

// flatten the API shape into one record per fill-up
function toFills(data) {
  return (data?.vehicleLog?.fills || []).map((fill) => ({
    entry: fill.entry,
    date: new Date(fill.entry.effectiveDate),
    value: fill.entry.value,
    odometer: fill.odometer,
    litresPer100km: fill.litresPer100km,
    pricePerLitre: fill.entry.mileage.pricePerLitre,
    litres: fill.entry.mileage.litres,
    distance: fill.entry.mileage.distance,
  }));
}

const PAGE_SIZE = 10;

function RecordTable({ title, subtitle, empty, rows, head, cells, onOpen }) {
  const [open, setOpen] = useState(true);
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const shown = rows.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  return (
    <section className={`card record-table${open ? "" : " record-table-closed"}`}>
      <div className="card-header">
        <button
          type="button"
          className="record-table-toggle"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          <FiChevronDown className="record-table-chevron" aria-hidden="true" />
          <h2 className="card-title">{title}</h2>
          <span className="card-subtitle">{subtitle}</span>
        </button>
        {open && rows.length > 0 && (
          <div className="pager">
            <span className="pager-label noselect">
              {current + 1} / {pageCount}
            </span>
            <button
              type="button"
              className="icon-button icon-button-sm"
              onClick={() => setPage(current - 1)}
              disabled={current === 0}
              aria-label={`Newer ${title.toLowerCase()}`}
            >
              <FiChevronLeft />
            </button>
            <button
              type="button"
              className="icon-button icon-button-sm"
              onClick={() => setPage(current + 1)}
              disabled={current >= pageCount - 1}
              aria-label={`Older ${title.toLowerCase()}`}
            >
              <FiChevronRight />
            </button>
          </div>
        )}
      </div>
      {open &&
        (rows.length === 0 ? (
          <p className="empty-state">{empty}</p>
        ) : (
          <div className="table-scroll">
            <table className="fuel-table">
              <thead>{head}</thead>
              <tbody>
                {shown.map((row) => (
                  <tr
                    key={row.entry._id}
                    onClick={() => onOpen(row)}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && onOpen(row)}
                  >
                    {cells(row)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </section>
  );
}

const BACK_LABELS = {
  dashboard: "Overview",
  settings: "Settings",
  categories: "Categories",
  reports: "Reports",
};

const VehicleLog = ({ budgetID, vehicleID, backTo, onBack, setEditingModal, setEditingTransaction }) => {
  const { resolvedTheme } = useTheme();
  const [metricKey, setMetricKey] = useState("efficiency");
  const [range, setRange] = useState(12);
  const isNarrow = useMediaQuery("(max-width: 640px)");

  const { data, loading, error } = useQuery(VEHICLE_LOG, {
    variables: { budgetID, vehicleID },
    fetchPolicy: "network-only",
  });

  // opened from further down the settings page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const vehicle = data?.vehicleLog?.vehicle;
  const allFills = useMemo(() => toFills(data), [data]);
  const allServices = useMemo(() => toServices(data), [data]);
  const metric = METRICS.find((m) => m.key === metricKey);

  // the months shown: the last N up to this month, or everything logged
  const { fills, services, months, start, end } = useMemo(() => {
    const now = startOfMonth(new Date());
    const firstDates = [allFills[0]?.date, allServices[0]?.date].filter(Boolean);
    const first = firstDates.length ? startOfMonth(new Date(Math.min(...firstDates))) : now;
    const rangeStart = range ? subMonths(now, range - 1) : first;
    const rangeEnd = addMonths(now, 1);
    const within = (item) => item.date >= rangeStart && item.date < rangeEnd;
    const fillsInRange = allFills.filter(within);
    const servicesInRange = allServices.filter(within);

    const byMonth = new Map();
    for (let m = rangeStart; m < rangeEnd; m = addMonths(m, 1)) {
      byMonth.set(monthKey(m), { start: m, fills: [], services: [] });
    }
    fillsInRange.forEach((f) => byMonth.get(monthKey(f.date))?.fills.push(f));
    servicesInRange.forEach((s) => byMonth.get(monthKey(s.date))?.services.push(s));
    return {
      fills: fillsInRange,
      services: servicesInRange,
      months: [...byMonth.values()],
      start: rangeStart,
      end: rangeEnd,
    };
  }, [allFills, allServices, range]);
  // what the chosen measure is drawn from
  const source = metric.source === "services" ? services : fills;

  const graphData = useMemo(() => {
    const colors = getChartColors();
    const accent = colors.accent || "#4f46e5";
    // a month's point sits mid-month (end of month for readings); empty months leave a gap
    const monthly = months.map((m) => {
      const items = m[metric.source || "fills"];
      return {
        x: metric.atMonthEnd ? addMonths(m.start, 1).getTime() - DAY : m.start.getTime() + 15 * DAY,
        y: items.length ? metric.month(items) : metric.emptyAsZero ? 0 : null,
        count: items.length,
        label: format(m.start, "MMMM yyyy"),
      };
    });
    const individual = source
      .map((item) => ({ x: item.date.getTime(), y: metric.fill(item), fill: item }))
      .filter((p) => Number.isFinite(p.y));
    const compare = !metric.noCompare && individual.length > 1 && compareToAverage(individual.map((p) => p.y));
    const dotColor = (p) => {
      if (!compare) {
        return withAlpha(colors.muted, 0.33);
      }
      p.compare = compare(p.y);
      const { z, strength } = p.compare;
      if (!strength) {
        return withAlpha(colors.muted, 0.33);
      }
      // above average stands out more than below
      return z > 0
        ? withAlpha(colors.expense, 0.4 + 0.5 * strength)
        : withAlpha(colors.income, 0.35 + 0.35 * strength);
    };
    const dotColors = individual.map(dotColor);

    // on Total km, maintenance sits on the odometer line, sized by cost
    const odometerServices =
      metric.key === "odometer"
        ? services
            .filter((s) => Number.isFinite(s.odometer))
            .map((s) => ({ x: s.date.getTime(), y: s.odometer, service: s }))
        : [];
    const maxCost = Math.max(0, ...odometerServices.map((p) => p.service.value));
    const amber = colors.transfer || "#d97706";

    return {
      datasets: [
        ...(odometerServices.length
          ? [
              {
                type: "scatter",
                label: "Maintenance",
                data: odometerServices,
                backgroundColor: withAlpha(amber, 0.35),
                borderColor: withAlpha(amber, 0.9),
                borderWidth: 1.5,
                pointRadius: odometerServices.map((p) => serviceRadius(p.service.value, maxCost)),
                pointHoverRadius: odometerServices.map((p) => serviceRadius(p.service.value, maxCost) + 2),
                order: 0,
              },
            ]
          : []),
        {
          type: "line",
          label: "Monthly",
          data: monthly,
          borderColor: accent,
          borderWidth: 2.5,
          tension: 0.3,
          // smooth, but never curving past a point (e.g. below zero between empty months)
          cubicInterpolationMode: "monotone",
          spanGaps: true,
          fill: "start",
          backgroundColor: fade(accent, 0.22),
          pointRadius: months.length > 24 ? 2 : 3.5,
          pointHoverRadius: 6,
          pointBackgroundColor: colors.surface,
          pointBorderWidth: months.length > 24 ? 1.5 : 2,
          order: 1,
        },
        {
          type: "scatter",
          label: metric.source === "services" ? "Maintenance" : "Fill-ups",
          data: individual,
          backgroundColor: dotColors,
          borderColor: "transparent",
          pointRadius: 3.5,
          pointHoverRadius: 5.5,
          order: 2,
        },
      ],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fills, services, months, metricKey, resolvedTheme]);

  const options = useMemo(() => {
    const colors = getChartColors();
    const spanMonths = months.length;
    // fewer month labels when there are many months or little room
    const tickEvery = (spanMonths > 36 ? 6 : spanMonths > 18 ? 3 : 1) * (isNarrow && spanMonths > 6 ? 2 : 1);
    // none of the measures go below zero, so don't let the padding take the axis there
    const values = source.map(metric.fill).filter((v) => Number.isFinite(v));
    const low = Math.min(...values);
    const high = Math.max(...values);
    const floorAtZero = values.length > 0 && low - (high - low) * 0.08 < 0;
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 300 },
      interaction: { mode: "nearest", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          padding: 10,
          cornerRadius: 8,
          bodyFont: { family: "Inter, system-ui, sans-serif", size: 12 },
          titleFont: { family: "Inter, system-ui, sans-serif", size: 12, weight: "600" },
          callbacks: {
            title: (items) => {
              const raw = items[0]?.raw;
              const dated = raw?.fill || raw?.service;
              return dated ? format(dated.date, "EEE, MMM d, yyyy") : raw?.label;
            },
            label: (item) =>
              item.raw.service
                ? [
                    `Maintenance: ${toCurrency(item.raw.service.value)} at ${formatKm(item.raw.y)}`,
                    item.raw.service.entry.title,
                  ]
                : item.raw.fill
                ? `${metric.source === "services" ? "Maintenance" : "Fill-up"}: ${metric.format(item.raw.y)}${
                    item.raw.compare
                      ? ` (${item.raw.compare.vsMean >= 0 ? "+" : "−"}${Math.abs(item.raw.compare.vsMean * 100).toFixed(1)}% vs average)`
                      : ""
                  }`
                : `${metric.summary}: ${metric.format(item.raw.y)} (${records(metric, item.raw.count)})`,
          },
        },
      },
      scales: {
        x: {
          type: "linear",
          min: start.getTime(),
          max: end.getTime(),
          grid: { display: false },
          border: { display: false },
          // a tick at the start of every month (or every few, for long ranges)
          afterBuildTicks: (scale) => {
            const ticks = [];
            let i = 0;
            for (let m = start; m < end; m = addMonths(m, 1), i += 1) {
              if (i % tickEvery === 0) {
                ticks.push({ value: m.getTime() });
              }
            }
            scale.ticks = ticks;
          },
          ticks: {
            color: colors.muted,
            font: { size: 11 },
            maxRotation: 0,
            autoSkip: false,
            callback: (value) => {
              const d = new Date(value);
              return d.getMonth() === 0 || tickEvery >= 6 ? format(d, "MMM yy") : format(d, "MMM");
            },
          },
        },
        y: {
          grace: "8%",
          min: floorAtZero ? 0 : undefined,
          border: { display: false },
          grid: { color: `${colors.muted}22` },
          ticks: { color: colors.muted, font: { size: 11 }, maxTicksLimit: 5, callback: metric.axis },
        },
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fills, services, months, metricKey, resolvedTheme, start, end, isNarrow]);

  if (loading) {
    return <SpinLoader />;
  }
  if (error) {
    return <InlineError text={error.message} />;
  }

  const totalCost = sum(fills, (f) => f.value) || 0;
  const totalKm = sum(fills, (f) => f.distance) || 0;
  const totalLitres = sum(fills, (f) => f.litres) || 0;
  const metricByKey = (key) => METRICS.find((m) => m.key === key);
  const avgPrice = metricByKey("price").month(fills);
  const avgEfficiency = metricByKey("efficiency").month(fills);
  const maintenanceCost = sum(services, (s) => s.value) || 0;
  const rangeLabel = range ? `in the last ${range} months` : "in total";

  const openEntry = (entry) => {
    setEditingTransaction(entry);
    setEditingModal(true);
  };

  return (
    <div className="vehicle-page">
      <div className="vehicle-page-head">
        <button type="button" className="btn btn-secondary btn-sm" onClick={onBack}>
          <FiArrowLeft /> {BACK_LABELS[backTo] || "Back"}
        </button>
        <div className="vehicle-page-title">
          <VehicleSwatch color={vehicle.color} />
          <div>
            <h1 className="title-text">{vehicle.name}</h1>
            <p className="title-subtitle">
              {[vehicle.color, vehicle.plate].filter(Boolean).join(" · ")}
              {vehicle.color || vehicle.plate ? " · " : ""}
              Odometer {formatKm(vehicle.odometer)} · {vehicle.fillCount} fill-ups ·{" "}
              {vehicle.maintenanceCount} maintenance records
            </p>
          </div>
        </div>
      </div>

      <div className="vehicle-stats">
        {[
          ["Fill-ups", fills.length.toLocaleString("en-US")],
          ["Fuel spent", toCurrency(totalCost)],
          ["Driven", formatKm(totalKm)],
          ["Litres", `${Math.round(totalLitres).toLocaleString("en-US")} L`],
          ["Avg price", avgPrice ? `$${avgPrice.toFixed(3)}/L` : "-"],
          ["Avg consumption", avgEfficiency ? `${avgEfficiency.toFixed(1)} L/100 km` : "-"],
          ["Maintenance", toCurrency(maintenanceCost)],
          ["Total cost", toCurrency(totalCost + maintenanceCost)],
        ].map(([label, value]) => (
          <div key={label} className="vehicle-stat">
            <span className="vehicle-stat-label">{label}</span>
            <span className="vehicle-stat-value">{value}</span>
          </div>
        ))}
      </div>

      <section className="card">
        <div className="card-header vehicle-chart-head">
          <div className="segmented segmented-scroll" role="radiogroup" aria-label="Measure">
            {METRICS.map((m) => (
              <button
                key={m.key}
                type="button"
                role="radio"
                aria-checked={metricKey === m.key}
                className={`segmented-option${metricKey === m.key ? " segmented-active" : ""}`}
                onClick={() => setMetricKey(m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="segmented" role="radiogroup" aria-label="Range">
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                role="radio"
                aria-checked={range === r.key}
                className={`segmented-option${range === r.key ? " segmented-active" : ""}`}
                onClick={() => setRange(r.key)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div className="vehicle-chart">
          <Chart type="line" data={graphData} options={options} />
        </div>
        <p className="vehicle-chart-legend">
          <span className="legend-item">
            <span className="legend-swatch legend-accent" /> {metric.summary}
          </span>
          {metric.noCompare ? (
            <>
              <span className="legend-item">
                <span className="legend-dot" /> Each fill-up
              </span>
              {metric.key === "odometer" && services.length > 0 && (
                <span className="legend-item">
                  <span className="legend-dot legend-dot-service" /> Maintenance, sized by cost
                </span>
              )}
            </>
          ) : (
            <span className="legend-item">
              {metric.source === "services" ? "Records" : "Fill-ups"} vs average
              <span className="legend-dot legend-dot-below" /> below
              <span className="legend-dot" /> near
              <span className="legend-dot legend-dot-above" /> above
            </span>
          )}
        </p>
      </section>

      <RecordTable
        title="Fill-ups"
        subtitle={`${fills.length} ${rangeLabel}`}
        empty="No fill-ups in this range."
        rows={[...fills].reverse()}
        onOpen={(f) => openEntry(f.entry)}
        head={
          <tr>
            <th>Date</th>
            <th className="hide-sm">By</th>
            <th className="num">Litres</th>
            <th className="num">$/L</th>
            <th className="num">Cost</th>
            <th className="num">km</th>
            <th className="num">L/100 km</th>
            <th className="num hide-sm">Odometer</th>
          </tr>
        }
        cells={(f) => (
          <>
            <td>{format(f.date, "MMM d, yyyy")}</td>
            <td className="hide-sm"><UserAvatar user={f.entry.userID} /></td>
            <td className="num">{f.litres != null ? f.litres.toFixed(3) : "-"}</td>
            <td className="num">{f.pricePerLitre != null ? `$${f.pricePerLitre.toFixed(3)}` : "-"}</td>
            <td className="num strong">{toCurrency(f.value)}</td>
            <td className="num">{f.distance != null ? f.distance.toFixed(1) : "-"}</td>
            <td className="num">{f.litresPer100km != null ? f.litresPer100km.toFixed(1) : "-"}</td>
            <td className="num hide-sm muted">{Math.round(f.odometer).toLocaleString("en-US")}</td>
          </>
        )}
      />

      <RecordTable
        title="Maintenance"
        subtitle={`${services.length} ${rangeLabel} · ${toCurrency(maintenanceCost)}`}
        empty="No maintenance in this range."
        rows={[...services].reverse()}
        onOpen={(s) => openEntry(s.entry)}
        head={
          <tr>
            <th>Date</th>
            <th className="hide-sm">By</th>
            <th className="num">Odometer</th>
            <th className="wide">Note</th>
            <th className="num">Cost</th>
          </tr>
        }
        cells={(s) => (
          <>
            <td>{format(s.date, "MMM d, yyyy")}</td>
            <td className="hide-sm"><UserAvatar user={s.entry.userID} /></td>
            <td className="num muted">
              {Number.isFinite(s.odometer) ? Math.round(s.odometer).toLocaleString("en-US") : "-"}
            </td>
            <td className="wide note">{s.entry.title}</td>
            <td className="num strong">{toCurrency(s.value)}</td>
          </>
        )}
      />
    </div>
  );
};

export default VehicleLog;
