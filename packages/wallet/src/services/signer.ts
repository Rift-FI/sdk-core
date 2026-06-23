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
}
