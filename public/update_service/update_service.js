const nodeUrl = require('../../src/eth-node-config'),
	request = require('request'),
	fs = require('fs'),
	Web3 = require('web3'),
	compiledContract = require('../../src/truffle/build/contracts/BettingApp.json'),
	web3 = new Web3(nodeUrl.url),
	contractAddress = compiledContract.networks['300'].address,
	contractInstance = new web3.eth.Contract(compiledContract.abi, contractAddress);

let coinbaseAddress = '',
	creatingAddress = false,
	currentTime = {
		'year': '',
		'month': '',
		'day': '',
		'hour': '',
		'minute': '',
		'second': ''
	},
	lastPayoutTime = '',
	betPriceSet = false,
	ethData = {
		'currentEthPrice': '',
		'betEthPrice': '',
		'roundTime': ''
	},
	json_ethHistory = {};

/**
 * Get coinbase address
 */
web3.eth.getCoinbase().then(result => {
	coinbaseAddress = result;
});

/**
 * Set initial eth price values and round time when service is restarted
 */
fs.readFile('ethData.json', function (err, data) {
	var json = JSON.parse(data);
	ethData.currentEthPrice = json.currentEthPrice;
	ethData.betEthPrice = json.betEthPrice;
	ethData.roundTime = json.roundTime;
});

/**
 * Reset ETH history data when service is restarted
 */
fs.writeFile("ethHistory.json", '[]', function (err) {
	const logTime = new Date();
	console.log(logTime + ': ETH history data erased.');
});

/**
 * Create address for new users if there is not enough in the address poll
 */
createNewAddress = () => {
	if (coinbaseAddress != '') {
		contractInstance.methods.getAvailableAddresses().call().then(receipt => {
			console.log('Number of available addresses: ' + receipt);
			if (receipt < 50 && !creatingAddress) {
				creatingAddress = true;
				console.log('Not enough addresses in the pool, creating new address.');
				const pass = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
				web3.eth.personal.newAccount(pass).then(address => {
					const newAddress = address;
					web3.eth.personal.unlockAccount(address, pass, 0).then(() => {
						web3.eth.sendTransaction({ from: coinbaseAddress, to: newAddress, value: web3.utils.toWei("5", "ether") }).then(receipt => {
							console.log('Created new address, gas spent: ' + receipt.gasUsed);
							contractInstance.methods.createNewAddress(newAddress, pass).send({ from: coinbaseAddress, gas: 200000 }).then(receipt => {
								creatingAddress = false;
								console.log('New address is now available, gas spent: ' + receipt.gasUsed);
							});
						});
					});
				});
			}
		});
	}
}

/**
 * Get current ETH price, set the bet price and set round start time
 */
getEthPrice = () => {
	request({
		url: "https://api.bittrex.com/api/v1.1/public/getticker?market=USD-ETH",
		json: true
	}, function (error, response, data) {
		if (!error && response.statusCode === 200) {
			if (typeof data !== 'undefined') {
				ethData.currentEthPrice = parseFloat(data.result.Last.toFixed(2));
				if ((currentTime.minute == 1 ||
					currentTime.minute == 11 ||
					currentTime.minute == 21 ||
					currentTime.minute == 31 ||
					currentTime.minute == 41 ||
					currentTime.minute == 51) &&
					!betPriceSet) {
					ethData.betEthPrice = parseFloat(data.result.Last.toFixed(2));
					ethData.roundTime = currentTime.month + '-' + currentTime.day + '-' + currentTime.year + ' ' + currentTime.hour + ':' + currentTime.minute + ':' + currentTime.second;
					betPriceSet = true;
				}
				json_ethHistory.price = ethData.currentEthPrice;
				json_ethHistory.timestamp = currentTime.month + '/' + currentTime.day + '/' + currentTime.year + ' ' + currentTime.hour + ':' + currentTime.minute + ':' + currentTime.second;
				console.log('Betting against ETH price: ' + ethData.betEthPrice + ' | Current ETH price: ' + ethData.currentEthPrice);
				// save eth price and time data
				const json = JSON.stringify(ethData);
				fs.writeFile("ethData.json", json, function (err) {
					const logTime = new Date();
					// console.log(logTime + ': Data saved.');
				});
				// save eth price history
				fs.readFile('ethHistory.json', function (err, data) {
					let json = JSON.parse(data);
					json.splice(0, json.length - 200);
					json.push(json_ethHistory);
					const new_json = JSON.stringify(json);
					fs.writeFile("ethHistory.json", new_json, function (err) {
						const logTime = new Date();
						// console.log(logTime + ': ETH history data saved.');
					});
				});
			}
		}
	});
}

/**
 * Distribute rewards on time
 */
distributeRewards = () => {
	lastPayoutTime = currentTime.hour + ':' + currentTime.minute;
	let winningBet;
	if (((ethData.currentEthPrice / ethData.betEthPrice - 1) * 100) == 0) {
		winningBet = 0;
	} else if (((ethData.currentEthPrice / ethData.betEthPrice - 1) * 100) < 0) {
		winningBet = 1;
	} else {
		winningBet = 2;
	}
	contractInstance.methods.payWinnigBets(winningBet).send({ from: coinbaseAddress, gas: 500000 }).then(receipt => {
		betPriceSet = false;
		console.log('Rewards distributed, gas spent: ' + receipt.gasUsed);
	});
}

/**
 * Update current time
 */
updateTime = () => {
	setTimeout(updateTime, 1000);
	const time = new Date();
	currentTime.year = time.getYear() + 1900;
	currentTime.month = time.getMonth() + 1;
	currentTime.day = time.getDate();
	currentTime.hour = time.getHours();
	currentTime.minute = time.getMinutes();
	currentTime.second = time.getSeconds();

	if (currentTime.second == 0 || currentTime.second == 30) {
		getEthPrice();
	}

	if ((currentTime.minute == 0 ||
		currentTime.minute == 10 ||
		currentTime.minute == 20 ||
		currentTime.minute == 30 ||
		currentTime.minute == 40 ||
		currentTime.minute == 50) &&
		lastPayoutTime != currentTime.hour + ':' + currentTime.minute) {
		distributeRewards();
		createNewAddress();
	}
}
setTimeout(updateTime, 1000);