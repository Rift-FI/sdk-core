import { HttpClient, RequestConfig, ApiError, RiftConfig } from "./types";

export class RiftHttpClient implements HttpClient {
  private config: RiftConfig;
  private baseUrl: string;

  constructor(config: RiftConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || this.getDefaultBaseUrl();
  }

  private getDefaultBaseUrl(): string {
    switch (this.config.environment) {
      case "production":
        return "https://payment.riftfi.xyz";
      case "development":
        return "https://payment.riftfi.xyz";
      default:
        return "https://payment.riftfi.xyz";
    }
  }

  async request<T>(requestConfig: RequestConfig): Promise<T> {
    const { method, url, data, params, headers = {} } = requestConfig;

    // Build URL with query parameters
    const fullUrl = new URL(url, this.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          fullUrl.searchParams.append(key, String(value));
        }
      });
    }

    // Build headers
    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };

    // Add API key if available
    if (this.config.apiKey) {
      requestHeaders["X-API-Key"] = this.config.apiKey;
    }

    // Build fetch options
    const fetchOptions: RequestInit = {
      method,
      headers: requestHeaders,
    };

    // Add body for POST/PUT requests
    if (data && (method === "POST" || method === "PUT")) {
      fetchOptions.body = JSON.stringify(data);
    }

    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, this.config.timeout || 30000);

    fetchOptions.signal = controller.signal;

    try {
      const response = await this.executeWithRetry(
        fullUrl.toString(),
        fetchOptions
      );
      clearTimeout(timeoutId);

      return await this.handleResponse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);
      throw this.handleError(error);
    }
  }

  private async executeWithRetry(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    const maxRetries = this.config.retries || 3;
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);

        // Don't retry on client errors (4xx), only on server errors (5xx) and network errors
        if (response.ok || (response.status >= 400 && response.status < 500)) {
          return response;
        }

        if (attempt === maxRetries) {
          return response;
        }

        // Wait before retrying (exponential backoff)
        await this.delay(Math.pow(2, attempt) * 1000);
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries) {
          throw lastError;
        }

        // Wait before retrying
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }

    throw lastError!;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get("content-type");

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorDetails: any = {};

      try {
        if (contentType?.includes("application/json")) {
          errorDetails = await response.json();
          errorMessage =
            errorDetails.message || errorDetails.error || errorMessage;
        } else {
          errorMessage = (await response.text()) || errorMessage;
        }
      } catch {
        // If we can't parse the error response, use the default message
      }

      const apiError: ApiError = {
        message: errorMessage,
        error: errorDetails.error,
        status: response.status,
      };

      throw apiError;
    }

    // Handle different response types
    if (response.status === 204) {
      return {} as T;
    }

    if (contentType?.includes("application/json")) {
      return await response.json();
    }

    // For non-JSON responses, return as text
    return (await response.text()) as T;
  }

  private handleError(error: any): ApiError {
    if (error.name === "AbortError") {
      return {
        message: "Request timeout",
        error: "The request took too long to complete",
        status: 408,
      };
    }

    if (error.message && error.status) {
      // Already an ApiError
      return error;
    }

    if (error instanceof TypeError && error.message.includes("fetch")) {
      return {
        message: "Network error",
        error:
          "Unable to connect to the server. Please check your internet connection.",
        status: 0,
      };
    }

    return {
      message: error.message || "An unexpected error occurred",
      error: error.toString(),
      status: 500,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Method to update API key
  setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
  }

  // Method to update bearer token for user authentication
  setBearerToken(token: string): void {
    // This will be handled by individual service methods
  }
}


