export interface DividendConfig {
  tokenAddress: string;
  amount: string;
  startTime: number;
  endTime: number;
}

export interface DividendInfo {
  tokenAddress: string;
  totalAmount: string;
  claimedAmount: string;
  startTime: number;
  endTime: number;
  isActive: boolean;
}

export type IndexerType = "infura" | "thegraph" | "custom";

export interface DistributeDividendIn {
  tokenAddress: string;
  stableCoinAddress: string;
  amount: string;
  chain: {
    id: number;
    rpcUrl?: string;
  };
  businessLogic: (params: {
    holders: {
      address: string;
      amount: string;
    }[];
    totalSupply: string;
    dividendAmount: string;
    tokenAddress: string;
    chain: {
      id: number;
      rpcUrl?: string;
    };
  }) => Promise<{ address: string; amount: string }[]>;
  indexer: {
    type: IndexerType;
    uri: string;
    apiKey?: string;
    customLogic?: (
      tokenAddress: string,
      chain: { id: number; rpcUrl?: string }
    ) => Promise<{ address: string; amount: string }[]>;
  };
}

export type DistributeDividendOut = { address: string; amount: string }[];
