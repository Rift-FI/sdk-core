const { ethers } = require("hardhat");

async function main() {
  console.log("Checking Stablecoin balance...");

  // Get the signer (your wallet)
  const [signer] = await ethers.getSigners();
  console.log("Wallet address:", signer.address);

  // Stablecoin contract address on Berachain testnet
  const stablecoinAddress = "0x7a94799e4F1f73fAB392fE7aB303e96CE979A6dc";

  // Get the Stablecoin contract
  const Stablecoin = await ethers.getContractFactory("Stablecoin");
  const stablecoin = Stablecoin.attach(stablecoinAddress);

  console.log("Stablecoin contract address:", stablecoinAddress);

  try {
    // Check balance
    const balance = await stablecoin.balanceOf(signer.address);
    console.log("Balance:", ethers.formatUnits(balance, 6), "Stablecoin");
    
    // Check total supply
    const totalSupply = await stablecoin.totalSupply();
    console.log("Total supply:", ethers.formatUnits(totalSupply, 6), "Stablecoin");
    
    // Check owner
    const owner = await stablecoin.owner();
    console.log("Contract owner:", owner);
    
    // Check symbol and name
    const symbol = await stablecoin.symbol();
    const name = await stablecoin.name();
    const decimals = await stablecoin.decimals();
    
    console.log("Token name:", name);
    console.log("Token symbol:", symbol);
    console.log("Decimals:", decimals);
    
  } catch (error) {
    console.error("❌ Error checking balance:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 