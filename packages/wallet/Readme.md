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

## Full docs

- **Integration walkthrough**: https://service.riftfi.xyz/docs
- **HTTP API explorer**: https://developers.riftfi.xyz
- **OpenAPI spec**: https://github.com/Rift-FI/Rift-Sdk-Wrapper/blob/main/docs.json
- **React bindings**: https://www.npmjs.com/package/@rift-finance/react
- **MCP server for AI assistants**: https://www.npmjs.com/package/@rift-finance/mcp-server

## License

MIT
