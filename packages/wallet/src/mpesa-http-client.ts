import { HttpClient, RequestConfig, RiftConfig, ApiError } from "./types";

export class MpesaHttpClient implements HttpClient {
  private config: RiftConfig;
  private baseUrl: string;

  constructor(config: RiftConfig) {
    this.config = config;
    this.baseUrl = this.getMpesaBaseUrl();
  }

  private getMpesaBaseUrl(): string {
    return "https://mpesa-offramping-onramping-production.up.railway.app";
  }

  async request<T>(requestConfig: RequestConfig): Promise<T> {
    const { method, url, data, params, headers = {} } = requestConfig;

    const fullUrl = new URL(url, this.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          fullUrl.searchParams.append(key, String(value));
        }
      });
    }

    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };

    if (this.config.apiKey) {
      requestHeaders["X-API-Key"] = this.config.apiKey;
    }

    const fetchOptions: any = {
      method,
      headers: requestHeaders,
    };

    if (data && (method === "POST" || method === "PUT")) {
      fetchOptions.body = JSON.stringify(data);
    }

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
    } catch (error: any) {
      clearTimeout(timeoutId);
      throw this.handleError(error);
    }
  }

  private async executeWithRetry(
    url: string,
    options: any
  ): Promise<Response> {
    const maxRetries = this.config.retries || 3;
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);
        if (
          response.ok ||
          (response.status >= 400 && response.status < 500)
        ) {
          return response;
        }
        if (attempt === maxRetries) {
          return response;
        }
        await this.delay(Math.pow(2, attempt) * 1000);
      } catch (error) {
        lastError = error;
        if (attempt === maxRetries) {
          throw lastError;
        }
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }

    throw lastError;
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

    if (response.status === 204) {
      return {} as T;
    }

    if (contentType?.includes("application/json")) {
      return (await response.json()) as T;
    }

    return (await response.text()) as unknown as T;
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

  setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
  }
}
