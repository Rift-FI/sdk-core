import { BaseService } from "../base-service";
import {
  LoyaltyStatsResponse,
  LoyaltyHistoryRequest,
  LoyaltyHistoryResponse,
  LoyaltyLeaderboardRequest,
  LoyaltyLeaderboardResponse,
  LoyaltyMetricsResponse,
  LoyaltyPointValueResponse,
  LoyaltyRedeemRequest,
  LoyaltyRedeemResponse,
  LoyaltyRedemptionsResponse,
  LoyaltyConfigResponse,
} from "../types";

export class LoyaltyService extends BaseService {
  async getStats(): Promise<LoyaltyStatsResponse> {
    return this.authenticatedRequest<LoyaltyStatsResponse>({
      method: "GET",
      url: "/api/loyalty/stats",
    });
  }

  async getHistory(request?: LoyaltyHistoryRequest): Promise<LoyaltyHistoryResponse> {
    return this.authenticatedRequest<LoyaltyHistoryResponse>({
      method: "GET",
      url: "/api/loyalty/history",
      params: request,
    });
  }

  async getLeaderboard(request?: LoyaltyLeaderboardRequest): Promise<LoyaltyLeaderboardResponse> {
    return this.publicRequest<LoyaltyLeaderboardResponse>({
      method: "GET",
      url: "/api/loyalty/leaderboard",
      params: request,
    });
  }

  async getMetrics(): Promise<LoyaltyMetricsResponse> {
    return this.authenticatedRequest<LoyaltyMetricsResponse>({
      method: "GET",
      url: "/api/loyalty/metrics",
    });
  }

  async getPointValue(): Promise<LoyaltyPointValueResponse> {
    return this.publicRequest<LoyaltyPointValueResponse>({
      method: "GET",
      url: "/api/loyalty/point-value",
    });
  }

  async redeem(request: LoyaltyRedeemRequest): Promise<LoyaltyRedeemResponse> {
    return this.authenticatedRequest<LoyaltyRedeemResponse>({
      method: "POST",
      url: "/api/loyalty/redeem",
      data: request,
    });
  }

  async getRedemptions(): Promise<LoyaltyRedemptionsResponse> {
    return this.authenticatedRequest<LoyaltyRedemptionsResponse>({
      method: "GET",
      url: "/api/loyalty/redemptions",
    });
  }

  async getConfig(): Promise<LoyaltyConfigResponse> {
    return this.authenticatedRequest<LoyaltyConfigResponse>({
      method: "GET",
      url: "/api/loyalty/config",
    });
  }
}
