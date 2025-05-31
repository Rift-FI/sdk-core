# @stratosphere-network/token

Token module for StratoSphere SDK providing ERC20 token minting, burning, and factory functionality.

## Features

- 🏭 **Token Factory**: Deploy new ERC20 tokens with custom configurations
- 🪙 **Token Minting**: Mint new tokens to specified addresses
- 🔥 **Token Burning**: Burn tokens from addresses with proper permissions
- 🔐 **Role Management**: Grant and revoke roles for token operations
- ⏸️ **Pausable Tokens**: Pause/unpause token operations
- 📊 **Token Information**: Get detailed token information and balances
- 🎯 **SPHR Token Support**: Special support for SPHR token with transferability controls

## Installation

```bash
npm install @stratosphere-network/token
```

## Quick Start

```typescript
import Token from '@stratosphere-network/token';
import { ethers } from 'ethers';

// Initialize with provider and contract addresses
const token = new Token({
  provider: new ethers.JsonRpcProvider('YOUR_RPC_URL'),
  signer: wallet, // Optional ethers Signer
  contractAddresses: {
    tokenFactory: '0x...', // Token Factory contract address
    sphrToken: '0x...'     // SPHR token contract address (optional)
  }
});
```

## Core Functionality

### 1. Deploy New Tokens

Deploy ERC20 tokens with minting capabilities:

```typescript
const deployedToken = await token.deployToken({
  name: "My Custom Token",
  symbol: "MCT",
  maxSupply: "1000000",      // Maximum supply (0 for unlimited)
  initialSupply: "100000",   // Initial supply minted to deployer
  mintable: true,
  burnable: true,
  pausable: true
});

console.log(`Token deployed at: ${deployedToken.address}`);
```

### 2. Mint Tokens

Mint new tokens to addresses (requires MINTER_ROLE):

```typescript
// Mint to specific token
const txHash = await token.mint({
  to: "0x1234567890123456789012345678901234567890",
  amount: "1000",
  tokenAddress: "0x..." // Optional, defaults to SPHR token
});

// Mint SPHR tokens (convenience method)
const sphrTxHash = await token.mintSPHR(
  "0x1234567890123456789012345678901234567890",
  "500"
);
```

### 3. Burn Tokens

Burn tokens from addresses (requires BURNER_ROLE):

```typescript
// Burn from specific token
const txHash = await token.burn({
  from: "0x1234567890123456789012345678901234567890",
  amount: "100",
  tokenAddress: "0x..." // Optional, defaults to SPHR token
});

// Burn SPHR tokens (convenience method)
const sphrTxHash = await token.burnSPHR(
  "0x1234567890123456789012345678901234567890",
  "50"
);
```

### 4. Token Information

Get detailed information about tokens:

```typescript
// Get token information
const tokenInfo = await token.getTokenInfo("0x...");
console.log(`Token: ${tokenInfo.name} (${tokenInfo.symbol})`);
console.log(`Total Supply: ${tokenInfo.totalSupply}`);
console.log(`Max Supply: ${tokenInfo.maxSupply}`);
console.log(`Mintable: ${tokenInfo.mintable}`);
console.log(`Paused: ${tokenInfo.paused}`);

// Get token balance
const balance = await token.getBalance(
  "0x...", // token address
  "0x..."  // user address
);
console.log(`Balance: ${balance.balance} ${balance.symbol}`);

// Get SPHR token info (convenience method)
const sphrInfo = await token.getSPHRInfo();
const sphrBalance = await token.getSPHRBalance("0x...");
```

### 5. Role Management

Manage token roles and permissions:

```typescript
// Grant minter role
await token.grantRole(
  "0x...", // token address
  "MINTER_ROLE",
  "0x..."  // account to grant role to
);

// Check if address has role
const hasMinterRole = await token.hasRole(
  "0x...", // token address
  "MINTER_ROLE",
  "0x..."  // account to check
);

// Revoke role
await token.revokeRole(
  "0x...", // token address
  "MINTER_ROLE",
  "0x..."  // account to revoke role from
);
```

### 6. Token Control

Control token operations:

