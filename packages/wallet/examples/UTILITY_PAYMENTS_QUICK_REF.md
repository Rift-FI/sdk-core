# 💡 Utility Payments - Quick Reference

Ultra-quick reference for integrating utility payments (airtime).

---

## ⚡ Quick Start (3 Steps)

### **1. Get Exchange Rate**
```typescript
const rate = await rift.offramp.previewExchangeRate({ 
  currency: OfframpCurrency.KES 
});
console.log(`1 USDC = ${rate.rate} KES`);
```

### **2. Buy Airtime**
```typescript
const result = await rift.offramp.createOrder({
  token: RampToken.USDC,
  amount: 1,  // 1 USDC
  currency: OfframpCurrency.KES,
  chain: RampChain.BASE,
  recipient: JSON.stringify({
    accountIdentifier: "254712345678",
    institution: "SAFARICOM"
  }),
  // ⭐ UTILITY PAYMENT FIELDS
  utilities: true,
  service_code: "SP-SAFARICOM",
  contact_number: "254712345678",
  shortcode: "SAFARICOM"
});
```

### **3. Check Status**
```typescript
const status = await rift.offramp.pollOrderStatus({
  transactionCode: result.order.transactionCode,
  currency: OfframpCurrency.KES
});
console.log(status.status); // "pending", "completed", or "failed"
```

---

## 📋 Required Fields

| Field | Value | Notes |
|-------|-------|-------|
| `utilities` | `true` | Must be true |
| `service_code` | `"SP-SAFARICOM"` | Or `"SP-AIRTEL"`, `"SP-TELKOM"` |
| `contact_number` | `"254712345678"` | Phone number |
| `shortcode` | `"SAFARICOM"` | Network name |

**ALL 4 FIELDS REQUIRED** when `utilities: true`

---

## 🎯 Expected Responses

### **Success:**
```json
{
  "order": {
    "id": "order_123",
    "status": "pending",
    "transactionCode": "f8a6ebe7...",
    "amount": 1,
    "createdAt": "2025-11-01T12:00:00.000Z",
    "currency": "KES"
  }
}
```

### **Insufficient Balance:**
```json
{
  "error": "Insufficient float balance",
  "message": "We don't have enough KES float...",
  "required": 1260,
  "available": 500,
  "currency": "KES"
}
```

### **Timeout:**
```json
{
  "error": "timeout of 30000ms exceeded",
  "message": "The payment provider is taking too long..."
}
```

---

## 🚦 Status Values

| Status | Meaning | Action |
|--------|---------|--------|
| `pending` | Processing | Keep polling |
| `completed` | Success | Show success |
| `failed` | Failed | Show error |

---

## 🔍 Network Codes

| Network | Service Code | Shortcode |
|---------|-------------|-----------|
| Safaricom | `SP-SAFARICOM` | `SAFARICOM` |
| Airtel | `SP-AIRTEL` | `AIRTEL` |
| Telkom | `SP-TELKOM` | `TELKOM` |

---

## 💻 Copy-Paste Function

```typescript
async function buyAirtime(
  phoneNumber: string,
  usdcAmount: number,
  network: 'SAFARICOM' | 'AIRTEL' | 'TELKOM' = 'SAFARICOM'
) {
  try {
    const result = await rift.offramp.createOrder({
      token: RampToken.USDC,
      amount: usdcAmount,
      currency: OfframpCurrency.KES,
      chain: RampChain.BASE,
      recipient: JSON.stringify({
        accountIdentifier: phoneNumber,
        institution: network
      }),
      utilities: true,
      service_code: `SP-${network}`,
      contact_number: phoneNumber,
      shortcode: network
    });
    
    return { 
      success: true, 
      transactionCode: result.order.transactionCode 
    };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Usage:
const result = await buyAirtime("254712345678", 1, "SAFARICOM");
if (result.success) {
  console.log("✅ Airtime sent! Code:", result.transactionCode);
} else {
  console.error("❌ Failed:", result.error);
}
```

---

## ⚠️ Common Mistakes

### ❌ **DON'T:**
```typescript
// Missing utility fields
utilities: true
// ❌ Missing service_code, contact_number, shortcode
```

### ✅ **DO:**
```typescript
// All 4 fields present
utilities: true,
service_code: "SP-SAFARICOM",
contact_number: "254712345678",
shortcode: "SAFARICOM"
```

---

## 🎯 UI Flow

```
1. User enters phone + amount
2. Show: "You'll get X KES airtime"
3. User clicks "Buy"
4. Show: "Processing..."
5. Poll status every 2-3 seconds
6. Show: "✅ Airtime sent!" or "❌ Failed"
```

---

## 📊 Conversion Formula

```typescript
const airtimeKES = usdcAmount * exchangeRate;

// Example:
// 1 USDC × 130.5 = 130.5 KES airtime
```

---

## 🚨 Error Handling (One-liner)

```typescript
const errorMsg = error.error === "Insufficient float balance" 
  ? "Platform low on funds. Try smaller amount."
  : error.error?.includes('timeout')
  ? "Timeout. Please retry."
  : "Transaction failed. Try again.";
```

---

## 📞 Support

- **Full Guide:** `UTILITY_PAYMENTS_GUIDE.md`
- **Examples:** `ramp-api-examples.ts`
- **Quick Start:** `RAMP_QUICKSTART.md`

---

**Last Updated:** November 1, 2025  
**Status:** ✅ Production Ready (KES Only)

