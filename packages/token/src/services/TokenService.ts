import { ethers, Contract, Provider, Signer } from 'ethers';
import {
  TokenConfig,
  MintRequest,
  BurnRequest,
  TokenFactoryConfig,
  DeployedToken,
  TokenInfo,
  TokenBalance,
  TokenTransfer,
  RoleConfig,
  ContractAddresses,
  TokenStandard
} from '../types';

// ABI definitions for the contracts
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

const MINTABLE_TOKEN_ABI = [
  ...ERC20_ABI,
  "function mint(address to, uint256 amount)",
  "function burn(address account, uint256 amount)",
  "function pause()",
  "function unpause()",
  "function paused() view returns (bool)",
  "function maxSupply() view returns (uint256)",
  "function mintingEnabled() view returns (bool)",
  "function setMaxSupply(uint256 newMaxSupply)",
  "function setMintingEnabled(bool enabled)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function grantRole(bytes32 role, address account)",
  "function revokeRole(bytes32 role, address account)",
  "function MINTER_ROLE() view returns (bytes32)",
  "function BURNER_ROLE() view returns (bytes32)",
  "function PAUSER_ROLE() view returns (bytes32)",
  "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
  "event Mint(address indexed to, uint256 value)",
  "event Burn(address indexed from, uint256 value)",
  "event Paused(address account)",
  "event Unpaused(address account)",
  "event MaxSupplyUpdated(uint256 newMaxSupply)",
  "event MintingToggled(bool enabled)"
];

const TOKEN_FACTORY_ABI = [
  "function deployToken(string name, string symbol, uint256 maxSupply, uint256 initialSupply) payable returns (address)",
  "function getUserTokens(address user) view returns (address[])",
  "function getAllTokens() view returns (address[])",
  "function getTokenCount() view returns (uint256)",
  "function deploymentFee() view returns (uint256)",
  "function feeRecipient() view returns (address)",
  "function setDeploymentFee(uint256 newFee)",
  "function setFeeRecipient(address newRecipient)",
  "function withdrawFees()",
  "event TokenDeployed(address indexed tokenAddress, address indexed owner, string name, string symbol, uint256 maxSupply, uint256 initialSupply)"
];

const SPHR_TOKEN_ABI = [
  ...MINTABLE_TOKEN_ABI,
  "function initialize(address initialAdmin, address initialMinterBurner)",
  "function transferable() view returns (bool)",
  "function setTransferable(bool isTransferable)",
  "function UPGRADER_ROLE() view returns (bytes32)"
];

export class TokenService {
  private provider: Provider;
  private signer?: Signer;
  private contractAddresses: ContractAddresses;

  constructor(provider: Provider, contractAddresses: ContractAddresses, signer?: Signer) {
    this.provider = provider;
    this.signer = signer;
    this.contractAddresses = contractAddresses;
  }

  // --- Token Factory Methods ---

  /**
   * Deploys a new ERC20 token with minting capabilities
   */
  async deployToken(config: TokenConfig, deploymentFee?: string): Promise<DeployedToken> {
    if (!this.signer) {
      throw new Error('Signer required for token deployment');
    }

    if (!this.contractAddresses.tokenFactory) {
      throw new Error('Token factory address not configured');
    }

    const factory = new Contract(this.contractAddresses.tokenFactory, TOKEN_FACTORY_ABI, this.signer);
    
    const maxSupply = config.maxSupply ? ethers.parseEther(config.maxSupply) : 0;
    const initialSupply = config.initialSupply ? ethers.parseEther(config.initialSupply) : 0;
    
    const feeAmount = deploymentFee ? ethers.parseEther(deploymentFee) : await factory.deploymentFee();

    const tx = await factory.deployToken(
      config.name,
      config.symbol,
      maxSupply,
      initialSupply,
      { value: feeAmount }
    );

    const receipt = await tx.wait();
    
    // Find the TokenDeployed event
    const deployEvent = receipt.logs.find((log: any) => {
      try {
        const parsed = factory.interface.parseLog(log);
        return parsed?.name === 'TokenDeployed';
      } catch {
        return false;
      }
    });

    if (!deployEvent) {
      throw new Error('Token deployment event not found');
    }

    const parsedEvent = factory.interface.parseLog(deployEvent);
    const tokenAddress = parsedEvent?.args[0];

    return {
      address: tokenAddress,
      name: config.name,
      symbol: config.symbol,
      decimals: 18, // Default for ERC20
      totalSupply: config.initialSupply || '0',
      maxSupply: config.maxSupply,
      owner: await this.signer.getAddress(),
      deploymentTx: tx.hash,
      deployedAt: new Date()
    };
  }

