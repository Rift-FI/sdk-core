# 💡 Utility Payments Integration Guide

Complete guide for frontend developers to integrate utility payments (airtime, bills, etc.) using the Rift SDK.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [What Are Utility Payments?](#what-are-utility-payments)
3. [Prerequisites](#prerequisites)
4. [Step-by-Step Integration](#step-by-step-integration)
5. [API Reference](#api-reference)
6. [Error Handling](#error-handling)
7. [UI/UX Best Practices](#uiux-best-practices)
8. [Complete Examples](#complete-examples)

---

## 🎯 Overview

**Utility payments** allow users to spend USDC to buy airtime or pay bills directly to Kenyan mobile networks (Safaricom, Airtel, etc.) without first converting to M-Pesa.

### **Key Features:**
- ✅ Direct USDC to airtime conversion
- ✅ No intermediate M-Pesa transfer needed
- ✅ Instant processing
- ✅ Support for all major Kenyan networks
- ✅ Same API as regular offramp, just with extra fields

---

## 🔌 What Are Utility Payments?

### **Regular Offramp (M-Pesa Cash Out):**
```
User USDC → KES in M-Pesa Account
```

### **Utility Payment (Airtime):**
```
User USDC → Airtime directly credited to phone number
```

### **Supported Utilities:**
- ✅ **Airtime** - Safaricom, Airtel, Telkom
- ⚠️ **Bill Payments** - Check with backend for availability
- ⚠️ **Data Bundles** - Check with backend for availability

---

## ✅ Prerequisites

### **1. SDK Installation:**
```bash
npm install @rift/wallet
# or
yarn add @rift/wallet
```

### **2. SDK Initialization:**
```typescript
import { Rift, Environment } from '@rift/wallet';

const rift = new Rift({
  environment: Environment.PRODUCTION,
  apiKey: 'your-api-key'
});

// After user authentication
rift.setBearerToken('user-access-token');
```

### **3. User Requirements:**
- ✅ User must have sufficient USDC balance
- ✅ User must be authenticated
- ✅ Valid Kenyan phone number

---

## 🚀 Step-by-Step Integration

### **Step 1: Get Current Exchange Rate**

Before showing the user the form, fetch the current exchange rate:

```typescript
import { OfframpCurrency } from '@rift/wallet';

async function getExchangeRate() {
  try {
    const rate = await rift.offramp.previewExchangeRate({ 
      currency: OfframpCurrency.KES 
    });
    
    return {
      rate: rate.rate,
      sellingRate: rate.selling_rate,
      buyingRate: rate.buying_rate,
      quotedRate: rate.quoted_rate
    };
  } catch (error) {
    console.error('Failed to get exchange rate:', error);
    throw error;
  }
}

// Example usage:
const rates = await getExchangeRate();
console.log(`1 USDC = ${rates.rate} KES`);
```

**Response:**
```json
{
  "rate": 130.5,
  "sellingRate": 130.5,
  "buyingRate": 131.2,
  "quotedRate": 130.5
}
```

---

### **Step 2: Show User the Conversion**

Display how much airtime they'll get:

```typescript
function calculateAirtimeValue(usdcAmount: number, exchangeRate: number): number {
  return usdcAmount * exchangeRate;
}

// Example:
const usdcAmount = 1; // User wants to spend 1 USDC
const exchangeRate = 130.5;
const airtimeValue = calculateAirtimeValue(usdcAmount, exchangeRate);

console.log(`You will receive ${airtimeValue} KES worth of airtime`);
// Output: "You will receive 130.5 KES worth of airtime"
```

---

### **Step 3: Create Utility Payment Order**

Call the offramp endpoint with utility payment fields:

```typescript
import { 
  RampToken, 
  OfframpCurrency, 
  RampChain,
  CreateOfframpOrderRequest 
} from '@rift/wallet';

async function buyAirtime(
  phoneNumber: string,
  usdcAmount: number,
  network: 'SAFARICOM' | 'AIRTEL' | 'TELKOM' = 'SAFARICOM'
) {
  try {
    const request: CreateOfframpOrderRequest = {
      // Standard offramp fields
      token: RampToken.USDC,
      amount: usdcAmount,
      currency: OfframpCurrency.KES,
      chain: RampChain.BASE,
      
      // Recipient (same as regular offramp)
      recipient: JSON.stringify({
        accountIdentifier: phoneNumber,
        institution: network
      }),
      
      // ⭐ UTILITY PAYMENT SPECIFIC FIELDS (all required)
      utilities: true,                    // Enable utility payment
      service_code: `SP-${network}`,     // Service provider code
      contact_number: phoneNumber,       // Recipient phone number
      shortcode: network                 // Network shortcode
    };

    const response = await rift.offramp.createOrder(request);
    
    return {
      success: true,
      transactionCode: response.order.transactionCode,
      status: response.order.status,
      amount: response.order.amount,
      createdAt: response.order.createdAt
    };
    
  } catch (error: any) {
    return {
      success: false,
      error: error.error || 'Unknown error',
      message: error.message
    };
  }
}
```

---

### **Step 4: Handle the Response**

#### **Success Response:**
```json
{
  "order": {
    "id": "order_123456789",
    "status": "pending",
    "transactionCode": "f8a6ebe7-5c20-404b-87d3-360dab4a153c",
    "amount": 1,
    "createdAt": "2025-11-01T12:00:00.000Z",
    "transaction_hash": null,
    "receipt_number": null,
    "currency": "KES"
  }
}
```

#### **What to Show User:**
```typescript
const result = await buyAirtime("254712345678", 1);

if (result.success) {
  // Show success message
  console.log("✅ Airtime purchase initiated!");
  console.log(`Transaction Code: ${result.transactionCode}`);
  console.log("Your airtime will be delivered shortly.");
  
  // Optionally poll for status updates
  pollTransactionStatus(result.transactionCode);
} else {
  // Show error message
  console.error("❌ Failed to purchase airtime");
  console.error(result.message);
}
```

---

### **Step 5: Poll Transaction Status (Optional)**

Monitor the transaction until it completes:

```typescript
async function pollTransactionStatus(
  transactionCode: string,
  maxAttempts: number = 30,
  intervalMs: number = 2000
) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const status = await rift.offramp.pollOrderStatus({
        transactionCode,
        currency: OfframpCurrency.KES
      });
      
      console.log(`Attempt ${attempt}: ${status.status}`);
      
      if (status.status === 'completed') {
        return {
          success: true,
          status: 'completed',
          receiptNumber: status.receipt_number,
          message: '✅ Airtime delivered successfully!'
        };
      }
      
      if (status.status === 'failed') {
        return {
          success: false,
          status: 'failed',
          message: '❌ Transaction failed'
        };
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, intervalMs));
      
    } catch (error: any) {
      console.error(`Poll attempt ${attempt} failed:`, error);
    }
  }
  
  return {
    success: false,
    status: 'timeout',
    message: '⏳ Transaction is still processing'
  };
}

// Usage:
const result = await buyAirtime("254712345678", 1);
if (result.success) {
  const finalStatus = await pollTransactionStatus(result.transactionCode);
  console.log(finalStatus.message);
}
```

---

## 📚 API Reference

### **Method: `rift.offramp.createOrder()`**

#### **Parameters:**

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `token` | `RampToken` | ✅ Yes | Token to spend | `RampToken.USDC` |
| `amount` | `number` | ✅ Yes | Amount in USDC | `1` |
| `currency` | `OfframpCurrency` | ✅ Yes | Target currency | `OfframpCurrency.KES` |
| `chain` | `RampChain` | ✅ Yes | Blockchain | `RampChain.BASE` |
| `recipient` | `string` | ✅ Yes | JSON string | See below |
| `utilities` | `boolean` | ✅ Yes* | Enable utilities | `true` |
| `service_code` | `string` | ✅ Yes* | Service provider | `"SP-SAFARICOM"` |
| `contact_number` | `string` | ✅ Yes* | Phone number | `"254712345678"` |
| `shortcode` | `string` | ✅ Yes* | Network code | `"SAFARICOM"` |

**\* Required when `utilities: true`**

#### **Recipient Format:**
```typescript
recipient: JSON.stringify({
  accountIdentifier: "254712345678",  // Phone number with country code
  institution: "SAFARICOM"            // Network name
})
```

#### **Service Codes:**
| Network | Service Code | Shortcode |
|---------|-------------|-----------|
| Safaricom | `SP-SAFARICOM` | `SAFARICOM` |
| Airtel | `SP-AIRTEL` | `AIRTEL` |
| Telkom | `SP-TELKOM` | `TELKOM` |

---

## 🚨 Error Handling

### **Common Errors:**

#### **1. Insufficient Float Balance**
```typescript
{
  "error": "Insufficient float balance",
  "message": "We don't have enough KES float. Required: 1260 KES, Available: 500 KES",
  "required": 1260,
  "available": 500,
  "currency": "KES"
}
```

**What to do:**
- Show user a friendly error message
- Suggest trying a smaller amount
- Provide alternative payment method (regular M-Pesa)

```typescript
if (error.error === "Insufficient float balance") {
  const maxUsdc = error.available / exchangeRate;
  alert(`Maximum available: ${maxUsdc.toFixed(2)} USDC. Please try a smaller amount.`);
}
```

#### **2. Timeout Error**
```typescript
{
  "error": "timeout of 30000ms exceeded",
  "message": "The payment provider is taking too long to respond"
}
```

**What to do:**
- Show "Processing delayed" message
- Offer to retry
- Save transaction code for later status check

#### **3. Invalid Phone Number**
```typescript
{
  "error": "Invalid recipient",
  "message": "Phone number format is invalid"
}
```

**What to do:**
- Validate phone number format before API call
- Show format example: "254712345678"

#### **4. Missing Utility Fields**
```typescript
{
  "error": "Missing required fields",
  "message": "utilities, service_code, contact_number, and shortcode are required when utilities is true"
}
```

**What to do:**
- Ensure all 4 utility fields are provided
- Double-check field values

---

### **Complete Error Handler:**

```typescript
function handleUtilityPaymentError(error: any): string {
  // Insufficient balance
  if (error.error === "Insufficient float balance") {
    const maxUsdc = (error.available / 130).toFixed(2); // Approximate
    return `Platform low on funds. Maximum: ${maxUsdc} USDC. Try a smaller amount.`;
  }
  
  // Timeout
  if (error.error?.includes('timeout')) {
    return 'Request timed out. Please try again in a few moments.';
  }
  
  // Invalid phone
  if (error.error?.includes('Invalid') || error.error?.includes('recipient')) {
    return 'Invalid phone number. Format: 254712345678';
  }
  
  // Missing fields
  if (error.error?.includes('required')) {
    return 'Missing required information. Please contact support.';
  }
  
  // Generic
  return error.message || 'Transaction failed. Please try again.';
}

// Usage:
try {
  const result = await buyAirtime(phone, amount);
} catch (error: any) {
  const userMessage = handleUtilityPaymentError(error);
  showErrorToUser(userMessage);
}
```

---

## 🎨 UI/UX Best Practices

### **1. Pre-Purchase Screen:**

```
┌──────────────────────────────────┐
│  Buy Airtime                     │
├──────────────────────────────────┤
│                                  │
│  Phone Number                    │
│  [254712345678            ]      │
│                                  │
│  Network                         │
│  [Safaricom ▼]                   │
│                                  │
│  Amount (USDC)                   │
│  [1.00                    ]      │
│                                  │
│  You will receive                │
│  ≈ 130.5 KES worth of airtime   │
│                                  │
│  Exchange Rate: 1 USDC = 130.5 KES│
│                                  │
│  [   Buy Airtime   ]             │
│                                  │
└──────────────────────────────────┘
```

### **2. Processing Screen:**

```
┌──────────────────────────────────┐
│  Processing...                   │
├──────────────────────────────────┤
│                                  │
│      [Spinner Animation]         │
│                                  │
│  Sending airtime to              │
│  254712345678                    │
│                                  │
│  This usually takes a few seconds│
│                                  │
│  Transaction Code:               │
│  f8a6ebe7-5c20-404b-87d3...     │
│                                  │
└──────────────────────────────────┘
```

### **3. Success Screen:**

```
┌──────────────────────────────────┐
│  ✅ Airtime Sent!                │
├──────────────────────────────────┤
│                                  │
│  130.5 KES airtime has been      │
│  sent to 254712345678            │
│                                  │
│  Transaction Code:               │
│  f8a6ebe7-5c20-404b-87d3...     │
│                                  │
│  Receipt Number:                 │
│  RFT1234567890                   │
│                                  │
│  [ View Transaction ] [ Done ]   │
│                                  │
└──────────────────────────────────┘
```

### **4. Error Screen:**

```
┌──────────────────────────────────┐
│  ❌ Transaction Failed            │
├──────────────────────────────────┤
│                                  │
│  Platform temporarily low on     │
│  funds. Please try a smaller     │
│  amount or try again later.      │
│                                  │
│  Maximum available: 0.50 USDC    │
│                                  │
│  [ Try Again ] [ Contact Support]│
│                                  │
└──────────────────────────────────┘
```

---

## 💻 Complete Examples

### **Example 1: Simple Airtime Purchase Component (React)**

```typescript
import { useState } from 'react';
import { Rift, RampToken, OfframpCurrency, RampChain } from '@rift/wallet';

function AirtimePurchase() {
  const [phone, setPhone] = useState('254');
  const [amount, setAmount] = useState(1);
  const [network, setNetwork] = useState('SAFARICOM');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(130.5);

  // Fetch exchange rate on mount
  useEffect(() => {
    async function fetchRate() {
      try {
        const rate = await rift.offramp.previewExchangeRate({ 
          currency: OfframpCurrency.KES 
        });
        setExchangeRate(rate.rate);
      } catch (err) {
        console.error('Failed to fetch rate:', err);
      }
    }
    fetchRate();
  }, []);

  const handlePurchase = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const result = await rift.offramp.createOrder({
        token: RampToken.USDC,
        amount: amount,
        currency: OfframpCurrency.KES,
        chain: RampChain.BASE,
        recipient: JSON.stringify({
          accountIdentifier: phone,
          institution: network
        }),
        utilities: true,
        service_code: `SP-${network}`,
        contact_number: phone,
        shortcode: network
      });

      setSuccess(true);
      console.log('Transaction Code:', result.order.transactionCode);
      
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const airtimeValue = (amount * exchangeRate).toFixed(2);

  return (
    <div className="airtime-purchase">
      <h2>Buy Airtime</h2>
      
      <div className="form-group">
        <label>Phone Number</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="254712345678"
        />
      </div>

      <div className="form-group">
        <label>Network</label>
        <select value={network} onChange={(e) => setNetwork(e.target.value)}>
          <option value="SAFARICOM">Safaricom</option>
          <option value="AIRTEL">Airtel</option>
          <option value="TELKOM">Telkom</option>
        </select>
      </div>

      <div className="form-group">
        <label>Amount (USDC)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value))}
          min="0.1"
          step="0.1"
        />
      </div>

      <div className="info">
        <p>You will receive: <strong>≈ {airtimeValue} KES</strong> airtime</p>
        <p className="text-muted">Rate: 1 USDC = {exchangeRate} KES</p>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">✅ Airtime sent successfully!</div>}

      <button 
        onClick={handlePurchase} 
        disabled={loading || !phone || amount <= 0}
      >
        {loading ? 'Processing...' : 'Buy Airtime'}
      </button>
    </div>
  );
}
```

---

### **Example 2: Advanced Component with Status Polling**

```typescript
import { useState, useEffect } from 'react';
import { 
  Rift, 
  RampToken, 
  OfframpCurrency, 
  RampChain,
  InsufficientFloatBalanceError 
} from '@rift/wallet';

interface TransactionStatus {
  code: string;
  status: 'pending' | 'completed' | 'failed';
  receiptNumber?: string;
}

function AdvancedAirtimePurchase() {
  const [phone, setPhone] = useState('254');
  const [amount, setAmount] = useState(1);
  const [network, setNetwork] = useState('SAFARICOM');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transaction, setTransaction] = useState<TransactionStatus | null>(null);
  const [exchangeRate, setExchangeRate] = useState(130.5);

  // Fetch rate
  useEffect(() => {
    fetchExchangeRate();
  }, []);

  // Poll transaction status
  useEffect(() => {
    if (transaction && transaction.status === 'pending') {
      const interval = setInterval(() => {
        pollTransactionStatus(transaction.code);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [transaction]);

  async function fetchExchangeRate() {
    try {
      const rate = await rift.offramp.previewExchangeRate({ 
        currency: OfframpCurrency.KES 
      });
      setExchangeRate(rate.rate);
    } catch (err) {
      console.error('Failed to fetch rate:', err);
    }
  }

  async function pollTransactionStatus(transactionCode: string) {
    try {
      const status = await rift.offramp.pollOrderStatus({
        transactionCode,
        currency: OfframpCurrency.KES
      });

      if (status.status === 'completed' || status.status === 'failed') {
        setTransaction({
          code: transactionCode,
          status: status.status as any,
          receiptNumber: status.receipt_number || undefined
        });
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to poll status:', err);
    }
  }

  async function handlePurchase() {
    setLoading(true);
    setError('');
    setTransaction(null);

    try {
      // Validate phone number
      if (!phone.match(/^254\d{9}$/)) {
        throw new Error('Invalid phone number. Format: 254712345678');
      }

      // Create order
      const result = await rift.offramp.createOrder({
        token: RampToken.USDC,
        amount: amount,
        currency: OfframpCurrency.KES,
        chain: RampChain.BASE,
        recipient: JSON.stringify({
          accountIdentifier: phone,
          institution: network
        }),
        utilities: true,
        service_code: `SP-${network}`,
        contact_number: phone,
        shortcode: network
      });

      // Set transaction for polling
      setTransaction({
        code: result.order.transactionCode,
        status: 'pending'
      });

    } catch (err: any) {
      // Handle specific errors
      if (err.error === "Insufficient float balance") {
        const floatError = err as InsufficientFloatBalanceError;
        const maxUsdc = (floatError.available / exchangeRate).toFixed(2);
        setError(`Platform low on funds. Maximum: ${maxUsdc} USDC`);
      } else if (err.error?.includes('timeout')) {
        setError('Request timed out. Please try again.');
      } else {
        setError(err.message || 'Transaction failed');
      }
      
      setLoading(false);
    }
  }

  const airtimeValue = (amount * exchangeRate).toFixed(2);

  return (
    <div className="airtime-purchase-advanced">
      <h2>Buy Airtime</h2>

      {!transaction && (
        <>
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="254712345678"
              disabled={loading}
            />
            <small>Format: 254XXXXXXXXX</small>
          </div>

          <div className="form-group">
            <label>Network</label>
            <select 
              value={network} 
              onChange={(e) => setNetwork(e.target.value)}
              disabled={loading}
            >
              <option value="SAFARICOM">Safaricom</option>
              <option value="AIRTEL">Airtel</option>
              <option value="TELKOM">Telkom</option>
            </select>
          </div>

          <div className="form-group">
            <label>Amount (USDC)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
              min="0.1"
              step="0.1"
              disabled={loading}
            />
          </div>

          <div className="conversion-info">
            <div className="conversion-row">
              <span>Airtime value:</span>
              <strong>≈ {airtimeValue} KES</strong>
            </div>
            <div className="conversion-row text-muted">
              <span>Exchange rate:</span>
              <span>1 USDC = {exchangeRate} KES</span>
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
              <strong>❌ Error:</strong> {error}
            </div>
          )}

          <button 
            className="btn-primary"
            onClick={handlePurchase} 
            disabled={loading || !phone || amount <= 0}
          >
            {loading ? '⏳ Processing...' : '💰 Buy Airtime'}
          </button>
        </>
      )}

      {transaction && (
        <div className="transaction-status">
          {transaction.status === 'pending' && (
            <>
              <div className="spinner"></div>
              <h3>⏳ Processing Transaction...</h3>
              <p>Sending {airtimeValue} KES airtime to {phone}</p>
              <p className="text-muted">
                Transaction Code: {transaction.code}
              </p>
            </>
          )}

          {transaction.status === 'completed' && (
            <>
              <div className="success-icon">✅</div>
              <h3>Airtime Sent Successfully!</h3>
              <p>{airtimeValue} KES airtime delivered to {phone}</p>
              {transaction.receiptNumber && (
                <p className="text-muted">
                  Receipt: {transaction.receiptNumber}
                </p>
              )}
              <button 
                className="btn-secondary"
                onClick={() => setTransaction(null)}
              >
                Buy More Airtime
              </button>
            </>
          )}

          {transaction.status === 'failed' && (
            <>
              <div className="error-icon">❌</div>
              <h3>Transaction Failed</h3>
              <p>Unable to complete airtime purchase</p>
              <button 
                className="btn-secondary"
                onClick={() => setTransaction(null)}
              >
                Try Again
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
```

---

### **Example 3: Batch Airtime Purchase**

```typescript
async function buyAirtimeForMultipleNumbers(
  recipients: Array<{ phone: string; amount: number }>,
  network: string = 'SAFARICOM'
) {
  const results = [];

  for (const recipient of recipients) {
    try {
      const result = await rift.offramp.createOrder({
        token: RampToken.USDC,
        amount: recipient.amount,
        currency: OfframpCurrency.KES,
        chain: RampChain.BASE,
        recipient: JSON.stringify({
          accountIdentifier: recipient.phone,
          institution: network
        }),
        utilities: true,
        service_code: `SP-${network}`,
        contact_number: recipient.phone,
        shortcode: network
      });

      results.push({
        phone: recipient.phone,
        success: true,
        transactionCode: result.order.transactionCode
      });

      console.log(`✅ Sent ${recipient.amount} USDC airtime to ${recipient.phone}`);

    } catch (error: any) {
      results.push({
        phone: recipient.phone,
        success: false,
        error: error.message
      });

      console.error(`❌ Failed to send to ${recipient.phone}:`, error.message);
    }

    // Add delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}

// Usage:
const recipients = [
  { phone: "254712345678", amount: 0.5 },
  { phone: "254700123456", amount: 1.0 },
  { phone: "254722222222", amount: 0.75 }
];

const results = await buyAirtimeForMultipleNumbers(recipients);
console.log('Batch results:', results);
```

---

## 📊 Testing Checklist

Before going to production, test:

- [ ] Small amount (0.1 USDC)
- [ ] Medium amount (1 USDC)
- [ ] Large amount (10 USDC)
- [ ] Different networks (Safaricom, Airtel, Telkom)
- [ ] Invalid phone number
- [ ] Insufficient balance scenario
- [ ] Network timeout scenario
- [ ] Status polling until completion
- [ ] Multiple purchases in sequence

---

## 🔐 Security Best Practices

1. **Validate Phone Numbers:**
   ```typescript
   function isValidKenyanPhone(phone: string): boolean {
     return /^254\d{9}$/.test(phone);
   }
   ```

2. **Limit Maximum Amount:**
   ```typescript
   const MAX_AIRTIME_USDC = 10; // Max 10 USDC per transaction
   if (amount > MAX_AIRTIME_USDC) {
     throw new Error('Maximum amount exceeded');
   }
   ```

3. **Rate Limiting:**
   ```typescript
   // Prevent spam purchases
   const lastPurchaseTime = localStorage.getItem('lastAirtimePurchase');
   const now = Date.now();
   
   if (lastPurchaseTime && now - parseInt(lastPurchaseTime) < 60000) {
     throw new Error('Please wait 1 minute between purchases');
   }
   
   localStorage.setItem('lastAirtimePurchase', now.toString());
   ```

4. **Confirm Before Purchase:**
   ```typescript
   const confirmed = window.confirm(
     `Confirm purchase:\n\n` +
     `${airtimeValue} KES airtime\n` +
     `To: ${phone}\n` +
     `Cost: ${amount} USDC\n\n` +
     `Continue?`
   );
   
   if (!confirmed) return;
   ```

---

## 📞 Support

### **Need Help?**

- 📧 Email: support@riftfi.xyz
- 📖 Documentation: See `RAMP_QUICKSTART.md`
- 💬 Discord: [Join our community]

### **Common Questions:**

**Q: How long does airtime delivery take?**  
A: Usually 10-30 seconds. Maximum 2 minutes.

**Q: What if the transaction fails?**  
A: USDC is not deducted. User can try again.

**Q: Can I refund airtime?**  
A: No, airtime purchases are non-refundable.

**Q: What's the minimum amount?**  
A: 0.1 USDC (≈ 13 KES airtime)

**Q: What's the maximum amount?**  
A: Check platform limits. Typically 100 USDC.

---

**Last Updated:** November 1, 2025  
**SDK Version:** Latest  
**Feature:** Utility Payments (KES Only)  
**Status:** ✅ Production Ready

