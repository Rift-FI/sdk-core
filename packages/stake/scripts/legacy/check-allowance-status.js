const { ethers } = require("hardhat");

// USAGE: npx hardhat run scripts/check-allowance-status.js --network berachainBeploia

async function checkAllowanceStatus() {
  console.log("🔍 Checking Stablecoin Allowance Status...\n");

  // Contract addresses
  const STABLECOIN_ADDRESS = "0x7a94799e4F1f73fAB392fE7aB303e96CE979A6dc";
  const PST_INVESTMENT_ADDRESS = "0xb5B35187e617840F90dAe473a09375FDB8E15F68";
  const PST_STAKING_ADDRESS = "0xBF381242bcB606D559Db6edFD7113F6624294c4D";
  const TREASURY_ADDRESS = "0x501E1677de2318A16C6d9861F5bB0CC452Cae613";

  try {
    // Get contract instance
    const stablecoin = await ethers.getContractAt("Stablecoin", STABLECOIN_ADDRESS);

    console.log("📋 Contract Information:");
    console.log(`Stablecoin: ${STABLECOIN_ADDRESS}`);
    console.log(`PSTInvestment: ${PST_INVESTMENT_ADDRESS}`);
    console.log(`PSTStaking: ${PST_STAKING_ADDRESS}`);
    console.log(`Treasury: ${TREASURY_ADDRESS}\n`);

    // Check balances and allowances
    const treasuryBalance = await stablecoin.balanceOf(TREASURY_ADDRESS);
    const allowanceToInvestment = await stablecoin.allowance(TREASURY_ADDRESS, PST_INVESTMENT_ADDRESS);
    const allowanceToStaking = await stablecoin.allowance(TREASURY_ADDRESS, PST_STAKING_ADDRESS);

    console.log("💰 Current Status:");
    console.log(`Treasury Balance: ${ethers.formatUnits(treasuryBalance, 6)} USDC`);
    console.log(`Allowance to PSTInvestment: ${ethers.formatUnits(allowanceToInvestment, 6)} USDC`);
    console.log(`Allowance to PSTStaking: ${ethers.formatUnits(allowanceToStaking, 6)} USDC\n`);

    // Analysis
    console.log("🎯 Analysis:");
    
    if (treasuryBalance === 0n) {
      console.log("❌ Treasury has no USDC balance");
    } else {
      console.log("✅ Treasury has USDC balance");
    }

    if (allowanceToInvestment === 0n) {
      console.log("❌ PSTInvestment has no allowance - Investment proposals will fail");
    } else if (allowanceToInvestment < ethers.parseUnits("100000", 6)) {
      console.log("⚠️  PSTInvestment has low allowance - May limit investment amounts");
    } else {
      console.log("✅ PSTInvestment has sufficient allowance");
    }

    if (allowanceToStaking === 0n) {
      console.log("❌ PSTStaking has no allowance - Staking operations may fail");
    } else if (allowanceToStaking < ethers.parseUnits("100000", 6)) {
      console.log("⚠️  PSTStaking has low allowance - May limit staking amounts");
    } else {
      console.log("✅ PSTStaking has sufficient allowance");
    }

    // Recommendations
    console.log("\n💡 Recommendations:");
    
    if (treasuryBalance === 0n) {
      console.log("• Transfer USDC to treasury address");
    }
    
    if (allowanceToInvestment === 0n) {
      console.log("• Set allowance for PSTInvestment (recommended: 1,000,000 USDC)");
    }
    
    if (allowanceToStaking === 0n) {
      console.log("• Set allowance for PSTStaking (recommended: 1,000,000 USDC)");
    }

    if (treasuryBalance > 0n && allowanceToInvestment > 0n && allowanceToStaking > 0n) {
      console.log("✅ All systems ready - Investment proposals should work!");
    }

  } catch (error) {
    console.error("❌ Error checking allowance status:", error.message);
  }
}

// Run the check
checkAllowanceStatus()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 