# @stratosphere-network/token

This package provides a `Token` class to deploy and manage upgradeable ERC20 tokens on supported blockchains using the UUPS proxy pattern.

## Features

- **Upgradeable Tokens**: Deploy tokens as UUPS proxies, allowing you to upgrade the underlying contract logic later without requiring users to migrate.
- **Role-Based Access Control**: Manage permissions with distinct roles (`MINTER_ROLE`, `BURNER_ROLE`, `PAUSER_ROLE`, `UPGRADER_ROLE`) instead of a single owner.
- **Factory-Based Deployment**: A central factory contract deploys lightweight proxy contracts, saving significant gas fees for your users.
- **Comprehensive SDK**: A simple SDK to handle deployment, role management, feature toggling, minting, burning, and upgrades.

## Installation

To install the package, you can use npm or yarn:

```bash
npm install @stratosphere-network/token
# or
yarn add @stratosphere-network/token
```

## Supported Chains

Token deployment is currently supported on the following chains:

- **Berachain Mainnet** (`Chain.BERACHAIN_MAINNET`)
- **Berachain Testnet** (`Chain.BERACHAIN_TESTNET`) 
- **Ethereum Sepolia** (`Chain.ETHEREUM_SEPOLIA`)

Additional chains are supported by the SDK but may not have factory contracts deployed yet:
- Ethereum Mainnet, Polygon Mainnet, Base Mainnet, Arbitrum Mainnet, Optimism Mainnet

## Usage

First, import the `Token` class and the necessary types from the package. If you plan to use an existing `ethers.Wallet` instance, you'll also need to import `ethers`:

```typescript
import Token, { TokenConfig, Chain } from "@stratosphere-network/token";
import { ethers } from "ethers"; // Required if providing your own ethers.Wallet instance
```

Next, create an instance of the `Token` class:

```typescript
const tokenClient = new Token();
```

### 1. Deploying an Upgradeable Token

To deploy a new token, provide a `tokenConfig` object. The `deployToken` method returns an object containing the `transactionHash` and the `tokenAddress` of the newly created proxy contract.

The address that deploys the token will automatically be granted the `DEFAULT_ADMIN_ROLE`, as well as the `MINTER_ROLE`, `BURNER_ROLE`, `PAUSER_ROLE`, and `UPGRADER_ROLE`.

```typescript
// Ensure tokenClient is instantiated as shown in the "Usage" section:
// import Token from "@stratosphere-network/token";
// const tokenClient = new Token();

async function deployMyToken() {
  const tokenConfig: TokenConfig = {
    name: "My Awesome Token",
    symbol: "MAT",
    totalSupply: "1000000000000000000000000", // 1 million tokens with 18 decimals
    decimals: 18,
    chain: Chain.BERACHAIN_MAINNET, // Ensure this matches supported chains
  };

  // --- Option 1: Using deployerPrivateKey (simplest for quick start) ---
  const deployerPrivateKey = "YOUR_DEPLOYER_PRIVATE_KEY"; // Replace with actual private key
  try {
    console.log("Attempting to deploy with private key...");
    const { transactionHash, tokenAddress } = await tokenClient.deployToken(
      tokenConfig,
      deployerPrivateKey
      // walletInstance is omitted or undefined here
    );
    console.log("Token deployment successful!");
    console.log(`  - Transaction Hash: ${transactionHash}`);
    console.log(`  - Token Proxy Address: ${tokenAddress}`);
    return tokenAddress;
  } catch (error) {
    console.error("Error deploying token with private key:", error);
  }

  // --- Option 2: Using an existing ethers.Wallet instance ---
  // This requires 'ethers' to be imported and a wallet instance prepared.
  // Example setup (replace with your actual provider and private key/mnemonic):
  /*
  // Ensure ethers is imported: import { ethers } from "ethers";
  // const BERACHAIN_RPC_URL = "https://rpc.berachain.com/"; // Replace with actual official RPC for Berachain
  // const provider = new ethers.JsonRpcProvider(BERACHAIN_RPC_URL);
  // const existingWallet = new ethers.Wallet(deployerPrivateKey, provider); // Or from a connected wallet like MetaMask

  try {
    console.log("Attempting to deploy with wallet instance...");
    // Note: Pass undefined for deployerPrivateKey if primarily using walletInstance
    const { transactionHash, tokenAddress } = await tokenClient.deployToken(
      tokenConfig,
      undefined,
      existingWallet
    );
    console.log("Token deployment successful!");
    console.log(`  - Transaction Hash: ${transactionHash}`);
    console.log(`  - Token Proxy Address: ${tokenAddress}`);
  } catch (error) {
    console.error("Error deploying token with wallet instance:", error);
  }
  */
}

deployMyToken();
```

