# @stratosphere/wallet

The wallet module for StratoSphere SDK, providing comprehensive wallet functionality including authentication, transactions, payment links, DeFi operations, and more.

## Installation

```bash
npm install @stratosphere/wallet
```

## Usage

```typescript
import Sphere from "@stratosphere/wallet";

const sphere = new Sphere({
  environment: "production",
  apiKey: "your-api-key",
});

// Authenticate a user
const authResult = await sphere.auth.login({
  email: "user@example.com",
  password: "password",
});

// Set the bearer token for authenticated requests
sphere.setBearerToken(authResult.token);

// Create a wallet
const wallet = await sphere.wallet.createWallet({
  name: "My Wallet",
});
```

## Features

- **Authentication Service**: User login, registration, and token management
- **Wallet Service**: Create and manage wallets
- **Transaction Service**: Send and track transactions
- **Payment Links Service**: Create and manage payment links
- **DeFi Service**: Access DeFi functionality
- **Projects Service**: Manage projects
- **Events Service**: Real-time event handling

## License

MIT
