/**
 * Rift SDK - Ramp API Examples
 * 
 * This file contains complete examples for all ramp operations including:
 * - Offramp (cash out to M-Pesa)
 * - Pay (same as offramp)
 * - Onramp (buy crypto with M-Pesa)
 * - Utility Payments (airtime, bills)
 * - Exchange Rates
 * - Status Checking
 * - Error Handling
 */

import { 
  Rift, 
  Environment,
  RampToken,
  OfframpCurrency,
  RampChain,
  CreateOfframpOrderRequest,
  PayRequest,
  BuyRequest,
  PreviewExchangeRateRequest,
  InsufficientFloatBalanceError,
  InsufficientUsdcBalanceError,
  UsdcTransferFailedError,
  RampTimeoutError
} from '@rift/wallet';

// Initialize SDK
const rift = new Rift({
  environment: Environment.PRODUCTION,
  apiKey: 'your-api-key-here'
});

// Set bearer token after user authentication
rift.setBearerToken('user-access-token');

// ============================================================================
// 1. OFFRAMP EXAMPLES - Send USDC, receive KES in M-Pesa
// ============================================================================

/**
 * Example 1a: Basic Offramp to M-Pesa (Regular Payment)
 * Send 10 USDC, user receives KES in their M-Pesa account
 */
async function basicOfframpExample() {
  try {
    const request: CreateOfframpOrderRequest = {
      token: RampToken.USDC,
      amount: 10, // 10 USDC
      currency: OfframpCurrency.KES,
      chain: RampChain.BASE,
      recipient: JSON.stringify({
        accountIdentifier: "254712345678", // M-Pesa phone number
        institution: "SAFARICOM"
      })
    };

    const response = await rift.offramp.createOrder(request);
    
    console.log('Offramp Order Created:', response.order);
    console.log('Transaction Code:', response.order.transactionCode);
    console.log('Status:', response.order.status);
  } catch (error: any) {
    handleRampError(error);
  }
}

/**
 * Example 1b: Offramp with Utility Payment (Buy Airtime)
 * Send USDC and automatically buy airtime for a phone number
 */
async function utilityPaymentOfframpExample() {
  try {
    const request: CreateOfframpOrderRequest = {
      token: RampToken.USDC,
      amount: 1, // 1 USDC worth of airtime
      currency: OfframpCurrency.KES,
      chain: RampChain.BASE,
      recipient: JSON.stringify({
        accountIdentifier: "254712345678",
        institution: "SAFARICOM"
      }),
      // Utility payment specific fields (all required if utilities: true)
      utilities: true,
      service_code: "SP-SAFARICOM", // Service provider code
      contact_number: "254712345678", // Recipient phone number
      shortcode: "SAFARICOM" // Network shortcode
    };

    const response = await rift.offramp.createOrder(request);
    
    console.log('Utility Payment Order Created:', response.order);
    console.log('Airtime will be sent to:', request.contact_number);
  } catch (error: any) {
    handleRampError(error);
  }
}

/**
 * Example 1c: Offramp to Bank Account (NGN example - uses old Pretium API)
 * This shows backward compatibility - non-KES currencies work exactly as before
 */
async function offrampToBankExample() {
  try {
    const request: CreateOfframpOrderRequest = {
      token: RampToken.USDC,
      amount: 50,
      currency: OfframpCurrency.NGN, // Nigerian Naira
      chain: RampChain.POLYGON,
      recipient: JSON.stringify({
        name: "John Doe",
        bankCode: "058", // GTBank code
        accountNumber: "0123456789",
        email: "john@example.com",
        phoneNumber: "+2348012345678"
      })
    };

    const response = await rift.offramp.createOrder(request);
    console.log('Bank Transfer Order Created:', response.order);
  } catch (error: any) {
    handleRampError(error);
  }
}

// ============================================================================
// 2. PAY EXAMPLES - Same as Offramp (alternative endpoint)
// ============================================================================

/**
 * Example 2a: Pay to M-Pesa (functionally identical to offramp)
 */
