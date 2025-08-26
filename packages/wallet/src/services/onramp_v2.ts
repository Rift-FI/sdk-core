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
      url: "/offramp/onramp",
      data: request,
    });
  }


  async getOnrampStatus(transactionCode: string): Promise<OnrampStatusResponse> {
    return this.authenticatedRequest<OnrampStatusResponse>({
      method: "POST",
      url: `/offramp/onramp/status`,
      data: {
        transaction_code: transactionCode,
      },
    });
  }


  async getOnrampOrders(userId: string): Promise<OnrampStatusResponse[]> {
    return this.authenticatedRequest<OnrampStatusResponse[]>({
      method: "GET",
      url: `/offramp/onramp/orders`,
      params: {
        userId,
      },
    });
  }
}
