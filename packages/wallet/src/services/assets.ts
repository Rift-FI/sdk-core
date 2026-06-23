import { BaseService } from "../base-service";
import {
  WalletChain,
  WalletToken,
  ApiResponse,

} from "../types";

export class AssetsService extends BaseService {
  /**
   * Get supported chains
   * @param active - If true, returns only chains where the user has active balances (requires authentication)
   */
  async getSupportedChains(
    active?: boolean
  ): Promise<ApiResponse<WalletChain[]>> {
    if (active) {
      // This requires authentication
      return this.authenticatedRequest<ApiResponse<WalletChain[]>>({
        method: "GET",
        url: "/v1/chains",
        params: { active: "true" },
      });
    } else {
      // Public endpoint
      return this.publicRequest<ApiResponse<WalletChain[]>>({
        method: "GET",
        url: "/v1/chains",
      });
    }
  }

  /**
   * Get all available tokens
   */
  async getAllTokens(): Promise<ApiResponse<WalletToken[]>> {
    return this.publicRequest<ApiResponse<WalletToken[]>>({
      method: "GET",
      url: "/v1/tokens",
    });
  }

  /**
   * Get tokens owned by the authenticated user
   */
  async getUserTokens(): Promise<ApiResponse<WalletToken[]>> {
    return this.authenticatedRequest<ApiResponse<WalletToken[]>>({
      method: "GET",
      url: "/v1/me/tokens",
    });
  }

  /**
   * Get tokens for a specific chain by chain ID
   */
  async getTokensByChainId(
    chainId: string
  ): Promise<ApiResponse<WalletToken[]>> {
    return this.publicRequest<ApiResponse<WalletToken[]>>({
      method: "GET",
      url: `/v1/chains/${chainId}/tokens`,
    });
  }

  /**
   * Get a single token by token ID
   * @param tokenId - Token ID in format: CHAINNAME-SYMBOL (e.g., "ETHEREUM-USDC")
   */
  async getTokenById(tokenId: string): Promise<ApiResponse<WalletToken>> {
    return this.publicRequest<ApiResponse<WalletToken>>({
      method: "GET",
      url: `/v1/tokens/${tokenId}`,
    });
  }

  /**
   * Get a single chain by chain ID
   */
  async getChainById(chainId: string): Promise<ApiResponse<WalletChain>> {
    return this.publicRequest<ApiResponse<WalletChain>>({
      method: "GET",
      url: `/v1/chains/${chainId}`,
    });
  }
}
