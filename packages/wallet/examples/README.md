# 📚 Rift SDK Examples

Complete, production-ready examples for all Rift Ramp API operations.

## 🚀 Quick Links

### Ramp (Offramp/Onramp)
- **[Quick Start Guide](./RAMP_QUICKSTART.md)** - Copy-paste examples for all operations
- **[Complete Examples](./ramp-api-examples.ts)** - Full TypeScript examples with error handling
- **[Type Definitions](../src/types.ts)** - All TypeScript interfaces

### SAIL.R Trading 🆕
- **[SAIL.R Quick Start](./SAILR_QUICKSTART.md)** - Buy/sell SAIL.R tokens guide
- **[SAIL.R Examples](./sailr-trading-examples.ts)** - Complete trading examples
- **[OpenAPI Spec](../sail.json)** - Full API specification

## 📋 What's Included

### 1. Offramp Examples
- ✅ Send USDC, receive KES in M-Pesa
- ✅ Buy airtime (utility payments) 🆕
- ✅ Bank transfers (NGN, UGX, etc.)
- ✅ Batch payments to multiple recipients

### 2. Onramp Examples
- ✅ Buy USDC with M-Pesa
- ✅ Different mobile networks (Safaricom, Airtel)
- ✅ Status monitoring
- ✅ Complete workflows

### 3. Exchange Rate Examples
- ✅ Get current rates (4 rate types) 🆕
- ✅ Calculate conversions
- ✅ Multi-currency support

### 4. Status Checking Examples
- ✅ Check offramp status
- ✅ Check onramp status
- ✅ Poll until complete
- ✅ Enhanced status fields 🆕

### 5. Error Handling Examples
- ✅ Insufficient balance errors 🆕
- ✅ Timeout handling 🆕
- ✅ USDC transfer errors 🆕
- ✅ Type-safe error handling

### 6. Complete Workflows
- ✅ End-to-end offramp flow
- ✅ End-to-end onramp flow
- ✅ Airtime purchase flow
- ✅ Batch operations

### 7. SAIL.R Trading Examples 🆕
- ✅ Buy SAIL.R with USDC
- ✅ Sell SAIL.R for USDC
- ✅ Get buy/sell quotes
- ✅ Gasless transactions
- ✅ Cross-chain swaps (Base ↔ Berachain)

## 🎯 Quick Start

### 1. Install Dependencies

```bash
npm install @rift/wallet
# or
yarn add @rift/wallet
```

### 2. Initialize SDK

```typescript
import { Rift, Environment } from '@rift/wallet';

const rift = new Rift({
  environment: Environment.PRODUCTION,
  apiKey: 'your-api-key'
});

// After user authentication
rift.setBearerToken('user-access-token');
```

### 3. Send Money to M-Pesa

```typescript
import { RampToken, OfframpCurrency, RampChain } from '@rift/wallet';

const order = await rift.offramp.createOrder({
  token: RampToken.USDC,
  amount: 10,
  currency: OfframpCurrency.KES,
  chain: RampChain.BASE,
  recipient: JSON.stringify({
    accountIdentifier: "254712345678",
    institution: "SAFARICOM"
  })
});

console.log('Transaction Code:', order.order.transactionCode);
```

### 4. Buy Airtime (NEW!) 🆕

```typescript
const airtime = await rift.offramp.createOrder({
  token: RampToken.USDC,
  amount: 1,
  currency: OfframpCurrency.KES,
  chain: RampChain.BASE,
  recipient: JSON.stringify({
    accountIdentifier: "254712345678",
    institution: "SAFARICOM"
  }),
  utilities: true,
  service_code: "SP-SAFARICOM",
  contact_number: "254712345678",
  shortcode: "SAFARICOM"
});
```

### 5. Buy USDC with M-Pesa

```typescript
const onramp = await rift.onrampV2.buy({
  shortcode: "254712345678",
  amount: 10,
  chain: RampChain.BASE,
  asset: RampToken.USDC,
  mobile_network: "SAFARICOM",
  country_code: "KES"
});

console.log('Transaction Code:', onramp.transaction_code);
```

### 6. Buy SAIL.R Tokens (NEW!) 🆕

```typescript
// Get a quote first
const quote = await rift.sailr.getBuyQuote("1000000"); // 1 USDC
console.log('Total Cost:', quote.quote.totalUsdcNeededFormatted);
console.log("You'll receive:", quote.quote.estimatedSailRFormatted);

// Execute the buy
const result = await rift.sailr.buy({
  amount: "1000000" // 1 USDC (6 decimals)
});

console.log('SAIL.R sent to:', result.eoaAddress);
console.log('Swap TX:', result.swapTransactions[0]);
```

### 7. Sell SAIL.R Tokens (NEW!) 🆕

