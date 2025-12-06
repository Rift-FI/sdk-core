/**
 * SAIL.R Trading Examples
 * 
 * This file demonstrates how to use the SAIL.R trading service to buy and sell SAIL.R tokens
 * with USDC on Base and Berachain networks.
 */

import { Rift, Environment } from "../src";

// Initialize SDK
const rift = new Rift({
  apiKey: "your-api-key",
  environment: Environment.PRODUCTION,
});

// Set bearer token after authentication
rift.setBearerToken("your-jwt-token");

/**
 * Example 1: Get a buy quote
 * Get cost estimate for buying SAIL.R with USDC
 */
async function getBuyQuoteExample() {
  try {
    const usdcAmount = "1000000"; // 1 USDC (6 decimals)
    
    const response = await rift.sailr.getBuyQuote(usdcAmount);
    
    console.log("=== Buy Quote ===");
    console.log("Success:", response.success);
    console.log("\n--- Quote Details ---");
    console.log("USDC to Swap:", response.quote.usdcToSwapFormatted);
    console.log("Total USDC Needed:", response.quote.totalUsdcNeededFormatted);
    console.log("Estimated SAIL.R:", response.quote.estimatedSailRFormatted);
    console.log("Can Execute:", response.quote.canExecute);
    
    console.log("\n--- Fees ---");
    console.log("Gas Refund:", response.quote.fees.gasRefundFormatted);
    console.log("ETH Gas:", response.quote.fees.ethGas);
    console.log("BERA Gas:", response.quote.fees.beraGas);
    
    console.log("\n--- Balances ---");
    console.log("Smart Wallet:", response.quote.balances.smartWalletFormatted);
    console.log("EOA:", response.quote.balances.eoaFormatted);
    console.log("Needs Transfer:", response.quote.balances.needsTransfer);
    if (response.quote.balances.needsTransfer) {
      console.log("Transfer Amount:", response.quote.balances.transferAmountFormatted);
    }
    
    console.log("\n--- Route Info ---");
    console.log("Multi-Hop:", response.quote.route.isMultiHop);
    console.log("Steps:", response.quote.route.steps);
    console.log("Provider:", response.quote.route.provider);
    
    console.log("\n--- Price Info ---");
    console.log("USDC per SAIL.R:", response.priceInfo.usdcPerSailR);
    console.log("Effective Rate:", response.priceInfo.effectiveRate);
    
    if (response.quote.warnings.length > 0) {
      console.log("\n--- Warnings ---");
      response.quote.warnings.forEach((warning) => console.log(`⚠️  ${warning}`));
    }
    
    return response;
  } catch (error) {
    console.error("Error getting buy quote:", error);
    throw error;
  }
}

/**
 * Example 2: Execute a buy transaction
 * Purchase SAIL.R tokens with USDC
 */
async function buyExample() {
  try {
    const response = await rift.sailr.buy({
      amount: "1000000", // 1 USDC (6 decimals)
    });
    
    console.log("=== Buy Transaction ===");
    console.log("Success:", response.success);
    console.log("Message:", response.message);
    console.log("\n--- Transaction Details ---");
    console.log("EOA Address:", response.eoaAddress);
    console.log("Estimated SAIL.R:", response.estimatedSailR);
    
    if (response.smartWalletToEOA) {
      console.log("\n--- Smart Wallet to EOA Transfer ---");
      console.log("TX Hash:", response.smartWalletToEOA);
    }
    
    console.log("\n--- Swap Transactions ---");
    response.swapTransactions.forEach((txHash, index) => {
      console.log(`Step ${index + 1}:`, txHash);
    });
    
    if (response.refund) {
      console.log("\n--- Gas Refund ---");
      console.log("ETH Sent:", response.refund.ethSent);
      console.log("BERA Sent:", response.refund.beraSent);
      console.log("Refund TX Hash:", response.refund.refundTxHash);
    }
    
    return response;
  } catch (error) {
    console.error("Error executing buy:", error);
    throw error;
  }
}

/**
 * Example 3: Get a sell quote
 * Get estimate for selling SAIL.R tokens for USDC
 */
