import * as nodeCrypto from "crypto";
import {
  Rift,
  Environment,
  isApprovalRequired,
  assertNoApproval,
  ApprovalRequiredError,
  getHashToSign,
  createPasskeyAuthProof,
  registerPasskey,
  base64ToBytes,
  bytesToBase64,
  hexToBytes,
  PASSKEY_ALG_ES256,
  PasskeyAuthProof,
} from "../src/index";

// ── fetch mock (same pattern as security-contract.test.ts) ──────────

type Call = { url: string; init: RequestInit };

function mockFetch(responses: Array<{ status: number; body: any }>) {
  const calls: Call[] = [];
  let i = 0;
  (globalThis as any).fetch = jest.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const r = responses[Math.min(i++, responses.length - 1)];
    return new Response(JSON.stringify(r.body), {
      status: r.status,
      headers: { "content-type": "application/json" },
    });
  });
  return calls;
}

const bodyOf = (c: Call) => (c.init.body ? JSON.parse(String(c.init.body)) : undefined);

const APPROVAL = {
  status: "APPROVAL_REQUIRED",
  approvalId: "apr_1",
  approvalUrl: "https://app.riftfi.com/approve/apr_1",
  expiresAt: "2026-11-08T12:30:00.000Z",
  summary: { opType: "transfer", token: "USDC", amount: "10", chain: "BASE" },
};

const HASH = "0x" + "ab".repeat(32);
const PROOF: PasskeyAuthProof = {
  kind: "passkey",
  cred_id_b64: "AQID",
  client_data_json_b64: "e30=",
  authenticator_data_b64: "AA==",
  signature_b64: "MEU=",
};

const realFetch = globalThis.fetch;
const newRift = (retries?: number) => {
  const rift = new Rift({
    environment: Environment.PRODUCTION,
    apiKey: "sk_test",
    baseUrl: "https://api.test",
    retries,
  });
  rift.setBearerToken("user-token");
  return rift;
};

afterEach(() => {
  (globalThis as any).fetch = realFetch;
});

// ── 202 APPROVAL_REQUIRED: returned, typed, never thrown ────────────

describe("one-phase fund-moving methods return the approval request on 202", () => {
  const cases: Array<[string, (r: Rift) => Promise<any>, string]> = [
    ["transactions.send", (r) => r.transactions.send({ to: "0x1", value: "10", token: "USDC", chain: "BASE" }), "/v1/transactions"],
    ["signer.sendTransaction", (r) => r.signer.sendTransaction({ chain: "BASE", transactionData: { to: "0x1" } }), "/v1/wallet/user-operations"],
    ["signer.signMessage", (r) => r.signer.signMessage({ chain: "BASE", message: "hi" }), "/v1/wallet/signatures/message"],
    ["bridge.execute", (r) => r.bridge.execute({ sourceChain: "BASE", destinationChain: "POLYGON", token: "USDC", amount: "5" }), "/v1/bridge/transfers"],
    ["offramp.createOrder", (r) => r.offramp.createOrder({ token: "USDC", amount: 5, currency: "KES", chain: "BASE", recipient: "{}" } as any), "/v1/offramps"],
    ["offramp.pay", (r) => r.offramp.pay({ token: "USDC", amount: 5, currency: "KES", chain: "BASE", recipient: "{}" } as any), "/v1/offramps"],
    ["walletConnect.approveRequest", (r) => r.walletConnect.approveRequest("wc1"), "/v1/wallet-connect/requests/wc1/approve"],
    ["vault.deposit", (r) => r.vault.deposit({ amount: "100" }), "/v1/vault/deposits"],
    ["vault.withdraw", (r) => r.vault.withdraw({ amount: "100" }), "/v1/vault/withdrawals"],
    ["vault.claimRewards", (r) => r.vault.claimRewards(), "/v1/vault/claims"],
    ["vault.cancelWithdrawal", (r) => r.vault.cancelWithdrawal(), "/v1/vault/withdrawals/pending"],
    ["vault.cancelClaim", (r) => r.vault.cancelClaim(), "/v1/vault/claims/pending"],
    ["defi.swap (deprecated)", (r) => r.defi.swap({ chain: "BASE", flow: "gasless", token_to_sell: "USDC", token_to_buy: "WETH", value: "1" }), "/v1/defi/swap"],
  ];

  test.each(cases)("%s", async (_name, call, path) => {
    const calls = mockFetch([{ status: 202, body: APPROVAL }]);
    const res = await call(newRift());
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://api.test" + path);
    expect((calls[0].init.headers as any).Authorization).toBe("Bearer user-token");
    expect(isApprovalRequired(res)).toBe(true);
    expect(res).toEqual(APPROVAL);
  });

  test.each(cases)("%s is never retried on 5xx, even with default retries", async (_name, call) => {
    const calls = mockFetch([{ status: 503, body: { error: "parent-proxy overloaded" } }]);
    await expect(call(newRift())).rejects.toMatchObject({ status: 503 });
    expect(calls).toHaveLength(1);
  });

  test("a normal 200 result is returned unchanged", async () => {
    mockFetch([{ status: 200, body: { message: "ok", transactionHash: "0xt" } }]);
    const res = await newRift().transactions.send({ to: "0x1", value: "1", token: "USDC", chain: "BASE" });
    expect(isApprovalRequired(res)).toBe(false);
    expect(assertNoApproval(res)).toEqual({ message: "ok", transactionHash: "0xt" });
  });

  test("assertNoApproval throws a typed ApprovalRequiredError", () => {
    try {
      assertNoApproval(APPROVAL as any);
      throw new Error("did not throw");
    } catch (e: any) {
      expect(e).toBeInstanceOf(ApprovalRequiredError);
      expect(e.approvalId).toBe("apr_1");
      expect(e.approvalUrl).toBe(APPROVAL.approvalUrl);
      expect(e.code).toBe("APPROVAL_REQUIRED");
    }
  });

  test("isApprovalRequired rejects lookalikes", () => {
    expect(isApprovalRequired(null)).toBe(false);
    expect(isApprovalRequired({ status: "APPROVAL_REQUIRED" })).toBe(false);
    expect(isApprovalRequired({ status: "PENDING", approvalId: "x" })).toBe(false);
  });
});

