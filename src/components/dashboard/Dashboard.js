import React, { Component } from 'react';
import nodeUrl from '../../eth-node-config.json';
import Web3 from 'web3';
import compiledContract from '../../truffle/build/contracts/BettingApp.json';
import Timer from '../timer/Timer.js';
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
        inputValue: '',
        disablebutton: false,
        showTimer: true,
        betAccepted: null,
        placedBet: '',
        formErrors: {
            inputValue: ""
        }
    }
  }
   /**
 * Get user balance
 */
getUserBalance = () => {
    web3.eth.getBalance(global.loggedInAddress, function (err, balance) {
        if (err) {
            console.error(err);
        } 
        else {
            console.log('Contract balance: ' + balance);
        }
    });
} 
    // update value state
    updateValue = (e) => {

        e.preventDefault();

        const { value } = e.target;
        let formErrors = { ...this.state.formErrors };
    
        formErrors.inputValue = value.length === 0 ? "Please enter a bet value" : "";
    
        // TODO : remove logging
        this.setState({ formErrors, inputValue: value }, () => console.log(this.state));
    }

handleBet = (e) => {
        
        //do not proceed if the field is empty, set inline message
        let formErrors = { ...this.state.formErrors };
        if (this.state.inputValue === '') {
            formErrors.inputValue ="Please enter a bet value";
            this.setState({ formErrors });
            return;
        }

        // check which button is pressed and save state
        const { name } = e.target;
        const placedBetNumber = name === "bet up" ? 1 : 2;
        this.setState({ placedBet : name });
       
        // check if user is logged in
        if((global.loggedInAddress === '0x0000000000000000000000000000000000000000') || (global.loggedInAddress === '') || (global.loggedInAddress === null)) {
            alert('You are not logged in');
            return;
        }
        // unlock user's address
        contractInstance.methods.getAddressPass(global.loggedInAddress).call({ from: coinbaseAddress }).then((addressPass) => {
            web3.eth.personal.unlockAccount(global.loggedInAddress, addressPass, 0);
        });
        //disable click on elements until bet accepted
        this.setState({
            disablebutton: !this.state.disablebutton
        });

        // place bet depending on chosen value
        contractInstance.methods.purchaseBet(placedBetNumber).send({from:global.loggedInAddress , value:web3.utils.toWei(this.state.inputValue, "ether"), gas: 300000}).then(receipt => { 
            if (receipt) {
                sessionStorage.setItem('type', this.state.inputValue);
                this.setState({
                    disablebutton: !this.state.disablebutton,
                    betAccepted: true
                });
            } 
            else {
                sessionStorage.setItem('type', '');
                this.setState({
                    disablebutton: !this.state.disablebutton,
                    betAccepted: false
                });
            }
        });
    }

    render() {
        const { formErrors } = this.state;
        let timer = null;
        if(this.state.showTimer) {
          timer = (<Timer />);
        }
        console.log(this.state.betAccepted);
        return (
            <div className="dashboard-wrapper">
            <div className="row">
                <div className="col">
                {
                    this.state.betAccepted ?
                    <div className="alert alert-success alert-dismissible">
                    <a href="#" className="close" data-dismiss="alert" aria-label="close">&times;</a>
                        Thank you for your bet.
                    </div> 
                    :
                    this.state.betAccepted != null ?
                    <div className="alert alert-danger alert-dismissible">
                    <a href="#" className="close" data-dismiss="alert" aria-label="close">&times;</a>
                        Your bet was rejected.
                    </div>
                    : null
                }
                    </div>
                </div>
                {
                    !this.state.betAccepted ?
                <div className="row">
                    <div className="col-sm-6">
                    <input onChange={this.updateValue} className={formErrors.inputValue.length > 0 ? "error" : null} type="text" placeholder="Bet value (ETH)"/>   
                    {formErrors.inputValue.length > 0 && (
                        <p className="errorMessage">{formErrors.inputValue}</p>
                        )}
                    </div>
                    <div className="col-sm-3">
                        <button disabled={this.state.disablebutton} className="betup" name="bet up" onClick={this.handleBet}>Bet up</button>
                    </div>
                    <div className="col-sm-3">
                        <button disabled={this.state.disablebutton} className="betdown" name="bet down" onClick={this.handleBet}>Bet down</button>
                    </div>
                </div>
                : 
                <div className="row">
                    <div className="col-sm-6 column-in-center">
                        <h2>Bet placed on: {this.state.placedBet}</h2>
                        <h2>Stake: {this.state.inputValue} ETH</h2>
                    </div>
                </div>
                }
                {
                    this.state.disablebutton?
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
            <div className="row">
                {timer}
            </div>
            </div>
        );
    }
}

export default Dashboard;