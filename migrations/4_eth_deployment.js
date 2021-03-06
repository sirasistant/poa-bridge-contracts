const POA20 = artifacts.require("./ERC677BridgeToken.sol");
const BridgeValidators = artifacts.require("./BridgeValidators.sol");
const HomeBridge = artifacts.require("./HomeBridgeNativeToErc.sol");
const ForeignBridge = artifacts.require("./ForeignBridgeNativeToErc.sol");
const EternalStorageProxy = artifacts.require('EternalStorageProxy')

module.exports = async function(deployer, network, accounts) {
  const ACCOUNT_INDEX = 2;
  const VALIDATORS = process.env.VALIDATORS ? process.env.VALIDATORS.split(" ") : [accounts[ACCOUNT_INDEX]];
  const REQUIRED_NUMBER_OF_VALIDATORS = process.env.REQUIRED_VALIDATORS || VALIDATORS.length
  const PROXY_OWNER = process.env.PROXY_OWNER || accounts[ACCOUNT_INDEX];
  const homeDailyLimit = process.env.HOME_LIMIT || '1000000000000000000000000' // 1000000 ether
  const foreignDailyLimit = process.env.FOREIGN_LIMIT || '1000000000000000000000000' // 1000000 ether
  const MAX_AMOUNT_PER_TX = process.env.MAX_AMOUNT_PER_TX || '1000000000000000000000' // 1000 ether
  const MIN_AMOUNT_PER_TX = process.env.MIN_AMOUNT_PER_TX || '10000000000000000' // 0.01 ether
  const HOME_REQUIRED_BLOCK_CONFIRMATIONS = process.env.HOME_REQUIRED_BLOCK_CONFIRMATIONS || '3'
  const HOME_GAS_PRICE = process.env.HOME_GAS_PRICE || '1000000000';
  const FOREIGN_GAS_PRICE = process.env.FOREIGN_GAS_PRICE || '1000000000';
  const FOREIGN_REQUIRED_BLOCK_CONFIRMATIONS = process.env.FOREIGN_REQUIRED_BLOCK_CONFIRMATIONS || '3';

  if(network === 'rinkeby'){
    if(!PROXY_OWNER){
      throw new Error("You need a second address for deployment, not coinbase");
    }
    console.log('storage for foreign validators')
    await deployer.deploy(EternalStorageProxy, {from: PROXY_OWNER});
    const storageBridgeValidators = await EternalStorageProxy.deployed()

    console.log('deploying validators')
    await deployer.deploy(BridgeValidators);
    const validatorContract = await BridgeValidators.deployed();

    console.log('hooking up eternal storage to BridgeValidators')
    //truffle sucks, it uses web3 0.20, hence I need to work around in order to generate data param
    var bridgeValidatorsWeb3 = web3.eth.contract(BridgeValidators.abi);
    var bridgeValidatorsWeb3Instance = bridgeValidatorsWeb3.at(validatorContract.address);
    var initializeDataValidators = bridgeValidatorsWeb3Instance.initialize.getData(REQUIRED_NUMBER_OF_VALIDATORS, VALIDATORS, PROXY_OWNER);
    await storageBridgeValidators.upgradeTo('1', validatorContract.address, {from: PROXY_OWNER});
    await web3.eth.sendTransaction({
      from: PROXY_OWNER,
      to: storageBridgeValidators.address,
      data: initializeDataValidators,
      value: 0,
      gas: 4700000
    })

    console.log('deploying foreign storage on foreign network')
    await deployer.deploy(EternalStorageProxy, {from: PROXY_OWNER});
    const foreignBridgeUpgradeable = await EternalStorageProxy.deployed()
    await deployer.deploy(ForeignBridge);
    const foreignBridgeImplementation = await ForeignBridge.deployed();
    var foreignBridgeWeb3 = web3.eth.contract(ForeignBridge.abi);
    var foreignBridgeWeb3Instance = foreignBridgeWeb3.at(foreignBridgeImplementation.address);

    var initializeDataForeign = foreignBridgeWeb3Instance.initialize.getData(
      storageBridgeValidators.address,
      foreignDailyLimit,
      MAX_AMOUNT_PER_TX,
      MIN_AMOUNT_PER_TX,
      HOME_GAS_PRICE,
      HOME_REQUIRED_BLOCK_CONFIRMATIONS
    );
    await foreignBridgeUpgradeable.upgradeTo('1', foreignBridgeImplementation.address, {from: PROXY_OWNER});
    await web3.eth.sendTransaction({
      from: PROXY_OWNER,
      to: foreignBridgeUpgradeable.address,
      data: initializeDataForeign,
      value: 0,
      gas: 4700000
    })
    console.log('ETH is done for rinkeby', `
    validators: ${VALIDATORS}
    Owner: ${PROXY_OWNER}
    Foreign Bridge: ${foreignBridgeUpgradeable.address}`)
  } else if(network === "sidechain"){
    if(!PROXY_OWNER){
      throw new Error("You need a second address for deployment, not coinbase");
    }
    console.log('deploying token')
    await deployer.deploy(POA20, "Sidechain ETH", "ETH", 18)
    const erc677token = await POA20.deployed()

    console.log('storage for home validators')
    await deployer.deploy(EternalStorageProxy, {from: PROXY_OWNER});
    const storageBridgeValidators = await EternalStorageProxy.deployed()

    console.log('deploying validators')
    await deployer.deploy(BridgeValidators);
    const validatorContract = await BridgeValidators.deployed();

    console.log('hooking up eternal storage to BridgeValidators')
    //truffle sucks, it uses web3 0.20, hence I need to work around in order to generate data param
    var bridgeValidatorsWeb3 = web3.eth.contract(BridgeValidators.abi);
    var bridgeValidatorsWeb3Instance = bridgeValidatorsWeb3.at(validatorContract.address);
    var initializeDataValidators = bridgeValidatorsWeb3Instance.initialize.getData(REQUIRED_NUMBER_OF_VALIDATORS, VALIDATORS, PROXY_OWNER);
    await storageBridgeValidators.upgradeTo('1', validatorContract.address, {from: PROXY_OWNER});
    await web3.eth.sendTransaction({
      from: PROXY_OWNER,
      to: storageBridgeValidators.address,
      data: initializeDataValidators,
      value: 0,
      gas: 4700000
    })


    console.log('deploying HomeBridge');
    await deployer.deploy(EternalStorageProxy, {from: PROXY_OWNER});
    const homeBridgeUpgradeable = await EternalStorageProxy.deployed()
    await deployer.deploy(HomeBridge);
    const homeBridgeImplementation = await HomeBridge.deployed();
    var homeBridgeWeb3 = web3.eth.contract(HomeBridge.abi);
    var homeBridgeWeb3Instance = homeBridgeWeb3.at(homeBridgeImplementation.address);

    var initializeDataHome = homeBridgeWeb3Instance.initialize.getData(
        storageBridgeValidators.address,
        erc677token.address,
        homeDailyLimit,
        MAX_AMOUNT_PER_TX,
        MIN_AMOUNT_PER_TX,
        FOREIGN_GAS_PRICE,
        FOREIGN_REQUIRED_BLOCK_CONFIRMATIONS
      );
      await homeBridgeUpgradeable.upgradeTo('1', homeBridgeImplementation.address, {from: PROXY_OWNER});

    await web3.eth.sendTransaction({
      from: PROXY_OWNER,
      to: homeBridgeUpgradeable.address,
      data: initializeDataHome,
      value: 0,
      gas: 4700000
    })

    await erc677token.transferOwnership(homeBridgeUpgradeable.address);

    console.log('ETH is done for sidechain', `
    validators: ${VALIDATORS}
    Owner: ${PROXY_OWNER}
    Home Bridge: ${homeBridgeUpgradeable.address}
    Sidechain ETH: ${erc677token.address}`)
  }

};
