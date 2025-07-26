async function main() {
  const PSTToken = await ethers.getContractFactory("PSTToken");
  const pstToken = await PSTToken.deploy();
  await pstToken.deployed();

  console.log("PSTToken deployed to:", pstToken.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
