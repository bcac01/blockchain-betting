const nodeUrl = require('../../src/eth-node-config'),
	request = require('request'),
	fs = require('fs'),
	Web3 = require('web3'),
	moment = require('moment-timezone'),
	compiledContract = require('../../src/truffle/build/contracts/BettingApp.json'),
	web3 = new Web3(nodeUrl.url),
	contractAddress = compiledContract.networks['300'].address,
	contractInstance = new web3.eth.Contract(compiledContract.abi, contractAddress);

let coinbaseAddress = '',
	availableAddresses = 0,
	creatingAddress = false,
	currentTime = {
		'year': '',
		'month': '',
		'day': '',
		'hour': '',
		'minute': '',
		'second': ''
	},
	betPriceSet = false,
	ethData = {
		'currentEthPrice': '',
		'betEthPrice': '',
		'roundTime': '',
		'lastWinningBet': 0,
		'lastPayoutTime': ''
	},
	json_ethHistory = {},
	serviceTime = {
		'updateTime': ''
	};

/**
 * Get coinbase address
 */
web3.eth.getCoinbase().then(result => {
	coinbaseAddress = result;
}).catch(err => {
	const logTime = moment().tz("Europe/Belgrade").format();
	console.log(logTime + ': ' + err);
	console.log('------------------------');
});

/**
 * Set initial eth data when service is restarted
 */
fs.readFile('ethData.json', function (err, data) {
	try {
		JSON.parse(data);
		let json = JSON.parse(data);
		ethData.currentEthPrice = json.currentEthPrice;
		ethData.betEthPrice = json.betEthPrice;
		ethData.roundTime = json.roundTime;
		ethData.lastWinningBet = json.lastWinningBet;
		ethData.lastPayoutTime = json.lastPayoutTime;
	} catch (err) {
		if (err) {
			const logTime = moment().tz("Europe/Belgrade").format();
			console.log(logTime + ': ' + err);
			console.log('------------------------');
		}
	}
});

/**
 * Reset ETH history data when service is restarted
 */
fs.writeFile("ethHistory.json", '[]', function (err) {
	const logTime = moment().tz("Europe/Belgrade").format();
	console.log(logTime);
	console.log('ETH history data erased.');
	console.log('------------------------');
});

/**
 * Create address for new users if there is not enough in the address poll
 */
createNewAddress = () => {
	if (coinbaseAddress != '') {
		contractInstance.methods.getAvailableAddresses().call().then(receipt => {
			if (typeof receipt === 'object') {
				availableAddresses = parseInt(receipt.number);
			} else {
				availableAddresses = parseInt(receipt);
			}
			if (availableAddresses < 50 && !creatingAddress) {
				creatingAddress = true;
				console.log('Not enough addresses in the pool, creating new address.');
				console.log('------------------------');
				const pass = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
				web3.eth.personal.newAccount(pass).then(address => {
					const newAddress = address;
					web3.eth.personal.unlockAccount(coinbaseAddress, 'koliko', 120).then(unlocked => {
						if (unlocked) {
							web3.eth.personal.unlockAccount(newAddress, pass, 120).then(unlocked => {
								if (unlocked) {
									web3.eth.sendTransaction({ from: coinbaseAddress, to: newAddress, value: web3.utils.toWei("5", "ether") }).then(receipt => {
										console.log('Created new address, gas spent: ' + parseInt(receipt.gasUsed));
										console.log('------------------------');
										contractInstance.methods.createNewAddress(newAddress, pass).send({ from: coinbaseAddress, gas: 200000 }).then(receipt => {
											creatingAddress = false;
											console.log('New address is now available, gas spent: ' + parseInt(receipt.gasUsed));
											console.log('Number of available addresses: ' + availableAddresses);
											console.log('------------------------');
										}).catch(err => {
											const logTime = moment().tz("Europe/Belgrade").format();
											console.log(logTime + ': ' + err);
											console.log('------------------------');
										});
									}).catch(err => {
										const logTime = moment().tz("Europe/Belgrade").format();
										console.log(logTime + ': ' + err);
										console.log('------------------------');
									});
								}
							}).catch(err => {
								const logTime = moment().tz("Europe/Belgrade").format();
								console.log(logTime + ': ' + err);
								console.log('------------------------');
							});
						}
					}).catch(err => {
						const logTime = moment().tz("Europe/Belgrade").format();
						console.log(logTime + ': ' + err);
						console.log('------------------------');
					});
				}).catch(err => {
					const logTime = moment().tz("Europe/Belgrade").format();
					console.log(logTime + ': ' + err);
					console.log('------------------------');
				});
			}
		}).catch(err => {
			const logTime = moment().tz("Europe/Belgrade").format();
			console.log(logTime + ': ' + err);
			console.log('------------------------');
		});
	}
}

/**
 * Get current ETH price, set the bet price and set round start time
 */
