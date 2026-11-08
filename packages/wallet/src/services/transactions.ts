import { BaseService } from "../base-service";
import {
  TransactionRequest,
  TransactionResponse,
  TransactionHistoryRequest,
  Transaction,
  TransactionFeeRequest,
  TransactionFeeResponse,
  PreviewSpendRequest,
  PreviewUserOpResponse,
  MaybeApproval,
} from "../types";

export class TransactionService extends BaseService {
  /**
   * Send tokens from the user's wallet.
   *
   * - With `ticketId` + `authProof` (from `previewSpend`) → submits.
   * - Without → returns `{ status: "APPROVAL_REQUIRED", approvalUrl, ... }`
   *   (HTTP 202) instead of throwing. Give `approvalUrl` to the user.
   *
   * Never retried: a replay could pay twice.
   */
  async send(
    request: TransactionRequest
  ): Promise<MaybeApproval<TransactionResponse>> {
    return this.fundMovingRequest<TransactionResponse>({
      method: "POST",
      url: "/v1/transactions",
      data: request,
    });
  }

  async getHistory(
    request?: TransactionHistoryRequest
  ): Promise<Transaction[]> {
    return this.authenticatedRequest<Transaction[]>({
      method: "POST",
      url: "/v1/transactions",
      params: request,
    });
  }

  async getFee(
    request: TransactionFeeRequest
  ): Promise<TransactionFeeResponse> {
    return this.authenticatedRequest<TransactionFeeResponse>({
      method: "GET",
      url: "/v1/transactions/fee-estimate",
      params: request,
    });
  }

  /**
   * Phase 1 of a two-phase token transfer. Returns `hashToSign` + a
   * single-use ticket. Sign with `createPasskeyAuthProof`, then submit with
   * `signer.submitPreparedUserOp({ ticketId, authProof })` (or
   * `send({ ...request, ticketId, authProof })`).
   */
  async previewSpend(
    request: PreviewSpendRequest
  ): Promise<PreviewUserOpResponse> {
    return this.authenticatedRequest<PreviewUserOpResponse>({
      method: "POST",
      url: "/v1/transactions/preview",
      data: request,
      retries: 0,
    });
  }
}
