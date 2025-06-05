import { Sphere, Environment } from "../src/index";

// Example usage of the M-Pesa onramp service
async function mpesaOnRampExample() {
  // Initialize the Sphere SDK
  const sphere = new Sphere({
    environment: Environment.PRODUCTION, // or Environment.DEVELOPMENT
    apiKey: "your-api-key-here", // Optional, set if you have one
    timeout: 30000, // Optional timeout in milliseconds
    retries: 3, // Optional retry count
  });

  // You can also set the M-Pesa API key separately if needed
  // sphere.setMpesaApiKey("your-mpesa-api-key-here");

  try {
    // Step 1: Initiate STK push for crypto on-ramping
    console.log("Initiating M-Pesa STK push...");
    const stkResponse = await sphere.onramp.initiateSafaricomSTK({
      email: "user@example.com", // Optional
      amount: 100, // Amount in KES
      phone: "0713322025", // User's phone number
      cryptoAsset: "POL-USDC", // Supported: POL-USDC, BERA-USDC, ETH, WBERA
      cryptoWalletAddress: "0x31DEBea3ba4101bb582dc31fDB3068bE686791b0",
      externalReference: "1479800864", // Unique identifier (e.g., Telegram ID)
    });

    console.log("STK Push initiated:", stkResponse);

    if (stkResponse.success) {
      const checkoutRequestId = stkResponse.data.checkoutRequestID;

      // Step 2: Poll for transaction status until completion using checkout ID
      console.log("Polling for transaction status...");
      const finalStatus = await sphere.onramp.pollSafaricomTransactionStatus(
        checkoutRequestId, // Pass checkout ID as first parameter
        undefined, // No merchant ID
        10, // Max attempts
        10000 // Poll every 10 seconds
      );

      console.log("Final transaction status:", finalStatus);

      if (finalStatus.status === "success") {
        console.log("🎉 Payment successful!");
        console.log("M-Pesa Receipt:", finalStatus.data.mpesaReceiptNumber);
        console.log("Crypto TX Hash:", finalStatus.data.cryptoTxHash);
        console.log("Crypto Amount:", finalStatus.data.cryptoAmount);
      } else if (finalStatus.status === "failed") {
        console.log("❌ Payment failed:", finalStatus.data.failureReason);
      } else {
        console.log("⏳ Payment still pending");
      }
    }
  } catch (error) {
    console.error("Error during M-Pesa transaction:", error);
  }
}

// Example of manual status checking (alternative to polling)
async function manualStatusCheck() {
  const sphere = new Sphere({
    environment: Environment.PRODUCTION,
    apiKey: "your-api-key-here",
  });

  try {
    // Check status by checkout request ID
    const status = await sphere.onramp.getSafaricomTransactionStatus({
      checkoutRequestId: "ws_CO_05062025134410304713322025",
    });

    console.log("Transaction status:", status);

    // Or check by merchant request ID
    const statusByMerchant = await sphere.onramp.getSafaricomTransactionStatus({
      merchantRequestId: "ed4e-4482-896f-139740cf342c4176666",
    });

    console.log("Transaction status by merchant ID:", statusByMerchant);
  } catch (error) {
    console.error("Error checking transaction status:", error);
  }
}

