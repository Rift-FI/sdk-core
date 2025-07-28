const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("Upgrading PSTStaking contract...");

  const stakingContractAddress = "0xa2a97689b2eE0168ac30aD58B5B01DDa317f969F"; // Replace with new proxy address

  const PSTStakingV2 = await ethers.getContractFactory("PSTStaking");

  const upgraded = await upgrades.upgradeProxy(stakingContractAddress, PSTStakingV2);

  console.log("PSTStaking contract upgraded at:", await upgraded.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
