import React, { Component } from 'react';
import axios from 'axios';
import moment from 'moment';

class Timer extends Component {

    constructor(props) {
        super(props)
        this.state = {
            timeStart: '',
            timeEnd: '',
            timeRemaining: '',
            roundTime: '',
            roundTimeUpdated: false
        }
    }

    componentDidMount() {
        this.updateRoundTime();
        this.updateTimes();
        this.timer = setInterval(() => {
            this.updateTimes();
            const currentTimeMinute = moment(new Date()).get('minute');
            if ((currentTimeMinute === 1 ||
                currentTimeMinute === 11 ||
                currentTimeMinute === 21 ||
                currentTimeMinute === 31 ||
                currentTimeMinute === 41 ||
                currentTimeMinute === 51) &&
                !this.state.roundTimeUpdated) {
                    this.updateRoundTime();
            } else {
                this.setState({
                    roundTimeUpdated: false
                })
            }
        }, 1000);
    }

    /**
     * Get current round time
     */
    updateRoundTime = () => {
        axios.get('/update_service/ethData.json').then(response => {
            if ((moment(new Date(response.data.roundTime)).diff(moment(new Date(this.state.roundTime))) !== 0)) {
                this.setState({
                    roundTime: response.data.roundTime,
                    roundTimeUpdated: true
                });
            }
            // filter bets storage
            let filterdBets = JSON.parse(localStorage.getItem('bets')).filter(bet => {
                return moment(new Date(response.data.roundTime)).diff(moment(new Date(bet.betTime))) <= 0;
            });
            localStorage.setItem('bets', JSON.stringify(filterdBets));
        });
    }

    /**
     * Recalculate and update times every second
     */
    updateTimes = () => {
        if (moment(new Date(this.state.roundTime)).add(10, 'minutes').diff(moment(new Date())) > 0) {
            this.setState({
                timeRemaining: moment(new Date(this.state.roundTime)).add(8, 'minutes').diff(moment(new Date())),
                timeReal: moment(new Date(this.state.roundTime)).add(9, 'minutes').diff(moment(new Date())),
                timeToNextRound: moment(new Date(this.state.roundTime)).add(10, 'minutes').diff(moment(new Date()))
            });
        }
        this.setState({
            timeStart: moment(new Date(this.state.roundTime)).format('DD/MMM/YYYY HH:mm'),
            timeEnd: moment(new Date(this.state.roundTime)).add(9, 'minutes').format('DD/MMM/YYYY HH:mm')
        });
    }

    componentWillUnmount = () => {
        clearTimeout(this.timer);
    };

    render() {
        return(
            <div className="timer-wrapper col">
            {
                (this.state.timeReal > 61000)?
                <div className="row">
                    <div className="col-sm-6 column-in-center">
                        <h2>Time remaining for bets:</h2>
                        <h2>{moment(this.state.timeRemaining).format('mm:ss')}</h2>
                    </div>
                </div>
                :null
            }
            {
                (this.state.timeReal <= 61000 && this.state.timeReal >= 1000)?
                <div className="row">
                    <div className="col-sm-6 column-in-center">
                        <h2 className="h2Red">Wait until round is finished</h2>
                        <h2 className="h2Red">{moment(this.state.timeReal).format('mm:ss')}</h2>
                    </div>
                </div>
                :null
            }
            {
                (this.state.timeReal < 1000)?
                <div className="row">
                    <div className="col-sm-6 column-in-center">
                        <h2 className="h2Yellow">New round starts in</h2>
                        <h2 className="h2Yellow">{moment(this.state.timeToNextRound).format('mm:ss')}</h2>
                    </div>
                </div>
                :null
            }
                <div className="row">
                    <div className="col-sm-6">
                        <h1>Round stared at:</h1>
                        <h1>{this.state.timeStart}</h1>
                    </div>
                    <div className="col-sm-6">
                        <h1>Round will be finished at:</h1>
                        <h1>{this.state.timeEnd}</h1>
                    </div>
                </div>
            </div>
        )
    }
}

export default Timer;