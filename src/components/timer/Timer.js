import React, { Component } from 'react';
import ethData from '../../update_service/ethData.json';
import moment from 'moment';

class Timer extends Component {

    constructor(props) {
        super(props)
        this.state = {
            timeStart: '',
            timeEnd: '',
            timeRemaining: ''
        }
    }

    componentDidMount() {
        /**
         * Set remaining time to 0 in last 10 minutes of the round
         */
        let fixedRemainingTime = 0;
        if (moment(new Date(ethData.roundTime)).add(18, 'minutes').diff(moment(new Date())) > 0)
            fixedRemainingTime = moment(new Date(ethData.roundTime)).add(18, 'minutes').diff(moment(new Date()));
        
        this.setState({
            timeStart: moment(new Date(ethData.roundTime)).format('DD/MMM/YYYY HH:mm'),
            timeEnd: moment(new Date(ethData.roundTime)).add(28, 'minutes').format('DD/MMM/YYYY HH:mm'),
            timeRemaining: fixedRemainingTime
        });

        /**
         * Recalculate and update times every second
         */
        setInterval(() => {
            if (moment(new Date(ethData.roundTime)).add(18, 'minutes').diff(moment(new Date())) > 0)
                fixedRemainingTime = moment(new Date(ethData.roundTime)).add(18, 'minutes').diff(moment(new Date()));
            this.setState({
                timeStart: moment(new Date(ethData.roundTime)).format('DD/MMM/YYYY HH:mm'),
                timeEnd: moment(new Date(ethData.roundTime)).add(28, 'minutes').format('DD/MMM/YYYY HH:mm'),
                timeRemaining: fixedRemainingTime
            });
        }, 1000);
    }

    render() {
        return(
            <div className="timer-wrapper col">
                <div className="row">
                    <div className="col-sm-6 column-in-center">
                        <h2>Time remaining for bets:</h2>
                        <h2>{moment(this.state.timeRemaining).format('mm:ss')}</h2>
                    </div>
                </div>
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