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


class Signin extends Component {

    constructor(props) {
        super(props);
        this.state = 
        {     
            inputUsername: '',
            inputPassword: '',
            disablebutton: false,
        };
      }

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

    signIn = () => {
        // check if there is empty field
        if (this.state.inputUsername === '' || this.state.inputPassword === '') {
            alert('Username or password field is empty');
            return;
        }
        //disable click on elements until sign in return value
        this.setState({
            disablebutton: !this.state.disablebutton
        });
        // log in user 
        contractInstance.methods.logIn(this.state.inputUsername, this.state.inputPassword).call().then(receipt => {
            if (receipt) {
                sessionStorage.setItem('username', this.state.inputUsername);
                sessionStorage.setItem('password', this.state.inputPassword);
                this.setState({
                    disablebutton: !this.state.disablebutton
                });
                // get logged in user's address
                contractInstance.methods.getUserLoggedInAddress(this.state.inputUsername, this.state.inputPassword).call().then(receipt => {
                    if (receipt) {
                        sessionStorage.setItem('address', receipt);
                        this.props.view();
                    }
                })
            } else {
                sessionStorage.clear();
                this.setState({
                    disablebutton: !this.state.disablebutton
                });
                alert('Wrong username or password');
            }
        });
    }
    render() {
        return (
            <div className="signin-wrapper">
              <h1>Already have an account</h1>
              <p>Insert username and password to sign in.</p>
                <input onChange={this.updateUsername} className="usernamesi" type="text" placeholder="Username"/>
                <div>
                  <p className="usernamesi-help">Please enter your username.</p>
                </div>
                <input onChange={this.updatePassword} className="passwordsi" type="password" placeholder="Password"/>
                 <div>
                  <p className="passwordsi-help">Please enter your password.</p>
                </div>
                <button disabled={this.state.disablebutton} type="submit" onClick={this.signIn}>Sign in</button>
                
            </div>
        );
    }
}

export default Signin;