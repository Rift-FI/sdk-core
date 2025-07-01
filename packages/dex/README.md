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
- 💦 **Liquidity Provision** - Add liquidity to PancakeSwap V3 pools

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

### LiquidityService

Access liquidity functionality through `dex.liquidity`.

#### estimateAddLiquidity(params)

Estimates adding liquidity to a pool.

```typescript
const estimate = await dex.liquidity.estimateAddLiquidity({
  tokenA: "0xTokenA...",
  tokenB: "0xTokenB...",
  amountA: "100",
  amountB: "200"
});
```

**Parameters:**
- `params.tokenA`: Address of the first token
- `params.tokenB`: Address of the second token
- `params.amountA`: Amount of the first token
- `params.amountB`: Amount of the second token

**Returns:** `EstimatedLiquidity`
- `poolAddress`: Address of the pool (or "Pool will be created" if new)
- `fee`: Pool fee percentage
- `tokenAAmount`: Amount of token A to be added
- `tokenBAmount`: Amount of token B to be added

#### checkApproval(tokenAddress, walletAddress)

Checks if a token is approved for the position manager.

```typescript
const isApproved = await dex.liquidity.checkApproval("0xToken...", "0xWallet...");
```

**Returns:** `boolean`

#### approve(tokenAddress, amount)

Approves a token for the position manager.

```typescript
const approveTx = await dex.liquidity.approve("0xToken...", "100");
```

**Returns:** Transaction object to be sent

#### addLiquidity(params, walletAddress)

Adds liquidity to a PancakeSwap V3 pool.

```typescript
const tx = await dex.liquidity.addLiquidity(
  {
    tokenA: "0xTokenA...",
    tokenB: "0xTokenB...",
    amountA: "100",
    amountB: "200"
  },
  "0xWallet..."
);
```

**Parameters:**
- `params`: Same as estimateAddLiquidity
- `walletAddress`: Address of the wallet adding liquidity

**Returns:** `Tx` object to be sent

#### getPosition(tokenId)

Gets information about an existing liquidity position.

```typescript
const position = await dex.liquidity.getPosition(12345);
```

**Parameters:**
- `tokenId`: The NFT token ID of the position

**Returns:** Position information including token addresses, fee tier, and tick range

#### estimateIncreaseLiquidity(params)

Estimates increasing liquidity for an existing position.

```typescript
const estimate = await dex.liquidity.estimateIncreaseLiquidity({
  tokenId: 12345,
  amountA: "100",
  amountB: "200"
});
```

**Parameters:**
- `params.tokenId`: The NFT token ID of the position
- `params.amountA`: Additional amount of token A
- `params.amountB`: Additional amount of token B

**Returns:** `EstimatedLiquidity` object

#### increaseLiquidity(params, walletAddress)

Increases liquidity for an existing position.

```typescript
const tx = await dex.liquidity.increaseLiquidity(
  {
    tokenId: 12345,
    amountA: "100",
    amountB: "200"
  },
  "0xWallet..."
);
```

**Parameters:**
- `params`: Same as estimateIncreaseLiquidity
- `walletAddress`: Address of the wallet increasing liquidity

**Returns:** `Tx` object to be sent

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

### Adding Liquidity

```typescript
import { Dex } from "@stratosphere-network/dex";
import { SupportedChain, DexProvider } from "@stratosphere-network/dex";
import { Wallet } from "ethers";

async function addLiquidity() {
  const dex = new Dex({
    chain: SupportedChain.BSC_MAINNET,
    provider: DexProvider.SPHERE,
  });

  const tokenA = "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82"; // CAKE
  const tokenB = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"; // BUSD
  const amountA = "1";
  const amountB = "5";
  const wallet = new Wallet(process.env.PRIVATE_KEY!);

  // 1. Estimate adding liquidity
  const estimate = await dex.liquidity.estimateAddLiquidity({
    tokenA,
    tokenB,
    amountA,
    amountB,
  });
  console.log("Pool address:", estimate.poolAddress);
  console.log("Fee tier:", estimate.fee + "%");

  // 2. Check and approve tokens if needed
  const isTokenAApproved = await dex.liquidity.checkApproval(tokenA, wallet.address);
  const isTokenBApproved = await dex.liquidity.checkApproval(tokenB, wallet.address);

  if (!isTokenAApproved) {
    const approvalTx = await dex.liquidity.approve(tokenA, amountA);
    await wallet.sendTransaction(approvalTx);
  }

  if (!isTokenBApproved) {
    const approvalTx = await dex.liquidity.approve(tokenB, amountB);
    await wallet.sendTransaction(approvalTx);
  }

  // 3. Add liquidity
  const tx = await dex.liquidity.addLiquidity(
    {
      tokenA,
      tokenB,
      amountA,
      amountB,
    },
    wallet.address
  );

  const receipt = await wallet.sendTransaction(tx);
  console.log("Liquidity added:", receipt.hash);
}
```

### Increasing Liquidity for an Existing Position

```typescript
import { Dex } from "@stratosphere-network/dex";
import { SupportedChain, DexProvider } from "@stratosphere-network/dex";
import { Wallet } from "ethers";

async function increaseLiquidity() {
  const dex = new Dex({
    chain: SupportedChain.BSC_MAINNET,
    provider: DexProvider.SPHERE,
  });

  const tokenId = 12345; // Your position NFT token ID
  const amountA = "0.5"; // Additional amount of token A
  const amountB = "2.5"; // Additional amount of token B
  const wallet = new Wallet(process.env.PRIVATE_KEY!);

  // 1. Get position information
  const position = await dex.liquidity.getPosition(tokenId);
  console.log("Position tokens:", position.token0, position.token1);
  
  // 2. Estimate increasing liquidity
  const estimate = await dex.liquidity.estimateIncreaseLiquidity({
    tokenId,
    amountA,
    amountB,
  });
  console.log("Liquidity increase estimation:", estimate);

  // 3. Check and approve tokens if needed
  const isToken0Approved = await dex.liquidity.checkApproval(position.token0, wallet.address);
  const isToken1Approved = await dex.liquidity.checkApproval(position.token1, wallet.address);

  if (!isToken0Approved) {
    const approvalTx = await dex.liquidity.approve(position.token0, amountA);
    await wallet.sendTransaction(approvalTx);
  }

  if (!isToken1Approved) {
    const approvalTx = await dex.liquidity.approve(position.token1, amountB);
    await wallet.sendTransaction(approvalTx);
  }

  // 4. Increase liquidity
  const tx = await dex.liquidity.increaseLiquidity(
    {
      tokenId,
      amountA,
      amountB,
    },
    wallet.address
  );

  const receipt = await wallet.sendTransaction(tx);
  console.log("Liquidity increased:", receipt.hash);
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
- BSC Mainnet
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
- `@stratospherex/v3-sdk`: PancakeSwap V3 SDK
- `viem`: Ethereum interaction library
- `ethers`: Ethereum wallet and provider utilities

## Contributing

Contributions are welcome! Please ensure all tests pass and follow the existing code style.

## License

MIT License - see LICENSE file for details.