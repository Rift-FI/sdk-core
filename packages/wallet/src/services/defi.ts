import { BaseService } from "../base-service";
import { MaybeApproval, SwapRequest, SwapResponse } from "../types";

export class DeFiService extends BaseService {
  /**
   * @deprecated `/v1/defi/swap` is no longer served by the backend and will
   * be removed in the next major. Build the swap calls yourself (e.g. a
   * LiFi quote) and send them with `signer.previewUserOp` +
   * `signer.submitPreparedUserOp`, or `signer.sendTransaction` to get an
   * approval request. If the backend still answers, a 202 approval request
   * is returned rather than thrown. Never retried.
   */
  async swap(request: SwapRequest): Promise<MaybeApproval<SwapResponse>> {
    return this.fundMovingRequest<SwapResponse>({
      method: "POST",
      url: "/v1/defi/swap",
      data: request,
    });
  }
}
