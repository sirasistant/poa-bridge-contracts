#! /bin/sh
rm -r ./build
npx truffle migrate --reset --network=sidechain -f 3 --to 3 >> migrations.log
rm -r ./build
npx truffle migrate --reset --network=sidechain -f 4 --to 4 >> migrations.log
rm -r ./build
npx truffle migrate --reset --network=rinkeby -f 3 --to 3 >> migrations.log
rm -r ./build
npx truffle migrate --reset --network=sidechain -f 4 --to 4 >> migrations.log
rm -r ./build
