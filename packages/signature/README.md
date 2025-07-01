# @stratosphere-network/signature

🔐 **EIP-2612 permit signature and gasless transfer utilities for StratoSphere SDK**

The `@stratosphere-network/signature` package provides robust EIP-2612 permit signature generation and gasless transfer functionality, enabling users to execute token transfers without paying gas fees through a relayer pattern.

## 📋 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Core Concepts](#-core-concepts)
- [API Reference](#-api-reference)
- [Usage Examples](#-usage-examples)
- [Smart Contracts](#-smart-contracts)
- [Testing](#-testing)
- [Contributing](#-contributing)

## ✨ Features

- 🔐 **EIP-2612 Permit Signatures** - Generate cryptographic signatures for token approvals
- ⛽ **Gasless Transfers** - Enable token transfers without gas fees via relayer pattern
- 🛡️ **Replay Protection** - Built-in nonce management and deadline expiration
- 🔗 **Multi-chain Support** - Works across different blockchain networks
- 📝 **TypeScript Support** - Full type safety and IntelliSense
- 🧪 **Comprehensive Testing** - Unit tests and integration tests with Anvil
- 📦 **Smart Contracts** - Custom ERC20Permit and GaslessRelayer contracts
- 🏗️ **Foundry Integration** - Contract development and testing with Foundry

## 📦 Installation

```bash
npm install @stratosphere-network/signature
```

**Dependencies:**

- `ethers` ^6.8.0
- `axios` ^1.6.0

**Dev Dependencies (for contract development):**

- Foundry (for smart contract compilation)
- Jest (for testing)

## 🚀 Quick Start

### Basic EIP-2612 Signature Generation

```typescript
import { Signature } from "@stratosphere-network/signature";
import { ethers } from "ethers";

// Initialize signature class
const signature = new Signature();

// Create signer (wallet with private key)
const signer = new ethers.Wallet("your-private-key", provider);

// Generate EIP-2612 permit signature
const permitSignature = await signature.erc2612signature({
  signer: signer,
  tokenAddress: "0x...", // ERC20 token contract address
  spender: "0x...", // Address allowed to spend tokens
  value: "1000", // Amount to approve (human readable)
  deadlineInMinutes: 60, // Signature valid for 1 hour
});

console.log("Permit signature:", permitSignature);
```

### Gasless Transfer

```typescript
import { Signature } from '@stratosphere-network/signature';

// Initialize with custom relayer API
const signature = new Signature('https://your-relayer-api.com/transfer');

// Generate permit signature (as above)
const permitSignature = await signature.erc2612signature({...});

// Execute gasless transfer via relayer
const result = await signature.gasless({
  signature: permitSignature,
  tokenAddress: '0x...', // Token contract
  recipient: '0x...', // Transfer recipient
  amount: '500.0', // Amount to transfer
});

console.log('Transfer result:', result);
```

## 🧠 Core Concepts

### EIP-2612 Permit Pattern

EIP-2612 enables gasless token approvals through cryptographic signatures:

1. **Off-chain Signing** - User signs a permit message without gas cost
2. **On-chain Execution** - Relayer submits the signature and executes transfer
3. **Replay Protection** - Nonces prevent signature reuse
4. **Deadline Protection** - Time-based expiration for signatures

### Gasless Transfer Flow

```
User (Token Owner)     Relayer (Gas Payer)     Smart Contract
       |                      |                      |
   1. Sign Permit              |                      |
       |                      |                      |
   2. Submit to API ---------> |                      |
       |                      |                      |
       |                3. Execute Permit --------> |
       |                      |                      |
       |                      |             4. Validate & Transfer
       |                      |                      |
       |                5. Return Result <---------- |
       |                      |                      |
   6. Receive Confirmation <-- |                      |
```

## 📚 API Reference

### Signature Class

#### Constructor

```typescript
new Signature(transferApiUrl?: string)
```

- `transferApiUrl` (optional): Custom relayer API endpoint
- Default: `https://rewardsvault-production.up.railway.app/api/gas/transfer`

#### Methods

##### `erc2612signature(params): Promise<Erc2612SignatureOutput>`

Generates an EIP-2612 permit signature.

**Parameters:**

```typescript
interface Erc2612SignatureParameters {
  signer: Signer; // Ethers.js signer instance
  tokenAddress: string; // ERC20 token contract address
  spender: string; // Address authorized to spend
  value: string; // Amount to approve (human readable)
  deadlineInMinutes: number; // Signature validity duration
}
```

**Returns:**

```typescript
interface Erc2612SignatureOutput {
  v: number; // Signature recovery parameter
  r: string; // Signature r component
  s: string; // Signature s component
  deadline: number; // Unix timestamp expiration
  nonce: number; // Current token owner nonce
  value: ethers.BigNumberish; // Approved amount in wei
}
```

##### `gasless(params): Promise<any>`

Submits gasless transfer request to relayer API.

**Parameters:**

```typescript
interface GaslessTransferParameters {
  signature: Erc2612SignatureOutput; // Generated permit signature
  tokenAddress: string; // Token contract address
  recipient: string; // Transfer recipient address
  amount: string; // Transfer amount (human readable)
}
```

##### `getTransferApiUrl(): string`

Returns the current relayer API URL.

##### `setTransferApiUrl(url: string): void`

Updates the relayer API URL.

## 💡 Usage Examples

### Complete Gasless Transfer Example

```typescript
import { Signature } from "@stratosphere-network/signature";
import { ethers } from "ethers";

async function executeGaslessTransfer() {
  // Setup
  const provider = new ethers.JsonRpcProvider(
    "https://eth-mainnet.alchemyapi.io/v2/your-key"
  );
  const signer = new ethers.Wallet("your-private-key", provider);
  const signature = new Signature();

  try {
    // Step 1: Generate permit signature
    console.log("🔐 Generating permit signature...");
    const permitSignature = await signature.erc2612signature({
      signer: signer,
      tokenAddress: "0xA0b86a33E6441E6bB6F267d27E4D5dD83b46A9bf", // Example token
      spender: "0x742d35cc6635c0532925a3b8d295759E97D7C1aa", // Relayer contract
      value: "1000",
      deadlineInMinutes: 30,
    });

    console.log("✅ Signature generated:", {
      v: permitSignature.v,
      deadline: new Date(permitSignature.deadline * 1000).toISOString(),
      nonce: permitSignature.nonce,
    });

    // Step 2: Execute gasless transfer
    console.log("🚀 Executing gasless transfer...");
    const transferResult = await signature.gasless({
      signature: permitSignature,
      tokenAddress: "0xA0b86a33E6441E6bB6F267d27E4D5dD83b46A9bf",
      recipient: "0x8ba1f109551bD432803012645Hac136c73ce77e",
      amount: "500.0",
    });

    console.log("✅ Transfer completed:", transferResult);
    return transferResult;
  } catch (error) {
    console.error("❌ Transfer failed:", error);
    throw error;
  }
}

// Execute
executeGaslessTransfer();
```

### Custom Relayer Integration

```typescript
import { Signature } from "@stratosphere-network/signature";

// Initialize with custom relayer
const signature = new Signature("https://my-relayer.com/api/transfer");

// Or update dynamically
signature.setTransferApiUrl("https://another-relayer.com/api/transfer");

console.log("Current API:", signature.getTransferApiUrl());
```

### Multi-Chain Support

```typescript
// Ethereum Mainnet
const ethSignature = new Signature();
const ethProvider = new ethers.JsonRpcProvider(
  "https://mainnet.infura.io/v3/key"
);

// Polygon
const polygonSignature = new Signature(
  "https://polygon-relayer.com/api/transfer"
);
const polygonProvider = new ethers.JsonRpcProvider("https://polygon-rpc.com");

// BSC
const bscSignature = new Signature("https://bsc-relayer.com/api/transfer");
const bscProvider = new ethers.JsonRpcProvider(
  "https://bsc-dataseed.binance.org"
);
```

## 🏗️ Smart Contracts

The package includes custom smart contracts for gasless transfers:

### ERC20Permit.sol

A complete ERC20 implementation with EIP-2612 permit functionality:

- ✅ Standard ERC20 functions (transfer, approve, etc.)
- ✅ EIP-2612 permit implementation
- ✅ Domain separation for different chains
- ✅ Nonce management and replay protection
- ✅ Custom errors for gas efficiency

### GaslessRelayer.sol

Relayer contract for executing gasless transfers:

- ✅ `executePermitTransfer()` - Execute single gasless transfer
- ✅ Permit validation and execution
- ✅ Event emissions for tracking
- ✅ Error handling with custom errors

### Contract Development

```bash
# Build contracts
npm run build:contracts

# Generate TypeScript artifacts
npm run build:artifacts

# Test contracts
npm run test:contracts
```

## 🧪 Testing

The package includes comprehensive testing:

### Run Tests

```bash
# Unit tests only
npm test

# All tests (including integration)
npm run test:all

# Test with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Test Structure

- **Unit Tests** - `signature.test.ts` - Core functionality testing
- **Integration Tests** - `anvil-signature.test.ts` - End-to-end testing with Anvil
- **Contract Tests** - Foundry tests for smart contracts
- **Mock Server** - HTTP mock server for API testing

### Integration Testing with Anvil

The package includes sophisticated integration tests using Anvil (local Ethereum node):

```typescript
// Real gasless transfer simulation
// Actor A (relayer) pays gas
// Actor B (sender) signs permit
// Actor C (recipient) receives tokens
// Result: B pays zero gas fees!
```

## 🔧 Development

### Build Package

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Clean Build

```bash
npm run clean
```

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🆘 Support

- 📖 [Documentation](https://github.com/stratosphere-network/stratos-sdk)
- 🐛 [Issues](https://github.com/stratosphere-network/stratos-sdk/issues)
- 💬 [Discussions](https://github.com/stratosphere-network/stratos-sdk/discussions)

---

**Built with ❤️ by the StratoSphere team**
