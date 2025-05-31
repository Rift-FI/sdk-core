import { Provider, Signer } from 'ethers';
import { TokenService } from './services/TokenService';
import {
  TokenConfig,
  MintRequest,
  BurnRequest,
  TokenFactoryConfig,
  DeployedToken,
  TokenInfo,
  TokenBalance,
  ContractAddresses,
  TokenStandard
} from './types';

export interface TokenModuleConfig {
  provider: Provider;
  signer?: Signer;
  contractAddresses: ContractAddresses;
}

/**
 * Token Module for StratoSphere SDK
 * 
 * Provides functionality for:
 * - Deploying new ERC20 tokens with minting capabilities
 * - Minting and burning tokens
 * - Managing token roles and permissions
 * - Interacting with the Token Factory contract
 * - Managing SPHR token specific features
 */
export class Token {
  private tokenService: TokenService;
  private config: TokenModuleConfig;

  constructor(config: TokenModuleConfig) {
    this.config = config;
    this.tokenService = new TokenService(
      config.provider,
      config.contractAddresses,
      config.signer
    );
  }

  // --- Configuration Methods ---

  /**
   * Updates the signer for the token module
   */
  setSigner(signer: Signer): void {
    this.config.signer = signer;
    this.tokenService = new TokenService(
      this.config.provider,
      this.config.contractAddresses,
      signer
    );
  }

  /**
   * Updates contract addresses
   */
  setContractAddresses(addresses: Partial<ContractAddresses>): void {
    this.config.contractAddresses = {
      ...this.config.contractAddresses,
      ...addresses
    };
    this.tokenService = new TokenService(
      this.config.provider,
      this.config.contractAddresses,
      this.config.signer
    );
  }

  // --- Token Factory Methods ---

  /**
   * Deploys a new ERC20 token with minting capabilities
   * 
   * @param config Token configuration
   * @param deploymentFee Optional custom deployment fee
   * @returns Promise<DeployedToken> Information about the deployed token
   * 
   * @example
   * ```typescript
   * const deployedToken = await token.deployToken({
   *   name: "My Token",
   *   symbol: "MTK",
   *   maxSupply: "1000000",
   *   initialSupply: "100000",
   *   mintable: true,
   *   burnable: true
   * });
   * console.log(`Token deployed at: ${deployedToken.address}`);
   * ```
   */
  async deployToken(config: TokenConfig, deploymentFee?: string): Promise<DeployedToken> {
    return this.tokenService.deployToken(config, deploymentFee);
  }

  /**
   * Gets all tokens deployed by a specific user
   * 
   * @param userAddress The user's address
   * @returns Promise<string[]> Array of token addresses
   */
  async getUserTokens(userAddress: string): Promise<string[]> {
    return this.tokenService.getUserTokens(userAddress);
  }

  /**
   * Gets all tokens deployed through the factory
   * 
   * @returns Promise<string[]> Array of all token addresses
   */
  async getAllTokens(): Promise<string[]> {
    return this.tokenService.getAllTokens();
  }

  // --- Token Interaction Methods ---

  /**
   * Mints new tokens to a specified address
   * 
   * @param request Mint request details
   * @returns Promise<string> Transaction hash
   * 
   * @example
   * ```typescript
   * const txHash = await token.mint({
   *   to: "0x1234...",
   *   amount: "1000",
   *   tokenAddress: "0x5678..." // Optional, defaults to SPHR token
   * });
   * ```
   */
  async mint(request: MintRequest): Promise<string> {
    return this.tokenService.mintTokens(request);
  }

  /**
   * Burns tokens from a specified address
   * 
   * @param request Burn request details
   * @returns Promise<string> Transaction hash
   * 
   * @example
   * ```typescript
   * const txHash = await token.burn({
   *   from: "0x1234...",
   *   amount: "500",
   *   tokenAddress: "0x5678..." // Optional, defaults to SPHR token
   * });
   * ```
   */
  async burn(request: BurnRequest): Promise<string> {
    return this.tokenService.burnTokens(request);
  }

  /**
   * Gets detailed information about a token
   * 
   * @param tokenAddress The token contract address
   * @returns Promise<TokenInfo> Detailed token information
   */
  async getTokenInfo(tokenAddress: string): Promise<TokenInfo> {
    return this.tokenService.getTokenInfo(tokenAddress);
  }

  /**
   * Gets token balance for a specific address
   * 
   * @param tokenAddress The token contract address
   * @param userAddress The user's address
   * @returns Promise<TokenBalance> Balance information
   */
  async getBalance(tokenAddress: string, userAddress: string): Promise<TokenBalance> {
    return this.tokenService.getTokenBalance(tokenAddress, userAddress);
  }

