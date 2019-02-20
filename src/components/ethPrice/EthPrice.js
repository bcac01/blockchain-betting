import React, { Component } from 'react';
import axios from 'axios';
import Web3 from 'web3';
import nodeUrl from '../../eth-node-config.json';
import compiledContract from '../../truffle/build/contracts/BettingApp.json';
var QRCode = require('qrcode.react');

const web3 = new Web3(nodeUrl.url);

/**
 * Get address from compiled contract
 */
const contractAddress = compiledContract.networks['300'].address;

/**
 * Create contract instance
 */
const contractInstance = new web3.eth.Contract(compiledContract.abi, contractAddress);

class EthPrice extends Component {

    constructor(ethPriceProps) {
        super(ethPriceProps)  
        this.state = {
            price: 0,
            betPrice: 0,
            priceDifference: 0,
            currentBalance: '',
            walletAddress: '',
            totalBetAmount: 0,
            totalBetUpAmount: 0,
            totalBetDownAmount: 0
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
    /**
     * Get total/up/down bet amount
     */
    getTotalBetAmount = () => {
        contractInstance.methods.BetStatistics().call()
        .then((response) => {
             this.setState({
                 totalBetAmount: web3.utils.fromWei(response[0],'ether'),
                 totalBetDownAmount: web3.utils.fromWei(response[1],'ether'),
                 totalBetUpAmount: web3.utils.fromWei(response[2],'ether'),
             });
        });
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
            this.getUserBalance();
            this.getTotalBetAmount();
        }, 5000);
        this.getUserBalance();
        this.getTotalBetAmount();
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
                    <h1>My wallet :</h1>
                </div>
                <div className="col-sm-12">
                    <h1 className="myWallet">{this.state.walletAddress}</h1>
                </div>
                <div className="col-sm-12 col-centered">
                    <div className="qrdiv col-sm-12 col-centered">
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
                <div className="col float-center myWallet">
                    <h2 className="float-center">Current balance : {this.state.currentBalance} - ETH</h2>
                </div>
            </div>
            <div className="row">
                <div className="col-sm-4">
                    <h1>Bet up amount</h1>
                    <h2>{this.state.totalBetUpAmount} -ETH</h2>
                </div>
                <div className="col-sm-4">
                    <h1>Total Bet amount</h1>
                    <h2>{this.state.totalBetAmount} -ETH</h2>
                </div>
                <div className="col-sm-4">
                    <h1>Bet down amount</h1>
                    <h2>{this.state.totalBetDownAmount} -ETH</h2>
                </div>
            </div>
        </div>
        );
    }
}

export default EthPrice;