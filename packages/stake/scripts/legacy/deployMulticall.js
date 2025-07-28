const hre = require("hardhat");

async function main() {
    // Get the contract factory
    const Multicall3 = await hre.ethers.getContractFactory("Multicall3");

    // Deploy the contract
    const multicall = await Multicall3.deploy();

    // Wait for deployment to complete
    await multicall.deployed();

    console.log("Multicall3 deployed to:", multicall.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
