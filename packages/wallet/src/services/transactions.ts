import { BaseService } from "../base-service";
import {
  TransactionRequest,
  TransactionResponse,
  TransactionHistoryRequest,
  Transaction,
  TransactionFeeRequest,
  TransactionFeeResponse,
} from "../types";

export class TransactionService extends BaseService {
  async send(request: TransactionRequest): Promise<TransactionResponse> {
    return this.authenticatedRequest<TransactionResponse>({
      method: "POST",
      url: "/transaction/spend",
      data: request,
    });
  }

  async getHistory(
    request?: TransactionHistoryRequest
  ): Promise<Transaction[]> {
    return this.authenticatedRequest<Transaction[]>({
      method: "POST",
      url: "/transaction/history",
      params: request,
    });
  }

  async getFee(
    request: TransactionFeeRequest
  ): Promise<TransactionFeeResponse> {
    return this.authenticatedRequest<TransactionFeeResponse>({
      method: "GET",
      url: "/transaction/fee",
      params: request,
    });
  }
}
