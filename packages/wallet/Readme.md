# @rift-finance/wallet

Official TypeScript SDK for Rift Finance — multi-chain wallets, gasless transactions, swaps, bridges, on/off-ramps, and payment links. Designed for server-side use (Node) and trusted runtimes (mobile, workers).

> Building a **browser** integration? Use [`@rift-finance/react`](https://www.npmjs.com/package/@rift-finance/react) or the [hosted widget](https://widget.riftfi.xyz) instead — they're purpose-built for untrusted environments.

## Install

```bash
npm install @rift-finance/wallet
```

## Quick start

```ts
import Rift, { Environment } from "@rift-finance/wallet";

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
  email: "alice@example.com",
  otpCode: "123456",  // step-up OTP for the tx itself
});
```

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
// Send tokens. `type: "gasless"` uses sponsored gas.
await rift.transactions.send({
  to: "0x...",
  value: "10",
  token: "USDC",
  chain: "ARBITRUM",
  type: "gasless",
  email: "alice@example.com",
  otpCode: "123456",       // re-auth for the transfer
});

await rift.transactions.getHistory({ limit: 10, page: 1 });
await rift.transactions.getFee({ to: "0x...", value: "10", token: "USDC", chain: "ARBITRUM" });
```

### DeFi swaps

```ts
await rift.defi.swap({
  chain: "ARBITRUM",
  flow: "gasless",
  token_to_sell: "USDC",
  token_to_buy: "ETH",
  value: "100",
});
```

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

For direct chain interaction (raw tx signing, contract calls, off-chain message signing):

```ts
await rift.signer.signMessage({ chain: "ETHEREUM", message: "Hello" });

await rift.signer.sendTransaction({
  chain: "POLYGON",
  transactionData: { to: "0x...", value: "0", data: "0x...", gasLimit: "65000" },
});
```

For most use cases, prefer `rift.transactions.send()` — it's higher-level and gasless.

### Adding an auth method to a v3 wallet (bound reseal)

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
// or: await OidcHelper.signAddMethod({ clientId, challenge, newMethod, buttonContainer });

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

**Retries.** `new Rift({ retries })` sets how many times the SDK retries a 5xx or network error (default 3). `retries: 0` now really disables retries. Earlier versions treated `0` as 3. Set it to `0` on any server that proxies non-idempotent calls (signup, send, pay): if a request succeeded but its response was lost, a retry can duplicate it or fail with 409. Loyalty redeem and the add-method calls are never retried, whatever this is set to.

## Full docs

- **Integration walkthrough**: https://service.riftfi.xyz/docs
- **HTTP API explorer**: https://developers.riftfi.xyz
- **OpenAPI spec**: https://github.com/Rift-FI/Rift-Sdk-Wrapper/blob/main/docs.json
- **React bindings**: https://www.npmjs.com/package/@rift-finance/react
- **MCP server for AI assistants**: https://www.npmjs.com/package/@rift-finance/mcp-server

## License

MIT
