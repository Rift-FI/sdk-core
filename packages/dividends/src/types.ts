// Common types
export interface AddressAmount {
  address: string;
  amount: string;
}

export interface FinishTransferAddressAmount extends AddressAmount {
  type: "signed" | "unsigned";
  txHash?: string;
  txUnsigned?: any;
}

export interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
}

/** Represents a blockchain chain */
export interface Chain {
  id: number;
  rpcUrl?: string;
}

/** Represents a token holder */
export interface Holder extends AddressAmount {}

interface BusinessLogicParams {
  holders: Holder[];
  totalSupply: string;
  dividendAmount: string;
  tokenAddress: string;
  chain: Chain;
}

export interface DistributeDivdendOnchainConfig {
  title?: string;
  directTransfer?: boolean; // if true and private key is provided we will directly transfer stablecoin to contract first
}

/** Input for distributing dividends */
export interface DistributeDividendIn {
  tokenAddress: string;
  stableCoinAddress: string;
  amount: number;
  businessLogic: (params: BusinessLogicParams) => Promise<AddressAmount[]>;
  indexer: (tokenAddress: string, chain: Chain) => Promise<AddressAmount[]>;
}

/** Output for distributing dividends */
export type DistributeDividendOut = FinishTransferAddressAmount[];

export interface DistibuteDividendOutOnChain {
  type: "signed" | "unsigned";
  txHash?: string;
  txUnsigned?: any;
  dividendPortion: AddressAmount[];
}

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
  ANVIL = "anvil",
}
