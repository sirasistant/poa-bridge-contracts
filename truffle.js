module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 7545,
      network_id: "*",
      gasPrice: 1000000000
    },
    test: {
      host: "localhost",
      port: 7545,
      network_id: "*",
      gasPrice: 1000000000
    },
    kovan: {
      host: "localhost",
      port: "8591",
      network_id: "*",
      gas: 4700000,
      gasPrice: 1000000000
    },
    core: {
      host: "localhost",
      port: "8777",
      network_id: "*",
      gas: 4700000,
      gasPrice: 1000000000
    },
    sokol: {
      host: "localhost",
      port: "8545",
      network_id: "*",
      gas: 4700000,
      gasPrice: 1000000000
    },
    coverage: {
      host: 'localhost',
      network_id: '*', // eslint-disable-line camelcase
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01,
    },
    rinkeby: {
      host: 'localhost',
      port: 8545,
      gas:4700000,
      gasPrice: 10000000000,
      network_id: '*', // eslint-disable-line camelcase
    },
    sidechain:{
      host:'localhost',
      port:8546,
      network_id:'*',
      gasPrice: 1,
      gas:4700000,
    }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
};
