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
