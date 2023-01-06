import React, { useState, useEffect } from "react"
import 'chart.js/auto'
import { Chart } from 'react-chartjs-2'
import { randomHexColor, toCurrency } from '../../utils/helpers'


const SingleMonthCategoryCost = ( { valueType, activeDate, highlightMonthState, categories, transactions } ) => {

    const [ graphDataState, setGraphDataState ] = useState( null )
    const [ loadingState, setLoadingState ] = useState( true )

    const createGraphData = () => {
        const labels = []
        const colors = []
        
        // create labels
        categories.map( category => {
            if( !labels.includes( category.title ) ){
                colors.push( randomHexColor() )
                return labels.push( category.title )
            }
            return null;            
        } )      

        const datasets = [
            {
                label: 'Actual',
                data: new Array( labels.length ).fill().map( ( x, i ) => {
                    return 0
                } ),
                backgroundColor: new Array( labels.length ).fill().map( ( x, i ) => {
                    return '#000'
                } ),
                radius: '90%',
            },
            {
                label: 'Budget',
                data:  new Array( labels.length ).fill().map( ( x, i ) => {
                    return 0
                } ),
                backgroundColor: new Array( labels.length ).fill().map( ( x, i ) => {
                    return '#000'
                } ),
                radius: '90%',
            },
        ]

        // add transactions
        transactions.map( entry => {
            const matchCategory = labels.indexOf( categories.filter( x => x._id === entry.categoryID )[0].title )
            datasets[0].data[matchCategory] = datasets[0].data[matchCategory] + entry.value
            return datasets[0].backgroundColor[matchCategory] = colors[matchCategory]
        } )

        // add budgeted vals
        categories.map( category => {
            const filteredRanged = category.budgetedValueRange.filter( date => date.effectiveStartDate <= activeDate && ( date.effectiveEndDate >= activeDate || date.effectiveEndDate === null ) )
            if( filteredRanged.length > 0 ){
                const matchCategory = labels.indexOf( category.title )
                datasets[1].data[matchCategory] = filteredRanged[0].budgetedValue
                return datasets[1].backgroundColor[matchCategory] = colors[matchCategory]
            }
            return null
        })
        
        const newState = {
            labels,
            datasets
        }

        
        setGraphDataState( {
            ...newState
        } )
        
        setLoadingState( false )
    }

    useEffect(()=>{
        createGraphData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[highlightMonthState]) 

    const options = {
        plugins: {
                title: {
                    display: false
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        title: function( context ){
                            let title = `${ context[0].dataset.label } ( ${ context[0].label } ) Value`
                            return title
                        },
                        label: function( context ) {
                            let label
                            if( context.dataset.label === "Actual" ){
                                const budgetedValue = graphDataState.datasets[1].data[ context.dataIndex ]

                                label = [
                                    [`${toCurrency( context.parsed )}`],
                                    [`${ context.parsed - budgetedValue > 0 ? '+' + ( toCurrency( context.parsed - budgetedValue ) + ' extra ' + ( valueType === 'expense' ? 'spent' : 'earned' ) ) : ( toCurrency( context.parsed - budgetedValue ) + ' less ' + ( valueType === 'expense' ? 'spent' : 'earned' ) ) }`]
                                ]
                            }
                            if( context.dataset.label === "Budget" ){
                                label = toCurrency( context.parsed )
                            }
                            return label;
                        }
                    }
                }
          },
          responsive: true,
          maintainAspectRatio: false
    };

    return (
        <>
            <div className="chart-half-section">
                { !loadingState &&
                    <Chart type="doughnut" data={ graphDataState } options={ options } height={ 15 } width={ 15 }/>
                }  
            </div>
        </>
    )
};

export default SingleMonthCategoryCost;
