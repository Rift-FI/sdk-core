import { RiftHttpClient } from "./http-client";
import { RequestConfig } from "./types";

export abstract class BaseService {
    protected httpClient: RiftHttpClient;
  private bearerToken?: string;

  constructor(httpClient: RiftHttpClient) {
    this.httpClient = httpClient;
  }

  /**
   * Set the bearer token for user authentication
   */
  setBearerToken(token: string): void {
    this.bearerToken = token;
  }

  /**
   * Clear the bearer token
   */
  clearBearerToken(): void {
    this.bearerToken = undefined;
  }

  /**
   * Get the current bearer token
   */
  getBearerToken(): string | undefined {
    return this.bearerToken;
  }

  /**
   * Make an authenticated request with bearer token
   */
  protected async authenticatedRequest<T>(config: RequestConfig): Promise<T> {
    const headers = { ...config.headers };

    if (this.bearerToken) {
      headers.Authorization = `Bearer ${this.bearerToken}`;
    }

    return this.httpClient.request<T>({
      ...config,
      headers,
    });
  }

  /**
   * Make a public request (no authentication required)
   */
  protected async publicRequest<T>(config: RequestConfig): Promise<T> {
    return this.httpClient.request<T>(config);
  }
}
