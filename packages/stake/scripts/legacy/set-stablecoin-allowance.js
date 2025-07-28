const { ethers } = require("hardhat");

// USAGE: npx hardhat run scripts/set-stablecoin-allowance.js --network berachainBeploia

async function setStablecoinAllowance() {
  console.log("🔧 Setting Stablecoin Allowance...\n");

  // Contract addresses
  const STABLECOIN_ADDRESS = "0x7a94799e4F1f73fAB392fE7aB303e96CE979A6dc";
  const PST_INVESTMENT_ADDRESS = "0xb5B35187e617840F90dAe473a09375FDB8E15F68";
  const PST_STAKING_ADDRESS = "0xBF381242bcB606D559Db6edFD7113F6624294c4D";
  const TREASURY_ADDRESS = "0x501E1677de2318A16C6d9861F5bB0CC452Cae613";

  try {
    // Get the signer (make sure this is the treasury address)
    const [signer] = await ethers.getSigners();
    const signerAddress = await signer.getAddress();
    
    console.log("📋 Contract Information:");
    console.log(`Stablecoin: ${STABLECOIN_ADDRESS}`);
    console.log(`PSTInvestment: ${PST_INVESTMENT_ADDRESS}`);
    console.log(`PSTStaking: ${PST_STAKING_ADDRESS}`);
    console.log(`Treasury: ${TREASURY_ADDRESS}`);
    console.log(`Signer: ${signerAddress}\n`);

    // Check if signer is the treasury
    if (signerAddress.toLowerCase() !== TREASURY_ADDRESS.toLowerCase()) {
      console.log("⚠️  Warning: Signer is not the treasury address!");
      console.log(`   Expected: ${TREASURY_ADDRESS}`);
      console.log(`   Got: ${signerAddress}`);
      console.log("   Make sure you're using the treasury wallet.\n");
    }

    // Get contract instance
    const stablecoin = await ethers.getContractAt("Stablecoin", STABLECOIN_ADDRESS);

    // Check current balances and allowances
    const treasuryBalance = await stablecoin.balanceOf(TREASURY_ADDRESS);
    const currentAllowanceToInvestment = await stablecoin.allowance(TREASURY_ADDRESS, PST_INVESTMENT_ADDRESS);
    const currentAllowanceToStaking = await stablecoin.allowance(TREASURY_ADDRESS, PST_STAKING_ADDRESS);

    console.log("💰 Current Status:");
    console.log(`Treasury Balance: ${ethers.formatUnits(treasuryBalance, 6)} USDC`);
    console.log(`Allowance to PSTInvestment: ${ethers.formatUnits(currentAllowanceToInvestment, 6)} USDC`);
    console.log(`Allowance to PSTStaking: ${ethers.formatUnits(currentAllowanceToStaking, 6)} USDC\n`);

    // Set allowance for PSTInvestment (1 million USDC)
    const amountForInvestment = ethers.parseUnits("1000000", 6); // 1,000,000 USDC
    
    if (currentAllowanceToInvestment < amountForInvestment) {
      console.log("✅ Setting allowance for PSTInvestment...");
      const tx1 = await stablecoin.approve(PST_INVESTMENT_ADDRESS, amountForInvestment);
      console.log(`Transaction hash: ${tx1.hash}`);
      await tx1.wait();
      console.log("✅ Allowance set for PSTInvestment successfully!");
    } else {
      console.log("✅ PSTInvestment already has sufficient allowance");
    }

    // Set allowance for PSTStaking (1 million USDC)
    const amountForStaking = ethers.parseUnits("1000000", 6); // 1,000,000 USDC
    
    if (currentAllowanceToStaking < amountForStaking) {
      console.log("✅ Setting allowance for PSTStaking...");
      const tx2 = await stablecoin.approve(PST_STAKING_ADDRESS, amountForStaking);
      console.log(`Transaction hash: ${tx2.hash}`);
      await tx2.wait();
      console.log("✅ Allowance set for PSTStaking successfully!");
    } else {
      console.log("✅ PSTStaking already has sufficient allowance");
    }

    // Verify the allowances
    const newAllowanceToInvestment = await stablecoin.allowance(TREASURY_ADDRESS, PST_INVESTMENT_ADDRESS);
    const newAllowanceToStaking = await stablecoin.allowance(TREASURY_ADDRESS, PST_STAKING_ADDRESS);

    console.log("\n🎯 Final Status:");
    console.log(`Allowance to PSTInvestment: ${ethers.formatUnits(newAllowanceToInvestment, 6)} USDC`);
    console.log(`Allowance to PSTStaking: ${ethers.formatUnits(newAllowanceToStaking, 6)} USDC`);

    if (newAllowanceToInvestment >= amountForInvestment && newAllowanceToStaking >= amountForStaking) {
      console.log("\n✅ All allowances set successfully! Investment proposals should now work.");
    } else {
      console.log("\n❌ Some allowances are still insufficient. Check the amounts above.");
    }

  } catch (error) {
    console.error("❌ Error setting allowance:", error.message);
    if (error.message.includes("insufficient funds")) {
      console.log("💡 Make sure the treasury wallet has enough BERA for gas fees.");
    }
  }
}

// Run the script
setStablecoinAllowance()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 