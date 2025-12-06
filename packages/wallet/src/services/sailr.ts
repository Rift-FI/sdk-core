import { BaseService } from "../base-service";
import {
  SailRBuyQuoteResponse,
  SailRSellQuoteResponse,
  SailRBuyRequest,
  SailRSellRequest,
  SailRBuyResponse,
  SailRSellResponse,
} from "../types";

export class SailRService extends BaseService {
  /**
   * Get a quote for buying SAIL.R with USDC
   * @param amount - USDC amount in wei (6 decimals). Example: "1000000" = 1 USDC
   */
  async getBuyQuote(amount: string): Promise<SailRBuyQuoteResponse> {
    return this.authenticatedRequest<SailRBuyQuoteResponse>({
      method: "GET",
      url: "/api/sailr/buy/quote",
      params: { amount },
    });
  }

  /**
   * Execute a buy transaction to purchase SAIL.R tokens with USDC
   * @param request - Buy request containing USDC amount
   */
  async buy(request: SailRBuyRequest): Promise<SailRBuyResponse> {
    return this.authenticatedRequest<SailRBuyResponse>({
      method: "POST",
      url: "/api/sailr/buy",
      data: request,
    });
  }

  /**
   * Get a quote for selling SAIL.R tokens for USDC
   * @param amount - SAIL.R amount in wei (18 decimals). Example: "5000000000000000" = 0.005 SAIL.R
   */
  async getSellQuote(amount: string): Promise<SailRSellQuoteResponse> {
    return this.authenticatedRequest<SailRSellQuoteResponse>({
      method: "GET",
      url: "/api/sailr/sell/quote",
      params: { amount },
    });
  }

  /**
   * Execute a sell transaction to exchange SAIL.R tokens for USDC
   * @param request - Sell request containing SAIL.R amount and optional returnToSmartWallet flag
   */
  async sell(request: SailRSellRequest): Promise<SailRSellResponse> {
    return this.authenticatedRequest<SailRSellResponse>({
      method: "POST",
      url: "/api/sailr/sell",
      data: request,
    });
  }
}

