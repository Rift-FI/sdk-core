const { ethers } = require("hardhat");

async function main() {
  console.log("Minting Stablecoins to wallet...");

  // Get the signer (your wallet)
  const [signer] = await ethers.getSigners();
  console.log("Signer address:", signer.address);

  // Stablecoin contract address on Berachain testnet
  const stablecoinAddress = "0x7a94799e4F1f73fAB392fE7aB303e96CE979A6dc";

  // Get the Stablecoin contract
  const Stablecoin = await ethers.getContractFactory("Stablecoin");
  const stablecoin = Stablecoin.attach(stablecoinAddress);

  console.log("Stablecoin contract address:", stablecoinAddress);

  // Check current balance
  const currentBalance = await stablecoin.balanceOf(signer.address);
  console.log("Current balance:", ethers.formatUnits(currentBalance, 6), "Stablecoin");

  // Mint 1000 Stablecoins (6 decimals)
  const mintAmount = ethers.parseUnits("1000", 6); // 1000 tokens with 6 decimals
  console.log("Minting", ethers.formatUnits(mintAmount, 6), "Stablecoins...");

  try {
    // Transfer from deployer to your wallet
    const tx = await stablecoin.transfer(signer.address, mintAmount);
    await tx.wait();
    
    console.log("✅ Successfully minted Stablecoins!");
    console.log("Transaction hash:", tx.hash);
    
    // Check new balance
    const newBalance = await stablecoin.balanceOf(signer.address);
    console.log("New balance:", ethers.formatUnits(newBalance, 6), "Stablecoin");
    
  } catch (error) {
    console.error("❌ Error minting Stablecoins:", error.message);
    
    // If transfer fails, try to check if we're the owner
    const owner = await stablecoin.owner();
    console.log("Contract owner:", owner);
    console.log("Your address:", signer.address);
    
    if (owner.toLowerCase() === signer.address.toLowerCase()) {
      console.log("You are the owner! You can mint tokens directly.");
    } else {
      console.log("You are not the owner. Ask the contract owner to transfer tokens to your wallet.");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 