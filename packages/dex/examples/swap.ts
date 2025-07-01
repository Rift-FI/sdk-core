import { SupportedChain } from "../../shared/src";
import { createProvider, Dex, DexProvider } from "../src";
import { MaxUint256, Wallet } from "ethers";
import Sphere, { Environment } from "@stratosphere-network/wallet";

async function main() {
  const privateKey = process.env.PRIVATE_KEY as string;


  // console.log(signupWithPassword);
  const provider = createProvider(SupportedChain.BERACHAIN_TESTNET);
  const wallet = new Wallet(privateKey, provider);

  const dex = new Dex({
    chain: SupportedChain.BERACHAIN_TESTNET,
    provider: DexProvider.SPHERE,
  });

  // Swap from COFFE to USDC
  // Current price 1 USDC = 100 COFFE
  const swampFrom = "0xfE5842861F6fF592A7715091AA50E428c1b5EE20";
  const swapTo = "0x74f745e05C40b0b5b7ea62f8EC11914be8dA18c6";

  const amount = "10";

  // Estimate the swap output amount
  // const swap = await dex.swap.estimateSwap(swampFrom, swapTo, amount);

  // // print swap details
  // console.log(swap);

  // check if the token is approved
  const isApproved = await dex.swap.checkApproval(swampFrom, wallet.address);
  console.log(`${swampFrom} is approved: ${isApproved}`);

  // approve the token if not approved
  if (!isApproved) {
    const approveData = await dex.swap.approve(swampFrom, amount);
    
    // send the transaction
    const tx = await wallet.sendTransaction(approveData);
    console.log("Approve Transaction", tx);
  }

  // generate swap token transaction
  const tx = await dex.swap.swap(swampFrom, swapTo, amount, wallet.address);

  console.log("tx", tx);
  // send the transaction
  const txHash = await wallet.sendTransaction(tx);
  console.log("txHash", txHash);
}

main().catch(console.error);
