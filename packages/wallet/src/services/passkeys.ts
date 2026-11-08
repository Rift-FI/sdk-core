import { BaseService } from "../base-service";
import {
  PasskeyRegistrationOptions,
  RegisterPasskeyRequest,
  RegisterPasskeyResponse,
  ConfirmPasskeyRequest,
  ConfirmPasskeyResponse,
  PasskeyCredential,
  RemovePasskeyResponse,
  ConfirmPasskeyRemovalRequest,
  PasskeyTicket,
  PasskeyTicketSigner,
  PasskeySignature,
} from "../types";
import { registerPasskey, RegisterPasskeyOptions } from "../passkey-wallet";

/**
 * Passkeys that own the user's Safe wallet (`/v1/wallet/passkeys`).
 *
 * The first passkey creates the wallet (new users) or takes over the
 * existing address (legacy wallets). More passkeys are recovery devices:
 * adding or removing one is an on-chain owner change, so it must be signed
 * by a passkey the wallet ALREADY has, on every chain where the Safe is
 * deployed.
 *
 * Every write is single-shot (never retried): challenges and tickets are
 * single use.
 */
export class PasskeysService extends BaseService {
  /** WebAuthn creation options (ES256 only, 5-minute single-use challenge). */
  async getRegistrationOptions(): Promise<PasskeyRegistrationOptions> {
    return this.authenticatedRequest<PasskeyRegistrationOptions>({
      method: "POST",
      url: "/v1/wallet/passkeys/options",
      retries: 0,
    });
  }

  /**
   * Store a registered passkey. Result by wallet state:
   *   - `active`            first passkey, new passkey-native wallet
   *   - `migrated|migrating` legacy wallet, same address, now passkey-owned
   *   - `new_wallet`        legacy key unrecoverable, fresh wallet
   *   - `pending_signature` wallet already has a passkey: sign `tickets`
   *                         with an EXISTING passkey and call `confirm`
   */
  async register(request: RegisterPasskeyRequest): Promise<RegisterPasskeyResponse> {
    return this.authenticatedRequest<RegisterPasskeyResponse>({
      method: "POST",
      url: "/v1/wallet/passkeys",
      data: request,
      retries: 0,
    });
  }

  /** Finish adding a passkey: one signature per ticket from `register`. */
  async confirm(request: ConfirmPasskeyRequest): Promise<ConfirmPasskeyResponse> {
    return this.authenticatedRequest<ConfirmPasskeyResponse>({
      method: "POST",
      url: "/v1/wallet/passkeys/confirm",
      data: request,
      retries: 0,
    });
  }

  async list(): Promise<PasskeyCredential[]> {
    return this.authenticatedRequest<PasskeyCredential[]>({
      method: "GET",
      url: "/v1/wallet/passkeys",
    });
  }

  /**
   * Start removing a passkey. Returns the owner-removal tickets to sign with
   * a remaining passkey (or the same one), then call `confirmRemoval`.
   * The last passkey cannot be removed (409 LAST_PASSKEY).
   */
  async remove(id: string): Promise<RemovePasskeyResponse> {
    return this.authenticatedRequest<RemovePasskeyResponse>({
      method: "DELETE",
      url: `/v1/wallet/passkeys/${encodeURIComponent(id)}`,
      retries: 0,
    });
  }

  async confirmRemoval(
    id: string,
    request: ConfirmPasskeyRemovalRequest
  ): Promise<ConfirmPasskeyResponse> {
    return this.authenticatedRequest<ConfirmPasskeyResponse>({
      method: "POST",
      url: `/v1/wallet/passkeys/${encodeURIComponent(id)}/confirm-removal`,
      data: request,
      retries: 0,
    });
  }

  // ── Browser conveniences ─────────────────────────────────────────

  /**
   * Whole registration in one call (browser): options → WebAuthn create →
   * register. For a user who already has a passkey, pass `signWithExisting`
   * to sign the add-owner tickets; the new passkey becomes active after
   * `confirm`. Without it a `pending_signature` result is returned as-is.
   *
   * ```ts
   * const res = await rift.passkeys.setup({
   *   label: "MacBook",
   *   signWithExisting: (t) => createPasskeyAuthProof(t.hashToSign, { rpId, allowCredentials: t.allowCredentials }),
   * });
   * ```
   */
  async setup(
    opts: RegisterPasskeyOptions & {
      label?: string;
      signWithExisting?: PasskeyTicketSigner;
    } = {}
  ): Promise<RegisterPasskeyResponse | ConfirmPasskeyResponse> {
    const options = await this.getRegistrationOptions();
    const attestation = await registerPasskey(options, opts);
    const res = await this.register({ attestation, label: opts.label });
    if (res.status !== "pending_signature" || !opts.signWithExisting) return res;
    const signatures = await signTickets(res.tickets, opts.signWithExisting);
    return this.confirm({
      credentialId: res.credentialId ?? attestation.cred_id_b64,
      signatures,
    });
  }

  /** `remove` + sign every ticket + `confirmRemoval`. */
  async removeWithPasskey(
    id: string,
    sign: PasskeyTicketSigner
  ): Promise<ConfirmPasskeyResponse> {
    const { tickets } = await this.remove(id);
    const signatures = await signTickets(tickets, sign);
    return this.confirmRemoval(id, { signatures });
  }
}

/** Sign tickets one after another (each is its own passkey prompt). */
async function signTickets(
  tickets: PasskeyTicket[],
  sign: PasskeyTicketSigner
): Promise<PasskeySignature[]> {
  const out: PasskeySignature[] = [];
  for (const ticket of tickets) {
    out.push({ ticketId: ticket.ticketId, authProof: await sign(ticket) });
  }
  return out;
}