// ── submit with ticketId + authProof ─────────────────────────────────

describe("two-phase submit", () => {
  test("transactions.send forwards ticketId + passkey authProof", async () => {
    const calls = mockFetch([{ status: 200, body: { message: "ok", transactionHash: "0xt" } }]);
    await newRift().transactions.send({ to: "0x1", value: "1", token: "USDC", chain: "BASE", ticketId: "t1", authProof: PROOF });
    expect(bodyOf(calls[0])).toMatchObject({ ticketId: "t1", authProof: PROOF });
  });

  test("walletConnect.approveRequest sends no body without proof, and the proof when given", async () => {
    const calls = mockFetch([{ status: 202, body: APPROVAL }, { status: 200, body: { success: true } }]);
    const r = newRift();
    await r.walletConnect.approveRequest("wc1");
    await r.walletConnect.approveRequest("wc1", { ticketId: "t9", authProof: PROOF });
    expect(calls[0].init.body).toBeUndefined();
    expect(bodyOf(calls[1])).toEqual({ ticketId: "t9", authProof: PROOF });
  });

  test("walletConnect.previewRequest hits the preview route", async () => {
    const calls = mockFetch([{ status: 200, body: { ticketId: "t", hashToSign: HASH } }]);
    await newRift().walletConnect.previewRequest("wc1");
    expect(calls[0].url).toBe("https://api.test/v1/wallet-connect/requests/wc1/preview");
  });

  test("previewUserOp → submitPreparedUserOp", async () => {
    const calls = mockFetch([
      { status: 200, body: { success: true, ticketId: "t1", userOpHashHex: HASH, hashToSign: HASH, chainId: 8453, allowCredentials: ["AQID"], expiresAtMs: 1, ttlMs: 1, smartAccountAddress: "0xs" } },
      { status: 200, body: { success: true, status: "success", userOpHash: "0xu", transactionHash: "0xt", hash: "0xt" } },
    ]);
    const r = newRift();
    const preview = await r.signer.previewUserOp({ chain: "BASE", transactionData: { to: "0x1" } });
    expect(getHashToSign(preview)).toBe(HASH);
    const res = await r.signer.submitPreparedUserOp({ ticketId: preview.ticketId, authProof: PROOF });
    expect(res.transactionHash).toBe("0xt");
    expect(calls[1].url).toBe("https://api.test/v1/wallet/user-operations/submit-prepared");
    expect(bodyOf(calls[1])).toEqual({ ticketId: "t1", authProof: PROOF });
  });

  test("submitPreparedUserOp is never retried", async () => {
    const calls = mockFetch([{ status: 500, body: { message: "x" } }]);
    await expect(newRift().signer.submitPreparedUserOp({ ticketId: "t", authProof: PROOF })).rejects.toMatchObject({ status: 500 });
    expect(calls).toHaveLength(1);
  });

  test("previews are never retried", async () => {
    const calls = mockFetch([{ status: 500, body: { message: "x" } }]);
    const r = newRift();
    await expect(r.transactions.previewSpend({ token: "USDC", chain: "BASE", recipient: "0x1", amount: "1" })).rejects.toBeDefined();
    await expect(r.bridge.previewTransfer({ sourceChain: "BASE", destChain: "POLYGON", token: "USDC", amount: "1" })).rejects.toBeDefined();
    await expect(r.offramp.previewOrder({ token: "USDC", chain: "BASE", amount: "1", lpAddress: "0x1" })).rejects.toBeDefined();
    await expect(r.signer.previewUserOp({ chain: "BASE", transactionData: { to: "0x1" } })).rejects.toBeDefined();
    expect(calls).toHaveLength(4);
  });

  test("signer.previewMessage → submitMessage (ERC-1271)", async () => {
    const calls = mockFetch([
      { status: 200, body: { ticketId: "m1", hashToSign: HASH, chainId: 8453, expiresAt: "x" } },
      { status: 200, body: { signature: "0xsig" } },
    ]);
    const r = newRift();
    const p = await r.signer.previewMessage({ chain: "BASE", message: "hello" });
    const s = await r.signer.submitMessage({ ticketId: p.ticketId, authProof: PROOF });
    expect(s.signature).toBe("0xsig");
    expect(calls[0].url).toBe("https://api.test/v1/wallet/signatures/message/preview");
    expect(bodyOf(calls[0])).toEqual({ chain: "BASE", message: "hello" });
    expect(calls[1].url).toBe("https://api.test/v1/wallet/signatures/message");
  });

  test("getHashToSign accepts hashToSign, hash_to_sign and userOpHashHex", () => {
    expect(getHashToSign({ hashToSign: "0x1" })).toBe("0x1");
    expect(getHashToSign({ hash_to_sign: "0x2" })).toBe("0x2");
    expect(getHashToSign({ userOpHashHex: "0x3" })).toBe("0x3");
    expect(() => getHashToSign({})).toThrow();
  });
});

