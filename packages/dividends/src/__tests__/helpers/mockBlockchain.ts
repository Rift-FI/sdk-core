import {
  createPublicClient,
  createWalletClient,
  http,
  Address,
  PublicClient,
  WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { Chain } from "../../types";
import { erc20Abi } from "viem";
import { describe, it, expect } from "@jest/globals";

export const ANVIL_RPC_URL = "http://127.0.0.1:8545";
export const ANVIL_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

export const mockChain: Chain = {
  id: 31337,
  rpcUrl: ANVIL_RPC_URL,
};

export interface MockToken {
  address: Address;
  decimals: number;
  symbol: string;
  name: string;
}

export interface MockBlockchain {
  publicClient: PublicClient;
  walletClient: WalletClient;
  account: ReturnType<typeof privateKeyToAccount>;
  mockUSDC: MockToken;
  mockTokenA: MockToken;
  mockTokenB: MockToken;
  dividendContract: Address;
}

export const setupMockBlockchain = async (): Promise<MockBlockchain> => {
  const publicClient = createPublicClient({
    transport: http(ANVIL_RPC_URL),
  });

  const account = privateKeyToAccount(ANVIL_PRIVATE_KEY as `0x${string}`);
  const walletClient = createWalletClient({
    account,
    transport: http(ANVIL_RPC_URL),
  });

  // Mock token addresses (these would be actual deployed addresses in real tests)
  const mockUSDC: MockToken = {
    address: "0x1234567890123456789012345678901234567890" as Address,
    decimals: 6,
    symbol: "USDC",
    name: "USD Coin",
  };

  const mockTokenA: MockToken = {
    address: "0x2345678901234567890123456789012345678901" as Address,
    decimals: 18,
    symbol: "TKNA",
    name: "Token A",
  };

  const mockTokenB: MockToken = {
    address: "0x3456789012345678901234567890123456789012" as Address,
    decimals: 18,
    symbol: "TKNB",
    name: "Token B",
  };

  const dividendContract =
    "0x4567890123456789012345678901234567890123" as Address;

  // Mock token balances and approvals
  const mockBalances = {
    [mockUSDC.address]: 1000000n * 10n ** BigInt(mockUSDC.decimals),
    [mockTokenA.address]: 1000000n * 10n ** BigInt(mockTokenA.decimals),
    [mockTokenB.address]: 1000000n * 10n ** BigInt(mockTokenB.decimals),
  };

  // Mock token metadata
  const mockTokenMetadata = {
    [mockUSDC.address]: {
      name: mockUSDC.name,
      symbol: mockUSDC.symbol,
      decimals: mockUSDC.decimals,
    },
    [mockTokenA.address]: {
      name: mockTokenA.name,
      symbol: mockTokenA.symbol,
      decimals: mockTokenA.decimals,
    },
    [mockTokenB.address]: {
      name: mockTokenB.name,
      symbol: mockTokenB.symbol,
      decimals: mockTokenB.decimals,
    },
  };

  // Mock contract writes
  walletClient.writeContract = async ({ address, abi, functionName, args }) => {
    return "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
  };

  return {
    publicClient,
    walletClient,
    account,
    mockUSDC,
    mockTokenA,
    mockTokenB,
    dividendContract,
  };
};