  /**
   * Transfers tokens between addresses
   * 
   * @param tokenAddress The token contract address
   * @param to Recipient address
   * @param amount Amount to transfer
   * @returns Promise<string> Transaction hash
   */
  async transfer(tokenAddress: string, to: string, amount: string): Promise<string> {
    return this.tokenService.transferTokens(tokenAddress, to, amount);
  }

  // --- Role Management Methods ---

  /**
   * Grants a role to an address
   * 
   * @param tokenAddress The token contract address
   * @param role Role name (e.g., "MINTER_ROLE", "BURNER_ROLE")
   * @param account Address to grant the role to
   * @returns Promise<string> Transaction hash
   */
  async grantRole(tokenAddress: string, role: string, account: string): Promise<string> {
    return this.tokenService.grantRole(tokenAddress, role, account);
  }

  /**
   * Revokes a role from an address
   * 
   * @param tokenAddress The token contract address
   * @param role Role name
   * @param account Address to revoke the role from
   * @returns Promise<string> Transaction hash
   */
  async revokeRole(tokenAddress: string, role: string, account: string): Promise<string> {
    return this.tokenService.revokeRole(tokenAddress, role, account);
  }

  /**
   * Checks if an address has a specific role
   * 
   * @param tokenAddress The token contract address
   * @param role Role name
   * @param account Address to check
   * @returns Promise<boolean> Whether the address has the role
   */
  async hasRole(tokenAddress: string, role: string, account: string): Promise<boolean> {
    return this.tokenService.hasRole(tokenAddress, role, account);
  }

  // --- Token Control Methods ---

  /**
   * Pauses a token contract (stops all transfers, minting, burning)
   * 
   * @param tokenAddress The token contract address
   * @returns Promise<string> Transaction hash
   */
  async pause(tokenAddress: string): Promise<string> {
    return this.tokenService.pauseToken(tokenAddress);
  }

  /**
   * Unpauses a token contract
   * 
   * @param tokenAddress The token contract address
   * @returns Promise<string> Transaction hash
   */
  async unpause(tokenAddress: string): Promise<string> {
    return this.tokenService.unpauseToken(tokenAddress);
  }

  /**
   * Sets the maximum supply for a token
   * 
   * @param tokenAddress The token contract address
   * @param maxSupply New maximum supply (use "0" for unlimited)
   * @returns Promise<string> Transaction hash
   */
  async setMaxSupply(tokenAddress: string, maxSupply: string): Promise<string> {
    return this.tokenService.setMaxSupply(tokenAddress, maxSupply);
  }

  /**
   * Enables or disables minting for a token
   * 
   * @param tokenAddress The token contract address
   * @param enabled Whether minting should be enabled
   * @returns Promise<string> Transaction hash
   */
  async setMintingEnabled(tokenAddress: string, enabled: boolean): Promise<string> {
    return this.tokenService.setMintingEnabled(tokenAddress, enabled);
  }

  // --- SPHR Token Specific Methods ---

  /**
   * Sets transferability for the SPHR token
   * 
   * @param transferable Whether the SPHR token should be transferable
   * @returns Promise<string> Transaction hash
   */
  async setTransferable(transferable: boolean): Promise<string> {
    return this.tokenService.setTransferable(transferable);
  }

  /**
   * Checks if the SPHR token is currently transferable
   * 
   * @returns Promise<boolean> Whether the SPHR token is transferable
   */
  async isTransferable(): Promise<boolean> {
    return this.tokenService.isTransferable();
  }

  // --- Convenience Methods ---

  /**
   * Mints SPHR tokens to an address
   * 
   * @param to Recipient address
   * @param amount Amount to mint
   * @returns Promise<string> Transaction hash
   */
  async mintSPHR(to: string, amount: string): Promise<string> {
    return this.mint({ to, amount });
  }

  /**
   * Burns SPHR tokens from an address
   * 
   * @param from Address to burn from
   * @param amount Amount to burn
   * @returns Promise<string> Transaction hash
   */
  async burnSPHR(from: string, amount: string): Promise<string> {
    return this.burn({ from, amount });
  }

  /**
   * Gets SPHR token balance for an address
   * 
   * @param userAddress The user's address
   * @returns Promise<TokenBalance> Balance information
   */
  async getSPHRBalance(userAddress: string): Promise<TokenBalance> {
    if (!this.config.contractAddresses.sphrToken) {
      throw new Error('SPHR token address not configured');
    }
    return this.getBalance(this.config.contractAddresses.sphrToken, userAddress);
  }

  /**
   * Gets SPHR token information
   * 
   * @returns Promise<TokenInfo> SPHR token information
   */
  async getSPHRInfo(): Promise<TokenInfo> {
    if (!this.config.contractAddresses.sphrToken) {
      throw new Error('SPHR token address not configured');
    }
    return this.getTokenInfo(this.config.contractAddresses.sphrToken);
  }
}

export default Token; 