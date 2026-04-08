import { BaseService } from "../base-service";
import { GetAllDepositsResponse, DepositStatsResponse } from "../types";

export class DepositsService extends BaseService {

    async getAllDeposits(): Promise<GetAllDepositsResponse> {
        return this.authenticatedRequest<GetAllDepositsResponse>({
            method: "GET",
            url: "/offramp/deposits",
        });
    }

    async getDepositStats(): Promise<DepositStatsResponse> {
        return this.authenticatedRequest<DepositStatsResponse>({
            method: "GET",
            url: "/offramp/deposits/stats",
        });
    }

}