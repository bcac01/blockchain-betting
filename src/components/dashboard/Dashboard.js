import React, { Component } from 'react';
import axios from 'axios';
import nodeUrl from '../../eth-node-config.json';
import moment from 'moment';
import Web3 from 'web3';
import compiledContract from '../../truffle/build/contracts/BettingApp.json';


/**
 * Create web3 instance
 */
const web3 = new Web3(nodeUrl.url);

/**
 * Get address from compiled contract
 */
const contractAddress = compiledContract.networks['300'].address;

/**
 * Create contract instance
 */
const contractInstance = new web3.eth.Contract(compiledContract.abi, contractAddress);

/**
 * Get coinbase address
 */
let coinbaseAddress = '';
web3.eth.getCoinbase().then(result => {
    coinbaseAddress = result;
});


class Dashboard extends Component {

    constructor(dashboardProps) {
        super(dashboardProps)  
        this.state = {
            betting: false,
            inputValue: '',
            betAccepted: null,
            placedBet: '',
            formErrors: {
            inputValue: ""
            }
        }
    }
    
    // update value state
    updateValue = (e) => {
        e.preventDefault();

        const { value } = e.target;
        let formErrors = { ...this.state.formErrors };
    
        formErrors.inputValue = value.length === 0 ? "Please enter a bet value" : "";
    
        this.setState({ formErrors, inputValue: value });
    }

    /**
     * Reset state if bet was invalid
     */
    resetBet = () => {
        sessionStorage.setItem('type', '');
        const { click } = this.props;
        click();
        this.setState({
            betAccepted: false,
            betting: false
        });
    }

    handleBet = (e) => {
        //disable click on elements until bet accepted
        const { click } = this.props;
        click();
        this.setState({
            betting: true  
        })
        //do not proceed if the field is empty, set inline message
        let formErrors = { ...this.state.formErrors };
        if (this.state.inputValue === '') {
            formErrors.inputValue ="Please enter a bet value";
            this.setState({ 
                formErrors,
            });
            click();
            this.setState({
                betting: false  
            })
            return;
        } else {
            // check which button is pressed and save state
            const { name } = e.target;
            const placedBetNumber = name === "bet up" ? 2 : 1;
            this.setState({ placedBet: name });

            // check if user is logged in
            if ((sessionStorage.getItem('address') === '0x0000000000000000000000000000000000000000') || (sessionStorage.getItem('address') === '') || (sessionStorage.getItem('address') === null)) {
                alert('You are not logged in');
                this.resetBet();
                return;
            } else {
                // check if time is right
                axios.get('/update_service/ethData.json').then(response => {
                    if (moment(new Date(response.data.roundTime)).add(8, 'minutes').diff(moment(new Date())) < 0) {
                        alert("You've missed your chance, time's up :(");
                        this.resetBet();
                        return;
                    } else {
                        // check if user have enough funds
                        web3.eth.getBalance(sessionStorage.getItem('address')).then(balance => {
                            if (balance < this.state.inputValue) {
                                alert('You don\'t have enough funds');
                                this.resetBet();
                                return;
                            } else {
                                // unlock user's address
                                contractInstance.methods.getAddressPass(sessionStorage.getItem('address')).call({ from: coinbaseAddress }).then((addressPass) => {
                                    web3.eth.personal.unlockAccount(sessionStorage.getItem('address'), addressPass, 120).then(() => {
                                        // place bet 
                                        contractInstance.methods.purchaseBet(placedBetNumber).send({ from: sessionStorage.getItem('address'), value: web3.utils.toWei(this.state.inputValue, "ether"), gas: "300000" , gasPrice: "15000000000" })
                                        .then(receipt => {
                                            if (receipt) {
                                                sessionStorage.setItem('type', this.state.inputValue);
                                                this.setState({
                                                    betAccepted: true,
                                                    betting: false
                                                });
                                                global.disablebutton = false
                                                console.log('Bet accepted, gas spent: ' + receipt.gasUsed);
                                            } else {
                                                this.resetBet();
                                            }
                                        }).catch((err) => {
                                            this.resetBet();
                                            console.log("Failed with error: " + err);
                                          });
                                    });
                                
                                });
                            }
                        });
                    }
                });
            }
        }
    }

    render() {
        const { formErrors } = this.state;

        return (
            <div className="dashboard-wrapper">
            <div className="row">
                {
                this.state.betAccepted ?
                    <div className="col">
                        <div className="alert alert-success alert-dismissible">
                        <a href="#0" className="close" data-dismiss="alert" aria-label="close">&times;</a>
                            Thank you for your bet.
                        </div> 
                    </div>    
                :null
                }
                {
                    !this.state.betAccepted && this.state.betAccepted != null ? 
                    <div className="col">
                        <div className="alert alert-danger alert-dismissible">
                        <a href="#0" className="close" data-dismiss="alert" aria-label="close">&times;</a>
                            Your bet was rejected.
                        </div>
                    </div>
                    :null
                }
                </div>
                <div className="row">
                    <div className="col-sm-6">
                    <input onChange={this.updateValue} className={formErrors.inputValue.length > 0 ? "error" : null} type="number" placeholder="Bet value (ETH)"/>   
                    <p><sup>* transaction fee is 0.00195 eth</sup></p>
                    {formErrors.inputValue.length > 0 && (
                        <p className="errorMessage">{formErrors.inputValue}</p>
                        )}
                    </div>
                    <div className="col-sm-3">
                        <button disabled={global.disablebutton} className="betup" name="bet up"  onClick={this.handleBet}>Bet up</button>
                    </div>
                    <div className="col-sm-3">
                        <button disabled={global.disablebutton} className="betdown" name="bet down" onClick={this.handleBet}>Bet down</button>
                    </div>
                </div>
                {
                    this.state.betAccepted?
                <div className="row">
                    <div className="col-sm-6 column-in-center">
                        <h2>Bet placed on: {this.state.placedBet}</h2>
                        <h2>Stake: {this.state.inputValue} ETH</h2>
                    </div>
                </div>
                :null
                }
                {
                    this.state.betting?
                    <div className="loading-wrapper">
                    <div className="row">
                        <div className="col-sm-6 column-in-center">
                            <h2>Accepting bet...</h2>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-sm-2 column-in-center">
                            <div className="loader"></div>
                        </div>
                    </div>
                    </div>
                :null
                }
            </div>
        );
    }
}

export default Dashboard;