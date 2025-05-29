import { BaseService } from "../base-service";
import {
  TokenBalanceRequest,
  ChainBalanceRequest,
  Balance,
  ApiResponse,
} from "../types";

export class WalletService extends BaseService {
  async getTokenBalance(
    request: TokenBalanceRequest
  ): Promise<ApiResponse<Balance[]>> {
    return this.authenticatedRequest<ApiResponse<Balance[]>>({
      method: "GET",
      url: "/wallet/token-balance",
      params: {
        token: request.token,
        ...(request.chain && { chain: request.chain }),
      },
    });
  }

  async getChainBalance(
    request?: ChainBalanceRequest
  ): Promise<ApiResponse<Balance[]>> {
    return this.authenticatedRequest<ApiResponse<Balance[]>>({
      method: "GET",
      url: "/wallet/chain-balance",
      params: request?.chain ? { chain: request.chain } : undefined,
    });
  }
}
