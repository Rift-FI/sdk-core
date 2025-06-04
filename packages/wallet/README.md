# @stratosphere-network/wallet

Official TypeScript SDK for **Stratosphere network wallet module** - A comprehensive multi-chain wallet and DeFi platform that enables seamless crypto transactions, AI-powered features, and cross-chain operations.

## 🌟 Features

- 🌐 **Multi-chain Support**: Arbitrum, Base, Optimism, Ethereum, BNB, Polygon, Lisk, Berachain
- 💸 **Gasless Transactions**: Execute transactions without paying gas fees
- 🔄 **DeFi Swaps**: Built-in token swapping across chains with best rates
- 💳 **Payment Links**: Create and manage crypto payment requests
- 🤖 **AI Integration**: Built-in AI conversation and chat capabilities
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

// Authenticate user
const authResponse = await sphere.auth.login({
  phoneNumber: "+1234567890",
  otpCode: "123456",
  externalId: "user@example.com", // use email,phone e.t.c as external ID
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
```

## 💳 Payment Links

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

// Share the link - users can pay without having your app
const paymentUrl = sphere.paymentLinks.getPaymentRedirectUrl(
  paymentRequest.data
);

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

```typescript
// Create a specific send link (for a particular recipient)
const specificSendLink = await sphere.paymentLinks.createSpecificSendLink({
  time: "1h", // Expiration time 1s,1m,1d,
  receiver: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45", // Specific recipient
  value: "50",
  token: "USDC",
  chain: "ARBITRUM",
});

// Create an open send link (anyone can claim)
const openSendLink = await sphere.paymentLinks.createOpenSendLink({
  time: "1h", // Expiration time 1s,1m,1d,
  value: "25",
  token: "USDC",
  chain: "BASE",
});

// Claim a specific send link
const claimSpecific = await sphere.paymentLinks.claimSpecificSendLink({
  id: "send-link-id",
  to: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45",
});

// Claim an open send link
const claimOpen = await sphere.paymentLinks.claimOpenSendLink({
  id: "send-link-id",
  to: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45",
});

// Get all your send links
const sendLinks = await sphere.paymentLinks.listSendLinks({
  fulfilled: "false",
  limit: "10",
  page: "1",
});

console.log("💸 Your send links:", sendLinks);

// Cancel a send link
await sphere.paymentLinks.cancelSendLink("send-link-url-id");
console.log("🔒 Send link cancelled");
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

## 🤖 AI Features

Integrate AI-powered crypto assistance:

```typescript
// Chat with AI about crypto/DeFi
const chatResponse = await sphere.ai.chat({
  secret: "your-openai-key",
  prompt: "Explain yield farming strategies for beginners",
});

console.log("🤖 AI Response:", chatResponse.response);

// Start a conversation with context
const conversation = await sphere.ai.conversation({
  accessToken: "shared-ai-access-token",
  user_prompt: "Help me understand DeFi risks",
  conversation_id: "conv_123",
  nonce: "unique_nonce",
});
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
sphere.transactions.getHistory(request); // Get transaction history
```

### 💳 Payment Links

```typescript
// Payment Requests (requesting money from others)
sphere.paymentLinks.requestPayment(request); // Create payment request
sphere.paymentLinks.payPaymentRequest(nonce); // Pay a payment request
sphere.paymentLinks.getPaymentRedirectUrl(nonce); // Get payment redirect URL
sphere.paymentLinks.listPaymentRequests(request?); // Get list of payment requests
sphere.paymentLinks.cancelPaymentRequest(nonce); // Cancel a payment request

// Send Links (sending money to others)
sphere.paymentLinks.createSpecificSendLink(request); // Create specific send link
sphere.paymentLinks.createOpenSendLink(request); // Create open send link
sphere.paymentLinks.claimSpecificSendLink(request); // Claim specific send link
sphere.paymentLinks.claimOpenSendLink(request); // Claim open send link
sphere.paymentLinks.listSendLinks(request?); // Get list of send links
sphere.paymentLinks.cancelSendLink(urlId); // Cancel a send link
```

### 🔄 DeFi Operations

```typescript
sphere.defi.swap(request); // Swap tokens across chains
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
