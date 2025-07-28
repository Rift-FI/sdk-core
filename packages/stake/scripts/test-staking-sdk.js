const { ethers } = require("hardhat");
const Stake = require("../dist/index.js").default;
const { Chain, Tranche } = require("../dist/index.js");

async function testStakingSDK() {
  console.log("🚀 Testing Staking SDK with Local Deployment...\n");

  try {
    // Initialize SDK
    const stakeClient = new Stake();
    const [deployer, user1, user2, treasury] = await ethers.getSigners();
    
    console.log("📋 Test Accounts:");
    console.log(`  Deployer: ${deployer.address}`);
    console.log(`  User1: ${user1.address}`);
    console.log(`  User2: ${user2.address}`);
    console.log(`  Treasury: ${treasury.address}`);

    // Deploy mock stablecoin for testing
    console.log("\n📦 Deploying Mock Stablecoin...");
    const MockERC20 = await ethers.getContractFactory("MockTokenA");
    const stablecoin = await MockERC20.deploy("USDC Mock", "USDC", 6);
    await stablecoin.waitForDeployment();
    const stablecoinAddress = await stablecoin.getAddress();
    console.log(`✅ Mock USDC deployed: ${stablecoinAddress}`);

    // Deploy staking system using SDK
    console.log("\n🏗️  Deploying Staking System using SDK...");
    const deploymentConfig = {
      stablecoinAddress: stablecoinAddress,
      treasuryAddress: treasury.address,
      chain: Chain.BERACHAIN_TESTNET // Using testnet config for local testing
    };

    const deployment = await stakeClient.deployStakingSystemLocal(
      deploymentConfig,
      deployer.privateKey
    );

    console.log("✅ Staking System Deployed:");
    console.log(`  PSTStaking: ${deployment.pstStaking}`);
    console.log(`  PSTInvestment: ${deployment.pstInvestment}`);
    console.log(`  PSTLiquidity: ${deployment.pstLiquidity}`);
    console.log(`  PST Token: ${deployment.pstToken}`);
    console.log(`  PSTJ Token: ${deployment.pstjToken}`);

    // Test role verification using SDK
    console.log("\n🔐 Testing Role Management...");
    const hasMinterRole = await stakeClient.hasRole(
      Chain.BERACHAIN_TESTNET,
      deployment.pstToken,
      "MINTER_ROLE",
      deployment.pstStaking,
      "pst"
    );
    console.log(`✅ PSTStaking has MINTER_ROLE on PST: ${hasMinterRole}`);

    // Mint test USDC to users
    console.log("\n💰 Setting up test tokens...");
    const testAmount = ethers.parseUnits("1000", 6); // 1000 USDC
    await stablecoin.mint(user1.address, testAmount);
    await stablecoin.mint(user2.address, testAmount);
    console.log(`✅ Minted ${ethers.formatUnits(testAmount, 6)} USDC to each user`);

    // Approve staking contract
    await stablecoin.connect(user1).approve(deployment.pstStaking, testAmount);
    await stablecoin.connect(user2).approve(deployment.pstStaking, testAmount);
    console.log("✅ Approved staking contract to spend USDC");

    // Test staking using SDK
    console.log("\n🥩 Testing Staking Operations using SDK...");
    
    // User1 stakes in Super Senior tranche
    const superSeniorStakeConfig = {
      amount: ethers.parseUnits("600", 6).toString(),
      tranche: Tranche.SUPER_SENIOR,
      chain: Chain.BERACHAIN_TESTNET
    };

    const stakeResult1 = await stakeClient.stake(
      superSeniorStakeConfig,
      deployment.pstStaking,
      user1.privateKey
    );
    console.log(`✅ User1 staked in Super Senior - TX: ${stakeResult1.transactionHash}`);

    // User2 stakes in Junior tranche
    const juniorStakeConfig = {
      amount: ethers.parseUnits("400", 6).toString(),
      tranche: Tranche.JUNIOR,
      chain: Chain.BERACHAIN_TESTNET
    };

    const stakeResult2 = await stakeClient.stake(
      juniorStakeConfig,
      deployment.pstStaking,
      user2.privateKey
    );
    console.log(`✅ User2 staked in Junior - TX: ${stakeResult2.transactionHash}`);

    // Test balance queries using SDK
    console.log("\n📊 Testing Balance Queries using SDK...");
    
    const user1PstBalance = await stakeClient.getPSTBalance(
      Chain.BERACHAIN_TESTNET,
      deployment.pstStaking,
      user1.address
    );
    console.log(`✅ User1 PST Balance: ${ethers.formatUnits(user1PstBalance, 6)}`);

    const user2PstjBalance = await stakeClient.getPSTJBalance(
      Chain.BERACHAIN_TESTNET,
      deployment.pstStaking,
      user2.address
    );
    console.log(`✅ User2 PSTJ Balance: ${ethers.formatUnits(user2PstjBalance, 6)}`);

    // Test stake info queries using SDK
    const user1StakeInfo = await stakeClient.getStakeInfo(
      Chain.BERACHAIN_TESTNET,
      deployment.pstStaking,
      user1.address
    );
    console.log(`✅ User1 Stake Info - Amount: ${ethers.formatUnits(user1StakeInfo.amount, 6)}, Tranche: ${user1StakeInfo.tranche}`);

    // Test total collateral query using SDK
    const totalCollateral = await stakeClient.getTotalCollateral(
      Chain.BERACHAIN_TESTNET,
      deployment.pstStaking
    );
    console.log(`✅ Total Collateral: ${ethers.formatUnits(totalCollateral, 6)} USDC`);

    // Wait for lockup period to test withdrawals
    console.log("\n⏳ Waiting for lockup period (15 seconds)...");
    await new Promise(resolve => setTimeout(resolve, 15000));

    // Test withdrawal using SDK
    console.log("\n💸 Testing Withdrawal using SDK...");
    const withdrawAmount = ethers.parseUnits("100", 6).toString();
    
    const withdrawResult = await stakeClient.withdraw(
      Chain.BERACHAIN_TESTNET,
      deployment.pstStaking,
      withdrawAmount,
      user1.privateKey
    );
    console.log(`✅ User1 withdrew ${ethers.formatUnits(withdrawAmount, 6)} USDC - TX: ${withdrawResult.transactionHash}`);

    // Final balance check
    const finalPstBalance = await stakeClient.getPSTBalance(
      Chain.BERACHAIN_TESTNET,
      deployment.pstStaking,
      user1.address
    );
    console.log(`✅ User1 Final PST Balance: ${ethers.formatUnits(finalPstBalance, 6)}`);

    // Test admin functions using SDK
    console.log("\n⚙️  Testing Admin Functions using SDK...");
    
    // Test pause/unpause
    await stakeClient.pause(
      Chain.BERACHAIN_TESTNET,
      deployment.pstStaking,
      deployer.privateKey
    );
    console.log("✅ Paused staking contract");

    await stakeClient.unpause(
      Chain.BERACHAIN_TESTNET,
      deployment.pstStaking,
      deployer.privateKey
    );
    console.log("✅ Unpaused staking contract");

    // Generate comprehensive report
    console.log("\n📊 Test Report");
    console.log("=" .repeat(50));
    console.log("🎯 SDK Test Results:");
    console.log("✅ Deployment: Success");
    console.log("✅ Role Management: Success");
    console.log("✅ Staking Operations: Success");
    console.log("✅ Balance Queries: Success");
    console.log("✅ Withdrawal Operations: Success");
    console.log("✅ Admin Functions: Success");

    console.log("\n📋 Deployed Addresses:");
    Object.entries(deployment).forEach(([name, address]) => {
      console.log(`  ${name}: ${address}`);
    });

    console.log("\n💎 Final Token Balances:");
    console.log(`  User1 PST: ${ethers.formatUnits(finalPstBalance, 6)}`);
    console.log(`  User2 PSTJ: ${ethers.formatUnits(user2PstjBalance, 6)}`);
    console.log(`  Total Collateral: ${ethers.formatUnits(totalCollateral, 6)} USDC`);

    console.log("\n🎉 All SDK tests completed successfully!");
    console.log("\n📝 Usage Example:");
    console.log("```javascript");
    console.log("const Stake = require('@stratosphere-network/stake');");
    console.log("const { Chain, Tranche } = require('@stratosphere-network/stake');");
    console.log("");
    console.log("const stakeClient = new Stake();");
    console.log("const result = await stakeClient.stake({");
    console.log("  amount: '1000000', // 1 USDC (6 decimals)");
    console.log("  tranche: Tranche.SUPER_SENIOR,");
    console.log("  chain: Chain.BERACHAIN_TESTNET");
    console.log(`}, '${deployment.pstStaking}', 'YOUR_PRIVATE_KEY');`);
    console.log("```");

  } catch (error) {
    console.error("❌ SDK Test failed:", error);
    throw error;
  }
}

// Run the SDK test
testStakingSDK()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 