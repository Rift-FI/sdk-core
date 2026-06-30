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
  GoogleLoginRequest,
  GoogleLoginResponse,
  AppleLoginRequest,
  AppleLoginResponse,
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
  UpdateUserRequest,
  MigrateToV3Request,
  MigrateToV3Response,
} from "../types";

export class AuthService extends BaseService {
  async signup(request: SignupRequest): Promise<SignupResponse> {
    return this.publicRequest<SignupResponse>({
      method: "POST",
      url: "/v1/auth/sign-up",
      data: request,
    });
  }

  async login(request: LoginRequest): Promise<LoginResponse> {
    const response = await this.publicRequest<LoginResponse>({
      method: "POST",
      url: "/v1/auth/sign-in",
      data: request,
    });

    if (response.accessToken) {
      this.setBearerToken(response.accessToken);
    }

    return response;
  }

  /**
   * Sign in (or sign up on first use) with a Google ID token.
   *
   * Pass the `id_token` returned by Google's identity flow on the client —
   * for example the `credential` from Google One-Tap, or the ID token from
   * `useGoogleLogin({ flow: "implicit" })` exchanged via Google's OAuth2
   * endpoint. The backend verifies the signature with Google, then either
   * creates a new wallet for the email or signs the existing user in.
   *
   * Once an account is bound to Google, password/OTP login is rejected for
   * that account — the user must continue using Google.
   */
  async loginWithGoogle(
    request: GoogleLoginRequest
  ): Promise<GoogleLoginResponse> {
    const response = await this.publicRequest<GoogleLoginResponse>({
      method: "POST",
      url: "/v1/auth/sign-in/google",
      data: request,
    });

    if (response.accessToken) {
      this.setBearerToken(response.accessToken);
    }

    return response;
  }

  /**
   * Sign in (or sign up on first use) with an Apple identity token.
   *
   * Pass the `id_token` returned by "Sign in with Apple" — `authorization.id_token`
   * from `AppleID.auth.signIn()` on the web, the identity token from
   * `ASAuthorizationAppleIDCredential` on iOS, etc.
   *
   * Apple only delivers the user's email and name on the FIRST sign-in
   * (and only the privaterelay alias if the user chose "Hide My Email").
   * On first sign-in the client should also forward `displayName` —
   * subsequent sign-ins identify the user by their stable Apple `sub`.
   *
   * Email/OTP login remains available for users with a non-relay email
   * on file. Apple-bound accounts are not locked to Apple.
   */
  async loginWithApple(
    request: AppleLoginRequest
  ): Promise<AppleLoginResponse> {
    const response = await this.publicRequest<AppleLoginResponse>({
      method: "POST",
      url: "/v1/auth/sign-in/apple",
      data: request,
    });

    if (response.accessToken) {
      this.setBearerToken(response.accessToken);
    }

    return response;
  }

  async updateUser(request: UpdateUserRequest): Promise<UpdateUserResponse> {
    return this.authenticatedRequest<UpdateUserResponse>({
      method: "PUT",
      url: "/v1/me",
      data: request,
    });
  }


  async sendOtp(request: OtpRequest): Promise<OtpResponse> {
    return this.publicRequest<OtpResponse>({
      method: "POST",
      url: "/v1/one-time-codes",
      data: request,
    });
  }

  async verifyOtp(request: OtpVerifyRequest): Promise<OtpResponse> {
    return this.publicRequest<OtpResponse>({
      method: "POST",
      url: "/v1/one-time-codes/verify",
      data: request,
    });
  }

  async getUser(): Promise<UserResponse> {
    return this.authenticatedRequest<UserResponse>({
      method: "GET",
      url: "/v1/me",
    });
  }

  async deleteUser(
    request: DeleteUserRequest
  ): Promise<ApiResponse<DeleteUserResponse>> {
    const response = await this.authenticatedRequest<
      ApiResponse<DeleteUserResponse>
    >({
      method: "DELETE",
      url: "/v1/me",
      data: request,
    });

    this.clearBearerToken();

    return response;
  }

