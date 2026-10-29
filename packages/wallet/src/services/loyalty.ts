import { BaseService } from "../base-service";
import {
  LoyaltyRedeemRequest,
  LoyaltyRedeemResult,
  LoyaltyRedeemPendingResponse,
  isLoyaltyRedeemPending,
} from "../types";

export class LoyaltyService extends BaseService {
  /**
   * Redeem loyalty points for a USDC payout.
   *
   * Three outcomes:
   *   - completed: `result.success === true`, `result.data.status === "COMPLETED"`.
   *   - pending (HTTP 202): the payout's on-chain outcome is unknown and is
   *     being reconciled. Returned, NOT thrown, with `result.pending === true`
   *     (or use `isLoyaltyRedeemPending(result)`). Show it as
   *     "processing"; do NOT retry. Points are restored automatically if the
   *     transfer did not go through.
   *   - failed: thrown as an `ApiError` (e.g. 400 "Withdrawal failed", points
   *     refunded).
   *
   * Never retried automatically (a replay could double-pay).
   */
  async redeem(request: LoyaltyRedeemRequest): Promise<LoyaltyRedeemResult> {
    const result = await this.authenticatedRequest<any>({
      method: "POST",
      url: "/v1/loyalty/redemptions",
      data: request,
      retries: 0,
    });
    if (isLoyaltyRedeemPending(result)) {
      return { ...result, success: false, pending: true } as LoyaltyRedeemPendingResponse;
    }
    return result as LoyaltyRedeemResult;
  }
}
