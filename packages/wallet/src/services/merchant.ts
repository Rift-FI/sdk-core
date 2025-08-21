import { BaseService } from "../base-service";
import { RiftHttpClient } from "../http-client";
import {
  CreateInvoiceRequest,
  CreateInvoiceResponse,
  GetInvoicesRequest,
  GetInvoicesResponse,
  GetMerchantStatusRequest,
  GetMerchantStatusResponse,
} from "../types";

export class MerchantService extends BaseService {
  constructor(httpClient: RiftHttpClient) {
    super(httpClient);
  }

  /**
   * Create a new invoice
   * @param request Invoice creation parameters
   * @returns Created invoice details
   */
  async createInvoice(
    request: CreateInvoiceRequest
  ): Promise<CreateInvoiceResponse> {
    return this.authenticatedRequest<CreateInvoiceResponse>({
      method: "POST",
      url: "/invoices",
      data: request,
    });
  }

  /**
   * Get list of invoices with optional filters
   * @param request Filter and sorting parameters
   * @returns List of invoices matching the criteria
   */
  async getInvoices(
    request?: GetInvoicesRequest
  ): Promise<GetInvoicesResponse> {
    return this.authenticatedRequest<GetInvoicesResponse>({
      method: "GET",
      url: "/invoices",
      params: request,
    });
  }

  /**
   * Get merchant KYB approval status
   *
   * @param request Optional parameters to check specific user
   * @returns Merchant approval status and details
   *
   * @example
   * // Check current authenticated user's status
   * const myStatus = await merchantService.getMerchantStatus();
   *
   * @example
   * // Check specific user's status
   * const userStatus = await merchantService.getMerchantStatus({
   *   user: "user-uuid-here"
   * });
   */
  async getMerchantStatus(
    request?: GetMerchantStatusRequest
  ): Promise<GetMerchantStatusResponse> {
    return this.authenticatedRequest<GetMerchantStatusResponse>({
      method: "GET",
      url: "/merchants/status",
      params: request,
    });
  }
}
