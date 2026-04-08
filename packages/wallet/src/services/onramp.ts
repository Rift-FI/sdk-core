import { BaseService } from "../base-service";
import { RiftHttpClient } from "../http-client";
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

  constructor(httpClient: RiftHttpClient, config: RiftConfig) {
    super(httpClient);
    this.mpesaClient = new MpesaHttpClient(config);
  }

  async initiateSafaricomSTK(
    request: MpesaSTKInitiateRequest
  ): Promise<MpesaSTKInitiateResponse> {
    return this.mpesaClient.request<MpesaSTKInitiateResponse>({
      method: "POST",
      url: "/api/onramp/safaricom/stk/initiate",
      data: request,
    });
  }

  async getSafaricomTransactionStatus(
    request: MpesaTransactionStatusRequest
  ): Promise<MpesaTransactionStatusResponse> {
    return this.mpesaClient.request<MpesaTransactionStatusResponse>({
      method: "GET",
      url: "/api/onramp/safaricom/transactions/status",
      params: request,
    });
  }

  async pollSafaricomTransactionStatus(
    checkoutRequestId?: string,
    merchantId?: string,
    maxAttempts = 10,
    intervalMs = 10000
  ): Promise<MpesaTransactionStatusResponse> {
    if (!checkoutRequestId && !merchantId) {
      throw new Error(
        "Either checkoutRequestId or merchantId must be provided"
      );
    }

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
        if (status.status === "success" || status.status === "failed") {
          return status;
        }
        if (attempt < maxAttempts) {
          await this.delay(intervalMs);
        }
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error;
        }
        await this.delay(intervalMs);
      }
    }

    return this.getSafaricomTransactionStatus(requestParams);
  }

  async getUserTransactionHistory(
    request?: MpesaTransactionHistoryRequest
  ): Promise<MpesaTransactionHistoryResponse> {
    return this.mpesaClient.request<MpesaTransactionHistoryResponse>({
      method: "GET",
      url: "/api/onramp/safaricom/transactions/user",
      params: request,
    });
  }

  setMpesaApiKey(apiKey: string): void {
    this.mpesaClient.setApiKey(apiKey);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
