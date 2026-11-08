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
  PreviewOfframpRequest,
  PreviewUserOpResponse,
  MaybeApproval,
} from "../types";

export class OfframpService extends BaseService {
  constructor(httpClient: RiftHttpClient) {
    super(httpClient);
  }

  /**
   * Phase 1 of a two-phase off-ramp. Builds the ERC-20 transfer call to the
   * liquidity provider's address and returns `hashToSign` + ticket. Submit
   * via `signer.submitPreparedUserOp({ ticketId, authProof })`.
   */
  async previewOrder(
    request: PreviewOfframpRequest
  ): Promise<PreviewUserOpResponse> {
    return this.authenticatedRequest<PreviewUserOpResponse>({
      method: "POST",
      url: "/v1/offramps/preview",
      data: request,
      retries: 0,
    });
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

  /**
   * Off-ramp (crypto → fiat). Without `ticketId` + `authProof` this returns
   * an approval request (HTTP 202) instead of throwing. Never retried.
   */
  async pay (request: PayRequest): Promise<MaybeApproval<PayResponse>> {
    return this.fundMovingRequest<PayResponse>({
      method: "POST",
      url: "/v1/offramps",
      data: request,
    });
  }

  /**
   * Create a new offramp order
   * @param request - Offramp order creation request
   * @returns Promise with created order details, or an approval request
   *   (HTTP 202) when called without `ticketId` + `authProof`. Never retried.
   */
  async createOrder(
    request: CreateOfframpOrderRequest
  ): Promise<MaybeApproval<CreateOfframpOrderResponse>> {
    return this.fundMovingRequest<CreateOfframpOrderResponse>({
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
