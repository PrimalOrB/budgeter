import React, { useEffect, useState } from 'react'
import { toCurrency } from '../../utils/helpers'
import { Bar } from 'react-chartjs-2'

const InlineBar = ( { inputData, title, perUser, balance, ratioProp, valueProp } ) => {

    const [ dataState, setDataState ] = useState( false )
    const [ loadingState, setLoadingState ] = useState( true )

    function processData(){

        setLoadingState( true )

        let output = {
            labels: [title],
            datasets: [],
            totalProp: 0,
            compositeTitle: ''
        }
        
        if( perUser ){
            inputData.map( user => {
                if( balance ){
                    if( user[`${ valueProp[0] }`] > 0 ){
                        output.totalProp += user[`${ valueProp[0] }`]
                    }
                }else {
                    output.totalProp += user[`${ valueProp[0] }`]
                }
                return output.datasets.push( { 
                    label: user.userID,
                    data: [ user[`${ ratioProp[0] }`] ],
                    hoverData: [ user[`${ valueProp[0] }`] ],
                    backgroundColor: `#${ user.userColor }`,
                    barPercentage: 1.0,
                    categoryPercentage: 1.0
                })
            })

            output.compositeTitle = `${ title }: ${ toCurrency( output.totalProp ) }`
        } else {
            output.datasets.push( { 
                label: 'a',
                data: [ inputData[`${ ratioProp[0] }`] ],
                hoverData: [ inputData[`${ valueProp[0] }`] ],
                backgroundColor: `rgba(0, 128, 0, 1)`,
                barPercentage: 1.0,
                categoryPercentage: 1.0
            })

            output.datasets.push( { 
                label: 'b',
                data: [ inputData[`${ ratioProp[1] }`] ],
                hoverData: [ inputData[`${ valueProp[1] }`] ],
                backgroundColor: `rgba(200, 0, 0, 1)`,
                barPercentage: 1.0,
                categoryPercentage: 1.0
            })
            
            output.compositeTitle = `${ title }: ${ ( inputData[`${ ratioProp[0] }`] * 100 ).toFixed(1) }%`
        }

        setDataState( output )
        setLoadingState( false )
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

                },
                grid: {
                    display:false,
                    drawBorder: false,

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
                enabled: false
            }
        }
    };

    useEffect(()=>{
        processData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[])

    return (
        <>
        { !loadingState ?
            <>
            <span>{ dataState.compositeTitle }</span>
            <section className="chart-inline-section">
                <Bar data={ dataState } options={ options } />
            </section>
            </>
        :
            <li>
                loading
            </li>
        }
        </>
    )
};

export default InlineBar;
