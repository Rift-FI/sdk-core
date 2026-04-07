import { BaseService } from "../base-service";
import {
  KYCTokenRequest,
  KYCTokenResponse,
  KYCUserExistsRequest,
  KYCUserExistsResponse,
  KYCStatusRequest,
  KYCStatusResponse,
  KYCVerifyAndSendOtpRequest,
  KYCVerifyRequest,
  KYCVerifyResponse,
  KYCVerifiedResponse,
  KYCJobStatusResponse,
} from "../types";

export class KYCService extends BaseService {
  async getToken(request: KYCTokenRequest): Promise<KYCTokenResponse> {
    return this.publicRequest<KYCTokenResponse>({
      method: "POST",
      url: "/api/kyc/token",
      data: request,
    });
  }

  async checkUserExists(request: KYCUserExistsRequest): Promise<KYCUserExistsResponse> {
    return this.publicRequest<KYCUserExistsResponse>({
      method: "POST",
      url: "/api/kyc/user-exists",
      data: request,
    });
  }

  async getStatus(request: KYCStatusRequest): Promise<KYCStatusResponse> {
    return this.publicRequest<KYCStatusResponse>({
      method: "POST",
      url: "/api/kyc/status",
      data: request,
    });
  }

  async verifyAndSendOtp(request: KYCVerifyAndSendOtpRequest): Promise<KYCStatusResponse> {
    return this.publicRequest<KYCStatusResponse>({
      method: "POST",
      url: "/api/kyc/verify-and-send-otp",
      data: request,
    });
  }

  async verify(request: KYCVerifyRequest): Promise<KYCVerifyResponse> {
    return this.authenticatedRequest<KYCVerifyResponse>({
      method: "POST",
      url: "/api/kyc/verify",
      data: request,
    });
  }

  async isVerified(): Promise<KYCVerifiedResponse> {
    return this.authenticatedRequest<KYCVerifiedResponse>({
      method: "GET",
      url: "/api/kyc/verified",
    });
  }

  async getJobStatus(jobId: string): Promise<KYCJobStatusResponse> {
    return this.authenticatedRequest<KYCJobStatusResponse>({
      method: "GET",
      url: `/api/kyc/job/${jobId}`,
    });
  }
}
