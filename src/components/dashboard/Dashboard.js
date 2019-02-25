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

   state = {
            betting: false,
            inputValue: '',
            betAccepted: null,
            placedBet: '',
            disablebutton: false,
            formErrors: {
            inputValueE: ""
            },
            possibleUpWinning : 0,
            possibleDownWinning : 0,
            upCoeficient : 0,
            downCoeficient : 0,
            realBetAmount : 0,
            resultStatusMsg: false
        }
    
    //get possible winning
    getPossibleWinning = () => { 
        if (parseFloat(this.state.inputValue.replace(",", ".")) !== 0)
        {
            //possible down bet
            if (parseFloat(global.totalBetUpAmount.replace(",",".")) === 0)
            {
                this.state.possibleDownWinning = 0;
            }
            else
            {
                this.state.realBetAmount= parseFloat(global.totalBetAmount) 
                + parseFloat(this.state.inputValue.replace(",", "."))
                - (parseFloat(global.totalBetUpAmount) * 10 / 100);
                this.state.downCoeficient = parseFloat(this.state.realBetAmount) 
                / (parseFloat(global.totalBetDownAmount)
                + parseFloat(this.state.inputValue.replace(",", ".")));
                 this.state.possibleDownWinning = 
                 parseFloat(this.state.inputValue.replace(",", "."))
                 * parseFloat(this.state.downCoeficient);
            }

            //possible up bet
            if (parseFloat(global.totalBetDownAmount.replace(",",".")) === 0)
            {
                this.state.possibleUpWinning = 0;
            }
            else
            {
                this.state.realBetAmount = parseFloat(global.totalBetAmount) 
                + parseFloat(this.state.inputValue.replace(",", "."))
                - parseFloat(global.totalBetDownAmount) * 10 / 100;
                this.state.upCoeficient = parseFloat(this.state.realBetAmount) 
                / (parseFloat(global.totalBetUpAmount)
                 + parseFloat(this.state.inputValue.replace(",", ".")));
                this.state.possibleUpWinning = parseFloat(this.state.inputValue.replace(",", "."))
                 * parseFloat(this.state.upCoeficient);
            }
        } 
    }
    // update value state
    updateValue = (e) => {
        e.preventDefault();

        const { value } = e.target;
        let formErrors = this.state.formErrors ;

        formErrors.inputValueE = value.length === 0 ? "Please enter a bet value" : "";
        this.setState({ 
            formErrors,
        });
        
        this.state.inputValue = value
        
        
        this.getPossibleWinning();
    }

    /**
     * Reset state if bet was invalid
     */
    resetBet = () => {
        sessionStorage.setItem('type', '');
        this.changeBtnStateFalse();
        this.setState({
            betAccepted: false,
            betting: false
        });
    }

    componentDidMount = () => {
        this.betResultTimer = setInterval(() => {
            const currentTimeMinute = moment(new Date()).get('minute');
            if (currentTimeMinute === 0 ||
                currentTimeMinute === 10 ||
                currentTimeMinute === 20 ||
                currentTimeMinute === 30 ||
                currentTimeMinute === 40 ||
                currentTimeMinute === 50) {
                    if (!this.state.resultStatusMsg) {
                        this.checkResults();
                    }
            } else {
                this.setState({
                    resultStatusMsg: false
                });
            }
        }, 1000);
    }
    
    changeBtnStateTrue = () =>{
        this.setState({
            disablebutton : true
        })
    }
    changeBtnStateFalse = () =>{
        this.setState({
            disablebutton : false
        })
    }

    /**
     * Check for bet results
     */
    checkResults = () => {
        // if (localStorage.getItem('bets')) {
        //     let localBets = JSON.parse(localStorage.getItem('bets'));
        //     console.log(localBets);
            
        // } else {
        //     console.log('no bets');
            
        // }
        axios.get('/update_service/ethData.json').then(response => {
            if (moment(new Date(response.data.lastPayoutTime)).diff(moment(new Date(response.data.roundTime))) < 60000 && this.state.resultStatusMsg === false) {
                this.setState({
                    resultStatusMsg: true
                });
                let betWon;
                if (response.data.lastWinningBet === 1)
                    betWon = 'Down';
                else if (response.data.lastWinningBet === 0)
                    betWon = 'Tie'
                else
                    betWon = 'Up';
                alert('Round has finished, the winning bet was: ' + betWon);
            }
        });
    }

    handleBet = (e) => {
        if (this.state.inputValue >= 0.005)
        {
            //disable click on elements until bet accepted
            this.changeBtnStateTrue();
            this.setState({
                betting: true  
            })
            //do not proceed if the field is empty, set inline message
            let formErrors = this.state.formErrors ;
            if (this.state.inputValue === '') {
                formErrors.inputValueE ="Please enter a bet value";
                this.setState({ 
                    formErrors,
                });
                this.changeBtnStateFalse();
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
                                if (web3.utils.fromWei(balance,'ether') < parseFloat(this.state.inputValue.replace(",", "."))) {
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
                                                    // save bet to local storage
                                                    let myBets;
                                                    if (localStorage.getItem('bets')) {
                                                        myBets = JSON.parse(localStorage.getItem('bets'));
                                                    } else {
                                                        myBets = [];
                                                    }
                                                    myBets.push({
                                                        'betType': placedBetNumber,
                                                        'betTime': new Date()
                                                    });
                                                    localStorage.setItem('bets', JSON.stringify(myBets));
                                                    this.changeBtnStateFalse();
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
        else
        {
            alert('Ne mozes da se kladis Veljo stipso')
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
                    <div className="col-sm-3">
                        {
                            parseFloat(this.state.inputValue.replace(",",".")) > 0 
                            && this.state.inputValue !== ''?
                                <p className="possibleWin">{this.state.possibleUpWinning.toFixed(10)}</p>
                            :null
                        }
                        <button disabled={this.state.disablebutton} className="betup" name="bet up"  onClick={this.handleBet}>Bet up</button>
                    </div>
                    <div className="col-sm-6">
                    {
                            parseFloat(this.state.inputValue.replace(",",".")) > 0 
                            && this.state.inputValue !== ''?
                                <p className="possibleWin">&#8592;  possible win  &#8594;</p>
                            :null
                    }
                    <input id="inputCenteredText" name="inputValue" onChange={this.updateValue} className={formErrors.inputValueE.length > 0 ? "error" : null} type="number" placeholder="Bet value (ETH)" value={this.state.inputValue}/>   
                    <p><sup>* transaction fee is 0.00195 eth</sup></p>
                    {formErrors.inputValueE.length > 0 && (
                        <p className="errorMessage">{formErrors.inputValueE}</p>
                        )}
                    </div>
                    <div className="col-sm-3">{
                            parseFloat(this.state.inputValue.replace(",",".")) > 0 
                            && this.state.inputValue !== ''?
                                <p className="possibleWin">{this.state.possibleDownWinning.toFixed(10)}</p>
                            :null
                        }
                        <button disabled={this.state.disablebutton} className="betdown" name="bet down" onClick={this.handleBet}>Bet down</button>
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
                        <div className="col-sm-6 col-centered">
                            <h2>Accepting bet...</h2>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-sm-2 col-centered">
                            <div className="loader col-centered"></div>
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