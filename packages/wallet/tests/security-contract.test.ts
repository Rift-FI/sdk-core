import {
  Rift,
  Environment,
  computeBoundResealChallenge,
  canonicalMethodBytes,
  resolveAddMethodConsentChallenge,
  BoundResealInputError,
  isLoyaltyRedeemPending,
} from "../src/index";

const OWNER = "00112233445566778899aabbccddeeff00112233";
const NONCE = "ab".repeat(32);
const OIDC = { kind: "oidc" as const, iss: "https://accounts.google.com", sub: "1234567890" };
// cred_id = 01020304, cose = a50102 (base64 of the raw bytes)
const PASSKEY = { kind: "passkey" as const, cred_id_b64: "AQIDBA==", cose_pubkey_b64: "pQEC" };
const OIDC_VECTOR = "377f6d645f6d470848bad62021c2c318e7da4ad82139f00f05b18a6ac43355cb";
const PASSKEY_VECTOR = "5b812e4547e39fba673c5e3b9f30a68f0e454c89e8ba179e240afc0365c4dadd";

describe("computeBoundResealChallenge (spec test vectors)", () => {
  test("OIDC vector", async () => {
    const r = await computeBoundResealChallenge({
      ownerAddress: OWNER,
      serverNonceHex: NONCE,
      newMethod: OIDC,
    });
    expect(r.hex).toBe(OIDC_VECTOR);
    expect(r.bytes).toBeInstanceOf(Uint8Array);
    expect(r.bytes.length).toBe(32);
  });

  test("Passkey vector", async () => {
    const r = await computeBoundResealChallenge({
      ownerAddress: OWNER,
      serverNonceHex: NONCE,
      newMethod: PASSKEY,
    });
    expect(r.hex).toBe(PASSKEY_VECTOR);
  });

  test("accepts 0x-prefixed / mixed-case owner and nonce; ignores extra fields", async () => {
    const r = await computeBoundResealChallenge({
      ownerAddress: "0x" + OWNER.toUpperCase(),
      serverNonceHex: "0x" + NONCE.toUpperCase(),
      newMethod: { ...OIDC, email: "a@b.c" },
    });
    expect(r.hex).toBe(OIDC_VECTOR);
  });

  test("Node crypto fallback gives the same vectors when WebCrypto is absent", async () => {
    const desc = Object.getOwnPropertyDescriptor(globalThis, "crypto");
    Object.defineProperty(globalThis, "crypto", { value: undefined, configurable: true, writable: true });
    try {
      expect((globalThis as any).crypto).toBeUndefined();
      const a = await computeBoundResealChallenge({ ownerAddress: OWNER, serverNonceHex: NONCE, newMethod: OIDC });
      const b = await computeBoundResealChallenge({ ownerAddress: OWNER, serverNonceHex: NONCE, newMethod: PASSKEY });
      expect(a.hex).toBe(OIDC_VECTOR);
      expect(b.hex).toBe(PASSKEY_VECTOR);
    } finally {
      if (desc) Object.defineProperty(globalThis, "crypto", desc);
    }
  });

  test("canonical passkey encoding", () => {
    expect(Array.from(canonicalMethodBytes(PASSKEY))).toEqual([
      0x02, 0, 0, 0, 4, 1, 2, 3, 4, 0, 0, 0, 3, 0xa5, 0x01, 0x02,
    ]);
  });

  test("rejects malformed inputs the enclave would reject", async () => {
    const bad = [
      { ownerAddress: "0x1234", serverNonceHex: NONCE, newMethod: OIDC },
      { ownerAddress: OWNER, serverNonceHex: "ab", newMethod: OIDC },
      { ownerAddress: OWNER, serverNonceHex: NONCE, newMethod: { ...PASSKEY, cred_id_b64: "AQIDBA" } }, // unpadded
      { ownerAddress: OWNER, serverNonceHex: NONCE, newMethod: { ...PASSKEY, cred_id_b64: "AQIDBA-_" } }, // url-safe
      { ownerAddress: OWNER, serverNonceHex: NONCE, newMethod: { ...PASSKEY, cose_pubkey_b64: "pQF=" } }, // non-canonical
      { ownerAddress: OWNER, serverNonceHex: NONCE, newMethod: { ...PASSKEY, cred_id_b64: "" } },
      { ownerAddress: OWNER, serverNonceHex: NONCE, newMethod: { ...OIDC, sub: "" } },
    ];
    for (const input of bad) {
      await expect(computeBoundResealChallenge(input as any)).rejects.toBeInstanceOf(BoundResealInputError);
    }
  });
});

