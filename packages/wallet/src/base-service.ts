import { RiftHttpClient } from "./http-client";
import { ApiError, MaybeApproval, RequestConfig, isApprovalRequired } from "./types";

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

  /**
   * Fund-moving / signing request (passkey wallets).
   *
   * - Never retried: a replay after a silently successful submit could
   *   duplicate a payment, so `retries` is forced to 0.
   * - A 202 `{ status: "APPROVAL_REQUIRED", ... }` body is returned as a
   *   typed `ApprovalRequiredResponse`, not thrown.
   * - Known 4xx codes from the passkey cut-over get a clear message.
   */
  protected async fundMovingRequest<T>(
    config: RequestConfig
  ): Promise<MaybeApproval<T>> {
    try {
      const result = await this.authenticatedRequest<any>({
        ...config,
        retries: 0,
      });
      if (isApprovalRequired(result)) return result;
      return result as T;
    } catch (error) {
      throw explainPasskeyError(error);
    }
  }
}

const PASSKEY_ERROR_HINTS: Record<string, string> = {
  EOA_SIGNING_REMOVED:
    "Raw EOA transaction signing was removed: Rift wallets are passkey-owned Safe smart accounts and no server-held key exists. Use signer.sendTransaction (UserOperation) or signer.previewUserOp + signer.submitPreparedUserOp.",
  PASSKEY_REQUIRED:
    "This operation must be approved with a passkey. Google / Apple are login only; send a passkey authProof (createPasskeyAuthProof) or omit it to get an approval request.",
  PASSKEY_SETUP_REQUIRED:
    "The user has no passkey yet. Register one with rift.passkeys.setup() (browser) before signing.",
  INVALID_PASSKEY_SIGNATURE:
    "The passkey assertion did not verify against the ticket's hashToSign. Preview again and sign the new hashToSign.",
  REPLACED_BY_PASSKEY_WALLETS:
    "The v3 envelope endpoints were replaced by passkey wallets. Use rift.passkeys (see /v1/wallet/passkeys).",
};

/** Attach a readable message to the passkey-wallet error codes. */
export function explainPasskeyError(error: unknown): unknown {
  const e = error as ApiError | undefined;
  if (!e || typeof e !== "object") return error;
  const code =
    (typeof e.code === "string" && PASSKEY_ERROR_HINTS[e.code] && e.code) ||
    (typeof e.error === "string" && PASSKEY_ERROR_HINTS[e.error] && e.error) ||
    (typeof e.message === "string" && PASSKEY_ERROR_HINTS[e.message] && e.message) ||
    undefined;
  if (!code) return error;
  return { ...e, code, message: `${code}: ${PASSKEY_ERROR_HINTS[code]}` };
}
