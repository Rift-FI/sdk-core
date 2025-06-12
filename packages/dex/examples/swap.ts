import { SupportedChain } from "../../shared/src";
import { Dex } from "../src";
import { Wallet } from "ethers";

async function main() {
  const privateKey = process.env.PRIVATE_KEY as string;

  const dex = new Dex({
    chain: SupportedChain.BERACHAIN_TESTNET,
    wallet: new Wallet(privateKey),
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
  const isApproved = await dex.swap.checkApproval(swampFrom);
  console.log(`${swampFrom} is approved: ${isApproved}`);

  // approve the token if not approved
  if (!isApproved) {
    const approved = await dex.swap.approve(swampFrom, amount);
    console.log(`${swampFrom} approved: ${approved}`);
  }

  // swap the token
  const tx = await dex.swap.swap(swampFrom, swapTo, amount);
  console.log("tx", tx);
}

main().catch(console.error);