async function basicPayExample() {
  try {
    const request: PayRequest = {
      token: RampToken.USDC,
      amount: 5,
      currency: OfframpCurrency.KES,
      chain: RampChain.BASE,
      recipient: JSON.stringify({
        accountIdentifier: "254712345678",
        institution: "SAFARICOM"
      })
    };

    const response = await rift.offramp.pay(request);
    
    console.log('Payment Order Created:', response.order);
  } catch (error: any) {
    handleRampError(error);
  }
}

/**
 * Example 2b: Pay with Utility (buy airtime via Pay endpoint)
 */
async function utilityPaymentExample() {
  try {
    const request: PayRequest = {
      token: RampToken.USDC,
      amount: 2,
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
    };

    const response = await rift.offramp.pay(request);
    console.log('Utility payment successful:', response.order);
  } catch (error: any) {
    handleRampError(error);
  }
}

// ============================================================================
// 3. ONRAMP EXAMPLES - Buy USDC with M-Pesa
// ============================================================================

/**
 * Example 3a: Basic Onramp - Buy USDC with KES via M-Pesa
 * User pays KES via M-Pesa, receives USDC on Base chain
 */
async function basicOnrampExample() {
  try {
    const request: BuyRequest = {
      shortcode: "254712345678", // M-Pesa account to send payment from
      amount: 10, // 10 USDC
      chain: RampChain.BASE,
      asset: RampToken.USDC,
      mobile_network: "SAFARICOM",
      country_code: "KES"
    };

    const response = await rift.onrampV2.buy(request);
    
    console.log('Onramp Order Created:');
    console.log('Success:', response.success);
    console.log('Message:', response.message);
    
    if (response.data) {
      console.log('Order ID:', response.data.id);
      console.log('Amount:', response.data.amount);
      console.log('Status:', response.data.status);
      console.log('Account Number:', response.data.account_number);
    }
    
    if (response.transaction_code) {
      console.log('Transaction Code:', response.transaction_code);
    }
  } catch (error: any) {
    handleRampError(error);
  }
}

/**
 * Example 3b: Onramp with Different Network (e.g., Airtel)
 */
async function onrampAirtelExample() {
  try {
    const request: BuyRequest = {
      shortcode: "254700123456", // Airtel number
      amount: 5,
      chain: RampChain.BASE,
      asset: RampToken.USDC,
      mobile_network: "AIRTEL", // Different network
      country_code: "KES"
    };

    const response = await rift.onrampV2.buy(request);
    console.log('Airtel Onramp Order:', response);
  } catch (error: any) {
    handleRampError(error);
  }
}

/**
 * Example 3c: Large Onramp Order
 */
async function largeOnrampExample() {
  try {
    const request: BuyRequest = {
      shortcode: "254712345678",
      amount: 100, // 100 USDC
      chain: RampChain.BASE,
      asset: RampToken.USDC,
      mobile_network: "SAFARICOM",
      country_code: "KES"
    };

    const response = await rift.onrampV2.buy(request);
    console.log('Large Onramp Order:', response);
  } catch (error: any) {
    handleRampError(error);
  }
}

// ============================================================================
// 4. EXCHANGE RATE EXAMPLES
// ============================================================================

/**
 * Example 4a: Get Current KES Exchange Rate
 * Fetches all rate information for KES
 */
async function getExchangeRateExample() {
  try {
    const request: PreviewExchangeRateRequest = {
      currency: OfframpCurrency.KES
    };

    const response = await rift.offramp.previewExchangeRate(request);
    
    console.log('KES Exchange Rates:');
    console.log('Rate:', response.rate);
    console.log('Buying Rate:', response.buying_rate);
    console.log('Selling Rate:', response.selling_rate);
    console.log('Quoted Rate:', response.quoted_rate);
    
    // Calculate how much KES you'll get for 10 USDC
    const usdcAmount = 10;
    const kesAmount = usdcAmount * response.rate;
    console.log(`\n${usdcAmount} USDC = ${kesAmount} KES`);
  } catch (error: any) {
    console.error('Failed to get exchange rate:', error);
  }
}

/**
 * Example 4b: Get NGN Exchange Rate (uses old Pretium API)
 */
async function getNgnExchangeRateExample() {
  try {
    const request: PreviewExchangeRateRequest = {
      currency: OfframpCurrency.NGN
    };

    const response = await rift.offramp.previewExchangeRate(request);
    console.log('NGN Exchange Rate:', response);
  } catch (error: any) {
    console.error('Failed to get exchange rate:', error);
  }
}

