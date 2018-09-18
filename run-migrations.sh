#! /bin/sh
echo $1
$ERC20_ADDRESS = $1
rm migrations.log
echo "ERC20 to ERC20 in sidechain"
rm -r ./build
npx run truffle compile
npx truffle migrate --reset --network=sidechain -f 3 --to 3 >> migrations.log
echo "ETH to ERC20 in sidechain"
rm -r ./build
npx run truffle compile
npx truffle migrate --reset --network=sidechain -f 4 --to 4 >> migrations.log
echo "ERC20 to ERC20 in rinkeby"
rm -r ./build
npx run truffle compile
npx truffle migrate --reset --network=rinkeby -f 3 --to 3 >> migrations.log
echo "ETH to ERC20 in rinkeby"
rm -r ./build
npx run truffle compile
npx truffle migrate --reset --network=rinkeby -f 4 --to 4 >> migrations.log
rm -r ./build
