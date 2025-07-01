import { ethers } from "ethers";
import { Dex } from "../src";
import { DexProvider, SupportedChain } from "../src/types";

async function main() {
  // Initialize provider and wallet
  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org");
  const privateKey = process.env.PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error("Please set PRIVATE_KEY environment variable");
  }
  
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log("Wallet address:", wallet.address);

  // Initialize DEX
  const dex = new Dex({
    chain: SupportedChain.BSC_MAINNET,
    provider: DexProvider.SPHERE,
  });

  // Example position ID and amounts to add
  const tokenId = 12345; // Replace with your actual position ID
  const amountA = "0.5"; // Additional amount of token A
  const amountB = "2.5"; // Additional amount of token B

  try {
    // Get position information
    console.log("Getting position information...");
    const position = await dex.liquidity.getPosition(tokenId);
    console.log("Position details:", position);

    // Estimate increasing liquidity
    console.log("Estimating liquidity increase...");
    const estimate = await dex.liquidity.estimateIncreaseLiquidity({
      tokenId,
      amountA,
      amountB,
    });
    
    console.log("Liquidity increase estimation:", estimate);

    // Check token approvals
    console.log("Checking token approvals...");
    const isToken0Approved = await dex.liquidity.checkApproval(position.token0, wallet.address);
    const isToken1Approved = await dex.liquidity.checkApproval(position.token1, wallet.address);

    // Approve tokens if needed
    if (!isToken0Approved) {
      console.log("Approving token 0...");
      const approvalTx = await dex.liquidity.approve(position.token0, amountA);
      const txResponse = await wallet.sendTransaction(approvalTx);
      await txResponse.wait();
      console.log("Token 0 approved");
    }

    if (!isToken1Approved) {
      console.log("Approving token 1...");
      const approvalTx = await dex.liquidity.approve(position.token1, amountB);
      const txResponse = await wallet.sendTransaction(approvalTx);
      await txResponse.wait();
      console.log("Token 1 approved");
    }

    // Increase liquidity
    console.log("Increasing liquidity...");
    const tx = await dex.liquidity.increaseLiquidity(
      {
        tokenId,
        amountA,
        amountB,
      },
      wallet.address
    );

    // Send the transaction
    const txResponse = await wallet.sendTransaction(tx);
    console.log("Transaction sent:", txResponse.hash);
    
    // Wait for confirmation
    const receipt = await txResponse.wait();
    console.log("Liquidity increased successfully!");
    console.log("Transaction receipt:", receipt);
  } catch (error) {
    console.error("Error:", error);
  }
}

main().catch(console.error); 