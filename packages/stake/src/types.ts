import { BepoliaV1Staking, BerachainV1Staking } from "./constants";

export interface StakingConfig {
  amount: string;
  tranche: Tranche;
  chain: Chain;
}

export interface DeploymentConfig {
  stablecoinAddress: string;
  treasuryAddress: string;
  chain: Chain;
}

export enum Tranche {
  SuperSenior = 0,
  Junior = 1
}

export enum Chain {
  ETHEREUM_MAINNET = "ethereum-mainnet",
  ETHEREUM_SEPOLIA = "ethereum-sepolia",
  POLYGON_MAINNET = "polygon-mainnet",
  BERACHAIN_MAINNET = "berachain-mainnet",
  BERACHAIN_TESTNET = "berachain-testnet",
  BASE_MAINNET = "base-mainnet",
  ARBITRUM_MAINNET = "arbitrum-mainnet",
  OPTIMISM_MAINNET = "optimism-mainnet",
}

export enum RPC_URLS {
  "ethereum-mainnet" = "https://rpc.ankr.com/eth",
  "ethereum-sepolia" = "https://1rpc.io/sepolia",
  "polygon-mainnet" = "https://polygon-rpc.com",
  "berachain-mainnet" = "https://rpc.berachain.com",
  "berachain-testnet" = "https://bepolia.rpc.berachain.com",
  "base-mainnet" = "https://mainnet.base.org",
  "arbitrum-mainnet" = "https://arb1.arbitrum.io/rpc",
  "optimism-mainnet" = "https://mainnet.optimism.io",
}

export enum stakingAddress {
  "berachain-mainnet" = BerachainV1Staking,
  "berachain-testnet" = BepoliaV1Staking,
}

export interface StakeInfo {
  amount: string;
  tranche: Tranche;
  stakeTimestamp: number;
  accruedRewards: string;
}

export interface StakingDeployment {
  pstStaking: string;
  pstInvestment: string;
  pstLiquidity: string;
  pstToken: string;
  pstjToken: string;
  stablecoin: string;
  treasury: string;
}

export interface InvestmentProposal {
  target: string;
  amount: string;
  data: string;
  approvals: number;
  executed: boolean;
  proposer: string;
  timestamp: number;
  expiry: number;
} 