describe("resolveAddMethodConsentChallenge", () => {
  test("uses the bound challenge when ownerAddress is present", async () => {
    const warn = jest.fn();
    const r = await resolveAddMethodConsentChallenge(
      { challengeHex: NONCE, ownerAddress: "0x" + OWNER },
      PASSKEY,
      { warn }
    );
    expect(r).toEqual({ challengeHex: PASSKEY_VECTOR, mode: "bound" });
    expect(warn).not.toHaveBeenCalled();
  });

  test("falls back to the raw nonce with a warning when ownerAddress is missing", async () => {
    for (const ownerAddress of [undefined, null]) {
      const warn = jest.fn();
      const r = await resolveAddMethodConsentChallenge({ challengeHex: NONCE, ownerAddress }, OIDC, { warn });
      expect(r).toEqual({ challengeHex: NONCE, mode: "legacy" });
      expect(warn).toHaveBeenCalledTimes(1);
    }
  });

  test("prefers the local value if the server's boundChallengeHex disagrees", async () => {
    const warn = jest.fn();
    const r = await resolveAddMethodConsentChallenge(
      { challengeHex: NONCE, ownerAddress: OWNER, boundChallengeHex: "00".repeat(32) },
      OIDC,
      { warn }
    );
    expect(r.challengeHex).toBe(OIDC_VECTOR);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

// ── HTTP-level behaviour (fetch mocked) ─────────────────────────────

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

const headerOf = (c: Call, name: string) => (c.init.headers as Record<string, string>)[name];

describe("SDK request contracts", () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    (globalThis as any).fetch = realFetch;
  });

  const newRift = (retries?: number) =>
    new Rift({ environment: Environment.PRODUCTION, apiKey: "sk_test", baseUrl: "https://api.test", retries });

  test("user management sends the owner's bearer token and strips projectOwner* fields", async () => {
    const calls = mockFetch([{ status: 200, body: { success: true } }]);
    const rift = newRift(0);
    rift.setBearerToken("owner-token");

    await rift.userManagement.suspendUser({
      email: "victim@example.com",
      reason: "fraud",
      projectOwnerEmail: "owner@example.com",
    });
    await rift.userManagement.getSuspendedUsers({ projectOwnerPhone: "+254700000000" });
    await rift.userManagement.getUserStatus({ email: "victim@example.com" });
    await rift.userManagement.unsuspendUser({ userId: "u1", projectOwnerPhone: "+1" });

    expect(calls).toHaveLength(4);
    for (const c of calls) {
      expect(headerOf(c, "Authorization")).toBe("Bearer owner-token");
      expect(headerOf(c, "X-API-Key")).toBe("sk_test");
      expect(c.url).not.toMatch(/projectOwner/);
      if (c.init.body) expect(String(c.init.body)).not.toMatch(/projectOwner/);
    }
    expect(JSON.parse(String(calls[0].init.body))).toEqual({ email: "victim@example.com", reason: "fraud" });
    expect(calls[1].url).toBe("https://api.test/v1/users/suspended");
  });

  test("signup forwards otpCode", async () => {
    const calls = mockFetch([{ status: 201, body: { message: "ok", userId: "u1" } }]);
    await newRift(0).auth.signup({ email: "a@b.c", displayName: "A", otpCode: "123456" });
    expect(JSON.parse(String(calls[0].init.body))).toEqual({ email: "a@b.c", displayName: "A", otpCode: "123456" });
  });

  test("updateUser forwards otpCode / emailOtpCode / phoneOtpCode", async () => {
    const calls = mockFetch([{ status: 200, body: {} }]);
    await newRift(0).auth.updateUser({ email: "n@b.c", phoneNumber: "+1", emailOtpCode: "1", phoneOtpCode: "2" });
    expect(JSON.parse(String(calls[0].init.body))).toMatchObject({ emailOtpCode: "1", phoneOtpCode: "2" });
  });

  test("loyalty redeem 202 PENDING_RECONCILIATION is a typed pending result, not an error", async () => {
    const body = {
      success: false,
      error: "Withdrawal status could not be confirmed",
      message: "Your withdrawal is being verified. Do not retry",
      data: { redemptionId: "r1", pointsRedeemed: 100, status: "PENDING_RECONCILIATION", pointsRefunded: false },
    };
    const calls = mockFetch([{ status: 202, body }]);
    const result = await newRift().loyalty.redeem({ points: 100 });
    expect(calls).toHaveLength(1);
    expect(result.pending).toBe(true);
    expect(isLoyaltyRedeemPending(result)).toBe(true);
    if (isLoyaltyRedeemPending(result)) expect(result.data.redemptionId).toBe("r1");
  });

  test("loyalty redeem is never retried, even on 5xx with default retries", async () => {
    const calls = mockFetch([{ status: 503, body: { error: "parent-proxy overloaded" } }]);
    await expect(newRift().loyalty.redeem({ points: 1 })).rejects.toMatchObject({
      status: 503,
      message: "parent-proxy overloaded",
    });
    expect(calls).toHaveLength(1);
  });

  test("retries: 0 disables retries (previously coerced to 3)", async () => {
    const calls = mockFetch([{ status: 500, body: { message: "Internal server error", requestId: "req-1" } }]);
    await expect(newRift(0).wallet.getChainBalance()).rejects.toMatchObject({ status: 500, requestId: "req-1" });
    expect(calls).toHaveLength(1);
  });

  test("addMethodWithConsent signs the bound challenge and posts the proof", async () => {
    const calls = mockFetch([
      { status: 200, body: { challengeHex: NONCE, ttlMs: 300000, expiresAtMs: 1, ownerAddress: "0x" + OWNER } },
      { status: 200, body: { ok: true, ownerAddress: "0x" + OWNER, addedKind: "oidc" } },
    ]);
    const rift = newRift(0);
    rift.setBearerToken("user-token");
    const sign = jest.fn(async (_hex: string) => ({ kind: "oidc" as const, id_token: "jwt" }));
    const res = await rift.wallet.addMethodWithConsent({ newMethod: OIDC, sign });
    expect(res.ok).toBe(true);
    expect(sign.mock.calls[0][0]).toBe(OIDC_VECTOR);
    expect(calls[0].url).toBe("https://api.test/wallet/methods/challenge");
    expect(calls[1].url).toBe("https://api.test/wallet/methods");
    expect(JSON.parse(String(calls[1].init.body))).toEqual({
      authProof: { kind: "oidc", id_token: "jwt" },
      newMethod: OIDC,
    });
  });

  test("addMethodWithConsent falls back to the raw nonce on an older backend", async () => {
    mockFetch([
      { status: 200, body: { challengeHex: NONCE, ttlMs: 300000, expiresAtMs: 1 } },
      { status: 200, body: { ok: true, ownerAddress: "0x" + OWNER, addedKind: "passkey" } },
    ]);
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const sign = jest.fn(async (_hex: string) => ({ kind: "oidc" as const, id_token: "jwt" }));
      await newRift(0).wallet.addMethodWithConsent({ newMethod: PASSKEY, sign });
      expect(sign.mock.calls[0][0]).toBe(NONCE);
      expect(warn).toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });
});
