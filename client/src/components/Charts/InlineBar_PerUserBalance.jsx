import React, { useEffect, useState } from "react";
import { toCurrency } from "../../utils/helpers";
import { Bar } from "react-chartjs-2";

const InlineBarPerUserBalance = ({ inputData, title }) => {
  const [dataStateCurrent, setDataStateCurrent] = useState(false);
  const [dataStateAfter, setDataStateAfter] = useState(false);
  const [loadingState, setLoadingState] = useState(true);

  function processData() {
    setLoadingState(true);

    const current = {
        labels: [title],
        datasets: [
          {
            label: "Income",
            data: [],
            backgroundColor: `rgba(0, 128, 0, 1)`,
            barPercentage: 1.0,
            categoryPercentage: 1.0,
          },
          {
            label: "Expenses",
            data: [],
            backgroundColor: `rgba(200, 0, 0, 1)`,
            barPercentage: 1.0,
            categoryPercentage: 1.0,
          },
        ],
        totalProp: 0,
        compositeTitle: "",
        userData: {
          userColor: inputData.userID.userColor,
          userInitials: inputData.userID.userInitials,
        },
        balance: 0,
        remainder: 0,
      },
      after = {
        labels: [title],
        datasets: [
          {
            label: "Income",
            data: [],
            backgroundColor: `rgba(0, 128, 0, 1)`,
            barPercentage: 1.0,
            categoryPercentage: 1.0,
          },
          {
            label: "Expenses",
            data: [],
            backgroundColor: `rgba(200, 0, 0, 1)`,
            barPercentage: 1.0,
            categoryPercentage: 1.0,
          },
        ],
        compositeTitle: "",
        userData: {
          userColor: inputData.userID.userColor,
          userInitials: inputData.userID.userInitials,
        },
        balance: 0,
        remainder: 0,
      };

    const dataBalanceCurrent =
      (Math.abs(inputData.currentPersonalBalance) / inputData.incomeTotal / 2) *
        (inputData.currentPersonalBalance < 0 ? -1 : 1) +
      0.5;
    current.datasets[0].data.push(dataBalanceCurrent * 1 * 100);
    current.datasets[1].data.push((1 - dataBalanceCurrent * 1) * 100);
    current.balance =
      (Math.abs(inputData.currentPersonalBalance) / inputData.incomeTotal) *
      (inputData.currentPersonalBalance < 0 ? -1 : 1);
    current.remainder = inputData.currentPersonalBalance;

    const dataBalanceAfter =
      (Math.abs(inputData.finalPersonalBalance) / inputData.incomeTotal / 2) *
        (inputData.finalPersonalBalance < 0 ? -1 : 1) +
      0.5;
    after.datasets[0].data.push(dataBalanceAfter * 1 * 100);
    after.datasets[1].data.push((1 - dataBalanceAfter * 1) * 100);
    after.balance =
      (Math.abs(inputData.finalPersonalBalance) / inputData.incomeTotal) *
      (inputData.finalPersonalBalance < 0 ? -1 : 1);
    after.remainder = inputData.finalPersonalBalance;

    setDataStateCurrent(current);
    setDataStateAfter(after);
    setLoadingState(false);
  }

  const options = {
    indexAxis: "y",
    responsive: true,
    layout: {
      padding: {
        left: -10,
        bottom: -10,
      },
    },
    animation: {
      duration: 0,
    },
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        stacked: true,
        ticks: {
          display: false,
        },
        grid: {
          drawBorder: false,
          display: false,
        },
      },
      x: {
        reverse: false,
        position: "left",
        stacked: true,
        ticks: {
          display: false,
          drawBorder: false,
        },
        grid: {
          display: false,
          drawBorder: false,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
        labels: {
          font: {
            size: 9,
          },
        },
      },
      tooltip: {
        mode: "x",
        intersect: false,
        backgroundColor: "rgba(0,0,0,0)",
        callbacks: {
          footer: function () {
            return false;
          },
          title: function () {
            return false;
          },
          label: function () {
            return false;
          },
        },
      },
    },
  };

  useEffect(() => {
    processData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {!loadingState && dataStateCurrent ? (
        <div className="container-flex f-full f-j-l margin-top-full f-valign">
          <span>{dataStateCurrent.compositeTitle}</span>
          {dataStateCurrent.userData ? (
            <>
              <span
                className="f0 initials-icon noselect"
                style={{
                  backgroundColor: dataStateCurrent.userData.userColor
                    ? `#${dataStateCurrent.userData.userColor}`
                    : "#BBBBBB",
                }}
              >
                {dataStateCurrent.userData.userInitials}
              </span>
              <span className="margin-left-full">
                {(dataStateAfter.balance * 100).toFixed(1)}% Income / Expenses
              </span>
              <span className="margin-left-full">
                {toCurrency(dataStateAfter.remainder)} Final Balance
              </span>
            </>
          ) : (
            <></>
          )}
          <section className="chart-inline-section chart-inline-section-top">
            <Bar data={dataStateCurrent} options={options} />
          </section>
          <section className="chart-inline-section chart-inline-section-bottom">
            <Bar data={dataStateAfter} options={options} />
          </section>
        </div>
      ) : (
        <div className="container-flex f-full f-j-l margin-top-full f-valign">
          <span>
            Loading
            <span className="loading-dots">...</span>
          </span>
          <section className="chart-inline-section"></section>
        </div>
      )}
    </>
  );
};

export default InlineBarPerUserBalance;
