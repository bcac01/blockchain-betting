import React, { Component } from 'react';
import ethData from '../../update_service/ethData.json';
import Web3 from 'web3';
import nodeUrl from '../../eth-node-config.json';

const web3 = new Web3(nodeUrl.url);
 
class EthPrice extends Component {
    constructor(ethPriceProps) {
        super(ethPriceProps)  
        this.state = {
            price: ethData.currentEthPrice,
            betPrice: ethData.betEthPrice,
            priceDifference: ((ethData.currentEthPrice / ethData.betEthPrice - 1) * 100).toFixed(2),
            currentBalance: ''
        }
    }
   
/**
 * After all the elements of the page is rendered correctly, this method is called by React itself to either fetch the data from An External API or perform some unique operations which need the JSX elements.
 // https://apiv2.bitcoinaverage.com/indices/global/ticker/ETHUSD  // https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD
 */

    /**
     * Get user balance
     */
    
    getUserBalance = () => {
        let bal = '';
        web3.eth.getBalance(global.loggedInAddress, function (err, balance) {
            if (err) {
                console.log(err)
            } 
            else
                bal = toString(balance);
                this.setState({
                    currentBalance: bal
                })
                console.log(bal)
        });
    }

    componentDidMount(){        
        setInterval( () => {
            this.setState({
                price: ethData.currentEthPrice,
                betPrice: ethData.betEthPrice,
                priceDifference: ((ethData.currentEthPrice / ethData.betEthPrice - 1) 
                * 100).toFixed(2),
            });
        }, 10000)
    }

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
                <div className="col-sm-4">
                    <h1>My wallet : </h1>
                </div>
                <div className="col float-left">
                    <h2 className="float-left">{this.state.currentBalance} - ETH</h2>
                </div>
            </div>
        </div>
        );
    }
}

export default EthPrice;