# @strato-sdk/dividends

This package provides dividend management functionality for the Strato SDK, allowing you to distribute ERC20 token dividends to holders either manually or via a smart contract.

## Installation

```bash
npm install @strato-sdk/dividends
```

## Usage

### For backend (pass private key to class)

```typescript
import { Dividends } from "@strato-sdk/dividends";
import type {
  Chain,
  DistributeDividendIn,
  DistributeDividendOut,
  DistibuteDividendOutOnChain,
  DistributeDivdendOnchainConfig,
} from "@strato-sdk/dividends";

// Example chain object
const chain: Chain = {
  id: 1,
  rpcUrl: "https://mainnet.infura.io/v3/YOUR_INFURA_KEY",
};

// Initialize with private key (for automatic signing)
const privateKey = "0x..." as `0x${string}`;
const dividends = new Dividends(chain, privateKey);

// Or initialize with address only (for unsigned transactions)
const address = "0x..." as `0x${string}`;
const dividendsUnsigned = new Dividends(chain, address);

// Define your indexer and business logic
const indexer = async (tokenAddress: string, chain: Chain) => [
  { address: "0x...", amount: "100" },
  // ... more holders, you can put your indexer logic here
];

const businessLogic = async ({
  holders,
  totalSupply,
  dividendAmount,
  tokenAddress,
  chain,
}) => {
  // Your logic to determine dividend portions
  return holders.map((holder) => ({
    address: holder.address,
    amount: (
      (BigInt(holder.amount) * BigInt(dividendAmount)) /
      BigInt(totalSupply)
    ).toString(),
  }));
};

// 1. Manual dividend distribution (direct ERC20 transfers)
const distributeDividendParams: DistributeDividendIn = {
  tokenAddress: "0x..." as `0x${string}`, // ERC20 token address
  stableCoinAddress: "0x..." as `0x${string}`, // ERC20 stablecoin address
  amount: 1000, // Amount to distribute (number)
  indexer,
  businessLogic,
};

const resultManual: DistributeDividendOut =
  await dividends.distributeDividendManual(distributeDividendParams);
console.log(resultManual);

// 2. On-chain dividend distribution via smart contract
const dividendContractAddress = "0x..." as `0x${string}`;
const config: DistributeDivdendOnchainConfig = {
  title: "Q4 2024 Dividend",
  directTransfer: true, // Automatically transfer stablecoin to contract, if you choose false, you should transfer amount of dividend to dividend smart contract first
};

const resultOnChain: DistibuteDividendOutOnChain =
  await dividends.distributeDividend(
    distributeDividendParams,
    dividendContractAddress,
    config
  );
console.log(resultOnChain);

// 3. Get dividend contract address from factory
const factoryAddress = "0x..." as `0x${string}`;
const tokenAddress = "0x..." as `0x${string}`;

const contractAddress: string = await dividends.getDividendContractAddress(
  factoryAddress,
  tokenAddress
);
console.log("Dividend contract address:", contractAddress);
```

## Features

- **Manual Distribution**: Direct ERC20 transfers to token holders
- **On-chain Distribution**: Batch distribution via smart contract
- **Factory Integration**: Get dividend contract addresses from factory
- **Flexible Business Logic**: Custom dividend calculation logic
- **Multi-chain Support**: Works across multiple EVM-compatible chains
- **Signed/Unsigned Transactions**: Support for both wallet integration and direct signing

## API Reference

### Dividends Class

#### Constructor

```typescript
new Dividends(chain: Chain, privateKeyOrAddress: string)
```

**Parameters:**

- `chain: Chain` - The blockchain network configuration
- `privateKeyOrAddress: string` - Either a private key (for signing) or wallet address (for unsigned transactions), if you want to consume this on frontend side, please provide address of connected wallet, otherwise if you want to use it on backend / server please provide private key

**Example:**

