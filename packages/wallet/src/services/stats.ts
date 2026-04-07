import { BaseService } from "../base-service";
import {
  StatsVolumeResponse,
  StatsUsersResponse,
  StatsTvlResponse,
} from "../types";

export class StatsService extends BaseService {
  async getVolume(): Promise<StatsVolumeResponse> {
    return this.publicRequest<StatsVolumeResponse>({
      method: "GET",
      url: "/stats/volume",
    });
  }

  async getUsers(): Promise<StatsUsersResponse> {
    return this.publicRequest<StatsUsersResponse>({
      method: "GET",
      url: "/stats/users",
    });
  }

  async getTvl(): Promise<StatsTvlResponse> {
    return this.publicRequest<StatsTvlResponse>({
      method: "GET",
      url: "/stats/tvl",
    });
  }
}