/**
 * Example 4c: Calculate Total Cost for User
 */
async function calculateCostExample() {
  try {
    const rate = await rift.offramp.previewExchangeRate({ 
      currency: OfframpCurrency.KES 
    });
    
    const usdcToSend = 50;
    const kesReceived = usdcToSend * rate.selling_rate;
    
    console.log('Cost Calculation:');
    console.log(`Sending: ${usdcToSend} USDC`);
    console.log(`Receiving: ${kesReceived} KES`);
    console.log(`Exchange Rate: 1 USDC = ${rate.selling_rate} KES`);
  } catch (error: any) {
    console.error('Calculation failed:', error);
  }
}

// ============================================================================
// 5. STATUS CHECKING EXAMPLES
// ============================================================================

/**
 * Example 5a: Check Offramp Status (KES - checks database)
 */
async function checkOfframpStatusExample() {
  try {
    const transactionCode = "f8a6ebe7-5c20-404b-87d3-360dab4a153c";
    
    const response = await rift.offramp.pollOrderStatus({
      transactionCode,
      currency: OfframpCurrency.KES
    });
    
    console.log('Offramp Status:');
    console.log('Status:', response.status);
    console.log('Transaction Code:', response.transactionCode);
    console.log('Receipt Number:', response.receipt_number);
    console.log('Amount:', response.amount);
    console.log('Currency:', response.currency);
  } catch (error: any) {
    console.error('Failed to check status:', error);
  }
}

/**
 * Example 5b: Check Onramp Status
 */
async function checkOnrampStatusExample() {
  try {
    const transactionCode = "onramp_1730415234567_abc123";
    
    const response = await rift.onrampV2.getOnrampStatus(transactionCode);
    
    console.log('Onramp Status:');
    console.log('Status:', response.status);
    console.log('Transaction Code:', response.transactionCode);
    console.log('Transaction Hash:', response.transaction_hash);
    console.log('Amount:', response.amount);
    console.log('Shortcode:', response.shortcode);
    console.log('Chain:', response.chain);
    console.log('Asset:', response.asset);
  } catch (error: any) {
    console.error('Failed to check status:', error);
  }
}

/**
 * Example 5c: Poll Status Until Complete
 */
async function pollUntilCompleteExample() {
  const transactionCode = "f8a6ebe7-5c20-404b-87d3-360dab4a153c";
  const maxAttempts = 30;
  const delayMs = 2000; // 2 seconds
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const status = await rift.offramp.pollOrderStatus({
        transactionCode,
        currency: OfframpCurrency.KES
      });
      
      console.log(`Attempt ${attempt}: Status = ${status.status}`);
      
      if (status.status === 'completed' || status.status === 'failed') {
        console.log('Final Status:', status);
        return status;
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delayMs));
    } catch (error: any) {
      console.error(`Attempt ${attempt} failed:`, error.message);
    }
  }
  
  console.log('Polling timed out');
}

// ============================================================================
// 6. GET ORDERS EXAMPLES
// ============================================================================

/**
 * Example 6a: Get All Offramp Orders for User
 */
async function getAllOfframpOrdersExample() {
  try {
    const response = await rift.offramp.getOrders();
    
    console.log('Total Orders:', response.orders.length);
    
    response.orders.forEach((order, index) => {
      console.log(`\nOrder ${index + 1}:`);
      console.log('ID:', order.id);
      console.log('Status:', order.status);
      console.log('Amount:', order.amount);
      console.log('Transaction Code:', order.transactionCode);
      console.log('Created At:', order.createdAt);
      console.log('Receipt Number:', order.receipt_number);
      console.log('Transaction Hash:', order.transaction_hash);
    });
  } catch (error: any) {
    console.error('Failed to get orders:', error);
  }
}

/**
 * Example 6b: Get All Onramp Orders for User
 */
async function getAllOnrampOrdersExample() {
  try {
    const userId = "user-123-456"; // Your user ID
    const response = await rift.onrampV2.getOnrampOrders(userId);
    
    console.log('Total Onramp Orders:', response.length);
    
    response.forEach((order, index) => {
      console.log(`\nOnramp Order ${index + 1}:`);
      console.log('Status:', order.status);
      console.log('Transaction Code:', order.transactionCode);
      console.log('Amount:', order.amount);
      console.log('Transaction Hash:', order.transaction_hash);
    });
  } catch (error: any) {
    console.error('Failed to get onramp orders:', error);
  }
}

