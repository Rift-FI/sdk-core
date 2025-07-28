const hre = require("hardhat");

async function main() {
  // Get the deployer's signer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Address of the deployed PSTToken
  const pstTokenAddress = "0xCb2aD111CF41b5E44A9f0c71fa2826429fBe1C42"; // Replace with your PSTToken address

  // Deploy the PSTStaking contract
  const PSTStaking = await hre.ethers.getContractFactory("PSTStaking");
  const pstStaking = await PSTStaking.deploy(pstTokenAddress);

  // Wait for the deployment to be mined
  await pstStaking.deployed();

  console.log("PSTStaking deployed to:", pstStaking.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during deployment:", error.message);
    process.exit(1);
  });
