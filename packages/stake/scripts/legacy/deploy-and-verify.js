const hre = require("hardhat");

/**
 * Deploy and Verify Contracts Script
 * This script deploys contracts and automatically verifies them on the blockchain explorer
 */

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🚀 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", (await deployer.getBalance()).toString());
  console.log("🌐 Network:", hre.network.name);

  const deployedContracts = {};

  try {
    // Deploy your contracts here
    // Example: Deploy PSTToken
    console.log("\n📦 Deploying PSTToken...");
    const PSTToken = await hre.ethers.getContractFactory("PSTToken");
    const pstToken = await PSTToken.deploy();
    await pstToken.deployed();
    
    deployedContracts.PSTToken = {
      address: pstToken.address,
      constructorArgs: []
    };
    console.log("✅ PSTToken deployed to:", pstToken.address);

    // Add more contract deployments here
    // Example: Deploy Stablecoin
    // console.log("\n📦 Deploying Stablecoin...");
    // const Stablecoin = await hre.ethers.getContractFactory("Stablecoin");
    // const stablecoin = await Stablecoin.deploy();
    // await stablecoin.deployed();
    // deployedContracts.Stablecoin = {
    //   address: stablecoin.address,
    //   constructorArgs: []
    // };

    // Wait for block confirmations before verification
    console.log("\n⏳ Waiting for block confirmations...");
    await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds

    // Verify contracts
    console.log("\n🔍 Starting contract verification...");
    for (const [contractName, contractInfo] of Object.entries(deployedContracts)) {
      await verifyContract(contractName, contractInfo.address, contractInfo.constructorArgs);
    }

    // Save deployment info
    const deploymentInfo = {
      network: hre.network.name,
      chainId: hre.network.config.chainId,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: deployedContracts
    };

    console.log("\n📄 Deployment Summary:");
    console.log(JSON.stringify(deploymentInfo, null, 2));

    // Log explorer URLs
    console.log("\n🔗 Explorer URLs:");
    for (const [contractName, contractInfo] of Object.entries(deployedContracts)) {
      const explorerUrl = getExplorerUrl(hre.network.name, contractInfo.address);
      if (explorerUrl) {
        console.log(`${contractName}: ${explorerUrl}`);
      }
    }

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

/**
 * Verify a single contract
 */
async function verifyContract(contractName, contractAddress, constructorArgs = []) {
  try {
    console.log(`🔍 Verifying ${contractName} at ${contractAddress}...`);
    
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructorArgs,
      contract: getContractPath(contractName),
    });

    console.log(`✅ ${contractName} verified successfully!`);
    return true;
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log(`✅ ${contractName} is already verified!`);
      return true;
    } else {
      console.error(`❌ Failed to verify ${contractName}:`, error.message);
      return false;
    }
  }
}

/**
 * Get the contract source path for verification
 */
function getContractPath(contractName) {
  const contractPaths = {
    PSTToken: "contracts/tokens/PSTToken.sol:PSTToken",
    PSTStaking: "contracts/staking/PSTStaking.sol:PSTStaking",
    PSTInvestment: "contracts/staking/PSTInvestment.sol:PSTInvestment",
    PSTLiquidity: "contracts/staking/PSTLiquidity.sol:PSTLiquidity",
    SphereDex: "contracts/dex/SphereDex.sol:SphereDex",
    Stablecoin: "contracts/tokens/Stablecoin.sol:Stablecoin",
    LiquidPST: "contracts/staking/LiquidPST.sol:LiquidPST",
  };
  
  return contractPaths[contractName];
}

/**
 * Get explorer URL for different networks
 */
function getExplorerUrl(network, address) {
  const explorers = {
    mumbai: `https://mumbai.polygonscan.com/address/${address}`,
    sepolia: `https://sepolia.etherscan.io/address/${address}`,
    berachainBeploia: `https://explorer.testnet.berachain.com/address/${address}`,
    berachainMainnet: `https://explorer.berachain.com/address/${address}`,
    mainnet: `https://etherscan.io/address/${address}`,
    polygon: `https://polygonscan.com/address/${address}`,
  };
  
  return explorers[network];
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 