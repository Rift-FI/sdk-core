// Main Token class
export { Token as default, Token, TokenModuleConfig } from './Token';

// Services
export { TokenService } from './services/TokenService';

// Types and interfaces
export {
  TokenConfig,
  DeployTokenParams,
  MintRequest,
  BurnRequest,
  TokenFactoryConfig,
  DeployedToken,
  TokenInfo,
  TokenBalance,
  TokenTransfer,
  RoleConfig,
  TokenEvents,
  TokenStandard,
  ContractAddresses
} from './types';

// Re-export for convenience
export type {
  TokenConfig as TokenDeploymentConfig,
  MintRequest as TokenMintRequest,
  BurnRequest as TokenBurnRequest,
  TokenInfo as TokenDetails,
  TokenBalance as TokenBalanceInfo
} from './types';

// Re-export from shared package
export { SupportedChain } from '@stratosphere-network/shared'; 