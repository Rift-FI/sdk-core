
// Chain definitions
export enum SupportedChain {
  ETHEREUM_MAINNET = "ethereum-mainnet",
  ETHEREUM_SEPOLIA = "ethereum-sepolia",
  POLYGON_MAINNET = "polygon-mainnet",
  POLYGON_MUMBAI = "polygon-mumbai",
  BSC_MAINNET = "bsc-mainnet",
  BSC_TESTNET = "bsc-testnet",
  ARBITRUM_MAINNET = "arbitrum-mainnet",
  ARBITRUM_SEPOLIA = "arbitrum-sepolia",
  OPTIMISM_MAINNET = "optimism-mainnet",
  OPTIMISM_SEPOLIA = "optimism-sepolia",
  BASE_MAINNET = "base-mainnet",
  BASE_SEPOLIA = "base-sepolia",
  BERACHAIN_MAINNET = "berachain-mainnet",
  BERACHAIN_TESTNET = "berachain-testnet",
}

// Chain configuration
export interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface Tx {
  account: `0x${string}`;
  to: `0x${string}`;
  data: `0x${string}`;
  value: bigint;
}