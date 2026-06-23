import { BaseService } from "../base-service";
import {
  SuspendUserRequest,
  SuspendUserResponse,
  UnsuspendUserRequest,
  UnsuspendUserResponse,
  GetSuspendedUsersRequest,
  GetSuspendedUsersResponse,
  GetUserStatusRequest,
  GetUserStatusResponse,
} from "../types";

export class UserManagementService extends BaseService {
  async suspendUser(request: SuspendUserRequest): Promise<SuspendUserResponse> {
    return this.publicRequest<SuspendUserResponse>({
      method: "POST",
      url: "/v1/users/suspend",
      data: request,
    });
  }

  async unsuspendUser(request: UnsuspendUserRequest): Promise<UnsuspendUserResponse> {
    return this.publicRequest<UnsuspendUserResponse>({
      method: "POST",
      url: "/v1/users/unsuspend",
      data: request,
    });
  }

  async getSuspendedUsers(request?: GetSuspendedUsersRequest): Promise<GetSuspendedUsersResponse> {
    return this.publicRequest<GetSuspendedUsersResponse>({
      method: "GET",
      url: "/v1/users/suspended",
      params: request,
    });
  }

  async getUserStatus(request: GetUserStatusRequest): Promise<GetUserStatusResponse> {
    return this.publicRequest<GetUserStatusResponse>({
      method: "GET",
      url: "/v1/users/lookup",
      params: request,
    });
  }
}
