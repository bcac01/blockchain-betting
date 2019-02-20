import React, { Component } from 'react';
import axios from 'axios';
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

        let fixedRemainingTime = 0;
        let fixedRealTime = 0;
        axios.get('/update_service/ethData.json').then(response => {

            /**
             * Set remaining time to 0 in last 10 minutes of the round
             */
            if (moment(new Date(response.data.roundTime)).add(8, 'minutes').diff(moment(new Date())) > 0)
            {
                fixedRemainingTime = moment(new Date(response.data.roundTime)).add(8, 'minutes').diff(moment(new Date()));
                fixedRealTime = moment(new Date(response.data.roundTime)).add(10, 'minutes').diff(moment(new Date()));
            }
                
            this.setState({
                timeStart: moment(new Date(response.data.roundTime)).format('DD/MMM/YYYY HH:mm'),
                timeEnd: moment(new Date(response.data.roundTime)).add(9, 'minutes').format('DD/MMM/YYYY HH:mm'),
                timeRemaining: fixedRemainingTime,
                timeReal: fixedRealTime
            });
            
        });

        /**
         * Recalculate and update times every second
         */
        this.timer = setInterval(() => {
            axios.get('/update_service/ethData.json').then(response => {
                if (moment(new Date(response.data.roundTime)).add(9, 'minutes').diff(moment(new Date())) > 0)
                {
                    fixedRemainingTime = moment(new Date(response.data.roundTime)).add(8, 'minutes').diff(moment(new Date()));
                    fixedRealTime = moment(new Date(response.data.roundTime)).add(10, 'minutes').diff(moment(new Date()));
                }
                    
                
                    this.setState({
                    timeStart: moment(new Date(response.data.roundTime)).format('DD/MMM/YYYY HH:mm'),
                    timeEnd: moment(new Date(response.data.roundTime)).add(9, 'minutes').format('DD/MMM/YYYY HH:mm'),
                    timeRemaining: fixedRemainingTime,
                    timeReal: fixedRealTime,
                });
                console.log(this.state.timeReal);
            });
        }, 1000);
    }

    componentWillUnmount = () => {
        clearTimeout(this.timer);
    };

    render() {
        return(
            <div className="timer-wrapper col">
            {
                (this.state.timeReal > 71000)?
                <div className="row">
                    <div className="col-sm-6 column-in-center">
                        <h2>Time remaining for bets:</h2>
                        <h2>{moment(this.state.timeRemaining).format('mm:ss')}</h2>
                    </div>
                </div>
                :null
            }
            {
                (this.state.timeReal < 71000 && this.state.timeReal > 20000)?
                <div className="row">
                    <div className="col-sm-6 column-in-center">
                        <h2 className="h2Red">Wait until round is finished</h2>
                        <h2 className="h2Red">{moment(this.state.timeReal).format('mm:ss')}</h2>
                    </div>
                </div>
                :null
            }
            {
                (this.state.timeReal < 10000)?
                <div className="row">
                    <div className="col-sm-6 column-in-center">
                        <h2 className="h2Yellow">Wait until next round</h2>
                        <h2 className="h2Yellow">{moment(this.state.timeReal).format('mm:ss')}</h2>
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