import { BaseService } from "../base-service";
import {
  BridgeRoutesResponse,
  BridgeQuoteRequest,
  BridgeQuoteResponse,
  BridgeExecuteRequest,
  BridgeExecuteResponse,
  PreviewBridgeRequest,
  PreviewBridgeResponse,
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

  /**
   * Phase 1 of two-phase v3 signing for a cross-chain bridge. Pulls a
   * fresh Across quote, builds the approve + depositV3 calls, runs
   * prepareUserOperation, returns user_op_hash + ticket.
   *
   * Submit via `signer.submitPreparedUserOp({ ticketId, authProof })`
   * once you've produced an AuthProof bound to `userOpHashHex`.
   */
  async previewTransfer(
    request: PreviewBridgeRequest
  ): Promise<PreviewBridgeResponse> {
    return this.authenticatedRequest<PreviewBridgeResponse>({
      method: "POST",
      url: "/v1/bridge/transfers/preview",
      data: request,
    });
  }
}
