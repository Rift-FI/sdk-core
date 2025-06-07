# @stratosphere-network/token

This package provides a `Token` class to deploy and manage upgradeable ERC20 tokens on supported blockchains using the UUPS proxy pattern.

## Features

- **Upgradeable Tokens**: Deploy tokens as UUPS proxies, allowing you to upgrade the underlying contract logic later without requiring users to migrate.
- **Role-Based Access Control**: Manage permissions with distinct roles (`MINTER_ROLE`, `BURNER_ROLE`, `PAUSER_ROLE`, `UPGRADER_ROLE`) instead of a single owner.
- **Factory-Based Deployment**: A central factory contract deploys lightweight proxy contracts, saving significant gas fees for your users.
- **Comprehensive SDK**: A simple SDK to handle deployment, role management, feature toggling, and upgrades.

## Installation

To install the package, you can use npm or yarn:

```bash
npm install @stratosphere-network/token
# or
yarn add @stratosphere-network/token
```

## Usage

First, import the `Token` class and the necessary types from the package. If you plan to use an existing `ethers.Wallet` instance, you'll also need to import `ethers`:

```typescript
import Token, { TokenConfig, Chain } from "@stratosphere-network/token";
import { ethers } from "ethers"; // Required if providing your own ethers.Wallet instance
```

Next, create an instance of the `Token` class:

```typescript
const sdk = new Token();
```

### 1. Deploying an Upgradeable Token

To deploy a new token, provide a `tokenConfig` object. The `deployToken` method returns an object containing the `transactionHash` and the `tokenAddress` of the newly created proxy contract.

The address that deploys the token will automatically be granted the `DEFAULT_ADMIN_ROLE`, as well as the `MINTER_ROLE`, `BURNER_ROLE`, `PAUSER_ROLE`, and `UPGRADER_ROLE`.

Currently, token deployment is **only supported on Berachain Mainnet**.

```typescript
// Ensure sdk is instantiated as shown above.

async function deployNewToken() {
  const tokenConfig: TokenConfig = {
    name: "My Upgradeable Token",
    symbol: "MUT",
    totalSupply: "1000000000000000000000000", // 1 million tokens with 18 decimals
    decimals: 18,
    chain: Chain.BERACHAIN_MAINNET,
  };

  // Provide the private key of the deployer's account.
  // Ensure this account has enough native currency (e.g., BERA) to pay for gas.
  const deployerPrivateKey = "YOUR_DEPLOYER_PRIVATE_KEY";

  try {
    console.log("Attempting to deploy token...");
    const { transactionHash, tokenAddress } = await sdk.deployToken(
      tokenConfig,
      deployerPrivateKey
    );
    console.log("Token deployment successful!");
    console.log(`  - Transaction Hash: ${transactionHash}`);
    console.log(`  - Token Proxy Address: ${tokenAddress}`); // This is the address to interact with
    return tokenAddress;
  } catch (error) {
    console.error("Error deploying token:", error);
  }
}
```

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
await sdk.grantRole(
  Chain.BERACHAIN_MAINNET,
  tokenAddress,
  "MINTER_ROLE",
  anotherAddress,
  adminPrivateKey
);
console.log("MINTER_ROLE granted.");

// Check if an address has a role
const hasRole = await sdk.hasRole(
  Chain.BERACHAIN_MAINNET,
  tokenAddress,
  "MINTER_ROLE",
  anotherAddress
);
console.log(`Does the address have MINTER_ROLE? ${hasRole}`); // true

// Revoke the MINTER_ROLE
await sdk.revokeRole(
  Chain.BERACHAIN_MAINNET,
  tokenAddress,
  "MINTER_ROLE",
  anotherAddress,
  adminPrivateKey
);
console.log("MINTER_ROLE revoked.");
```

#### Feature Control

Enable or disable token transfers, and pause or unpause the contract.

```typescript
const tokenAddress = "0xYourTokenProxyAddress";
const pauserPrivateKey = "YOUR_DEPLOYER_PRIVATE_KEY"; // The key of an address with PAUSER_ROLE
const adminPrivateKey = "YOUR_DEPLOYER_PRIVATE_KEY"; // The key of an address with DEFAULT_ADMIN_ROLE

// Enable token transfers for all users
await sdk.setTransferable(
  Chain.BERACHAIN_MAINNET,
  tokenAddress,
  true,
  adminPrivateKey
);
console.log("Token transfers are now enabled for everyone.");

// Pause the contract
await sdk.pause(Chain.BERACHAIN_MAINNET, tokenAddress, pauserPrivateKey);
console.log("Contract is paused.");

// Unpause the contract
await sdk.unpause(Chain.BERACHAIN_MAINNET, tokenAddress, pauserPrivateKey);
console.log("Contract is unpaused.");
```

### 3. Upgrading the Token

If you deploy a new version of the `Token.sol` implementation contract, you can upgrade your proxies to point to the new logic.

```typescript
const tokenAddress = "0xYourTokenProxyAddress";
const newImplementationAddress = "0x...addressOfNewTokenImplementation";
const upgraderPrivateKey = "YOUR_DEPLOYER_PRIVATE_KEY"; // The key of an address with UPGRADER_ROLE

await sdk.upgradeTo(
  Chain.BERACHAIN_MAINNET,
  tokenAddress,
  newImplementationAddress,
  upgraderPrivateKey
);
console.log("Token proxy has been upgraded to the new implementation!");
```

## API Reference

### `TokenConfig` Parameters

- `name` (string): The name of your token (e.g., "My Upgradeable Token").
- `symbol` (string): The symbol for your token (e.g., "MUT").
- `totalSupply` (string): The initial supply of your token, expressed as a string in its smallest unit (e.g., wei for an 18-decimal token). This supply is minted to the deployer.
- `decimals` (number): The number of decimal places your token will have (typically 18).
- `chain` (Chain): The chain to deploy the token on. Currently, only `Chain.BERACHAIN_MAINNET` is supported.

### SDK Methods

All methods that perform on-chain transactions require either a `deployerPrivateKey` or a `walletInstance` to be passed as the final argument.

- `deployToken(config, privateKey?, wallet?)`: Deploys a new token proxy. Returns `{ transactionHash, tokenAddress }`.
- `grantRole(chain, tokenAddress, role, toAddress, ...)`: Grants a role to an address.
- `revokeRole(chain, tokenAddress, role, fromAddress, ...)`: Revokes a role from an address.
- `hasRole(chain, tokenAddress, role, address)`: Checks if an address has a specific role. Returns a boolean.
- `setTransferable(chain, tokenAddress, isTransferable, ...)`: Enables or disables token transfers for non-admins.
- `pause(chain, tokenAddress, ...)`: Pauses all token transfers, mints, and burns.
- `unpause(chain, tokenAddress, ...)`: Resumes a paused contract.
- `upgradeTo(chain, tokenAddress, newImplementation, ...)`: Upgrades the token proxy to a new implementation contract.

`role` parameter must be one of: `"MINTER_ROLE"`, `"BURNER_ROLE"`, `"PAUSER_ROLE"`, `"UPGRADER_ROLE"`.
