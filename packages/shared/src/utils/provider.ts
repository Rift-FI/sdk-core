import { ethers, JsonRpcProvider, Wallet } from 'ethers';
import { SupportedChain, CHAIN_CONFIGS, ViemPublicClientChains } from '../types/chains';
import { createPublicClient, http, PublicClient } from 'viem';
import { mainnet } from 'viem/chains'

/**
 * Creates a JSON RPC provider for the specified chain
 * @param chain The supported chain to create a provider for
 * @returns JsonRpcProvider instance
 */
export function createProvider(chain: SupportedChain): JsonRpcProvider {
  const chainConfig = CHAIN_CONFIGS[chain];
  if (!chainConfig) {
    throw new Error(`Unsupported chain: ${chain}`);
  }
  
  return new JsonRpcProvider(chainConfig.rpcUrl, {
    chainId: chainConfig.chainId,
    name: chainConfig.name
  });
}

/**
 * Creates a wallet from a private key and connects it to the specified chain
 * @param privateKey The private key to create the wallet from
 * @param chain The supported chain to connect to
 * @returns Wallet instance connected to the provider
 */
export function createWallet(privateKey: string, chain: SupportedChain): Wallet {
  const provider = createProvider(chain);
  
  // Ensure private key has 0x prefix
  const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
  
  return new Wallet(formattedPrivateKey, provider);
}

/**
 * Creates a viem public client for the specified chain
 * @param chain The supported chain to create a client for
 * @returns Viem public client instance
 */
export function createViemClient(chain: SupportedChain): PublicClient {
  return createPublicClient({
    chain: ViemPublicClientChains[chain],
    transport: http(),
  });
}

/**
 * Gets the chain configuration for a supported chain
 * @param chain The supported chain
 * @returns ChainConfig object
 */
export function getChainConfig(chain: SupportedChain) {
  const config = CHAIN_CONFIGS[chain];
  if (!config) {
    throw new Error(`Unsupported chain: ${chain}`);
  }
  return config;
} 