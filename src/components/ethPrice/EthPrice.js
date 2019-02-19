import React, { Component } from 'react';
import axios from 'axios';
import Web3 from 'web3';
import nodeUrl from '../../eth-node-config.json';

const web3 = new Web3(nodeUrl.url);
 
class EthPrice extends Component {

    constructor(ethPriceProps) {
        super(ethPriceProps)  
        this.state = {
            price: 0,
            betPrice: 0,
            priceDifference: 0,
            currentBalance: '',
            walletAddress: ''
        }
    }

    /**
     * Get user balance
     */
    getUserBalance = () => {
        web3.eth.getBalance(sessionStorage.getItem('address')).then((balance)=>
        {       
            this.setState({
                currentBalance: web3.utils.fromWei(balance,'ether')
            });
        })
    }
    componentDidMount(){
        this.timer = setInterval( () => {
            axios.get('/update_service/ethData.json').then(response => {
                this.setState({
                    price: response.data.currentEthPrice,
                    betPrice: response.data.betEthPrice,
                    priceDifference: ((response.data.currentEthPrice / 
                    response.data.betEthPrice - 1) * 100).toFixed(2)
                });
            });
        }, 1000);
        this.timer2 = setInterval(() => {
            this.getUserBalance()
        }, 5000);
        this.getUserBalance();
        this.setState({
            walletAddress: sessionStorage.getItem('address')
        })
    }

    componentWillUnmount = () => {
        clearTimeout(this.timer);
        clearTimeout(this.timer2);
    };

    render() {
        return (
        <div className="ethPrice-wrapper col">
            <div className="row">
                <div className="col-sm-4">
                    <h1>Betting against</h1>
                    <p>ETH/USD</p>
                    <h2>${this.state.betPrice}</h2>
                </div>
                <div className="col-sm-4">
                    <h1>Price difference</h1>
                    <p>%</p>
                    <h2>{this.state.priceDifference}%</h2>
                </div>
                <div className="col-sm-4">
                    <h1>Current ETH Price</h1>
                    <p>ETH/USD</p>
                    <h2>${this.state.price}</h2>
                </div>
            </div>
            <div className="row">
                <div className="col-sm-12">
                    <h1>My wallet : 
                    <br></br>{this.state.walletAddress}</h1>
                </div>
                <div className="col float-left">
                    <h2 className="float-center">Current balance : {this.state.currentBalance} - ETH</h2>
                </div>
            </div>
        </div>
        );
    }
}

export default EthPrice;