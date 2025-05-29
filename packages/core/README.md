# @stratosphere/core

The core StratoSphere SDK that orchestrates all modules and provides a unified interface for interacting with the StratoSphere platform.

## Installation

```bash
npm install @stratosphere/core
```

## Usage

```typescript
import StratoSphere from "@stratosphere/core";

const stratoSphere = new StratoSphere();

// Setup wallet module
stratoSphere.setupWallet({
  environment: "production",
  apiKey: "your-api-key",
});

// Access wallet functionality
const wallet = stratoSphere.getWallet();
if (wallet) {
  // Use wallet services
  await wallet.auth.login({ email: "user@example.com", password: "password" });
}
```

## Modules

- **Wallet Module**: Complete wallet functionality (`@stratosphere/wallet`)
- **Token Module**: Token management (coming soon)
- **Staking Module**: Staking operations (coming soon)
- **Dividends Module**: Dividend management (coming soon)
- **DEX Module**: Decentralized exchange features (coming soon)

## License

MIT
