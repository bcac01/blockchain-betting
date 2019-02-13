import React from "react";
import ethHistoryData from '../../update_service/ethHistory.json';
import moment from 'moment';
import Chart from 'chart.js';

class Graph extends React.Component {

    componentDidMount() {
        const node = this.node;
        
        let tempData = [];
        for (let i = 0; i < ethHistoryData.length; i++) {
            let dataRow = ethHistoryData[i];
            let chartData = {};
            chartData.x = moment(new Date(dataRow.timestamp)).format();
            chartData.y = parseFloat(dataRow.price);
            tempData.push(chartData);
        }
        let chart_data = {
            type: 'line',
            data: {
                datasets: [{
                    label: "ETH Price",
                    backgroundColor: 'rgba(50,255,50,0.1)',
                    borderColor: 'rgba(50,255,50,0.5)',
                    pointBackgroundColor: 'rgba(0,255,0,0.5)',
                    pointBorderColor: 'rgba(0,255,0,0)',
                    pointBorderWidth: 1,
                    data: tempData,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                title: {
                    display: true,
                },
                scales: {
                    xAxes: [{
                        type: "time",
                        display: true,
                        scaleLabel: {
                            display: true
                        }
                    }],
                    yAxes: [{
                        display: true,
                        scaleLabel: {
                            display: true
                        }
                    }]
                }
            }
        };
        new Chart(node, chart_data);
    }

    render() {
        return (
            <div>
                <canvas
                    style={{ width: 800, height: 300 }}
                    ref={node => (this.node = node)}
                />
            </div>
        );
    }
}

export default Graph;