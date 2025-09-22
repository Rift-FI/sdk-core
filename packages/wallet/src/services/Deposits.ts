import { BaseService } from "../base-service";
import { GetAllDepositsResponse } from "../types";

export class DepositsService extends BaseService {

    async getAllDeposits(): Promise<GetAllDepositsResponse> {
        return this.authenticatedRequest<GetAllDepositsResponse>({
            method: "GET",
            url: "/offramp/base-usdc/deposits",
        });
    }

}