// ── removed / replaced endpoints surface clear errors ───────────────

describe("removed server signing", () => {
  test("signTransaction 410 → EOA_SIGNING_REMOVED with an explanation", async () => {
    const calls = mockFetch([{ status: 410, body: { error: "EOA_SIGNING_REMOVED" } }]);
    await expect(
      newRift().signer.signTransaction({ chain: "BASE", transactionData: { to: "0x1" } })
    ).rejects.toMatchObject({
      status: 410,
      code: "EOA_SIGNING_REMOVED",
      message: expect.stringContaining("sendTransaction"),
    });
    expect(calls).toHaveLength(1);
  });

  test("400 PASSKEY_REQUIRED gets a readable message", async () => {
    mockFetch([{ status: 400, body: { error: "PASSKEY_REQUIRED" } }]);
    await expect(
      newRift().transactions.send({ to: "0x1", value: "1", token: "USDC", chain: "BASE" })
    ).rejects.toMatchObject({ status: 400, code: "PASSKEY_REQUIRED", message: expect.stringContaining("login only") });
  });

  test("409 PASSKEY_SETUP_REQUIRED points at passkeys.setup()", async () => {
    mockFetch([{ status: 409, body: { error: "PASSKEY_SETUP_REQUIRED" } }]);
    await expect(
      newRift().bridge.execute({ sourceChain: "BASE", destinationChain: "POLYGON", token: "USDC", amount: "1" })
    ).rejects.toMatchObject({ status: 409, code: "PASSKEY_SETUP_REQUIRED", message: expect.stringContaining("passkeys.setup") });
  });

  test("migrateToV3 410 → REPLACED_BY_PASSKEY_WALLETS", async () => {
    mockFetch([{ status: 410, body: { error: "REPLACED_BY_PASSKEY_WALLETS", see: "/v1/wallet/passkeys" } }]);
    await expect(newRift().auth.migrateToV3({ enrolledMethods: [] })).rejects.toMatchObject({
      status: 410,
      code: "REPLACED_BY_PASSKEY_WALLETS",
    });
  });

  test("unrelated errors are passed through unchanged", async () => {
    mockFetch([{ status: 400, body: { error: "Insufficient balance" } }]);
    await expect(
      newRift().transactions.send({ to: "0x1", value: "1", token: "USDC", chain: "BASE" })
    ).rejects.toMatchObject({ status: 400, message: "Insufficient balance" });
  });
});

