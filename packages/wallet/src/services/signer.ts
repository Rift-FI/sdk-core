import { BaseService } from "../base-service";
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
   * Sign a transaction without broadcasting it
   * Returns the signed transaction hex string
   */
  async signTransaction(
    request: SignTransactionRequest
  ): Promise<SignTransactionResponse> {
    return this.authenticatedRequest<SignTransactionResponse>({
      method: "POST",
      url: "/v1/wallet/signatures/transaction",
      data: request,
    });
  }

  /**
   * Sign and broadcast a transaction to the network
   * Returns the transaction receipt with hash and details
   */
  async sendTransaction(
    request: SendTransactionRequest
  ): Promise<SendTransactionResponse> {
    return this.authenticatedRequest<SendTransactionResponse>({
      method: "POST",
      url: "/v1/wallet/user-operations",
      data: request,
    });
  }

  /**
   * Sign a message with the user's private key
   * Returns the signature and verification data
   */
  async signMessage(request: SignMessageRequest): Promise<SignMessageResponse> {
    return this.authenticatedRequest<SignMessageResponse>({
      method: "POST",
      url: "/v1/wallet/signatures/message",
      data: request,
    });
  }

  /**
   * Phase 1 of two-phase v3 signing. Builds an ERC-4337 UserOperation
   * via the smart-wallet service without signing it; returns the
   * `userOpHashHex` to sign + a single-use `ticketId` (60s TTL).
   *
   * Use this when the user's envelope is `enc:v3:*` — only this hash is
   * the valid WebAuthn challenge / OIDC nonce for the eventual signature.
   * v1 / v2 wallets should keep using `sendTransaction` (one-phase).
   *
   * Typical flow:
   *
   *   const preview  = await rift.signer.previewUserOp({ chain, transactionData });
   *   const proof    = await PasskeyHelper.sign({ userOpHashHex: preview.userOpHashHex, rpId });
   *   const receipt  = await rift.signer.submitPreparedUserOp({
   *     ticketId: preview.ticketId,
   *     authProof: proof,
   *   });
   */
  async previewUserOp(
    request: PreviewUserOpRequest
  ): Promise<PreviewUserOpResponse> {
    return this.authenticatedRequest<PreviewUserOpResponse>({
      method: "POST",
      url: "/v1/wallet/user-operations/preview",
      data: request,
    });
  }

  /**
   * Phase 2 of two-phase v3 signing. Submits the previously-previewed
   * UserOperation along with the user's `authProof` (WebAuthn assertion
   * or OIDC id_token, both bound to `userOpHashHex` from the preview).
   *
   * The ticket is single-use and expires 60s after preview. If it's
   * gone the caller gets a 4xx and must redo `previewUserOp`.
   */
  async submitPreparedUserOp(
    request: SubmitPreparedUserOpRequest
  ): Promise<SubmitPreparedUserOpResponse> {
    return this.authenticatedRequest<SubmitPreparedUserOpResponse>({
      method: "POST",
      url: "/v1/wallet/user-operations/submit-prepared",
      data: request,
    });
  }
}
