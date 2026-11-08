import { BaseService } from "../base-service";
import {
  TokenBalanceRequest,
  ChainBalanceRequest,
  Balance,
  ApiResponse,
  AddMethodChallengeRequest,
  AddMethodChallengeResponse,
  AddWalletMethodRequest,
  AddWalletMethodResponse,
  AuthProof,
  NewWalletMethod,
  WalletMethodsResponse,
  WalletStatus,
} from "../types";
import {
  AddMethodConsentChallenge,
  resolveAddMethodConsentChallenge,
} from "../bound-reseal";

export class WalletService extends BaseService {
  async getTokenBalance(
    request: TokenBalanceRequest
  ): Promise<ApiResponse<Balance[]>> {
    return this.authenticatedRequest<ApiResponse<Balance[]>>({
      method: "GET",
      url: "/v1/balances/tokens",
      params: {
        token: request.token,
        ...(request.chain && { chain: request.chain }),
      },
    });
  }

  async getChainBalance(request?: ChainBalanceRequest): Promise<ApiResponse<Balance[]>> {
    const options: any = {
      method: "GET",
      url: "/v1/balances",
    };

    if (request?.chain) {
      options.params = { chain: request.chain };
    }

    return this.authenticatedRequest<ApiResponse<Balance[]>>(options);
  }

  /**
   * Passkey wallet state: `mode` ("none" | "legacy" | "passkey"), address,
   * passkey count, per-chain owner mode and `needsPasskeySetup`.
   *
   * When `needsPasskeySetup` is true, show the mandatory "Secure your wallet
   * with a passkey" screen and run `rift.passkeys.setup()`; every signing
   * route answers 409 PASSKEY_SETUP_REQUIRED until then.
   */
  async status(): Promise<WalletStatus> {
    return this.authenticatedRequest<WalletStatus>({
      method: "GET",
      url: "/v1/wallet/status",
    });
  }

  // ───────────────────────────────────────────────────────────────────
  // v3 auth methods — DEPRECATED. Replaced by passkey wallets: the backend
  // answers 410 REPLACED_BY_PASSKEY_WALLETS. Use `rift.passkeys` instead.
  // Kept so existing code still compiles; scheduled for removal.
  // ───────────────────────────────────────────────────────────────────

  /** @deprecated Use `rift.passkeys.list()`. Backend answers 410. */
  async listMethods(): Promise<WalletMethodsResponse> {
    return this.authenticatedRequest<WalletMethodsResponse>({
      method: "GET",
      url: "/wallet/methods",
    });
  }

  /**
   * @deprecated Use `rift.passkeys.add()`. Backend answers 410.
   *
   * Step 1 of adding a method: get a fresh single-use 32-byte server nonce
   * (5-minute TTL) plus the wallet's `ownerAddress`.
   *
   * Do not sign `challengeHex` directly. Pass the response to
   * `prepareAddMethodConsent()` to get the value the consent proof must be
   * over (the bound reseal challenge).
   */
  async requestAddMethodChallenge(
    request: AddMethodChallengeRequest = {}
  ): Promise<AddMethodChallengeResponse> {
    return this.authenticatedRequest<AddMethodChallengeResponse>({
      method: "POST",
      url: "/wallet/methods/challenge",
      data: request,
      // Issuing a challenge replaces the previous one; never replay.
      retries: 0,
    });
  }

  /**
   * @deprecated Use `rift.passkeys.add()`.
   *
   * Step 2: compute what the consent proof from an ALREADY-enrolled method
   * must be over, for adding `newMethod`.
   *
   *   - Backend returned `ownerAddress` → bound reseal challenge
   *     SHA-256("rift-reseal-v1" || 0x00 || owner || nonce || canonical(newMethod)).
   *   - No `ownerAddress` (older backend) → legacy: the raw nonce, with a
   *     console warning.
   *
   * Feed `challengeHex` to `PasskeyHelper.sign({ userOpHashHex })` (the
   * WebAuthn challenge becomes the 32 raw bytes).
   */
  async prepareAddMethodConsent(
    challenge: AddMethodChallengeResponse,
    newMethod: NewWalletMethod
  ): Promise<AddMethodConsentChallenge> {
    return resolveAddMethodConsentChallenge(challenge, newMethod);
  }

  /**
   * @deprecated Use `rift.passkeys.add()`. Backend answers 410.
   *
   * Step 3: submit the consent proof and the new method. The enclave
   * verifies the proof against the wallet's existing methods and reseals
   * the envelope with the new one appended.
   *
   * Not retried: the server challenge is single use.
   */
  async addMethod(
    request: AddWalletMethodRequest
  ): Promise<AddWalletMethodResponse> {
    return this.authenticatedRequest<AddWalletMethodResponse>({
      method: "POST",
      url: "/wallet/methods",
      data: request,
      retries: 0,
    });
  }

  /**
   * @deprecated Use `rift.passkeys.add()`. Backend answers 410.
   *
   * Whole add-method flow in one call: fetch the challenge, compute the
   * consent challenge, ask the user for consent via `sign`, then submit.
   *
   * ```ts
   * const enrol = await PasskeyHelper.enrol({ rpId, rpName, userName });
   * await rift.wallet.addMethodWithConsent({
   *   newMethod: enrol.method,
   *   // consent from the passkey the wallet ALREADY has
   *   sign: (challengeHex) =>
   *     PasskeyHelper.sign({ rpId, userOpHashHex: challengeHex, allowedCredentialIdB64 }),
   * });
   * ```
   */
  async addMethodWithConsent(opts: {
    newMethod: NewWalletMethod;
    /** Produce an AuthProof from an already-enrolled method over
     *  `challengeHex` (32 bytes hex, no 0x). */
    sign: (
      challengeHex: string,
      ctx: { mode: AddMethodConsentChallenge["mode"]; challenge: AddMethodChallengeResponse }
    ) => Promise<AuthProof>;
  }): Promise<AddWalletMethodResponse> {
    const challenge = await this.requestAddMethodChallenge({
      newMethod: opts.newMethod,
    });
    const consent = await this.prepareAddMethodConsent(challenge, opts.newMethod);
    const authProof = await opts.sign(consent.challengeHex, {
      mode: consent.mode,
      challenge,
    });
    return this.addMethod({ authProof, newMethod: opts.newMethod });
  }
}
