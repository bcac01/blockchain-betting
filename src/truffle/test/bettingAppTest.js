let BettingApp = artifacts.require("src/truffle/contracts/BettingApp.sol");

contract('BettingApp', (accounts) => {
    let contractOwner = accounts[0];
    let firstUserAddress = accounts[1];

    it('should revert the transaction of registerUser when an invalid address calls it', () => {
        return BettingApp.deployed()
          .then(instance => {
            return instance.registerUser(firstUserAddress, {from:contractOwner});
          })
          .then(result => {
            assert.fail();
          })
          .catch(error => {
            assert.notEqual(error.message, "assert.fail()", "Transaction was not reverted with an invalid address");
          });
      });

    it('should revert the transaction of createNewAddress when an invalid address calls it', () => {
        return BettingApp.deployed()
          .then(instance => {
            return instance.createNewAddress(firstUserAddress, {from:contractOwner});
          })
          .then(result => {
            assert.fail();
          })
          .catch(error => {
            assert.notEqual(error.message, "assert.fail()", "Transaction was not reverted with an invalid address");
          });
    });

    it('should not revert the transaction of getAddressPass by the creator address', () => {
        let bettingAppInstance;
        return BettingApp.deployed()
          .then(instance => {
            bettingAppInstance = instance;
            return bettingAppInstance.getAddressPass(creatorAddress);
          })
          .then(result => {
              assert.fail();
          })
          .catch(error => {
            assert.fail("Transaction was reverted by a creator call");
          });
    });

    it('should revert the transaction of purchaseBet when an invalid address calls it', () => {
        return BettingApp.deployed()
          .then(instance => {
            return instance.purchaseBet(firstUserAddress, {from:contractOwner});
          })
          .then(result => {
            assert.fail();
          })
          .catch(error => {
            assert.notEqual(error.message, "assert.fail()", "Transaction was not reverted with an invalid address");
          });
    });


});