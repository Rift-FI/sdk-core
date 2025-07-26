const hre = require("hardhat");

async function main() {
  // Get the contract factory
  const PSTToken = await hre.ethers.getContractFactory("PSTToken");

  // Deploy the contract
  const pstToken = await PSTToken.deploy();

  // Wait for deployment to complete
  await pstToken.deployed();

  console.log("PSTToken deployed to:", pstToken.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
