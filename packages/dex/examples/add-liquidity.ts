import { ethers } from "ethers";
import { createProvider, Dex } from "../src";
import { DexProvider, SupportedChain } from "../src/types";

async function main() {
  // Initialize provider and wallet
  const provider = createProvider(SupportedChain.BERACHAIN_TESTNET);
  console.log(provider);
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    throw new Error("Please set PRIVATE_KEY environment variable");
  }

  const wallet = new ethers.Wallet(privateKey, provider);

  console.log("Wallet address:", wallet.address);

  //   // Initialize DEX
  const dex = new Dex({
    chain: SupportedChain.BERACHAIN_TESTNET,
    provider: DexProvider.SPHERE,
  });

  // Example token addresses (USDC and COFFE on Berachain Bepolia)
  const tokenA = "0xfE5842861F6fF592A7715091AA50E428c1b5EE20"; // COFFE
  const tokenB = "0x74f745e05C40b0b5b7ea62f8EC11914be8dA18c6"; // USDC
  const amountA = "1";
  const amountB = "100.33";

  try {
    // Check token approvals
    console.log("Checking token approvals...");
    const isTokenAApproved = await dex.liquidity.checkApproval(
      tokenA,
      wallet.address
    );
    const isTokenBApproved = await dex.liquidity.checkApproval(
      tokenB,
      wallet.address
    );

    // Approve tokens if needed
    if (!isTokenAApproved) {
      console.log("Approving token A...");
      const approvalTx = await dex.liquidity.approve(tokenA, amountA);
      const txResponse = await wallet.sendTransaction(approvalTx);
      await txResponse.wait();
      console.log("Token A approved");
    }

    if (!isTokenBApproved) {
      console.log("Approving token B...");
      const approvalTx = await dex.liquidity.approve(tokenB, amountB);
      const txResponse = await wallet.sendTransaction(approvalTx);
      await txResponse.wait();
      console.log("Token B approved");
    }

    console.log("Token A approved", isTokenAApproved);
    console.log("Token B approved", isTokenBApproved);

    // Add liquidity
    console.log("Adding liquidity...");
    const tx = await dex.liquidity.addLiquidity(
      {
        tokenA,
        tokenB,
        amountA,
        amountB,
      },
      wallet.address
    );

    console.log(tx);

    const gas = await wallet.estimateGas(tx);
    console.log(gas);
    // Send the transaction
    const txResponse = await wallet.sendTransaction(tx);
    console.log("Transaction sent:", txResponse.hash);

    // Wait for confirmation
    const receipt = await txResponse.wait();
    console.log("Liquidity added successfully!");
    console.log("Transaction receipt:", receipt);
  } catch (error) {
    console.error("Error:", error);
  }
}

main().catch(console.error);
