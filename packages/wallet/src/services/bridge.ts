import { BaseService } from "../base-service";
import {
  BridgeRoutesResponse,
  BridgeQuoteRequest,
  BridgeQuoteResponse,
  BridgeExecuteRequest,
  BridgeExecuteResponse,
} from "../types";

export class BridgeService extends BaseService {
  async getRoutes(): Promise<BridgeRoutesResponse> {
    return this.publicRequest<BridgeRoutesResponse>({
      method: "GET",
      url: "/bridge/routes",
    });
  }

  async getQuote(request: BridgeQuoteRequest): Promise<BridgeQuoteResponse> {
    return this.publicRequest<BridgeQuoteResponse>({
      method: "POST",
      url: "/bridge/quote",
      data: request,
    });
  }

  async execute(request: BridgeExecuteRequest): Promise<BridgeExecuteResponse> {
    return this.authenticatedRequest<BridgeExecuteResponse>({
      method: "POST",
      url: "/bridge/execute",
      data: request,
    });
  }
}
