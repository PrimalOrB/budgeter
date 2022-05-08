import React, { useState, useEffect, useRef } from "react";
import { Chart } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, BarElement, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register( CategoryScale, BarElement, LinearScale, PointElement, LineElement, Title, Tooltip, Legend );

const determineBorderRadius = (context) => {
    const numDatasets = context.chart.data.datasets.length;
    let showBorder = false;
  
    if (context.datasetIndex === numDatasets - 1) {
      // Last dataset, always a yes
      showBorder = true;
    } else if (context.parsed.y !== 0) {
      // We show a radius when we're the highest value in a positive stack
      // or the lowest value in a negative stack
      const sign = Math.sign(context.parsed.y);
      let matches = false;
  
      // Look for any other non-0 values in the same stack that have the same sign
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

const MultiMonthBudgetOverview = ( { data } ) => {

    const [ graphDataState, setGraphDataState ] = useState( null )
    const [ loadingState, setLoadingState ] = useState( true )
    const maxYAxis = useRef( 0 )

    console.log( graphDataState )

    const createGraphData = () => {
        const labels = []
        const datasets = [
            {
                type: 'line',
                label: 'Balance',
                data: new Array( data.length ).fill().map( ( x, i ) => {
                    return 0
                } ),
                borderWidth: 8,
                borderColor: '#71a9f7',
                pointHoverBackgroundColor: 'rgba( 255, 255, 255, 1)',
                pointHitRadius: 5,
                pointHoverRadius: 8,
                pointHoverBorderWidth: 3,
                tension: 0.25
            },
            {
                type: 'bar',
                label: 'Budgeted Income',
                data: new Array( data.length ).fill().map( ( x, i ) => {
                    return 0
                } ),
                backgroundColor: 'rgba(0, 128, 0, 0.25)',
                borderWidth: 1,
                borderColor: 'rgba(0, 128, 0, 1)',
                stack: 'Stack 0',
                barThickness: 25,
                borderRadius: determineBorderRadius,
            },
            {
                type: 'bar',
                label: 'Budgeted Expense',
                data: new Array( data.length ).fill().map( ( x, i ) => {
                    return 0
                } ),
                backgroundColor: 'rgba(200, 0, 0, 0.25)',
                borderWidth: 1,
                borderColor: 'rgba(200, 0, 0, 1)',
                stack: 'Stack 0',
                barThickness: 25,
                borderRadius: determineBorderRadius,
            },
            {
                type: 'bar',
                label: 'Income',
                data: new Array( data.length ).fill().map( ( x, i ) => {
                    return 0
                } ),
                backgroundColor: 'rgba(0, 128, 0, 1)',
                stack: 'Stack 1',
                barThickness: 25,
                borderRadius: determineBorderRadius,
            },
            {
                type: 'bar',
                label: 'Expense',
                data: new Array( data.length ).fill().map( ( x, i ) => {
                    return 0
                } ),
                backgroundColor: 'rgba(200, 0, 0, 1)',
                stack: 'Stack 1',
                barThickness: 25,
                borderRadius: determineBorderRadius,
            },
            
        ]  
        
        data.map( ( month, i ) => {
            labels.push( month.label )    
            datasets[1].data[i] = month.budgetedIncomeTotal
            datasets[2].data[i] = - month.budgetedExpenseTotal 
            datasets[3].data[i] = month.incomeTotal
            datasets[4].data[i] = - month.expenseTotal               
            datasets[0].data[i] += month.incomeTotal  
            return datasets[0].data[i] -= month.expenseTotal  
        })

        const newState = {
            labels,
            datasets
        }

        maxYAxis.current = Math.ceil( Math.max(...datasets.map( set => Math.abs( set.data.reduce(function(a, b) {
            return Math.max(a, b);
        }, -Infinity) ))) / 500 ) * 500

        
        setGraphDataState( {
            ...newState
        } )
        
        setLoadingState( false )
    }

    useEffect(()=>{
        createGraphData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]) 

    const options = {
        plugins: {
                title: {
                    display: false
                },
                legend: {
                    display: false
                },
          },
          responsive: true,
          scales: {
            x: {
                reverse: true,
            },
            y: {
                display: false,
                stacked: true,
                // min: -maxYAxis.current,
                // max: maxYAxis.current,
                grid: {
                    display: false
                }
            },
          },
          maintainAspectRatio: false
    };

    return (
        <>
            <section>
                <h4 className="sub-container-description section-list-title">Chart</h4>
                <section className="chart-full-section ">
                    { !loadingState &&
                        <Chart type="bar" className='blanketChart' data={ graphDataState } options={ options } height={ 2.5 } width={ 10 }/>
                    }  
                </section>
            </section>
        </>
    )
};

export default MultiMonthBudgetOverview;