  /**
   * Upgrade the authenticated user's wallet to a v3 (device-bound)
   * envelope. Same EOA private key, new auth methods sealed inside the
   * enclave. The on-chain wallet address is preserved.
   *
   * Typical flow:
   *   1. Show the user a "Make my wallet non-custodial" prompt.
   *   2. Run a Passkey enrolment ceremony (see PasskeyHelper.enrol) OR
   *      an OIDC sign-in (see OidcHelper.fetchEnrolment).
   *   3. Call this method with the resulting enrolledMethods.
   *   4. From then on, every transaction MUST carry an `authProof` —
   *      the user authorises each one with their device or Google/Apple.
   *
   * Idempotent: if the wallet is already on v3, returns
   * `{ alreadyMigrated: true }` with no DB write.
   */
  async migrateToV3(
    request: MigrateToV3Request
  ): Promise<MigrateToV3Response> {
    return this.authenticatedRequest<MigrateToV3Response>({
      method: "POST",
      url: "/wallet/migrate-to-v3",
      data: request,
    });
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
      url: "/v1/recovery/methods",
      data: request,
    });
  }

  async getRecoveryOptions(
    externalId: string
  ): Promise<RecoveryOptionsResponse> {
    return this.publicRequest<RecoveryOptionsResponse>({
      method: "GET",
      url: `/v1/recovery/options/${externalId}`,
    });
  }

  async requestPasswordReset(
    request: RequestPasswordResetRequest
  ): Promise<RequestPasswordResetResponse> {
    return this.publicRequest<RequestPasswordResetResponse>({
      method: "POST",
      url: "/v1/recovery/password-reset",
      data: request,
    });
  }

  async resetPassword(
    request: ResetPasswordRequest
  ): Promise<ResetPasswordResponse> {
    return this.publicRequest<ResetPasswordResponse>({
      method: "POST",
      url: "/v1/recovery/password-reset/complete",
      data: request,
    });
  }

  async updateRecoveryMethods(
    request: UpdateRecoveryRequest
  ): Promise<UpdateRecoveryResponse> {
    return this.authenticatedRequest<UpdateRecoveryResponse>({
      method: "PUT",
      url: "/v1/recovery/methods",
      data: request,
    });
  }

  async addRecoveryMethod(
    request: AddRecoveryMethodRequest
  ): Promise<AddRecoveryMethodResponse> {
    return this.authenticatedRequest<AddRecoveryMethodResponse>({
      method: "POST",
      url: "/v1/recovery/methods/by-type",
      data: request,
    });
  }

  async removeRecoveryMethod(
    request: RemoveRecoveryMethodRequest
  ): Promise<RemoveRecoveryMethodResponse> {
    return this.authenticatedRequest<RemoveRecoveryMethodResponse>({
      method: "DELETE",
      url: "/v1/recovery/methods/by-type",
      data: request,
    });
  }

  async updateRecoveryMethod(
    request: UpdateRecoveryMethodRequest
  ): Promise<UpdateRecoveryMethodResponse> {
    return this.authenticatedRequest<UpdateRecoveryMethodResponse>({
      method: "PUT",
      url: "/v1/recovery/methods/by-type",
      data: request,
    });
  }

  async getMyRecoveryMethods(
    request: GetMyRecoveryMethodsRequest
  ): Promise<GetMyRecoveryMethodsResponse> {
    return this.authenticatedRequest<GetMyRecoveryMethodsResponse>({
      method: "POST",
      url: "/v1/recovery/methods",
      data: request,
    });
  }

  async deleteAllRecoveryMethods(
    request: DeleteAllRecoveryMethodsRequest
  ): Promise<DeleteAllRecoveryMethodsResponse> {
    return this.authenticatedRequest<DeleteAllRecoveryMethodsResponse>({
      method: "DELETE",
      url: "/v1/recovery/methods",
      data: request,
    });
  }
}
