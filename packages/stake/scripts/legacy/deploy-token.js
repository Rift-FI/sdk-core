const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("Deploying Token contract...");
  
  // Get the contract factory
  const Token = await ethers.getContractFactory("Token");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Token parameters
  const tokenName = "My Token";
  const tokenSymbol = "MTK";
  const initialSupply = 1000000; // 1 million tokens
  const tokenDecimals = 18;
  const initialAdmin = deployer.address; // Admin role
  const initialMinterBurner = deployer.address; // Minter and burner role

  console.log("\nToken Parameters:");
  console.log("Name:", tokenName);
  console.log("Symbol:", tokenSymbol);
  console.log("Initial Supply:", initialSupply);
  console.log("Decimals:", tokenDecimals);
  console.log("Initial Admin:", initialAdmin);
  console.log("Initial Minter/Burner:", initialMinterBurner);

  // Deploy the upgradeable proxy
  const token = await upgrades.deployProxy(
    Token,
    [
      tokenName,
      tokenSymbol,
      initialSupply,
      tokenDecimals,
      initialAdmin,
      initialMinterBurner
    ],
    {
      initializer: "initialize",
      kind: "uups"
    }
  );

  await token.deployed();

  console.log("\n✅ Token deployed successfully!");
  console.log("Token Proxy Address:", token.address);
  console.log("Token Implementation Address:", await upgrades.erc1967.getImplementationAddress(token.address));
  console.log("Token Admin Address:", await upgrades.erc1967.getAdminAddress(token.address));

  // Verify deployment
  const totalSupply = await token.totalSupply();
  const balance = await token.balanceOf(deployer.address);
  const transferable = await token.transferable();

  console.log("\n📊 Token Info:");
  console.log("Total Supply:", ethers.utils.formatEther(totalSupply), tokenSymbol);
  console.log("Deployer Balance:", ethers.utils.formatEther(balance), tokenSymbol);
  console.log("Transferable:", transferable);
  console.log("Has Burn Function: ✅ Yes (ERC20BurnableUpgradeable)");

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    tokenAddress: token.address,
    implementationAddress: await upgrades.erc1967.getImplementationAddress(token.address),
    adminAddress: await upgrades.erc1967.getAdminAddress(token.address),
    tokenName,
    tokenSymbol,
    initialSupply,
    tokenDecimals,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    totalSupply: totalSupply.toString(),
    transferable
  };

  console.log("\n📋 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  return token;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 