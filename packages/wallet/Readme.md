# @rift-finance/wallet

Official TypeScript SDK for Rift Finance — multi-chain wallets, gasless transactions, swaps, bridges, on/off-ramps, and payment links. Designed for server-side use (Node) and trusted runtimes (mobile, workers).

> Building a **browser** integration? Use [`@rift-finance/react`](https://www.npmjs.com/package/@rift-finance/react) or the [hosted widget](https://widget.riftfi.xyz) instead — they're purpose-built for untrusted environments.

## Install

```bash
npm install @rift-finance/wallet
```

## Quick start

```ts
import Rift, { Environment, isApprovalRequired } from "@rift-finance/wallet";

const rift = new Rift({
  apiKey: process.env.RIFT_API_KEY!,         // sk_… from the dashboard
  environment: Environment.PRODUCTION,
});

// 1) Sign the user in — choose one auth method.
const session = await rift.auth.login({
  email: "alice@example.com",
  otpCode: "123456",
});
// → { user, address, btcAddress, accessToken }
// The bearer token is now stored on the rift instance.

// 2) Use the API.
const balances = await rift.wallet.getChainBalance();

const tx = await rift.transactions.send({
  to: "0xRecipient...",
  value: "10",
  token: "USDC",
  chain: "ARBITRUM",
  type: "gasless",
});
// Server-side there is no passkey, so this returns an approval request
// (HTTP 202) instead of moving funds. Send the user to approvalUrl.
if (isApprovalRequired(tx)) {
  console.log(tx.approvalUrl); // https://app.riftfi.com/approve/<id>
}
```

> **SDK v4: passkey-owned wallets.** Every Rift wallet is a Safe smart account owned only by the user's passkeys. Rift's servers hold no key that can move funds. Fund-moving calls either carry a passkey proof (two-phase, in the browser) or return an approval request the user approves with a passkey. See [Passkey wallets](#passkey-wallets-v4) and [Upgrading from v3](#upgrading-from-v3).

## Authentication

Five ways to sign a user in. **Pick one** — passing combined credentials (e.g. both `email` and `externalId`) is rejected.

### Email / phone OTP

```ts
await rift.auth.sendOtp({ email: "alice@example.com" });

const session = await rift.auth.login({
  email: "alice@example.com",
  otpCode: "123456",
});
```

Phone works the same way with `phone` / `phoneNumber`.

### Email / phone sign-up (with OTP)

New email/phone users prove they control the identifier with an OTP. One code covers both sign-up and the first login:

```ts
// 1. Send a code to the email (or phone) being registered.
await rift.auth.sendOtp({ email: "alice@example.com" });

// 2. Sign up with the code the user received.
await rift.auth.signup({
  email: "alice@example.com",
  displayName: "Alice",
  otpCode: "123456",
});

// 3. Log in with the SAME code. Signup leaves a one-time proof valid for
//    10 minutes, so the code is accepted again here.
const session = await rift.auth.login({
  email: "alice@example.com",
  otpCode: "123456",
});
```

- Servers with `REQUIRE_SIGNUP_OTP=true` reject email/phone sign-ups without `otpCode` (400, `requiresOTP: true` on the thrown error). Servers with the flag off still verify the code when you send it, so always send it. The same code works in both modes.
- A code the user already checked with `rift.auth.verifyOtp(...)` is accepted by signup and login too.
- Phone: `sendOtp({ phone })`, then `signup({ phoneNumber, displayName, otpCode })` and `login({ phoneNumber, otpCode })`.
- External ID + password sign-ups don't need an OTP (see below).

Login responses include `walletStatus` (same object as `rift.wallet.status()`). If `walletStatus.needsPasskeySetup` is true, the user must register a passkey (`rift.passkeys.setup()`) before anything can be signed; signing routes answer `409 PASSKEY_SETUP_REQUIRED` until then.

### Google sign-in

```ts
const session = await rift.auth.loginWithGoogle({
  idToken: googleIdToken,
});
```

Pass the `id_token` your client got from Google Identity Services. The backend verifies the signature with Google, then either creates a wallet for the email or signs the existing user in.

> Once a user is bound to Google, OTP/password login is rejected for them — they keep using Google.

### Apple sign-in

```ts
const session = await rift.auth.loginWithApple({
  idToken: appleIdentityToken,
  displayName: "Alice",      // only used on the first sign-in
});
```

Apple only delivers email + name on the **first** sign-in. The durable identity is the stable Apple `sub` claim — pass it whenever you have it.

### External ID + password

```ts
await rift.auth.signup({
  externalId: "your-internal-uid",
  password: "...",
});

const session = await rift.auth.login({
  externalId: "your-internal-uid",
  password: "...",
});
```

### Logout & state

```ts
rift.auth.isAuthenticated();      // boolean
const me = await rift.auth.getUser();
rift.auth.logout();               // clears the bearer locally
```

### Updating the profile (email / phone changes need an OTP)

```ts
// Changing ONE of email / phone: send a code to the NEW value, pass otpCode.
await rift.auth.sendOtp({ email: "new@example.com" });
await rift.auth.updateUser({ email: "new@example.com", otpCode: "123456" });

// Changing BOTH at once: one code per new value.
await rift.auth.updateUser({
  email: "new@example.com",
  phoneNumber: "+254700000000",
  emailOtpCode: "111111",
  phoneOtpCode: "222222",
});

// Other fields need no OTP.
await rift.auth.updateUser({ displayName: "Alice B." });
```

## Persisting sessions

The SDK keeps the bearer in memory. Where you persist it across restarts depends on your runtime:

| Runtime | Where to store | Restore on next boot |
|---|---|---|
| Node server | Redis / DB row keyed by your user id | `rift.setBearerToken(token)` |
| React Native | `expo-secure-store` / Keychain | `rift.setBearerToken(token)` |
| CLI / scripts | OS keychain (e.g. `keytar`) | `rift.setBearerToken(token)` |

```ts
const stored = await redis.get(`rift:${userId}:token`);
if (stored) rift.setBearerToken(stored);
```

## Core APIs

### Wallet

```ts
await rift.wallet.getChainBalance({ chain: "ARBITRUM" });
await rift.wallet.getTokenBalance({ chain: "ARBITRUM", token: "USDC" });
```

### Transactions

```ts
// One-phase: returns the receipt, or an approval request (202) when the
// call carries no passkey proof (always the case server-side).
const res = await rift.transactions.send({
  to: "0x...",
  value: "10",
  token: "USDC",
  chain: "ARBITRUM",
  type: "gasless",
});

// Two-phase (browser): preview, sign with the passkey, submit.
const preview = await rift.transactions.previewSpend({ token: "USDC", chain: "ARBITRUM", recipient: "0x...", amount: "10" });
const authProof = await createPasskeyAuthProof(getHashToSign(preview), { rpId, allowCredentials: preview.allowCredentials });
await rift.signer.submitPreparedUserOp({ ticketId: preview.ticketId, authProof });

await rift.transactions.getHistory({ limit: 10, page: 1 });
await rift.transactions.getFee({ to: "0x...", value: "10", token: "USDC", chain: "ARBITRUM" });
```

### DeFi swaps

`rift.defi.swap()` is **deprecated**: `/v1/defi/swap` is no longer served. Build the swap calls (e.g. from a LiFi quote) and send them through `rift.signer.previewUserOp` + `submitPreparedUserOp`, or `rift.signer.sendTransaction` for an approval request.

### Off-ramps & on-ramps

```ts
// Cash out USDC → KES via M-Pesa, NGN bank, etc.
const quote = await rift.offramp.preview({
  amount: "100",
  token: "USDC",
  currency: "KES",
});

// On-ramp via M-Pesa STK push
await rift.onramp.initiateSafaricomSTK({
  amount: 100,                  // KES
  phone: "0713322025",
  cryptoAsset: "POL-USDC",
  cryptoWalletAddress: "0x...",
  externalReference: "user123",
});
```

### Payment links

```ts
// Request money
const req = await rift.paymentLinks.requestPayment({
  amount: 100, chain: "BASE", token: "USDC",
});

// Send money to a specific recipient
await rift.paymentLinks.createSpecificSendLink({
  time: "1h",
  recipientEmail: "bob@example.com",
  value: "50",
  token: "USDC",
  chain: "ARBITRUM",
  email: "alice@example.com",
  otpCode: "123456",
});

// Open link anyone can claim
await rift.paymentLinks.createOpenSendLink({
  time: "24h",
  value: "25",
  token: "USDC",
  chain: "BASE",
  email: "alice@example.com",
  otpCode: "123456",
});
```

### Signer (advanced)

Contract calls go through the user's Safe as ERC-4337 UserOperations; messages are signed by the Safe (ERC-1271, ERC-6492 when the Safe is not deployed on that chain yet).

```ts
// UserOperation: one-phase (approval request without a proof) ...
await rift.signer.sendTransaction({
  chain: "POLYGON",
  transactionData: { to: "0x...", value: "0", data: "0x..." },
});
// ... or two-phase
const p = await rift.signer.previewUserOp({ chain: "POLYGON", transactionData: { to: "0x...", data: "0x..." } });
const proof = await createPasskeyAuthProof(getHashToSign(p), { rpId, allowCredentials: p.allowCredentials });
await rift.signer.submitPreparedUserOp({ ticketId: p.ticketId, authProof: proof });

// Message (ERC-1271): two-phase, or signMessage() for an approval request
const m = await rift.signer.previewMessage({ chain: "BASE", message: "Hello" });
const { signature } = await rift.signer.submitMessage({
  ticketId: m.ticketId,
  authProof: await createPasskeyAuthProof(m.hashToSign, { rpId, allowCredentials: m.allowCredentials }),
});
```

`rift.signer.signTransaction()` (raw EOA transaction) was **removed**: there is no EOA key any more. It throws `{ status: 410, code: "EOA_SIGNING_REMOVED" }`.

For simple transfers, prefer `rift.transactions.send()`.

## Passkey wallets (v4)

### Setting up the first passkey (browser)

```ts
import { createPasskeyAuthProof } from "@rift-finance/wallet";

const status = await rift.wallet.status();
// { mode: "none" | "legacy" | "passkey", walletAddress, passkeyCount, chains, needsPasskeySetup }

if (status.needsPasskeySetup) {
  const res = await rift.passkeys.setup({ label: "iPhone" });
  // "active"               new user: passkey-native wallet created
  // "migrated"/"migrating" existing user: SAME address, now owned by the passkey
  // "new_wallet"           old key unrecoverable: fresh wallet, res.previousAddress is the legacy one
}
```

`setup()` runs `getRegistrationOptions()` → `registerPasskey()` → `register()`. `registerPasskey()` prompts twice: `navigator.credentials.create()` (**ES256 / alg -7 only**, resident key + user verification required), then `navigator.credentials.get()` by the NEW credential only, over the same options challenge. The second prompt is the **possession proof**; the backend refuses a registration without it (`400 PASSKEY_POSSESSION_REQUIRED`, or `400 INVALID_PASSKEY_SIGNATURE` if it doesn't verify against the attested key). You can call the steps yourself:

```ts
const options = await rift.passkeys.getRegistrationOptions();
const { attestation, possession } = await registerPasskey(options);
await rift.passkeys.register({ attestation, possession, label: "Laptop" });
```

### More passkeys (recovery) and removal

Adding or removing a passkey changes the Safe's owners on-chain, so an EXISTING passkey signs one ticket per deployed chain:

```ts
const sign = (t) => createPasskeyAuthProof(t.hashToSign, { rpId, allowCredentials: t.allowCredentials });

await rift.passkeys.setup({ label: "YubiKey", signWithExisting: sign }); // add
const list = await rift.passkeys.list();
await rift.passkeys.removeWithPasskey(list[1].id, sign);                // remove (never the last one: 409 LAST_PASSKEY)
```

Keep at least two passkeys (e.g. phone + laptop, or a security key) so losing one device doesn't lock the wallet. A synced passkey (iCloud Keychain, Google Password Manager) is one passkey across that account's devices.

### Signing: `createPasskeyAuthProof(hashToSign, { rpId, allowCredentials })`

Every preview (`previewSpend`, `previewTransfer`, `previewOrder`, `previewUserOp`, `previewMessage`, `walletConnect.previewRequest`, `approvals.preview`) returns `{ ticketId, hashToSign, allowCredentials, expiresAt }`. `createPasskeyAuthProof` runs `navigator.credentials.get` with the 32 hash bytes as challenge and `userVerification: "required"`, and returns the `authProof`:

```ts
{ kind: "passkey", cred_id_b64, client_data_json_b64, authenticator_data_b64, signature_b64 }
```

Google / Apple proofs (`kind: "oidc"`) are rejected for signing (`400 PASSKEY_REQUIRED`). They remain login methods. `OidcHelper` was removed.

### Approval requests (server-side, agents, partners)

Every one-phase fund-moving method (`transactions.send`, `signer.sendTransaction`, `signer.signMessage`, `bridge.execute`, `offramp.pay` / `createOrder`, `walletConnect.approveRequest`, `vault.*` writes) called without `ticketId` + `authProof` gets HTTP 202 and **returns** (doesn't throw):

```ts
{ status: "APPROVAL_REQUIRED", approvalId, approvalUrl, expiresAt, summary }
```

```ts
import { isApprovalRequired, assertNoApproval, ApprovalRequiredError } from "@rift-finance/wallet";

const res = await rift.bridge.execute({ sourceChain: "BASE", destinationChain: "POLYGON", token: "USDC", amount: "25" });
if (isApprovalRequired(res)) notifyUser(res.approvalUrl);

// Prefer exceptions? assertNoApproval(res) throws ApprovalRequiredError.

// Track it (API key alone is enough for the creating project):
const approval = await rift.approvals.get(res.approvalId);
// { status: "pending" | "approved" | "rejected" | "expired" | "failed", result?: { transactionHash, userOpHash } }
```

Your own UI can approve in place instead of sending the user to the Rift app:

```ts
const pending = await rift.approvals.list({ status: "pending" });
await rift.approvals.approveWithPasskey(pending[0].id, (p) =>
  createPasskeyAuthProof(p.hashToSign, { rpId, allowCredentials: p.allowCredentials }));
// or rift.approvals.reject(id)
```

Approvals expire after 30 minutes and are single use.

### Upgrading from v3

| v3 | v4 |
| --- | --- |
| `auth.migrateToV3`, `wallet.listMethods` / `addMethod*` | Deprecated; backend answers `410 REPLACED_BY_PASSKEY_WALLETS`. Use `rift.passkeys`. |
| `enrolledMethods` at signup / login | Ignored. Signup / login provision no key; check `walletStatus`. |
| `OidcHelper` (Google signing) | Removed. Google / Apple are login only. |
| `PasskeyHelper.sign` | Still works; prefer `createPasskeyAuthProof`. `PasskeyHelper.enrol` is deprecated. |
| `signer.signTransaction` | Removed server-side; throws `410 EOA_SIGNING_REMOVED`. |
| One-phase methods returning `T` | Return `MaybeApproval<T>` (`T` or `ApprovalRequiredResponse`). Check `isApprovalRequired`. |
| `defi.swap` | Deprecated (endpoint gone). |
| `password` / OTP on signing calls | Ignored for passkey wallets. |

### Adding an auth method to a v3 wallet (bound reseal): deprecated

> Deprecated in v4: the v3 envelope endpoints answer `410 REPLACED_BY_PASSKEY_WALLETS`. Add recovery passkeys with `rift.passkeys.setup({ signWithExisting })` instead. Kept for reference.

To add a passkey / Google / Apple method to a wallet that is already on v3, the user consents with a method the wallet ALREADY has. That consent must be over the **bound reseal challenge**, which ties it to this wallet and this exact new method:

```
SHA-256("rift-reseal-v1" || 0x00 || ownerAddress(20 bytes) || serverNonce(32 bytes) || canonical(newMethod))
```

The SDK computes it for you:

```ts
import { PasskeyHelper } from "@rift-finance/wallet";

// The new method (e.g. a second passkey on another device).
const { method: newMethod } = await PasskeyHelper.enrol({ rpId, rpName, userName });

// One call: challenge → bound consent → submit.
await rift.wallet.addMethodWithConsent({
  newMethod,
  sign: (challengeHex) =>
    PasskeyHelper.sign({ rpId, userOpHashHex: challengeHex, allowedCredentialIdB64: existingCredId }),
});
```

Or step by step:

```ts
const challenge = await rift.wallet.requestAddMethodChallenge({ newMethod });
// → { challengeHex, ownerAddress, ttlMs, expiresAtMs }

const authProof = await PasskeyHelper.signAddMethod({ rpId, challenge, newMethod });

await rift.wallet.addMethod({ authProof, newMethod });
```

- Passkey consent: the WebAuthn `challenge` is the 32 raw bytes. Google/Apple consent: the id_token `nonce` is their lowercase hex.
- Never sign `challengeHex` directly. If an older backend doesn't return `ownerAddress`, the SDK falls back to the legacy proof over the raw nonce and logs a warning. The enclave accepts that only until the project enables `require_bound_reseal`.
- The pure helper `computeBoundResealChallenge({ ownerAddress, serverNonceHex, newMethod })` returns `{ bytes, hex }`. It uses WebCrypto, with a Node `crypto` fallback.
- The challenge is single-use and lasts 5 minutes. These calls are never retried automatically.

### Loyalty redemptions

```ts
import { isLoyaltyRedeemPending } from "@rift-finance/wallet";

const result = await rift.loyalty.redeem({ points: 500 });
if (isLoyaltyRedeemPending(result)) {
  // HTTP 202, status PENDING_RECONCILIATION: the payout's on-chain outcome is
  // unknown and is being reconciled. Show "processing". Do NOT retry. Points
  // are restored automatically if the transfer didn't go through.
} else {
  // Completed: result.data.transactionHash
}
```

A pending result is returned, not thrown. A definite failure (e.g. 400 "Withdrawal failed", points refunded) is still thrown.

### User management (project owner only)

Suspend, unsuspend, status and lookup calls are authorised by the **project owner's bearer token**, sent with the project's API key. Log in as the project owner first (or `rift.setBearerToken(ownerToken)`):

```ts
await rift.auth.login({ email: "owner@yourco.com", otpCode: "123456" }); // the project owner

await rift.userManagement.suspendUser({ email: "user@example.com", reason: "Fraud" });
await rift.userManagement.unsuspendUser({ email: "user@example.com" });
await rift.userManagement.getSuspendedUsers();
await rift.userManagement.getUserStatus({ email: "user@example.com" });
```

`projectOwnerEmail` / `projectOwnerPhone` are **deprecated and ignored**: the backend no longer accepts them as proof of ownership. They are still in the types so existing code compiles, but the SDK never sends them. A call without the owner's token is rejected with 401/403.

## Supported networks

| Network | Chain ID | Native | Common tokens |
|---|---|---|---|
| Arbitrum | 42161 | ETH | USDC, USDT |
| Base | 8453 | ETH | USDC |
| Optimism | 10 | ETH | USDC, USDT |
| Ethereum | 1 | ETH | USDC, USDT |
| Polygon | 137 | MATIC | USDC, USDT |
| BNB Chain | 56 | BNB | USDT, USDC |
| Lisk | 1135 | LSK | USDC |
| Berachain | 80085 | BERA | WBERA, USDC |
| Celo | 42220 | CELO | cUSD |

## Error handling

The SDK throws structured errors with `status`, `message`, and (often) an `error` machine-code:

```ts
try {
  await rift.transactions.send({ /* ... */ });
} catch (e: any) {
  if (e.status === 401) /* re-auth */;
  else if (e.status === 429) /* back off + retry */;
  else if (e.message?.includes("insufficient")) /* show balance to user */;
  else throw e;
}
```

Things to know:

- **500s** carry no internal error text. They look like `{ message, requestId }`, and the SDK puts `requestId` on the thrown error. Quote it when you contact Rift support.
- **503 `parent-proxy overloaded`**: the signing path is shedding load. Back off before trying again, and only retry if the operation is safe to repeat.
- **429**: rate limit, or an OTP lockout after too many wrong codes. Wait before sending a new code.
- **`invalid credentials`**: every signing failure on a v1 (custodial) wallet now returns this one enclave message, whatever the cause. Don't branch on the old, more specific strings.
- **`requiresOTP: true`**: the call needs an OTP (e.g. email/phone signup on a server enforcing it).
- **Passkey wallet codes** (the SDK sets `code` and a readable `message`): `409 PASSKEY_SETUP_REQUIRED` (register a passkey first), `400 PASSKEY_REQUIRED` (OIDC proof sent for signing), `400 PASSKEY_POSSESSION_REQUIRED` (passkey registration without the possession assertion: use `registerPasskey()`), `400 INVALID_PASSKEY_SIGNATURE` (an authProof doesn't match the ticket, or the possession proof doesn't verify: preview / request options again), `410 EOA_SIGNING_REMOVED`, `410 REPLACED_BY_PASSKEY_WALLETS`, `409 LAST_PASSKEY`.
- **HTTP 202 `APPROVAL_REQUIRED`** is not an error: it is returned. See [Approval requests](#approval-requests-server-side-agents-partners).

**Retries.** `new Rift({ retries })` sets how many times the SDK retries a 5xx or network error (default 3). `retries: 0` now really disables retries. Earlier versions treated `0` as 3. Set it to `0` on any server that proxies non-idempotent calls (signup, send, pay): if a request succeeded but its response was lost, a retry can duplicate it or fail with 409. Fund-moving and signing calls (sends, bridge, off-ramp, user operations, message signing, WalletConnect approve, vault writes, submits, approvals, passkey writes), loyalty redeem and the add-method calls are never retried, whatever this is set to.

## Full docs

- **Integration walkthrough**: https://service.riftfi.xyz/docs
- **HTTP API explorer**: https://developers.riftfi.xyz
- **OpenAPI spec**: https://github.com/Rift-FI/Rift-Sdk-Wrapper/blob/main/docs.json
- **React bindings**: https://www.npmjs.com/package/@rift-finance/react
- **MCP server for AI assistants**: https://www.npmjs.com/package/@rift-finance/mcp-server

## License

MIT
