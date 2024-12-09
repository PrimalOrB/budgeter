import React, { useEffect, useState } from "react";
import { toCurrency } from "../../utils/helpers";
import { Bar } from "react-chartjs-2";

const InlineBarTotal = ({ inputData, title, valueProp }) => {
  const [dataState, setDataState] = useState(false);
  const [loadingState, setLoadingState] = useState(true);

  function processData() {
    setLoadingState(true);

    const entry1 = inputData[`${valueProp[0]}`],
      entry2 = inputData[`${valueProp[1]}`],
      dataRange = entry1 + entry2;

    let output = {
      labels: [title],
      datasets: [
        {
          label: title[1],
          data: [],
          hoverData: 0,
          backgroundColor: `rgba( 0, 128, 0, 1 )`,
          barPercentage: 1.0,
          categoryPercentage: 1.0,
        },
        {
          label: title[2],
          data: [],
          hoverData: 0,
          backgroundColor: `rgba( 200, 0, 0, 1 )`,
          barPercentage: 1.0,
          categoryPercentage: 1.0,
        },
      ],
    };

    output.datasets[0].data.push((entry1 / dataRange) * 100);
    output.datasets[1].data.push((entry2 / dataRange) * 100);

    output.totalProp = entry1 / dataRange;

    output.compositeTitle = `${title[0]}: ${(output.totalProp * 100).toFixed(
      1
    )}%`;

    setDataState(output);
    return setLoadingState(false);
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
          stepSize: Math.floor(dataState.totalProp / 1000) + 1,
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
      {!loadingState ? (
        <div className="container-flex f-full f-j-l margin-top-full f-valign">
          <span>{dataState.compositeTitle}</span>
          <section className="chart-inline-section">
            <Bar data={dataState} options={options} />
          </section>
        </div>
      ) : (
        <li>loading</li>
      )}
    </>
  );
};

export default InlineBarTotal;
