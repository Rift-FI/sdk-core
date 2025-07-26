require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.22",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  paths: {
    sources: "./src/contracts",
    tests: "./tests",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
    },
    berachainBepolia: {
      url: "https://bepolia.rpc.berachain.com",
      chainId: 80069,
      ...(process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 66 ? {
        accounts: [process.env.PRIVATE_KEY]
      } : {}),
    },
    berachainMainnet: {
      url: "https://rpc.berachain.com",
      chainId: 80085,
      ...(process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 66 ? {
        accounts: [process.env.PRIVATE_KEY]
      } : {}),
    },
  },
  etherscan: {
    apiKey: {
      berachainBepolia: "berachainBepolia", // placeholder
    },
  },
}; 