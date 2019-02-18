import React, { Component } from 'react';
import nodeUrl from './eth-node-config.json';
import './App.css';
import Web3 from 'web3';
import compiledContract from './truffle/build/contracts/BettingApp.json';
import Signup from './components/signup/Signup';
import Signin from './components/signin/Signin';
import Signout from './components/signout/Signout';
import Dashboard from './components/dashboard/Dashboard';
import EthPrice from './components/ethPrice/EthPrice';
import Graph from './components/graph/Graph';
import Timer from './components/timer/Timer';

global.disablebutton = false;
/**
 * Create web3 instance
 */
const web3 = new Web3(nodeUrl.url);

/**
 * Unlock coinbase address
 */
web3.eth.getCoinbase().then(result => {
  const coinbaseAddress = result;
  web3.eth.personal.unlockAccount(coinbaseAddress, 'koliko', 0);
});

/**
 * Get address from compiled contract
 */
const contractAddress = compiledContract.networks['300'].address;

/**
 * Get contract balance
 */
web3.eth.getBalance(contractAddress, function (err, balance) {
  if (err) {
    console.error(err);
  } else {
    console.log('Contract address: ' + contractAddress);
    console.log('Contract balance: ' + web3.utils.fromWei(balance, 'ether') + ' eth');
  }
});

/**
 * List all accounts with their balance
 */
// web3.eth.getAccounts().then(result => {
  // result.forEach(address => {
    // web3.eth.getBalance(address).then(balance => {
      // console.log('Address: ' + address + ', balance: ' + web3.utils.fromWei(balance, 'ether') + ' ether');
    // });
  // });
// });

class App extends Component {

  constructor(props){
    super(props);
    this.state = {
      showSignup: true,
      showSignin: true,
      showDashboard: false,
      showEthPrice: false,
      showSignout: false,
      showGraph: false,
      showTimer: false,
      disablebutton: false,
    }
  }

  changeBtnState = () =>{
    global.disablebutton = !global.disablebutton;
  }

  componentDidMount() {
    if (sessionStorage.getItem('username') !== '' && sessionStorage.getItem('username') !== null) {
      this.hideSignin();
    }
  }

  hideSignin() {
    this.setState({
      showSignin: !this.state.showSignin,
      showSignout: !this.state.showSignout,
      showSignup:!this.state.showSignup,
      showDashboard: !this.state.showDashboard,
      showEthPrice: !this.state.showEthPrice,
      showGraph: !this.state.showGraph,
      showTimer: !this.state.showTimer
    })
  }

  render() {
    let signup = null;
    if (this.state.showSignup) {
      signup = (<Signup view={this.hideSignin.bind(this)}/>);
    }

    let signin = null;
    if (this.state.showSignin) {
      signin = (<Signin view={this.hideSignin.bind(this)}/>);
    }

    let signout = null;
    if (this.state.showSignout) {
      signout = (<Signout view={this.hideSignin.bind(this)}/>);
    }

    let dashboard = null;
    if (this.state.showDashboard) {
      dashboard = (<Dashboard click={this.changeBtnState} view={this.hideSignin.bind(this)}/>);
    }
    
    let ethPrice = null;
    if (this.state.showEthPrice) {
      ethPrice = (<EthPrice view={this.hideSignin.bind(this)}/>);
    }

    let graph = null;
    if (this.state.showGraph) {
      graph = (<Graph view={this.hideSignin.bind(this)}/>);
    }

    let timer = null;
    if(this.state.showTimer) {
      timer = (<Timer />);
    }

    return (
      <div className="App">
        <div className="container">
            <div className="row">
              {signout}
            </div>
            <div className="row">
              <div className="col-sm-6">
                {signup}
              </div>
              <div className="col-sm-6">
                {signin}
              </div>
            </div>
            <div className="row">
              <div className="col">
                {ethPrice}
              </div>
            </div>
            <div className="row">
              <div className="col">
                {graph}
              </div>
            </div>
            <div className="row">
              <div className="col">
                {dashboard}
              </div>
            </div>
            <div className="row">
              <div className="col">
                {timer}
              </div>
            </div>
        </div>
      </div>
    );
  }
}

export default App;
