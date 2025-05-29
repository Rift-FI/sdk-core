import { BaseService } from "../base-service";
import {
  CreatePaymentLinkRequest,
  PaymentLinkResponse,
  PayPaymentLinkRequest,
  CreateAuthorizationRequest,
  ClaimPaymentRequest,
  ClaimPaymentResponse,
  ApiResponse,
} from "../types";

export class PaymentLinksService extends BaseService {
  async createPaymentLink(
    request: CreatePaymentLinkRequest
  ): Promise<PaymentLinkResponse> {
    return this.authenticatedRequest<PaymentLinkResponse>({
      method: "POST",
      url: "/payment-links/request-payment",
      data: request,
    });
  }

  async payPaymentLink(nonce: string): Promise<ApiResponse<string>> {
    return this.authenticatedRequest<ApiResponse<string>>({
      method: "POST",
      url: "/payment-links/pay",
      params: { nonce },
    });
  }

  getPaymentRedirectUrl(nonce: string): string {
    return `${this.httpClient["baseUrl"]}/payment-links/redirect-to-pay?nonce=${nonce}`;
  }

  async createSpecificAuthorization(
    request: CreateAuthorizationRequest & { receiver: string }
  ): Promise<PaymentLinkResponse> {
    return this.authenticatedRequest<PaymentLinkResponse>({
      method: "POST",
      url: "/payment-links/pay-specific",
      data: request,
    });
  }

  async createAnonymousAuthorization(
    request: CreateAuthorizationRequest
  ): Promise<PaymentLinkResponse> {
    return this.authenticatedRequest<PaymentLinkResponse>({
      method: "POST",
      url: "/payment-links/pay-anonymous",
      data: request,
    });
  }

  async claimSpecificPayment(
    request: ClaimPaymentRequest
  ): Promise<ClaimPaymentResponse> {
    return this.authenticatedRequest<ClaimPaymentResponse>({
      method: "POST",
      url: "/payment-links/claim-payment",
      params: { id: request.id },
      data: { to: request.to },
    });
  }

  async claimAnonymousPayment(
    request: ClaimPaymentRequest
  ): Promise<ClaimPaymentResponse> {
    return this.authenticatedRequest<ClaimPaymentResponse>({
      method: "POST",
      url: "/payment-links/claim-anonymous-payment",
      params: { id: request.id },
      data: { to: request.to },
    });
  }
}
