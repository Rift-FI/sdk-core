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
  LoginResponse,
  SignupResponse,
  DeleteUserResponse,
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
}
