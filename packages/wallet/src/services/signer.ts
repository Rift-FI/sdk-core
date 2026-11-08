import { BaseService, explainPasskeyError } from "../base-service";
import {
  GetWalletInstanceRequest,
  WalletInstanceResponse,
  SignTransactionRequest,
  SignTransactionResponse,
  SendTransactionRequest,
  SendTransactionResponse,
  SignMessageRequest,
  SignMessageResponse,
  PreviewUserOpRequest,
  PreviewUserOpResponse,
  SubmitPreparedUserOpRequest,
  SubmitPreparedUserOpResponse,
  PreviewMessageRequest,
  SubmitMessageRequest,
  SubmitMessageResponse,
  TwoPhasePreview,
  MaybeApproval,
  ApiError,
  EOA_SIGNING_REMOVED,
} from "../types";

export class SignerService extends BaseService {


  /**
   * Get wallet instance information for a specific chain
   * Returns wallet address, public key, provider info, and chain details
   */
  async getWalletInstance(
    request: GetWalletInstanceRequest
  ): Promise<WalletInstanceResponse> {
    return this.authenticatedRequest<WalletInstanceResponse>({
      method: "POST",
      url: "/v1/wallet/chains/by-id",
      data: request,
    });
  }

  /**
   * @deprecated Removed. Rift wallets are passkey-owned Safe smart accounts;
   * there is no server-held EOA key to sign a raw transaction with. The
   * backend answers 410 `EOA_SIGNING_REMOVED`, which this method rethrows as
   * an `ApiError` with that `code` and an explanatory message.
   *
   * Use `sendTransaction` (UserOperation through the Safe, approval request
   * when called without a passkey proof) or `previewUserOp` +
   * `submitPreparedUserOp`.
   */
  async signTransaction(
    request: SignTransactionRequest
  ): Promise<SignTransactionResponse> {
    try {
      return await this.authenticatedRequest<SignTransactionResponse>({
        method: "POST",
        url: "/v1/wallet/signatures/transaction",
        data: request,
        retries: 0,
      });
    } catch (error) {
      const e = error as ApiError;
      if (e && typeof e === "object" && e.status === 410) {
        throw explainPasskeyError({ ...e, code: EOA_SIGNING_REMOVED });
      }
      throw explainPasskeyError(error);
    }
  }

  /**
   * Execute a call through the user's Safe as an ERC-4337 UserOperation.
   *
   * - With `ticketId` + `authProof` (from `previewUserOp`) → submits it.
   * - Without → returns `{ status: "APPROVAL_REQUIRED", approvalUrl, ... }`
   *   (HTTP 202). Send the user to `approvalUrl`.
   *
   * Never retried.
   */
  async sendTransaction(
    request: SendTransactionRequest
  ): Promise<MaybeApproval<SendTransactionResponse>> {
    return this.fundMovingRequest<SendTransactionResponse>({
      method: "POST",
      url: "/v1/wallet/user-operations",
      data: request,
    });
  }

  /**
   * Sign a message with the user's Safe (ERC-1271; ERC-6492-wrapped when
   * the Safe is not yet deployed on that chain).
   *
   * - With `ticketId` + `authProof` (from `previewMessage`) → returns the
   *   signature.
   * - Without → returns an approval request (HTTP 202).
   */
  async signMessage(
    request: SignMessageRequest
  ): Promise<MaybeApproval<SignMessageResponse>> {
    return this.fundMovingRequest<SignMessageResponse>({
      method: "POST",
      url: "/v1/wallet/signatures/message",
      data: request,
    });
  }

  /**
   * Phase 1 of a message signature: returns `{ ticketId, hashToSign }`
   * (the Safe `SafeMessage` EIP-712 hash). Sign `hashToSign` with
   * `createPasskeyAuthProof` and pass it to `submitMessage`.
   */
  async previewMessage(
    request: PreviewMessageRequest
  ): Promise<TwoPhasePreview> {
    return this.authenticatedRequest<TwoPhasePreview>({
      method: "POST",
      url: "/v1/wallet/signatures/message/preview",
      data: request,
      retries: 0,
    });
  }

  /** Phase 2 of a message signature. Returns the contract signature. */
  async submitMessage(
    request: SubmitMessageRequest
  ): Promise<SubmitMessageResponse> {
    const result = await this.fundMovingRequest<SubmitMessageResponse>({
      method: "POST",
      url: "/v1/wallet/signatures/message",
      data: request,
    });
    return result as SubmitMessageResponse;
  }

  /**
   * Phase 1 of a two-phase UserOperation. Builds the op server-side without
   * signing it and returns `hashToSign` (also `userOpHashHex`), a
   * single-use `ticketId`, and `allowCredentials`.
   *
   *   const preview   = await rift.signer.previewUserOp({ chain, transactionData });
   *   const authProof = await createPasskeyAuthProof(getHashToSign(preview), {
   *     rpId, allowCredentials: preview.allowCredentials,
   *   });
   *   const receipt   = await rift.signer.submitPreparedUserOp({ ticketId: preview.ticketId, authProof });
   */
  async previewUserOp(
    request: PreviewUserOpRequest
  ): Promise<PreviewUserOpResponse> {
    return this.authenticatedRequest<PreviewUserOpResponse>({
      method: "POST",
      url: "/v1/wallet/user-operations/preview",
      data: request,
      retries: 0,
    });
  }

  /**
   * Phase 2: submit a previewed operation (any preview: user op, spend,
   * bridge, offramp) with a passkey `authProof` over its `hashToSign`.
   * OIDC proofs are rejected (400 PASSKEY_REQUIRED).
   *
   * The ticket is single-use. If it expired, preview again. Never retried.
   */
  async submitPreparedUserOp(
    request: SubmitPreparedUserOpRequest
  ): Promise<SubmitPreparedUserOpResponse> {
    const result = await this.fundMovingRequest<SubmitPreparedUserOpResponse>({
      method: "POST",
      url: "/v1/wallet/user-operations/submit-prepared",
      data: request,
    });
    return result as SubmitPreparedUserOpResponse;
  }
}