async function getSellQuoteExample() {
  try {
    const sailrAmount = "5000000000000000"; // 0.005 SAIL.R (18 decimals)
    
    const response = await rift.sailr.getSellQuote(sailrAmount);
    
    console.log("=== Sell Quote ===");
    console.log("Success:", response.success);
    console.log("\n--- Quote Details ---");
    console.log("SAIL.R to Sell:", response.quote.sailrToSellFormatted);
    console.log("Estimated USDC (Gross):", response.quote.estimatedUsdcGrossFormatted);
    console.log("Estimated USDC (Net):", response.quote.estimatedUsdcNetFormatted);
    console.log("Can Execute:", response.quote.canExecute);
    
    console.log("\n--- Fees ---");
    console.log("Gas Refund:", response.quote.fees.gasRefundFormatted);
    console.log("ETH Gas:", response.quote.fees.ethGas);
    console.log("BERA Gas:", response.quote.fees.beraGas);
    
    console.log("\n--- Balances ---");
    console.log("SAIL.R in EOA:", response.quote.balances.sailrInEoaFormatted);
    console.log("Has Sufficient SAIL.R:", response.quote.balances.hasSufficientSailr);
    
    console.log("\n--- Route Info ---");
    console.log("Multi-Hop:", response.quote.route.isMultiHop);
    console.log("Steps:", response.quote.route.steps);
    console.log("Provider:", response.quote.route.provider);
    
    console.log("\n--- Price Info ---");
    console.log("SAIL.R per USDC:", response.priceInfo.sailrPerUsdc);
    console.log("Effective Rate:", response.priceInfo.effectiveRate);
    
    if (response.quote.warnings.length > 0) {
      console.log("\n--- Warnings ---");
      response.quote.warnings.forEach((warning) => console.log(`⚠️  ${warning}`));
    }
    
    return response;
  } catch (error) {
    console.error("Error getting sell quote:", error);
    throw error;
  }
}

/**
 * Example 4: Execute a sell transaction
 * Sell SAIL.R tokens for USDC
 */
async function sellExample() {
  try {
    const response = await rift.sailr.sell({
      amount: "5000000000000000", // 0.005 SAIL.R (18 decimals)
      returnToSmartWallet: true, // Optional, defaults to true
    });
    
    console.log("=== Sell Transaction ===");
    console.log("Success:", response.success);
    console.log("Message:", response.message);
    console.log("\n--- Transaction Details ---");
    console.log("EOA Address:", response.eoaAddress);
    console.log("Estimated USDC:", response.estimatedUsdc);
    
    console.log("\n--- Swap Transactions ---");
    response.swapTransactions.forEach((txHash, index) => {
      console.log(`Step ${index + 1}:`, txHash);
    });
    
    if (response.refund) {
      console.log("\n--- Gas Refund ---");
      console.log("ETH Sent:", response.refund.ethSent);
      console.log("BERA Sent:", response.refund.beraSent);
      console.log("Refund TX Hash:", response.refund.refundTxHash);
    }
    
    if (response.eoaToSmartWallet) {
      console.log("\n--- EOA to Smart Wallet Transfer ---");
      console.log("TX Hash:", response.eoaToSmartWallet);
    }
    
    return response;
  } catch (error) {
    console.error("Error executing sell:", error);
    throw error;
  }
}

/**
 * Example 5: Complete buy workflow
 * Get quote, check if executable, then execute
 */
async function completeBuyWorkflow() {
  try {
    console.log("Step 1: Getting buy quote...");
    const quote = await rift.sailr.getBuyQuote("1000000"); // 1 USDC
    
    if (!quote.quote.canExecute) {
      console.error("❌ Cannot execute buy:");
      if (quote.quote.warnings.length > 0) {
        quote.quote.warnings.forEach((warning) => console.log(`  - ${warning}`));
      }
      return;
    }
    
    console.log("✅ Quote looks good!");
    console.log(`You'll receive approximately: ${quote.quote.estimatedSailRFormatted}`);
    console.log(`Total cost: ${quote.quote.totalUsdcNeededFormatted}`);
    
    console.log("\nStep 2: Executing buy transaction...");
    const buyResult = await rift.sailr.buy({
      amount: "1000000",
    });
    
    console.log("✅ Buy completed successfully!");
    console.log(`SAIL.R will be delivered to: ${buyResult.eoaAddress}`);
    console.log("\nSwap transaction(s):");
    buyResult.swapTransactions.forEach((txHash) => {
      console.log(`  ${txHash}`);
    });
    
    return buyResult;
  } catch (error) {
    console.error("Error in buy workflow:", error);
    throw error;
  }
}

