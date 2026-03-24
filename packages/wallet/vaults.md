# 🏦 RiftFi Vault SDK - Frontend Integration Guide

Complete guide for integrating RiftFi's Yield Vault into your frontend application.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [How It Works](#how-it-works)
3. [Quick Start](#quick-start)
4. [API Reference](#api-reference)
5. [Frontend Integration](#frontend-integration)
6. [React Examples](#react-examples)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)

---

## Overview

### What is RiftFi Vault?

RiftFi Vault is a **gasless yield aggregator** on Base network that allows users to:
- ✅ Deposit USDC and earn yield rewards
- ✅ Request withdrawals (processed in batches)
- ✅ Claim rewards (processed in batches)
- ✅ All transactions are **gasless** via smart wallet abstraction
- ✅ No ETH needed for gas fees!

### Key Features

| Feature | Description |
|---------|-------------|
| **Gasless Transactions** | Backend handles all gas fees via smart wallet API |
| **Automatic Approvals** | SDK automatically approves USDC spending if needed |
| **Batch Processing** | Withdrawals and claims processed daily by admin |
| **Real-time Stats** | Protocol TVL, deposits, rewards tracking |
| **Whitelist Support** | Smart wallet whitelisting for fund transfers |

---

## How It Works

### 🔄 Deposit Flow

```
1. User calls rift.vault.deposit({ amount: "100" })
   ↓
2. Backend derives user's smart wallet address from JWT
   ↓
3. Backend checks USDC allowance for vault contract
   ↓
4. If insufficient → Submit gasless approval via smart wallet
   ↓
5. Wait for allowance to update on-chain
   ↓
6. Submit deposit transaction to yield aggregator
   ↓
7. Return confirmation with transaction hashes
```

**Important:** The entire process is gasless. User doesn't need ETH!

### 💸 Withdrawal Flow

```
1. User calls rift.vault.withdraw({ amount: "50" })
   ↓
2. Withdrawal request queued in smart contract
   ↓
3. User's balance locked until processed
   ↓
4. Admin processes pending withdrawals (daily batches)
   ↓
5. USDC sent to user's smart wallet
```

**Note:** Users can cancel pending withdrawals before processing.

### 🎁 Claim Flow

```
1. User calls rift.vault.claimRewards()
   ↓
2. Claim request queued in smart contract
   ↓
3. Admin processes pending claims (daily batches)
   ↓
4. Rewards sent to user's smart wallet
```

**Note:** Users can cancel pending claims before processing.

---

## Quick Start

### 1. Installation

```bash
npm install @rift-finance/wallet
```

### 2. Initialize SDK

```typescript
import Rift, { Environment } from "@rift-finance/wallet";

const rift = new Rift({
  apiKey: "sk_your_api_key_here",
  environment: Environment.PRODUCTION
});
```

### 3. Authenticate User

```typescript
// Login
const loginResponse = await rift.auth.login({
  externalId: "user123",
  password: "password123"
});

// Set bearer token for authenticated requests
rift.setBearerToken(loginResponse.accessToken);
```

### 4. Start Using Vault

```typescript
// Get user's vault data
const vaultData = await rift.vault.getMyVaultData();
console.log(`Balance: ${vaultData.balance} USDC`);
console.log(`Rewards: ${vaultData.rewards} USDC`);

// Deposit
const deposit = await rift.vault.deposit({ amount: "100" });

// Claim rewards
const claim = await rift.vault.claimRewards();
```

---

## API Reference

### Protocol Statistics (Public - API Key Only)

#### `getProtocolStats()`
Get all protocol statistics in one call.

```typescript
const stats = await rift.vault.getProtocolStats();
// {
//   tvl: "1000000.00",
//   totalDeposits: "950000.00",
//   pendingRewards: "50000.00",
//   rewardsDistributed: "25000.00",
//   pendingClaimersCount: 5,
//   pendingWithdrawersCount: 3,
//   version: "1.1.0",
//   stablecoin: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
//   admin: "0xA8E138f613ed04Eb7229F43e8B0f05a91480A0fA"
// }
```

#### `getTvl()`
Get Total Value Locked.

```typescript
const { tvl } = await rift.vault.getTvl();
// { tvl: "1000000.00" }
```

#### `getTotalDeposits()`
Get total deposits across all users.

```typescript
const { totalDeposits } = await rift.vault.getTotalDeposits();
// { totalDeposits: "950000.00" }
```

#### `getPendingRewards()`
Get total pending rewards.

```typescript
const { pendingRewards } = await rift.vault.getPendingRewards();
// { pendingRewards: "50000.00" }
```

#### `getRewardsDistributed()`
Get cumulative rewards distributed.

```typescript
const { rewardsDistributed } = await rift.vault.getRewardsDistributed();
// { rewardsDistributed: "25000.00" }
```

#### `getPendingClaimersCount()`
Get number of users with pending claims.

```typescript
const { pendingClaimersCount } = await rift.vault.getPendingClaimersCount();
// { pendingClaimersCount: 5 }
```

#### `getPendingWithdrawersCount()`
Get number of users with pending withdrawals.

```typescript
const { pendingWithdrawersCount } = await rift.vault.getPendingWithdrawersCount();
// { pendingWithdrawersCount: 3 }
```

---

### Contract Information (Public - API Key Only)

#### `getContractVersion()`
```typescript
const { version } = await rift.vault.getContractVersion();
// { version: "1.1.0" }
```

#### `getStablecoinAddress()`
```typescript
const { stablecoin } = await rift.vault.getStablecoinAddress();
// { stablecoin: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" }
```

#### `getAdminAddress()`
```typescript
const { admin } = await rift.vault.getAdminAddress();
// { admin: "0xA8E138f613ed04Eb7229F43e8B0f05a91480A0fA" }
```

---

### User Data (Authenticated - API Key + JWT)

#### `getMyVaultData()`
Get all user vault data in one call.

```typescript
const data = await rift.vault.getMyVaultData();
// {
//   address: "0xD692AA908584135208EF8e15F6c63Ac0535A842b",
//   balance: "1000.00",
//   rewards: "50.00",
//   hasPendingClaim: false,
//   pendingWithdrawal: "0",
//   hasPendingWithdrawal: false
// }
```

#### `getMyBalance()`
```typescript
const { balance } = await rift.vault.getMyBalance();
// { balance: "1000.00" }
```

#### `getMyRewards()`
```typescript
const { rewards } = await rift.vault.getMyRewards();
// { rewards: "50.00" }
```

#### `getMyWhitelistStatus()`
```typescript
const status = await rift.vault.getMyWhitelistStatus();
// {
//   address: "0xD692AA908584135208EF8e15F6c63Ac0535A842b",
//   isWhitelisted: true
// }
```

---

### User Operations (Authenticated - API Key + JWT)

#### `deposit(request)`
Deposit USDC into the vault (gasless).

```typescript
const result = await rift.vault.deposit({ 
  amount: "100" // Human readable: "100" = 100 USDC
});

// Response:
// {
//   message: "Deposit successful",
//   ownerEOA: "0x1234...",
//   smartWalletAddress: "0xD692...",
//   approvalPerformed: true,
//   approval: {
//     success: true,
//     userOperationHash: "0xabcd..."
//   },
//   deposit: {
//     success: true,
//     transactionHash: "0x9876..."
//   }
// }
```

**Parameters:**
- `amount` (string): Human-readable amount (e.g., "100" for 100 USDC)

**Response Fields:**
- `approvalPerformed`: Whether USDC approval was needed
- `approval`: Approval transaction details (null if not needed)
- `deposit`: Deposit transaction details

#### `withdraw(request)`
Request withdrawal (queued for batch processing).

```typescript
const result = await rift.vault.withdraw({ 
  amount: "500" 
});

// Response:
// {
//   message: "Withdrawal request submitted",
//   success: true,
//   transactionHash: "0x1234..."
// }
```

**Note:** Withdrawal is queued. Admin processes batches daily.

#### `cancelWithdrawal()`
Cancel pending withdrawal.

```typescript
const result = await rift.vault.cancelWithdrawal();
// {
//   message: "Withdrawal request cancelled",
//   success: true,
//   transactionHash: "0xfedc..."
// }
```

#### `claimRewards()`
Request reward claim (queued for batch processing).

```typescript
const result = await rift.vault.claimRewards();
// {
//   message: "Claim request submitted",
//   success: true,
//   transactionHash: "0xabcd..."
// }
```

#### `cancelClaim()`
Cancel pending claim.

```typescript
const result = await rift.vault.cancelClaim();
// {
//   message: "Claim request cancelled",
//   success: true,
//   transactionHash: "0x0987..."
// }
```

---

## Frontend Integration

### State Management

#### React State Example

```typescript
import { useState, useEffect } from 'react';
import { UserVaultData } from '@rift-finance/wallet';

function VaultDashboard() {
  const [vaultData, setVaultData] = useState<UserVaultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVaultData();
  }, []);

  const loadVaultData = async () => {
    try {
      setLoading(true);
      const data = await rift.vault.getMyVaultData();
      setVaultData(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>My Vault</h2>
      <p>Balance: {vaultData?.balance} USDC</p>
      <p>Rewards: {vaultData?.rewards} USDC</p>
      {vaultData?.hasPendingWithdrawal && (
        <p>Pending Withdrawal: {vaultData.pendingWithdrawal} USDC</p>
      )}
    </div>
  );
}
```

---

## React Examples

### 1. Protocol Stats Dashboard

```typescript
import { useState, useEffect } from 'react';
import { ProtocolStats } from '@rift-finance/wallet';
import { rift } from './riftClient'; // Your initialized SDK

function ProtocolDashboard() {
  const [stats, setStats] = useState<ProtocolStats | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      const data = await rift.vault.getProtocolStats();
      setStats(data);
    };
    
    loadStats();
    // Refresh every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="protocol-stats">
      <h1>RiftFi Vault Stats</h1>
      
      <div className="stat-card">
        <h3>Total Value Locked</h3>
        <p className="value">${parseFloat(stats.tvl).toLocaleString()}</p>
      </div>
      
      <div className="stat-card">
        <h3>Total Deposits</h3>
        <p className="value">${parseFloat(stats.totalDeposits).toLocaleString()}</p>
      </div>
      
      <div className="stat-card">
        <h3>Pending Rewards</h3>
        <p className="value">${parseFloat(stats.pendingRewards).toLocaleString()}</p>
      </div>
      
      <div className="stat-card">
        <h3>Rewards Distributed</h3>
        <p className="value">${parseFloat(stats.rewardsDistributed).toLocaleString()}</p>
      </div>
      
      <div className="stat-card">
        <h3>Pending Operations</h3>
        <p>Claims: {stats.pendingClaimersCount}</p>
        <p>Withdrawals: {stats.pendingWithdrawersCount}</p>
      </div>
    </div>
  );
}
```

---

### 2. Deposit Component

```typescript
import { useState } from 'react';
import { VaultDepositResponse } from '@rift-finance/wallet';
import { rift } from './riftClient';

function DepositForm({ onSuccess }: { onSuccess: () => void }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VaultDepositResponse | null>(null);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const depositResult = await rift.vault.deposit({ amount });
      
      setResult(depositResult);
      setAmount('');
      
      // Show success message
      alert(`Deposit successful!\nTx: ${depositResult.deposit.transactionHash}`);
      
      // Refresh parent component
      onSuccess();
      
    } catch (err: any) {
      setError(err.message || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="deposit-form">
      <h2>Deposit USDC</h2>
      
      <form onSubmit={handleDeposit}>
        <div className="form-group">
          <label>Amount (USDC)</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="100"
            disabled={loading}
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Deposit'}
        </button>
      </form>
      
      {error && <div className="error">{error}</div>}
      
      {result && (
        <div className="success">
          <p>✅ Deposit Successful!</p>
          {result.approvalPerformed && (
            <p>Approval: {result.approval?.userOperationHash}</p>
          )}
          <p>Deposit: {result.deposit.transactionHash}</p>
          <a 
            href={`https://basescan.org/tx/${result.deposit.transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on BaseScan
          </a>
        </div>
      )}
    </div>
  );
}
```

---

### 3. Withdrawal Component

```typescript
import { useState } from 'react';
import { rift } from './riftClient';