// ── wallet.status / passkeys / approvals services ───────────────────

describe("wallet.status", () => {
  test("GET /v1/wallet/status", async () => {
    const status = { mode: "legacy", walletAddress: "0xw", passkeyCount: 0, chains: [{ chainId: 8453, deployed: true, ownerMode: "legacy_eoa" }], needsPasskeySetup: true };
    const calls = mockFetch([{ status: 200, body: status }]);
    const res = await newRift().wallet.status();
    expect(res.needsPasskeySetup).toBe(true);
    expect(calls[0].url).toBe("https://api.test/v1/wallet/status");
    expect(calls[0].init.method).toBe("GET");
  });
});

describe("passkeys service", () => {
  test("routes, methods and bodies", async () => {
    const calls = mockFetch([{ status: 200, body: {} }]);
    const r = newRift();
    const attestation = { cred_id_b64: "AQ==", client_data_json_b64: "e30=", attestation_object_b64: "oA==" };
    const possession = { cred_id_b64: "AQ==", client_data_json_b64: "e30=", authenticator_data_b64: "AA==", signature_b64: "MA==" };
    await r.passkeys.getRegistrationOptions();
    await r.passkeys.register({ attestation, possession, label: "Phone" });
    await r.passkeys.confirm({ credentialId: "AQ==", signatures: [{ ticketId: "t", authProof: PROOF }] });
    await r.passkeys.list();
    await r.passkeys.remove("pk 1");
    await r.passkeys.confirmRemoval("pk1", { signatures: [] });
    expect(calls.map((c) => `${c.init.method} ${c.url.replace("https://api.test", "")}`)).toEqual([
      "POST /v1/wallet/passkeys/options",
      "POST /v1/wallet/passkeys",
      "POST /v1/wallet/passkeys/confirm",
      "GET /v1/wallet/passkeys",
      "DELETE /v1/wallet/passkeys/pk%201",
      "POST /v1/wallet/passkeys/pk1/confirm-removal",
    ]);
    expect(bodyOf(calls[1])).toEqual({ attestation, possession, label: "Phone" });
  });

  test("writes are never retried", async () => {
    const calls = mockFetch([{ status: 500, body: { message: "x" } }]);
    await expect(
      newRift().passkeys.register({
        attestation: { cred_id_b64: "", client_data_json_b64: "", attestation_object_b64: "" },
        possession: { cred_id_b64: "", client_data_json_b64: "", authenticator_data_b64: "", signature_b64: "" },
      })
    ).rejects.toBeDefined();
    expect(calls).toHaveLength(1);
  });

  test.each([
    ["PASSKEY_POSSESSION_REQUIRED", /possession proof/],
    ["INVALID_PASSKEY_SIGNATURE", /did not verify/],
  ])("register 400 %s gets a code and a readable message", async (code, msg) => {
    mockFetch([{ status: 400, body: { error: code } }]);
    await expect(
      newRift().passkeys.register({
        attestation: { cred_id_b64: "AQ==", client_data_json_b64: "e30=", attestation_object_b64: "oA==" },
        possession: { cred_id_b64: "AQ==", client_data_json_b64: "e30=", authenticator_data_b64: "AA==", signature_b64: "MA==" },
      })
    ).rejects.toMatchObject({ status: 400, code, message: expect.stringMatching(msg) });
  });

  test("removeWithPasskey signs every ticket, then confirms", async () => {
    const tickets = [
      { chainId: 8453, ticketId: "a", hashToSign: HASH },
      { chainId: 137, ticketId: "b", hashToSign: HASH },
    ];
    const calls = mockFetch([{ status: 200, body: { tickets } }, { status: 200, body: { status: "removed" } }]);
    const sign = jest.fn(async () => PROOF);
    const res = await newRift().passkeys.removeWithPasskey("pk1", sign);
    expect(res.status).toBe("removed");
    expect(sign).toHaveBeenCalledTimes(2);
    expect(bodyOf(calls[1])).toEqual({ signatures: [{ ticketId: "a", authProof: PROOF }, { ticketId: "b", authProof: PROOF }] });
  });
});

