import React, { useMemo } from "react";
import "chart.js/auto";
import { Chart } from "react-chartjs-2";
import { format } from "date-fns";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import {
  toCurrency,
  monthWindow,
  monthLabelToDate,
  shiftMonthLabel,
  dateToMonthStr,
} from "../../utils/helpers";
import { getChartColors, useTheme, withAlpha, fade } from "../../utils/theme";

// Points are placed by month, not by window position: x = 0 is the current
// month, -1 last month, and so on. Moving the window only moves the x-axis
// range, so Chart.js animates every point sideways and the chart slides.
// The data runs newest first, so loading older months only appends points
// and never renumbers the ones already drawn.
const monthsAgo = (label, current) => {
  const a = monthLabelToDate(label);
  const b = monthLabelToDate(current);
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
};

// x = 1 is a placeholder past the current month so the line runs off the
// right edge; it never gets a marker
const isFuture = (ctx) => ctx.raw && ctx.raw.x > 0;

// clip to the plot sides and bottom, but let the top points overhang
const CLIP = { left: 0, right: 0, top: false, bottom: 0 };

function totalLine({ label, color, fillTarget, selectedX, surface }) {
  return {
    type: "line",
    label,
    isTotal: true,
    data: [],
    borderColor: color,
    borderWidth: 2.5,
    tension: 0.35,
    spanGaps: true,
    // the band between the total and its shared line is the individual part
    fill: { target: fillTarget },
    backgroundColor: withAlpha(color, 0.09),
    pointRadius: (ctx) =>
      isFuture(ctx) ? 0 : ctx.raw?.x === selectedX ? 5 : 3,
    pointHoverRadius: (ctx) => (isFuture(ctx) ? 0 : 6),
    pointBorderWidth: 2,
    pointBorderColor: color,
    pointBackgroundColor: (ctx) =>
      ctx.raw?.x === selectedX ? color : surface,
    clip: CLIP,
  };
}

function sharedLine({ label, color }) {
  return {
    type: "line",
    label,
    isTotal: false,
    data: [],
    borderColor: withAlpha(color, 0.85),
    borderWidth: 1.5,
    borderDash: [4, 4],
    tension: 0.35,
    spanGaps: true,
    fill: "origin",
    backgroundColor: fade(color, 0.24),
    pointRadius: 0,
    pointHoverRadius: 0,
    clip: CLIP,
  };
}

// shades the selected month's column behind the lines
const selectedMonthBand = {
  id: "selectedMonthBand",
  beforeDatasetsDraw(chart, args, options) {
    const { index, color } = options;
    const xScale = chart.scales.x;
    // index is the month's x (0 = this month, negative = earlier)
    if (index === undefined || index === null || !xScale) {
      return;
    }
    const { ctx, chartArea } = chart;
    const step = xScale.getPixelForValue(1) - xScale.getPixelForValue(0);
    const center = xScale.getPixelForValue(index);
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(
      center - step / 2 + 4,
      chartArea.top - 6,
      step - 8,
      chartArea.height + 6,
      8
    );
    ctx.fill();
    ctx.restore();
  },
};

