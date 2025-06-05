import { createPublicClient, createWalletClient, http, Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { Chain } from "../../types";

export const ANVIL_RPC_URL = "http://127.0.0.1:8545";
export const ANVIL_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Anvil's first private key

export const anvilChain: Chain = {
  id: 31337,
  rpcUrl: ANVIL_RPC_URL,
};

// export const setupAnvil = () => {
//   const publicClient = createPublicClient({
//     transport: http(ANVIL_RPC_URL),
//   });

//   const account = privateKeyToAccount(ANVIL_PRIVATE_KEY as `0x${string}`);
//   const walletClient = createWalletClient({
//     account,
//     transport: http(ANVIL_RPC_URL),
//   });

//   return {
//     publicClient,
//     walletClient,
//     account,
//   };
// };

export const deployContract = async (
  walletClient: any,
  publicClient: any,
  abi: any,
  bytecode: string,
  args: any[] = []
) => {
  const hash = await walletClient.deployContract({
    abi,
    bytecode,
    args,
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return receipt.contractAddress;
};
