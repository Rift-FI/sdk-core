import { BaseService } from "../base-service";
import {
  ReferralFeeBalanceResponse,
  ReferralFeeEntriesResponse,
  ReferralFeeClaimResponse,
  ReferralFeeClaimsResponse,
  ReferralFeeReferralsRequest,
  ReferralFeeReferralsResponse,
} from "../types";

export class ReferralFeeService extends BaseService {
  async getBalance(): Promise<ReferralFeeBalanceResponse> {
    return this.authenticatedRequest<ReferralFeeBalanceResponse>({
      method: "GET",
      url: "/api/referral-fees/balance",
    });
  }

  async getEntries(): Promise<ReferralFeeEntriesResponse> {
    return this.authenticatedRequest<ReferralFeeEntriesResponse>({
      method: "GET",
      url: "/api/referral-fees/entries",
    });
  }

  async claim(): Promise<ReferralFeeClaimResponse> {
    return this.authenticatedRequest<ReferralFeeClaimResponse>({
      method: "POST",
      url: "/api/referral-fees/claim",
    });
  }

  async getClaims(): Promise<ReferralFeeClaimsResponse> {
    return this.authenticatedRequest<ReferralFeeClaimsResponse>({
      method: "GET",
      url: "/api/referral-fees/claims",
    });
  }

  async getReferrals(request?: ReferralFeeReferralsRequest): Promise<ReferralFeeReferralsResponse> {
    return this.publicRequest<ReferralFeeReferralsResponse>({
      method: "GET",
      url: "/api/referral-fees/referrals",
      params: request,
    });
  }
}