  /**
   * Gets all tokens deployed by a user
   */
  async getUserTokens(userAddress: string): Promise<string[]> {
    if (!this.contractAddresses.tokenFactory) {
      throw new Error('Token factory address not configured');
    }

    const factory = new Contract(this.contractAddresses.tokenFactory, TOKEN_FACTORY_ABI, this.provider);
    return await factory.getUserTokens(userAddress);
  }

  /**
   * Gets all deployed tokens from the factory
   */
  async getAllTokens(): Promise<string[]> {
    if (!this.contractAddresses.tokenFactory) {
      throw new Error('Token factory address not configured');
    }

    const factory = new Contract(this.contractAddresses.tokenFactory, TOKEN_FACTORY_ABI, this.provider);
    return await factory.getAllTokens();
  }

  // --- Token Interaction Methods ---

  /**
   * Mints new tokens to a specified address
   */
  async mintTokens(request: MintRequest): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required for minting');
    }

    const tokenAddress = request.tokenAddress || this.contractAddresses.sphrToken;
    if (!tokenAddress) {
      throw new Error('Token address required');
    }

    const token = new Contract(tokenAddress, MINTABLE_TOKEN_ABI, this.signer);
    const amount = ethers.parseEther(request.amount);

    const tx = await token.mint(request.to, amount);
    await tx.wait();
    
    return tx.hash;
  }

  /**
   * Burns tokens from a specified address
   */
  async burnTokens(request: BurnRequest): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required for burning');
    }

    const tokenAddress = request.tokenAddress || this.contractAddresses.sphrToken;
    if (!tokenAddress) {
      throw new Error('Token address required');
    }

    const token = new Contract(tokenAddress, MINTABLE_TOKEN_ABI, this.signer);
    const amount = ethers.parseEther(request.amount);

    const tx = await token.burn(request.from, amount);
    await tx.wait();
    
    return tx.hash;
  }

  /**
   * Gets detailed information about a token
   */
  async getTokenInfo(tokenAddress: string): Promise<TokenInfo> {
    const token = new Contract(tokenAddress, MINTABLE_TOKEN_ABI, this.provider);

    const [name, symbol, decimals, totalSupply, maxSupply, paused, mintingEnabled] = await Promise.all([
      token.name(),
      token.symbol(),
      token.decimals(),
      token.totalSupply(),
      token.maxSupply(),
      token.paused(),
      token.mintingEnabled()
    ]);

    // Try to get owner (admin role)
    let owner = '';
    try {
      const adminRole = await token.DEFAULT_ADMIN_ROLE();
      // This is a simplified approach - in reality you'd need to query role members
      owner = 'Unknown'; // Would need additional contract calls to determine
    } catch {
      owner = 'Unknown';
    }

    return {
      address: tokenAddress,
      name,
      symbol,
      decimals,
      totalSupply: ethers.formatUnits(totalSupply, decimals),
      maxSupply: maxSupply > 0 ? ethers.formatUnits(maxSupply, decimals) : undefined,
      owner,
      mintable: mintingEnabled,
      burnable: true, // Assuming all our tokens are burnable
      pausable: true, // Assuming all our tokens are pausable
      paused
    };
  }

  /**
   * Gets token balance for an address
   */
  async getTokenBalance(tokenAddress: string, userAddress: string): Promise<TokenBalance> {
    const token = new Contract(tokenAddress, ERC20_ABI, this.provider);

    const [balance, symbol, decimals] = await Promise.all([
      token.balanceOf(userAddress),
      token.symbol(),
      token.decimals()
    ]);

    return {
      address: tokenAddress,
      balance: ethers.formatUnits(balance, decimals),
      decimals,
      symbol
    };
  }

  /**
   * Transfers tokens between addresses
   */
  async transferTokens(tokenAddress: string, to: string, amount: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required for transfer');
    }

    const token = new Contract(tokenAddress, ERC20_ABI, this.signer);
    const decimals = await token.decimals();
    const transferAmount = ethers.parseUnits(amount, decimals);

    const tx = await token.transfer(to, transferAmount);
    await tx.wait();
    
    return tx.hash;
  }

  // --- Role Management Methods ---

  /**
   * Grants a role to an address
   */
  async grantRole(tokenAddress: string, role: string, account: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required for role management');
    }

    const token = new Contract(tokenAddress, MINTABLE_TOKEN_ABI, this.signer);
    const roleHash = ethers.keccak256(ethers.toUtf8Bytes(role));

    const tx = await token.grantRole(roleHash, account);
    await tx.wait();
    
    return tx.hash;
  }

  /**
   * Revokes a role from an address
   */
  async revokeRole(tokenAddress: string, role: string, account: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required for role management');
    }

    const token = new Contract(tokenAddress, MINTABLE_TOKEN_ABI, this.signer);
    const roleHash = ethers.keccak256(ethers.toUtf8Bytes(role));

    const tx = await token.revokeRole(roleHash, account);
    await tx.wait();
    
    return tx.hash;
  }

  /**
   * Checks if an address has a specific role
   */
  async hasRole(tokenAddress: string, role: string, account: string): Promise<boolean> {
    const token = new Contract(tokenAddress, MINTABLE_TOKEN_ABI, this.provider);
    const roleHash = ethers.keccak256(ethers.toUtf8Bytes(role));

    return await token.hasRole(roleHash, account);
  }

  // --- Utility Methods ---

  /**
   * Pauses a token contract
   */
  async pauseToken(tokenAddress: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required for pausing');
    }

    const token = new Contract(tokenAddress, MINTABLE_TOKEN_ABI, this.signer);
    const tx = await token.pause();
    await tx.wait();
    
    return tx.hash;
  }

  /**
   * Unpauses a token contract
   */
  async unpauseToken(tokenAddress: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required for unpausing');
    }

    const token = new Contract(tokenAddress, MINTABLE_TOKEN_ABI, this.signer);
    const tx = await token.unpause();
    await tx.wait();
    
    return tx.hash;
  }

  /**
   * Sets the maximum supply for a token
   */
  async setMaxSupply(tokenAddress: string, maxSupply: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required for setting max supply');
    }

    const token = new Contract(tokenAddress, MINTABLE_TOKEN_ABI, this.signer);
    const amount = ethers.parseEther(maxSupply);

    const tx = await token.setMaxSupply(amount);
    await tx.wait();
    
    return tx.hash;
  }

  /**
   * Enables or disables minting for a token
   */
  async setMintingEnabled(tokenAddress: string, enabled: boolean): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required for setting minting status');
    }

    const token = new Contract(tokenAddress, MINTABLE_TOKEN_ABI, this.signer);
    const tx = await token.setMintingEnabled(enabled);
    await tx.wait();
    
    return tx.hash;
  }

  // --- SPHR Token Specific Methods ---

  /**
   * Sets transferability for SPHR token
   */
  async setTransferable(transferable: boolean): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required for setting transferability');
    }

    if (!this.contractAddresses.sphrToken) {
      throw new Error('SPHR token address not configured');
    }

    const token = new Contract(this.contractAddresses.sphrToken, SPHR_TOKEN_ABI, this.signer);
    const tx = await token.setTransferable(transferable);
    await tx.wait();
    
    return tx.hash;
  }

  /**
   * Checks if SPHR token is transferable
   */
  async isTransferable(): Promise<boolean> {
    if (!this.contractAddresses.sphrToken) {
      throw new Error('SPHR token address not configured');
    }

    const token = new Contract(this.contractAddresses.sphrToken, SPHR_TOKEN_ABI, this.provider);
    return await token.transferable();
  }
} 