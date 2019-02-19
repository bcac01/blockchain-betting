import React, { Component } from 'react';
import Web3 from 'web3';
import nodeUrl from '../../eth-node-config.json';
import compiledContract from '../../truffle/build/contracts/BettingApp.json';

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

class Withdraw extends Component {
    
    constructor(withdrawProps) {
        super(withdrawProps)  
        this.state = {
            inputValue: '',
            inputAddress: '',
            successAlert: false,
            successInfo: false,
            successError: false,
            formErrorsValue: {
            inputValue: "",
            },
            formErrorsAddress: {
                inputAddress:"",
            }
        }
    }
    ErrorFalse = () => {
        this.setState({
            successError: false,
        })
    }
    InfoFalse = () => {
        this.setState({
            successInfo: false,
        })
    }
    succesFalse = () => {
        this.setState({
            successAlert: false,
        })
    }
    // update value state
    updateAddress = (e) => {
    e.preventDefault();

     const { value } = e.target;
     let formErrorsAddress = { ...this.state.formErrorsAddress };

     formErrorsAddress.inputAddress = value.length === 0 ? "Please enter wallet address" : "";
     this.setState({ formErrorsAddress, inputAddress: value });
    }

    updateValue = (e) => {
        e.preventDefault();
    
         const { value } = e.target;
         let formErrorsValue = { ...this.state.formErrorsValue };
    
         formErrorsValue.inputValue = value.length === 0 ? "Please enter value" : "";
         this.setState({ formErrorsValue, inputValue: value });
        }
    handleWithward = (e) => {
    //disable click on elements until bet accepted
    const { click } = this.props;
    click();
    let formErrorsAddress = { ...this.state.formErrorsAddress };
    let formErrorsValue = { ...this.state.formErrorsValue };
        if (this.state.inputAddress === '' || this.state.inputValue === '') {
            if (this.state.inputAddress === '')
            {
                formErrorsAddress.inputAddress ="Please enter wallet address";
                this.setState({ 
                    formErrorsAddress,
                })
                click();
            }
            else
            {
                formErrorsValue.inputValue ="Please enter value";
                this.setState({ 
                    formErrorsValue,
                });
                click();
            }
            return;
        }
        else
        {
            if (sessionStorage.getItem('address').toUpperCase() !== this.state.inputAddress.toUpperCase())
            {
                this.setState({
                    successInfo: !this.state.successInfo
                })
                if (this.state.successError)
                {
                    this.setState({
                        successError: false
                    })
                }
                if (this.state.successAlert)
                {
                    this.setState({
                        successAlert: false
                    })
                }
                contractInstance.methods.getAddressPass(sessionStorage.getItem('address')).call({ from: coinbaseAddress }).then((addressPass) => {
                web3.eth.personal.unlockAccount(sessionStorage.getItem('address'), addressPass, 120).then(() => {
                web3.eth.sendTransaction({ from: sessionStorage.getItem('address'), 
                to: this.state.inputAddress, value: web3.utils.toWei(this.state.inputValue, "ether") })
                .then(() => {
                    this.setState({
                        successAlert: !this.state.successAlert,
                        successInfo: !this.state.successInfo,
                    })
                    click();
                })
                .catch((err) => {
                    click();
                    this.setState({
                        successInfo: !this.state.successInfo,
                        successError: true
                    })
                    console.log("Failed with error: " + err);
                });
                })})
            }
            else
            { 
                click();
                this.setState({
                    successError: true
                })
            }
        }
    }

    render() {
        const { formErrorsAddress } = this.state;
        const { formErrorsValue } = this.state;
        return (
            <div className="withdraw-wrapper col mt-2">
                {
                    this.state.successAlert?
                        <div className="row">
                            <div className="alert alert-success alert-dismissible col">
                            <a href="#0" onClick={this.succesFalse} className="close" data-dismiss="alert" aria-label="close">&times;</a>
                                <strong>Money sent!</strong>
                            </div>
                        </div>
                    :null
                }
                {
                    this.state.successInfo?
                        <div className="row">
                            <div className="alert alert-info alert-dismissible col">
                            <a href="#0" onClick={this.InfoFalse} className="close" data-dismiss="alert" aria-label="close">&times;</a>
                                <strong>Info!</strong> Please wait until money is transfered
                            </div>
                        </div>
                    :null
                }
                {
                    this.state.successError?
                        <div className="row">
                            <div className="col alert alert-danger alert-dismissible col">
                                <a href="#0" onClick={this.ErrorFalse} className="close" data-dismiss="alert" aria-label="close">&times;</a>
                                <strong>Error!</strong> Can't send funds to this address
                            </div>
                        </div>
                    :null
                }
                <div className="row">
                        <div className="col-sm-6">
                            <input onChange={this.updateAddress} 
                            className={formErrorsAddress.inputAddress.length > 0 ? "error" : null} 
                            type="text" placeholder="Wallet address"/>
                                {formErrorsAddress.inputAddress.length > 0 && (
                                <p className="errorMessage">{formErrorsAddress.inputAddress}</p>
                                )}
                        </div>
                        <div className="col-sm-3">
                            <input onChange={this.updateValue} 
                            className={formErrorsValue.inputValue.length > 0 ? "error" : null} 
                            type="number" placeholder="Withard value"/>
                                {formErrorsValue.inputValue.length > 0 && (
                                <p className="errorMessage">{formErrorsValue.inputValue}</p>
                                )}
                        </div>
                    <div className="col-sm-3">
                        <button disabled={global.disablebutton} className="betup" 
                        name="withdrow money"  onClick={this.handleWithward}>Withdraw</button>
                    </div>
                </div>
            </div>
        )
    }
}
export default Withdraw;