/**
 * Example 6: Complete sell workflow
 * Get quote, check if executable, then execute
 */
async function completeSellWorkflow() {
  try {
    console.log("Step 1: Getting sell quote...");
    const quote = await rift.sailr.getSellQuote("5000000000000000"); // 0.005 SAIL.R
    
    if (!quote.quote.canExecute) {
      console.error("❌ Cannot execute sell:");
      if (quote.quote.warnings.length > 0) {
        quote.quote.warnings.forEach((warning) => console.log(`  - ${warning}`));
      }
      return;
    }
    
    console.log("✅ Quote looks good!");
    console.log(`You'll receive approximately: ${quote.quote.estimatedUsdcNetFormatted} (net)`);
    console.log(`Gross USDC: ${quote.quote.estimatedUsdcGrossFormatted}`);
    console.log(`Gas refund: ${quote.quote.fees.gasRefundFormatted}`);
    
    console.log("\nStep 2: Executing sell transaction...");
    const sellResult = await rift.sailr.sell({
      amount: "5000000000000000",
      returnToSmartWallet: true,
    });
    
    console.log("✅ Sell completed successfully!");
    console.log(`USDC will be in your smart wallet`);
    console.log("\nSwap transaction(s):");
    sellResult.swapTransactions.forEach((txHash) => {
      console.log(`  ${txHash}`);
    });
    
    return sellResult;
  } catch (error) {
    console.error("Error in sell workflow:", error);
    throw error;
  }
}

/**
 * Example 7: Error handling
 * Handle common errors when trading SAIL.R
 */
async function errorHandlingExample() {
  try {
    const response = await rift.sailr.buy({
      amount: "1000000",
    });
    return response;
  } catch (error: any) {
    // Handle specific error types
    if (error.response) {
      const errorData = error.response.data;
      
      if (errorData.error?.includes("Insufficient")) {
        console.error("❌ Insufficient balance");
        console.error("Details:", errorData);
        // Handle insufficient balance
      } else if (errorData.error?.includes("timeout")) {
        console.error("❌ Request timed out");
        console.error("The payment provider is taking too long to respond");
        // Handle timeout - maybe retry
      } else if (errorData.error?.includes("Invalid or expired JWT")) {
        console.error("❌ Authentication failed");
        console.error("Please login again");
        // Handle auth error - redirect to login
      } else {
        console.error("❌ Unknown error:", errorData.error);
      }
    } else {
      console.error("❌ Network or other error:", error.message);
    }
    
    throw error;
  }
}

/**
 * Example 8: Get USDe sell quote
 * Get estimate for selling USDe tokens for USDC
 */
async function getUSDeSellQuoteExample() {
  try {
    const usdeAmount = "5000000000000000000"; // 5 USDe (18 decimals)
    
    const response = await rift.sailr.getUSDeSellQuote(usdeAmount);
    
    console.log("=== USDe Sell Quote ===");
    console.log("Success:", response.success);
    console.log("\n--- Quote Details ---");
    console.log("USDe to Sell:", response.quote.usdeToSellFormatted);
    console.log("Estimated USDC (Gross):", response.quote.estimatedUsdcGrossFormatted);
    console.log("Estimated USDC (Net):", response.quote.estimatedUsdcNetFormatted);
    console.log("Can Execute:", response.quote.canExecute);
    
    console.log("\n--- Fees ---");
    console.log("Gas Refund:", response.quote.fees.gasRefundFormatted);
    console.log("ETH Gas:", response.quote.fees.ethGas);
    console.log("BERA Gas:", response.quote.fees.beraGas);
    
    console.log("\n--- Balances ---");
    console.log("USDe in EOA:", response.quote.balances.usdeInEoaFormatted);
    console.log("Has Sufficient USDe:", response.quote.balances.hasSufficientUSDe);
    
    console.log("\n--- Route Info ---");
    console.log("Multi-Hop:", response.quote.route.isMultiHop);
    console.log("Steps:", response.quote.route.steps);
    console.log("Provider:", response.quote.route.provider);
    
    console.log("\n--- Price Info ---");
    console.log("USDe per USDC:", response.priceInfo.usdePerUsdc);
    console.log("Effective Rate:", response.priceInfo.effectiveRate);
    
    if (response.quote.warnings.length > 0) {
      console.log("\n--- Warnings ---");
      response.quote.warnings.forEach((warning) => console.log(`⚠️  ${warning}`));
    }
    
    return response;
  } catch (error) {
    console.error("Error getting USDe sell quote:", error);
    throw error;
  }
}

