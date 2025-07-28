const { ethers } = require("hardhat");

async function main() {
  // Configuration - Update these values
  const TOKEN_ADDRESS = "0x..."; // Replace with your deployed token address
  const MINT_TO_ADDRESS = "0x..."; // Replace with recipient address
  const MINT_AMOUNT = "1000"; // Amount to mint (in token units, not wei)

  console.log("Minting tokens...");
  
  // Get the contract factory and attach to deployed contract
  const Token = await ethers.getContractFactory("Token");
  const token = Token.attach(TOKEN_ADDRESS);
  
  // Get the signer (should have MINTER_ROLE)
  const [signer] = await ethers.getSigners();
  console.log("Minting with account:", signer.address);

  // Check if the signer has MINTER_ROLE
  const MINTER_ROLE = await token.MINTER_ROLE();
  const hasMinterRole = await token.hasRole(MINTER_ROLE, signer.address);
  
  if (!hasMinterRole) {
    console.error("❌ Account does not have MINTER_ROLE");
    process.exit(1);
  }

  // Get token decimals
  const decimals = await token.decimals();
  const mintAmountWei = ethers.utils.parseUnits(MINT_AMOUNT, decimals);

  console.log("\n📋 Minting Details:");
  console.log("Token Address:", TOKEN_ADDRESS);
  console.log("Mint To:", MINT_TO_ADDRESS);
  console.log("Amount:", MINT_AMOUNT, await token.symbol());
  console.log("Amount (Wei):", mintAmountWei.toString());

  // Check balances before minting
  const balanceBefore = await token.balanceOf(MINT_TO_ADDRESS);
  const totalSupplyBefore = await token.totalSupply();

  console.log("\n📊 Before Minting:");
  console.log("Recipient Balance:", ethers.utils.formatUnits(balanceBefore, decimals));
  console.log("Total Supply:", ethers.utils.formatUnits(totalSupplyBefore, decimals));

  // Mint tokens
  console.log("\n🔄 Minting tokens...");
  const tx = await token.mint(MINT_TO_ADDRESS, mintAmountWei);
  console.log("Transaction hash:", tx.hash);
  
  // Wait for transaction confirmation
  const receipt = await tx.wait();
  console.log("Transaction confirmed in block:", receipt.blockNumber);

  // Check balances after minting
  const balanceAfter = await token.balanceOf(MINT_TO_ADDRESS);
  const totalSupplyAfter = await token.totalSupply();

  console.log("\n📊 After Minting:");
  console.log("Recipient Balance:", ethers.utils.formatUnits(balanceAfter, decimals));
  console.log("Total Supply:", ethers.utils.formatUnits(totalSupplyAfter, decimals));

  console.log("\n✅ Minting completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Minting failed:", error);
    process.exit(1);
  }); 