describe("approvals service", () => {
  test("get / list / preview / approve / reject", async () => {
    const calls = mockFetch([{ status: 200, body: {} }]);
    const r = newRift();
    await r.approvals.get("apr_1");
    await r.approvals.list({ status: "pending" });
    await r.approvals.preview("apr_1");
    await r.approvals.approve("apr_1", { ticketId: "t", authProof: PROOF });
    await r.approvals.reject("apr_1");
    expect(calls.map((c) => `${c.init.method} ${c.url.replace("https://api.test", "")}`)).toEqual([
      "GET /v1/approvals/apr_1",
      "GET /v1/approvals?status=pending",
      "POST /v1/approvals/apr_1/preview",
      "POST /v1/approvals/apr_1/approve",
      "POST /v1/approvals/apr_1/reject",
    ]);
    expect(bodyOf(calls[3])).toEqual({ ticketId: "t", authProof: PROOF });
  });

  test("approve is never retried", async () => {
    const calls = mockFetch([{ status: 502, body: { message: "bad gateway" } }]);
    await expect(newRift().approvals.approve("a", { ticketId: "t", authProof: PROOF })).rejects.toBeDefined();
    expect(calls).toHaveLength(1);
  });

  test("approveWithPasskey previews, signs hashToSign, approves", async () => {
    const preview = { ticketId: "t7", hashToSign: HASH, chainId: 8453, allowCredentials: ["AQID"], expiresAt: "x" };
    const calls = mockFetch([{ status: 200, body: preview }, { status: 200, body: { id: "a", status: "approved", result: { transactionHash: "0xt" } } }]);
    const sign = jest.fn(async () => PROOF);
    const res = await newRift().approvals.approveWithPasskey("a", sign);
    expect(sign).toHaveBeenCalledWith(preview);
    expect(res.result?.transactionHash).toBe("0xt");
    expect(bodyOf(calls[1])).toEqual({ ticketId: "t7", authProof: PROOF });
  });
});

// ── browser helpers with a software P-256 "virtual passkey" ─────────

const sha256 = (b: Uint8Array) => new Uint8Array(nodeCrypto.createHash("sha256").update(b).digest());
const b64url = (b: Uint8Array) => Buffer.from(b).toString("base64url");

/** COSE_Key (EC2, ES256, P-256) for an uncompressed point's x / y. */
function coseKey(x: Uint8Array, y: Uint8Array): Uint8Array {
  return new Uint8Array([0xa5, 0x01, 0x02, 0x03, 0x26, 0x20, 0x01, 0x21, 0x58, 0x20, ...x, 0x22, 0x58, 0x20, ...y]);
}

/** CBOR byte-string header for length n (n < 65536). */
function cborBytesHeader(n: number): number[] {
  if (n < 24) return [0x40 + n];
  if (n < 256) return [0x58, n];
  return [0x59, n >> 8, n & 0xff];
}

/** attestationObject { fmt: "none", attStmt: {}, authData } with attested credential data. */
function attestationObject(rpId: string, credId: Uint8Array, x: Uint8Array, y: Uint8Array): Uint8Array {
  const authData = new Uint8Array([
    ...sha256(new TextEncoder().encode(rpId)),
    0x45, // UP | UV | AT
    0, 0, 0, 0,
    ...new Uint8Array(16), // aaguid
    credId.length >> 8, credId.length & 0xff,
    ...credId,
    ...coseKey(x, y),
  ]);
  const text = (t: string) => [0x60 + t.length, ...new TextEncoder().encode(t)];
  return new Uint8Array([0xa3, ...text("fmt"), ...text("none"), ...text("attStmt"), 0xa0, ...text("authData"), ...cborBytesHeader(authData.length), ...authData]);
}

/**
 * Recover the attested P-256 public key from an attestationObject built by
 * `attestationObject()` (fixed layout: rpIdHash 32 | flags 1 | counter 4 |
 * aaguid 16 | credIdLen 2 | credId | COSE key with x at +10, y at +45).
 */
