import { BaseService } from "../base-service";
import { SwapRequest, SwapResponse } from "../types";

export class DeFiService extends BaseService {
  async swap(request: SwapRequest): Promise<SwapResponse> {
    return this.authenticatedRequest<SwapResponse>({
      method: "POST",
      url: "/defi/swap",
      data: request,
    });
  }
}