**Note:** Ensure your deployer account has enough native currency (e.g., BERA on Berachain) to cover the gas fees for the deployment transaction.

### 2. Managing the Token

Once deployed, you can manage the token using its proxy address.

#### Role Management

You can grant and revoke roles to other addresses.

```typescript
// You need the token's address from the deployment step.
const tokenAddress = "0xYourTokenProxyAddress";
const anotherAddress = "0x...someOtherAddress";
const adminPrivateKey = "YOUR_DEPLOYER_PRIVATE_KEY"; // The key of an address with DEFAULT_ADMIN_ROLE

// Grant the MINTER_ROLE
await tokenClient.grantRole(
  Chain.BERACHAIN_MAINNET,
  tokenAddress,
  "MINTER_ROLE",
  anotherAddress,
  adminPrivateKey
);
console.log("MINTER_ROLE granted.");

// Check if an address has a role
const hasRole = await tokenClient.hasRole(
  Chain.BERACHAIN_MAINNET,
  tokenAddress,
  "MINTER_ROLE",
  anotherAddress
);
console.log(`Does the address have MINTER_ROLE? ${hasRole}`); // true

// Revoke the MINTER_ROLE
await tokenClient.revokeRole(
  Chain.BERACHAIN_MAINNET,
  tokenAddress,
  "MINTER_ROLE",
  anotherAddress,
  adminPrivateKey
);
console.log("MINTER_ROLE revoked.");
```

#### Token Minting and Burning

**Note: The following mint and burn methods are not yet implemented in the current SDK but are available in the token contract. You can interact with these functions directly using ethers.js if needed.**

```typescript
// These methods need to be added to the SDK:
// - mint(chain, tokenAddress, to, amount, privateKey/wallet)
// - burn(chain, tokenAddress, account, amount, privateKey/wallet)

// For now, you can use ethers.js directly to call these functions:
// const tokenContract = new ethers.Contract(tokenAddress, TokenAbi, wallet);
// await tokenContract.mint(recipientAddress, amount);
// await tokenContract.burn(accountAddress, amount);
```

#### Feature Control

Enable or disable token transfers, and pause or unpause the contract.

```typescript
const tokenAddress = "0xYourTokenProxyAddress";
const pauserPrivateKey = "YOUR_DEPLOYER_PRIVATE_KEY"; // The key of an address with PAUSER_ROLE
const adminPrivateKey = "YOUR_DEPLOYER_PRIVATE_KEY"; // The key of an address with DEFAULT_ADMIN_ROLE

// Enable token transfers for all users
await tokenClient.setTransferable(
  Chain.BERACHAIN_MAINNET,
  tokenAddress,
  true,
  adminPrivateKey
);
console.log("Token transfers are now enabled for everyone.");

// Pause the contract
await tokenClient.pause(Chain.BERACHAIN_MAINNET, tokenAddress, pauserPrivateKey);
console.log("Contract is paused.");

// Note: Query methods like transferable() and paused() are not yet implemented in the SDK
// You can check these directly using ethers.js:
// const tokenContract = new ethers.Contract(tokenAddress, TokenAbi, provider);
// const isTransferable = await tokenContract.transferable();
// const isPaused = await tokenContract.paused();

// Unpause the contract
await tokenClient.unpause(Chain.BERACHAIN_MAINNET, tokenAddress, pauserPrivateKey);
console.log("Contract is unpaused.");
```

### 3. Token Information Queries

**Note: The following query methods are not yet implemented in the current SDK but are available in the token contract. You can access them directly using ethers.js:**

```typescript
import { TokenAbi } from "@stratosphere-network/token/dist/utils/token";
import { ethers } from "ethers";

const tokenAddress = "0xYourTokenProxyAddress";
const provider = new ethers.JsonRpcProvider("https://rpc.berachain.com");
const tokenContract = new ethers.Contract(tokenAddress, TokenAbi, provider);

// Get token information
const name = await tokenContract.name();
const symbol = await tokenContract.symbol();
const decimals = await tokenContract.decimals();
const totalSupply = await tokenContract.totalSupply();
const balance = await tokenContract.balanceOf("0xAccountAddress");

console.log(`Token: ${name} (${symbol})`);
console.log(`Decimals: ${decimals}`);
console.log(`Total Supply: ${totalSupply.toString()}`);
console.log(`Balance: ${balance.toString()}`);
```

### 4. Upgrading the Token

If you deploy a new version of the `Token.sol` implementation contract, you can upgrade your proxies to point to the new logic.

