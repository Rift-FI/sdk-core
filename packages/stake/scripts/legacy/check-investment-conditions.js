const { ethers } = require("hardhat");

async function checkInvestmentConditions() {
  console.log("🔍 Checking Investment Proposal Conditions...\n");

  // Contract addresses (update these with your deployed addresses)
  const PST_INVESTMENT_ADDRESS = "0xb5B35187e617840F90dAe473a09375FDB8E15F68";
  const STABLECOIN_ADDRESS = "0x7a94799e4F1f73fAB392fE7aB303e96CE979A6dc";
  const USER_ADDRESS = "0x..."; // Replace with your address
  const TARGET_ADDRESS = "0xBF381242bcB606D559Db6edFD7113F6624294c4D"; // PSTStaking address

  try {
    // Get contract instances
    const pstInvestment = await ethers.getContractAt("PSTInvestment", PST_INVESTMENT_ADDRESS);
    const stablecoin = await ethers.getContractAt("Stablecoin", STABLECOIN_ADDRESS);

    console.log("📋 Contract Information:");
    console.log(`PSTInvestment: ${PST_INVESTMENT_ADDRESS}`);
    console.log(`Stablecoin: ${STABLECOIN_ADDRESS}`);
    console.log(`User: ${USER_ADDRESS}`);
    console.log(`Target: ${TARGET_ADDRESS}\n`);

    // 1. Check if user has INVESTOR_ROLE
    const INVESTOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("INVESTOR_ROLE"));
    const hasInvestorRole = await pstInvestment.hasRole(INVESTOR_ROLE, USER_ADDRESS);
    console.log(`🔑 INVESTOR_ROLE: ${hasInvestorRole ? "✅ Yes" : "❌ No"}`);

    // 2. Check if target is whitelisted
    const isTargetWhitelisted = await pstInvestment.whitelistedTargets(TARGET_ADDRESS);
    console.log(`📝 Target Whitelisted: ${isTargetWhitelisted ? "✅ Yes" : "❌ No"}`);

    // 3. Check if contract is paused
    const isPaused = await pstInvestment.paused();
    console.log(`⏸️  Contract Paused: ${isPaused ? "❌ Yes" : "✅ No"}`);

    // 4. Get treasury address
    const treasuryAddress = await pstInvestment.treasury();
    console.log(`💰 Treasury Address: ${treasuryAddress}`);

    // 5. Check treasury balance
    const treasuryBalance = await stablecoin.balanceOf(treasuryAddress);
    console.log(`💰 Treasury Balance: ${ethers.formatUnits(treasuryBalance, 6)} USDC`);

    // 6. Check treasury allowance to PSTInvestment
    const treasuryAllowance = await stablecoin.allowance(treasuryAddress, PST_INVESTMENT_ADDRESS);
    console.log(`✅ Treasury Allowance: ${ethers.formatUnits(treasuryAllowance, 6)} USDC`);

    // 7. Check required approvals
    const requiredApprovals = await pstInvestment.requiredApprovals();
    console.log(`📊 Required Approvals: ${requiredApprovals}`);

    // 8. Check proposal expiry time
    const proposalExpiryTime = await pstInvestment.proposalExpiryTime();
    console.log(`⏰ Proposal Expiry Time: ${proposalExpiryTime} seconds (${proposalExpiryTime / 86400} days)`);

    // 9. Get current proposal count
    const proposalCount = await pstInvestment.getProposalCount();
    console.log(`📈 Current Proposal Count: ${proposalCount}`);

    console.log("\n🎯 Summary:");
    if (!hasInvestorRole) {
      console.log("❌ User needs INVESTOR_ROLE - Grant role first");
    }
    if (!isTargetWhitelisted) {
      console.log("❌ Target needs to be whitelisted - Whitelist target first");
    }
    if (isPaused) {
      console.log("❌ Contract is paused - Unpause first");
    }
    if (treasuryBalance === 0n) {
      console.log("❌ Treasury has no USDC - Transfer USDC to treasury");
    }
    if (treasuryAllowance === 0n) {
      console.log("❌ Treasury has not approved PSTInvestment - Approve allowance first");
    }

    if (hasInvestorRole && isTargetWhitelisted && !isPaused && treasuryBalance > 0n && treasuryAllowance > 0n) {
      console.log("✅ All conditions met - Investment proposal creation should work!");
    }

  } catch (error) {
    console.error("❌ Error checking conditions:", error.message);
  }
}

// Run the check
checkInvestmentConditions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 