const MultiMonthBudgetOverview = ({
  budget,
  windowEnd,
  monthCount = 6,
  highlightMonthState,
  setHighlightMonthState,
  onNavigate,
  canGoForward,
  loading,
}) => {
  const { resolvedTheme } = useTheme();

  const currentMonth = dateToMonthStr(new Date());
  const labels = useMemo(
    () => monthWindow(windowEnd, monthCount),
    [windowEnd, monthCount]
  );
  const selectedIndex = labels.indexOf(highlightMonthState);
  const selectedX = -monthsAgo(highlightMonthState, currentMonth);
  const windowEndX = -monthsAgo(windowEnd, currentMonth);
  // x of the window's first month; visible months are firstX .. windowEndX
  const firstX = windowEndX - (monthCount - 1);

  const { graphData, months, yMax, colors } = useMemo(() => {
    const colors = getChartColors();
    const byLabel = new Map(budget.months.map((m) => [m.label, m]));
    const months = labels.map((label) => byLabel.get(label));
    const common = { selectedX, surface: colors.surface };

    // dataset order matters: totals fill down to their shared line (by index)
    const incomeTotal = totalLine({ ...common, label: "Income", color: colors.income, fillTarget: 1 });
    const incomeShared = sharedLine({ label: "Shared income", color: colors.income });
    const expenseTotal = totalLine({ ...common, label: "Expenses", color: colors.expense, fillTarget: 3 });
    const expenseShared = sharedLine({ label: "Shared expenses", color: colors.expense });

    const series = [
      [incomeTotal, "incomeTotal"],
      [incomeShared, "sharedIncomeTotal"],
      [expenseTotal, "expenseTotal"],
      [expenseShared, "sharedExpenseTotal"],
    ];

    // every loaded month, newest first, plus the flat placeholder past the
    // current month
    const oldest = Math.max(
      0,
      ...budget.months.map((m) => monthsAgo(m.label, currentMonth))
    );
    const current = byLabel.get(currentMonth);

    series.forEach(([dataset, key]) => {
      const value = (month) => (month ? month[key] : null);
      dataset.data = [{ x: 1, y: value(current) }];
      for (let ago = 0; ago <= oldest; ago += 1) {
        const month = byLabel.get(shiftMonthLabel(currentMonth, -ago));
        dataset.data.push({ x: -ago, y: value(month) });
      }
    });

    // the axis tops out just above the highest value in this window
    const visibleMax = Math.max(
      0,
      ...months.filter(Boolean).flatMap((m) => [m.incomeTotal, m.expenseTotal])
    );

    return {
      graphData: { datasets: series.map(([dataset]) => dataset) },
      months,
      yMax: visibleMax > 0 ? visibleMax * 1.08 : 1,
      colors,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labels, budget.months, resolvedTheme, selectedX, currentMonth]);

  // the month at an x position, if it's inside the window and loaded
  const monthAt = (x) =>
    x >= firstX && x <= windowEndX ? months[x - firstX] : null;
  const labelAt = (x) => labels[x - firstX];

  const options = {
    interaction: { mode: "index", intersect: false },
    onClick: (event, elements, chart) => {
      const [element] = chart.getElementsAtEventForMode(
        event.native ?? event,
        "index",
        { intersect: false },
        false
      );
      const x = element && chart.data.datasets[0].data[element.index]?.x;
      if (monthAt(x)) {
        setHighlightMonthState(labelAt(x));
      }
    },
    onHover: (event, elements, chart) => {
      const x = elements[0] && chart.data.datasets[0].data[elements[0].index]?.x;
      event.native.target.style.cursor = monthAt(x) ? "pointer" : "default";
    },
    // fixed padding (no auto padding for points) keeps the plot exactly as
    // wide as the month buttons
    layout: { autoPadding: false, padding: { top: 12, bottom: 6, left: 0, right: 0 } },
    plugins: {
      title: { display: false },
      legend: { display: false },
      selectedMonthBand: {
        index: selectedIndex >= 0 ? selectedX : undefined,
        color: withAlpha(colors.accent, resolvedTheme === "dark" ? 0.16 : 0.08),
      },
      tooltip: {
        padding: 10,
        cornerRadius: 8,
        boxPadding: 4,
        usePointStyle: true,
        bodySpacing: 2,
        bodyFont: { family: "Inter, system-ui, sans-serif", size: 12 },
        titleFont: { family: "Inter, system-ui, sans-serif", size: 12, weight: "600" },
        footerFont: { family: "Inter, system-ui, sans-serif", size: 12, weight: "600" },
        // one entry per total, and only for months inside the window
        filter: (item) => item.dataset.isTotal && !!monthAt(item.raw?.x),
        callbacks: {
          title: (items) => {
            const x = items[0]?.raw?.x;
            return monthAt(x) ? format(monthLabelToDate(labelAt(x)), "MMMM yyyy") : "";
          },
          label: (item) => {
            const month = monthAt(item.raw.x);
            return item.datasetIndex === 0
              ? `Income ${toCurrency(month.incomeTotal)}`
              : `Expenses ${toCurrency(month.expenseTotal)}`;
          },
          afterLabel: (item) => {
            const month = monthAt(item.raw.x);
            const [total, shared] =
              item.datasetIndex === 0
                ? [month.incomeTotal, month.sharedIncomeTotal]
                : [month.expenseTotal, month.sharedExpenseTotal];
            return `   shared ${toCurrency(shared)} · individual ${toCurrency(total - shared)}`;
          },
          footer: (items) => {
            const month = items[0] && monthAt(items[0].raw.x);
            return month
              ? `Balance ${toCurrency(month.incomeTotal - month.expenseTotal)}`
              : "";
          },
        },
      },
    },
    responsive: true,
    animation: { duration: 420, easing: "easeInOutCubic" },
    scales: {
      x: {
        type: "linear",
        display: false,
        // each month owns an equal column centred on its x, above its
        // month button
        min: firstX - 0.5,
        max: windowEndX + 0.5,
      },
      y: {
        min: 0,
        max: yMax,
        border: { display: false },
        grid: {
          color: withAlpha(colors.muted, resolvedTheme === "dark" ? 0.18 : 0.14),
          drawTicks: false,
        },
        ticks: { display: false, maxTicksLimit: 5 },
        // gridlines only: take no width, so the columns line up with the
        // month buttons below
        afterFit: (scale) => {
          scale.width = 0;
        },
      },
    },
    maintainAspectRatio: false,
  };

  const rangeLabel = `${format(monthLabelToDate(labels[0]), "MMM yyyy")} – ${format(
    monthLabelToDate(labels[labels.length - 1]),
    "MMM yyyy"
  )}`;

  return (
    <section id="multi-month-overview" className="card">
      <div className="card-header chart-header">
        <button
          type="button"
          className="icon-button icon-button-sm"
          onClick={() => onNavigate(-1)}
          aria-label="Previous month"
          title="Previous month"
        >
          <FiChevronLeft />
        </button>
        <div className="chart-header-title">
          <h2 className="card-title noselect">{monthCount} month overview</h2>
          <span className="chart-range noselect">
            {rangeLabel}
            {loading && (
              <span className="spinner spinner-sm" aria-label="Loading months" />
            )}
          </span>
        </div>
        <div className="chart-legend noselect" aria-hidden="true">
          <span className="legend-item">
            <span className="legend-swatch legend-income" /> Income
          </span>
          <span className="legend-item">
            <span className="legend-swatch legend-expense" /> Expenses
          </span>
          <span className="legend-item">
            <span className="legend-swatch legend-shared" /> Shared
          </span>
        </div>
        <button
          type="button"
          className="icon-button icon-button-sm"
          onClick={() => onNavigate(1)}
          disabled={!canGoForward}
          aria-label="Next month"
          title="Next month"
        >
          <FiChevronRight />
        </button>
      </div>
      <div className="chart-full-section">
        <div className="chart-canvas">
          <Chart
            type="line"
            className="blanketChart"
            data={graphData}
            options={options}
            plugins={[selectedMonthBand]}
          />
        </div>
        <div id="multi-month-menu" className="month-picker">
          {labels.map((month) => {
            const [m, y] = month.split("/");
            const isLoaded = budget.months.some((x) => x.label === month);
            return (
              <button
                type="button"
                key={`select_month_${month}`}
                className={`month-chip${
                  month === highlightMonthState ? " month-chip-active" : ""
                } noselect`}
                aria-pressed={month === highlightMonthState}
                disabled={!isLoaded}
                onClick={() => setHighlightMonthState(month)}
              >
                <span className="month-chip-name">
                  {format(new Date(2000, Number(m) - 1, 1), "MMM")}
                </span>
                <span className="month-chip-year">'{y}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default MultiMonthBudgetOverview;
