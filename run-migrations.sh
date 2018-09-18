#! /bin/sh
echo "ERC20 to ERC20 in sidechain"
rm -r ./build
rm migrations.log
npx truffle migrate --reset --network=sidechain -f 3 --to 3 >> migrations.log
echo "ETH to ERC20 in sidechain"
rm -r ./build
npx truffle migrate --reset --network=sidechain -f 4 --to 4 >> migrations.log
echo "ERC20 to ERC20 in rinkeby"
rm -r ./build
npx truffle migrate --reset --network=rinkeby -f 3 --to 3 >> migrations.log
echo "ETH to ERC20 in rinkeby"
rm -r ./build
npx truffle migrate --reset --network=rinkeby -f 4 --to 4 >> migrations.log
rm -r ./build
