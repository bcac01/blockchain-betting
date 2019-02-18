import React from "react";
import axios from 'axios';
import moment from 'moment';
import Chart from 'chart.js';

class Graph extends React.Component {

    state = {
        chart: '',
        tempData: []
    }

    componentDidMount() {
        axios.get('/update_service/ethHistory.json').then(response => {
            const node = this.node;
            this.setState({
                tempData: []
            });
            let minPrice = 10000;
            let maxPrice = 0;
            for (let i = 0; i < response.data.length; i++) {
                let dataRow = response.data[i];
                let chartData = {};
                chartData.x = moment(new Date(dataRow.timestamp)).format();
                chartData.y = parseFloat(dataRow.price);
                this.state.tempData.push(chartData);
                if (parseFloat(dataRow.price) < minPrice)
                    minPrice = parseFloat(dataRow.price);
                if (parseFloat(dataRow.price) > maxPrice)
                    maxPrice = parseFloat(dataRow.price);
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
                        data: this.state.tempData,
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
                            ticks: {
                                suggestedMin: minPrice - 0.1,
                                suggestedMax: maxPrice + 0.1
                            },
                            scaleLabel: {
                                display: true
                            }
                        }]
                    }
                }
            };
            this.setState({
                chart: new Chart(node, chart_data)
            });
        });
        this.timer = setInterval(() => {
            this.updateGraph(this.state.chart);
        }, 30000);
    }

    updateGraph = (chart) => {
        axios.get('/update_service/ethHistory.json').then(response => {
            chart.data.datasets.forEach((dataset) => {
                dataset.data.length = 0;
            });
            this.setState({
                tempData: []
            });
            let minPrice = 10000;
            let maxPrice = 0;
            for (let i = 0; i < response.data.length; i++) {
                let dataRow = response.data[i];
                let chartData = {};
                chartData.x = moment(new Date(dataRow.timestamp)).format();
                chartData.y = parseFloat(dataRow.price);
                this.state.tempData.push(chartData);
                if (parseFloat(dataRow.price) < minPrice)
                    minPrice = parseFloat(dataRow.price);
                if (parseFloat(dataRow.price) > maxPrice)
                    maxPrice = parseFloat(dataRow.price);
            }

            chart.data.datasets.forEach((dataset) => {
                dataset.data = this.state.tempData;
            });
            chart.options.scales.yAxes[0].ticks.suggestedMin = minPrice - 0.1;
            chart.options.scales.yAxes[0].ticks.suggestedMax = maxPrice + 0.1;
            chart.update();
        });
    }

    componentWillUnmount = () => {
        clearTimeout(this.timer);
    };

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