// Example showing all available onramp methods
async function showcaseAllMethods() {
  const sphere = new Sphere({
    environment: Environment.PRODUCTION,
    apiKey: "your-api-key-here",
  });

  try {
    // 1. Initiate STK push
    const stkResponse = await sphere.onramp.initiateSafaricomSTK({
      amount: 50,
      phone: "0713322025",
      cryptoAsset: "BERA-USDC",
      cryptoWalletAddress: "0x31DEBea3ba4101bb582dc31fDB3068bE686791b0",
      externalReference: "user123",
    });

    const checkoutRequestId = stkResponse.data.checkoutRequestID;
    const merchantRequestId = stkResponse.data.merchantRequestID;

    // 2. Manual status check
    const manualStatus = await sphere.onramp.getSafaricomTransactionStatus({
      checkoutRequestId,
    });

    // 3. Auto-polling by checkout ID
    const polledByCheckout = await sphere.onramp.pollSafaricomTransactionStatus(
      checkoutRequestId, // Using checkout ID
      undefined, // No merchant ID
      5, // 5 attempts
      5000 // Every 5 seconds
    );

    // 4. Auto-polling by merchant ID
    const polledByMerchant = await sphere.onramp.pollSafaricomTransactionStatus(
      undefined, // No checkout ID
      merchantRequestId, // Using merchant ID
      5,
      5000
    );

    // 5. You can also pass both IDs (though only one is needed)
    const polledWithBoth = await sphere.onramp.pollSafaricomTransactionStatus(
      checkoutRequestId,
      merchantRequestId,
      3,
      3000
    );

    console.log("All methods executed successfully!");
  } catch (error) {
    console.error("Error in showcase:", error);
  }
}

// Example of fetching user transaction history
async function transactionHistoryExample() {
  const sphere = new Sphere({
    environment: Environment.PRODUCTION,
    apiKey: "your-api-key-here",
  });

  try {
    // 1. Get all transactions (no filters)
    console.log("Fetching all transactions...");
    const allTransactions = await sphere.onramp.getUserTransactionHistory();
    console.log("All transactions:", allTransactions);

    // 2. Get transactions with basic filters
    console.log("Fetching successful transactions...");
    const successfulTransactions =
      await sphere.onramp.getUserTransactionHistory({
        status: "success",
        cryptoStatus: "success",
        page: 1,
        limit: 20,
      });
    console.log("Successful transactions:", successfulTransactions);

    // 3. Get transactions by user email
    console.log("Fetching transactions for specific user...");
    const userTransactions = await sphere.onramp.getUserTransactionHistory({
      email: "user@example.com",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    console.log("User transactions:", userTransactions);

    // 4. Get transactions with date range filter
    console.log("Fetching transactions from last month...");
    const lastMonthTransactions = await sphere.onramp.getUserTransactionHistory(
      {
        startDate: "2024-12-01",
        endDate: "2024-12-31",
        minAmount: 50,
        maxAmount: 1000,
      }
    );
    console.log("Last month transactions:", lastMonthTransactions);

    // 5. Get transactions by external reference (e.g., Telegram ID)
    console.log("Fetching transactions by external reference...");
    const refTransactions = await sphere.onramp.getUserTransactionHistory({
      externalReference: "1479800864",
      status: "success",
    });
    console.log("External reference transactions:", refTransactions);

    // 6. Advanced filtering with multiple criteria
    console.log("Fetching with advanced filters...");
    const advancedFiltered = await sphere.onramp.getUserTransactionHistory({
      status: "success",
      cryptoStatus: "success",
      minAmount: 100,
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      page: 1,
      limit: 5,
      sortBy: "amount",
      sortOrder: "desc",
    });
    console.log("Advanced filtered transactions:", advancedFiltered);

    // 7. Pagination example
    console.log("Demonstrating pagination...");
    let currentPage = 1;
    const limit = 5;

    do {
      const pageData = await sphere.onramp.getUserTransactionHistory({
        page: currentPage,
        limit,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      console.log(`Page ${currentPage}:`, pageData.data.length, "transactions");
      console.log("Pagination info:", pageData.pagination);

      // Move to next page if available
      if (pageData.pagination.hasNextPage) {
        currentPage++;
      } else {
        break;
      }
    } while (currentPage <= 3); // Limit to 3 pages for demo
  } catch (error) {
    console.error("Error fetching transaction history:", error);
  }
}

// Run the example
if (require.main === module) {
  mpesaOnRampExample()
    .then(() => console.log("Example completed"))
    .catch((error) => console.error("Example failed:", error));
}

export {
  mpesaOnRampExample,
  manualStatusCheck,
  showcaseAllMethods,
  transactionHistoryExample,
};
