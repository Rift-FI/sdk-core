const hre = require("hardhat");

/**
 * Contract Verification Script
 * This script helps verify deployed contracts on blockchain explorers
 * 
 * Usage:
 * npx hardhat run scripts/verify-contracts.js --network <network_name>
 * 
 * Example:
 * npx hardhat run scripts/verify-contracts.js --network berachainBeploia
 * npx hardhat run scripts/verify-contracts.js --network mumbai
 * npx hardhat run scripts/verify-contracts.js --network sepolia
 */

async function main() {
  console.log("🔍 Starting contract verification process...");
  
  // Contract addresses - Replace these with your actual deployed contract addresses
  const contracts = {
    // Add your deployed contract addresses here
    PSTToken: "0x...", // Replace with actual address
    PSTStaking: "0x...", // Replace with actual address
    PSTInvestment: "0x...", // Replace with actual address
    PSTLiquidity: "0x...", // Replace with actual address
    SphereDex: "0x...", // Replace with actual address
    Stablecoin: "0x...", // Replace with actual address
    LiquidPST: "0x...", // Replace with actual address
  };

  // Constructor arguments for each contract
  const constructorArgs = {
    PSTToken: [], // Add constructor arguments if any
    PSTStaking: [
      // Add actual constructor arguments
      // "_stablecoin", "_investmentManager", "_liquidityManager", "_treasury"
    ],
    PSTInvestment: [
      // Add actual constructor arguments
      // "_stablecoin", "_treasury", "_admin"
    ],
    PSTLiquidity: [], // Add constructor arguments if any
    SphereDex: [], // Add constructor arguments if any
    Stablecoin: [], // Add constructor arguments if any
    LiquidPST: [], // Add constructor arguments if any
  };

  const network = hre.network.name;
  console.log(`📡 Network: ${network}`);

  // Verify each contract
  for (const [contractName, contractAddress] of Object.entries(contracts)) {
    if (!contractAddress || contractAddress === "0x...") {
      console.log(`⚠️  Skipping ${contractName} - No address provided`);
      continue;
    }

    try {
      console.log(`\n🔍 Verifying ${contractName} at ${contractAddress}...`);
      
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: constructorArgs[contractName] || [],
        contract: getContractPath(contractName), // Optional: specify contract path
      });

      console.log(`✅ ${contractName} verified successfully!`);
      
      // Log explorer URL
      const explorerUrl = getExplorerUrl(network, contractAddress);
      if (explorerUrl) {
        console.log(`🌐 View on explorer: ${explorerUrl}`);
      }

    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log(`✅ ${contractName} is already verified!`);
      } else {
        console.error(`❌ Failed to verify ${contractName}:`, error.message);
      }
    }
  }

  console.log("\n🎉 Verification process completed!");
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

/**
 * Verify a single contract (helper function)
 */
async function verifySingleContract(contractName, contractAddress, constructorArgs = []) {
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

// Export for use in other scripts
module.exports = {
  main,
  verifySingleContract,
  getExplorerUrl,
};

// Run the script if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Verification failed:", error);
      process.exit(1);
    });
} 