```typescript
const tokenAddress = "0xYourTokenProxyAddress";
const newImplementationAddress = "0x...addressOfNewTokenImplementation";
const upgraderPrivateKey = "YOUR_DEPLOYER_PRIVATE_KEY"; // The key of an address with UPGRADER_ROLE

await tokenClient.upgradeTo(
  Chain.BERACHAIN_MAINNET,
  tokenAddress,
  newImplementationAddress,
  upgraderPrivateKey
);
console.log("Token proxy has been upgraded to the new implementation!");
```

## API Reference

### `TokenConfig` Parameters

- `name` (string): The name of your token (e.g., "My Awesome Token").
- `symbol` (string): The symbol for your token (e.g., "MAT").
- `totalSupply` (string): The initial supply of your token, expressed as a string in its smallest unit (e.g., wei for an 18-decimal token). This supply is minted to the deployer.
- `decimals` (number): The number of decimal places your token will have (typically 18).
- `chain` (Chain): The chain to deploy the token on. Currently supported: `Chain.BERACHAIN_MAINNET`, `Chain.BERACHAIN_TESTNET`, `Chain.ETHEREUM_SEPOLIA`.

### Supported Chains

```typescript
enum Chain {
  ETHEREUM_MAINNET = "ethereum-mainnet",
  ETHEREUM_SEPOLIA = "ethereum-sepolia", 
  POLYGON_MAINNET = "polygon-mainnet",
  BERACHAIN_MAINNET = "berachain-mainnet",
  BERACHAIN_TESTNET = "berachain-testnet",
  BASE_MAINNET = "base-mainnet",
  ARBITRUM_MAINNET = "arbitrum-mainnet",
  OPTIMISM_MAINNET = "optimism-mainnet",
}
```

### SDK Methods

All methods that perform on-chain transactions require either a `deployerPrivateKey` or a `walletInstance` to be passed as the final argument.

#### Currently Implemented Methods

- `deployToken(config, privateKey?, wallet?)`: Deploys a new token proxy. Returns `{ transactionHash, tokenAddress }`.
- `grantRole(chain, tokenAddress, role, toAddress, ...)`: Grants a role to an address.
- `revokeRole(chain, tokenAddress, role, fromAddress, ...)`: Revokes a role from an address.
- `hasRole(chain, tokenAddress, role, address)`: Checks if an address has a specific role. Returns a boolean.
- `setTransferable(chain, tokenAddress, isTransferable, ...)`: Enables or disables token transfers for non-admins.
- `pause(chain, tokenAddress, ...)`: Pauses all token transfers, mints, and burns.
- `unpause(chain, tokenAddress, ...)`: Resumes a paused contract.
- `upgradeTo(chain, tokenAddress, newImplementation, ...)`: Upgrades the token proxy to a new implementation contract.

#### Methods Available in Contract (Not Yet in SDK)

The following methods are available in the token contract but not yet implemented in the SDK. You can access them directly using ethers.js with the TokenAbi:

- `mint(to, amount)`: Mints new tokens to a specified address (requires MINTER_ROLE).
- `burn(account, amount)`: Burns tokens from a specified address (requires BURNER_ROLE).
- `transferable()`: Returns whether transfers are enabled for non-admins.
- `paused()`: Returns whether the contract is paused.
- `name()`: Returns the token name.
- `symbol()`: Returns the token symbol.
- `decimals()`: Returns the number of decimals.
- `totalSupply()`: Returns the total supply of tokens.
- `balanceOf(account)`: Returns the balance of a specific account.

### Role Types

`role` parameter must be one of: `"MINTER_ROLE"`, `"BURNER_ROLE"`, `"PAUSER_ROLE"`, `"UPGRADER_ROLE"`.

### Key Features

- **Transfers Disabled by Default**: New tokens have transfers disabled by default. Only admins can transfer tokens until `setTransferable(true)` is called.
- **Role-Based Permissions**: Different operations require different roles, providing fine-grained access control.
- **Upgradeable**: Tokens can be upgraded to new implementations while preserving state and balances.
- **Pausable**: Token operations can be paused in emergency situations by accounts with the `PAUSER_ROLE`.

### Gas Optimization

The factory pattern significantly reduces deployment costs by deploying lightweight proxy contracts that delegate to a shared implementation contract, rather than deploying the full contract code for each token.

## Development Notes

The current SDK provides the essential functionality for token deployment and management. Additional methods like minting, burning, and query functions are available in the smart contract but not yet exposed through the SDK. 

For advanced use cases requiring these functions, you can interact with the contract directly using ethers.js and the exported TokenAbi. This allows full access to all contract functionality while we work on expanding the SDK coverage.

### Accessing Token ABI

```typescript
import { TokenAbi } from "@stratosphere-network/token/dist/utils/token";
```