// ============================================================================
// 7. SUPPORTED INSTITUTIONS EXAMPLES
// ============================================================================

/**
 * Example 7a: Get Supported KES Institutions
 */
async function getSupportedInstitutionsExample() {
  try {
    const response = await rift.offramp.getSupportedInstitutions(
      OfframpCurrency.KES
    );
    
    console.log('KES Payment Methods:');
    console.log('Currency:', response.currency);
    console.log('Supports Banks:', response.metadata.supports_banks);
    console.log('Supports Mobile Money:', response.metadata.supports_mobile_money);
    
    console.log('\nInstitutions:', response.institutions);
    console.log('\nMobile Networks:', response.mobile_networks);
    
    console.log('\nPayment Types:');
    response.payment_types.forEach(type => {
      console.log(`- ${type.name}: ${type.description}`);
      console.log(`  Requires Account Number: ${type.requires_account_number}`);
    });
  } catch (error: any) {
    console.error('Failed to get institutions:', error);
  }
}

/**
 * Example 7b: Get Supported NGN Institutions
 */
async function getNgnInstitutionsExample() {
  try {
    const response = await rift.offramp.getSupportedInstitutions(
      OfframpCurrency.NGN
    );
    
    console.log('Nigerian Banks:', response.institutions);
  } catch (error: any) {
    console.error('Failed to get institutions:', error);
  }
}

// ============================================================================
// 8. WITHDRAWAL FEE EXAMPLES
// ============================================================================

/**
 * Example 8a: Get Withdrawal Fee for Amount
 */
async function getWithdrawalFeeExample() {
  try {
    const amount = 100; // 100 USDC
    const response = await rift.offramp.getWithdrawalFee(amount);
    
    console.log(`Withdrawal Fee for ${amount} USDC: ${response.fee}`);
    console.log(`Total Cost: ${amount + response.fee} USDC`);
  } catch (error: any) {
    console.error('Failed to get fee:', error);
  }
}

// ============================================================================
// 9. ERROR HANDLING EXAMPLES
// ============================================================================

/**
 * Comprehensive error handler for all Ramp operations
 */
function handleRampError(error: any) {
  console.error('\n❌ Error occurred:');
  
  // Insufficient Float Balance (KES offramp/pay)
  if (error.error === "Insufficient float balance") {
    const floatError = error as InsufficientFloatBalanceError;
    console.error('❌ Insufficient Float Balance Error:');
    console.error(`Required: ${floatError.required} ${floatError.currency}`);
    console.error(`Available: ${floatError.available} ${floatError.currency}`);
    console.error('Message:', floatError.message);
    return;
  }
  
  // Insufficient USDC Balance (KES onramp)
  if (error.error === "Insufficient USDC balance") {
    const usdcError = error as InsufficientUsdcBalanceError;
    console.error('❌ Insufficient USDC Balance Error:');
    console.error(`Required: ${usdcError.required} ${usdcError.asset}`);
    console.error(`Available: ${usdcError.available} ${usdcError.asset}`);
    console.error(`Chain: ${usdcError.chain}`);
    console.error('Message:', usdcError.message);
    return;
  }
  
  // USDC Transfer Failed
  if (error.error === "USDC transfer failed") {
    const transferError = error as UsdcTransferFailedError;
    console.error('❌ USDC Transfer Failed:');
    console.error('Provider:', transferError.provider);
    console.error('Transfer Error:', transferError.transferError);
    console.error('Message:', transferError.message);
    return;
  }
  
  // Timeout Error
  if (error.error && error.error.includes('timeout')) {
    const timeoutError = error as RampTimeoutError;
    console.error('❌ Request Timeout:');
    console.error('Error:', timeoutError.error);
    console.error('Message:', timeoutError.message || 'The payment provider took too long to respond');
    return;
  }
  
  // Generic error
  console.error('❌ Unexpected Error:');
  console.error('Error:', error.error || error.message);
  if (error.message) console.error('Message:', error.message);
  console.error('Full Error:', error);
}

