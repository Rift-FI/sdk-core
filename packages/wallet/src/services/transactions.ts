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
} from "../types";

export class TransactionService extends BaseService {
  async send(request: TransactionRequest): Promise<TransactionResponse> {
    return this.authenticatedRequest<TransactionResponse>({
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
   * Phase 1 of two-phase v3 signing for a token transfer (spend).
   * Builds the ERC-20 transfer call inside the backend, runs
   * prepareUserOperation server-side, returns the user_op_hash + ticket.
   *
   * Submit via `signer.submitPreparedUserOp({ ticketId, authProof })`
   * after producing an AuthProof bound to user_op_hash_hex with the
   * user's passkey or OIDC token.
   *
   * v3 (device-bound) wallets only — v1 / v2 wallets keep using `send()`.
   */
  async previewSpend(
    request: PreviewSpendRequest
  ): Promise<PreviewUserOpResponse> {
    return this.authenticatedRequest<PreviewUserOpResponse>({
      method: "POST",
      url: "/v1/transactions/preview",
      data: request,
    });
  }
}
