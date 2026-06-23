import { BaseService } from "../base-service";
import {
  WalletConnectPairRequest,
  WalletConnectPairResponse,
  WalletConnectSession,
  WalletConnectRequest,
  ApiResponse,
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

  async approveRequest(id: string): Promise<ApiResponse> {
    return this.authenticatedRequest<ApiResponse>({
      method: "POST",
      url: `/v1/wallet-connect/requests/${id}/approve`,
    });
  }

  async rejectRequest(id: string): Promise<ApiResponse> {
    return this.authenticatedRequest<ApiResponse>({
      method: "POST",
      url: `/v1/wallet-connect/requests/${id}/reject`,
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
