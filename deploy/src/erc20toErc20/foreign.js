const Web3Utils = require('web3-utils')
require('dotenv').config({
  path: __dirname + '/../.env'
});

const assert = require('assert');

const {deployContract, sendRawTx} = require('../deploymentUtils');
const {web3Foreign, deploymentPrivateKey, FOREIGN_RPC_URL} = require('../web3');

const ERC677BridgeToken = require('../../../build/contracts/ERC677BridgeToken.json');
const EternalStorageProxy = require('../../../build/contracts/EternalStorageProxy.json');
const BridgeValidators = require('../../../build/contracts/BridgeValidators.json')
const ForeignBridge = require('../../../build/contracts/ForeignBridge.json')

const VALIDATORS = process.env.VALIDATORS.split(" ")
const FOREIGN_GAS_PRICE =  Web3Utils.toWei(process.env.FOREIGN_GAS_PRICE, 'gwei');

const {
  DEPLOYMENT_ACCOUNT_ADDRESS,
  REQUIRED_NUMBER_OF_VALIDATORS,
  FOREIGN_OWNER_MULTISIG,
  FOREIGN_UPGRADEABLE_ADMIN_VALIDATORS,
  FOREIGN_UPGRADEABLE_ADMIN_BRIDGE,
  USER_ADDRESS,
  ERC20_TOKEN_ADDRESS

} = process.env;

