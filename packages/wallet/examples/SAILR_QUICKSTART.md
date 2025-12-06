# 🚀 SAIL.R Trading Quick Start Guide

Complete guide for buying and selling SAIL.R tokens using the Rift SDK.

---

## 📋 Overview

The SAIL.R service enables gasless trading of SAIL.R tokens with USDC across Base and Berachain networks. The system automatically handles:

- ✅ USDC transfers between smart wallet and EOA
- ✅ Gas funding on both chains
- ✅ Router approvals
- ✅ Cross-chain swaps
- ✅ Gas refunds to relayer

---

## 🔧 Setup

```typescript
import { Rift, Environment } from "@riftfinance/sdk";

const rift = new Rift({
  apiKey: "your-api-key",
  environment: Environment.PRODUCTION,
});

// Set bearer token after authentication
rift.setBearerToken("your-jwt-token");
```

---

## 💰 Buying SAIL.R

### 1. Get a Quote

```typescript
const quote = await rift.sailr.getBuyQuote("1000000"); // 1 USDC (6 decimals)

console.log("Total Cost:", quote.quote.totalUsdcNeededFormatted);
console.log("You'll receive:", quote.quote.estimatedSailRFormatted);
console.log("Can execute:", quote.quote.canExecute);
```

**Response Structure:**

```typescript
{
  success: true,
  quote: {
    usdcToSwap: 1000000,
    usdcToSwapFormatted: "1 USDC",
    fees: {
      gasRefund: 2200001,
      gasRefundFormatted: "2.200001 USDC",
      ethGas: "0.000654383881216238",
      beraGas: "1.0"
    },
    totalUsdcNeeded: 3200001,
    totalUsdcNeededFormatted: "3.200001 USDC",
    balances: {
      smartWallet: 5000000,
      smartWalletFormatted: "5 USDC",
      eoa: 0,
      eoaFormatted: "0 USDC",
      needsTransfer: true,
      transferAmount: 3200001,
      transferAmountFormatted: "3.200001 USDC"
    },
    estimatedSailR: "68263613975780279",
    estimatedSailRFormatted: "0.068263613975780279 SAIL.R",
    route: {
      isMultiHop: false,
      steps: 1,
      provider: "enso"
    },
    canExecute: true,
    warnings: []
  },
  priceInfo: {
    usdcPerSailR: 14.64972,
    effectiveRate: "1 SAIL.R ≈ 0.014650 USDC"
  }
}
```

---

### 2. Execute Buy

```typescript
const result = await rift.sailr.buy({
  amount: "1000000", // 1 USDC (6 decimals)
});

console.log("Success:", result.success);
console.log("SAIL.R sent to:", result.eoaAddress);
console.log("Swap TX:", result.swapTransactions[0]);
```

**Response Structure:**

```typescript
{
  success: true,
  message: "SAIL.R purchase completed successfully",
  smartWalletToEOA: "0x1234567890abcdef...", // If transfer was needed
  swapTransactions: ["0xabcdef1234567890..."],
  refund: {
    ethSent: "0.000654383881216238",
    beraSent: "1.0",
    refundTxHash: "0xfedcba0987654321..."
  },
  estimatedSailR: "68263613975780279",
  eoaAddress: "0xC9AA473460C6b9A1f502e1488d4A9A35E6014efb"
}
```

---

## 📤 Selling SAIL.R

### 1. Get a Quote

```typescript
const quote = await rift.sailr.getSellQuote("5000000000000000"); // 0.005 SAIL.R (18 decimals)

console.log("Gross USDC:", quote.quote.estimatedUsdcGrossFormatted);
console.log("Net USDC:", quote.quote.estimatedUsdcNetFormatted);
console.log("Can execute:", quote.quote.canExecute);
```

**Response Structure:**

```typescript
{
  success: true,
  quote: {
    sailrToSell: "5000000000000000",
    sailrToSellFormatted: "0.005 SAIL.R",
    estimatedUsdcGross: 73250,
    estimatedUsdcGrossFormatted: "0.07325 USDC",
    fees: {
      gasRefund: 2200001,
      gasRefundFormatted: "2.200001 USDC",
      ethGas: "0.000654383881216238",
      beraGas: "0"
    },
    estimatedUsdcNet: -2126751,
    estimatedUsdcNetFormatted: "-2.126751 USDC",
    balances: {
      sailrInEoa: "9129102765263455",
      sailrInEoaFormatted: "0.009129102765263455 SAIL.R",
      hasSufficientSailr: true
    },
    route: {
      isMultiHop: false,
      steps: 1,
      provider: "enso"
    },
    canExecute: true,
    warnings: []
  },
  priceInfo: {
    sailrPerUsdc: 68.25939,
    effectiveRate: "1 USDC ≈ 68.259390 SAIL.R"
  }
}
```

---

### 2. Execute Sell

```typescript
const result = await rift.sailr.sell({
  amount: "5000000000000000", // 0.005 SAIL.R (18 decimals)
  returnToSmartWallet: true, // Optional, defaults to true
});

console.log("Success:", result.success);
console.log("USDC received:", result.estimatedUsdc);
console.log("Swap TX:", result.swapTransactions[0]);
```

**Response Structure:**

