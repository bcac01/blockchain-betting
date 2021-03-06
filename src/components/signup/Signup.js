import React, { Component } from 'react';
import nodeUrl from '../../eth-node-config.json';
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

class Signup extends Component {

    state = {
        inputUsername: '',
        inputPassword: '',
        disablebutton: false,
        successAlert: false,
        infoAlert: false,
        dangerAlert: false,
        dangerAlertUsername: false
    };

    // update username state
    updateUsername = (e) => {
        this.setState({
            inputUsername: e.target.value
        });
    }

    // update password state
    updatePassword = (e) => {
        this.setState({
            inputPassword: e.target.value
        });
    }

    clearFields = () => {
        this.setState({
            inputUsername: '',
            inputPassword: '',
        })
            this.inputUsernameVal.value = "";
            this.inputPasswordVal.value = "";
    }

    
    dangerAlertState = () => {
        this.setState({
            dangerAlert :false
        })
    }

    dangerAlertUsernameState = () => {
        this.setState({
            dangerAlertUsername :false
        })
    }
    /**
     * Create new account
     */
    createNewAccount = () => {
        const pass = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        web3.eth.personal.newAccount(pass).then(address => {
            const newAddress = address;
            web3.eth.personal.unlockAccount(newAddress, pass, 120).then(() => {
                web3.eth.sendTransaction({ from: coinbaseAddress, to: newAddress, value: web3.utils.toWei("5", "ether") });
                    contractInstance.methods.createNewAddress(newAddress, pass).send({ from: coinbaseAddress, gas: 200000 });
                    this.setState({
                        infoAlert: !this.state.infoAlert
                    });
            });
        });
    }

    signUp = () => {
        //successAlert remove on begining
        this.setState({
            successAlert: false
        });
        // check if there is empty field
        if (this.state.inputUsername === '' || this.state.inputPassword === '') {
            this.setState({
                dangerAlert: true,
                dangerAlertUsername: false,
                infoAlert: false,
                successAlert: false,
            })
            return;
        }
        //disable click on elements until sign up return value
        this.setState({
            disablebutton: !this.state.disablebutton
        });
        // check if username exist
        contractInstance.methods.checkIfUserExist(this.state.inputUsername).call().then(receipt => {
            if (!receipt) {
                // check if there is available address
                contractInstance.methods.getAvailableAddresses().call().then((receipt) => {
                    if (receipt > 0) {
                        // register user
                        contractInstance.methods.registerUser(this.state.inputUsername, this.state.inputPassword)
                        .send({ from: coinbaseAddress, gas: 200000 }).then(
                            ()=>
                            {
                                this.setState({
                                    disablebutton: !this.state.disablebutton
                                });
                                this.setState({
                                    successAlert: !this.state.successAlert,
                                    dangerAlert: false,
                                    dangerAlertUsername: false,
                                });
                                this.clearFields();
                            }
                        );
                    } else {
                        this.setState({
                            infoAlert: !this.state.infoAlert,
                            dangerAlert: false,
                            dangerAlertUsername: false,
                        });
                        // create new account that will be available for new users 
                        this.createNewAccount();
                        this.setState({
                            infoAlert: !this.state.infoAlert
                        });
                        this.clearFields();
                        this.setState({
                            disablebutton: !this.state.disablebutton
                        });
                    }
                });
            } else {
                this.clearFields();
                this.setState({
                    disablebutton: !this.state.disablebutton,
                    dangerAlertUsername: true
                });
            }
        });
    }

    render() {
        return (
            <div className="signup-wrapper">
                <h1>Register For An Account</h1>
                <p>Insert username and password to register new account.</p>
                <input  onChange={this.updateUsername} className="usernamesu" 
                type="text" placeholder="Username" ref={el => this.inputUsernameVal = el}/>
                <div>
                  <p className="usernamesu-help">Please enter your username.</p>
                </div>
                <input onChange={this.updatePassword} className="passwordsu"
                type="password" placeholder="Password" ref={el => this.inputPasswordVal = el}/>
                <div>
                  <p className="passwordsu-help">Please enter your password.</p>
                </div>
                <button disabled={this.state.disablebutton} type="submit" onClick={this.signUp}>Sign up</button>
                {
                    this.state.disablebutton?
                    <div className="loading-wrapper">
                        <div className="row">
                            <div className="col-sm-6 col-centered">
                                <h2>Signing up...</h2>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-sm-3 col-centered">
                                <div className="loader col-centered"></div>
                            </div>
                        </div>
                    </div>
                :null
                }
                {
                    this.state.successAlert?
                        <div className="row">
                            <div className="alert alert-success col">
                            <a href="#0" className="close" data-dismiss="alert" aria-label="close">&times;</a>
                                <strong>Welcome!</strong> Account successfully created.
                            </div>
                        </div>
                    :null
                }
                {
                    this.state.successInfo?
                        <div className="row">
                            <div className="alert alert-info col">
                            <a href="#0" className="close" data-dismiss="alert" aria-label="close">&times;</a>
                                <strong>Info!</strong> Please wait until new address is genereted
                            </div>
                        </div>
                    :null
                }
                {
                    this.state.dangerAlert?
                        <div className="row">
                            <div className="alert alert-danger col">
                            <a href="#0" onClick={this.dangerAlertState} className="close" data-dismiss="alert" aria-label="close">&times;</a>
                                Please insert username and password
                            </div>
                        </div>
                    :null
                }
                {
                    this.state.dangerAlertUsername?
                        <div className="row">
                            <div className="alert alert-danger col">
                            <a href="#0" onClick={this.dangerAlertUsernameState} className="close" data-dismiss="alert" aria-label="close">&times;</a>
                                Username already exists
                            </div>
                        </div>
                    :null
                }
            </div>
        );
    }
}

export default Signup;