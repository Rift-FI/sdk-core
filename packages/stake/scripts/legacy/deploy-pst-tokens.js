const { ethers } = require("hardhat");

async function deployPSTTokens() {
  console.log("🚀 Deploying PST and PSTJ Tokens...\n");

  try {
    const [deployer] = await ethers.getSigners();
    console.log("📋 Deployer:", deployer.address);

    // Deploy PST Token (Super Senior)
    console.log("📦 Deploying PST Token (Super Senior)...");
    const PST = await ethers.getContractFactory("PST");
    const pstToken = await PST.deploy(deployer.address);
    await pstToken.waitForDeployment();
    const pstAddress = await pstToken.getAddress();
    console.log("✅ PST Token deployed to:", pstAddress);

    // Deploy PSTJ Token (Junior)
    console.log("📦 Deploying PSTJ Token (Junior)...");
    const PSTJ = await ethers.getContractFactory("PSTJ");
    const pstjToken = await PSTJ.deploy(deployer.address);
    await pstjToken.waitForDeployment();
    const pstjAddress = await pstjToken.getAddress();
    console.log("✅ PSTJ Token deployed to:", pstjAddress);

    // Verify roles are set correctly
    console.log("\n🔍 Verifying roles...");
    
    const minterRole = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    const burnerRole = ethers.keccak256(ethers.toUtf8Bytes("BURNER_ROLE"));
    const pauserRole = ethers.keccak256(ethers.toUtf8Bytes("PAUSER_ROLE"));

    const pstHasMinterRole = await pstToken.hasRole(minterRole, deployer.address);
    const pstHasBurnerRole = await pstToken.hasRole(burnerRole, deployer.address);
    const pstHasPauserRole = await pstToken.hasRole(pauserRole, deployer.address);

    const pstjHasMinterRole = await pstjToken.hasRole(minterRole, deployer.address);
    const pstjHasBurnerRole = await pstjToken.hasRole(burnerRole, deployer.address);
    const pstjHasPauserRole = await pstjToken.hasRole(pauserRole, deployer.address);

    console.log("PST Token Roles:");
    console.log(`  MINTER_ROLE: ${pstHasMinterRole ? "✅" : "❌"}`);
    console.log(`  BURNER_ROLE: ${pstHasBurnerRole ? "✅" : "❌"}`);
    console.log(`  PAUSER_ROLE: ${pstHasPauserRole ? "✅" : "❌"}`);

    console.log("PSTJ Token Roles:");
    console.log(`  MINTER_ROLE: ${pstjHasMinterRole ? "✅" : "❌"}`);
    console.log(`  BURNER_ROLE: ${pstjHasBurnerRole ? "✅" : "❌"}`);
    console.log(`  PAUSER_ROLE: ${pstjHasPauserRole ? "✅" : "❌"}`);

    // Test minting (optional)
    console.log("\n🧪 Testing minting...");
    try {
      await pstToken.mint(deployer.address, ethers.parseUnits("1000", 6), 0);
      console.log("✅ PST minting test successful");
      
      await pstjToken.mint(deployer.address, ethers.parseUnits("1000", 6), 1);
      console.log("✅ PSTJ minting test successful");
    } catch (error) {
      console.log("❌ Minting test failed:", error.message);
    }

    // Summary
    console.log("\n🎯 Deployment Summary:");
    console.log("======================");
    console.log(`PST Token (Super Senior): ${pstAddress}`);
    console.log(`PSTJ Token (Junior): ${pstjAddress}`);
    console.log(`Deployer: ${deployer.address}`);
    console.log("\n📝 Next Steps:");
    console.log("1. Update your frontend contracts configuration");
    console.log("2. Deploy PSTStakingV2 with these token addresses");
    console.log("3. Grant MINTER_ROLE and BURNER_ROLE to PSTStakingV2 contract");

    // Save addresses to a file
    const addresses = {
      pstToken: pstAddress,
      pstjToken: pstjAddress,
      deployer: deployer.address,
      network: network.name,
      timestamp: new Date().toISOString()
    };

    const fs = require('fs');
    fs.writeFileSync('deployed-pst-tokens.json', JSON.stringify(addresses, null, 2));
    console.log("\n💾 Addresses saved to deployed-pst-tokens.json");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

// Run the deployment
deployPSTTokens()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 