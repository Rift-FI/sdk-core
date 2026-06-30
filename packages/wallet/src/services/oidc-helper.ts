/**
 * OIDC helper — browser-only.
 *
 * Wraps the Google Identity Services (GIS) flow to produce id_tokens
 * with a `nonce` claim bound to a specific user-op hash. The enclave
 * verifies that nonce matches the prehash it's about to sign, so a
 * stolen token can only authorise the exact transaction it was minted
 * for.
 *
 * Typical usage:
 *
 *   // 1. Once, when the user clicks "Sign in with Google":
 *   const enrolment = await OidcHelper.fetchEnrolment({ clientId, nonce: enrolNonce });
 *   await sdk.auth.migrateToV3({ enrolledMethods: [enrolment.method] });
 *
 *   // 2. Per transaction, when the user clicks "Send":
 *   const userOpHashHex = await sdk.transactions.previewUserOpHash({ ... });
 *   const proof = await OidcHelper.sign({ clientId, userOpHashHex });
 *   await sdk.transactions.send({ ..., authProof: proof });
 *
 * Requires the Google Sign-In script to be reachable from the page —
 * we load it dynamically on first use, no <script> tag needed.
 *
 * Apple support: SAME shape, different IdP. Add `OidcHelper.signWithApple`
 * later — the spec is identical, only the script URL + payload differ.
 */

import type { AuthProof, EnrolledMethod } from "../types";

const GIS_SRC = "https://accounts.google.com/gsi/client";

interface GisAccountsId {
  initialize: (config: {
    client_id: string;
    nonce?: string;
    callback: (resp: { credential: string }) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    use_fedcm_for_prompt?: boolean;
  }) => void;
  prompt: (listener?: (n: unknown) => void) => void;
  renderButton: (
    el: HTMLElement,
    options: Record<string, unknown>
  ) => void;
  disableAutoSelect: () => void;
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GisAccountsId } };
  }
}

function assertBrowser(): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error(
      "OidcHelper can only be used in a browser — it depends on Google Identity Services. On the server, call your backend's OAuth-handling endpoint instead."
    );
  }
}

async function loadGis(): Promise<GisAccountsId> {
  assertBrowser();
  if (window.google?.accounts?.id) return window.google.accounts.id;

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GIS_SRC}"]`
    );
    if (existing) {
      // Wait for it to load.
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("GIS script failed")), { once: true });
      // If it's already loaded, the event has fired and we'll hang.
      // Resolve immediately if google.accounts.id already exists.
      if (window.google?.accounts?.id) resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = GIS_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("failed to load Google Identity Services script"));
    document.head.appendChild(s);
  });

  if (!window.google?.accounts?.id) {
    throw new Error("Google Identity Services loaded but accounts.id is not available");
  }
  return window.google.accounts.id;
}

/**
 * Decoded subset of the id_token claims we need to construct an
 * `EnrolledMethod`. Decoded client-side; the enclave does the real
 * verification — this is just to populate (iss, sub) for the user.
 */
function decodeJwtUnverified(jwt: string): { iss: string; sub: string } {
  const parts = jwt.split(".");
  if (parts.length !== 3) throw new Error("not a JWT");
  // base64url-decode the payload
  const payloadB64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = payloadB64 + "===".slice(0, (4 - (payloadB64.length % 4)) % 4);
  const json = atob(padded);
  const obj = JSON.parse(json) as { iss?: string; sub?: string };
  if (!obj.iss || !obj.sub) {
    throw new Error("id_token missing iss or sub");
  }
  return { iss: obj.iss, sub: obj.sub };
}

export interface OidcEnrolmentResult {
  /** Pass this directly to signup / login / migrateToV3 as enrolledMethods[i]. */
  method: EnrolledMethod;
  /** The raw id_token — useful if you also want to send it as a one-shot authProof. */
  idToken: string;
}

export class OidcHelper {
  /**
   * Fetch a Google id_token for enrolment. The user picks a Google
   * account in the consent flow. The returned `method` is what you
   * pass to `auth.migrateToV3()` or as `enrolledMethods` at signup.
   *
   * The `nonce` here is anti-replay for enrolment only — you can use
   * any opaque value (a random UUID is fine). For per-transaction
   * signing, use `sign()` instead, which binds nonce=user_op_hash.
   */
  static async fetchEnrolment(opts: {
    clientId: string;
    /** Random opaque value. Defaults to a fresh crypto.randomUUID(). */
    nonce?: string;
    /** Where to render the Google button. Required. */
    buttonContainer: HTMLElement;
    /** Optional button visual config — see GIS docs. */
    buttonOptions?: Record<string, unknown>;
  }): Promise<OidcEnrolmentResult> {
    const idToken = await OidcHelper.requestIdToken({
      clientId: opts.clientId,
      nonce: opts.nonce ?? crypto.randomUUID(),
      buttonContainer: opts.buttonContainer,
      buttonOptions: opts.buttonOptions,
    });
    const { iss, sub } = decodeJwtUnverified(idToken);
    return {
      method: { kind: "oidc", iss, sub },
      idToken,
    };
  }

  /**
   * Sign a specific user-op hash via Google. The id_token's `nonce`
   * claim will equal `userOpHashHex` (no 0x prefix), which the enclave
   * uses to bind this proof to this specific transaction.
   *
   * `clientId` MUST be the same one you used at enrolment (it ends up
   * in the JWT's `aud` claim, which the enclave checks against its
   * pinned accept list).
   */
  static async sign(opts: {
    clientId: string;
    /** 32-byte hash, hex, with or without 0x prefix. */
    userOpHashHex: string;
    buttonContainer: HTMLElement;
    buttonOptions?: Record<string, unknown>;
  }): Promise<AuthProof> {
    const nonce = opts.userOpHashHex.replace(/^0x/i, "").toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(nonce)) {
      throw new Error("userOpHashHex must be 32 bytes hex");
    }
    const idToken = await OidcHelper.requestIdToken({
      clientId: opts.clientId,
      nonce,
      buttonContainer: opts.buttonContainer,
      buttonOptions: opts.buttonOptions,
    });
    return { kind: "oidc", id_token: idToken };
  }

  /**
   * Lower-level: render a Google Sign-In button and wait for the user
   * to click it. Returns the raw id_token. Used internally by both
   * fetchEnrolment and sign.
   */
  private static async requestIdToken(opts: {
    clientId: string;
    nonce: string;
    buttonContainer: HTMLElement;
    buttonOptions?: Record<string, unknown>;
  }): Promise<string> {
    const gis = await loadGis();

    return new Promise<string>((resolve, reject) => {
      let resolved = false;
      try {
        gis.initialize({
          client_id: opts.clientId,
          nonce: opts.nonce,
          callback: (resp) => {
            if (resolved) return;
            resolved = true;
            if (!resp.credential) {
              reject(new Error("Google returned no credential"));
              return;
            }
            resolve(resp.credential);
          },
          auto_select: false,
          cancel_on_tap_outside: false,
        });
        // Clear and render fresh button so the latest nonce sticks.
        opts.buttonContainer.innerHTML = "";
        gis.renderButton(opts.buttonContainer, {
          theme: "outline",
          size: "large",
          text: "signin_with",
          ...opts.buttonOptions,
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}
