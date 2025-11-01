# 🌍 Supported Countries - Rift Ramp API

Complete list of supported countries, currencies, and features for onramp/offramp operations.

---

## 📊 Quick Summary Table

| Country | Currency | Code | Onramp | Offramp | Utility Payments | API Provider | Chains |
|---------|----------|------|--------|---------|------------------|--------------|---------|
| 🇰🇪 **Kenya** | Kenyan Shilling | KES | ✅ Yes | ✅ Yes | ✅ Yes (Airtime) | Rift Ramp | BASE |
| 🇳🇬 **Nigeria** | Nigerian Naira | NGN | ⚠️ TBD | ✅ Yes | ❌ No | Pretium | POLYGON, BASE |
| 🇺🇬 **Uganda** | Ugandan Shilling | UGX | ⚠️ TBD | ✅ Yes | ❌ No | Pretium | POLYGON, BASE |
| 🇨🇩 **DR Congo** | Congolese Franc | CDF | ⚠️ TBD | ✅ Yes | ❌ No | Pretium | POLYGON, BASE |
| 🇪🇹 **Ethiopia** | Ethiopian Birr | ETB | ⚠️ TBD | ✅ Yes | ❌ No | Pretium | POLYGON, BASE |
| 🇬🇭 **Ghana** | Ghanaian Cedi | GHS | ⚠️ TBD | ✅ Yes | ❌ No | Pretium | POLYGON, BASE |

---

## 🇰🇪 Kenya (KES) - Full Support

### **Provider:** Rift Ramp API
### **Features:**
- ✅ **Onramp** - Buy USDC with M-Pesa
- ✅ **Offramp** - Cash out to M-Pesa
- ✅ **Utility Payments** - Buy airtime and pay bills
- ✅ **Real-time status** - Database-backed status checks
- ✅ **Balance validation** - Pre-flight checks before processing

### **Supported Networks:**
- Safaricom M-Pesa
- Airtel Money
- Other M-Pesa providers

### **Supported Chains:**
- Base (preferred for KES)

### **Example - Offramp:**
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
```

### **Example - Onramp:**
```typescript
const onramp = await rift.onrampV2.buy({
  shortcode: "254712345678",
  amount: 10,
  chain: RampChain.BASE,
  asset: RampToken.USDC,
  mobile_network: "SAFARICOM",
  country_code: "KES"
});
```

### **Example - Utility Payment (Airtime):**
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

---

## 🇳🇬 Nigeria (NGN)

### **Provider:** Pretium API
### **Features:**
- ⚠️ **Onramp** - Status unclear (check with backend team)
- ✅ **Offramp** - Bank transfers to Nigerian banks
- ❌ **Utility Payments** - Not supported
- ✅ **Bank transfers** - Support for all major Nigerian banks

### **Supported Chains:**
- Polygon (primary)
- Base (check availability)

### **Supported Payment Methods:**
- Bank transfers (various Nigerian banks)
- Mobile money (check availability)

### **Example - Offramp to Bank:**
```typescript
const order = await rift.offramp.createOrder({
  token: RampToken.USDC,
  amount: 50,
  currency: OfframpCurrency.NGN,
  chain: RampChain.POLYGON,
  recipient: JSON.stringify({
    name: "John Doe",
    bankCode: "058",  // GTBank code
    accountNumber: "0123456789",
    email: "john@example.com",
    phoneNumber: "+2348012345678"
  })
});
```

### **Get Supported Banks:**
```typescript
const institutions = await rift.offramp.getSupportedInstitutions(
  OfframpCurrency.NGN
);

