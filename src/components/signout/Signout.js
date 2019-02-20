import React, { Component } from 'react';

class Signout extends Component {

    signOut = () => {
        if (global.disablebutton === false)
        {
            this.props.view();
            sessionStorage.clear();
        }
    }

    render() {
        return (
            <div className="col-sm-12">
                <button className="signout pull-right" onClick={this.signOut}>Sign out</button>
            </div>
        );
    }
}

export default Signout;