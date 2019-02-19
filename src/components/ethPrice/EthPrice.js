import React, { Component } from 'react';
import axios from 'axios';
import Web3 from 'web3';
import nodeUrl from '../../eth-node-config.json';
var QRCode = require('qrcode.react');

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
        this.getBalanceTimer = setInterval(() => {
            this.getUserBalance()
        }, 5000);
        this.getUserBalance();
        this.setState({
            walletAddress: sessionStorage.getItem('address')
        })
    }

    componentWillUnmount = () => {
        clearTimeout(this.getBalanceTimer);
        clearTimeout(this.timer);
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
                    <div className="col-sm-12">
                    <div className="qrdiv col-sm-3 offset-5">
                        <QRCode 
                        value={this.state.walletAddress}
                        size={180}
                        bgColor={"#ffffff"}
                        fgColor={"#000000"}
                        level={"L"}
                        includeMargin={false}
                        renderAs={"canvas"}
                        />
                    </div>
                    </div>
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