import { BerachainV1Factory } from "./constants";

export interface TokenConfig {
  name: string;
  symbol: string;
  totalSupply: string;
  decimals: number;
  chain: Chain;
}

export enum Chain {
  ETHEREUM_MAINNET = "ethereum-mainnet",
  POLYGON_MAINNET = "polygon-mainnet",
  BERACHAIN_MAINNET = "berachain-mainnet",

  BASE_MAINNET = "base-mainnet",

  ARBITRUM_MAINNET = "arbitrum-mainnet",

  OPTIMISM_MAINNET = "optimism-mainnet",
}

export enum RPC_URLS {
  "ethereum-mainnet" = "https://rpc.ankr.com/eth",
  "polygon-mainnet" = "https://polygon-rpc.com",
  "berachain-mainnet" = "https://rpc.berachain.com",
  "base-mainnet" = "https://mainnet.base.org",
  "arbitrum-mainnet" = "https://arb1.arbitrum.io/rpc",
  "optimism-mainnet" = "https://mainnet.optimism.io",
}

export enum factoryAddress {
  "berachain-mainnet" = BerachainV1Factory,
}