function attestedKey(attObjB64: string): nodeCrypto.KeyObject {
  const att = Buffer.from(attObjB64, "base64");
  const marker = Buffer.from("authData");
  const start = att.indexOf(marker) + marker.length;
  const hdr = att[start];
  const authData = att.subarray(start + (hdr === 0x58 ? 2 : hdr === 0x59 ? 3 : 1));
  const credLen = (authData[53] << 8) | authData[54];
  const cose = authData.subarray(55 + credLen);
  const x = cose.subarray(10, 42);
  const y = cose.subarray(45, 77);
  return nodeCrypto.createPublicKey({
    key: { kty: "EC", crv: "P-256", x: x.toString("base64url"), y: y.toString("base64url") },
    format: "jwk",
  });
}

/** Fake navigator.credentials backed by a node P-256 key. */
function installVirtualAuthenticator(rpId: string) {
  const { privateKey, publicKey } = nodeCrypto.generateKeyPairSync("ec", { namedCurve: "P-256" });
  const jwk = publicKey.export({ format: "jwk" }) as any;
  const pubX = new Uint8Array(Buffer.from(jwk.x, "base64url"));
  const pubY = new Uint8Array(Buffer.from(jwk.y, "base64url"));
  const credId = new Uint8Array(nodeCrypto.randomBytes(16));
  const getCalls: any[] = [];
  const seen: { get?: any; create?: any } = {};
  const credentials = {
    async get({ publicKey: opts }: any) {
      seen.get = opts;
      getCalls.push(opts);
      const clientData = new TextEncoder().encode(
        JSON.stringify({ type: "webauthn.get", challenge: b64url(new Uint8Array(opts.challenge)), origin: `https://${rpId}`, crossOrigin: false })
      );
      // rpIdHash(32) | flags (UP|UV) | signCount(4)
      const authData = new Uint8Array([...sha256(new TextEncoder().encode(rpId)), 0x05, 0, 0, 0, 1]);
      const signature = nodeCrypto.sign("sha256", Buffer.concat([authData, sha256(clientData)]), privateKey); // DER
      return {
        rawId: credId.buffer.slice(0),
        response: { clientDataJSON: clientData.buffer, authenticatorData: authData.buffer, signature: new Uint8Array(signature).buffer },
      };
    },
    async create({ publicKey: opts }: any) {
      seen.create = opts;
      const clientData = new TextEncoder().encode(
        JSON.stringify({ type: "webauthn.create", challenge: b64url(new Uint8Array(opts.challenge)), origin: `https://${rpId}` })
      );
      return {
        rawId: credId.buffer.slice(0),
        response: {
          clientDataJSON: clientData.buffer,
          attestationObject: attestationObject(rpId, credId, pubX, pubY).buffer,
          getPublicKeyAlgorithm: () => -7,
        },
      };
    },
  };
  const desc = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  Object.defineProperty(globalThis, "navigator", { value: { credentials }, configurable: true, writable: true });
  return {
    publicKey,
    credId,
    seen,
    getCalls,
    credentials,
    restore: () => {
      if (desc) Object.defineProperty(globalThis, "navigator", desc);
      else delete (globalThis as any).navigator;
    },
  };
}

