import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import "chart.js/auto";
import { Chart } from "react-chartjs-2";
import { format, startOfMonth, addMonths, subMonths } from "date-fns";
import { FiArrowLeft } from "react-icons/fi";
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
// Total km is the odometer, so a month shows its last reading.
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
];

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
  const metric = METRICS.find((m) => m.key === metricKey);

  // the months shown: the last N up to this month, or everything logged
  const { fills, months, start, end } = useMemo(() => {
    const now = startOfMonth(new Date());
    const first = allFills.length ? startOfMonth(allFills[0].date) : now;
    const rangeStart = range ? subMonths(now, range - 1) : first;
    const rangeEnd = addMonths(now, 1);
    const inRange = allFills.filter((f) => f.date >= rangeStart && f.date < rangeEnd);

    const byMonth = new Map();
    for (let m = rangeStart; m < rangeEnd; m = addMonths(m, 1)) {
      byMonth.set(monthKey(m), { start: m, fills: [] });
    }
    inRange.forEach((f) => byMonth.get(monthKey(f.date))?.fills.push(f));
    return { fills: inRange, months: [...byMonth.values()], start: rangeStart, end: rangeEnd };
  }, [allFills, range]);

  const graphData = useMemo(() => {
    const colors = getChartColors();
    const accent = colors.accent || "#4f46e5";
    // a month's point sits mid-month (end of month for readings); empty months leave a gap
    const monthly = months.map((m) => ({
      x: metric.atMonthEnd ? addMonths(m.start, 1).getTime() - DAY : m.start.getTime() + 15 * DAY,
      y: m.fills.length ? metric.month(m.fills) : null,
      count: m.fills.length,
      label: format(m.start, "MMMM yyyy"),
    }));
    const individual = fills
      .map((f) => ({ x: f.date.getTime(), y: metric.fill(f), fill: f }))
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
    return {
      datasets: [
        {
          type: "line",
          label: "Monthly",
          data: monthly,
          borderColor: accent,
          borderWidth: 2.5,
          tension: 0.3,
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
          label: "Fill-ups",
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
  }, [fills, months, metricKey, resolvedTheme]);

  const options = useMemo(() => {
    const colors = getChartColors();
    const spanMonths = months.length;
    // fewer month labels when there are many months or little room
    const tickEvery = (spanMonths > 36 ? 6 : spanMonths > 18 ? 3 : 1) * (isNarrow && spanMonths > 6 ? 2 : 1);
    // none of the measures go below zero, so don't let the padding take the axis there
    const values = fills.map(metric.fill).filter((v) => Number.isFinite(v));
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
              return raw?.fill ? format(raw.fill.date, "EEE, MMM d, yyyy") : raw?.label;
            },
            label: (item) =>
              item.raw.fill
                ? `Fill-up: ${metric.format(item.raw.y)}${
                    item.raw.compare
                      ? ` (${item.raw.compare.vsMean >= 0 ? "+" : "−"}${Math.abs(item.raw.compare.vsMean * 100).toFixed(1)}% vs average)`
                      : ""
                  }`
                : `${metric.summary}: ${metric.format(item.raw.y)} (${item.raw.count} fill-up${item.raw.count === 1 ? "" : "s"})`,
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
  }, [fills, months, metricKey, resolvedTheme, start, end, isNarrow]);

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
              Odometer {formatKm(vehicle.odometer)} · {vehicle.fillCount} fill-ups logged
            </p>
          </div>
        </div>
      </div>

      <div className="vehicle-stats">
        {[
          ["Fill-ups", fills.length.toLocaleString("en-US")],
          ["Spent", toCurrency(totalCost)],
          ["Driven", formatKm(totalKm)],
          ["Litres", `${Math.round(totalLitres).toLocaleString("en-US")} L`],
          ["Avg price", avgPrice ? `$${avgPrice.toFixed(3)}/L` : "-"],
          ["Avg consumption", avgEfficiency ? `${avgEfficiency.toFixed(1)} L/100 km` : "-"],
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
            <span className="legend-item">
              <span className="legend-dot" /> Each fill-up
            </span>
          ) : (
            <span className="legend-item">
              Fill-ups vs average
              <span className="legend-dot legend-dot-below" /> below
              <span className="legend-dot" /> near
              <span className="legend-dot legend-dot-above" /> above
            </span>
          )}
        </p>
      </section>

      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Fill-ups</h2>
          <span className="card-subtitle">{fills.length} {rangeLabel}</span>
        </div>
        {fills.length === 0 ? (
          <p className="empty-state">No fill-ups in this range.</p>
        ) : (
          <div className="table-scroll">
            <table className="fuel-table">
              <thead>
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
              </thead>
              <tbody>
                {[...fills].reverse().map((f) => (
                  <tr key={f.entry._id} onClick={() => openEntry(f.entry)} tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && openEntry(f.entry)}>
                    <td>{format(f.date, "MMM d, yyyy")}</td>
                    <td className="hide-sm"><UserAvatar user={f.entry.userID} /></td>
                    <td className="num">{f.litres != null ? f.litres.toFixed(3) : "-"}</td>
                    <td className="num">{f.pricePerLitre != null ? `$${f.pricePerLitre.toFixed(3)}` : "-"}</td>
                    <td className="num strong">{toCurrency(f.value)}</td>
                    <td className="num">{f.distance != null ? f.distance.toFixed(1) : "-"}</td>
                    <td className="num">{f.litresPer100km != null ? f.litresPer100km.toFixed(1) : "-"}</td>
                    <td className="num hide-sm muted">{Math.round(f.odometer).toLocaleString("en-US")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default VehicleLog;
