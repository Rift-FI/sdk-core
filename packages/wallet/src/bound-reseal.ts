/**
 * Bound reseal challenge: the exact 32 bytes a consent proof must be over
 * when adding an auth method (passkey / Google / Apple) to an existing v3
 * wallet.
 *
 * Mirrors rift-signer-enclave `bound_reseal_challenge` and the backend's
 * utils/boundResealChallenge.ts byte for byte:
 *
 *   challenge = SHA-256( "rift-reseal-v1" || 0x00
 *                        || owner_address (20 raw bytes, EOA)
 *                        || server_nonce  (32 raw bytes = hex-decode(challengeHex))
 *                        || canonical(new_method) )
 *
 *   canonical OIDC    = 0x01 || u32be(len iss) || iss || u32be(len sub) || sub
 *   canonical Passkey = 0x02 || u32be(len cred_id) || cred_id || u32be(len cose) || cose
 *
 * cred_id / cose are the base64-DECODED bytes of cred_id_b64 /
 * cose_pubkey_b64 (standard, padded alphabet, as the enclave decodes them).
 *
 * How the result is used:
 *   - Passkey proof: WebAuthn `challenge` = the 32 raw bytes.
 *   - OIDC proof:    id_token `nonce`    = lowercase hex of the 32 bytes.
 *
 * Pure and dependency-free: SHA-256 comes from WebCrypto
 * (`crypto.subtle.digest`), with a Node `crypto` fallback for runtimes that
 * lack a global WebCrypto.
 */

export const RESEAL_DOMAIN_TAG = "rift-reseal-v1";

const METHOD_TAG_OIDC = 0x01;
const METHOD_TAG_PASSKEY = 0x02;

/** The fields of a new method that enter the canonical encoding. Extra
 *  fields (e.g. an OIDC `email`) are ignored, as the enclave ignores them. */
export type BoundResealMethod =
  | { kind: "oidc"; iss: string; sub: string; [extra: string]: unknown }
  | {
      kind: "passkey";
      cred_id_b64: string;
      cose_pubkey_b64: string;
      [extra: string]: unknown;
    };

export interface BoundResealChallengeInput {
  /** Wallet EOA owner, 20 bytes hex (0x optional, any case). Use
   *  `ownerAddress` from `POST /wallet/methods/challenge`. */
  ownerAddress: string;
  /** `challengeHex` from `POST /wallet/methods/challenge` (32 bytes). */
  serverNonceHex: string;
  /** The method being added. */
  newMethod: BoundResealMethod;
}

export interface BoundResealChallenge {
  /** The 32 raw challenge bytes (WebAuthn `challenge`). */
  bytes: Uint8Array;
  /** Lowercase hex of `bytes`, no 0x (OIDC `nonce`). */
  hex: string;
}

export class BoundResealInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BoundResealInputError";
  }
}

const B64_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Strict standard-alphabet, padded, canonical base64 decode (matches the
 *  enclave's `general_purpose::STANDARD`). No Buffer / atob dependency. */
function decodeStdB64(value: unknown, field: string): Uint8Array {
  if (typeof value !== "string") {
    throw new BoundResealInputError(`${field} must be a base64 string`);
  }
  if (value.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) {
    throw new BoundResealInputError(
      `${field} must be standard padded base64 (A-Z a-z 0-9 + /)`
    );
  }
  const pad = value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0;
  const outLen = (value.length / 4) * 3 - pad;
  const out = new Uint8Array(outLen);
  let o = 0;
  for (let i = 0; i < value.length; i += 4) {
    const c = [0, 1, 2, 3].map((k) => {
      const ch = value[i + k];
      return ch === "=" ? 0 : B64_ALPHABET.indexOf(ch);
    });
    const n = (c[0] << 18) | (c[1] << 12) | (c[2] << 6) | c[3];
    if (o < outLen) out[o++] = (n >> 16) & 0xff;
    if (o < outLen) out[o++] = (n >> 8) & 0xff;
    if (o < outLen) out[o++] = n & 0xff;
  }
  // Reject non-canonical trailing bits, which the enclave also rejects.
  if (encodeStdB64(out) !== value) {
    throw new BoundResealInputError(`${field} is not canonical base64`);
  }
  return out;
}

function encodeStdB64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const n = (b0 << 16) | (b1 << 8) | b2;
    s += B64_ALPHABET[(n >> 18) & 63] + B64_ALPHABET[(n >> 12) & 63];
    s += i + 1 < bytes.length ? B64_ALPHABET[(n >> 6) & 63] : "=";
    s += i + 2 < bytes.length ? B64_ALPHABET[n & 63] : "=";
  }
  return s;
}