```typescript
// Pause token (stops all transfers, minting, burning)
await token.pause("0x...");

// Unpause token
await token.unpause("0x...");

// Set maximum supply
await token.setMaxSupply("0x...", "2000000");

// Enable/disable minting
await token.setMintingEnabled("0x...", false);
```

### 7. SPHR Token Specific

Special functionality for SPHR tokens:

```typescript
// Set transferability (SPHR tokens can be non-transferable initially)
await token.setTransferable(true);

// Check if transferable
const isTransferable = await token.isTransferable();
console.log(`SPHR transferable: ${isTransferable}`);
```

### 8. Factory Operations

Interact with the Token Factory:

```typescript
// Get all tokens deployed by a user
const userTokens = await token.getUserTokens("0x...");
console.log(`User has deployed ${userTokens.length} tokens`);

// Get all tokens deployed through factory
const allTokens = await token.getAllTokens();
console.log(`Total tokens deployed: ${allTokens.length}`);
```

## Token Standards

The module supports different token standards:

- **ERC20**: Standard ERC20 functionality
- **ERC20_MINTABLE**: ERC20 with minting capabilities
- **ERC20_BURNABLE**: ERC20 with burning capabilities
- **ERC20_PAUSABLE**: ERC20 with pause/unpause functionality
- **ERC20_UPGRADEABLE**: ERC20 with upgrade capabilities
- **SPHR**: Special SPHR token with transferability controls

## Smart Contracts

### MintableToken Contract

Standard ERC20 token with additional features:
- Role-based access control (MINTER_ROLE, BURNER_ROLE, PAUSER_ROLE)
- Maximum supply limits
- Pausable functionality
- Minting enable/disable controls

### TokenFactory Contract

Factory for deploying new MintableToken instances:
- Deployment fee management
- User token tracking
- Batch deployment capabilities

### SPHR Token Contract

Upgradeable ERC20 token with:
- All MintableToken features
- Transferability controls
- UUPS upgrade pattern
- Enhanced role management

## Configuration

```typescript
interface TokenModuleConfig {
  provider: Provider;           // Ethereum provider
  signer?: Signer;             // Optional signer for transactions
  contractAddresses: {
    tokenFactory?: string;      // Token Factory contract address
    sphrToken?: string;        // SPHR token contract address
    [key: string]: string | undefined;
  };
}
```

## Error Handling

The module provides detailed error messages:

```typescript
try {
  await token.mint({
    to: "0x...",
    amount: "1000"
  });
} catch (error) {
  if (error.message.includes('Signer required')) {
    console.log('Please provide a signer for this operation');
  } else if (error.message.includes('SPHR token address not configured')) {
    console.log('Please configure SPHR token address');
  }
  // Handle other errors...
}
```

## Events

Listen to token events:

```typescript
// Token events are emitted by the smart contracts
// You can listen to them using ethers.js event listeners

const tokenContract = new ethers.Contract(tokenAddress, abi, provider);

tokenContract.on('Transfer', (from, to, value) => {
  console.log(`Transfer: ${from} -> ${to}, Amount: ${value}`);
});

tokenContract.on('Mint', (to, value) => {
  console.log(`Minted ${value} tokens to ${to}`);
});

tokenContract.on('Burn', (from, value) => {
  console.log(`Burned ${value} tokens from ${from}`);
});
```

## Advanced Usage

### Custom Token Deployment

```typescript
// Deploy token with custom configuration
const customToken = await token.deployToken({
  name: "Governance Token",
  symbol: "GOV",
  maxSupply: "0",           // Unlimited supply
  initialSupply: "1000000", // 1M initial supply
  mintable: true,
  burnable: true,
  pausable: true,
  upgradeable: false
}, "0.01"); // Custom deployment fee in ETH
```

### Batch Operations

```typescript
// Get information for multiple tokens
const tokenAddresses = await token.getAllTokens();
const tokenInfos = await Promise.all(
  tokenAddresses.map(addr => token.getTokenInfo(addr))
);

// Mint to multiple addresses
const recipients = ["0x...", "0x...", "0x..."];
const mintPromises = recipients.map(addr => 
  token.mint({ to: addr, amount: "100", tokenAddress: "0x..." })
);
await Promise.all(mintPromises);
```

## License

MIT 