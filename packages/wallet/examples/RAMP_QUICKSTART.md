# 🚀 Rift Ramp API - Quick Start Guide

Complete examples for all Rift Ramp operations with the updated SDK.

## 📦 Installation & Setup

```typescript
import { Rift, Environment } from '@rift/wallet';

const rift = new Rift({
  environment: Environment.PRODUCTION,
  apiKey: 'your-api-key-here'
});

// After user authentication
rift.setBearerToken('user-access-token');
```

---

## 1️⃣ OFFRAMP - Send USDC, Receive KES

### Basic M-Pesa Payment

```typescript
import { RampToken, OfframpCurrency, RampChain } from '@rift/wallet';

const order = await rift.offramp.createOrder({
  token: RampToken.USDC,
  amount: 10,  // 10 USDC
  currency: OfframpCurrency.KES,
  chain: RampChain.BASE,
  recipient: JSON.stringify({
    accountIdentifier: "254712345678",  // M-Pesa number
    institution: "SAFARICOM"
  })
});

console.log('Transaction Code:', order.order.transactionCode);
console.log('Status:', order.order.status);
```

### Buy Airtime (Utility Payment) 🆕

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
  // New utility payment fields
  utilities: true,
  service_code: "SP-SAFARICOM",
  contact_number: "254712345678",
  shortcode: "SAFARICOM"
});
```

### Backward Compatible: NGN Bank Transfer

```typescript
// Still works exactly as before!
const ngnOrder = await rift.offramp.createOrder({
  token: RampToken.USDC,
  amount: 50,
  currency: OfframpCurrency.NGN,
  chain: RampChain.POLYGON,
  recipient: JSON.stringify({
    name: "John Doe",
    bankCode: "058",  // GTBank
    accountNumber: "0123456789",
    email: "john@example.com",
    phoneNumber: "+2348012345678"
  })
});
```

---

## 2️⃣ PAY - Alternative Endpoint (Same as Offramp)

```typescript
// Functionally identical to offramp
const payment = await rift.offramp.pay({
  token: RampToken.USDC,
  amount: 5,
  currency: OfframpCurrency.KES,
  chain: RampChain.BASE,
  recipient: JSON.stringify({
    accountIdentifier: "254712345678",
    institution: "SAFARICOM"
  })
});
```

---

## 3️⃣ ONRAMP - Buy USDC with M-Pesa

```typescript
const onramp = await rift.onrampV2.buy({
  shortcode: "254712345678",  // M-Pesa number
  amount: 10,  // Buy 10 USDC
  chain: RampChain.BASE,
  asset: RampToken.USDC,
  mobile_network: "SAFARICOM",
  country_code: "KES"
});

console.log('Success:', onramp.success);
console.log('Message:', onramp.message);
console.log('Transaction Code:', onramp.transaction_code);

if (onramp.data) {
  console.log('Order ID:', onramp.data.id);
  console.log('Amount:', onramp.data.amount);
  console.log('Status:', onramp.data.status);
}
```

---

## 4️⃣ EXCHANGE RATES

### Get Current Rates 🆕

```typescript
const rate = await rift.offramp.previewExchangeRate({ 
  currency: OfframpCurrency.KES 
});

console.log('Rate:', rate.rate);
console.log('Buying Rate:', rate.buying_rate);    // NEW
console.log('Selling Rate:', rate.selling_rate);  // NEW
console.log('Quoted Rate:', rate.quoted_rate);    // NEW

// Calculate conversion
const usdcAmount = 10;
const kesAmount = usdcAmount * rate.rate;
console.log(`${usdcAmount} USDC = ${kesAmount} KES`);
```

---

## 5️⃣ STATUS CHECKING

### Check Offramp Status

```typescript
const status = await rift.offramp.pollOrderStatus({
  transactionCode: "f8a6ebe7-5c20-404b-87d3-360dab4a153c",
  currency: OfframpCurrency.KES
});

console.log('Status:', status.status);
console.log('Receipt:', status.receipt_number);
console.log('Amount:', status.amount);      // NEW
console.log('Currency:', status.currency);  // NEW
```

### Check Onramp Status

```typescript
const onrampStatus = await rift.onrampV2.getOnrampStatus(
  "onramp_1730415234567_abc123"
);

