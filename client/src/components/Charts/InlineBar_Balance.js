import React, { useEffect, useState } from 'react'
import { toCurrency } from '../../utils/helpers'
import { Bar } from 'react-chartjs-2'

const InlineBarBalance = ( { inputData, title, valueProp } ) => {

    const [ dataState, setDataState ] = useState( false )
    const [ loadingState, setLoadingState ] = useState( true )
    const [ hoverData, setHoverData ] = useState( '' )

    function processData(){

        setLoadingState( true )

        let output = {
            labels: [title],
            datasets: [],
            totalProp: 0,
            compositeTitle: ''
        }
        
        inputData.map( user => {

            if( user.userBalance > 0 ){
                output.totalProp += user[`${ valueProp[0] }`]
    
                output.datasets.push( { 
                    label: user.userID,
                    data: [ user[`${ valueProp[0] }`] ],
                    hoverData: user[`${ valueProp[0] }` ],
                    userData: user,
                    backgroundColor: `#${ user.userColor }`,
                    barPercentage: 1.0,
                    categoryPercentage: 1.0
                })
                output.compositeTitle = `${ title }`
        
                setDataState( output )
                setLoadingState( false )
                return updateHover( { ...output.datasets[0].userData, hover: output.datasets[0].hoverData } )
            } 
            
            return user
        })
        
        return setLoadingState( false )
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
                        const update = { ...context[0].dataset.userData, hover: context[0].dataset.hoverData }
                        updateHover( update )
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

    return (
        <>
        { ( !loadingState && dataState ) ?
            <div className="container-flex f-full f-j-l margin-top-full f-valign">
                <span>{ dataState.compositeTitle }</span>
                { hoverData
                    ?
                    <>
                        <span className='f0 initials-icon noselect' style={{ backgroundColor: hoverData.userColor ? `#${ hoverData.userColor }` : '#BBBBBB' }} >
                            { hoverData.userInitials }
                        </span>            
                        <span className="margin-left-full">{ toCurrency( hoverData.hover ) } ( { ( ( hoverData.hover / dataState.totalProp ) * 100 ).toFixed(1) }% )</span>
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

export default InlineBarBalance;
