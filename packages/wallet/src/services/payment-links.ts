import { BaseService } from "../base-service";
import {
  CreatePaymentRequestInput,
  PaymentRequestResult,
  ClaimSendLinkInput,
  ClaimSendLinkResult,
  ApiResponse,
  GetPaymentRequestsInput,
  GetPaymentRequestsResult,
  GetSendLinksInput,
  GetSendLinksResult,
  CancelPaymentRequestResult,
  CancelSendLinkResult,
  CreateSendLinkInput,
} from "../types";

export class PaymentLinksService extends BaseService {
  /**
   * Validates the time format for send links
   * Expected format: number followed by s, m, h, or d (e.g., 1s, 5m, 2h, 30d)
   */
  private validateTimeFormat(time: string): void {
    const timePattern = /^(\d+)(s|m|h|d)$/;

    if (!timePattern.test(time)) {
      throw new Error(
        `Invalid time format: "${time}". Expected format: number followed by s, m, h, or d (e.g., 1s, 5m, 2h, 30d)`
      );
    }

    const match = time.match(timePattern);
    const value = parseInt(match![1], 10);

    if (value <= 0) {
      throw new Error(`Time value must be greater than 0. Received: ${value}`);
    }
  }

  async requestPayment(
    request: CreatePaymentRequestInput
  ): Promise<PaymentRequestResult> {
    return this.authenticatedRequest<PaymentRequestResult>({
      method: "POST",
      url: "/payment-links/request-payment",
      data: request,
    });
  }

  async payPaymentRequest(nonce: string): Promise<ApiResponse<string>> {
    return this.authenticatedRequest<ApiResponse<string>>({
      method: "POST",
      url: "/payment-links/execute",
      params: { nonce },
    });
  }

  getPaymentRedirectUrl(nonce: string): string {
    return `${this.httpClient["baseUrl"]}/payment-links/redirect?nonce=${nonce}`;
  }

  async createSpecificSendLink(
    request: CreateSendLinkInput & { receiver: string }
  ): Promise<PaymentRequestResult> {
    // Validate time format before making the API call
    this.validateTimeFormat(request.time);

    return this.authenticatedRequest<PaymentRequestResult>({
      method: "POST",
      url: "/payment-links/send-specific",
      data: request,
    });
  }

  async createOpenSendLink(
    request: CreateSendLinkInput
  ): Promise<PaymentRequestResult> {
    // Validate time format before making the API call
    this.validateTimeFormat(request.time);

    return this.authenticatedRequest<PaymentRequestResult>({
      method: "POST",
      url: "/payment-links/send-open",
      data: request,
    });
  }

  async claimSpecificSendLink(
    request: ClaimSendLinkInput
  ): Promise<ClaimSendLinkResult> {
    return this.authenticatedRequest<ClaimSendLinkResult>({
      method: "POST",
      url: "/payment-links/claim-specific",
      params: { id: request.id },
      data: { to: request.to },
    });
  }

  async claimOpenSendLink(
    request: ClaimSendLinkInput
  ): Promise<ClaimSendLinkResult> {
    return this.authenticatedRequest<ClaimSendLinkResult>({
      method: "POST",
      url: "/payment-links/claim-open",
      params: { id: request.id },
      data: { to: request.to },
    });
  }

  async listPaymentRequests(
    request?: GetPaymentRequestsInput
  ): Promise<GetPaymentRequestsResult> {
    return this.authenticatedRequest<GetPaymentRequestsResult>({
      method: "GET",
      url: "/payment-links/list-payments-requests",
      params: request,
    });
  }

  async listSendLinks(
    request?: GetSendLinksInput
  ): Promise<GetSendLinksResult> {
    return this.authenticatedRequest<GetSendLinksResult>({
      method: "GET",
      url: "/payment-links/list-send-links",
      params: request,
    });
  }

  async cancelPaymentRequest(
    nonce: string
  ): Promise<CancelPaymentRequestResult> {
    return this.authenticatedRequest<CancelPaymentRequestResult>({
      method: "DELETE",
      url: `/payment-links/cancel-payment-request/${nonce}`,
    });
  }

  async cancelSendLink(urlId: string): Promise<CancelSendLinkResult> {
    return this.authenticatedRequest<CancelSendLinkResult>({
      method: "DELETE",
      url: `/payment-links/cancel-send-link/${urlId}`,
    });
  }
}