console.log('Nigerian Banks:', institutions.institutions);
console.log('Payment Types:', institutions.payment_types);
```

---

## 🇺🇬 Uganda (UGX)

### **Provider:** Pretium API
### **Features:**
- ⚠️ **Onramp** - Status unclear (check with backend team)
- ✅ **Offramp** - Bank transfers and mobile money
- ❌ **Utility Payments** - Not supported

### **Supported Chains:**
- Polygon (primary)
- Base (check availability)

### **Example:**
```typescript
const order = await rift.offramp.createOrder({
  token: RampToken.USDC,
  amount: 50,
  currency: OfframpCurrency.UGX,
  chain: RampChain.POLYGON,
  recipient: JSON.stringify({
    name: "John Doe",
    bankCode: "XXX",  // Bank code
    accountNumber: "1234567890",
    email: "john@example.com",
    phoneNumber: "+256700123456"
  })
});
```

---

## 🇨🇩 DR Congo (CDF)

### **Provider:** Pretium API
### **Features:**
- ⚠️ **Onramp** - Status unclear (check with backend team)
- ✅ **Offramp** - Bank transfers and mobile money
- ❌ **Utility Payments** - Not supported

### **Supported Chains:**
- Polygon (primary)
- Base (check availability)

### **Example:**
```typescript
const order = await rift.offramp.createOrder({
  token: RampToken.USDC,
  amount: 50,
  currency: OfframpCurrency.CDF,
  chain: RampChain.POLYGON,
  recipient: JSON.stringify({
    name: "John Doe",
    bankCode: "XXX",
    accountNumber: "1234567890",
    email: "john@example.com",
    phoneNumber: "+243800123456"
  })
});
```

---

## 🇪🇹 Ethiopia (ETB)

### **Provider:** Pretium API
### **Features:**
- ⚠️ **Onramp** - Status unclear (check with backend team)
- ✅ **Offramp** - Bank transfers and mobile money
- ❌ **Utility Payments** - Not supported

### **Supported Chains:**
- Polygon (primary)
- Base (check availability)

### **Example:**
```typescript
const order = await rift.offramp.createOrder({
  token: RampToken.USDC,
  amount: 50,
  currency: OfframpCurrency.ETB,
  chain: RampChain.POLYGON,
  recipient: JSON.stringify({
    name: "John Doe",
    bankCode: "XXX",
    accountNumber: "1234567890",
    email: "john@example.com",
    phoneNumber: "+251900123456"
  })
});
```

---

## 🇬🇭 Ghana (GHS)

### **Provider:** Pretium API
### **Features:**
- ⚠️ **Onramp** - Status unclear (check with backend team)
- ✅ **Offramp** - Bank transfers and mobile money
- ❌ **Utility Payments** - Not supported

### **Supported Chains:**
- Polygon (primary)
- Base (check availability)

### **Example:**
```typescript
const order = await rift.offramp.createOrder({
  token: RampToken.USDC,
  amount: 50,
  currency: OfframpCurrency.GHS,
  chain: RampChain.POLYGON,
  recipient: JSON.stringify({
    name: "John Doe",
    bankCode: "XXX",
    accountNumber: "1234567890",
    email: "john@example.com",
    phoneNumber: "+233200123456"
  })
});
```

---

## 🔍 How to Check Supported Institutions

For any currency, you can query supported institutions dynamically:

```typescript
// Check supported institutions for a country
const institutions = await rift.offramp.getSupportedInstitutions(
  OfframpCurrency.KES  // or NGN, UGX, CDF, ETB, GHS
);

console.log('Currency:', institutions.currency);
console.log('Institutions:', institutions.institutions);
console.log('Mobile Networks:', institutions.mobile_networks);
console.log('Payment Types:', institutions.payment_types);

console.log('Metadata:');
console.log('  Country:', institutions.metadata.country);
console.log('  Currency Symbol:', institutions.metadata.currency_symbol);
console.log('  Supports Banks:', institutions.metadata.supports_banks);
console.log('  Supports Mobile Money:', institutions.metadata.supports_mobile_money);
```

---

## 📊 Feature Comparison

### **Offramp (Cash Out)**

| Feature | KES | NGN | UGX | CDF | ETB | GHS |
|---------|-----|-----|-----|-----|-----|-----|
| **Bank Transfer** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Mobile Money** | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| **Instant Transfer** | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| **Utility Payments** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Status Check** | ✅ Fast | ✅ API | ✅ API | ✅ API | ✅ API | ✅ API |
| **Balance Validation** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### **Onramp (Buy Crypto)**

| Feature | KES | NGN | UGX | CDF | ETB | GHS |
|---------|-----|-----|-----|-----|-----|-----|
| **Mobile Money** | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| **Bank Transfer** | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| **STK Push** | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| **Balance Validation** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Legend:**
- ✅ = Fully supported and tested
- ⚠️ = Check with backend team / may be supported
- ❌ = Not supported

---

## 🌐 Supported Blockchains

### **Base Chain**
- **Primary for:** KES (Kenya)
- **Token:** USDC
- **Features:** Fast, low fees
- **Status:** Production ready

### **Polygon Chain**
- **Primary for:** NGN, UGX, CDF, ETB, GHS
- **Token:** USDC
- **Features:** Widely supported
- **Status:** Production ready

---

## 💰 Exchange Rates

Get current exchange rates for any supported currency:

```typescript
// Get rates
const kesRate = await rift.offramp.previewExchangeRate({ 
  currency: OfframpCurrency.KES 
});