/**
 * Example 9a: Handle All Possible Offramp Errors
 */
async function offrampWithFullErrorHandlingExample() {
  try {
    const request: CreateOfframpOrderRequest = {
      token: RampToken.USDC,
      amount: 1000, // Large amount might trigger insufficient balance
      currency: OfframpCurrency.KES,
      chain: RampChain.BASE,
      recipient: JSON.stringify({
        accountIdentifier: "254712345678",
        institution: "SAFARICOM"
      })
    };

    const response = await rift.offramp.createOrder(request);
    console.log('✅ Order created successfully:', response.order);
    
  } catch (error: any) {
    handleRampError(error);
    
    // Take action based on error type
    if (error.error === "Insufficient float balance") {
      console.log('\n💡 Action: Please try a smaller amount or contact support');
    } else if (error.error && error.error.includes('timeout')) {
      console.log('\n💡 Action: Please try again in a few moments');
    }
  }
}

/**
 * Example 9b: Handle Onramp Errors
 */
async function onrampWithErrorHandlingExample() {
  try {
    const request: BuyRequest = {
      shortcode: "254712345678",
      amount: 1000, // Large amount
      chain: RampChain.BASE,
      asset: RampToken.USDC,
      mobile_network: "SAFARICOM",
      country_code: "KES"
    };

    const response = await rift.onrampV2.buy(request);
    console.log('✅ Onramp order created:', response);
    
  } catch (error: any) {
    handleRampError(error);
  }
}

// ============================================================================
// 10. COMPLETE WORKFLOW EXAMPLES
// ============================================================================

/**
 * Example 10a: Complete Offramp Workflow
 * 1. Check exchange rate
 * 2. Get withdrawal fee
 * 3. Create order
 * 4. Poll status until complete
 */
async function completeOfframpWorkflowExample() {
  console.log('=== Complete Offramp Workflow ===\n');
  
  const usdcAmount = 10;
  
  try {
    // Step 1: Get exchange rate
    console.log('Step 1: Getting exchange rate...');
    const rateResponse = await rift.offramp.previewExchangeRate({
      currency: OfframpCurrency.KES
    });
    const kesAmount = usdcAmount * rateResponse.rate;
    console.log(`✅ Rate: 1 USDC = ${rateResponse.rate} KES`);
    console.log(`   You will receive: ${kesAmount} KES\n`);
    
    // Step 2: Get withdrawal fee
    console.log('Step 2: Checking withdrawal fee...');
    const feeResponse = await rift.offramp.getWithdrawalFee(usdcAmount);
    console.log(`✅ Fee: ${feeResponse.fee} USDC`);
    console.log(`   Total cost: ${usdcAmount + feeResponse.fee} USDC\n`);
    
    // Step 3: Create order
    console.log('Step 3: Creating offramp order...');
    const orderRequest: CreateOfframpOrderRequest = {
      token: RampToken.USDC,
      amount: usdcAmount,
      currency: OfframpCurrency.KES,
      chain: RampChain.BASE,
      recipient: JSON.stringify({
        accountIdentifier: "254712345678",
        institution: "SAFARICOM"
      })
    };
    
    const orderResponse = await rift.offramp.createOrder(orderRequest);
    console.log('✅ Order created!');
    console.log(`   Transaction Code: ${orderResponse.order.transactionCode}`);
    console.log(`   Status: ${orderResponse.order.status}\n`);
    
    // Step 4: Poll status
    console.log('Step 4: Monitoring transaction status...');
    const transactionCode = orderResponse.order.transactionCode;
    
    for (let i = 1; i <= 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
      
      const statusResponse = await rift.offramp.pollOrderStatus({
        transactionCode,
        currency: OfframpCurrency.KES
      });
      
      console.log(`   Check ${i}: ${statusResponse.status}`);
      
      if (statusResponse.status === 'completed') {
        console.log('\n✅ Transaction completed successfully!');
        console.log(`   Receipt: ${statusResponse.receipt_number}`);
        return;
      }
      
      if (statusResponse.status === 'failed') {
        console.log('\n❌ Transaction failed');
        return;
      }
    }
    
    console.log('\n⏳ Transaction still pending...');
    
  } catch (error: any) {
    console.error('\n❌ Workflow failed:');
    handleRampError(error);
  }
}

