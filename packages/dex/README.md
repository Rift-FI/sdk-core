# @stratosphere-network/dex

A TypeScript SDK for interacting with Stratosphere Network's decentralized exchange (DEX) functionality. This package provides a simple and powerful interface for token swapping, liquidity management, and price estimation.

## Features

- 🔄 **Token Swapping** - Execute token swaps with optimal routing
- 💰 **Price Estimation** - Get accurate swap estimates with price impact analysis
- ✅ **Token Approval Management** - Check and manage token approvals
- 🛣️ **Smart Routing** - Automatically find the best trading routes across multiple pools
- 📊 **Price Impact Analysis** - Calculate and display price impact for trades
- 💸 **Fee Calculation** - Transparent trading fee calculations
- 🔗 **Multi-Pool Support** - Support for V2, V3, and Stable pools

## Installation

```bash
npm install @stratosphere-network/dex
```

## Quick Start

```typescript
import { Dex } from "@stratosphere-network/dex";
import { SupportedChain } from "@stratosphere-network/shared";
import { Wallet } from "ethers";

// Initialize the DEX client
const dex = new Dex({
  chain: SupportedChain.BERACHAIN_TESTNET,
  wallet: new Wallet("your-private-key"),
});

// Estimate a swap
const estimate = await dex.swap.estimateSwap(
  "0xTokenA...", // Token input address
  "0xTokenB...", // Token output address
  "100" // Amount to swap
);

console.log("Estimated output:", estimate.total);
console.log("Price impact:", estimate.price_impact);
console.log("Trading fee:", estimate.trading_fee);
```

## API Reference

### Dex Class

The main entry point for all DEX operations.

#### Constructor

```typescript
new Dex(config: Config)
```

**Parameters:**

- `config.chain`: Supported blockchain network
- `config.wallet`: Ethers.js Wallet instance

### SwapService

Access swap functionality through `dex.swap`.

#### estimateSwap(tokenIn, tokenOut, amount)

Estimates the output amount and fees for a token swap.

```typescript
const estimate = await dex.swap.estimateSwap(
  "0xTokenA...",
  "0xTokenB...",
  "100"
);
```

**Returns:** `EstimatedSwap`

- `price`: Exchange rate
- `total`: Expected output amount
- `trading_fee`: LP fees
- `price_impact`: Price impact percentage
- `routes`: Trading route path

#### checkApproval(tokenAddress)

Checks if a token is approved for trading.

```typescript
const isApproved = await dex.swap.checkApproval("0xToken...");
```

**Returns:** `boolean`

#### approve(tokenAddress, amount)

Approves a token for trading.

```typescript
const success = await dex.swap.approve("0xToken...", "100");
```

**Returns:** `boolean`

#### swap(tokenIn, tokenOut, amount)

Executes a token swap.

```typescript
const receipt = await dex.swap.swap("0xTokenA...", "0xTokenB...", "100");
```

**Returns:** `TransactionReceipt | null`

#### getToken(address)

Retrieves token information from the blockchain.

```typescript
const token = await dex.swap.getToken("0xToken...");
```

**Returns:** `Token` object with symbol, decimals, and name

## Examples

### Basic Token Swap

```typescript
import { Dex } from "@stratosphere-network/dex";
import { SupportedChain } from "@stratosphere-network/shared";
import { Wallet } from "ethers";

async function performSwap() {
  const dex = new Dex({
    chain: SupportedChain.BERACHAIN_TESTNET,
    wallet: new Wallet(process.env.PRIVATE_KEY!),
  });

  const tokenA = "0xfE5842861F6fF592A7715091AA50E428c1b5EE20";
  const tokenB = "0x74f745e05C40b0b5b7ea62f8EC11914be8dA18c6";
  const amount = "10";

  // 1. Estimate the swap
  const estimate = await dex.swap.estimateSwap(tokenA, tokenB, amount);
  console.log("Expected output:", estimate.total);
  console.log("Price impact:", estimate.price_impact, "%");

  // 2. Check and approve if needed
  const isApproved = await dex.swap.checkApproval(tokenA);
  if (!isApproved) {
    await dex.swap.approve(tokenA, amount);
    console.log("Token approved for trading");
  }

  // 3. Execute the swap
  const receipt = await dex.swap.swap(tokenA, tokenB, amount);
  console.log("Swap completed:", receipt?.hash);
}
```

### Price Impact Analysis

```typescript
async function analyzePriceImpact() {
  const estimate = await dex.swap.estimateSwap(tokenA, tokenB, amount);

  if (estimate.price_impact > 5) {
    console.warn("High price impact detected:", estimate.price_impact, "%");
    console.log("Consider reducing trade size or waiting for better liquidity");
  }

  console.log(
    "Route:",
    estimate.routes.map((token) => token.symbol).join(" → ")
  );
  console.log("LP Fee:", estimate.trading_fee);
}
```

## Error Handling

```typescript
try {
  const receipt = await dex.swap.swap(tokenA, tokenB, amount);
} catch (error) {
  if (error.message.includes("No trade found")) {
    console.error("No liquidity available for this trading pair");
  } else if (error.message.includes("insufficient allowance")) {
    console.error("Token not approved or insufficient allowance");
  } else {
    console.error("Swap failed:", error.message);
  }
}
```

## Supported Networks

- Berachain Testnet
- Additional networks coming soon

## Advanced Features

### Custom Slippage Tolerance

The SDK uses a default slippage tolerance of 1%. For custom slippage settings, the smart router can be configured with different parameters.

### Gas Optimization

The SDK automatically calculates optimal gas margins for transactions to ensure reliable execution while minimizing costs.

### Multi-Hop Routing

The smart router automatically finds the best path across multiple pools, supporting up to 10 hops and 10 splits for optimal price execution.

## Dependencies

- `@stratospherex/sdk`: Core Stratosphere SDK
- `@stratospherex/smart-router`: Smart routing functionality
- `viem`: Ethereum interaction library
- `ethers`: Ethereum wallet and provider utilities

## Contributing

Contributions are welcome! Please ensure all tests pass and follow the existing code style.

## License

MIT License - see LICENSE file for details.
