import { BaseService } from "../base-service";
import {
  BridgeRoutesResponse,
  BridgeQuoteRequest,
  BridgeQuoteResponse,
  BridgeExecuteRequest,
  BridgeExecuteResponse,
  PreviewBridgeRequest,
  PreviewBridgeResponse,
  MaybeApproval,
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

  /**
   * Bridge tokens cross-chain. Without `ticketId` + `authProof` this
   * returns an approval request (HTTP 202) for the user to approve with a
   * passkey. Never retried.
   */
  async execute(
    request: BridgeExecuteRequest
  ): Promise<MaybeApproval<BridgeExecuteResponse>> {
    return this.fundMovingRequest<BridgeExecuteResponse>({
      method: "POST",
      url: "/v1/bridge/transfers",
      data: request,
    });
  }

  /**
   * Phase 1 of a two-phase bridge. Pulls a fresh Across quote, builds the
   * approve + depositV3 calls and returns `hashToSign` + ticket.
   *
   * Submit via `signer.submitPreparedUserOp({ ticketId, authProof })` with
   * a passkey proof over `hashToSign`.
   */
  async previewTransfer(
    request: PreviewBridgeRequest
  ): Promise<PreviewBridgeResponse> {
    return this.authenticatedRequest<PreviewBridgeResponse>({
      method: "POST",
      url: "/v1/bridge/transfers/preview",
      data: request,
      retries: 0,
    });
  }
}
