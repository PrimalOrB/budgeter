import React, { useEffect, useState } from 'react'
import { toCurrency } from '../../utils/helpers'
import { Bar } from 'react-chartjs-2'

const InlineBarPerUserBalance = ( { inputData, title, valueProp } ) => {

    const [ dataState, setDataState ] = useState( false )
    const [ loadingState, setLoadingState ] = useState( true )
    const [ hoverData, setHoverData ] = useState( '' )

    function processData(){

        setLoadingState( true )

        let output = {
            labels: [title],
            datasets: [
                { 
                    label: 'Income',
                    data: [],
                    hoverData: 0,
                    backgroundColor: `rgba(0, 128, 0, 1)`,
                    barPercentage: 1.0,
                    categoryPercentage: 1.0
                },
                { 
                    label: 'Expenses',
                    data: [],
                    hoverData: 0,
                    backgroundColor: `rgba(200, 0, 0, 1)`,
                    barPercentage: 1.0,
                    categoryPercentage: 1.0
                }
            ],
            totalProp: 0,
            compositeTitle: '',
            userData: { userColor: inputData.userColor, userInitials: inputData.userInitials },
            balance: 0,
            remainder: 0
        }
        

        output.datasets[0].data.push( inputData.balancedIncome )
        output.datasets[1].data.push( inputData.balancedExpenses )
        output.totalProp += inputData.balancedIncome
        output.totalProp += inputData.balancedExpenses
        output.balance = inputData.balancedIncome / ( inputData.balancedIncome + inputData.balancedExpenses )
        output.remainder = inputData.balancedIncome - inputData.balancedExpenses
        
        setDataState( output )
        setLoadingState( false )
    }  
    
    function updateHover( update ){
        if( hoverData.userID !== update.userID ){
            return setHoverData( { ...update } )
        }
    }

    const options = {
        indexAxis: 'y',
        responsive: true,
        layout: {
            padding: {
                left: -10,
                bottom: -10
            }
        },
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                stacked: true,
                ticks: {
                    display: false
                },
                grid: {
                    drawBorder: false,
                    display:false
                }
            },
            x: {
                reverse: false,
                position: 'left',
                stacked: true,
                ticks: {
                    display: false,
                    drawBorder: false,
                    stepSize: Math.floor( dataState.totalProp / 1000 ) + 1

                },
                grid: {
                    display:false,
                    drawBorder: false
                }
            }   
        },
        plugins: {
            legend: {
                display: false,
                labels: {
                    font: {
                        size: 9
                    }
                }
            },
            tooltip: {
                mode: 'x',
                intersect: false,
                backgroundColor: 'rgba(0,0,0,0)',
                callbacks: {
                    footer: function( context ){
                        // const update = { ...context[0].dataset.userData, hover: context[0].dataset.hoverData }
                        // updateHover( update )
                        return false
                    },
                    title: function(){
                        return false
                    },
                    label: function(){
                        return false
                    }
                }
            },
        }
    }

    useEffect(()=>{
        processData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[])

    console.log( hoverData )

    return (
        <>
        { ( !loadingState && dataState ) ?
            <div className="container-flex f-full f-j-l margin-top-full f-valign">
                <span>{ dataState.compositeTitle }</span>
                { dataState.userData
                    ?
                    <>
                        <span className='f0 initials-icon noselect' style={{ backgroundColor: dataState.userData.userColor ? `#${ dataState.userData.userColor }` : '#BBBBBB' }} >
                            { dataState.userData.userInitials }
                        </span> 
                        <span className="margin-left-full">{ ( dataState.balance * 100 ).toFixed(1) }% Income / Expenses</span> 
                        <span className="margin-left-full">{ toCurrency( dataState.remainder ) } Remaining</span>  
                    </>
                    :
                    <>
                    </>
                }
                <section className="chart-inline-section">
                    <Bar data={ dataState } options={ options } />
                </section>
            </div>
        :
        <div className="container-flex f-full margin-top-full f-valign">
            <span>Balanced</span>
        </div>
        }
        </>
    )
};

export default InlineBarPerUserBalance;
