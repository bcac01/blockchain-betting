import React, { Component } from 'react';
import axios from 'axios';

class EthPrice extends Component {

    state = {
        price: 0,
        betPrice: 0,
        priceDifference: 0
    }

    componentDidMount(){
        this.timer = setInterval( () => {
            axios.get('/update_service/ethData.json').then(response => {
                this.setState({
                    price: response.data.currentEthPrice,
                    betPrice: response.data.betEthPrice,
                    priceDifference: ((response.data.currentEthPrice / response.data.betEthPrice - 1) * 100).toFixed(2)
                });
            });
        }, 1000);
    }

    componentWillUnmount = () => {
        clearTimeout(this.timer);
    };

    render() {
        return (
        <div className="ethPrice-wrapper col">
            <div className="row">
                <div className="col-4">
                    <h1>Betting against</h1>
                    <p>ETH/USD</p>
                    <h2>${this.state.betPrice}</h2>
                </div>
                <div className="col-4">
                    <h1>Price difference</h1>
                    <p>%</p>
                    <h2>{this.state.priceDifference}%</h2>
                </div>
                <div className="col-4">
                    <h1>Current Ethereum Price</h1>
                    <p>ETH/USD</p>
                    <h2>${this.state.price}</h2>
                </div>
            </div>
            <div className="row">
                <div className="col">
                    <canvas id="myChart" width="100%" height="30%"></canvas>
                </div>
            </div>
        </div>
        );
    }
}

export default EthPrice;