```typescript
// With private key (auto-signing)
const dividends = new Dividends(
  { id: 1, rpcUrl: "https://mainnet.infura.io/v3/..." },
  "0x1234..." as `0x${string}`
);

// With address only (unsigned transactions)
const dividends = new Dividends(
  { id: 1, rpcUrl: "https://mainnet.infura.io/v3/..." },
  "0xabcd..." as `0x${string}`
);
```

#### Methods

##### `distributeDividendManual`

Distributes dividends by sending individual ERC20 transfers directly to holders.

```typescript
async distributeDividendManual(
  params: DistributeDividendIn
): Promise<DistributeDividendOut>
```

**Parameters:**

- `params: DistributeDividendIn` - Distribution configuration

**Returns:**

- `Promise<DistributeDividendOut>` - Array of transfer results with transaction details

**Example:**

```typescript
const result: DistributeDividendOut = await dividends.distributeDividendManual({
  tokenAddress: "0x..." as `0x${string}`,
  stableCoinAddress: "0x..." as `0x${string}`,
  amount: 1000,
  indexer: async (tokenAddr, chain) => {
    // Return array of { address, amount }
    return [
      { address: "0x...", amount: "100" },
      { address: "0x...", amount: "200" },
    ];
  },
  businessLogic: async ({ holders, totalSupply, dividendAmount }) => {
    // Calculate dividend portions
    return holders.map((holder) => ({
      address: holder.address,
      amount: calculateDividend(holder.amount, totalSupply, dividendAmount),
    }));
  },
});

// Handle results
result.forEach((transfer) => {
  if (transfer.type === "signed") {
    console.log(`Transfer to ${transfer.address}: ${transfer.txHash}`);
  } else {
    // Sign the unsigned transaction
    const signedTx = await walletClient.writeContract({
      ...transfer.txUnsigned,
      account: myAccount,
    });
  }
});
```

##### `distributeDividend`

Distributes dividends via a smart contract in a single batch transaction.

```typescript
async distributeDividend(
  params: DistributeDividendIn,
  dividendContractAddress: string,
  config?: DistributeDivdendOnchainConfig
): Promise<DistibuteDividendOutOnChain>
```

**Parameters:**

- `params: DistributeDividendIn` - Distribution configuration
- `dividendContractAddress: string` - Address of the deployed dividend contract
- `config?: DistributeDivdendOnchainConfig` - Optional configuration
  - title?: string, title of dividend, if you skip this it will auto generated using timestamp of executed time
  - directTransfer?: boolean, if you input private key at constructor and give `true` on params, logic will auto transfer required amount of `params.amount` from your account (from privatekey) to dividend contract, otherwise you should make sure that dividend contract have **sufficient amount** of stablecoin to be distributed.

**Returns:**

- `Promise<DistibuteDividendOutOnChain>` - Batch transaction result

**Example:**

```typescript
const result: DistibuteDividendOutOnChain = await dividends.distributeDividend(
  {
    tokenAddress: "0x..." as `0x${string}`,
    stableCoinAddress: "0x..." as `0x${string}`,
    amount: 1000,
    indexer,
    businessLogic,
  },
  "0xDividendContract..." as `0x${string}`,
  {
    title: "Q4 2024 Dividend",
    directTransfer: true, // Auto-transfer stablecoin to contract
  }
);

if (result.type === "signed") {
  console.log(`Batch dividend distributed: ${result.txHash}`);
  console.log(`Recipients: ${result.dividendPortion.length}`);
} else {
  // Sign the unsigned transaction
  const signedTx = await walletClient.writeContract({
    ...result.txUnsigned,
    account: myAccount,
  });
}
```

##### `getDividendContractAddress`

Gets the dividend contract address for a specific token from a factory contract.

```typescript
async getDividendContractAddress(
  factoryAddress: string,
  tokenAddress: string
): Promise<string>
```

**Parameters:**

- `factoryAddress: string` - Address of the dividend factory contract
- `tokenAddress: string` - Address of the ERC20 token