async function deployForeign() {
  let foreignNonce = await web3Foreign.eth.getTransactionCount(DEPLOYMENT_ACCOUNT_ADDRESS);
  console.log('========================================')
  console.log('deploying ForeignBridge')
  console.log('========================================\n')

  // console.log('\n[Foreign] deploying SomeERC20 token')
  // const poa20foreign = await deployContract(ERC677BridgeToken, ["Some ERC20 Token", "BancorToken", 18], {from: DEPLOYMENT_ACCOUNT_ADDRESS, network: 'foreign', nonce: foreignNonce})
  // foreignNonce++;
  // console.log('[Foreign] ERC20: ', poa20foreign.options.address)

  // const dataToMint = await poa20foreign.methods.mint(USER_ADDRESS, Web3Utils.toWei('25000')).encodeABI({from: DEPLOYMENT_ACCOUNT_ADDRESS});
  // const txdataToMint = await sendRawTx({
  //   data: dataToMint,
  //   nonce: foreignNonce,
  //   to: poa20foreign.options.address,
  //   privateKey: deploymentPrivateKey,
  //   url: FOREIGN_RPC_URL
  // });
  // assert.equal(txdataToMint.status, '0x1', 'Transaction Failed');
  // foreignNonce++;



  console.log('deploying storage for foreign validators')
  const storageValidatorsForeign = await deployContract(EternalStorageProxy, [], {from: DEPLOYMENT_ACCOUNT_ADDRESS, network: 'foreign', nonce: foreignNonce})
  foreignNonce++;
  console.log('[Foreign] BridgeValidators Storage: ', storageValidatorsForeign.options.address)

  console.log('\ndeploying implementation for foreign validators')
  let bridgeValidatorsForeign = await deployContract(BridgeValidators, [], {from: DEPLOYMENT_ACCOUNT_ADDRESS, network: 'foreign', nonce: foreignNonce})
  foreignNonce++;
  console.log('[Foreign] BridgeValidators Implementation: ', bridgeValidatorsForeign.options.address)

  console.log('\nhooking up eternal storage to BridgeValidators')
  const upgradeToBridgeVForeignData = await storageValidatorsForeign.methods.upgradeTo('1', bridgeValidatorsForeign.options.address)
    .encodeABI({from: DEPLOYMENT_ACCOUNT_ADDRESS});
  const txUpgradeToBridgeVForeign = await sendRawTx({
    data: upgradeToBridgeVForeignData,
    nonce: foreignNonce,
    to: storageValidatorsForeign.options.address,
    privateKey: deploymentPrivateKey,
    url: FOREIGN_RPC_URL
  });
  assert.equal(txUpgradeToBridgeVForeign.status, '0x1', 'Transaction Failed');
  foreignNonce++;

  console.log('\ninitializing Foreign Bridge Validators with following parameters:\n')
  console.log(`REQUIRED_NUMBER_OF_VALIDATORS: ${REQUIRED_NUMBER_OF_VALIDATORS}, VALIDATORS: ${VALIDATORS}`)
  bridgeValidatorsForeign.options.address = storageValidatorsForeign.options.address
  const initializeForeignData = await bridgeValidatorsForeign.methods.initialize(
    REQUIRED_NUMBER_OF_VALIDATORS, VALIDATORS, FOREIGN_OWNER_MULTISIG
  ).encodeABI({from: DEPLOYMENT_ACCOUNT_ADDRESS});
  const txInitializeForeign = await sendRawTx({
    data: initializeForeignData,
    nonce: foreignNonce,
    to: bridgeValidatorsForeign.options.address,
    privateKey: deploymentPrivateKey,
    url: FOREIGN_RPC_URL
  });
  assert.equal(txInitializeForeign.status, '0x1', 'Transaction Failed');
  const validatorOwner = await bridgeValidatorsForeign.methods.owner().call();
  assert.equal(validatorOwner.toLowerCase(), FOREIGN_OWNER_MULTISIG.toLocaleLowerCase());
  foreignNonce++;

  console.log('\nTransferring ownership of ValidatorsProxy\n')
  const validatorsForeignOwnershipData = await storageValidatorsForeign.methods.transferProxyOwnership(FOREIGN_UPGRADEABLE_ADMIN_VALIDATORS)
    .encodeABI({from: DEPLOYMENT_ACCOUNT_ADDRESS});
  const txValidatorsForeignOwnershipData = await sendRawTx({
    data: validatorsForeignOwnershipData,
    nonce: foreignNonce,
    to: storageValidatorsForeign.options.address,
    privateKey: deploymentPrivateKey,
    url: FOREIGN_RPC_URL
  });
  assert.equal(txValidatorsForeignOwnershipData.status, '0x1', 'Transaction Failed');
  foreignNonce++;
  const newProxyValidatorsOwner = await storageValidatorsForeign.methods.proxyOwner().call();
  assert.equal(newProxyValidatorsOwner.toLowerCase(), FOREIGN_UPGRADEABLE_ADMIN_VALIDATORS.toLowerCase());

  console.log('\ndeploying foreignBridge storage\n')
  const foreignBridgeStorage = await deployContract(EternalStorageProxy, [], {from: DEPLOYMENT_ACCOUNT_ADDRESS, network: 'foreign', nonce: foreignNonce})
  foreignNonce++;
  console.log('[Foreign] ForeignBridge Storage: ', foreignBridgeStorage.options.address)

  console.log('\ndeploying foreignBridge implementation\n')
  const foreignBridgeImplementation = await deployContract(ForeignBridge, [], {from: DEPLOYMENT_ACCOUNT_ADDRESS, network: 'foreign', nonce: foreignNonce})
  foreignNonce++;
  console.log('[Foreign] ForeignBridge Implementation: ', foreignBridgeImplementation.options.address)

  console.log('\nhooking up ForeignBridge storage to ForeignBridge implementation')
  const upgradeToForeignBridgeData = await foreignBridgeStorage.methods.upgradeTo('1', foreignBridgeImplementation.options.address)
    .encodeABI({from: DEPLOYMENT_ACCOUNT_ADDRESS});
  const txUpgradeToForeignBridge = await sendRawTx({
    data: upgradeToForeignBridgeData,
    nonce: foreignNonce,
    to: foreignBridgeStorage.options.address,
    privateKey: deploymentPrivateKey,
    url: FOREIGN_RPC_URL
  });
  assert.equal(txUpgradeToForeignBridge.status, '0x1', 'Transaction Failed');
  foreignNonce++;

  console.log('\ninitializing Foreign Bridge with following parameters:\n')
  console.log(`Foreign Validators: ${storageValidatorsForeign.options.address},
  `)
  foreignBridgeImplementation.options.address = foreignBridgeStorage.options.address
  const initializeFBridgeData = await foreignBridgeImplementation.methods.initialize(
    storageValidatorsForeign.options.address, ERC20_TOKEN_ADDRESS
  ).encodeABI({from: DEPLOYMENT_ACCOUNT_ADDRESS});
  const txInitializeBridge = await sendRawTx({
    data: initializeFBridgeData,
    nonce: foreignNonce,
    to: foreignBridgeStorage.options.address,
    privateKey: deploymentPrivateKey,
    url: FOREIGN_RPC_URL
  });
  assert.equal(txInitializeBridge.status, '0x1', 'Transaction Failed');
  foreignNonce++;

  const bridgeOwnershipData = await foreignBridgeStorage.methods.transferProxyOwnership(FOREIGN_UPGRADEABLE_ADMIN_BRIDGE)
    .encodeABI({from: DEPLOYMENT_ACCOUNT_ADDRESS});
  const txBridgeOwnershipData = await sendRawTx({
    data: bridgeOwnershipData,
    nonce: foreignNonce,
    to: foreignBridgeStorage.options.address,
    privateKey: deploymentPrivateKey,
    url: FOREIGN_RPC_URL
  });
  assert.equal(txBridgeOwnershipData.status, '0x1', 'Transaction Failed');
  foreignNonce++;
  const newProxyBridgeOwner = await foreignBridgeStorage.methods.proxyOwner().call();
  assert.equal(newProxyBridgeOwner.toLowerCase(), FOREIGN_UPGRADEABLE_ADMIN_BRIDGE.toLowerCase());

  return {
    foreignBridge:
      {
        address: foreignBridgeStorage.options.address,
        deployedBlockNumber: Web3Utils.hexToNumber(foreignBridgeStorage.deployedBlockNumber)
      },
    erc677: {address: ERC20_TOKEN_ADDRESS}
  }
}

module.exports = deployForeign;
