import React, { useState, useEffect, useRef } from "react";
import "chart.js/auto";
import { Chart } from "react-chartjs-2";
import { toCurrency } from "../../utils/helpers";

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

  let radius = 0;
  if (context.parsed.y > 0) {
    return {
      topLeft: 25,
      topRight: 25,
    };
  } else if (context.parsed.y < 0) {
    return {
      bottomLeft: 25,
      bottomRight: 25,
    };
  }
  return radius;
};

const MultiMonthBudgetOverview = ({
  budget,
  highlightMonthState,
  setHighlightMonthState,
}) => {
  const [graphDataState, setGraphDataState] = useState(null);
  const [loadingState, setLoadingState] = useState(true);
  const maxYAxis = useRef(0);

  let startIndex = 0,
    displayLength = 6;

  const createGraphData = () => {
    const labels = [];
    const datasets = [
      {
        type: "line",
        label: "Balance",
        data: new Array(displayLength).fill().map((x, i) => {
          return 0;
        }),
        borderWidth: 8,
        borderColor: "#71a9f7",
        pointHoverBackgroundColor: "rgba( 255, 255, 255, 1)",
        pointHitRadius: 5,
        pointHoverRadius: 8,
        pointHoverBorderWidth: 3,
        tension: 0.25,
      },
      {
        type: "bar",
        label: "Income",
        data: new Array(displayLength).fill().map((x, i) => {
          return 0;
        }),
        backgroundColor: "rgba(0, 128, 0, 1)",
        stack: "Stack 0",
        barThickness: 25,
        borderRadius: determineBorderRadius,
      },
      {
        type: "bar",
        label: "Expense",
        data: new Array(displayLength).fill().map((x, i) => {
          return 0;
        }),
        backgroundColor: "rgba(200, 0, 0, 1)",
        stack: "Stack 1",
        barThickness: 25,
        borderRadius: determineBorderRadius,
      },
    ];

    new Array(displayLength).fill().map((_, i) => {
      const targetMonth = budget.months.find(
        (month) => month.order === displayLength + startIndex - i - 1
      );
      labels.push(targetMonth.label);
      datasets[1].data[i] = targetMonth.incomeTotal;
      datasets[2].data[i] = targetMonth.expenseTotal;
      //   datasets[0].data[i] += targetMonth.incomeTotal;
      //   return (datasets[0].data[i] -= targetMonth.expenseTotal);
      return;
    });

    const newState = {
      labels,
      datasets,
    };

    maxYAxis.current =
      Math.ceil(
        Math.max(
          ...datasets.map((set) =>
            Math.abs(
              set.data.reduce(function (a, b) {
                return Math.max(a, b);
              }, -Infinity)
            )
          )
        ) / 500
      ) * 500;

    setGraphDataState({
      ...newState,
    });

    setLoadingState(false);
  };

  useEffect(() => {
    createGraphData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const options = {
    plugins: {
      title: {
        display: false,
      },
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: function (context) {
            const title = context[0].label + " Overview";
            return title;
          },
          label: function (context) {
            const label = [];

            const totalIncome =
                graphDataState.datasets[1].data[context.dataIndex],
              totalExpenses =
                graphDataState.datasets[2].data[context.dataIndex];

            label.push(
              `Balance:      ${toCurrency(totalIncome - totalExpenses)}`
            );
            label.push(`- Income:     ${toCurrency(totalIncome)}`);
            label.push(`- Expenses: ${toCurrency(totalExpenses)}`);

            return label;
          },
        },
      },
    },
    responsive: true,
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
        stacked: true,
        // min: -maxYAxis.current,
        // max: maxYAxis.current,
        grid: {
          display: false,
        },
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <>
      <section id="multi-month-overview">
        <h4 className="sub-container-description section-list-title noselect">
          6 Month Overview
        </h4>
        <div className="chart-full-section">
          {!loadingState && (
            <Chart
              type="bar"
              className="blanketChart"
              data={graphDataState}
              options={options}
              height={2.5}
              width={10}
            />
          )}
          <div id="multi-month-menu" className={"container-flex nowrap"}>
            {!loadingState &&
              graphDataState.labels.map((month, i) => {
                return (
                  <span
                    key={`select_month_${i}`}
                    className={`nav-button ${
                      month === highlightMonthState && "nav-button-active"
                    } noselect`}
                    onClick={() => setHighlightMonthState(month)}
                  >
                    {month}
                  </span>
                );
              })}
          </div>
        </div>
      </section>
    </>
  );
};

export default MultiMonthBudgetOverview;
