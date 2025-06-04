# @stratosphere-network/token

This package provides a `Token` class to deploy standard ERC20 tokens on supported blockchains.

## Installation

To install the package, you can use npm or yarn:

```bash
npm install @stratosphere-network/token
# or
yarn add @stratosphere-network/token
```

## Usage

First, import the `Token` class and the necessary types from the package. If you plan to use an existing `ethers.Wallet` instance for deployment, you'll also need to import `ethers`:

```typescript
import Token, { TokenConfig, Chain } from "@stratosphere-network/token";
import { ethers } from "ethers"; // Required if providing your own ethers.Wallet instance
```

Next, create an instance of the `Token` class:

```typescript
const tokenClient = new Token();
```

### Deploying a Token

To deploy a new token, you'll need to provide a `tokenConfig` object. The deployer's credentials for the `deployToken` method can be supplied in one of the following ways:

1.  `deployerPrivateKey` (string, optional): The private key of the deployer's account.
2.  `walletInstance` (`ethers.Wallet`, optional): An existing `ethers.Wallet` object from the `ethers` library.

You must provide at least one of these to the `deployToken` method.

- If only `deployerPrivateKey` is provided, a new `ethers.Wallet` is created internally using a default provider for the specified chain.
- If only `walletInstance` is provided, that instance is used directly for deploying.
- If both `deployerPrivateKey` and `walletInstance` are provided, a new `ethers.Wallet` is created using the `deployerPrivateKey` and the provider from the supplied `walletInstance`.

Currently, token deployment is **only supported on Berachain Mainnet**.

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
    isMintable: true, // Optional: Can the token supply be increased after deployment? Defaults to false.
    isBurnable: true, // Optional: Can tokens be burned to reduce supply? Defaults to false.
    isPausable: false, // Optional: Can token transfers be paused? Defaults to false.
  };

  // --- Option 1: Using deployerPrivateKey (simplest for quick start) ---
  const deployerPrivateKey = "YOUR_DEPLOYER_PRIVATE_KEY"; // Replace with actual private key
  try {
    console.log("Attempting to deploy with private key...");
    const txHashPk = await tokenClient.deployToken(
      tokenConfig,
      deployerPrivateKey
      // walletInstance is omitted or undefined here
    );
    console.log(
      "Token deployment with private key successful! Transaction Hash:",
      txHashPk
    );
  } catch (error) {
    console.error("Error deploying token with private key:", error);
  }

  // --- Option 2: Using an existing ethers.Wallet instance ---
  // This requires 'ethers' to be imported and a wallet instance prepared.
  // Example setup (replace with your actual provider and private key/mnemonic):
  /*
  // Ensure ethers is imported: import { ethers } from "ethers";
  // const BERACHAIN_RPC_URL = "https://mainnet.rpc.berachain.com/"; // Replace with actual official RPC for Berachain
  // const provider = new ethers.JsonRpcProvider(BERACHAIN_RPC_URL);
  // const existingWallet = new ethers.Wallet(deployerPrivateKey, provider); // Or from a connected wallet like MetaMask

  try {
    console.log("Attempting to deploy with wallet instance...");
    // Note: Pass undefined for deployerPrivateKey if primarily using walletInstance
    const txHashWallet = await tokenClient.deployToken(
      tokenConfig,
      undefined, 
      existingWallet
    );
    console.log(
      "Token deployment with wallet instance successful! Transaction Hash:",
      txHashWallet
    );
  } catch (error) {
    console.error("Error deploying token with wallet instance:", error);
  }
  */
}

deployMyToken();
```

**Note:** Ensure your deployer account has enough native currency (e.g., BERA on Berachain) to cover the gas fees for the deployment transaction.

### TokenConfig Parameters

- `name` (string): The name of your token (e.g., "My Awesome Token").
- `symbol` (string): The symbol for your token (e.g., "MAT").
- `totalSupply` (string): The total supply of your token, expressed as a string in its smallest unit (e.g., wei for an 18-decimal token).
- `decimals` (number): The number of decimal places your token will have (typically 18).
- `chain` (Chain): The chain to deploy the token on. Currently, only `Chain.BERACHAIN_MAINNET` is supported.
- `isMintable` (boolean, optional): Determines if new tokens can be minted after initial deployment. Defaults to `false` if not specified.
- `isBurnable` (boolean, optional): Determines if tokens can be burned (destroyed) after deployment. Defaults to `false` if not specified.
- `isPausable` (boolean, optional): Determines if token transfers and other operations can be paused. Defaults to `false` if not specified.
