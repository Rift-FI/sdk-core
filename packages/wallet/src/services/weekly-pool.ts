import { BaseService } from "../base-service";
import {
  WeeklyPoolResponse,
  WeeklyPoolHistoryRequest,
  WeeklyPoolHistoryResponse,
  WeeklyPoolReferralResponse,
} from "../types";

export class WeeklyPoolService extends BaseService {
  async getCurrent(): Promise<WeeklyPoolResponse> {
    return this.authenticatedRequest<WeeklyPoolResponse>({
      method: "GET",
      url: "/api/weekly-pool",
    });
  }

  async getHistory(request?: WeeklyPoolHistoryRequest): Promise<WeeklyPoolHistoryResponse> {
    return this.authenticatedRequest<WeeklyPoolHistoryResponse>({
      method: "GET",
      url: "/api/weekly-pool/history",
      params: request,
    });
  }

  async getReferralInfo(): Promise<WeeklyPoolReferralResponse> {
    return this.authenticatedRequest<WeeklyPoolReferralResponse>({
      method: "GET",
      url: "/api/weekly-pool/referral",
    });
  }
}
