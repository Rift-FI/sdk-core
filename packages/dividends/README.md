# @strato-sdk/dividends

This package provides dividend management functionality for the Strato SDK, allowing you to distribute ERC20 token dividends to holders either manually or via a smart contract.

## Installation

```bash
npm install @strato-sdk/dividends
```

## Usage

```typescript
import { Dividends } from "@strato-sdk/dividends";

// Example chain object (see Chain type for details)
const chain = { id: 1, rpcUrl: "https://mainnet.infura.io/v3/YOUR_INFURA_KEY" };
const privateKey = "0x..."; // Your wallet private key

const dividends = new Dividends(chain, privateKey);

// Define your indexer and business logic
const indexer = async (tokenAddress, chain) => [
  { address: "0x...", amount: "100" },
  // ...
];
const businessLogic = async ({ holders, totalSupply, dividendAmount }) => {
  // Your logic to determine dividend portions
  return holders;
};

// Distribute dividends manually (direct transfers)
const resultManual = await dividends.distributeDividendManual({
  tokenAddress: "0x...", // ERC20 token address
  stableCoinAddress: "0x...", // ERC20 stablecoin address
  amount: 1000, // Amount to distribute (number)
  indexer,
  businessLogic,
  privateKey,
});
console.log(resultManual);

// Distribute dividends via smart contract
const resultOnChain = await dividends.distributeDividend(
  {
    tokenAddress: "0x...",
    stableCoinAddress: "0x...",
    amount: 1000,
    indexer,
    businessLogic,
    privateKey,
  },
  "0xDividendContractAddress", // Address of the deployed dividend contract
  "My Dividend" // Optional dividend name
);
console.log(resultOnChain);
```

## Features

- Dividend configuration and management
- Manual and on-chain dividend distribution
- Flexible business logic and indexer integration

## API Reference

### Dividends

#### Constructor

```typescript
new Dividends(chain: Chain, privateKey?: string)
```

- `chain`: The blockchain network (see `Chain` type in `src/types.ts`).
- `privateKey`: (Optional) Private key for signing transactions. if you wanna integrate it in your frontend, you can skip this, and use the unsigned transaction to be signed by user wallet through metamask oranother wallet

#### Methods

- `distributeDividendManual(params: DistributeDividendIn): Promise<DistributeDividendOut>`
  - Distributes dividends by sending ERC20 transfers directly to holders.
- `distributeDividend(params: DistributeDividendIn, dividendContractAddress: string, dividendName?: string): Promise<DistibuteDividendOutOnChain>`
  - Distributes dividends via a smart contract.

### Types

See `src/types.ts` for detailed type definitions:

- `DistributeDividendIn`
- `DistributeDividendOut`
- `DistibuteDividendOutOnChain`
- `Chain`
- `AddressAmount`

---

For more advanced usage, see the source code and tests in the `src/` directory.