console.log('Status:', onrampStatus.status);
console.log('Transaction Hash:', onrampStatus.transaction_hash);
console.log('Amount:', onrampStatus.amount);
console.log('Shortcode:', onrampStatus.shortcode);  // NEW
console.log('Chain:', onrampStatus.chain);          // NEW
console.log('Asset:', onrampStatus.asset);          // NEW
```

### Poll Until Complete

```typescript
async function waitForCompletion(transactionCode: string) {
  for (let i = 0; i < 30; i++) {
    const status = await rift.offramp.pollOrderStatus({
      transactionCode,
      currency: OfframpCurrency.KES
    });
    
    if (status.status === 'completed' || status.status === 'failed') {
      return status;
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds
  }
  throw new Error('Timeout waiting for transaction');
}
```

---

## 6️⃣ GET ORDERS

### Get All Offramp Orders

```typescript
const orders = await rift.offramp.getOrders();

orders.orders.forEach(order => {
  console.log('ID:', order.id);
  console.log('Status:', order.status);
  console.log('Amount:', order.amount);
  console.log('Currency:', order.currency);      // NEW
  console.log('Transaction Code:', order.transactionCode);
  console.log('Created:', order.createdAt);
});
```

### Get All Onramp Orders

```typescript
const userId = "user-123-456";
const onrampOrders = await rift.onrampV2.getOnrampOrders(userId);

onrampOrders.forEach(order => {
  console.log('Status:', order.status);
  console.log('Transaction Code:', order.transactionCode);
  console.log('Amount:', order.amount);
  console.log('Currency:', order.currency);  // NEW
});
```

---

## 7️⃣ SUPPORTED INSTITUTIONS

```typescript
const institutions = await rift.offramp.getSupportedInstitutions(
  OfframpCurrency.KES
);

console.log('Institutions:', institutions.institutions);
console.log('Mobile Networks:', institutions.mobile_networks);
console.log('Payment Types:', institutions.payment_types);
console.log('Supports Banks:', institutions.metadata.supports_banks);
console.log('Supports Mobile Money:', institutions.metadata.supports_mobile_money);
```

---

## 8️⃣ WITHDRAWAL FEES

```typescript
const fee = await rift.offramp.getWithdrawalFee(100);

console.log('Fee:', fee.fee);
console.log('Total Cost:', 100 + fee.fee, 'USDC');
```

---

## 9️⃣ ERROR HANDLING 🆕

### New Error Types

```typescript
import {
  InsufficientFloatBalanceError,
  InsufficientUsdcBalanceError,
  UsdcTransferFailedError,
  RampTimeoutError
} from '@rift/wallet';

try {
  const order = await rift.offramp.createOrder(request);
} catch (error: any) {
  
  // Insufficient KES Float
  if (error.error === "Insufficient float balance") {
    const floatError = error as InsufficientFloatBalanceError;
    console.error(`Need ${floatError.required} ${floatError.currency}`);
    console.error(`Available: ${floatError.available}`);
  }
  
  // Insufficient USDC Balance
  else if (error.error === "Insufficient USDC balance") {
    const usdcError = error as InsufficientUsdcBalanceError;
    console.error(`Need ${usdcError.required} ${usdcError.asset}`);
    console.error(`Available: ${usdcError.available} on ${usdcError.chain}`);
  }
  
  // USDC Transfer Failed
  else if (error.error === "USDC transfer failed") {
    const transferError = error as UsdcTransferFailedError;
    console.error('Transfer failed:', transferError.transferError);
  }
  
  // Timeout
  else if (error.error?.includes('timeout')) {
    const timeoutError = error as RampTimeoutError;
    console.error('Request timed out:', timeoutError.error);
  }
  
  // Generic error
  else {
    console.error('Error:', error.message || error);
  }
}
```

---

## 🔟 COMPLETE WORKFLOWS

### Complete Offramp Flow

```typescript
async function sendMoneyToMpesa(phoneNumber: string, usdcAmount: number) {
  try {
    // 1. Get exchange rate
    const rate = await rift.offramp.previewExchangeRate({ 
      currency: OfframpCurrency.KES 
    });
    const kesAmount = usdcAmount * rate.rate;
    console.log(`Sending ${kesAmount} KES for ${usdcAmount} USDC`);
    
    // 2. Get withdrawal fee
    const fee = await rift.offramp.getWithdrawalFee(usdcAmount);
    console.log(`Fee: ${fee.fee} USDC`);
    
    // 3. Create order
    const order = await rift.offramp.createOrder({
      token: RampToken.USDC,
      amount: usdcAmount,
      currency: OfframpCurrency.KES,
      chain: RampChain.BASE,
      recipient: JSON.stringify({
        accountIdentifier: phoneNumber,
        institution: "SAFARICOM"
      })
    });
    
    console.log('Order created:', order.order.transactionCode);
    
    // 4. Poll status
    const finalStatus = await waitForCompletion(order.order.transactionCode);
    
    if (finalStatus.status === 'completed') {
      console.log('✅ Money sent successfully!');
      console.log('Receipt:', finalStatus.receipt_number);
      return finalStatus;
    } else {
      console.log('❌ Transaction failed');
      throw new Error('Transaction failed');
    }
    
  } catch (error: any) {
    console.error('Offramp failed:', error.message);
    throw error;
  }
}

// Helper function
async function waitForCompletion(transactionCode: string) {
  for (let i = 0; i < 30; i++) {
    const status = await rift.offramp.pollOrderStatus({
      transactionCode,
      currency: OfframpCurrency.KES
    });
    
    if (status.status === 'completed' || status.status === 'failed') {
      return status;
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  throw new Error('Transaction timeout');
}
```

### Complete Onramp Flow

```typescript
async function buyUsdcWithMpesa(phoneNumber: string, usdcAmount: number) {
  try {
    // 1. Get exchange rate
    const rate = await rift.offramp.previewExchangeRate({ 
      currency: OfframpCurrency.KES 
    });
    const kesAmount = usdcAmount * rate.buying_rate;
    console.log(`You need to pay ${kesAmount} KES to buy ${usdcAmount} USDC`);
    
    // 2. Create onramp order
    const onramp = await rift.onrampV2.buy({
      shortcode: phoneNumber,
      amount: usdcAmount,
      chain: RampChain.BASE,
      asset: RampToken.USDC,
      mobile_network: "SAFARICOM",
      country_code: "KES"
    });
    
    console.log('✅ Order created!');
    console.log('Message:', onramp.message);
    console.log('Please complete payment on your phone...');
    
    if (!onramp.transaction_code) {
      throw new Error('No transaction code received');
    }
    
    // 3. Wait for payment and crypto transfer
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds
      
      const status = await rift.onrampV2.getOnrampStatus(onramp.transaction_code);
      
      console.log(`Status: ${status.status}`);
      
      if (status.status === 'completed') {
        console.log('✅ USDC received!');
        console.log('Transaction Hash:', status.transaction_hash);
        console.log('Amount:', status.amount);
        return status;
      }
      
      if (status.status === 'failed') {
        throw new Error('Onramp failed');
      }
    }
    
    throw new Error('Transaction timeout');
    
  } catch (error: any) {
    console.error('Onramp failed:', error.message);
    throw error;
  }
}
```

### Buy Airtime Flow

```typescript
async function buyAirtime(phoneNumber: string, usdcAmount: number) {
  try {
    const order = await rift.offramp.createOrder({
      token: RampToken.USDC,
      amount: usdcAmount,
      currency: OfframpCurrency.KES,
      chain: RampChain.BASE,
      recipient: JSON.stringify({
        accountIdentifier: phoneNumber,
        institution: "SAFARICOM"
      }),
      utilities: true,
      service_code: "SP-SAFARICOM",
      contact_number: phoneNumber,
      shortcode: "SAFARICOM"
    });
    
    console.log('✅ Airtime purchase initiated!');
    console.log('Transaction Code:', order.order.transactionCode);
    
    return order;
  } catch (error: any) {
    console.error('Airtime purchase failed:', error.message);
    throw error;
  }
}
```

---

## 🎯 BATCH OPERATIONS

### Send to Multiple Recipients

```typescript
async function batchSend(recipients: Array<{phone: string, amount: number}>) {
  const results = [];
  
  for (const recipient of recipients) {
    try {
      const order = await rift.offramp.createOrder({
        token: RampToken.USDC,
        amount: recipient.amount,
        currency: OfframpCurrency.KES,
        chain: RampChain.BASE,
        recipient: JSON.stringify({
          accountIdentifier: recipient.phone,
          institution: "SAFARICOM"
        })
      });
      
      results.push({
        phone: recipient.phone,
        success: true,
        transactionCode: order.order.transactionCode
      });
      
      console.log(`✅ Sent ${recipient.amount} USDC to ${recipient.phone}`);
      
    } catch (error: any) {
      results.push({
        phone: recipient.phone,
        success: false,
        error: error.message
      });
      
      console.error(`❌ Failed to send to ${recipient.phone}`);
    }
  }
  
  return results;
}

// Usage
const recipients = [
  { phone: "254712345678", amount: 5 },
  { phone: "254700123456", amount: 10 },
  { phone: "254722222222", amount: 3 }
];

const results = await batchSend(recipients);
console.log('Batch results:', results);
```

### Buy Airtime for Multiple Numbers

```typescript
async function batchAirtime(phoneNumbers: string[], amountPerPerson: number) {
  const results = [];
  
  for (const phone of phoneNumbers) {
    try {
      const order = await rift.offramp.createOrder({
        token: RampToken.USDC,
        amount: amountPerPerson,
        currency: OfframpCurrency.KES,
        chain: RampChain.BASE,
        recipient: JSON.stringify({
          accountIdentifier: phone,
          institution: "SAFARICOM"
        }),
        utilities: true,
        service_code: "SP-SAFARICOM",
        contact_number: phone,
        shortcode: "SAFARICOM"
      });
      
      results.push({ phone, success: true, transactionCode: order.order.transactionCode });
      console.log(`✅ Airtime sent to ${phone}`);
      
    } catch (error: any) {
      results.push({ phone, success: false, error: error.message });
      console.error(`❌ Failed to send airtime to ${phone}`);
    }
  }
  
  return results;
}

// Usage
const numbers = ["254712345678", "254700123456", "254722222222"];
const results = await batchAirtime(numbers, 0.5); // 0.5 USDC each
```

---

## 📊 SUMMARY TABLE

| Operation | Endpoint | Currency | New Features |
|-----------|----------|----------|--------------|
| **Offramp** | `rift.offramp.createOrder()` | KES, NGN, etc. | ✅ Utility payments |
| **Pay** | `rift.offramp.pay()` | KES, NGN, etc. | ✅ Utility payments |
| **Onramp** | `rift.onrampV2.buy()` | KES | ✅ Enhanced response |
| **Exchange Rate** | `rift.offramp.previewExchangeRate()` | All | ✅ 4 rate fields |
| **Status** | `rift.offramp.pollOrderStatus()` | All | ✅ More fields |
| **Onramp Status** | `rift.onrampV2.getOnrampStatus()` | All | ✅ More fields |

---

## ⚠️ IMPORTANT NOTES

### 1. Amount is Always USDC
```typescript
amount: 10  // This is 10 USDC, NOT 10 KES
```
The backend converts to local currency automatically.

### 2. Recipient Must Be JSON String
```typescript
recipient: JSON.stringify({
  accountIdentifier: "254712345678",
  institution: "SAFARICOM"
})
```

### 3. Utility Fields Are All-or-Nothing
If `utilities: true`, you MUST provide ALL 4 fields:
- `utilities`
- `service_code`
- `contact_number`
- `shortcode`

### 4. Backward Compatibility
✅ All old code still works!  
✅ No breaking changes!  
✅ New features are opt-in via optional fields!

---

## 🚨 COMMON ERROR SCENARIOS

### Insufficient Float Balance (KES Offramp)
```typescript
{
  error: "Insufficient float balance",
  message: "We don't have enough KES float. Required: 1260 KES, Available: 500 KES",
  required: 1260,
  available: 500,
  currency: "KES"
}
```

### Insufficient USDC (KES Onramp)
```typescript
{
  error: "Insufficient USDC balance",
  message: "We don't have enough USDC to process this onramp...",
  required: 10,
  available: 5.5,
  asset: "USDC",
  chain: "BASE"
}
```

### Timeout
```typescript
{
  error: "timeout of 30000ms exceeded",
  message: "The payment provider is taking too long to respond"
}
```

---

## 📞 SUPPORT

For complete examples with error handling, see:
- `packages/wallet/examples/ramp-api-examples.ts`

For type definitions, see:
- `packages/wallet/src/types.ts`

---

**Last Updated:** November 1, 2025  
**SDK Version:** Latest  
**Backward Compatibility:** ✅ 100%

