const { ethers } = require("hardhat");
const fs = require('fs');

async function deployPSTStakingV2() {
  console.log("🚀 Deploying PSTStakingV2 with PST/PSTJ Integration...\n");

  try {
    const [deployer] = await ethers.getSigners();
    console.log("📋 Deployer:", deployer.address);

    // Load existing deployed addresses
    let deployedAddresses = {};
    try {
      const addressesFile = fs.readFileSync('deployed-pst-tokens.json', 'utf8');
      deployedAddresses = JSON.parse(addressesFile);
      console.log("📄 Loaded existing deployed addresses");
    } catch (error) {
      console.log("⚠️  No existing addresses file found. Please deploy PST tokens first.");
      console.log("Run: npx hardhat run scripts/deploy-pst-tokens.js --network berachainBeploia");
      return;
    }

    // Get required addresses
    const stablecoinAddress = process.env.STABLECOIN_ADDRESS;
    const pstTokenAddress = deployedAddresses.pstToken;
    const pstjTokenAddress = deployedAddresses.pstjToken;
    const treasuryAddress = process.env.TREASURY_ADDRESS || deployer.address;

    if (!stablecoinAddress) {
      console.error("❌ STABLECOIN_ADDRESS not set in environment variables");
      return;
    }

    console.log("📋 Contract Addresses:");
    console.log(`  Stablecoin: ${stablecoinAddress}`);
    console.log(`  PST Token: ${pstTokenAddress}`);
    console.log(`  PSTJ Token: ${pstjTokenAddress}`);
    console.log(`  Treasury: ${treasuryAddress}`);

    // Deploy PSTInvestment (if not already deployed)
    console.log("\n📦 Deploying PSTInvestment...");
    const PSTInvestment = await ethers.getContractFactory("PSTInvestment");
    const investmentManager = await PSTInvestment.deploy(
      stablecoinAddress,
      treasuryAddress
    );
    await investmentManager.waitForDeployment();
    const investmentAddress = await investmentManager.getAddress();
    console.log("✅ PSTInvestment deployed to:", investmentAddress);

    // Deploy PSTLiquidity (if not already deployed)
    console.log("📦 Deploying PSTLiquidity...");
    const PSTLiquidity = await ethers.getContractFactory("PSTLiquidity");
    const liquidityManager = await PSTLiquidity.deploy(
      stablecoinAddress,
      treasuryAddress
    );
    await liquidityManager.waitForDeployment();
    const liquidityAddress = await liquidityManager.getAddress();
    console.log("✅ PSTLiquidity deployed to:", liquidityAddress);

    // Deploy PSTStakingV2
    console.log("\n📦 Deploying PSTStakingV2...");
    const PSTStakingV2 = await ethers.getContractFactory("PSTStakingV2");
    const stakingContract = await PSTStakingV2.deploy(
      stablecoinAddress,
      pstTokenAddress,
      pstjTokenAddress,
      investmentAddress,
      liquidityAddress,
      treasuryAddress
    );
    await stakingContract.waitForDeployment();
    const stakingAddress = await stakingContract.getAddress();
    console.log("✅ PSTStakingV2 deployed to:", stakingAddress);

    // Grant roles to PSTStakingV2 contract
    console.log("\n🔐 Granting roles to PSTStakingV2...");
    
    const PST = await ethers.getContractFactory("PST");
    const pstToken = PST.attach(pstTokenAddress);
    
    const PSTJ = await ethers.getContractFactory("PSTJ");
    const pstjToken = PSTJ.attach(pstjTokenAddress);

    const minterRole = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    const burnerRole = ethers.keccak256(ethers.toUtf8Bytes("BURNER_ROLE"));

    // Grant MINTER_ROLE to PSTStakingV2
    await pstToken.grantRole(minterRole, stakingAddress);
    console.log("✅ Granted PST MINTER_ROLE to PSTStakingV2");
    
    await pstjToken.grantRole(minterRole, stakingAddress);
    console.log("✅ Granted PSTJ MINTER_ROLE to PSTStakingV2");

    // Grant BURNER_ROLE to PSTStakingV2
    await pstToken.grantRole(burnerRole, stakingAddress);
    console.log("✅ Granted PST BURNER_ROLE to PSTStakingV2");
    
    await pstjToken.grantRole(burnerRole, stakingAddress);
    console.log("✅ Granted PSTJ BURNER_ROLE to PSTStakingV2");

    // Verify roles
    console.log("\n🔍 Verifying roles...");
    const pstHasMinterRole = await pstToken.hasRole(minterRole, stakingAddress);
    const pstHasBurnerRole = await pstToken.hasRole(burnerRole, stakingAddress);
    const pstjHasMinterRole = await pstjToken.hasRole(minterRole, stakingAddress);
    const pstjHasBurnerRole = await pstjToken.hasRole(burnerRole, stakingAddress);

    console.log("PSTStakingV2 Roles on PST Token:");
    console.log(`  MINTER_ROLE: ${pstHasMinterRole ? "✅" : "❌"}`);
    console.log(`  BURNER_ROLE: ${pstHasBurnerRole ? "✅" : "❌"}`);

    console.log("PSTStakingV2 Roles on PSTJ Token:");
    console.log(`  MINTER_ROLE: ${pstjHasMinterRole ? "✅" : "❌"}`);
    console.log(`  BURNER_ROLE: ${pstjHasBurnerRole ? "✅" : "❌"}`);

    // Test basic functionality
    console.log("\n🧪 Testing basic functionality...");
    try {
      // Test getting PST/PSTJ balances
      const pstBalance = await stakingContract.getPSTBalance(deployer.address);
      const pstjBalance = await stakingContract.getPSTJBalance(deployer.address);
      console.log(`✅ PST Balance check: ${ethers.formatUnits(pstBalance, 6)}`);
      console.log(`✅ PSTJ Balance check: ${ethers.formatUnits(pstjBalance, 6)}`);
    } catch (error) {
      console.log("❌ Basic functionality test failed:", error.message);
    }

    // Summary
    console.log("\n🎯 Deployment Summary:");
    console.log("======================");
    console.log(`PSTStakingV2: ${stakingAddress}`);
    console.log(`PSTInvestment: ${investmentAddress}`);
    console.log(`PSTLiquidity: ${liquidityAddress}`);
    console.log(`PST Token: ${pstTokenAddress}`);
    console.log(`PSTJ Token: ${pstjTokenAddress}`);
    console.log(`Stablecoin: ${stablecoinAddress}`);
    console.log(`Treasury: ${treasuryAddress}`);
    console.log(`Deployer: ${deployer.address}`);

    // Save all addresses
    const allAddresses = {
      ...deployedAddresses,
      pstStakingV2: stakingAddress,
      pstInvestment: investmentAddress,
      pstLiquidity: liquidityAddress,
      stablecoin: stablecoinAddress,
      treasury: treasuryAddress,
      network: network.name,
      timestamp: new Date().toISOString()
    };

    fs.writeFileSync('deployed-pststaking-v2.json', JSON.stringify(allAddresses, null, 2));
    console.log("\n💾 All addresses saved to deployed-pststaking-v2.json");

    console.log("\n📝 Next Steps:");
    console.log("1. Update your frontend to use PSTStakingV2 contract");
    console.log("2. Add PST and PSTJ token addresses to your frontend");
    console.log("3. Test staking functionality with the new token minting/burning");
    console.log("4. Update any existing staking UI to show PST/PSTJ balances");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

// Run the deployment
deployPSTStakingV2()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 