```typescript
{
  success: true,
  message: "SAIL.R sold successfully",
  swapTransactions: ["0x7471e83315195f0db621cfb03e222cad20ae4e7d..."],
  refund: {
    ethSent: "0.000654383881216238",
    beraSent: "0",
    refundTxHash: "0x9876543210fedcba..."
  },
  eoaToSmartWallet: "0x1234567890abcdef...", // If returnToSmartWallet: true
  estimatedUsdc: "73250",
  eoaAddress: "0xC9AA473460C6b9A1f502e1488d4A9A35E6014efb"
}
```

---

## 🔄 Complete Workflows

### Buy Workflow with Validation

```typescript
async function buyWithValidation(usdcAmount: string) {
  // Step 1: Get quote
  const quote = await rift.sailr.getBuyQuote(usdcAmount);
  
  // Step 2: Check if executable
  if (!quote.quote.canExecute) {
    console.error("Cannot execute buy:", quote.quote.warnings);
    return;
  }
  
  // Step 3: Show cost to user
  console.log(`Total cost: ${quote.quote.totalUsdcNeededFormatted}`);
  console.log(`You'll receive: ${quote.quote.estimatedSailRFormatted}`);
  
  // Step 4: Execute
  const result = await rift.sailr.buy({ amount: usdcAmount });
  
  console.log("✅ Buy completed!");
  console.log("TX:", result.swapTransactions[0]);
  
  return result;
}
```

---

### Sell Workflow with Validation

```typescript
async function sellWithValidation(sailrAmount: string) {
  // Step 1: Get quote
  const quote = await rift.sailr.getSellQuote(sailrAmount);
  
  // Step 2: Check if executable
  if (!quote.quote.canExecute) {
    console.error("Cannot execute sell:", quote.quote.warnings);
    return;
  }
  
  // Step 3: Show earnings to user
  console.log(`Gross USDC: ${quote.quote.estimatedUsdcGrossFormatted}`);
  console.log(`Gas refund: ${quote.quote.fees.gasRefundFormatted}`);
  console.log(`Net USDC: ${quote.quote.estimatedUsdcNetFormatted}`);
  
  // Step 4: Execute
  const result = await rift.sailr.sell({
    amount: sailrAmount,
    returnToSmartWallet: true,
  });
  
  console.log("✅ Sell completed!");
  console.log("TX:", result.swapTransactions[0]);
  
  return result;
}
```

---

## 🔢 Amount Formats

### USDC (6 decimals)
```typescript
"1000000"      // 1 USDC
"5000000"      // 5 USDC
"100000"       // 0.1 USDC
"1000"         // 0.001 USDC
```

### SAIL.R (18 decimals)
```typescript
"1000000000000000000"   // 1 SAIL.R
"5000000000000000"      // 0.005 SAIL.R
"100000000000000000"    // 0.1 SAIL.R
"1000000000000000"      // 0.001 SAIL.R
```

**Helper function:**

```typescript
import { ethers } from "ethers";

// For USDC (6 decimals)
const usdcAmount = ethers.parseUnits("1", 6).toString(); // "1000000"

// For SAIL.R (18 decimals)
const sailrAmount = ethers.parseUnits("0.005", 18).toString(); // "5000000000000000"
```

---

## ⚠️ Error Handling

```typescript
try {
  const result = await rift.sailr.buy({ amount: "1000000" });
} catch (error: any) {
  if (error.response?.data?.error?.includes("Insufficient")) {
    console.error("Insufficient balance");
    // Show user their balance and required amount
  } else if (error.response?.data?.error?.includes("timeout")) {
    console.error("Request timed out");
    // Show retry option
  } else if (error.response?.data?.error?.includes("JWT")) {
    console.error("Authentication expired");
    // Redirect to login
  } else {
    console.error("Unknown error:", error.message);
  }
}
```

---

## 💡 Key Points

1. **Decimals Matter**
   - USDC: 6 decimals
   - SAIL.R: 18 decimals
   - Always use wei format (smallest unit)

2. **Gas Costs**
   - System automatically calculates gas refund
   - Included in `totalUsdcNeeded` for buys
   - Deducted from `estimatedUsdcNet` for sells

3. **SAIL.R Location**
   - After buying: SAIL.R goes to your **EOA on Berachain**
   - For selling: SAIL.R must be in your **EOA on Berachain**

4. **USDC Location**
   - For buying: USDC comes from your **smart wallet on Base**
   - After selling: USDC goes to your **smart wallet on Base** (if `returnToSmartWallet: true`)

5. **Always Get Quote First**
   - Check `canExecute` before executing
   - Show `warnings` to user if present
   - Display total cost/earnings upfront

---

## 🆕 New Chain & Token Support

The SDK now supports:

### Chains
- ✅ `polygon`
- ✅ `base`
- ✅ `berachain` ⭐ NEW

### Tokens
- ✅ `USDC`
- ✅ `USDE` ⭐ NEW
- ✅ `SAIL` ⭐ NEW

**Get balances for new assets:**

```typescript
// Get all user tokens (including SAIL, USDE on Berachain)
const tokens = await rift.assets.getUserTokens();

// Get balances for specific chain
const balances = await rift.wallet.getChainBalance({
  chain: "berachain"
});

// Get balances for specific token
const usdcBalances = await rift.wallet.getTokenBalance({
  token: "USDC",
  chain: "base"
});
```

---

## 📚 Additional Resources

- [Full API Examples](./sailr-trading-examples.ts)
- [OpenAPI Specification](../sail.json)
- [Rift SDK Documentation](../README.md)

---

**Questions?** Contact Rift Finance support at https://riftfi.xyz

