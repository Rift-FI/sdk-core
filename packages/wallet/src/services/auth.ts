import { BaseService } from "../base-service";
import {
  LoginRequest,
  SignupRequest,
  AuthResponse,
  OtpRequest,
  OtpVerifyRequest,
  OtpResponse,
  UserResponse,
  DeleteUserRequest,
  ApiResponse,
} from "../types";

export class AuthService extends BaseService {
  async signup(request: SignupRequest): Promise<ApiResponse> {
    return this.publicRequest<ApiResponse>({
      method: "POST",
      url: "/auth/signup",
      data: request,
    });
  }

  async login(request: LoginRequest): Promise<AuthResponse> {
    const response = await this.publicRequest<AuthResponse>({
      method: "POST",
      url: "/auth/login",
      data: request,
    });

    if (response.token) {
      this.setBearerToken(response.token);
    }

    return response;
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
  ): Promise<ApiResponse<{ deletedUser: any }>> {
    const response = await this.authenticatedRequest<
      ApiResponse<{ deletedUser: any }>
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
}