```typescript
// Get a quote first
const quote = await rift.sailr.getSellQuote("5000000000000000"); // 0.005 SAIL.R
console.log('Net USDC:', quote.quote.estimatedUsdcNetFormatted);

// Execute the sell
const result = await rift.sailr.sell({
  amount: "5000000000000000", // 0.005 SAIL.R (18 decimals)
  returnToSmartWallet: true
});

console.log('USDC received:', result.estimatedUsdc);
console.log('Swap TX:', result.swapTransactions[0]);
```

## 📖 Example Files

### [RAMP_QUICKSTART.md](./RAMP_QUICKSTART.md)
Quick reference with copy-paste examples for all operations.

**Best for:** Quick lookups and getting started fast.

### [ramp-api-examples.ts](./ramp-api-examples.ts)
Comprehensive TypeScript examples with full error handling.

**Best for:** Production implementations and learning best practices.

### [UTILITY_PAYMENTS_GUIDE.md](./UTILITY_PAYMENTS_GUIDE.md) 🆕
Complete guide for integrating utility payments (airtime, bills).

**Best for:** Frontend developers integrating airtime purchases.

### [UTILITY_PAYMENTS_QUICK_REF.md](./UTILITY_PAYMENTS_QUICK_REF.md) 🆕
Ultra-quick reference for utility payments in 3 steps.

**Best for:** Quick integration and troubleshooting.

### [SUPPORTED_COUNTRIES.md](./SUPPORTED_COUNTRIES.md)
Country-specific documentation and payment methods.

**Best for:** Understanding what's available in each country.

### [SAILR_QUICKSTART.md](./SAILR_QUICKSTART.md) 🆕
Quick start guide for buying and selling SAIL.R tokens.

**Best for:** Integrating SAIL.R trading in your app.

### [sailr-trading-examples.ts](./sailr-trading-examples.ts) 🆕
Complete TypeScript examples for SAIL.R trading with error handling.

**Best for:** Production implementations of SAIL.R trading.

**Includes:**
- ✅ 50+ working examples
- ✅ Complete error handling
- ✅ Type-safe code
- ✅ Batch operations
- ✅ Complete workflows
- ✅ Real-world scenarios

## 🆕 What's New

### New SAIL.R Trading Service 🎉

Trade SAIL.R tokens with gasless transactions across Base and Berachain!

**Features:**
- ✅ Buy SAIL.R with USDC
- ✅ Sell SAIL.R for USDC
- ✅ Gasless transactions (no gas fees!)
- ✅ Cross-chain swaps (Base ↔ Berachain)
- ✅ Automatic gas funding and refunds
- ✅ Smart wallet integration

**See:** [SAILR_QUICKSTART.md](./SAILR_QUICKSTART.md) for complete guide.

### New Chain & Token Support

**Chains:**
- ✅ `polygon` (existing)
- ✅ `base` (existing)
- ✅ `berachain` 🆕

**Tokens:**
- ✅ `USDC` (existing)
- ✅ `USDE` 🆕
- ✅ `SAIL` 🆕

```typescript
import { RampChain, RampToken } from '@rift/wallet';

// New chain
const chain = RampChain.BERACHAIN;

// New tokens
const usde = RampToken.USDE;
const sail = RampToken.SAIL;

// Get balances for Berachain
const balances = await rift.wallet.getChainBalance({
  chain: "berachain"
});
```

### Updated Type Definitions

#### 1. PreviewExchangeRateResponse
```typescript
interface PreviewExchangeRateResponse {
  rate: number;
  buying_rate: number;      // NEW
  selling_rate: number;     // NEW
  quoted_rate: number;      // NEW
}
```

#### 2. CreateOfframpOrderRequest & PayRequest
```typescript
interface CreateOfframpOrderRequest {
  // ... existing fields ...
  utilities?: boolean;       // NEW
  service_code?: string;     // NEW
  contact_number?: string;   // NEW
  shortcode?: string;        // NEW
}
```

#### 3. OnrampStatusResponse
```typescript
interface OnrampStatusResponse {
  // ... existing fields ...
  shortcode?: string;        // NEW
  chain?: string;           // NEW
  asset?: string;           // NEW
  account_number?: string;  // NEW
}
```

#### 4. New Error Types
```typescript
interface InsufficientFloatBalanceError { /* ... */ }
interface InsufficientUsdcBalanceError { /* ... */ }
interface UsdcTransferFailedError { /* ... */ }
interface RampTimeoutError { /* ... */ }
```

## ✅ Backward Compatibility

**All changes are 100% backward compatible!**

- ✅ Old code still works
- ✅ No breaking changes
- ✅ New features are opt-in
- ✅ All existing fields maintained

## 🎯 Use Cases

