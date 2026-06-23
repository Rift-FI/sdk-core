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
      url: "/v1/bridge/routes",
    });
  }

  async getQuote(request: BridgeQuoteRequest): Promise<BridgeQuoteResponse> {
    return this.publicRequest<BridgeQuoteResponse>({
      method: "POST",
      url: "/v1/bridge/quotes",
      data: request,
    });
  }

  async execute(request: BridgeExecuteRequest): Promise<BridgeExecuteResponse> {
    return this.authenticatedRequest<BridgeExecuteResponse>({
      method: "POST",
      url: "/v1/bridge/transfers",
      data: request,
    });
  }
}