/**
 * Example 9: Sell USDe tokens
 * Execute a sell transaction to exchange USDe for USDC
 */
async function sellUSDeExample() {
  try {
    const response = await rift.sailr.sellUSDe({
      amount: "5000000000000000000", // 5 USDe (18 decimals)
      returnToSmartWallet: true, // Optional, defaults to true
    });
    
    console.log("=== USDe Sell Transaction ===");
    console.log("Success:", response.success);
    console.log("Message:", response.message);
    console.log("\n--- Transaction Details ---");
    console.log("EOA Address:", response.eoaAddress);
    console.log("Estimated USDC:", response.estimatedUsdc);
    
    console.log("\n--- Swap Transactions ---");
    response.swapTransactions.forEach((txHash, index) => {
      console.log(`Step ${index + 1}:`, txHash);
    });
    
    if (response.refund) {
      console.log("\n--- Gas Refund ---");
      console.log("ETH Sent:", response.refund.ethSent);
      console.log("BERA Sent:", response.refund.beraSent);
      console.log("Refund TX Hash:", response.refund.refundTxHash);
    }
    
    if (response.eoaToSmartWallet) {
      console.log("\n--- EOA to Smart Wallet Transfer ---");
      console.log("TX Hash:", response.eoaToSmartWallet);
    }
    
    return response;
  } catch (error) {
    console.error("Error selling USDe:", error);
    throw error;
  }
}

/**
 * Example 10: Complete USDe sell workflow
 * Get quote, check if executable, then execute
 */
async function completeUSDeSellWorkflow() {
  try {
    console.log("Step 1: Getting USDe sell quote...");
    const quote = await rift.sailr.getUSDeSellQuote("5000000000000000000"); // 5 USDe
    
    if (!quote.quote.canExecute) {
      console.error("❌ Cannot execute USDe sell:");
      if (quote.quote.warnings.length > 0) {
        quote.quote.warnings.forEach((warning) => console.log(`  - ${warning}`));
      }
      return;
    }
    
    console.log("✅ Quote looks good!");
    console.log(`You'll receive approximately: ${quote.quote.estimatedUsdcNetFormatted} (net)`);
    console.log(`Gross USDC: ${quote.quote.estimatedUsdcGrossFormatted}`);
    console.log(`Gas refund: ${quote.quote.fees.gasRefundFormatted}`);
    
    console.log("\nStep 2: Executing USDe sell transaction...");
    const sellResult = await rift.sailr.sellUSDe({
      amount: "5000000000000000000",
      returnToSmartWallet: true,
    });
    
    console.log("✅ USDe sell completed successfully!");
    console.log(`USDC will be in your smart wallet`);
    console.log("\nSwap transaction(s):");
    sellResult.swapTransactions.forEach((txHash) => {
      console.log(`  ${txHash}`);
    });
    
    return sellResult;
  } catch (error) {
    console.error("Error in USDe sell workflow:", error);
    throw error;
  }
}

// Export all examples
export {
  getBuyQuoteExample,
  buyExample,
  getSellQuoteExample,
  sellExample,
  completeBuyWorkflow,
  completeSellWorkflow,
  errorHandlingExample,
  getUSDeSellQuoteExample,
  sellUSDeExample,
  completeUSDeSellWorkflow,
};

// Run examples if this file is executed directly
if (require.main === module) {
  (async () => {
    try {
      console.log("=".repeat(60));
      console.log("SAIL.R & USDe Trading Examples");
      console.log("=".repeat(60));
      
      // Uncomment the example you want to run:
      
      // SAIL.R Examples
      // await getBuyQuoteExample();
      // await buyExample();
      // await getSellQuoteExample();
      // await sellExample();
      // await completeBuyWorkflow();
      // await completeSellWorkflow();
      
      // USDe Examples
      // await getUSDeSellQuoteExample();
      // await sellUSDeExample();
      // await completeUSDeSellWorkflow();
      
      // Error Handling
      // await errorHandlingExample();
      
      console.log("\n✅ Examples completed successfully!");
    } catch (error) {
      console.error("\n❌ Example failed:", error);
      process.exit(1);
    }
  })();
}

