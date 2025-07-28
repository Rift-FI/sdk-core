async function main() {
    const DepositTokenAddress = "TOKEN_CONTRACT_ADDRESS"; // Replace with actual address
    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy(DepositTokenAddress);
    await vault.deployed();

    console.log("Vault deployed to:", vault.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
