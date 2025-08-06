import { BaseService } from "../base-service";
import { MpesaHttpClient } from "../mpesa-http-client";
import {
  MpesaSTKInitiateRequest,
  MpesaSTKInitiateResponse,
  MpesaTransactionStatusRequest,
  MpesaTransactionStatusResponse,
  MpesaTransactionHistoryRequest,
  MpesaTransactionHistoryResponse,
  RiftConfig,
} from "../types";

export class OnrampService extends BaseService {
  private mpesaClient: MpesaHttpClient;

  constructor(httpClient: any, config: RiftConfig) {
    super(httpClient);
    // Create separate client for M-Pesa operations
    this.mpesaClient = new MpesaHttpClient(config);
  }

  /**
   * Initiates an M-Pesa STK push for crypto on-ramping
   * @param request - The STK initiation request containing user details and payment info
   * @returns Promise with the STK initiation response
   */
  async initiateSafaricomSTK(
    request: MpesaSTKInitiateRequest
  ): Promise<MpesaSTKInitiateResponse> {
    return this.mpesaClient.request<MpesaSTKInitiateResponse>({
      method: "POST",
      url: "/api/onramp/safaricom/stk/initiate",
      data: request,
    });
  }

  /**
   * Gets the status of a Safaricom transaction
   * @param request - The transaction status request with checkout or merchant request ID
   * @returns Promise with the transaction status response
   */
  async getSafaricomTransactionStatus(
    request: MpesaTransactionStatusRequest
  ): Promise<MpesaTransactionStatusResponse> {
    return this.mpesaClient.request<MpesaTransactionStatusResponse>({
      method: "GET",
      url: "/api/onramp/safaricom/transactions/status",
      params: request,
    });
  }

  /**
   * Polls transaction status until completion or timeout
   * @param checkoutRequestId - The checkout request ID from STK initiation (optional)
   * @param merchantId - The merchant request ID from STK initiation (optional)
   * @param maxAttempts - Maximum number of polling attempts (default: 10)
   * @param intervalMs - Interval between polls in milliseconds (default: 10000)
   * @returns Promise with the final transaction status
   */
  async pollSafaricomTransactionStatus(
    checkoutRequestId?: string,
    merchantId?: string,
    maxAttempts: number = 10,
    intervalMs: number = 10000
  ): Promise<MpesaTransactionStatusResponse> {
    // Validate that at least one ID is provided
    if (!checkoutRequestId && !merchantId) {
      throw new Error(
        "Either checkoutRequestId or merchantId must be provided"
      );
    }

    // Build the request parameters
    const requestParams: MpesaTransactionStatusRequest = {};
    if (checkoutRequestId) {
      requestParams.checkoutRequestId = checkoutRequestId;
    }
    if (merchantId) {
      requestParams.merchantRequestId = merchantId;
    }

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const status = await this.getSafaricomTransactionStatus(requestParams);

        // If transaction is completed (success or failed), return the result
        if (status.status === "success" || status.status === "failed") {
          return status;
        }

        // If not the last attempt and still pending, wait before next poll
        if (attempt < maxAttempts) {
          await this.delay(intervalMs);
        }
      } catch (error) {
        // If it's the last attempt, throw the error
        if (attempt === maxAttempts) {
          throw error;
        }
        // Otherwise, wait and retry
        await this.delay(intervalMs);
      }
    }

    // If we've exhausted all attempts, return the last known status
    return this.getSafaricomTransactionStatus(requestParams);
  }

  /**
   * Gets user's M-Pesa onramp transaction history with filtering and pagination
   * @param request - The transaction history request with optional filters
   * @returns Promise with the transaction history response
   */
  async getUserTransactionHistory(
    request?: MpesaTransactionHistoryRequest
  ): Promise<MpesaTransactionHistoryResponse> {
    return this.mpesaClient.request<MpesaTransactionHistoryResponse>({
      method: "GET",
      url: "/api/onramp/safaricom/transactions/user",
      params: request,
    });
  }

  /**
   * Set API key for M-Pesa operations
   */
  setMpesaApiKey(apiKey: string): void {
    this.mpesaClient.setApiKey(apiKey);
  }

  /**
   * Utility method to delay execution
   * @param ms - Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