### Personal Payments
```typescript
// Send money to M-Pesa
await sendMoneyToMpesa("254712345678", 10);

// Buy USDC
await buyUsdcWithMpesa("254712345678", 10);
```

### Utility Payments
```typescript
// Buy airtime
await buyAirtime("254712345678", 1);

// Buy airtime for multiple numbers
await batchAirtime(["254712345678", "254700123456"], 0.5);
```

### Business Operations
```typescript
// Batch payments (salaries, payouts)
const recipients = [
  { phone: "254712345678", amount: 100 },
  { phone: "254700123456", amount: 150 },
];
await batchSend(recipients);

// Monitor transactions
const status = await checkOfframpStatus(transactionCode);
```

### E-commerce
```typescript
// Accept M-Pesa payments
const order = await rift.onrampV2.buy({
  shortcode: customerPhone,
  amount: orderTotal,
  // ...
});

// Cash out to merchants
await rift.offramp.createOrder({
  amount: merchantPayout,
  // ...
});
```

## 📊 Operation Summary

| Operation | Method | Currency | Use Case |
|-----------|--------|----------|----------|
| **Offramp** | `rift.offramp.createOrder()` | KES, NGN, UGX, etc. | Send money |
| **Pay** | `rift.offramp.pay()` | KES, NGN, UGX, etc. | Send money |
| **Utility** | `rift.offramp.createOrder()` | KES | Buy airtime/bills |
| **Onramp** | `rift.onrampV2.buy()` | KES | Buy crypto |
| **Exchange Rate** | `rift.offramp.previewExchangeRate()` | All | Get rates |
| **Status** | `rift.offramp.pollOrderStatus()` | All | Check status |
| **Orders** | `rift.offramp.getOrders()` | All | List orders |
| **Buy SAIL.R** 🆕 | `rift.sailr.buy()` | USDC | Buy SAIL.R tokens |
| **Sell SAIL.R** 🆕 | `rift.sailr.sell()` | USDC | Sell SAIL.R tokens |
| **SAIL.R Quote** 🆕 | `rift.sailr.getBuyQuote()` / `getSellQuote()` | USDC | Get trading quotes |

## 🚨 Important Notes

### 1. Amount Field
```typescript
amount: 10  // This is 10 USDC, NOT local currency
```

### 2. Recipient Format
```typescript
recipient: JSON.stringify({
  accountIdentifier: "254712345678",
  institution: "SAFARICOM"
})
```

### 3. Utility Payment Fields
If `utilities: true`, ALL 4 fields are required:
- `utilities`
- `service_code`
- `contact_number`
- `shortcode`

### 4. Error Handling
Always wrap calls in try-catch:
```typescript
try {
  const order = await rift.offramp.createOrder(request);
} catch (error: any) {
  // Handle specific error types
  if (error.error === "Insufficient float balance") {
    // Handle insufficient balance
  }
}
```

## 🧪 Testing

### Run All Examples
```bash
# Install dependencies
npm install

# Run examples
ts-node examples/ramp-api-examples.ts
```

### Run Specific Example
```typescript
import { basicOfframpExample } from './examples/ramp-api-examples';

await basicOfframpExample();
```

## 📞 Support

### Documentation
- [Quick Start Guide](./RAMP_QUICKSTART.md)
- [Complete Examples](./ramp-api-examples.ts)
- [Type Definitions](../src/types.ts)

### Common Issues

#### Issue: "Insufficient float balance"
**Solution:** The platform doesn't have enough KES. Try a smaller amount or contact support.

#### Issue: "Timeout"
**Solution:** The provider is slow. Retry after a few seconds.

#### Issue: "Recipient format invalid"
**Solution:** Ensure recipient is a JSON string:
```typescript
recipient: JSON.stringify({ /* ... */ })
```

## 🎓 Learning Path

1. **Start Here:** [Quick Start Guide](./RAMP_QUICKSTART.md)
   - Basic offramp
   - Basic onramp
   - Exchange rates

2. **Next:** Simple workflows
   - Status checking
   - Error handling
   - Complete flows

3. **Advanced:** Production features
   - Utility payments
   - Batch operations
   - Complex error handling

4. **Reference:** [Complete Examples](./ramp-api-examples.ts)
   - 50+ examples
   - Best practices
   - Real-world scenarios

## 🎉 Ready to Go!

You now have everything you need to integrate Rift Ramp:

✅ Complete type definitions  
✅ 50+ working examples  
✅ Error handling patterns  
✅ Production-ready workflows  
✅ Backward compatibility  

**Happy coding! 🚀**

---

**Last Updated:** November 1, 2025  
**SDK Version:** Latest  
**Examples:** 50+ complete examples  
**Backward Compatibility:** ✅ 100%

