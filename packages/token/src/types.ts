export interface TokenConfig {
  name: string;
  symbol: string;
  decimals?: number;
  initialSupply?: string;
  maxSupply?: string;
  mintable?: boolean;
  burnable?: boolean;
  pausable?: boolean;
  upgradeable?: boolean;
}

export interface MintRequest {
  to: string;
  amount: string;
  tokenAddress?: string;
}

export interface BurnRequest {
  from: string;
  amount: string;
  tokenAddress?: string;
}

export interface TokenFactoryConfig {
  owner: string;
  feeRecipient?: string;
  deploymentFee?: string;
}

export interface DeployedToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  maxSupply?: string;
  owner: string;
  deploymentTx: string;
  deployedAt: Date;
}

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  maxSupply?: string;
  owner: string;
  mintable: boolean;
  burnable: boolean;
  pausable: boolean;
  paused: boolean;
}

export interface TokenBalance {
  address: string;
  balance: string;
  decimals: number;
  symbol: string;
}

export interface TokenTransfer {
  from: string;
  to: string;
  amount: string;
  tokenAddress: string;
  txHash: string;
  blockNumber: number;
  timestamp: Date;
}

export interface RoleConfig {
  minter?: string[];
  burner?: string[];
  pauser?: string[];
  upgrader?: string[];
  admin?: string[];
}

export interface TokenEvents {
  Transfer: (from: string, to: string, value: string) => void;
  Mint: (to: string, value: string) => void;
  Burn: (from: string, value: string) => void;
  Pause: () => void;
  Unpause: () => void;
  RoleGranted: (role: string, account: string, sender: string) => void;
  RoleRevoked: (role: string, account: string, sender: string) => void;
}

export enum TokenStandard {
  ERC20 = "ERC20",
  ERC20_MINTABLE = "ERC20_MINTABLE",
  ERC20_BURNABLE = "ERC20_BURNABLE",
  ERC20_PAUSABLE = "ERC20_PAUSABLE",
  ERC20_UPGRADEABLE = "ERC20_UPGRADEABLE",
  SPHR = "SPHR"
}

export interface ContractAddresses {
  tokenFactory?: string;
  sphrToken?: string;
  [key: string]: string | undefined;
} 