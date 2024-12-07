import React, { useEffect, useState } from "react";
import { toCurrency } from "../../utils/helpers";
import { Bar } from "react-chartjs-2";

const InlineBarBalance = ({ inputData, title, valueProp }) => {
  const [dataState, setDataState] = useState(false);
  const [loadingState, setLoadingState] = useState(true);
  const [hoverData, setHoverData] = useState("");

  function processData() {
    setLoadingState(true);

    let output = {
      labels: ["title"],
      datasets: [],
    };

    inputData.userData.map((user) => {
      if (user.responsibilityBalance > 0) {
        setHoverData(user);
      }
      const entry =
        user.responsibilityBalance / inputData.sharedExpenseTotal / 2 + 0.5;

      return output.datasets.push({
        label: user.userID.userInitials,
        data: [entry],
        hoverData: entry,
        userData: user,
        backgroundColor: `#${user.userID.userColor}`,
        barPercentage: 1.0,
        categoryPercentage: 1.0,
      });
    });
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
          footer: function (context) {
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
      {!loadingState && dataState ? (
        <div className="container-flex f-full f-j-l margin-top-full f-valign">
          <span>{dataState.compositeTitle}</span>
          {hoverData?.responsibilityBalance ? (
            <>
              <span
                className="f0 initials-icon noselect"
                style={{
                  backgroundColor: hoverData.userID.userColor
                    ? `#${hoverData.userID.userColor}`
                    : "#BBBBBB",
                }}
              >
                {hoverData.userID.userInitials}
              </span>
              <span className="margin-left-full">
                {toCurrency(hoverData.responsibilityBalance)} To Pay
              </span>
            </>
          ) : (
            <>Users Balanced</>
          )}
          <section className="chart-inline-section">
            <Bar data={dataState} options={options} />
          </section>
        </div>
      ) : (
        <div className="container-flex f-full margin-top-full f-valign">
          <span>Balanced</span>
        </div>
      )}
    </>
  );
};

export default InlineBarBalance;