describe("createPasskeyAuthProof", () => {
  test("produces a proof that verifies with P-256 and binds the challenge to hashToSign", async () => {
    const va = installVirtualAuthenticator("riftfi.com");
    try {
      const allow = bytesToBase64(va.credId);
      const proof = await createPasskeyAuthProof(HASH, { rpId: "riftfi.com", allowCredentials: [allow] });

      expect(proof.kind).toBe("passkey");
      expect(proof.cred_id_b64).toBe(allow);
      // options passed to WebAuthn
      expect(va.seen.get.userVerification).toBe("required");
      expect(va.seen.get.rpId).toBe("riftfi.com");
      expect(Array.from(new Uint8Array(va.seen.get.challenge))).toEqual(Array.from(hexToBytes(HASH)));
      expect(Array.from(va.seen.get.allowCredentials[0].id)).toEqual(Array.from(va.credId));

      // standard base64, and the challenge in clientDataJSON is the hash
      const clientData = Buffer.from(proof.client_data_json_b64, "base64");
      const parsed = JSON.parse(clientData.toString("utf8"));
      expect(parsed.type).toBe("webauthn.get");
      expect(Buffer.from(parsed.challenge, "base64url").toString("hex")).toBe(HASH.slice(2));

      // P-256 signature over authData || sha256(clientDataJSON) verifies
      const authData = Buffer.from(proof.authenticator_data_b64, "base64");
      const sig = Buffer.from(proof.signature_b64, "base64");
      const ok = nodeCrypto.verify("sha256", Buffer.concat([authData, sha256(clientData)]), va.publicKey, sig);
      expect(ok).toBe(true);
    } finally {
      va.restore();
    }
  });

  test("allowCredentials accepts base64url ids", async () => {
    const va = installVirtualAuthenticator("riftfi.com");
    try {
      await createPasskeyAuthProof(HASH, { allowCredentials: [b64url(va.credId)] });
      expect(Array.from(va.seen.get.allowCredentials[0].id)).toEqual(Array.from(va.credId));
      expect(va.seen.get.rpId).toBeUndefined();
    } finally {
      va.restore();
    }
  });

  test("rejects a hash that is not 32 bytes", async () => {
    const va = installVirtualAuthenticator("riftfi.com");
    try {
      await expect(createPasskeyAuthProof("0x1234")).rejects.toThrow(/32 bytes/);
    } finally {
      va.restore();
    }
  });

  test("throws a clear error without WebAuthn (server)", async () => {
    const desc = Object.getOwnPropertyDescriptor(globalThis, "navigator");
    Object.defineProperty(globalThis, "navigator", { value: undefined, configurable: true, writable: true });
    try {
      await expect(createPasskeyAuthProof(HASH)).rejects.toThrow(/approval request/);
    } finally {
      if (desc) Object.defineProperty(globalThis, "navigator", desc);
    }
  });
});

