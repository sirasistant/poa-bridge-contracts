const fs = require('fs');

const deployHome = require('./src/erc20toErc20/home')
const deployForeign = require('./src/erc20toErc20/foreign');

async function main() {
  const {homeBridgeAddress, erc677tokenAddress, deployedBlockNumber} = await deployHome()
  const {foreignBridge, erc677} = await deployForeign();
  console.log("\nDeployment has been completed.\n\n")
  console.log(`[   Home  ] HomeBridge: ${homeBridgeAddress} at block ${deployedBlockNumber}`)
  console.log(`[ Foreign ] ForeignBridge: ${foreignBridge.address} at block ${foreignBridge.deployedBlockNumber}`)
  console.log(`[ Foreign ] SomeERC20 Token: ${erc677.address}`)
  console.log(`[ Home ] ERC677 Bridgeble Token: ${erc677tokenAddress}`)
  fs.writeFileSync('./bridgeDeploymentResults.json', JSON.stringify({
    homeBridge: {
      homeBridgeAddress,
      erc677tokenAddress
    },foreignBridge: {
      ...foreignBridge,
    },erc677
  },null,4));
  console.log('Contracts Deployment have been saved to `bridgeDeploymentResults.json`')
}
main()