const ngnRate = await rift.offramp.previewExchangeRate({ 
  currency: OfframpCurrency.NGN 
});

const ugxRate = await rift.offramp.previewExchangeRate({ 
  currency: OfframpCurrency.UGX 
});

console.log('KES Rate:', kesRate.rate, 'KES per USDC');
console.log('NGN Rate:', ngnRate.rate, 'NGN per USDC');
console.log('UGX Rate:', ugxRate.rate, 'UGX per USDC');
```

---

## 🚦 Country-Specific Recipient Formats

### **Kenya (KES) - M-Pesa:**
```typescript
recipient: JSON.stringify({
  accountIdentifier: "254712345678",  // Phone number with country code
  institution: "SAFARICOM"            // Network name
})
```

### **Nigeria/Others - Bank Transfer:**
```typescript
recipient: JSON.stringify({
  name: "John Doe",                   // Account holder name
  bankCode: "058",                    // Bank code (get from API)
  accountNumber: "0123456789",        // Bank account number
  email: "john@example.com",          // Optional
  phoneNumber: "+2348012345678"       // Optional
})
```

---

## 📞 How to Get Institution Details

```typescript
// Get all supported institutions for a country
async function getCountryDetails(currency: OfframpCurrency) {
  const details = await rift.offramp.getSupportedInstitutions(currency);
  
  console.log(`\n=== ${currency} Details ===`);
  console.log('Country:', details.metadata.country);
  console.log('Currency Symbol:', details.metadata.currency_symbol);
  
  if (details.metadata.supports_banks) {
    console.log('\nBanks:', details.institutions.length);
    details.institutions.forEach(bank => {
      console.log(`  - ${bank}`);
    });
  }
  
  if (details.metadata.supports_mobile_money) {
    console.log('\nMobile Networks:', details.mobile_networks.length);
    details.mobile_networks.forEach(network => {
      console.log(`  - ${network}`);
    });
  }
  
  console.log('\nPayment Types:');
  details.payment_types.forEach(type => {
    console.log(`  - ${type.name}: ${type.description}`);
    console.log(`    Requires Account: ${type.requires_account_number}`);
  });
}

// Get details for all countries
await getCountryDetails(OfframpCurrency.KES);
await getCountryDetails(OfframpCurrency.NGN);
await getCountryDetails(OfframpCurrency.UGX);
await getCountryDetails(OfframpCurrency.CDF);
await getCountryDetails(OfframpCurrency.ETB);
await getCountryDetails(OfframpCurrency.GHS);
```

---

## ⚠️ Important Notes

### **1. KES (Kenya) is Special**
- Uses Rift Ramp API (faster, more features)
- All other currencies use Pretium API
- Different routing logic in backend

### **2. Onramp Availability**
- **KES:** Fully supported ✅
- **Others:** Check with backend team ⚠️

### **3. Utility Payments**
- **Only available for KES** 
- Includes airtime, bill payments
- Requires additional fields

### **4. Chain Selection**
- **KES:** Use BASE for best performance
- **Others:** Use POLYGON (more tested)

### **5. Recipient Format**
- **M-Pesa (KES):** Phone number + institution
- **Banks (Others):** Name + bank code + account number

---

## 🔄 Adding New Countries

To check if a new country is supported:

1. Try getting supported institutions:
```typescript
const institutions = await rift.offramp.getSupportedInstitutions(
  OfframpCurrency.XXX  // New currency code
);
```

2. If successful, the country is supported
3. Check metadata for available features
4. Update SDK enum if needed

---

## 📚 Usage Examples

See the complete examples in:
- `RAMP_QUICKSTART.md` - Quick examples for each country
- `ramp-api-examples.ts` - Production-ready code
- `README.md` - Overview and learning path

---

## 🆘 Support

### **To Enable a New Country:**
1. Contact Rift support team
2. Provide country code and requirements
3. Wait for backend configuration
4. Update SDK enum with new currency

### **To Check Current Support:**
```typescript
// This will fail if country is not supported
try {
  const institutions = await rift.offramp.getSupportedInstitutions(
    OfframpCurrency.XXX
  );
  console.log('✅ Country is supported!');
} catch (error) {
  console.log('❌ Country not supported yet');
}
```

---

**Last Updated:** November 1, 2025  
**Fully Supported:** Kenya (KES)  
**Partially Supported:** Nigeria, Uganda, DR Congo, Ethiopia, Ghana  
**In Development:** Contact support for expansion requests

