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

/**
 * Drop the deprecated `projectOwnerEmail` / `projectOwnerPhone` fields.
 * The backend no longer accepts them as proof of project ownership, so
 * they are never sent.
 */
function withoutOwnerFields<T extends object | undefined>(
  request: T
): Omit<NonNullable<T>, "projectOwnerEmail" | "projectOwnerPhone"> | undefined {
  if (!request) return undefined;
  const {
    projectOwnerEmail: _email,
    projectOwnerPhone: _phone,
    ...rest
  } = request as any;
  return rest;
}

/**
 * Project-admin user management (suspend / unsuspend / status / lookup).
 *
 * Every call is authorised by the PROJECT OWNER's bearer token, sent with
 * the project's API key. Log in as the project owner first
 * (`rift.auth.login(...)`) or call `rift.setBearerToken(ownerToken)`.
 * Calls made without the owner's token are rejected (401/403).
 *
 * The old `projectOwnerEmail` / `projectOwnerPhone` request fields are
 * deprecated and ignored.
 */
export class UserManagementService extends BaseService {
  async suspendUser(request: SuspendUserRequest): Promise<SuspendUserResponse> {
    return this.authenticatedRequest<SuspendUserResponse>({
      method: "POST",
      url: "/v1/users/suspend",
      data: withoutOwnerFields(request),
    });
  }

  async unsuspendUser(request: UnsuspendUserRequest): Promise<UnsuspendUserResponse> {
    return this.authenticatedRequest<UnsuspendUserResponse>({
      method: "POST",
      url: "/v1/users/unsuspend",
      data: withoutOwnerFields(request),
    });
  }

  /**
   * @param request Deprecated and ignored. Kept so existing calls that pass
   * `{ projectOwnerEmail }` still compile.
   */
  async getSuspendedUsers(request?: GetSuspendedUsersRequest): Promise<GetSuspendedUsersResponse> {
    const params = withoutOwnerFields(request);
    return this.authenticatedRequest<GetSuspendedUsersResponse>({
      method: "GET",
      url: "/v1/users/suspended",
      ...(params && Object.keys(params).length ? { params } : {}),
    });
  }

  async getUserStatus(request: GetUserStatusRequest): Promise<GetUserStatusResponse> {
    return this.authenticatedRequest<GetUserStatusResponse>({
      method: "GET",
      url: "/v1/users/lookup",
      params: withoutOwnerFields(request),
    });
  }
}
