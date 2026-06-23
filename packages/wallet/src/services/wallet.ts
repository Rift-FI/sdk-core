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
      url: "/v1/balances/tokens",
      params: {
        token: request.token,
        ...(request.chain && { chain: request.chain }),
      },
    });
  }

  async getChainBalance(request?: ChainBalanceRequest): Promise<ApiResponse<Balance[]>> {
    const options: any = {
      method: "GET",
      url: "/v1/balances",
    };
  
    if (request?.chain) {
      options.params = { chain: request.chain };
    }
  
    return this.authenticatedRequest<ApiResponse<Balance[]>>(options);
  }
}
