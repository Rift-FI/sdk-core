# @stratosphere-network/stake

This package provides a `Stake` class to deploy and manage PST staking systems on supported blockchains with complete yield farming and token management functionality.

## Features

- **Complete Staking System**: Deploy and manage PST staking contracts with Super Senior and Junior tranches
- **Token Integration**: Automatic PST/PSTJ token minting and burning based on staking positions
- **Role-Based Access Control**: Comprehensive role management for staking, investment, and liquidity operations
- **Yield Management**: Built-in rebasing and reward distribution mechanisms
- **SDK-First Approach**: Clean, type-safe API for all staking operations
- **Local Testing**: Full deployment and testing capabilities for development

## Installation

```bash
npm install @stratosphere-network/stake
# or
yarn add @stratosphere-network/stake
```

## Supported Chains

Staking is currently supported on the following chains:

- **Berachain Mainnet** (`Chain.BERACHAIN_MAINNET`)
- **Berachain Testnet** (`Chain.BERACHAIN_TESTNET`) 
- **Ethereum Sepolia** (`Chain.ETHEREUM_SEPOLIA`)

Additional chains may be supported in future releases.

## Usage

First, import the `Stake` class and necessary types:

```typescript
import Stake, { StakingConfig, DeploymentConfig, Chain, Tranche } from "@stratosphere-network/stake";
import { ethers } from "ethers"; // Required if providing your own ethers.Wallet instance
```

Next, create an instance of the `Stake` class:

```typescript
const stakeClient = new Stake();
```

### 1. Deploying a Staking System (Local Testing)

For local development and testing, you can deploy a complete staking system:

```typescript
async function deployStakingSystem() {
  const deploymentConfig: DeploymentConfig = {
    stablecoinAddress: "0x...", // Address of USDC or other stablecoin
    treasuryAddress: "0x...",   // Treasury address for fees and penalties
    chain: Chain.BERACHAIN_TESTNET
  };

  const deployment = await stakeClient.deployStakingSystemLocal(
    deploymentConfig,
    "YOUR_DEPLOYER_PRIVATE_KEY"
  );

  console.log("Staking system deployed:", deployment);
  return deployment;
}
```

### 2. Staking Operations

#### Stake in Super Senior Tranche

```typescript
async function stakeInSuperSenior() {
  const stakingConfig: StakingConfig = {
    amount: "1000000000", // 1000 USDC (6 decimals)
    tranche: Tranche.SUPER_SENIOR,
    chain: Chain.BERACHAIN_TESTNET
  };

  const result = await stakeClient.stake(
    stakingConfig,
    "STAKING_CONTRACT_ADDRESS",
    "USER_PRIVATE_KEY"
  );

  console.log("Stake successful:", result);
  // User will receive PST tokens representing their Super Senior position
}
```

#### Stake in Junior Tranche

```typescript
async function stakeInJunior() {
  const stakingConfig: StakingConfig = {
    amount: "500000000", // 500 USDC (6 decimals)
    tranche: Tranche.JUNIOR,
    chain: Chain.BERACHAIN_TESTNET
  };

  const result = await stakeClient.stake(
    stakingConfig,
    "STAKING_CONTRACT_ADDRESS",
    "USER_PRIVATE_KEY"
  );

  console.log("Stake successful:", result);
  // User will receive PSTJ tokens representing their Junior position
}
```

### 3. Withdrawal Operations

```typescript
async function withdrawStake() {
  const withdrawAmount = "100000000"; // 100 USDC (6 decimals)
  
  const result = await stakeClient.withdraw(
    Chain.BERACHAIN_TESTNET,
    "STAKING_CONTRACT_ADDRESS",
    withdrawAmount,
    "USER_PRIVATE_KEY"
  );

  console.log("Withdrawal successful:", result);
  // Corresponding PST/PSTJ tokens will be burned automatically
}
```

### 4. Balance and Information Queries

#### Get PST Balance (Super Senior Position)

```typescript
async function getPSTBalance() {
  const balance = await stakeClient.getPSTBalance(
    Chain.BERACHAIN_TESTNET,
    "STAKING_CONTRACT_ADDRESS",
    "USER_ADDRESS"
  );
  
  console.log("PST Balance:", ethers.formatUnits(balance, 6));
}
```

#### Get PSTJ Balance (Junior Position)

```typescript
async function getPSTJBalance() {
  const balance = await stakeClient.getPSTJBalance(
    Chain.BERACHAIN_TESTNET,
    "STAKING_CONTRACT_ADDRESS",
    "USER_ADDRESS"
  );
  
  console.log("PSTJ Balance:", ethers.formatUnits(balance, 6));
}
```

#### Get Stake Information

```typescript
async function getStakeInfo() {
  const stakeInfo = await stakeClient.getStakeInfo(
    Chain.BERACHAIN_TESTNET,
    "STAKING_CONTRACT_ADDRESS",
    "USER_ADDRESS"
  );
  
  console.log("Stake Info:", {
    amount: ethers.formatUnits(stakeInfo.amount, 6),
    tranche: stakeInfo.tranche === Tranche.SUPER_SENIOR ? "Super Senior" : "Junior",
    stakeTimestamp: new Date(stakeInfo.stakeTimestamp * 1000).toISOString(),
    accruedRewards: ethers.formatUnits(stakeInfo.accruedRewards, 6)
  });
}
```

