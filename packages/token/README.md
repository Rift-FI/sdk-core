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

First, import the `Token` class and the necessary types from the package:

```typescript
import Token, { TokenConfig, Chain } from "@stratosphere-network/token";
```

Next, create an instance of the `Token` class:

```typescript
const tokenClient = new Token();
```

### Deploying a Token

To deploy a new token, you'll need to provide a configuration object and the deployer's private key. Currently, token deployment is **only supported on Berachain Mainnet**.

```typescript
async function deployMyToken() {
  const deployerPrivateKey = "YOUR_DEPLOYER_PRIVATE_KEY"; // Replace with the actual private key

  const tokenConfig: TokenConfig = {
    name: "My Awesome Token",
    symbol: "MAT",
    totalSupply: "1000000000000000000000000", // 1 million tokens with 18 decimals (1000000 * 10^18)
    decimals: 18,
    chain: Chain.BERACHAIN_MAINNET,
    isMintable: true, // Optional: Can the token supply be increased after deployment? Defaults to false.
    isBurnable: true, // Optional: Can tokens be burned to reduce supply? Defaults to false.
    isPausable: false, // Optional: Can token transfers be paused? Defaults to false.
  };

  try {
    const transactionHash = await tokenClient.deployToken(
      tokenConfig,
      deployerPrivateKey
    );
    console.log(
      "Token deployment successful! Transaction Hash:",
      transactionHash
    );
    return transactionHash;
  } catch (error) {
    console.error("Error deploying token:", error);
    throw error;
  }
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