/**
 * Example 10b: Complete Onramp Workflow
 * 1. Check exchange rate
 * 2. Calculate KES amount needed
 * 3. Create onramp order
 * 4. Monitor status
 */
async function completeOnrampWorkflowExample() {
  console.log('=== Complete Onramp Workflow ===\n');
  
  const usdcAmount = 10;
  
  try {
    // Step 1: Get exchange rate
    console.log('Step 1: Getting exchange rate...');
    const rateResponse = await rift.offramp.previewExchangeRate({
      currency: OfframpCurrency.KES
    });
    const kesAmount = usdcAmount * rateResponse.buying_rate;
    console.log(`✅ Rate: 1 USDC = ${rateResponse.buying_rate} KES`);
    console.log(`   You need to pay: ${kesAmount} KES\n`);
    
    // Step 2: Create onramp order
    console.log('Step 2: Creating onramp order...');
    const onrampRequest: BuyRequest = {
      shortcode: "254712345678",
      amount: usdcAmount,
      chain: RampChain.BASE,
      asset: RampToken.USDC,
      mobile_network: "SAFARICOM",
      country_code: "KES"
    };
    
    const onrampResponse = await rift.onrampV2.buy(onrampRequest);
    console.log('✅ Onramp order created!');
    console.log(`   Status: ${onrampResponse.status}`);
    console.log(`   Message: ${onrampResponse.message}`);
    
    if (onrampResponse.transaction_code) {
      console.log(`   Transaction Code: ${onrampResponse.transaction_code}\n`);
      
      // Step 3: Monitor status
      console.log('Step 3: Please complete M-Pesa payment on your phone...');
      console.log('Monitoring transaction...\n');
      
      for (let i = 1; i <= 15; i++) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        
        const statusResponse = await rift.onrampV2.getOnrampStatus(
          onrampResponse.transaction_code
        );
        
        console.log(`   Check ${i}: ${statusResponse.status}`);
        
        if (statusResponse.status === 'completed') {
          console.log('\n✅ Onramp completed successfully!');
          console.log(`   Transaction Hash: ${statusResponse.transaction_hash}`);
          console.log(`   You received: ${statusResponse.amount} ${statusResponse.asset}`);
          return;
        }
        
        if (statusResponse.status === 'failed') {
          console.log('\n❌ Onramp failed');
          return;
        }
      }
      
      console.log('\n⏳ Transaction still pending...');
    }
    
  } catch (error: any) {
    console.error('\n❌ Workflow failed:');
    handleRampError(error);
  }
}

/**
 * Example 10c: Buy Airtime Workflow
 */
async function buyAirtimeWorkflowExample() {
  console.log('=== Buy Airtime Workflow ===\n');
  
  try {
    // Step 1: Check rate
    const rateResponse = await rift.offramp.previewExchangeRate({
      currency: OfframpCurrency.KES
    });
    
    const usdcAmount = 1;
    const airtimeValue = usdcAmount * rateResponse.rate;
    
    console.log(`Buying ${airtimeValue} KES worth of airtime for ${usdcAmount} USDC\n`);
    
    // Step 2: Purchase airtime
    const request: CreateOfframpOrderRequest = {
      token: RampToken.USDC,
      amount: usdcAmount,
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
    };
    
    const response = await rift.offramp.createOrder(request);
    console.log('✅ Airtime purchase initiated!');
    console.log(`   Transaction Code: ${response.order.transactionCode}`);
    console.log(`   Recipient: ${request.contact_number}`);
    
  } catch (error: any) {
    handleRampError(error);
  }
}

// ============================================================================
// 11. BATCH OPERATIONS EXAMPLES
// ============================================================================

/**
 * Example 11a: Send Money to Multiple Recipients
 */
async function batchOfframpExample() {
  const recipients = [
    { phone: "254712345678", amount: 5 },
    { phone: "254700123456", amount: 10 },
    { phone: "254722222222", amount: 3 }
  ];
  
  console.log('=== Batch Offramp to Multiple Recipients ===\n');
  
  for (const recipient of recipients) {
    try {
      const request: CreateOfframpOrderRequest = {
        token: RampToken.USDC,
        amount: recipient.amount,
        currency: OfframpCurrency.KES,
        chain: RampChain.BASE,
        recipient: JSON.stringify({
          accountIdentifier: recipient.phone,
          institution: "SAFARICOM"
        })
      };
      
      const response = await rift.offramp.createOrder(request);
      console.log(`✅ Sent ${recipient.amount} USDC to ${recipient.phone}`);
      console.log(`   Transaction Code: ${response.order.transactionCode}\n`);
      
    } catch (error: any) {
      console.error(`❌ Failed to send to ${recipient.phone}:`);
      handleRampError(error);
    }
  }
}

