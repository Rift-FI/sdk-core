/**
 * Passkey helper — browser-only.
 *
 * Wraps `navigator.credentials.create()` and `navigator.credentials.get()`
 * with all the small encoding ceremonies the enclave expects:
 *
 *   - Extracts X / Y coordinates from the SPKI-encoded public key the
 *     browser hands us and re-packs them as a COSE_Key CBOR blob (which
 *     is what the enclave's `webauthn_verification` module parses).
 *   - Binds the assertion's challenge to a specific user-op hash so the
 *     proof is non-replayable across transactions.
 *   - Returns ready-to-send `EnrolledMethod` / `AuthProof` objects.
 *
 * Algorithm: ES256 / P-256 (COSE alg -7). Covers virtually all modern
 * platform authenticators (iOS Secure Enclave, Android Keystore, Windows
 * Hello on TPM, most YubiKey models).
 *
 * Note about RP-ID: the enclave's pinned policy accepts a list of RP-IDs
 * (typically your top-level domain + "localhost" for dev). You must pass
 * the SAME `rpId` to enrol() and sign() — passkeys are bound to one RP.
 */

import type { AuthProof, EnrolledMethod } from "../types";

function assertBrowser(): void {
  if (
    typeof window === "undefined" ||
    typeof navigator === "undefined" ||
    typeof navigator.credentials === "undefined"
  ) {
    throw new Error(
      "PasskeyHelper can only be used in a browser. On the server, the assertion has to be produced by the user's device — there's no server-side equivalent."
    );
  }
}

/** Quick capability check for "should I offer a passkey UI?". */
export function isPasskeySupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    typeof PublicKeyCredential !== "undefined" &&
    typeof navigator.credentials !== "undefined"
  );
}

/**
 * Async capability check that also asks "does this device have a built-in
 * authenticator (Touch ID, Face ID, Windows Hello)?". Returns false on
 * desktops without biometric hardware unless a roaming key is connected.
 */
