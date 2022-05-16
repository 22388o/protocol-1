require("dotenv").config();

require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");
require('hardhat-contract-sizer');

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.9",
  networks: {
    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      accounts:
        [
          process.env.PRIVATE_KEY_ACC0, //Ropsten deploy 2
          process.env.PRIVATE_KEY_ACC1,
          process.env.PRIVATE_KEY_ACC2,
          process.env.PRIVATE_KEY_EMERGENCY_ADMIN,
          process.env.PRIVATE_KEY_ADMIN,
          process.env.PRIVATE_KEY_TREASURY,
        ],
      gas: 2100000,
      gasPrice: 8000000000,
      saveDeploymentes: true,
      // timeout: 10000000,
      // networkCheckTimeout: 1000000,
      // timeoutBlocks: 30000,
    },
    rinkby: {
      url: process.env.RINKBY_URL || "",
      accounts:
        [
          process.env.PRIVATE_KEY_ACC0,
          process.env.PRIVATE_KEY_ACC1,
          process.env.PRIVATE_KEY_ACC2,
          process.env.PRIVATE_KEY_EMERGENCY_ADMIN,
          process.env.PRIVATE_KEY_ADMIN,
          process.env.PRIVATE_KEY_TREASURY,
        ],
      gas: 2100000,
      gasPrice: 8000000000,
      saveDeploymentes: true,
    },
    hardhat: {
      forking: {
        url: "https://eth-mainnet.alchemyapi.io/v2/xjbC1VB6-x67laEVZnrByCiJEnv9Bi2g",
      }
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  mocha : {
    timeout: 60000
  }
};