/**
 * Example 11b: Buy Airtime for Multiple Numbers
 */
async function batchAirtimeExample() {
  const recipients = [
    "254712345678",
    "254700123456",
    "254722222222"
  ];
  
  const airtimePerPerson = 0.5; // 0.5 USDC worth of airtime each
  
  console.log('=== Batch Airtime Purchase ===\n');
  
  for (const phone of recipients) {
    try {
      const request: CreateOfframpOrderRequest = {
        token: RampToken.USDC,
        amount: airtimePerPerson,
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
      };
      
      const response = await rift.offramp.createOrder(request);
      console.log(`✅ Airtime sent to ${phone}`);
      console.log(`   Transaction Code: ${response.order.transactionCode}\n`);
      
    } catch (error: any) {
      console.error(`❌ Failed to send airtime to ${phone}:`);
      handleRampError(error);
    }
  }
}

// ============================================================================
// RUN EXAMPLES
// ============================================================================

/**
 * Main function to run all examples
 * Uncomment the examples you want to test
 */
async function main() {
  console.log('🚀 Rift SDK Ramp API Examples\n');
  console.log('================================================\n');
  
  // IMPORTANT: Set your API key and bearer token before running
  // rift.setApiKey('your-api-key');
  // rift.setBearerToken('your-bearer-token');
  
  // Uncomment the examples you want to run:
  
  // await basicOfframpExample();
  // await utilityPaymentOfframpExample();
  // await offrampToBankExample();
  
  // await basicPayExample();
  // await utilityPaymentExample();
  
  // await basicOnrampExample();
  // await onrampAirtelExample();
  // await largeOnrampExample();
  
  // await getExchangeRateExample();
  // await getNgnExchangeRateExample();
  // await calculateCostExample();
  
  // await checkOfframpStatusExample();
  // await checkOnrampStatusExample();
  // await pollUntilCompleteExample();
  
  // await getAllOfframpOrdersExample();
  // await getAllOnrampOrdersExample();
  
  // await getSupportedInstitutionsExample();
  // await getNgnInstitutionsExample();
  
  // await getWithdrawalFeeExample();
  
  // await offrampWithFullErrorHandlingExample();
  // await onrampWithErrorHandlingExample();
  
  // await completeOfframpWorkflowExample();
  // await completeOnrampWorkflowExample();
  // await buyAirtimeWorkflowExample();
  
  // await batchOfframpExample();
  // await batchAirtimeExample();
  
  console.log('\n================================================');
  console.log('✅ Examples completed!');
}

// Export all examples
export {
  // Offramp
  basicOfframpExample,
  utilityPaymentOfframpExample,
  offrampToBankExample,
  
  // Pay
  basicPayExample,
  utilityPaymentExample,
  
  // Onramp
  basicOnrampExample,
  onrampAirtelExample,
  largeOnrampExample,
  
  // Exchange Rate
  getExchangeRateExample,
  getNgnExchangeRateExample,
  calculateCostExample,
  
  // Status
  checkOfframpStatusExample,
  checkOnrampStatusExample,
  pollUntilCompleteExample,
  
  // Orders
  getAllOfframpOrdersExample,
  getAllOnrampOrdersExample,
  
  // Institutions
  getSupportedInstitutionsExample,
  getNgnInstitutionsExample,
  
  // Fees
  getWithdrawalFeeExample,
  
  // Error Handling
  offrampWithFullErrorHandlingExample,
  onrampWithErrorHandlingExample,
  handleRampError,
  
  // Workflows
  completeOfframpWorkflowExample,
  completeOnrampWorkflowExample,
  buyAirtimeWorkflowExample,
  
  // Batch
  batchOfframpExample,
  batchAirtimeExample,
  
  // Main
  main
};

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

