export interface TokenConfig {
  name: string;
  symbol: string;
  totalSupply: string;
  decimals: number;
  chain: Chain;
  isMintable?: boolean;
  isBurnable?: boolean;
  isPausable?: boolean;
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
  "berachain-mainnet" = "https://rpc.berachain.com",
}

export enum factoryAddress {
  "berachain-mainnet" = "0x52c76E937766FdEeC07a0256E80d8515958c1ae6",
}