#### Get Total Collateral

```typescript
async function getTotalCollateral() {
  const totalCollateral = await stakeClient.getTotalCollateral(
    Chain.BERACHAIN_TESTNET,
    "STAKING_CONTRACT_ADDRESS"
  );
  
  console.log("Total Collateral:", ethers.formatUnits(totalCollateral, 6), "USDC");
}
```

### 5. Administrative Operations

#### Role Management

```typescript
async function grantMinterRole() {
  await stakeClient.grantRole(
    Chain.BERACHAIN_TESTNET,
    "PST_TOKEN_ADDRESS",
    "MINTER_ROLE",
    "STAKING_CONTRACT_ADDRESS",
    "ADMIN_PRIVATE_KEY",
    undefined,
    "pst"
  );
  
  console.log("Minter role granted to staking contract");
}

async function checkRole() {
  const hasRole = await stakeClient.hasRole(
    Chain.BERACHAIN_TESTNET,
    "PST_TOKEN_ADDRESS",
    "MINTER_ROLE",
    "STAKING_CONTRACT_ADDRESS",
    "pst"
  );
  
  console.log("Has minter role:", hasRole);
}
```

#### Contract Management

```typescript
async function pauseStaking() {
  await stakeClient.pause(
    Chain.BERACHAIN_TESTNET,
    "STAKING_CONTRACT_ADDRESS",
    "ADMIN_PRIVATE_KEY"
  );
  
  console.log("Staking paused");
}

async function unpauseStaking() {
  await stakeClient.unpause(
    Chain.BERACHAIN_TESTNET,
    "STAKING_CONTRACT_ADDRESS",
    "ADMIN_PRIVATE_KEY"
  );
  
  console.log("Staking unpaused");
}
```

#### Yield Management

```typescript
async function triggerRebase() {
  await stakeClient.rebase(
    Chain.BERACHAIN_TESTNET,
    "STAKING_CONTRACT_ADDRESS",
    "REBASER_PRIVATE_KEY"
  );
  
  console.log("Rebase triggered");
}
```

## Complete Example

```typescript
import Stake, { Chain, Tranche } from "@stratosphere-network/stake";
import { ethers } from "ethers";

async function completeStakingExample() {
  const stakeClient = new Stake();
  
  // 1. Deploy staking system (for testing)
  const deployment = await stakeClient.deployStakingSystemLocal({
    stablecoinAddress: "0x...",
    treasuryAddress: "0x...",
    chain: Chain.BERACHAIN_TESTNET
  }, "DEPLOYER_PRIVATE_KEY");
  
  // 2. Stake in Super Senior tranche
  await stakeClient.stake({
    amount: ethers.parseUnits("1000", 6).toString(),
    tranche: Tranche.SUPER_SENIOR,
    chain: Chain.BERACHAIN_TESTNET
  }, deployment.pstStaking, "USER_PRIVATE_KEY");
  
  // 3. Check PST balance
  const balance = await stakeClient.getPSTBalance(
    Chain.BERACHAIN_TESTNET,
    deployment.pstStaking,
    "USER_ADDRESS"
  );
  console.log("PST Balance:", ethers.formatUnits(balance, 6));
  
  // 4. Withdraw after lockup period
  await stakeClient.withdraw(
    Chain.BERACHAIN_TESTNET,
    deployment.pstStaking,
    ethers.parseUnits("100", 6).toString(),
    "USER_PRIVATE_KEY"
  );
}
```

## Testing

Run the comprehensive SDK test:

```bash
# Build the SDK first
npm run build

# Run the test script
npx hardhat run scripts/test-staking-sdk.js --network localhost
```

## Tranches Explained

### Super Senior Tranche
- **Token**: PST
- **Risk**: Lower risk, protected position
- **APY**: Fixed at 11%
- **Priority**: First in line for withdrawals and yield distribution

### Junior Tranche  
- **Token**: PSTJ
- **Risk**: Higher risk, buffer for Super Senior
- **APY**: Variable (5-100% based on performance)
- **Priority**: Absorbs losses first, higher upside potential

## Error Handling

The SDK includes comprehensive error handling. Common errors include:

- `"Chain is required"` - Missing chain parameter
- `"Private key or wallet instance is required"` - Missing authentication
- `"Lockup period active"` - Attempting to withdraw before lockup expires
- `"Insufficient staked amount"` - Attempting to withdraw more than staked

## Development and Testing

This package includes full testing capabilities for local development:

1. **Unit Tests**: Run `npm test` for comprehensive SDK testing
2. **Integration Tests**: Use `scripts/test-staking-sdk.js` for full system testing
3. **Local Deployment**: Use `deployStakingSystemLocal()` for development

## License

MIT

## Contributing

Please read our contributing guidelines and submit issues or pull requests to help improve this SDK. 