import React, { useMemo } from "react";
import "chart.js/auto";
import { Chart } from "react-chartjs-2";
import { format } from "date-fns";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import {
  toCurrency,
  fixRounding,
  monthWindow,
  monthLabelToDate,
} from "../../utils/helpers";
import { getChartColors, useTheme } from "../../utils/theme";

const determineBorderRadius = (context) => {
  const numDatasets = context.chart.data.datasets.length;
  let showBorder = false;

  if (context.datasetIndex === numDatasets - 1) {
    showBorder = true;
  } else if (context.parsed.y !== 0) {
    const sign = Math.sign(context.parsed.y);
    let matches = false;

    for (let i = context.datasetIndex + 1; i < numDatasets; i++) {
      const val = context.parsed._stacks.y[i];
      if (val && Math.sign(val) === sign) {
        matches = true;
        break;
      }
    }

    showBorder = !matches;
  }

  if (!showBorder) {
    return 0;
  }

  if (context.parsed.y > 0) {
    return {
      topLeft: 25 / 3.5,
      topRight: 25 / 3.5,
    };
  } else if (context.parsed.y < 0) {
    return {
      bottomLeft: 25 / 3.5,
      bottomRight: 25 / 3.5,
    };
  }
  return 0;
};

const bar = (label, stack, backgroundColor) => ({
  type: "bar",
  label,
  data: [],
  backgroundColor,
  borderWidth: 0,
  stack,
  barThickness: 25,
  borderRadius: determineBorderRadius,
});

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

  const labels = useMemo(
    () => monthWindow(windowEnd, monthCount),
    [windowEnd, monthCount]
  );

  const graphData = useMemo(() => {
    const colors = getChartColors();
    const datasets = [
      bar("Income", "Stack 0", colors.incomeSoft),
      bar("Expense", "Stack 1", colors.expenseSoft),
      bar("Income Shared", "Stack 0", colors.income),
      bar("Expense Shared", "Stack 1", colors.expense),
    ];

    // months still loading show as empty bars until they arrive
    labels.forEach((label, i) => {
      const month = budget.months.find((m) => m.label === label);
      datasets[0].data[i] = month
        ? month.incomeTotal - month.sharedIncomeTotal
        : 0;
      datasets[1].data[i] = month
        ? month.expenseTotal - month.sharedExpenseTotal
        : 0;
      datasets[2].data[i] = month ? month.sharedIncomeTotal : 0;
      datasets[3].data[i] = month ? month.sharedExpenseTotal : 0;
    });

    return { labels, datasets };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labels, budget.months, resolvedTheme]);

  const options = {
    onClick: (event, elements) => {
      if (elements.length) {
        setHighlightMonthState(labels[elements[0].index]);
      }
    },
    onHover: (event, elements) => {
      event.native.target.style.cursor = elements.length ? "pointer" : "default";
    },
    plugins: {
      title: {
        display: false,
      },
      legend: {
        display: false,
      },
      tooltip: {
        padding: 10,
        cornerRadius: 8,
        bodyFont: { family: "Inter, system-ui, sans-serif" },
        titleFont: { family: "Inter, system-ui, sans-serif" },
        callbacks: {
          title: function (context) {
            return format(monthLabelToDate(context[0].label), "MMMM yyyy");
          },
          label: function (context) {
            const label = [];

            const sharedIncome = graphData.datasets[2].data[context.dataIndex],
              sharedExpense = graphData.datasets[3].data[context.dataIndex],
              totalIncome =
                graphData.datasets[0].data[context.dataIndex] + sharedIncome,
              totalExpenses =
                graphData.datasets[1].data[context.dataIndex] + sharedExpense;

            label.push(
              `Balance:      ${toCurrency(totalIncome - totalExpenses)}`
            );
            label.push(
              `- Income:     ${toCurrency(totalIncome)} ( ${fixRounding(
                (sharedIncome / totalIncome) * 100,
                1
              )}% Shared)`
            );
            label.push(
              `- Expenses: ${toCurrency(totalExpenses)} ( ${fixRounding(
                (sharedExpense / totalExpenses) * 100,
                1
              )}% Shared)`
            );

            return label;
          },
        },
      },
    },
    responsive: true,
    animation: { duration: 250 },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
        stacked: true,
        min: 0,
        grid: {
          display: false,
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
        <Chart
          type="bar"
          className="blanketChart"
          data={graphData}
          options={options}
          height={2.5}
          width={10}
        />
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
