# @stratosphere-network/wallet

Official TypeScript SDK for **Stratosphere network wallet module** - A comprehensive multi-chain wallet and DeFi platform that enables seamless crypto transactions, AI-powered features, and cross-chain operations.

## 🌟 Features

- 🌐 **Multi-chain Support**: Arbitrum, Base, Optimism, Ethereum, BNB, Polygon, Lisk, Berachain
- 💸 **Gasless Transactions**: Execute transactions without paying gas fees
- 🔄 **DeFi Swaps**: Built-in token swapping across chains with best rates
- 💳 **Payment Links**: Create and manage crypto payment requests with custom redirect URLs
- 📱 **M-Pesa Onramp**: Convert Kenyan Shillings to crypto via M-Pesa STK Push
- 🛠️ **Proxy Wallet**: Direct blockchain interaction with signing, transaction sending, and wallet management
- 🔐 **Secret Sharing**: Secure API key sharing marketplace
- 📊 **Portfolio Tracking**: Multi-chain balance and transaction history
- 🔒 **Enterprise Ready**: Production-grade security and reliability

## 📚 Documentation

- 📖 **[Complete Documentation](https://docs.sphere-id.com)**
- 🚀 **[Getting Started Guide](https://docs.sphere-id.com/getting-started)**
- 📋 **[API Reference](https://docs.sphere-id.com/api-reference)**
- 💡 **[Examples & Tutorials](https://docs.sphere-id.com/examples)**

## 🚀 Quick Start

### Installation

```bash
npm install @stratosphere-network/wallet
```

### Basic Usage

```typescript
import Sphere, { Environment } from "@stratosphere-network/wallet";

// Initialize the SDK
const sphere = new Sphere({
  apiKey: "your-api-key", // Get from https://docs.sphere-id.com
  environment: Environment.PRODUCTION,
});

// Authenticate user - Multiple authentication methods available (MUTUALLY EXCLUSIVE):

// Method 1: Phone + OTP ONLY (do NOT provide email or externalId)
const phoneAuth = await sphere.auth.login({
  phoneNumber: "+1234567890",
  otpCode: "123456",
});

// Method 2: Email + OTP ONLY (do NOT provide phone or externalId)
const emailAuth = await sphere.auth.login({
  email: "user@example.com",
  otpCode: "123456",
});

// Method 3: External ID + Password ONLY (do NOT provide phone or email)
const passwordAuth = await sphere.auth.login({
  externalId: "user@example.com",
  password: "your-secure-password",
});

//internally, the sphere instance is gonna be authenticated

// Get wallet balance across all chains
const balances = await sphere.wallet.getChainBalance();
console.log("💰 Wallet balances:", balances);

// Send  a transaction
const transaction = await sphere.transactions.send({
  to: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45",
  value: "10",
  token: "USDC",
  chain: "ARBITRUM",
  type: "gasless", // 🎉 Free transaction!
});

console.log("✅ Transaction sent:", transaction);

// Get transaction history with pagination
const history = await sphere.transactions.getHistory({
  limit: 10,
  page: 1,
  token: "USDC",
  chain: "ARBITRUM",
});

console.log("📈 Transaction history:", {
  transactions: history.transactions, // Array of TransactionHistory objects
  pagination: {
    total: history.pagination.total,
    pages: history.pagination.pages,
    currentPage: history.pagination.currentPage,
    perPage: history.pagination.perPage,
  },
});

// Each transaction in history.transactions contains:
// {
//   id: string,
//   userId: string,
//   transactionHash: string,
//   chain: string,
//   token: string,
//   currency?: string,
//   amount: number,
//   recipientAddress: string,
//   createdAt: string
// }

// 📱 M-Pesa Onramp: Convert KES to crypto (Kenya users)
// const mpesaOnramp = await sphere.onramp.initiateSafaricomSTK({
//   amount: 100, // 100 KES
//   phone: "0713322025",
//   cryptoAsset: "POL-USDC",
//   cryptoWalletAddress: "0x31DEBea3ba4101bb582dc31fDB3068bE686791b0",
//   externalReference: "user123",
// });
```

## 🔐 Authentication

Sphere SDK supports multiple authentication methods to accommodate different use cases.

### ⚠️ CRITICAL: Authentication Parameter Rules

**Authentication parameters are MUTUALLY EXCLUSIVE**:

- ❌ **NEVER** provide `phoneNumber` + `email` together
- ❌ **NEVER** provide `phoneNumber` + `externalId` together
- ❌ **NEVER** provide `email` + `externalId` together
- ❌ **NEVER** provide all three together

**Choose ONE authentication method per request:**

- 📱 Phone-based: Use `phoneNumber` + `otpCode` ONLY
- 📧 Email-based: Use `email` + `otpCode` ONLY
- 🔑 External ID: Use `externalId` + `password` ONLY

### User Registration

```typescript
// Method 1: Register with External ID + Password ONLY
// ⚠️ Do NOT provide phoneNumber or email when using externalId
const signupWithPassword = await sphere.auth.signup({
  externalId: "user@example.com", // Can be email, username, or any unique ID
  password: "secure-password",
  // phoneNumber: "+1234567890", // ❌ NEVER provide with externalId
  // email: "user@example.com", // ❌ NEVER provide with externalId
});

// Method 2: Register with Phone ONLY (OTP-based)
// ⚠️ Do NOT provide email or externalId when using phoneNumber
const signupWithPhone = await sphere.auth.signup({
  phoneNumber: "+1234567890",
  // email: "user@example.com", // ❌ NEVER provide with phoneNumber
  // externalId: "user123", // ❌ NEVER provide with phoneNumber
});

// Method 3: Register with Email ONLY (OTP-based)
// ⚠️ Do NOT provide phoneNumber or externalId when using email
const signupWithEmail = await sphere.auth.signup({
  email: "user@example.com",
  // phoneNumber: "+1234567890", // ❌ NEVER provide with email
  // externalId: "user123", // ❌ NEVER provide with email
});
```

### User Authentication

```typescript
// Method 1: Phone + OTP Login ONLY
// ⚠️ Do NOT provide email or externalId when using phoneNumber
// First, send OTP
await sphere.auth.sendOtp({ phone: "+1234567890" });
// Then login with OTP
const phoneLogin = await sphere.auth.login({
  phoneNumber: "+1234567890",
  otpCode: "123456",
  // externalId: "user@example.com", // ❌ NEVER provide with phoneNumber
  // email: "user@example.com", // ❌ NEVER provide with phoneNumber
});

// Method 2: Email + OTP Login ONLY
// ⚠️ Do NOT provide phoneNumber or externalId when using email
// Send OTP to email
await sphere.auth.sendOtp({ email: "user@example.com" });
// Login with email OTP
const emailLogin = await sphere.auth.login({
  email: "user@example.com",
  otpCode: "123456",
  // phoneNumber: "+1234567890", // ❌ NEVER provide with email
  // externalId: "user123", // ❌ NEVER provide with email
});

// Method 3: External ID + Password Login ONLY
// ⚠️ Do NOT provide phoneNumber or email when using externalId
const passwordLogin = await sphere.auth.login({
  externalId: "user@example.com",
  password: "secure-password",
  // phoneNumber: "+1234567890", // ❌ NEVER provide with externalId
  // email: "user@example.com", // ❌ NEVER provide with externalId
});

// Check authentication status
if (sphere.auth.isAuthenticated()) {
  console.log("✅ User is authenticated");

  // Get user details
  const user = await sphere.auth.getUser();
  console.log("👤 User info:", user);
}

// Logout
sphere.auth.logout();
```

### OTP Management

```typescript
// Send OTP to phone ONLY
// ⚠️ Do NOT provide email when using phone
await sphere.auth.sendOtp({
  phone: "+1234567890",
  // email: "user@example.com", // ❌ NEVER provide with phone
});

// Send OTP to email ONLY
// ⚠️ Do NOT provide phone when using email
await sphere.auth.sendOtp({
  email: "user@example.com",
  // phone: "+1234567890", // ❌ NEVER provide with email
});

// Verify OTP for phone ONLY
// ⚠️ Do NOT provide email when using phone
const verifyPhone = await sphere.auth.verifyOtp({
  phone: "+1234567890",
  code: "123456",
  // email: "user@example.com", // ❌ NEVER provide with phone
});

// Verify OTP for email ONLY
// ⚠️ Do NOT provide phone when using email
const verifyEmail = await sphere.auth.verifyOtp({
  email: "user@example.com",
  code: "123456",
  // phone: "+1234567890", // ❌ NEVER provide with email
});
```

### Account Deletion

```typescript
// Delete with External ID + Password ONLY
// ⚠️ Do NOT provide phoneNumber or email when using externalId
await sphere.auth.deleteUser({
  externalId: "user@example.com",
  password: "secure-password",
  // phoneNumber: "+1234567890", // ❌ NEVER provide with externalId
  // email: "user@example.com", // ❌ NEVER provide with externalId
});

// Delete with Phone + OTP ONLY
// ⚠️ Do NOT provide email or externalId when using phoneNumber
await sphere.auth.sendOtp({ phone: "+1234567890" });
await sphere.auth.deleteUser({
  phoneNumber: "+1234567890",
  otpCode: "123456",
  // email: "user@example.com", // ❌ NEVER provide with phoneNumber
  // externalId: "user123", // ❌ NEVER provide with phoneNumber
});

// Delete with Email + OTP ONLY
// ⚠️ Do NOT provide phoneNumber or externalId when using email
await sphere.auth.sendOtp({ email: "user@example.com" });
await sphere.auth.deleteUser({
  email: "user@example.com",
  otpCode: "123456",
  // phoneNumber: "+1234567890", // ❌ NEVER provide with email
  // externalId: "user123", // ❌ NEVER provide with email
});
```

## 💳 Payment Links

### Fetch Users for Payment Links

Before creating payment links or send links, you can fetch all users from your project to help with recipient selection. This is especially useful for building user-friendly interfaces where users can select recipients by their email, phone number, or external ID:

```typescript
// Fetch all users grouped by identifier type
const users = await sphere.paymentLinks.getAllUsers();

console.log("👥 Available users:", {
  byExternalId: users.externalId, // Array of external IDs
  byPhoneNumber: users.phoneNumber, // Array of phone numbers
  byEmail: users.email, // Array of email addresses
});

// Use for recipient selection in your UI
// - Show dropdown/search of available emails for send links
// - Auto-complete phone numbers when creating specific send links
// - Validate external IDs before creating payment requests
// - Build contact lists for easy recipient selection

// Example: Create send link to a user from the fetched list
if (users.email.length > 0) {
  const recipientEmail = users.email[0]; // First available email
  const sendLink = await sphere.paymentLinks.createSpecificSendLink({
    time: "1h",
    email: recipientEmail, // Use fetched email
    value: "50",
    token: "USDC",
    chain: "ARBITRUM",
  });
  console.log("💸 Send link created for:", recipientEmail);
}
```

### Payment Requests (Request money from others)

Create payment requests that anyone can pay:

```typescript
// Create a payment request
const paymentRequest = await sphere.paymentLinks.requestPayment({
  amount: 100,
  chain: "BASE",
  token: "USDC",
});

console.log("💳 Payment request:", paymentRequest.data);

// Someone pays your payment request
await sphere.paymentLinks.payPaymentRequest(paymentRequest.data);

// Get all your payment requests
const paymentRequests = await sphere.paymentLinks.listPaymentRequests({
  expired: "false",
  limit: "10",
  page: "1",
});

console.log("📋 Your payment requests:", paymentRequests);

// Cancel a payment request if needed
const cancelResult = await sphere.paymentLinks.cancelPaymentRequest(
  paymentRequest.data
);
console.log("❌ Payment request cancelled:", cancelResult);
```

### Send Links (Send money to others)

Create links to send money to specific or open recipients:

**Time Format**: Use number followed by time unit:

- `s` = seconds (e.g., `30s`)
- `m` = minutes (e.g., `5m`)
- `h` = hours (e.g., `2h`)
- `d` = days (e.g., `7d`)

```typescript
// Create a specific send link (for a particular recipient)
// You can specify recipient by username, phoneNumber, or email (mutually exclusive)

// Option 1: Send to username
const specificSendLinkUsername =
  await sphere.paymentLinks.createSpecificSendLink({
    time: "1h", // Expiration time: 1s, 1m, 1h, 1d
    username: "john_doe", // Recipient's username
    value: "50",
    token: "USDC",
    chain: "ARBITRUM",
  });

// Option 2: Send to phone number
const specificSendLinkPhone = await sphere.paymentLinks.createSpecificSendLink({
  time: "2h", // Expiration time: 1s, 1m, 1h, 1d
  phoneNumber: "+1234567890", // Recipient's phone number
  value: "75",
  token: "USDC",
  chain: "BASE",
});

// Option 3: Send to email
const specificSendLinkEmail = await sphere.paymentLinks.createSpecificSendLink({
  time: "24h", // Expiration time: 1s, 1m, 1h, 1d
  email: "recipient@example.com", // Recipient's email
  value: "100",
  token: "USDC",
  chain: "POLYGON",
});

// Create an open send link (anyone can claim)
const openSendLink = await sphere.paymentLinks.createOpenSendLink({
  time: "1h", // Expiration time: 1s, 1m, 1h, 1d
  value: "25",
  token: "USDC",
  chain: "BASE",
});

// Claim a specific send link (no recipient address needed)
const claimSpecific = await sphere.paymentLinks.claimSpecificSendLink({
  id: "send-link-id",
});

// Claim an open send link (no recipient address needed)
const claimOpen = await sphere.paymentLinks.claimOpenSendLink({
  id: "send-link-id",
});

// Get all your send links
const sendLinks = await sphere.paymentLinks.listSendLinks({
  fulfilled: "false", // "true" for claimed links, "false" for unclaimed
  limit: "10",
  page: "1",
});

console.log("💸 Your send links:", sendLinks);

// Cancel a send link
await sphere.paymentLinks.cancelSendLink("send-link-url-id");
console.log("🔒 Send link cancelled");
```

### Register Custom Redirect URLs

Configure custom redirect URLs for your payment links to provide seamless user experience. **Requires OTP verification for security and platform specification.**

```typescript
// Import Platform enum for type safety
import { Platform } from "@stratosphere-network/wallet";

// Step 1: Send OTP for verification (choose email OR phone)
// Option A: Send OTP to email
await sphere.auth.sendOtp({ email: "owner@yourapp.com" });

// Option B: Send OTP to phone
await sphere.auth.sendOtp({ phone: "+1234567890" });

// Step 2: Register redirect URL for payment requests with OTP and platform
// Users will be redirected to your app when they visit payment links

// Option A: Register with email + OTP for WEB platform
const requestRedirectEmail =
  await sphere.paymentLinks.registerRequestLinkRedirectUrl({
    url: "https://yourapp.com/pay", // Your payment handling URL
    email: "owner@yourapp.com", // Project owner's email
    otpCode: "123456", // OTP received via email
    platform: Platform.WEB, // Specify target platform: WEB, MOBILE, SERVER, or TELEGRAM
    project_api_key: "your-project-api-key", // Your project's API key
    // phone: "+1234567890", // ❌ NEVER provide with email
  });

// Option B: Register with phone + OTP for MOBILE platform
const requestRedirectPhone =
  await sphere.paymentLinks.registerRequestLinkRedirectUrl({
    url: "https://yourapp.com/pay", // Your payment handling URL
    phone: "+1234567890", // Project owner's phone
    otpCode: "123456", // OTP received via SMS
    platform: Platform.MOBILE, // Specify target platform: WEB, MOBILE, SERVER, or TELEGRAM
    project_api_key: "your-project-api-key", // Your project's API key
    // email: "owner@yourapp.com", // ❌ NEVER provide with phone
  });

console.log("🔗 Request redirect registered:", requestRedirectEmail);
// Response includes: { message, data: { url, project_api_key, createdAt, updatedAt, platform } }

// Step 3: Register redirect URL for send links with OTP and platform
// Users will be redirected to your app when they visit send links

// Option A: Register with email + OTP for TELEGRAM platform
const sendRedirectEmail = await sphere.paymentLinks.registerSendLinkRedirectUrl(
  {
    url: "https://t.me/yourbot?claim=", // Your Telegram bot claim URL
    email: "owner@yourapp.com", // Project owner's email
    otpCode: "123456", // OTP received via email
    platform: Platform.TELEGRAM, // Specify target platform: WEB, MOBILE, SERVER, or TELEGRAM
    project_api_key: "your-project-api-key", // Your project's API key
    // phone: "+1234567890", // ❌ NEVER provide with email
  }
);

// Option B: Register with phone + OTP for SERVER platform
const sendRedirectPhone = await sphere.paymentLinks.registerSendLinkRedirectUrl(
  {
    url: "https://api.yourapp.com/webhook/claim", // Your server webhook URL
    phone: "+1234567890", // Project owner's phone
    otpCode: "123456", // OTP received via SMS
    platform: Platform.SERVER, // Specify target platform: WEB, MOBILE, SERVER, or TELEGRAM
    project_api_key: "your-project-api-key", // Your project's API key
    // email: "owner@yourapp.com", // ❌ NEVER provide with phone
  }
);

console.log("🔗 Send redirect registered:", sendRedirectPhone);
// Response includes: { message, data: { url, project_api_key, createdAt, updatedAt, platform } }

// Platform-specific redirect examples:
// WEB: https://yourapp.com/pay?nonce=payment_nonce
// MOBILE: yourapp://pay?nonce=payment_nonce (deep link)
// TELEGRAM: https://t.me/yourbot?claim=send_link_id
// SERVER: https://api.yourapp.com/webhook/claim?id=send_link_id

// Available Platform Options:
// - Platform.WEB: Web applications and websites
// - Platform.MOBILE: Mobile applications (deep links)
// - Platform.TELEGRAM: Telegram bots and mini apps
// - Platform.SERVER: Server-to-server webhooks and APIs
```

### Get Current Redirect URLs

Retrieve the currently registered redirect URLs for your project:

```typescript
// Get current redirect URLs for your project
const redirectLinks = await sphere.paymentLinks.getRedirectLinks({
  project_api_key: "your-project-api-key",
});

console.log("🔗 Current redirect URLs:", {
  requestRedirectLink: redirectLinks.requestRedirectLink, // For payment requests
  sendLinkRedirect: redirectLinks.sendLinkRedirect, // For send links
});

// Each redirect link contains:
// {
//   url: string,
//   project_api_key: string,
//   createdAt: string,
//   updatedAt: string,
//   platform: Platform
// }

// Use this to check if redirect URLs are configured
if (redirectLinks.requestRedirectLink) {
  console.log("✅ Payment request redirect configured:", {
    url: redirectLinks.requestRedirectLink.url,
    platform: redirectLinks.requestRedirectLink.platform,
  });
} else {
  console.log("⚠️ No payment request redirect URL configured");
}

if (redirectLinks.sendLinkRedirect) {
  console.log("✅ Send link redirect configured:", {
    url: redirectLinks.sendLinkRedirect.url,
    platform: redirectLinks.sendLinkRedirect.platform,
  });
} else {
  console.log("⚠️ No send link redirect URL configured");
}
```

### Payment Links Error Handling

```typescript
try {
  // Creating payment requests or send links
  const paymentRequest = await sphere.paymentLinks.requestPayment({
    amount: 100,
    chain: "BASE",
    token: "USDC",
  });

  console.log("✅ Payment request created:", paymentRequest.data);
} catch (error) {
  if (error.error?.includes("Token not found")) {
    console.log("❌ Invalid token/chain combination");
    // Show supported combinations to user
  } else if (error.message?.includes("Invalid time format")) {
    console.log("⏰ Invalid time format for send link");
    console.log("💡 Use format: number + unit (1s, 5m, 2h, 30d)");
  } else if (error.status === 401) {
    console.log("🔐 Authentication required");
    // Redirect to login
  } else {
    console.log("💥 Payment link error:", error.message);
  }
}

try {
  // Claiming or paying payment links
  await sphere.paymentLinks.payPaymentRequest("payment-nonce");
  console.log("✅ Payment successful");
} catch (error) {
  if (error.message?.includes("Payment link not found")) {
    console.log("❌ Payment link not found or expired");
  } else if (error.message?.includes("already paid")) {
    console.log("⚠️ Payment link already paid");
  } else if (error.message?.includes("Unauthorized")) {
    console.log("🚫 Not authorized to pay this link");
  } else if (error.message?.includes("insufficient")) {
    console.log("💰 Insufficient balance for payment");
  } else {
    console.log("💥 Payment failed:", error.message);
  }
}
```

## 🛠️ Proxy Wallet

The Proxy Wallet service provides direct blockchain interaction capabilities for advanced users and integrations. It allows you to manage wallet instances, sign transactions, send transactions, and sign messages across multiple chains.

### Get Wallet Instance Information

Get comprehensive wallet details for any supported chain:

```typescript
// Get wallet instance details for a specific chain
const walletInfo = await sphere.proxyWallet.getWalletInstance({
  chain: "ETHEREUM",
});

console.log("🔐 Wallet Instance Info:", {
  address: walletInfo.address,
  publicKey: walletInfo.publicKey,
  chainInfo: {
    id: walletInfo.chain.id,
    name: walletInfo.chain.name,
    nativeToken: walletInfo.chain.nativeToken,
    supportedTokens: walletInfo.chain.tokens,
  },
  provider: {
    url: walletInfo.provider.url,
    chainId: walletInfo.provider.chainId,
    name: walletInfo.provider.name,
  },
  capabilities: {
    isWallet: walletInfo._isWallet,
    isSigner: walletInfo._isSigner,
    availableMethods: walletInfo.availableMethods,
  },
});

// Supported chains: ETHEREUM, ARBITRUM, BASE, OPTIMISM, BNB, POLYGON, LISK, BERACHAIN
```

### Sign Transactions

Sign transactions without broadcasting them to the network. Perfect for offline signing or when you need to review transactions before sending:

```typescript
// Basic ETH transfer signature
const signedEthTx = await sphere.proxyWallet.signTransaction({
  chain: "ETHEREUM",
  transactionData: {
    to: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45",
    value: "1000000000000000000", // 1 ETH in wei
    gasLimit: "21000",
    gasPrice: "20000000000", // 20 gwei
    nonce: 42,
  },
});

// EIP-1559 transaction with priority fees
const signedEIP1559Tx = await sphere.proxyWallet.signTransaction({
  chain: "ARBITRUM",
  transactionData: {
    to: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45",
    value: "500000000000000000", // 0.5 ETH
    gasLimit: "21000",
    maxFeePerGas: "30000000000", // 30 gwei
    maxPriorityFeePerGas: "2000000000", // 2 gwei
    type: 2, // EIP-1559 transaction
  },
});

// Contract interaction signature
const signedContractTx = await sphere.proxyWallet.signTransaction({
  chain: "BASE",
  transactionData: {
    to: "0xa0b86a33e6411c8f62a587c5c51e3f58a4d9b8d4", // Contract address
    value: "0",
    data: "0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b8d4c9db96c4b4db45000000000000000000000000000000000000000000000000000000000000007b", // ERC-20 transfer
    gasLimit: "60000",
  },
});

console.log("✍️ Signed Transaction:", {
  signedTransaction: signedEthTx.signedTransaction,
  txHash: signedEthTx.txHash,
  from: signedEthTx.from,
  originalTx: signedEthTx.originalTx,
});
```

### Send Transactions

Sign and broadcast transactions directly to the blockchain with automatic gas estimation:

```typescript
// Simple ETH transfer
const ethTransfer = await sphere.proxyWallet.sendTransaction({
  chain: "ARBITRUM",
  transactionData: {
    to: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45",
    value: "500000000000000000", // 0.5 ETH
    gasLimit: "21000", // Optional - will auto-estimate if not provided
  },
});

// Token transfer (ERC-20)
const tokenTransfer = await sphere.proxyWallet.sendTransaction({
  chain: "POLYGON",
  transactionData: {
    to: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", // USDC contract
    value: "0",
    data: "0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b8d4c9db96c4b4db45000000000000000000000000000000000000000000000000000000000000007b",
    gasLimit: "65000",
  },
});

// Contract interaction with automatic nonce
const contractCall = await sphere.proxyWallet.sendTransaction({
  chain: "BNB",
  transactionData: {
    to: "0xe9e7cea3dedca5984780bafc599bd69add087d56", // BUSD contract
    value: "0",
    data: "0x70a08231000000000000000000000000742d35cc6634c0532925a3b8d4c9db96c4b4db45", // balanceOf
    gasLimit: "50000",
    // nonce will be automatically determined
  },
});

console.log("🚀 Transaction Result:", {
  hash: ethTransfer.hash,
  from: ethTransfer.from,
  to: ethTransfer.to,
  value: ethTransfer.value,
  gasUsed: ethTransfer.gasLimit,
  confirmations: ethTransfer.confirmations,
  blockNumber: ethTransfer.blockNumber,
  blockHash: ethTransfer.blockHash,
  timestamp: ethTransfer.timestamp,
  rawTransaction: ethTransfer.raw,
});
```

### Sign Messages

Sign arbitrary messages for authentication, verification, or off-chain interactions:

```typescript
// Simple message signing
const messageSignature = await sphere.proxyWallet.signMessage({
  chain: "ETHEREUM",
  message: "Hello, Sphere Network! Timestamp: " + Date.now(),
});

// Login message signing
const loginSignature = await sphere.proxyWallet.signMessage({
  chain: "ARBITRUM",
  message: `Welcome to DApp!\n\nNonce: ${Date.now()}\nWallet: ${
    walletInfo.address
  }`,
});

// Structured data signing (personal_sign format)
const structuredSignature = await sphere.proxyWallet.signMessage({
  chain: "BASE",
  message: JSON.stringify({
    action: "transfer",
    amount: "100",
    token: "USDC",
    timestamp: Date.now(),
  }),
});

console.log("📝 Message Signature:", {
  originalMessage: messageSignature.message,
  signature: messageSignature.signature,
  signer: messageSignature.signer,
  messageHash: messageSignature.messageHash,
  recoveredAddress: messageSignature.recoveredAddress,
});

// Verify the signature
const isValidSignature =
  messageSignature.signer === messageSignature.recoveredAddress;
console.log("✅ Signature valid:", isValidSignature);

// Use signature for authentication
if (isValidSignature) {
  console.log(
    "🔐 Message successfully verified for address:",
    messageSignature.signer
  );
}
```

### Multi-Chain Usage Examples

```typescript
// Working with multiple chains in sequence
const chains = ["ETHEREUM", "ARBITRUM", "BASE", "POLYGON"];

for (const chain of chains) {
  // Get wallet info for each chain
  const walletInfo = await sphere.proxyWallet.getWalletInstance({ chain });
  console.log(`💳 ${chain} wallet:`, walletInfo.address);

  // Sign a message on each chain
  const signature = await sphere.proxyWallet.signMessage({
    chain,
    message: `Hello from ${chain} at ${Date.now()}`,
  });
  console.log(`✍️ ${chain} signature:`, signature.signature);
}

// Cross-chain transaction coordination
const arbitrumTx = await sphere.proxyWallet.sendTransaction({
  chain: "ARBITRUM",
  transactionData: {
    to: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45",
    value: "100000000000000000", // 0.1 ETH
  },
});

const baseTx = await sphere.proxyWallet.sendTransaction({
  chain: "BASE",
  transactionData: {
    to: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45",
    value: "100000000000000000", // 0.1 ETH
  },
});

console.log("🌉 Cross-chain transactions:", {
  arbitrum: arbitrumTx.hash,
  base: baseTx.hash,
});
```

### Error Handling

```typescript
try {
  const result = await sphere.proxyWallet.sendTransaction({
    chain: "ETHEREUM",
    transactionData: {
      to: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45",
      value: "1000000000000000000",
    },
  });
  console.log("✅ Transaction successful:", result.hash);
} catch (error) {
  if (error.message?.includes("insufficient funds")) {
    console.log("💰 Insufficient balance for transaction");
  } else if (error.message?.includes("gas")) {
    console.log("⛽ Gas estimation failed - check gas limits");
  } else if (error.error?.includes("unsupported chain")) {
    console.log("🌐 Chain not supported:", error.supportedChains);
  } else {
    console.log("💥 Transaction failed:", error);
  }
}
```

## 🔄 DeFi Swaps

Swap tokens across chains with best rates:

```typescript
// Swap USDC to ETH on Arbitrum (gasless!)
const swapResult = await sphere.defi.swap({
  chain: "ARBITRUM",
  flow: "gasless",
  token_to_sell: "USDC",
  token_to_buy: "ETH",
  value: "100",
});

console.log("🔄 Swap completed:", swapResult);
```

## 📱 M-Pesa Onramp

Convert Kenyan Shillings (KES) to crypto using M-Pesa mobile money. Sphere provides seamless integration with Safaricom's M-Pesa STK Push for instant crypto onramping.

### Supported Crypto Assets

- **POL-USDC** - USDC on Polygon
- **BERA-USDC** - USDC on Berachain
- **ETH** - Ethereum
- **WBERA** - Wrapped BERA on Berachain

### Initiate M-Pesa STK Push

Start a crypto purchase by triggering an STK push to the user's phone:

```typescript
// Initiate M-Pesa STK push for crypto onramping
const stkResponse = await sphere.onramp.initiateSafaricomSTK({
  email: "user@example.com", // Optional
  amount: 100, // Amount in KES
  phone: "0713322025", // User's M-Pesa phone number
  cryptoAsset: "POL-USDC", // Crypto to receive
  cryptoWalletAddress: "0x31DEBea3ba4101bb582dc31fDB3068bE686791b0",
  externalReference: "user123", // Unique identifier (Telegram ID, user ID, etc.)
});

console.log("📱 STK Push initiated:", stkResponse);

Response structure:
{
  "success": true,
  "message": "STK Push initiated successfully. Check your phone.",
  "data": {
    "message": "STK Push initiated successfully.",
    "merchantRequestID": "ed4e-4482-896f-139740cf342c4176666",
    "checkoutRequestID": "ws_CO_05062025134410304713322025",
    "safaricomResponse": { ... },
    "cryptoIntent": {
      "asset": "POL-USDC",
      "walletAddress": "0x31DEBea3ba4101bb582dc31fDB3068bE686791b0"
    },
    "note": "Upon successful payment, POL-USDC will be sent to wallet"
  }
}
```

### Check Transaction Status

Monitor the status of M-Pesa transactions and crypto transfers:

```typescript
// Check transaction status by checkout request ID
const status = await sphere.onramp.getSafaricomTransactionStatus({
  checkoutRequestId: "ws_CO_05062025134410304713322025",
});

// Or check by merchant request ID
const statusByMerchant = await sphere.onramp.getSafaricomTransactionStatus({
  merchantRequestId: "ed4e-4482-896f-139740cf342c4176666",
});

console.log("📊 Transaction status:", status);

Response for successful transaction:
{
  "success": true,
  "status": "success",
  "data": {
    "id": "f11306df-473e-4487-9e73-6c821e475558",
    "status": "success",
    "amount": 100,
    "currency": "KES",
    "phoneNumber": "254713322025",
    "mpesaReceiptNumber": "TF53L3KG7L",
    "cryptoStatus": "success",
    "cryptoTxHash": "0xf9c9805a6f8fb783d928fa0a686ad8a3a6b191804a9d8a1865bd34f136af0b66",
    "cryptoAmount": 0.735294,
    "amountInUSD": 0.735294,
    "transactionDate": "20250605102014",
    "createdAt": "2025-06-05T07:19:59.534Z"
  }
}
```

### Auto-Poll Transaction Status

Automatically check transaction status until completion:

```typescript
// Auto-poll using checkout request ID (recommended)
const finalStatus = await sphere.onramp.pollSafaricomTransactionStatus(
  "ws_CO_05062025134410304713322025", // checkoutRequestId
  undefined, // merchantId (not needed)
  10, // maxAttempts (default: 10)
  10000 // intervalMs - poll every 10 seconds (default: 10000)
);

// Auto-poll using merchant request ID
const finalStatusByMerchant =
  await sphere.onramp.pollSafaricomTransactionStatus(
    undefined, // checkoutRequestId (not needed)
    "ed4e-4482-896f-139740cf342c4176666", // merchantId
    15, // Try up to 15 times
    5000 // Poll every 5 seconds
  );

// Handle the result
if (finalStatus.status === "success") {
  console.log("🎉 Payment successful!");
  console.log("💰 Crypto amount:", finalStatus.data.cryptoAmount);
  console.log("🔗 Crypto TX hash:", finalStatus.data.cryptoTxHash);
  console.log("📱 M-Pesa receipt:", finalStatus.data.mpesaReceiptNumber);
} else if (finalStatus.status === "failed") {
  console.log("❌ Payment failed:", finalStatus.data.failureReason);
} else {
  console.log("⏳ Payment still pending");
}
```

### Complete M-Pesa Flow Example

Here's a complete example showing the entire onramp process:

```typescript
async function completeMpesaOnramp() {
  try {
    // Step 1: Initiate STK push
    console.log("📱 Initiating M-Pesa STK push...");
    const stkResponse = await sphere.onramp.initiateSafaricomSTK({
      amount: 500, // 500 KES
      phone: "0713322025",
      cryptoAsset: "POL-USDC",
      cryptoWalletAddress: "0x31DEBea3ba4101bb582dc31fDB3068bE686791b0",
      externalReference: "telegram_user_12345",
    });

    if (!stkResponse.success) {
      throw new Error("Failed to initiate STK push");
    }

    console.log("✅ STK push sent to phone");
    const checkoutRequestId = stkResponse.data.checkoutRequestID;

    // Step 2: Poll for completion
    console.log("⏳ Waiting for M-Pesa payment...");
    const result = await sphere.onramp.pollSafaricomTransactionStatus(
      checkoutRequestId,
      undefined,
      20, // Wait up to 20 attempts
      15000 // Check every 15 seconds
    );

    // Step 3: Handle result
    switch (result.status) {
      case "success":
        console.log("🎉 Onramp successful!");
        console.log(
          `💰 Received: ${result.data.cryptoAmount} ${result.data.cryptoIntent.asset}`
        );
        console.log(`🔗 TX Hash: ${result.data.cryptoTxHash}`);
        console.log(`📱 M-Pesa Receipt: ${result.data.mpesaReceiptNumber}`);
        break;

      case "failed":
        console.log("❌ Onramp failed");
        console.log(`💔 Reason: ${result.data.failureReason}`);
        if (result.data.cryptoFailureReason) {
          console.log(`🔗 Crypto error: ${result.data.cryptoFailureReason}`);
        }
        break;

      case "pending":
        console.log("⏳ Transaction still pending after maximum wait time");
        console.log("💡 You can continue checking status manually");
        break;
    }

    return result;
  } catch (error) {
    console.error("💥 M-Pesa onramp error:", error);
    throw error;
  }
}

// Use the complete flow
completeMpesaOnramp()
  .then((result) => console.log("🏁 Onramp completed:", result.status))
  .catch((error) => console.error("🚨 Onramp failed:", error.message));
```

### Error Handling for M-Pesa

```typescript
try {
  const stkResponse = await sphere.onramp.initiateSafaricomSTK({
    amount: 100,
    phone: "0713322025",
    cryptoAsset: "POL-USDC",
    cryptoWalletAddress: "0x31DEBea3ba4101bb582dc31fDB3068bE686791b0",
    externalReference: "user123",
  });
} catch (error) {
  if (error.status === 400) {
    console.log("❌ Invalid request parameters:", error.message);
    // Check phone number format, amount limits, etc.
  } else if (error.status === 429) {
    console.log("⏰ Rate limited - too many requests");
    // Implement retry with backoff
  } else if (error.status === 500) {
    console.log("🔧 M-Pesa service temporarily unavailable");
    // Show maintenance message
  } else {
    console.log("💥 Unexpected error:", error);
  }
}
```

## 🌐 Supported Networks

| Network   | Chain ID | Native Token | Status  |
| --------- | -------- | ------------ | ------- |
| Arbitrum  | 42161    | ETH          | ✅ Live |
| Base      | 8453     | ETH          | ✅ Live |
| Optimism  | 10       | ETH          | ✅ Live |
| Ethereum  | 1        | ETH          | ✅ Live |
| BNB Chain | 56       | BNB          | ✅ Live |
| Polygon   | 137      | MATIC        | ✅ Live |
| Lisk      | 1135     | LSK          | ✅ Live |
| Berachain | 80085    | BERA         | ✅ Live |

## 💰 Supported Tokens

- **Stablecoins**: USDC, USDT, USDC.e
- **Major Cryptos**: ETH, BTC, WBERA
- **Native Tokens**: LSK, BNB, MATIC
- **And many more...**

## 🔧 Advanced Configuration

```typescript
const sphere = new Sphere({
  apiKey: "your-api-key",
  environment: Environment.PRODUCTION,
});
```

## 📋 Complete API Reference

### 🔐 Authentication

```typescript
sphere.auth.signup(request); // Create new account
sphere.auth.login(request); // Login with phone/OTP
sphere.auth.sendOtp(request); // Send OTP code
sphere.auth.verifyOtp(request); // Verify OTP
sphere.auth.getUser(); // Get current user info
sphere.auth.deleteUser(request); // Delete user account
```

### 💼 Wallet Management

```typescript
sphere.wallet.getTokenBalance(request); // Get specific token balance
sphere.wallet.getChainBalance(request); // Get all balances on chain
```

### 💸 Transactions

```typescript
sphere.transactions.send(request); // Send crypto transaction
sphere.transactions.getHistory(request?); // Get paginated transaction history with TransactionHistory objects
sphere.transactions.getFee(request); // Get transaction fee estimate
```

### 💳 Payment Links

```typescript
// User Management
sphere.paymentLinks.getAllUsers(); // Fetch all users grouped by identifier type (externalId, phoneNumber, email)

// Payment Requests (requesting money from others)
sphere.paymentLinks.requestPayment(request); // Create payment request
sphere.paymentLinks.payPaymentRequest(nonce); // Pay a payment request
sphere.paymentLinks.listPaymentRequests(request?); // Get list of payment requests
sphere.paymentLinks.cancelPaymentRequest(nonce); // Cancel a payment request

// Send Links (sending money to others)
sphere.paymentLinks.createSpecificSendLink(request); // Create specific send link (username/phone/email)
sphere.paymentLinks.createOpenSendLink(request); // Create open send link
sphere.paymentLinks.claimSpecificSendLink(request); // Claim specific send link (id only)
sphere.paymentLinks.claimOpenSendLink(request); // Claim open send link (id only)
sphere.paymentLinks.listSendLinks(request?); // Get list of send links
sphere.paymentLinks.cancelSendLink(urlId); // Cancel a send link

// Redirect URL Registration (requires OTP verification + platform specification + project API key)
sphere.paymentLinks.registerRequestLinkRedirectUrl(request); // Register payment request redirect URL (email/phone + OTP + platform + project_api_key)
sphere.paymentLinks.registerSendLinkRedirectUrl(request); // Register send link redirect URL (email/phone + OTP + platform + project_api_key)
sphere.paymentLinks.getRedirectLinks(request); // Get current redirect URLs for project (requires project_api_key)
```

### 🛠️ Proxy Wallet

```typescript
sphere.proxyWallet.getWalletInstance(request); // Get wallet instance info for chain
sphere.proxyWallet.signTransaction(request); // Sign transaction without broadcasting
sphere.proxyWallet.sendTransaction(request); // Sign and broadcast transaction
sphere.proxyWallet.signMessage(request); // Sign arbitrary message for verification
```

### 🔄 DeFi Operations

```typescript
sphere.defi.swap(request); // Swap tokens across chains
```

### 📱 M-Pesa Onramp

```typescript
// STK Push Initiation
sphere.onramp.initiateSafaricomSTK(request); // Initiate M-Pesa STK push

// Transaction Status
sphere.onramp.getSafaricomTransactionStatus(request); // Get transaction status
sphere.onramp.pollSafaricomTransactionStatus(checkoutId?, merchantId?, maxAttempts?, intervalMs?); // Auto-poll status

// Transaction History
sphere.onramp.getUserTransactionHistory(filters?); // Get user's onramp history
```

## 🚨 Error Handling

```typescript
try {
  const result = await sphere.transactions.send(request);
  console.log("✅ Success:", result);
} catch (error) {
  if (error.status === 401) {
    console.log("🔐 Authentication required");
    // Redirect to login
  } else if (error.status === 400) {
    console.log("❌ Bad request:", error.message);
    // Show user-friendly error
  } else if (error.status === 429) {
    console.log("⏰ Rate limited, please try again later");
    // Implement retry logic
  } else {
    console.log("💥 Unexpected error:", error);
    // Log for debugging
  }
}
```

## 🔗 Useful Links

- 🌐 **[Sphere Network Website](https://sphere-id.com)**
- 📖 **[Complete Documentation](https://docs.sphere-id.com)**
- 🎮 **[Interactive Playground](https://docs.sphere-id.com/playground)**
- 💬 **[Discord Community](https://discord.gg/sphere)**
- 🐛 **[GitHub Issues](https://github.com/stratosphere-network/sphere-sdk/issues)**
- 📧 **[Support Email](mailto:support@sphere-id.com)**
- 🐦 **[Twitter Updates](https://twitter.com/sphere_network)**

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/stratosphere-network/sphere-sdk/blob/main/CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](https://github.com/stratosphere-network/sphere-sdk/blob/main/LICENSE) file for details.

## 🆘 Support

Need help? We're here for you:

- 📖 Check our [Documentation](https://docs.sphere-id.com)
- 💬 Join our [Discord](https://discord.gg/sphere)
- 📧 Email us at [support@sphere-id.com](mailto:support@sphere-id.com)
- 🐛 Report bugs on [GitHub](https://github.com/stratosphere-network/sphere-sdk/issues)

---

<div align="center">

**Built with ❤️ by the Sphere Network Team**

[Website](https://sphere-id.com) • [Docs](https://docs.sphere-id.com) • [Discord](https://discord.gg/sphere) • [Twitter](https://twitter.com/sphere_network)

</div>
