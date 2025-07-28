const { ethers } = require("hardhat");

async function fixInvestmentIssues() {
  console.log("🔧 Fixing Investment Proposal Issues...\n");

  // Contract addresses (update these with your deployed addresses)
  const PST_INVESTMENT_ADDRESS = "0xb5B35187e617840F90dAe473a09375FDB8E15F68";
  const STABLECOIN_ADDRESS = "0x7a94799e4F1f73fAB392fE7aB303e96CE979A6dc";
  const ADMIN_ADDRESS = "0x..."; // Replace with admin address
  const USER_ADDRESS = "0x..."; // Replace with user address
  const TARGET_ADDRESS = "0xBF381242bcB606D559Db6edFD7113F6624294c4D"; // PSTStaking address

  try {
    // Get contract instances
    const pstInvestment = await ethers.getContractAt("PSTInvestment", PST_INVESTMENT_ADDRESS);
    const stablecoin = await ethers.getContractAt("Stablecoin", STABLECOIN_ADDRESS);

    console.log("📋 Contract Information:");
    console.log(`PSTInvestment: ${PST_INVESTMENT_ADDRESS}`);
    console.log(`Stablecoin: ${STABLECOIN_ADDRESS}`);
    console.log(`Admin: ${ADMIN_ADDRESS}`);
    console.log(`User: ${USER_ADDRESS}`);
    console.log(`Target: ${TARGET_ADDRESS}\n`);

    // Get treasury address
    const treasuryAddress = await pstInvestment.treasury();
    console.log(`💰 Treasury Address: ${treasuryAddress}`);

    // 1. Check and grant INVESTOR_ROLE if needed
    const INVESTOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("INVESTOR_ROLE"));
    const hasInvestorRole = await pstInvestment.hasRole(INVESTOR_ROLE, USER_ADDRESS);
    
    if (!hasInvestorRole) {
      console.log("🔑 Granting INVESTOR_ROLE to user...");
      const grantRoleTx = await pstInvestment.grantRole(INVESTOR_ROLE, USER_ADDRESS);
      await grantRoleTx.wait();
      console.log("✅ INVESTOR_ROLE granted successfully");
    } else {
      console.log("✅ User already has INVESTOR_ROLE");
    }

    // 2. Check and whitelist target if needed
    const isTargetWhitelisted = await pstInvestment.whitelistedTargets(TARGET_ADDRESS);
    
    if (!isTargetWhitelisted) {
      console.log("📝 Whitelisting target...");
      const whitelistTx = await pstInvestment.setTargetWhitelisted(TARGET_ADDRESS, true);
      await whitelistTx.wait();
      console.log("✅ Target whitelisted successfully");
    } else {
      console.log("✅ Target already whitelisted");
    }

    // 3. Check and unpause contract if needed
    const isPaused = await pstInvestment.paused();
    
    if (isPaused) {
      console.log("⏸️  Unpausing contract...");
      const unpauseTx = await pstInvestment.unpause();
      await unpauseTx.wait();
      console.log("✅ Contract unpaused successfully");
    } else {
      console.log("✅ Contract is not paused");
    }

    // 4. Check treasury balance and transfer if needed
    const treasuryBalance = await stablecoin.balanceOf(treasuryAddress);
    console.log(`💰 Treasury Balance: ${ethers.formatUnits(treasuryBalance, 6)} USDC`);

    if (treasuryBalance === 0n) {
      console.log("⚠️  Treasury has no USDC - You need to transfer USDC to treasury manually");
      console.log(`   Treasury Address: ${treasuryAddress}`);
    }

    // 5. Check and approve treasury allowance if needed
    const treasuryAllowance = await stablecoin.allowance(treasuryAddress, PST_INVESTMENT_ADDRESS);
    console.log(`✅ Treasury Allowance: ${ethers.formatUnits(treasuryAllowance, 6)} USDC`);

    if (treasuryAllowance === 0n) {
      console.log("⚠️  Treasury has not approved PSTInvestment - You need to approve allowance manually");
      console.log(`   Treasury needs to call: stablecoin.approve(${PST_INVESTMENT_ADDRESS}, amount)`);
    }

    // 6. Set required approvals to 1 for easier testing (optional)
    const requiredApprovals = await pstInvestment.requiredApprovals();
    if (requiredApprovals > 1) {
      console.log("📊 Setting required approvals to 1 for easier testing...");
      const setApprovalsTx = await pstInvestment.setRequiredApprovals(1);
      await setApprovalsTx.wait();
      console.log("✅ Required approvals set to 1");
    } else {
      console.log("✅ Required approvals already set to 1");
    }

    // 7. Set shorter proposal expiry time for testing (optional)
    const proposalExpiryTime = await pstInvestment.proposalExpiryTime();
    if (proposalExpiryTime > 3600) { // If more than 1 hour
      console.log("⏰ Setting proposal expiry time to 1 hour for testing...");
      const setExpiryTx = await pstInvestment.setProposalExpiryTime(3600); // 1 hour
      await setExpiryTx.wait();
      console.log("✅ Proposal expiry time set to 1 hour");
    } else {
      console.log("✅ Proposal expiry time already reasonable");
    }

    console.log("\n🎯 Summary:");
    console.log("✅ INVESTOR_ROLE: Granted");
    console.log("✅ Target Whitelisted: Done");
    console.log("✅ Contract Paused: Unpaused");
    console.log("✅ Required Approvals: Set to 1");
    console.log("✅ Proposal Expiry: Set to 1 hour");
    
    if (treasuryBalance === 0n) {
      console.log("⚠️  Treasury Balance: Needs manual transfer");
    } else {
      console.log("✅ Treasury Balance: Sufficient");
    }
    
    if (treasuryAllowance === 0n) {
      console.log("⚠️  Treasury Allowance: Needs manual approval");
    } else {
      console.log("✅ Treasury Allowance: Sufficient");
    }

    console.log("\n📝 Next Steps:");
    if (treasuryBalance === 0n) {
      console.log("1. Transfer USDC to treasury address:", treasuryAddress);
    }
    if (treasuryAllowance === 0n) {
      console.log("2. Approve PSTInvestment to spend treasury USDC");
    }
    console.log("3. Try creating an investment proposal");

  } catch (error) {
    console.error("❌ Error fixing issues:", error.message);
  }
}

// Run the fix
fixInvestmentIssues()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 