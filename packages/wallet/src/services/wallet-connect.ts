import { BaseService } from "../base-service";
import {
  WalletConnectPairRequest,
  WalletConnectPairResponse,
  WalletConnectSession,
  WalletConnectRequest,
  ApiResponse,
  MaybeApproval,
  PasskeySubmitFields,
  PreviewUserOpResponse,
} from "../types";

export class WalletConnectService extends BaseService {
  async pair(request: WalletConnectPairRequest): Promise<WalletConnectPairResponse> {
    return this.authenticatedRequest<WalletConnectPairResponse>({
      method: "POST",
      url: "/v1/wallet-connect/pairings",
      data: request,
    });
  }

  async getRequests(): Promise<ApiResponse<WalletConnectRequest[]>> {
    return this.authenticatedRequest<ApiResponse<WalletConnectRequest[]>>({
      method: "GET",
      url: "/v1/wallet-connect/requests",
    });
  }

  /**
   * Phase 1 for a pending dApp request (eth_sendTransaction, personal_sign,
   * typed data). Returns `hashToSign` + ticket for the passkey.
   */
  async previewRequest(id: string): Promise<PreviewUserOpResponse> {
    return this.authenticatedRequest<PreviewUserOpResponse>({
      method: "POST",
      url: `/v1/wallet-connect/requests/${encodeURIComponent(id)}/preview`,
      retries: 0,
    });
  }

  /**
   * Approve a pending dApp request.
   *
   * - `approveRequest(id, { ticketId, authProof })` (from `previewRequest`)
   *   → signs / sends and answers the dApp.
   * - `approveRequest(id)` → returns an approval request (HTTP 202) for the
   *   user to approve with a passkey.
   *
   * Never retried.
   */
  async approveRequest(
    id: string,
    proof: PasskeySubmitFields = {}
  ): Promise<MaybeApproval<ApiResponse>> {
    const data =
      proof.ticketId || proof.authProof
        ? { ticketId: proof.ticketId, authProof: proof.authProof }
        : undefined;
    return this.fundMovingRequest<ApiResponse>({
      method: "POST",
      url: `/v1/wallet-connect/requests/${encodeURIComponent(id)}/approve`,
      ...(data ? { data } : {}),
    });
  }

  async rejectRequest(id: string): Promise<ApiResponse> {
    return this.authenticatedRequest<ApiResponse>({
      method: "POST",
      url: `/v1/wallet-connect/requests/${encodeURIComponent(id)}/reject`,
    });
  }

  async getSessions(): Promise<ApiResponse<WalletConnectSession[]>> {
    return this.authenticatedRequest<ApiResponse<WalletConnectSession[]>>({
      method: "GET",
      url: "/v1/wallet-connect/sessions",
    });
  }

  async disconnectSession(topic: string): Promise<ApiResponse> {
    return this.authenticatedRequest<ApiResponse>({
      method: "DELETE",
      url: `/v1/wallet-connect/sessions/${topic}`,
    });
  }
}