/** Decode a 0x-optional hex string of an exact byte length. */
function decodeHexExact(value: unknown, bytes: number, field: string): Uint8Array {
  if (typeof value !== "string") {
    throw new BoundResealInputError(`${field} must be a hex string`);
  }
  const hex = /^0x/i.test(value) ? value.slice(2) : value;
  if (hex.length !== bytes * 2 || !/^[0-9a-fA-F]*$/.test(hex)) {
    throw new BoundResealInputError(`${field} must be ${bytes} bytes of hex`);
  }
  const out = new Uint8Array(bytes);
  for (let i = 0; i < bytes; i++) {
    out[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function utf8(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

function lv(bytes: Uint8Array): Uint8Array {
  const out = new Uint8Array(4 + bytes.length);
  const len = bytes.length >>> 0;
  out[0] = (len >>> 24) & 0xff;
  out[1] = (len >>> 16) & 0xff;
  out[2] = (len >>> 8) & 0xff;
  out[3] = len & 0xff;
  out.set(bytes, 4);
  return out;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

export function bytesToHex(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) {
    s += bytes[i].toString(16).padStart(2, "0");
  }
  return s;
}

/** canonical(new_method), see the file header. */
export function canonicalMethodBytes(m: BoundResealMethod): Uint8Array {
  if (!m || typeof m !== "object") {
    throw new BoundResealInputError("newMethod must be an object");
  }
  if (m.kind === "oidc") {
    if (typeof m.iss !== "string" || m.iss.length === 0) {
      throw new BoundResealInputError("newMethod.iss must be a non-empty string");
    }
    if (typeof m.sub !== "string" || m.sub.length === 0) {
      throw new BoundResealInputError("newMethod.sub must be a non-empty string");
    }
    return concat([
      new Uint8Array([METHOD_TAG_OIDC]),
      lv(utf8(m.iss)),
      lv(utf8(m.sub)),
    ]);
  }
  if (m.kind === "passkey") {
    const credId = decodeStdB64(m.cred_id_b64, "newMethod.cred_id_b64");
    if (credId.length === 0) {
      throw new BoundResealInputError("newMethod.cred_id_b64 cannot be empty");
    }
    const cose = decodeStdB64(m.cose_pubkey_b64, "newMethod.cose_pubkey_b64");
    return concat([new Uint8Array([METHOD_TAG_PASSKEY]), lv(credId), lv(cose)]);
  }
  throw new BoundResealInputError('newMethod.kind must be "oidc" or "passkey"');
}

type Sha256 = (data: Uint8Array) => Promise<Uint8Array>;

/** SHA-256 via WebCrypto, falling back to Node's `crypto` module. */
export const sha256: Sha256 = async (data) => {
  const subtle: SubtleCrypto | undefined = (globalThis as any).crypto?.subtle;
  if (subtle && typeof subtle.digest === "function") {
    // Copy into a fresh ArrayBuffer-backed view (some engines reject
    // views over SharedArrayBuffer / offset views).
    const copy = new Uint8Array(data.length);
    copy.set(data);
    return new Uint8Array(await subtle.digest("SHA-256", copy));
  }
  const nodeCrypto = loadNodeCrypto();
  if (nodeCrypto) {
    return new Uint8Array(nodeCrypto.createHash("sha256").update(data).digest());
  }
  throw new Error(
    "No SHA-256 implementation available: this runtime has neither WebCrypto (crypto.subtle) nor Node's crypto module"
  );
};

function loadNodeCrypto():
  | { createHash: (alg: string) => { update(d: Uint8Array): any; digest(): Uint8Array } }
  | undefined {
  try {
    const proc = (globalThis as any).process;
    if (proc && typeof proc.getBuiltinModule === "function") {
      const m = proc.getBuiltinModule("crypto");
      if (m?.createHash) return m;
    }
  } catch {
    /* fall through */
  }
  try {
    // `module.require` instead of a bare `require("crypto")` so browser
    // bundlers do not try to resolve / polyfill Node's crypto.
    const mod = typeof module !== "undefined" ? (module as any) : undefined;
    if (mod && typeof mod.require === "function") {
      const m = mod.require("crypto");
      if (m?.createHash) return m;
    }
  } catch {
    /* fall through */
  }
  return undefined;
}

/**
 * Compute the bound reseal challenge.
 *
 * @throws BoundResealInputError if any input is malformed (the enclave would
 *         reject it too).
 */
export async function computeBoundResealChallenge(
  input: BoundResealChallengeInput
): Promise<BoundResealChallenge> {
  const owner = decodeHexExact(input.ownerAddress, 20, "ownerAddress");
  const nonce = decodeHexExact(input.serverNonceHex, 32, "serverNonceHex");
  const preimage = concat([
    utf8(RESEAL_DOMAIN_TAG),
    new Uint8Array([0x00]),
    owner,
    nonce,
    canonicalMethodBytes(input.newMethod),
  ]);
  const bytes = await sha256(preimage);
  return { bytes, hex: bytesToHex(bytes) };
}

/** What the consent proof for an add-method call must be over. */
export interface AddMethodConsentChallenge {
  /** 32-byte challenge, lowercase hex (no 0x). Pass to
   *  `PasskeyHelper.sign({ userOpHashHex })`. */
  challengeHex: string;
  /** "bound": the bound reseal challenge (current contract).
   *  "legacy": the raw server nonce, used only when the backend did not
   *  return `ownerAddress` (an older backend). */
  mode: "bound" | "legacy";
}

/**
 * Decide what an add-method consent proof must sign, given the response of
 * `POST /wallet/methods/challenge` and the method being added.
 *
 * Uses the bound challenge when the response carries `ownerAddress`;
 * otherwise falls back to the legacy behaviour (the raw nonce) and logs a
 * warning. The enclave accepts legacy proofs until the project enables
 * `require_bound_reseal`.
 */
export async function resolveAddMethodConsentChallenge(
  challenge: { challengeHex: string; ownerAddress?: string | null; boundChallengeHex?: string },
  newMethod: BoundResealMethod,
  logger: Pick<Console, "warn"> = console
): Promise<AddMethodConsentChallenge> {
  const nonceHex = String(challenge.challengeHex || "")
    .replace(/^0x/i, "")
    .toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(nonceHex)) {
    throw new BoundResealInputError(
      "challengeHex from /wallet/methods/challenge must be 32 bytes of hex"
    );
  }
  if (!challenge.ownerAddress) {
    logger.warn(
      "[rift] /wallet/methods/challenge returned no ownerAddress (older backend?). " +
        "Falling back to the legacy add-method proof over the raw nonce. " +
        "This stops working once the project enables require_bound_reseal."
    );
    return { challengeHex: nonceHex, mode: "legacy" };
  }
  const bound = await computeBoundResealChallenge({
    ownerAddress: challenge.ownerAddress,
    serverNonceHex: nonceHex,
    newMethod,
  });
  if (
    challenge.boundChallengeHex &&
    challenge.boundChallengeHex.toLowerCase() !== bound.hex
  ) {
    // The local value is authoritative (the enclave computes the same
    // thing); a mismatch means the server's helper disagrees.
    logger.warn(
      "[rift] server boundChallengeHex differs from the locally computed bound reseal challenge; using the local value."
    );
  }
  return { challengeHex: bound.hex, mode: "bound" };
}
