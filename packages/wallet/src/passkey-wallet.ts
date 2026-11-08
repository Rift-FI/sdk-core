/**
 * Passkey wallet ceremonies (browser).
 *
 * Rift wallets are Safe smart accounts owned only by the user's passkeys.
 * These two helpers are the only device-side pieces an integration needs:
 *
 *   registerPasskey(options)          → attestation for POST /v1/wallet/passkeys
 *   createPasskeyAuthProof(hash, ...) → authProof for any submit / approve call
 *
 * Both call `navigator.credentials` directly, so they need a browser (or any
 * runtime that provides a WebAuthn `navigator.credentials`). ES256 / P-256
 * (COSE alg -7) only: Safe's WebAuthn signer verifies P-256 on-chain.
 */

import type {
  PasskeyAttestation,
  PasskeyAuthProof,
  PasskeyRegistrationOptions,
} from "./types";

/** COSE algorithm id for ES256 (ECDSA P-256 / SHA-256). The only one accepted. */
export const PASSKEY_ALG_ES256 = -7;

function credentialsApi(): CredentialsContainer {
  const nav: any = typeof navigator !== "undefined" ? navigator : undefined;
  if (!nav || !nav.credentials || typeof nav.credentials.get !== "function") {
    throw new Error(
      "Passkeys need a browser with WebAuthn (navigator.credentials). On a server, create an approval request instead and send the user its approvalUrl."
    );
  }
  return nav.credentials as CredentialsContainer;
}

/** Standard base64 (with padding) of raw bytes. */
export function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

/** Decode standard base64 OR base64url (padding optional). */
export function base64ToBytes(value: string): Uint8Array {
  let s = value.replace(/-/g, "+").replace(/_/g, "/").replace(/\s+/g, "");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** 0x-prefixed (or bare) hex → bytes. */
export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/^0x/i, "");
  if (clean.length % 2 || !/^[0-9a-fA-F]*$/.test(clean)) {
    throw new Error("invalid hex string");
  }
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function toBytes(buf: ArrayBuffer | ArrayBufferView): Uint8Array {
  if (buf instanceof Uint8Array) return buf;
  if (ArrayBuffer.isView(buf)) {
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  }
  return new Uint8Array(buf);
}

export interface CreatePasskeyAuthProofOptions {
  /** Relying-party id the passkey was registered under (e.g. "riftfi.com"). */
  rpId?: string;
  /**
   * Credential ids (standard base64 or base64url) allowed to sign. Pass the
   * preview's `allowCredentials`. Empty / omitted → any discoverable passkey.
   */
  allowCredentials?: string[];
  /** WebAuthn timeout, ms. Default 60000. */
  timeout?: number;
}

/**
 * Sign `hashToSign` (the 32-byte hash from a preview / approval / passkey
 * ticket) with the user's passkey and return the `authProof` to submit.
 *
 * The WebAuthn challenge is the 32 raw hash bytes and user verification is
 * required, so the proof is bound to exactly this operation.
 *
 * ```ts
 * const preview = await rift.transactions.previewSpend({ token: "USDC", chain: "BASE", recipient, amount: "10" });
 * const authProof = await createPasskeyAuthProof(getHashToSign(preview), {
 *   rpId: "riftfi.com",
 *   allowCredentials: preview.allowCredentials,
 * });
 * await rift.signer.submitPreparedUserOp({ ticketId: preview.ticketId, authProof });
 * ```
 */
export async function createPasskeyAuthProof(
  hashToSign: string,
  opts: CreatePasskeyAuthProofOptions = {}
): Promise<PasskeyAuthProof> {
  const challenge = hexToBytes(hashToSign);
  if (challenge.length !== 32) {
    throw new Error("hashToSign must be 32 bytes (0x + 64 hex chars)");
  }
  const allowCredentials: PublicKeyCredentialDescriptor[] = (opts.allowCredentials ?? []).map(
    (id) => ({ type: "public-key", id: base64ToBytes(id) as BufferSource })
  );
  const publicKey: PublicKeyCredentialRequestOptions = {
    challenge: challenge as BufferSource,
    allowCredentials,
    userVerification: "required",
    timeout: opts.timeout ?? 60000,
  };
  if (opts.rpId) publicKey.rpId = opts.rpId;

  const assertion = (await credentialsApi().get({ publicKey })) as PublicKeyCredential | null;
  if (!assertion) throw new Error("Passkey prompt was dismissed (no assertion returned)");
  const r = assertion.response as AuthenticatorAssertionResponse;
  return {
    kind: "passkey",
    cred_id_b64: bytesToBase64(toBytes(assertion.rawId)),
    client_data_json_b64: bytesToBase64(toBytes(r.clientDataJSON)),
    authenticator_data_b64: bytesToBase64(toBytes(r.authenticatorData)),
    signature_b64: bytesToBase64(toBytes(r.signature)),
  };
}

export interface RegisterPasskeyOptions {
  /** WebAuthn timeout, ms. Defaults to the server's `timeout` or 60000. */
  timeout?: number;
  /** Prefer a built-in authenticator ("platform") or a security key ("cross-platform"). */
  authenticatorAttachment?: AuthenticatorAttachment;
}

/**
 * Run the WebAuthn registration ceremony with the options from
 * `rift.passkeys.getRegistrationOptions()` and return the attestation for
 * `rift.passkeys.register()`.
 *
 * Always ES256 (-7) only, resident key required, user verification required,
 * whatever the server options say: a non-P-256 passkey could never sign for
 * the Safe.
 */
export async function registerPasskey(
  options: PasskeyRegistrationOptions,
  opts: RegisterPasskeyOptions = {}
): Promise<PasskeyAttestation> {
  const api = credentialsApi();
  const authenticatorSelection: AuthenticatorSelectionCriteria = {
    residentKey: "required",
    requireResidentKey: true,
    userVerification: "required",
  };
  if (opts.authenticatorAttachment) {
    authenticatorSelection.authenticatorAttachment = opts.authenticatorAttachment;
  }
  const publicKey: PublicKeyCredentialCreationOptions = {
    challenge: base64ToBytes(options.challenge) as BufferSource,
    rp: { id: options.rp.id, name: options.rp.name },
    user: {
      id: base64ToBytes(options.user.id) as BufferSource,
      name: options.user.name,
      displayName: options.user.displayName ?? options.user.name,
    },
    pubKeyCredParams: [{ type: "public-key", alg: PASSKEY_ALG_ES256 }],
    excludeCredentials: (options.excludeCredentials ?? []).map((c) => ({
      type: "public-key" as const,
      id: base64ToBytes(c.id) as BufferSource,
      ...(c.transports ? { transports: c.transports as AuthenticatorTransport[] } : {}),
    })),
    authenticatorSelection,
    attestation: "none",
    timeout: opts.timeout ?? options.timeout ?? 60000,
  };

  const credential = (await api.create({ publicKey })) as PublicKeyCredential | null;
  if (!credential) throw new Error("Passkey registration was dismissed (no credential returned)");
  const response = credential.response as AuthenticatorAttestationResponse;
  if (typeof response.getPublicKeyAlgorithm === "function") {
    const alg = response.getPublicKeyAlgorithm();
    if (alg !== PASSKEY_ALG_ES256) {
      throw new Error(`Passkey uses COSE alg ${alg}; only ES256 (-7) can own a Rift wallet`);
    }
  }
  return {
    cred_id_b64: bytesToBase64(toBytes(credential.rawId)),
    client_data_json_b64: bytesToBase64(toBytes(response.clientDataJSON)),
    attestation_object_b64: bytesToBase64(toBytes(response.attestationObject)),
  };
}