getEthPrice = () => {
	request({
		url: "https://api-pub.bitfinex.com/v2/ticker/tETHUSD",
		json: true
	}, function (error, response, data) {
		if (!error && response.statusCode === 200) {
			if (typeof data !== 'undefined') {
				ethData.currentEthPrice = parseFloat(data[6].toFixed(2));
				if ((currentTime.minute == 1 ||
					currentTime.minute == 11 ||
					currentTime.minute == 21 ||
					currentTime.minute == 31 ||
					currentTime.minute == 41 ||
					currentTime.minute == 51) &&
					!betPriceSet) {
					ethData.betEthPrice = ethData.currentEthPrice;
					ethData.roundTime = currentTime.month + '-' + currentTime.day + '-' + currentTime.year + ' ' + currentTime.hour + ':' + currentTime.minute + ':' + currentTime.second;
					betPriceSet = true;
					const logTime = moment().tz("Europe/Belgrade").format();
					console.log(logTime);
					console.log('New round started, betting against ETH price: ' + ethData.betEthPrice);
					console.log('------------------------');
				}
				json_ethHistory.price = ethData.currentEthPrice;
				json_ethHistory.timestamp = currentTime.month + '/' + currentTime.day + '/' + currentTime.year + ' ' + currentTime.hour + ':' + currentTime.minute + ':' + currentTime.second;
				// save eth price and time data
				const json = JSON.stringify(ethData);
				fs.writeFile("ethData.json", json, function (err) {
					if (err) {
						const logTime = moment().tz("Europe/Belgrade").format();
						console.log(logTime + ': ' + err);
						console.log('------------------------');
					}
				});
				// save eth price history
				fs.readFile('ethHistory.json', function (err, data) {
					let json = JSON.parse(data);
					json.splice(0, json.length - 150);
					json.push(json_ethHistory);
					json = JSON.stringify(json);
					fs.writeFile("ethHistory.json", json, function (err) {
						if (err) {
							const logTime = moment().tz("Europe/Belgrade").format();
							console.log(logTime + ': ' + err);
							console.log('------------------------');
						}
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
	if (coinbaseAddress != '') {
		if (((ethData.currentEthPrice / ethData.betEthPrice - 1) * 100) == 0) {
			ethData.lastWinningBet = 0;
		} else if (((ethData.currentEthPrice / ethData.betEthPrice - 1) * 100) < 0) {
			ethData.lastWinningBet = 1;
		} else {
			ethData.lastWinningBet = 2;
		}
		const json = JSON.stringify(ethData);
		fs.writeFile("ethData.json", json, function (err) {
			if (err) {
				const logTime = moment().tz("Europe/Belgrade").format();
				console.log(logTime + ': ' + err);
				console.log('------------------------');
			}
		});
		const logTime = moment().tz("Europe/Belgrade").format();
		console.log(logTime);
		console.log('Winning bet: ' + ethData.lastWinningBet);
		console.log('------------------------');
		web3.eth.personal.unlockAccount(coinbaseAddress, 'koliko', 120).then(unlocked => {
			if (unlocked) {
				contractInstance.methods.payWinnigBets(ethData.lastWinningBet).send({ from: coinbaseAddress, gas: 5000000 }).then(receipt => {
					betPriceSet = false;
					const logTime = moment().tz("Europe/Belgrade").format();
					console.log(logTime);
					console.log('Rewards distributed, gas spent: ' + parseInt(receipt.gasUsed));
					console.log('------------------------');
				}).catch(err => {
					const logTime = moment().tz("Europe/Belgrade").format();
					console.log(logTime + ': ' + err);
					console.log('------------------------');
				});
			}
		}).catch(err => {
			const logTime = moment().tz("Europe/Belgrade").format();
			console.log(logTime + ': ' + err);
			console.log('------------------------');
		});
	}
}

/**
 * Update current time
 */
updateTime = () => {
	setTimeout(updateTime, 1000);
	const time = moment().tz("Europe/Belgrade");
	currentTime.year = time.get('year');
	currentTime.month = time.get('month') + 1;
	currentTime.day = time.get('date');
	currentTime.hour = time.get('hour');
	currentTime.minute = time.get('minute');
	currentTime.second = time.get('second');

	// set node service update time
	serviceTime.updateTime = currentTime.month + '-' + currentTime.day + '-' + currentTime.year + ' ' + currentTime.hour + ':' + currentTime.minute + ':' + currentTime.second;
	let json = JSON.stringify(serviceTime);
	fs.writeFile("serviceTime.json", json, function (err) {
		if (err) {
			const logTime = moment().tz("Europe/Belgrade").format();
			console.log(logTime + ': ' + err);
			console.log('------------------------');
		}
	});

	if (currentTime.second == 0 ||
		currentTime.second == 12 ||
		currentTime.second == 24 ||
		currentTime.second == 36 ||
		currentTime.second == 48) {
		getEthPrice();
		createNewAddress();
	}

	if ((currentTime.minute == 0 ||
		currentTime.minute == 10 ||
		currentTime.minute == 20 ||
		currentTime.minute == 30 ||
		currentTime.minute == 40 ||
		currentTime.minute == 50) &&
		ethData.lastPayoutTime != currentTime.month + '-' + currentTime.day + '-' + currentTime.year + ' ' + currentTime.hour + ':' + currentTime.minute) {
		ethData.lastPayoutTime = currentTime.month + '-' + currentTime.day + '-' + currentTime.year + ' ' + currentTime.hour + ':' + currentTime.minute;
		// check if there are bets and distribute rewards
		contractInstance.methods.hasPlayers().call({ from: coinbaseAddress }).then(receipt => {
			if (receipt) {
				distributeRewards();
			}
		});
	}

	
}
setTimeout(updateTime, 1000);