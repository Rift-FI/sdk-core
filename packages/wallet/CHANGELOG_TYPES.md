# Wallet SDK Type Changes

## Breaking Changes

### Authentication Requirements

All transaction and payment requests now require explicit authentication using one of three methods:

1. **External ID + Password** - For integrated authentication systems
2. **Phone Number + OTP Code** - For SMS-based verification
3. **Email + OTP Code** - For email-based verification

### Updated Types

#### `TransactionRequest`

- Removed index signature `[key: string]: any`
- Added mandatory authentication fields
- Now a discriminated union type for type safety

#### `SendSpecificPaymentRequest`

- Removed index signature `[key: string]: any`
- Renamed `username` → `recipientUsername`
- Added `recipientPhoneNumber` and `recipientEmail` options
- Added mandatory sender authentication fields
- Now combines recipient identification with sender authentication

#### `SendOpenPaymentRequest`

- Removed index signature `[key: string]: any`
- Added mandatory authentication fields
- Changed from interface to discriminated union type

## Impact

- **Type Safety**: No more arbitrary property additions
- **Security**: Explicit authentication requirements
- **Developer Experience**: Better TypeScript IntelliSense and compile-time validation
- **API Clarity**: More descriptive field names (e.g., `recipientUsername` vs `username`)

## Required Actions

1. Update all code using these types to include authentication fields
2. Remove any custom properties previously added via index signatures
3. Update field names in `SendSpecificPaymentRequest` (`username` → `recipientUsername`)
