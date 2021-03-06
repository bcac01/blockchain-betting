import React, { Component } from 'react';
import axios from 'axios';
import moment from 'moment-timezone';
import nodeUrl from './eth-node-config.json';
import './App.css';
import Web3 from 'web3';
import Signup from './components/signup/Signup';
import Signin from './components/signin/Signin';
import Signout from './components/signout/Signout';
import Dashboard from './components/dashboard/Dashboard';
import EthPrice from './components/ethPrice/EthPrice';
import Graph from './components/graph/Graph';
import Timer from './components/timer/Timer';
import Withdraw from './components/withdraw/Withdraw';

moment.tz.setDefault("Europe/Belgrade");

global.disablebutton = false;
global.roundTime = '';

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
      showServiceMsg: false,
      disablebutton: false,
      showWithdraw: false,
    }
  }

  changeBtnState = () =>{
    global.disablebutton = !global.disablebutton;
  }

  componentDidMount() {
    if (sessionStorage.getItem('username') !== '' && sessionStorage.getItem('username') !== null) {
      this.hideSignin();
    }

    // disable app if node service is down for more than 3 seconds
    this.serviceTimer = setInterval(() => {
      this.checkService();
      if (this.state.showServiceMsg === true)
        clearTimeout(this.serviceTimer);
    }, 1000);
  }

  hideSignin() {
    this.setState({
      showSignin: !this.state.showSignin,
      showSignout: !this.state.showSignout,
      showSignup:!this.state.showSignup,
      showDashboard: !this.state.showDashboard,
      showEthPrice: !this.state.showEthPrice,
      showGraph: !this.state.showGraph,
      showTimer: !this.state.showTimer,
      showWithdraw: !this.state.showWithdraw,
    })
  }

  checkService = () => {
    axios.get('/update_service/serviceTime.json').then(response => {
      if (moment(new Date()).diff(moment(new Date(response.data.updateTime)), 'seconds') >= 5) {
        this.setState({
          showSignin: false,
          showSignout: false,
          showSignup: false,
          showDashboard: false,
          showEthPrice: false,
          showGraph: false,
          showTimer: false,
          showWithdraw: false,
          showServiceMsg: true
        });
        sessionStorage.clear();
      } else {
        // disable bet  on dashboard if round time is invalid
        if (moment(new Date()).diff(moment(new Date(global.roundTime)), 'minutes') < 11 && !this.state.showSignin) {
          this.setState({
            showDashboard: true,
            showTimer: true
          })
        } else {
          this.setState({
            showDashboard: false,
            showTimer: false
          })
        }
      }
    });
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
    if (this.state.showTimer) {
      timer = (<Timer />);
    }

    let withdraw = null;
    if(this.state.showWithdraw) {
      withdraw = (<Withdraw click={this.changeBtnState} view={this.hideSignin.bind(this)}/>);
    }
    let serviceMsg = null;
    if (this.state.showServiceMsg) {
      serviceMsg = (<h1>Service temporarily unavailable, please try again later</h1>);
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
                {graph}
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
            <div className="row">
              <div className="col">
                {withdraw}
              </div>
            </div>
            <div className="row">
              <div className="col">
                {serviceMsg}
              </div>
            </div>
        </div>
      </div>
    );
  }
}

export default App;
