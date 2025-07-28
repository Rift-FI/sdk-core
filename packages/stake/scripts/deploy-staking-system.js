const { ethers } = require("hardhat");
const fs = require("fs");

async function deployStakingSystem() {
  console.log("🚀 Deploying PST Staking System using Direct Deployment...\n");

  try {
    const [deployer] = await ethers.getSigners();
    console.log("📋 Deployer:", deployer.address);

    // Check if we need to deploy a mock stablecoin first
    let stablecoinAddress = process.env.STABLECOIN_ADDRESS;
    
    if (!stablecoinAddress) {
      console.log("\n📦 No STABLECOIN_ADDRESS provided, deploying mock USDC...");
      
      // Deploy mock stablecoin
      const MockERC20 = await ethers.getContractFactory("MockTokenA");
      const stablecoin = await MockERC20.deploy("USDC Mock", "USDC", 6);
      await stablecoin.waitForDeployment();
      stablecoinAddress = await stablecoin.getAddress();
      
      console.log(`✅ Mock USDC deployed: ${stablecoinAddress}`);
    } else {
      console.log(`📄 Using existing stablecoin: ${stablecoinAddress}`);
    }

    // Get treasury address
    const treasuryAddress = process.env.TREASURY_ADDRESS || deployer.address;
    console.log(`📄 Treasury address: ${treasuryAddress}`);

    console.log("\n🔨 Starting contract deployments...");
    
    // Deploy PST Token
    console.log("📦 Deploying PST Token...");
    const PSTFactory = await ethers.getContractFactory("PST");
    const pstToken = await PSTFactory.deploy(deployer.address);
    await pstToken.waitForDeployment();
    const pstTokenAddress = await pstToken.getAddress();
    console.log(`✅ PST Token deployed: ${pstTokenAddress}`);

    // Deploy PSTJ Token
    console.log("📦 Deploying PSTJ Token...");
    const PSTJFactory = await ethers.getContractFactory("PSTJ");
    const pstjToken = await PSTJFactory.deploy(deployer.address);
    await pstjToken.waitForDeployment();
    const pstjTokenAddress = await pstjToken.getAddress();
    console.log(`✅ PSTJ Token deployed: ${pstjTokenAddress}`);

    // Deploy PSTInvestment
    console.log("📦 Deploying PSTInvestment...");
    const PSTInvestmentFactory = await ethers.getContractFactory("PSTInvestment");
    const investmentManager = await PSTInvestmentFactory.deploy(
      stablecoinAddress,
      treasuryAddress,
      deployer.address // admin
    );
    await investmentManager.waitForDeployment();
    const investmentAddress = await investmentManager.getAddress();
    console.log(`✅ PSTInvestment deployed: ${investmentAddress}`);

    // Deploy PSTLiquidity
    console.log("📦 Deploying PSTLiquidity...");
    const PSTLiquidityFactory = await ethers.getContractFactory("PSTLiquidity");
    
    // Placeholder addresses for deployment (replace with actual addresses on mainnet)
    const uniswapV3Router = "0xE592427A0AEce92De3Edee1F18E0157C05861564"; // Placeholder
    const uniswapV3PositionManager = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88"; // Placeholder
    const sphereDexAddress = "0x3dAc95faA607570Ae5955681F5F77924Ef783bca"; // Placeholder
    const poolId = "usdc-pst";
    
    const liquidityManager = await PSTLiquidityFactory.deploy(
      stablecoinAddress,
      pstTokenAddress,
      uniswapV3Router,
      uniswapV3PositionManager,
      sphereDexAddress,
      poolId,
      treasuryAddress,
      deployer.address // admin
    );
    await liquidityManager.waitForDeployment();
    const liquidityAddress = await liquidityManager.getAddress();
    console.log(`✅ PSTLiquidity deployed: ${liquidityAddress}`);

    // Deploy PSTStaking
    console.log("📦 Deploying PSTStaking...");
    const PSTStakingFactory = await ethers.getContractFactory("PSTStaking");
    const stakingContract = await PSTStakingFactory.deploy(
      stablecoinAddress,
      pstTokenAddress,
      pstjTokenAddress,
      investmentAddress,
      liquidityAddress,
      treasuryAddress
    );
    await stakingContract.waitForDeployment();
    const stakingAddress = await stakingContract.getAddress();
    console.log(`✅ PSTStaking deployed: ${stakingAddress}`);

    // Grant roles
    console.log("\n🔐 Configuring roles...");
    
    const minterRole = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    const burnerRole = ethers.keccak256(ethers.toUtf8Bytes("BURNER_ROLE"));

    console.log("🔑 Granting PST MINTER_ROLE to PSTStaking...");
    await pstToken.grantRole(minterRole, stakingAddress);
    
    console.log("🔑 Granting PST BURNER_ROLE to PSTStaking...");
    await pstToken.grantRole(burnerRole, stakingAddress);
    
    console.log("🔑 Granting PSTJ MINTER_ROLE to PSTStaking...");
    await pstjToken.grantRole(minterRole, stakingAddress);
    
    console.log("🔑 Granting PSTJ BURNER_ROLE to PSTStaking...");
    await pstjToken.grantRole(burnerRole, stakingAddress);

    // Create deployment data
    const deploymentData = {
      pstStaking: stakingAddress,
      pstInvestment: investmentAddress,
      pstLiquidity: liquidityAddress,
      pstToken: pstTokenAddress,
      pstjToken: pstjTokenAddress,
      stablecoin: stablecoinAddress,
      treasury: treasuryAddress,
      network: network.name,
      timestamp: new Date().toISOString(),
      deployer: deployer.address
    };

    console.log("\n📋 Deployed Contract Addresses:");
    console.log("================================");
    Object.entries(deploymentData).forEach(([name, address]) => {
      if (name !== 'network' && name !== 'timestamp') {
        console.log(`${name}: ${address}`);
      }
    });

    // Save deployment data
    fs.writeFileSync('deployed-staking-system.json', JSON.stringify(deploymentData, null, 2));
    console.log("\n💾 Deployment data saved to deployed-staking-system.json");

    console.log("\n🎯 Deployment Summary:");
    console.log("======================");
    console.log("✅ All contracts deployed successfully");
    console.log("✅ PST/PSTJ tokens configured with proper roles");
    console.log("✅ Investment and liquidity managers connected");
    console.log("✅ Staking contract ready for operations");

    console.log("\n📝 Next Steps:");
    console.log("1. Test the deployment with: npm run build && npx hardhat run scripts/test-staking-sdk.js");
    console.log("2. Update frontend with new contract addresses");
    console.log("3. Configure any additional admin settings");
    console.log("4. Start the staking operations!");

    console.log("\n🚀 Quick test command:");
    console.log(`npx hardhat run scripts/test-staking-sdk.js --network ${network.name}`);

    return deploymentData;

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

// Run the deployment
deployStakingSystem()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 