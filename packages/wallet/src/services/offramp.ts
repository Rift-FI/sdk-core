import { BaseService } from "../base-service";
import { RiftHttpClient } from "../http-client";
import {
  PreviewExchangeRateRequest,
  PreviewExchangeRateResponse,
  CreateOfframpOrderRequest,
  CreateOfframpOrderResponse,
  PollOfframpOrderRequest,
  PollOfframpOrderResponse,
  GetOfframpOrdersResponse,
  GetSupportedInstitutionsResponse,
  SendPaymentLinkRequest,
  SendPaymentLinkResponse,
  GetWithdrawalFeeResponse,
  OfframpCurrency,
  PayRequest,
  PayResponse,

} from "../types";

export class OfframpService extends BaseService {
  constructor(httpClient: RiftHttpClient) {
    super(httpClient);
  }

  /**
   * Preview exchange rate for offramp transaction
   * @param request - Exchange rate preview request
   * @returns Promise with exchange rate
   */
  async previewExchangeRate(
    request: PreviewExchangeRateRequest
  ): Promise<PreviewExchangeRateResponse> {
    return this.authenticatedRequest<PreviewExchangeRateResponse>({
      method: "POST",
      url: "/v1/rates/quote",
      data: request,
    });
  }


  async getSupportedInstitutions(currency: OfframpCurrency): Promise<GetSupportedInstitutionsResponse> {
    return this.authenticatedRequest<GetSupportedInstitutionsResponse>({
      method: "GET",
      url: `/v1/rails/${currency}/payment-methods`,
    });
  }


  async sendPaymentLink(request: SendPaymentLinkRequest): Promise<SendPaymentLinkResponse> {
    return this.authenticatedRequest<SendPaymentLinkResponse>({
      method: "POST",
      url: "/v1/invoices/notifications",
      data: request,
    });
  }

  async pay (request: PayRequest): Promise<PayResponse> {
    return this.authenticatedRequest<PayResponse>({
      method: "POST",
      url: "/v1/offramps",
      data: request,
    });
  }

  /**
   * Create a new offramp order
   * @param request - Offramp order creation request
   * @returns Promise with created order details
   */
  async createOrder(
    request: CreateOfframpOrderRequest
  ): Promise<CreateOfframpOrderResponse> {
    return this.authenticatedRequest<CreateOfframpOrderResponse>({
      method: "POST",
      url: "/v1/offramps",
      data: request,
    });
  }

  async getWithdrawalFee(amount: number): Promise<GetWithdrawalFeeResponse> {
    return this.authenticatedRequest<GetWithdrawalFeeResponse>({
      method: "POST",
      url: "/v1/rates/withdrawal-fee",
      data:{amount}
    });
  }

  /**
   * Poll the status of an offramp order
   * @param request - Order polling request
   * @returns Promise with order status
   */
  async pollOrderStatus(
    request: PollOfframpOrderRequest
  ): Promise<PollOfframpOrderResponse> {
    return this.authenticatedRequest<PollOfframpOrderResponse>({
      method: "GET",
      url: "/v1/offramps/by-code",
      params: request
      
    });
  }

  /**
   * Get all offramp orders for the authenticated user
   * @returns Promise with list of orders
   */
  async getOrders(): Promise<GetOfframpOrdersResponse> {
    return this.authenticatedRequest<GetOfframpOrdersResponse>({
      method: "GET",
      url: "/v1/offramps",
    });
  }
}
