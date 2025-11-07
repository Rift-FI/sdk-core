import { BaseService } from "../base-service";
import { RiftHttpClient } from "../http-client";
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
  User,
  UpdateUserRequest,
  RiftConfig,
  RequestConfig,
} from "../types";

export class AuthService extends BaseService {
  private authHttpClient: RiftHttpClient;

  constructor(httpClient: RiftHttpClient, config: RiftConfig) {
    super(httpClient);
    
    // Create a separate HTTP client for auth with different base URL
    const authConfig = {
      ...config,
      baseUrl: config.environment === "production" 
        ? "https://authentication.riftfi.xyz"
        : "https://authentication.riftfi.xyz"
    };
    this.authHttpClient = new RiftHttpClient(authConfig);
  }

  // Override the request methods to use authHttpClient
  protected async authenticatedRequest<T>(config: RequestConfig): Promise<T> {
    const headers = { ...config.headers };

    if (this.getBearerToken()) {
      headers.Authorization = `Bearer ${this.getBearerToken()}`;
    }

    return this.authHttpClient.request<T>({
      ...config,
      headers,
    });
  }

  protected async publicRequest<T>(config: RequestConfig): Promise<T> {
    return this.authHttpClient.request<T>(config);
  }

  // Helper to convert snake_case to camelCase for auth requests
  private transformAuthRequest(data: any): any {
    const transformed: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) {
        // Convert snake_case keys to camelCase
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        transformed[camelKey] = value;
      }
    }
    
    return transformed;
  }

  async signup(request: SignupRequest): Promise<SignupResponse> {
    return this.publicRequest<SignupResponse>({
      method: "POST",
      url: "/api/auth/signup",
      data: this.transformAuthRequest(request),
    });
  }

  async login(request: LoginRequest): Promise<LoginResponse> {
    const response = await this.publicRequest<LoginResponse>({
      method: "POST",
      url: "/api/auth/login",
      data: this.transformAuthRequest(request),
    });

    if (response.accessToken) {
      this.setBearerToken(response.accessToken);
    }

    return response;
  }

  async updateUser(request: UpdateUserRequest): Promise<UpdateUserResponse> {
    return this.authenticatedRequest<UpdateUserResponse>({
      method: "PUT",
      url: "/user/update",
      data: this.transformAuthRequest(request),
    });
  }


  async sendOtp(request: OtpRequest): Promise<OtpResponse> {
    return this.publicRequest<OtpResponse>({
      method: "POST",
      url: "/otp/send",
      data: this.transformAuthRequest(request),
    });
  }

  async verifyOtp(request: OtpVerifyRequest): Promise<OtpResponse> {
    return this.publicRequest<OtpResponse>({
      method: "POST",
      url: "/otp/verify",
      data: this.transformAuthRequest(request),
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
      data: this.transformAuthRequest(request),
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
      data: this.transformAuthRequest(request),
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
      data: this.transformAuthRequest(request),
    });
  }

  async resetPassword(
    request: ResetPasswordRequest
  ): Promise<ResetPasswordResponse> {
    return this.publicRequest<ResetPasswordResponse>({
      method: "POST",
      url: "/recovery/reset-password",
      data: this.transformAuthRequest(request),
    });
  }

  async updateRecoveryMethods(
    request: UpdateRecoveryRequest
  ): Promise<UpdateRecoveryResponse> {
    return this.authenticatedRequest<UpdateRecoveryResponse>({
      method: "PUT",
      url: "/recovery/update",
      data: this.transformAuthRequest(request),
    });
  }

  async addRecoveryMethod(
    request: AddRecoveryMethodRequest
  ): Promise<AddRecoveryMethodResponse> {
    return this.authenticatedRequest<AddRecoveryMethodResponse>({
      method: "POST",
      url: "/recovery/add-method",
      data: this.transformAuthRequest(request),
    });
  }

  async removeRecoveryMethod(
    request: RemoveRecoveryMethodRequest
  ): Promise<RemoveRecoveryMethodResponse> {
    return this.authenticatedRequest<RemoveRecoveryMethodResponse>({
      method: "DELETE",
      url: "/recovery/remove-method",
      data: this.transformAuthRequest(request),
    });
  }

  async updateRecoveryMethod(
    request: UpdateRecoveryMethodRequest
  ): Promise<UpdateRecoveryMethodResponse> {
    return this.authenticatedRequest<UpdateRecoveryMethodResponse>({
      method: "PUT",
      url: "/recovery/update-method",
      data: this.transformAuthRequest(request),
    });
  }

  async getMyRecoveryMethods(
    request: GetMyRecoveryMethodsRequest
  ): Promise<GetMyRecoveryMethodsResponse> {
    return this.authenticatedRequest<GetMyRecoveryMethodsResponse>({
      method: "POST",
      url: "/recovery/my-methods",
      data: this.transformAuthRequest(request),
    });
  }

  async deleteAllRecoveryMethods(
    request: DeleteAllRecoveryMethodsRequest
  ): Promise<DeleteAllRecoveryMethodsResponse> {
    return this.authenticatedRequest<DeleteAllRecoveryMethodsResponse>({
      method: "DELETE",
      url: "/recovery/delete-all",
      data: this.transformAuthRequest(request),
    });
  }
}