export async function isPlatformPasskeySupported(): Promise<boolean> {
  if (!isPasskeySupported()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/** base64 (with padding) for a byte buffer. */
function b64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/^0x/i, "").toLowerCase();
  if (clean.length % 2) throw new Error("hex string has odd length");
  if (!/^[0-9a-f]*$/.test(clean)) throw new Error("hex string has non-hex chars");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/**
 * Build a COSE_Key for a P-256 ES256 public key, given the X and Y
 * affine coordinates as 32-byte big-endian integers.
 *
 * COSE_Key map (RFC 8152):
 *   1  (kty)  → 2  (EC2)
 *   3  (alg)  → -7 (ES256)
 *   -1 (crv)  → 1  (P-256)
 *   -2 (x)    → bytes(32)
 *   -3 (y)    → bytes(32)
 *
 * Hand-rolled to avoid dragging a 100KB CBOR library into the bundle.
 */
function encodeCoseEc2P256(x: Uint8Array, y: Uint8Array): Uint8Array {
  if (x.length !== 32 || y.length !== 32) {
    throw new Error("P-256 X/Y must be 32 bytes each");
  }
  // Output is exactly 77 bytes for this fixed-shape map.
  const out = new Uint8Array(77);
  let i = 0;
  out[i++] = 0xa5; // map(5)
  out[i++] = 0x01; out[i++] = 0x02;          // kty: 2
  out[i++] = 0x03; out[i++] = 0x26;          // alg: -7
  out[i++] = 0x20; out[i++] = 0x01;          // crv: 1
  out[i++] = 0x21; out[i++] = 0x58; out[i++] = 0x20; // -2: bytes(32)
  out.set(x, i); i += 32;
  out[i++] = 0x22; out[i++] = 0x58; out[i++] = 0x20; // -3: bytes(32)
  out.set(y, i); i += 32;
  return out;
}

/**
 * Extract the (X, Y) P-256 coordinates from an SPKI-DER-encoded
 * public key. WebAuthn's `credential.response.getPublicKey()` returns
 * SPKI; for P-256 the last 65 bytes are 0x04 || X(32) || Y(32).
 */
function spkiToCose(spki: Uint8Array): Uint8Array {
  if (spki.length < 65) {
    throw new Error("SPKI too short to be a P-256 key");
  }
  const tail = spki.slice(-65);
  if (tail[0] !== 0x04) {
    throw new Error(
      "public key is not an uncompressed P-256 point — only ES256 is supported"
    );
  }
  const x = tail.slice(1, 33);
  const y = tail.slice(33, 65);
  return encodeCoseEc2P256(x, y);
}

export interface PasskeyEnrolmentResult {
  /** Pass to signup / login / migrateToV3 as enrolledMethods[i]. */
  method: EnrolledMethod;
  /** Raw credential ID (base64-padded). Same value as method.cred_id_b64. */
  credentialIdB64: string;
  /** Raw COSE_Key bytes (base64-padded). Same as method.cose_pubkey_b64. */
  cosePublicKeyB64: string;
}

export class PasskeyHelper {
  /**
   * Run a WebAuthn enrolment ceremony. Prompts the user for biometric /
   * device PIN. Returns an `EnrolledMethod` ready to pass to the SDK.
   *
   * `rpId` should be your eTLD+1 (e.g. "riftfi.xyz") or "localhost" for
   * dev. The SAME rpId must appear in the enclave's pinned policy
   * (see WebAuthnPolicy.accepted_rp_ids).
   */
  static async enrol(opts: {
    rpId: string;
    rpName: string;
    /** User identifier — any opaque 16-32 byte value. Defaults to randomUUID bytes. */
    userId?: Uint8Array;
    /** Display string for the user — usually email or username. */
    userName: string;
    userDisplayName?: string;
    /**
     * If true (default), requires biometric / PIN verification at enrolment.
     * Set to false for "device PIN only" or roaming-key-only flows.
     */
    requireUserVerification?: boolean;
  }): Promise<PasskeyEnrolmentResult> {
    assertBrowser();
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = opts.userId ?? new TextEncoder().encode(crypto.randomUUID());
    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { id: opts.rpId, name: opts.rpName },
        user: {
          id: userId,
          name: opts.userName,
          displayName: opts.userDisplayName ?? opts.userName,
        },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }],
        authenticatorSelection: {
          userVerification:
            opts.requireUserVerification === false ? "preferred" : "required",
          residentKey: "preferred",
        },
        timeout: 60000,
        attestation: "none",
      },
    })) as PublicKeyCredential | null;
    if (!credential) {
      throw new Error("WebAuthn enrolment returned no credential");
    }

    const response = credential.response as AuthenticatorAttestationResponse;
    const spki = new Uint8Array(response.getPublicKey() ?? new ArrayBuffer(0));
    const cose = spkiToCose(spki);
    const credIdBytes = new Uint8Array(credential.rawId);

    const credIdB64 = b64(credIdBytes);
    const coseB64 = b64(cose);

    return {
      method: {
        kind: "passkey",
        cred_id_b64: credIdB64,
        cose_pubkey_b64: coseB64,
      },
      credentialIdB64: credIdB64,
      cosePublicKeyB64: coseB64,
    };
  }

  /**
   * Produce an `AuthProof` for a specific user-op hash. Prompts the
   * user for biometric / PIN. The assertion's challenge is the raw
   * 32-byte hash, so the resulting proof is bound to this exact
   * transaction.
   *
   * Pass the SAME `rpId` you used at enrolment.
   *
   * `allowedCredentialIdB64` — restrict to a specific credential. Pass
   * the one you stored at enrolment. If omitted, the browser picks
   * among all credentials for this RP (discoverable credentials).
   */
  static async sign(opts: {
    rpId: string;
    /** 32-byte hash, hex, with or without 0x prefix. */
    userOpHashHex: string;
    allowedCredentialIdB64?: string;
    requireUserVerification?: boolean;
  }): Promise<AuthProof> {
    assertBrowser();
    const challenge = hexToBytes(opts.userOpHashHex);
    if (challenge.length !== 32) {
      throw new Error("userOpHashHex must be 32 bytes (64 hex chars)");
    }
    const allowCredentials: PublicKeyCredentialDescriptor[] = [];
    if (opts.allowedCredentialIdB64) {
      allowCredentials.push({
        type: "public-key",
        id: Uint8Array.from(atob(opts.allowedCredentialIdB64), (c) => c.charCodeAt(0)),
      });
    }
    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge,
        rpId: opts.rpId,
        allowCredentials,
        userVerification:
          opts.requireUserVerification === false ? "preferred" : "required",
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;
    if (!assertion) {
      throw new Error("WebAuthn assertion returned null");
    }
    const r = assertion.response as AuthenticatorAssertionResponse;
    return {
      kind: "passkey",
      cred_id_b64: b64(new Uint8Array(assertion.rawId)),
      client_data_json_b64: b64(new Uint8Array(r.clientDataJSON)),
      authenticator_data_b64: b64(new Uint8Array(r.authenticatorData)),
      signature_b64: b64(new Uint8Array(r.signature)),
    };
  }
}
