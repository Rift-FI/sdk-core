import { BaseService } from "../base-service";
import {
  LoginRequest,
  SignupRequest,
  OtpRequest,
  OtpVerifyRequest,
  OtpResponse,
  UserResponse,
  DeleteUserRequest,
  ApiResponse,
  LoginResponse,
  SignupResponse,
  DeleteUserResponse,
  CreateRecoveryRequest,
  CreateRecoveryResponse,
  RecoveryOptionsResponse,
  RequestPasswordResetRequest,
  RequestPasswordResetResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  UpdateRecoveryRequest,
  UpdateRecoveryResponse,
  AddRecoveryMethodRequest,
  AddRecoveryMethodResponse,
  RemoveRecoveryMethodRequest,
  RemoveRecoveryMethodResponse,
  UpdateRecoveryMethodRequest,
  UpdateRecoveryMethodResponse,
  GetMyRecoveryMethodsRequest,
  GetMyRecoveryMethodsResponse,
  DeleteAllRecoveryMethodsRequest,
  DeleteAllRecoveryMethodsResponse,
  UpdateUserResponse,
} from "../types";

export class AuthService extends BaseService {
  async signup(request: SignupRequest): Promise<SignupResponse> {
    return this.publicRequest<SignupResponse>({
      method: "POST",
      url: "/auth/signup",
      data: request,
    });
  }

  async login(request: LoginRequest): Promise<LoginResponse> {
    const response = await this.publicRequest<LoginResponse>({
      method: "POST",
      url: "/auth/login",
      data: request,
    });

    if (response.accessToken) {
      this.setBearerToken(response.accessToken);
    }

    return response;
  }

  async updateUser(): Promise<UpdateUserResponse> {
    return this.authenticatedRequest<UpdateUserResponse>({
      method: "PUT",
      url: "/user/update",
      data: {},
    });
  }

  async sendOtp(request: OtpRequest): Promise<OtpResponse> {
    return this.publicRequest<OtpResponse>({
      method: "POST",
      url: "/otp/send",
      data: request,
    });
  }

  async verifyOtp(request: OtpVerifyRequest): Promise<OtpResponse> {
    return this.publicRequest<OtpResponse>({
      method: "POST",
      url: "/otp/verify",
      data: request,
    });
  }

  async getUser(): Promise<UserResponse> {
    return this.authenticatedRequest<UserResponse>({
      method: "GET",
      url: "/user/me",
    });
  }

  async deleteUser(
    request: DeleteUserRequest
  ): Promise<ApiResponse<DeleteUserResponse>> {
    const response = await this.authenticatedRequest<
      ApiResponse<DeleteUserResponse>
    >({
      method: "DELETE",
      url: "/user/delete",
      data: request,
    });

    this.clearBearerToken();

    return response;
  }

  logout(): void {
    this.clearBearerToken();
  }

  isAuthenticated(): boolean {
    return !!this.getBearerToken();
  }

  // Recovery System Methods

  async createRecoveryMethods(
    request: CreateRecoveryRequest
  ): Promise<CreateRecoveryResponse> {
    return this.authenticatedRequest<CreateRecoveryResponse>({
      method: "POST",
      url: "/recovery/create",
      data: request,
    });
  }

  async getRecoveryOptions(
    externalId: string
  ): Promise<RecoveryOptionsResponse> {
    return this.publicRequest<RecoveryOptionsResponse>({
      method: "GET",
      url: `/recovery/options/${externalId}`,
    });
  }

  async requestPasswordReset(
    request: RequestPasswordResetRequest
  ): Promise<RequestPasswordResetResponse> {
    return this.publicRequest<RequestPasswordResetResponse>({
      method: "POST",
      url: "/recovery/request-reset",
      data: request,
    });
  }

  async resetPassword(
    request: ResetPasswordRequest
  ): Promise<ResetPasswordResponse> {
    return this.publicRequest<ResetPasswordResponse>({
      method: "POST",
      url: "/recovery/reset-password",
      data: request,
    });
  }

  async updateRecoveryMethods(
    request: UpdateRecoveryRequest
  ): Promise<UpdateRecoveryResponse> {
    return this.authenticatedRequest<UpdateRecoveryResponse>({
      method: "PUT",
      url: "/recovery/update",
      data: request,
    });
  }

  async addRecoveryMethod(
    request: AddRecoveryMethodRequest
  ): Promise<AddRecoveryMethodResponse> {
    return this.authenticatedRequest<AddRecoveryMethodResponse>({
      method: "POST",
      url: "/recovery/add-method",
      data: request,
    });
  }

  async removeRecoveryMethod(
    request: RemoveRecoveryMethodRequest
  ): Promise<RemoveRecoveryMethodResponse> {
    return this.authenticatedRequest<RemoveRecoveryMethodResponse>({
      method: "DELETE",
      url: "/recovery/remove-method",
      data: request,
    });
  }

  async updateRecoveryMethod(
    request: UpdateRecoveryMethodRequest
  ): Promise<UpdateRecoveryMethodResponse> {
    return this.authenticatedRequest<UpdateRecoveryMethodResponse>({
      method: "PUT",
      url: "/recovery/update-method",
      data: request,
    });
  }

  async getMyRecoveryMethods(
    request: GetMyRecoveryMethodsRequest
  ): Promise<GetMyRecoveryMethodsResponse> {
    return this.authenticatedRequest<GetMyRecoveryMethodsResponse>({
      method: "POST",
      url: "/recovery/my-methods",
      data: request,
    });
  }

  async deleteAllRecoveryMethods(
    request: DeleteAllRecoveryMethodsRequest
  ): Promise<DeleteAllRecoveryMethodsResponse> {
    return this.authenticatedRequest<DeleteAllRecoveryMethodsResponse>({
      method: "DELETE",
      url: "/recovery/delete-all",
      data: request,
    });
  }
}