describe("registerPasskey", () => {
  const options = {
    challenge: b64url(new Uint8Array(32).fill(7)),
    rp: { id: "riftfi.com", name: "Rift" },
    user: { id: b64url(new Uint8Array([1, 2, 3])), name: "alice@example.com" },
    // A server that (wrongly) offers RS256 too must not leak into the ceremony.
    pubKeyCredParams: [{ type: "public-key" as const, alg: -7 }, { type: "public-key" as const, alg: -257 }],
    excludeCredentials: [{ id: "AQID" }],
  };

  test("ES256 only, resident key + UV required, attestation in standard base64", async () => {
    const va = installVirtualAuthenticator("riftfi.com");
    try {
      const { attestation: att } = await registerPasskey(options);
      const pk = va.seen.create;
      expect(pk.pubKeyCredParams).toEqual([{ type: "public-key", alg: PASSKEY_ALG_ES256 }]);
      expect(pk.authenticatorSelection).toMatchObject({ residentKey: "required", requireResidentKey: true, userVerification: "required" });
      expect(Array.from(new Uint8Array(pk.challenge))).toEqual(Array.from(new Uint8Array(32).fill(7)));
      expect(Array.from(pk.user.id)).toEqual([1, 2, 3]);
      expect(pk.user.displayName).toBe("alice@example.com");
      expect(Array.from(pk.excludeCredentials[0].id)).toEqual([1, 2, 3]);
      expect(att.cred_id_b64).toBe(bytesToBase64(va.credId));
      expect(base64ToBytes(att.attestation_object_b64)[0]).toBe(0xa3); // CBOR map(3)
      expect(JSON.parse(Buffer.from(att.client_data_json_b64, "base64").toString()).type).toBe("webauthn.create");
    } finally {
      va.restore();
    }
  });

  test("possession: get() by the NEW credential only, over the options challenge, UV required; verifies against the attested key", async () => {
    const va = installVirtualAuthenticator("riftfi.com");
    try {
      const { attestation, possession } = await registerPasskey(options);

      // create() then exactly one get()
      expect(va.getCalls).toHaveLength(1);
      const get = va.getCalls[0];
      expect(Array.from(new Uint8Array(get.challenge))).toEqual(Array.from(new Uint8Array(32).fill(7)));
      expect(get.allowCredentials).toHaveLength(1);
      expect(Array.from(get.allowCredentials[0].id)).toEqual(Array.from(va.credId));
      expect(get.userVerification).toBe("required");
      expect(get.rpId).toBe("riftfi.com");

      // same credential, challenge in clientDataJSON = options challenge
      expect(possession.cred_id_b64).toBe(attestation.cred_id_b64);
      const clientData = Buffer.from(possession.client_data_json_b64, "base64");
      const parsed = JSON.parse(clientData.toString("utf8"));
      expect(parsed.type).toBe("webauthn.get");
      expect(parsed.challenge).toBe(options.challenge);

      // DER signature over authData || sha256(clientDataJSON) verifies with
      // the P-256 key carried in the attestationObject
      const key = attestedKey(attestation.attestation_object_b64);
      const authData = Buffer.from(possession.authenticator_data_b64, "base64");
      const sig = Buffer.from(possession.signature_b64, "base64");
      expect(nodeCrypto.verify("sha256", Buffer.concat([authData, sha256(clientData)]), key, sig)).toBe(true);
      // and a different message does not
      expect(nodeCrypto.verify("sha256", Buffer.concat([authData, sha256(Buffer.from("x"))]), key, sig)).toBe(false);
    } finally {
      va.restore();
    }
  });

  test("refuses a possession assertion made by a different credential", async () => {
    const va = installVirtualAuthenticator("riftfi.com");
    const get = va.credentials.get;
    va.credentials.get = async (arg: any) => {
      const a: any = await get(arg);
      a.rawId = new Uint8Array([9, 9, 9]).buffer;
      return a;
    };
    try {
      await expect(registerPasskey(options)).rejects.toThrow(/different credential/);
    } finally {
      va.restore();
    }
  });

  test("refuses when the possession prompt is dismissed", async () => {
    const va = installVirtualAuthenticator("riftfi.com");
    va.credentials.get = async () => null as any;
    try {
      await expect(registerPasskey(options)).rejects.toThrow(/not registered/);
    } finally {
      va.restore();
    }
  });

  test("refuses a non-ES256 credential", async () => {
    const va = installVirtualAuthenticator("riftfi.com");
    const create = va.credentials.create;
    va.credentials.create = async (arg: any) => {
      const c: any = await create(arg);
      c.response.getPublicKeyAlgorithm = () => -257;
      return c;
    };
    try {
      await expect(registerPasskey(options)).rejects.toThrow(/ES256/);
    } finally {
      va.restore();
    }
  });

  test("passkeys.setup: options → create → register → sign tickets with existing passkey → confirm", async () => {
    const va = installVirtualAuthenticator("riftfi.com");
    const tickets = [{ chainId: 8453, ticketId: "t1", hashToSign: HASH, allowCredentials: ["AQID"] }];
    const calls = mockFetch([
      { status: 200, body: options },
      { status: 200, body: { status: "pending_signature", credentialId: "NEW", tickets } },
      { status: 200, body: { status: "active" } },
    ]);
    try {
      const sign = jest.fn(async (t: any) => createPasskeyAuthProof(t.hashToSign, { allowCredentials: t.allowCredentials }));
      const res = await newRift().passkeys.setup({ label: "Laptop", signWithExisting: sign });
      expect(res.status).toBe("active");
      expect(sign).toHaveBeenCalledTimes(1);
      expect(bodyOf(calls[1]).label).toBe("Laptop");
      const reg = bodyOf(calls[1]);
      expect(reg.possession.cred_id_b64).toBe(reg.attestation.cred_id_b64);
      expect(reg.possession.cred_id_b64).toBe(bytesToBase64(va.credId));
      expect(JSON.parse(Buffer.from(reg.possession.client_data_json_b64, "base64").toString()).challenge).toBe(options.challenge);
      const confirm = bodyOf(calls[2]);
      expect(confirm.credentialId).toBe("NEW");
      expect(confirm.signatures[0].ticketId).toBe("t1");
      expect(confirm.signatures[0].authProof.kind).toBe("passkey");
    } finally {
      va.restore();
    }
  });

  test("passkeys.setup for a legacy wallet returns the migration result", async () => {
    const va = installVirtualAuthenticator("riftfi.com");
    const migrated = { status: "migrated", walletAddress: "0xsame", chains: [{ chainId: 8453, status: "migrated", txHash: "0xm" }] };
    const calls = mockFetch([{ status: 200, body: options }, { status: 200, body: migrated }]);
    try {
      const res = await newRift().passkeys.setup();
      expect(res).toEqual(migrated);
      expect(calls).toHaveLength(2);
      expect(Object.keys(bodyOf(calls[1])).sort()).toEqual(["attestation", "possession"]);
    } finally {
      va.restore();
    }
  });
});