**Returns:**

- `Promise<string>` - Address of the dividend contract for the token

**Example:**

```typescript
const factoryAddress = "0xFactory..." as `0x${string}`;
const tokenAddress = "0xToken..." as `0x${string}`;

const dividendContract: string = await dividends.getDividendContractAddress(
  factoryAddress,
  tokenAddress
);

console.log(`Dividend contract for token: ${dividendContract}`);

// Use the contract address for distribution
const result = await dividends.distributeDividend(
  distributionParams,
  dividendContract as `0x${string}`,
  { title: "My Dividend" }
);
```

### Types

#### `Chain`

```typescript
interface Chain {
  id: number; // Chain ID (e.g., 1 for Ethereum mainnet)
  rpcUrl?: string; // Optional RPC URL (required for unsupported chains)
}
```

#### `DistributeDividendIn`

```typescript
interface DistributeDividendIn {
  tokenAddress: string; // ERC20 token contract address
  stableCoinAddress: string; // ERC20 stablecoin contract address
  amount: number; // Total dividend amount to distribute
  businessLogic: (params: BusinessLogicParams) => Promise<AddressAmount[]>;
  indexer: (tokenAddress: string, chain: Chain) => Promise<AddressAmount[]>;
}
```

#### `DistributeDividendOut`

```typescript
type DistributeDividendOut = FinishTransferAddressAmount[];

interface FinishTransferAddressAmount {
  address: string; // Recipient address
  amount: string; // Amount transferred
  type: "signed" | "unsigned"; // Transaction status
  txHash?: string; // Transaction hash (if signed)
  txUnsigned?: any; // Unsigned transaction data (if unsigned)
}
```

#### `DistibuteDividendOutOnChain`

```typescript
interface DistibuteDividendOutOnChain {
  type: "signed" | "unsigned"; // Transaction status
  txHash?: string; // Transaction hash (if signed)
  txUnsigned?: any; // Unsigned transaction data (if unsigned)
  dividendPortion: AddressAmount[]; // Array of recipients and amounts
}
```

#### `DistributeDivdendOnchainConfig`

```typescript
interface DistributeDivdendOnchainConfig {
  title?: string; // Optional dividend title/description
  directTransfer?: boolean; // Auto-transfer stablecoin to contract (requires private key)
}
```

## Supported Chains

The package supports the following chains out of the box:

- Ethereum Mainnet (1)
- Polygon (137)
- Base (8453)
- Arbitrum (42161)
- Optimism (10)
- Base Sepolia (84532)
- Berachain (288)
- Berachain Bepolia (289)
- Sepolia (1313161554)

For other chains, provide a custom `rpcUrl` in the chain configuration.

## Error Handling

```typescript
import { DividendsError } from "@strato-sdk/dividends";

try {
  const result = await dividends.distributeDividend(/* ... */);
} catch (error) {
  if (error instanceof DividendsError) {
    console.error("Dividends error:", error.message);
  } else {
    console.error("Unexpected error:", error);
  }
}
```

## Running Unit Tests

To run the unit tests for this package, follow these steps:

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd strato-sdk/packages/dividends
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Install and run anvil**:

   - Anvil is a local Ethereum node used for testing. Install it if you haven't already:
     ```bash
     npm install -g anvil
     ```
   - Run anvil on port 13517:
     ```bash
     anvil --port 13517
     ```

4. **Prepare foundry and smart contracts artifacts**:

   ```bash
   # Install Foundry
   curl -L https://foundry.paradigm.xyz | bash
   foundryup

   # Install OpenZeppelin contracts
   forge install OpenZeppelin/openzeppelin-contracts

   # Build contracts
   forge build
   ```

5. **Generate contract artifacts**:

   ```bash
   ts-node scripts/generate-artifacts.ts
   ```

6. **Run the tests**:

   ```bash
   npm test
   ```

   This will execute the unit tests located in the `src/__tests__` directory.
