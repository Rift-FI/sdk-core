import { BaseService } from "../base-service";
import { RiftHttpClient } from "../http-client";
import {

  BuyRequest,
  BuyResponse,
  OnrampStatusResponse,

} from "../types";

export class OnrampServiceV2 extends BaseService {
  constructor(httpClient: RiftHttpClient) {
    super(httpClient);
  }

  async buy(request: BuyRequest): Promise<BuyResponse> {
    return this.authenticatedRequest<BuyResponse>({
      method: "POST",
      url: "/v1/onramps",
      data: request,
    });
  }


  async getOnrampStatus(transactionCode: string): Promise<OnrampStatusResponse> {
    return this.authenticatedRequest<OnrampStatusResponse>({
      method: "POST",
      url: `/v1/onramps/by-code`,
      data: {
        transaction_code: transactionCode,
      },
    });
  }


  async getOnrampOrders(userId: string): Promise<OnrampStatusResponse[]> {
    return this.authenticatedRequest<OnrampStatusResponse[]>({
      method: "GET",
      url: `/v1/onramps`,
      params: {
        userId,
      },
    });
  }
}
