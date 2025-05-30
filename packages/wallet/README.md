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
});

sphere.setBearerToken(authResponse.token);

// Get wallet balance across all chains
const balances = await sphere.wallet.getChainBalance();
console.log("💰 Wallet balances:", balances);

// Send gasless transaction (no gas fees!)
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

Create payment requests that anyone can pay:

```typescript
// Create a payment link
const paymentLink = await sphere.paymentLinks.createPaymentLink({
  amount: 100,
  chain: "BASE",
  token: "USDC",
});

console.log("💳 Payment link:", paymentLink.data);

// Share the link - users can pay without having your app
const paymentUrl = sphere.paymentLinks.getPaymentRedirectUrl(paymentLink.data);
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
  baseUrl: "https://custom-api-url.com", // Optional custom endpoint
  timeout: 30000, // Request timeout (default: 20s)
  retries: 3, // Retry attempts (default: 3)
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
sphere.paymentLinks.createPaymentLink(request); // Create payment request
sphere.paymentLinks.payPaymentLink(nonce); // Pay a payment link
sphere.paymentLinks.createSpecificAuthorization(req); // Create specific auth
sphere.paymentLinks.createAnonymousAuthorization(req); // Create anonymous auth
sphere.paymentLinks.claimSpecificPayment(request); // Claim specific payment
sphere.paymentLinks.claimAnonymousPayment(request); // Claim anonymous payment
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