interface WithdrawFormProps {
  currentBalance: string;
  hasPendingWithdrawal: boolean;
  onSuccess: () => void;
}

function WithdrawForm({ 
  currentBalance, 
  hasPendingWithdrawal, 
  onSuccess 
}: WithdrawFormProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (parseFloat(amount) > parseFloat(currentBalance)) {
      setError('Insufficient balance');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await rift.vault.withdraw({ amount });
      
      alert(`Withdrawal requested!\nAmount: ${amount} USDC\nProcessing time: ~24 hours`);
      setAmount('');
      onSuccess();
      
    } catch (err: any) {
      setError(err.message || 'Withdrawal request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelWithdrawal = async () => {
    try {
      setLoading(true);
      await rift.vault.cancelWithdrawal();
      alert('Withdrawal cancelled successfully!');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel withdrawal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="withdraw-form">
      <h2>Withdraw USDC</h2>
      
      <p>Available Balance: {currentBalance} USDC</p>
      
      {hasPendingWithdrawal ? (
        <div className="pending-withdrawal">
          <p>⏳ You have a pending withdrawal</p>
          <p>It will be processed within 24 hours</p>
          <button onClick={handleCancelWithdrawal} disabled={loading}>
            Cancel Withdrawal
          </button>
        </div>
      ) : (
        <form onSubmit={handleWithdraw}>
          <div className="form-group">
            <label>Amount (USDC)</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="50"
              max={currentBalance}
              disabled={loading}
            />
          </div>
          
          <button 
            type="button" 
            onClick={() => setAmount(currentBalance)}
            disabled={loading}
          >
            Max
          </button>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Processing...' : 'Request Withdrawal'}
          </button>
        </form>
      )}
      
      {error && <div className="error">{error}</div>}
      
      <div className="info">
        <p>ℹ️ Withdrawals are processed in batches every 24 hours</p>
      </div>
    </div>
  );
}
```

---

### 4. Claim Rewards Component

```typescript
import { useState } from 'react';
import { rift } from './riftClient';

interface ClaimRewardsProps {
  rewards: string;
  hasPendingClaim: boolean;
  onSuccess: () => void;
}

function ClaimRewards({ rewards, hasPendingClaim, onSuccess }: ClaimRewardsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClaim = async () => {
    if (parseFloat(rewards) <= 0) {
      setError('No rewards to claim');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await rift.vault.claimRewards();
      
      alert(`Claim requested!\nRewards: ${rewards} USDC\nProcessing time: ~24 hours`);
      onSuccess();
      
    } catch (err: any) {
      setError(err.message || 'Claim request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClaim = async () => {
    try {
      setLoading(true);
      await rift.vault.cancelClaim();
      alert('Claim cancelled successfully!');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel claim');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="claim-rewards">
      <h2>Claim Rewards</h2>
      
      <div className="rewards-display">
        <p>Pending Rewards</p>
        <h3>{rewards} USDC</h3>
      </div>
      
      {hasPendingClaim ? (
        <div className="pending-claim">
          <p>⏳ You have a pending claim request</p>
          <p>It will be processed within 24 hours</p>
          <button onClick={handleCancelClaim} disabled={loading}>
            Cancel Claim
          </button>
        </div>
      ) : (
        <button 
          onClick={handleClaim} 
          disabled={loading || parseFloat(rewards) <= 0}
        >
          {loading ? 'Processing...' : 'Claim Rewards'}
        </button>
      )}
      
      {error && <div className="error">{error}</div>}
      
      <div className="info">
        <p>ℹ️ Claims are processed in batches every 24 hours</p>
      </div>
    </div>
  );
}
```

---

### 5. Complete Vault Dashboard

```typescript
import { useState, useEffect } from 'react';
import { UserVaultData } from '@rift-finance/wallet';
import { rift } from './riftClient';
import DepositForm from './DepositForm';
import WithdrawForm from './WithdrawForm';
import ClaimRewards from './ClaimRewards';

function VaultDashboard() {
  const [vaultData, setVaultData] = useState<UserVaultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVaultData = async () => {
    try {
      setLoading(true);
      const data = await rift.vault.getMyVaultData();
      setVaultData(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVaultData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadVaultData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !vaultData) {
    return <div className="loading">Loading vault data...</div>;
  }

  if (error && !vaultData) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="vault-dashboard">
      <header>
        <h1>My Vault</h1>
        <button onClick={loadVaultData} disabled={loading}>
          {loading ? '🔄' : '↻'} Refresh
        </button>
      </header>

      {/* Balance Overview */}
      <div className="balance-overview">
        <div className="balance-card">
          <h3>Deposited Balance</h3>
          <p className="amount">{vaultData?.balance} USDC</p>
        </div>
        
        <div className="balance-card">
          <h3>Pending Rewards</h3>
          <p className="amount">{vaultData?.rewards} USDC</p>
        </div>
        
        <div className="balance-card">
          <h3>Total Value</h3>
          <p className="amount">
            {(parseFloat(vaultData?.balance || '0') + 
              parseFloat(vaultData?.rewards || '0')).toFixed(2)} USDC
          </p>
        </div>
      </div>

      {/* Status Indicators */}
      {vaultData?.hasPendingWithdrawal && (
        <div className="status-alert">
          ⏳ Pending Withdrawal: {vaultData.pendingWithdrawal} USDC
        </div>
      )}
      
      {vaultData?.hasPendingClaim && (
        <div className="status-alert">
          ⏳ Pending Claim in Progress
        </div>
      )}

      {/* Action Sections */}
      <div className="actions-grid">
        <DepositForm onSuccess={loadVaultData} />
        
        <WithdrawForm 
          currentBalance={vaultData?.balance || '0'}
          hasPendingWithdrawal={vaultData?.hasPendingWithdrawal || false}
          onSuccess={loadVaultData}
        />
        
        <ClaimRewards 
          rewards={vaultData?.rewards || '0'}
          hasPendingClaim={vaultData?.hasPendingClaim || false}
          onSuccess={loadVaultData}
        />
      </div>

      {/* Smart Wallet Info */}
      <div className="wallet-info">
        <p>Smart Wallet: {vaultData?.address}</p>
      </div>
    </div>
  );
}

export default VaultDashboard;
```

---

## Error Handling

### Common Errors

```typescript
try {
  await rift.vault.deposit({ amount: "100" });
} catch (error: any) {
  // Handle specific errors
  if (error.message?.includes('amount is required')) {
    console.error('Missing amount parameter');
  } else if (error.message?.includes('Unauthorized')) {
    console.error('JWT token missing or invalid');
    // Redirect to login
  } else if (error.message?.includes('Allowance not updated')) {
    console.error('Approval transaction failed');
  } else if (error.message?.includes('insufficient')) {
    console.error('Insufficient balance');
  } else {
    console.error('Unknown error:', error.message);
  }
}
```

### Error Handler Utility

```typescript
interface VaultError {
  type: 'auth' | 'validation' | 'insufficient' | 'network' | 'unknown';
  message: string;
  userMessage: string;
}

function handleVaultError(error: any): VaultError {
  const message = error.message || error.toString();
  
  if (message.includes('Unauthorized') || message.includes('401')) {
    return {
      type: 'auth',
      message,
      userMessage: 'Please log in again to continue'
    };
  }
  
  if (message.includes('amount is required') || message.includes('400')) {
    return {
      type: 'validation',
      message,
      userMessage: 'Please check your input and try again'
    };
  }
  
  if (message.includes('insufficient') || message.includes('No rewards')) {
    return {
      type: 'insufficient',
      message,
      userMessage: 'Insufficient balance or rewards'
    };
  }
  
  if (message.includes('network') || message.includes('timeout')) {
    return {
      type: 'network',
      message,
      userMessage: 'Network error. Please try again'
    };
  }
  
  return {
    type: 'unknown',
    message,
    userMessage: 'An error occurred. Please try again later'
  };
}

// Usage
try {
  await rift.vault.deposit({ amount: "100" });
} catch (error) {
  const vaultError = handleVaultError(error);
  
  if (vaultError.type === 'auth') {
    // Redirect to login
    router.push('/login');
  } else {
    // Show user-friendly message
    toast.error(vaultError.userMessage);
  }
  
  // Log technical details
  console.error(vaultError.message);
}
```

---

## Best Practices

### 1. **Auto-refresh Data**

```typescript
useEffect(() => {
  const loadData = async () => {
    const data = await rift.vault.getMyVaultData();
    setVaultData(data);
  };
  
  loadData();
  
  // Refresh every 30 seconds
  const interval = setInterval(loadData, 30000);
  return () => clearInterval(interval);
}, []);
```

### 2. **Loading States**

Always show loading indicators for better UX:

```typescript
const [loading, setLoading] = useState(false);

const handleDeposit = async () => {
  setLoading(true);
  try {
    await rift.vault.deposit({ amount });
  } finally {
    setLoading(false); // Always clear loading state
  }
};
```

### 3. **Input Validation**

Validate user input before API calls:

```typescript
const validateAmount = (amount: string): string | null => {
  if (!amount) return 'Amount is required';
  
  const num = parseFloat(amount);
  if (isNaN(num)) return 'Invalid amount';
  if (num <= 0) return 'Amount must be greater than 0';
  if (num > parseFloat(currentBalance)) return 'Insufficient balance';
  
  return null; // Valid
};

const handleDeposit = async () => {
  const error = validateAmount(amount);
  if (error) {
    setError(error);
    return;
  }
  
  // Proceed with deposit
  await rift.vault.deposit({ amount });
};
```

### 4. **Transaction Links**

Always provide blockchain explorer links:

```typescript
const getExplorerUrl = (txHash: string) => {
  return `https://basescan.org/tx/${txHash}`;
};

// In component
{result && (
  <a href={getExplorerUrl(result.deposit.transactionHash)} target="_blank">
    View Transaction
  </a>
)}
```

### 5. **Pending Status Indicators**

Show clear pending states:

```typescript
{vaultData?.hasPendingWithdrawal && (
  <div className="alert alert-warning">
    <p>⏳ Withdrawal pending: {vaultData.pendingWithdrawal} USDC</p>
    <p>Processing time: ~24 hours</p>
    <button onClick={handleCancelWithdrawal}>Cancel</button>
  </div>
)}
```

### 6. **Optimistic Updates**

Update UI immediately, then sync with backend:

```typescript
const handleClaim = async () => {
  // Optimistic update
  setVaultData(prev => prev ? {
    ...prev,
    hasPendingClaim: true
  } : null);
  
  try {
    await rift.vault.claimRewards();
    // Success - optimistic update was correct
  } catch (error) {
    // Revert optimistic update
    loadVaultData(); // Fetch fresh data
    throw error;
  }
};
```

### 7. **Number Formatting**

Format numbers for better readability:

```typescript
const formatUSDC = (amount: string): string => {
  const num = parseFloat(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  }).format(num);
};

// Usage
<p>Balance: {formatUSDC(vaultData.balance)}</p>
```

### 8. **Confirmation Dialogs**

Confirm important actions:

```typescript
const handleWithdraw = async () => {
  const confirmed = window.confirm(
    `Withdraw ${amount} USDC?\n\n` +
    `This will be processed within 24 hours.\n` +
    `You can cancel before processing.`
  );
  
  if (!confirmed) return;
  
  await rift.vault.withdraw({ amount });
};
```

---

## UI/UX Recommendations

### Display Protocol Stats

Show users the overall protocol health:

```tsx
<div className="protocol-stats-mini">
  <div>TVL: ${stats.tvl}</div>
  <div>APY: {calculateAPY()}%</div>
</div>
```

### Show Transaction History

Keep track of user actions:

```tsx
interface VaultAction {
  type: 'deposit' | 'withdraw' | 'claim';
  amount: string;
  timestamp: Date;
  txHash: string;
  status: 'pending' | 'completed';
}

// Store in state and display
<div className="transaction-history">
  {actions.map(action => (
    <div key={action.txHash}>
      {action.type}: {action.amount} USDC - {action.status}
    </div>
  ))}
</div>
```

### APY Calculator

Show users potential earnings:

```tsx
function APYCalculator({ currentAPY }: { currentAPY: number }) {
  const [amount, setAmount] = useState('1000');
  
  const yearlyEarnings = parseFloat(amount) * (currentAPY / 100);
  const monthlyEarnings = yearlyEarnings / 12;
  
  return (
    <div className="apy-calculator">
      <h3>Earnings Calculator</h3>
      <input 
        type="number" 
        value={amount} 
        onChange={(e) => setAmount(e.target.value)}
      />
      <p>Yearly: ${yearlyEarnings.toFixed(2)}</p>
      <p>Monthly: ${monthlyEarnings.toFixed(2)}</p>
    </div>
  );
}
```

---

## Testing

### Unit Test Example

```typescript
import { rift } from './riftClient';

describe('Vault Service', () => {
  beforeAll(() => {
    // Set up authentication
    rift.setBearerToken('test_token');
  });

  it('should fetch vault data', async () => {
    const data = await rift.vault.getMyVaultData();
    expect(data).toHaveProperty('balance');
    expect(data).toHaveProperty('rewards');
  });

  it('should deposit USDC', async () => {
    const result = await rift.vault.deposit({ amount: '100' });
    expect(result.deposit.success).toBe(true);
    expect(result).toHaveProperty('deposit.transactionHash');
  });

  it('should validate amount before deposit', () => {
    const validate = (amount: string) => {
      if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Invalid amount');
      }
    };
    
    expect(() => validate('')).toThrow('Invalid amount');
    expect(() => validate('0')).toThrow('Invalid amount');
    expect(() => validate('100')).not.toThrow();
  });
});
```

---

## Support

For issues or questions:
- 📧 Email: support@riftfi.xyz
- 🌐 Website: https://riftfi.xyz
- 📚 Docs: https://docs.riftfi.xyz

---

**Happy Building! 🚀**

