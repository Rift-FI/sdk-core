import { BaseService } from "../base-service";
import { RiftHttpClient } from "../http-client";
import {
  CreateInvoiceRequest,
  CreateInvoiceResponse,
  GetInvoicesRequest,
  GetInvoicesResponse,
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
}
