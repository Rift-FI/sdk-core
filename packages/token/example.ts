/**
 * Example usage of the Token deployment functionality
 * 
 * This example demonstrates how to deploy tokens using the static method
 */

import { Token, SupportedChain } from './src/index';

async function deployTokenExample() {
  try {
    console.log('🚀 Starting token deployment...');
    
    // Example 1: Basic token deployment
    console.log('\n📝 Example 1: Basic token deployment');
    const basicTokenAddress = await Token.deployToken({
      name: "Basic Example Token",
      symbol: "BASIC",
      totalSupply: "1000000", // 1 million tokens
      deployerPrivateKey: process.env.PRIVATE_KEY || "your-private-key-here",
      chain: SupportedChain.ETHEREUM_SEPOLIA
    });
    console.log(`✅ Basic token deployed at: ${basicTokenAddress}`);

    // Example 2: Token with role management
    console.log('\n📝 Example 2: Token with role management');
    const advancedTokenAddress = await Token.deployToken({
      name: "Advanced Example Token",
      symbol: "ADV",
      totalSupply: "5000000", // 5 million tokens
      minterAddress: "0x1234567890abcdef1234567890abcdef12345678", // Replace with actual address
      burnerAddress: "0xabcdef1234567890abcdef1234567890abcdef12", // Replace with actual address
      adminAddress: "0x9876543210fedcba9876543210fedcba98765432",  // Replace with actual address
      deployerPrivateKey: process.env.PRIVATE_KEY || "your-private-key-here",
      chain: SupportedChain.POLYGON_MUMBAI
    });
    console.log(`✅ Advanced token deployed at: ${advancedTokenAddress}`);

    // Example 3: Error handling
    console.log('\n📝 Example 3: Error handling');
    try {
      await Token.deployToken({
        name: "",  // Invalid: empty name
        symbol: "FAIL",
        totalSupply: "1000000",
        deployerPrivateKey: "invalid-key", // Invalid private key
        chain: SupportedChain.ETHEREUM_SEPOLIA
      });
    } catch (error) {
      console.log(`❌ Expected error caught: ${(error as Error).message}`);
    }

    console.log('\n🎉 All examples completed successfully!');

  } catch (error) {
    console.error('❌ Error in deployment:', error);
  }
}

// Example of environment setup
function setupExample() {
  console.log(`
🔧 Setup Instructions:

1. Install dependencies:
   npm install @stratosphere-network/token @stratosphere-network/shared

2. Set your private key as an environment variable:
   export PRIVATE_KEY="your-private-key-here"

3. Make sure you have testnet ETH for deployment fees

4. Update the factory contract addresses in the Token class:
   - Check DEFAULT_TOKEN_FACTORY_ADDRESSES in Token.ts
   - Replace placeholder addresses with actual deployed factory addresses

5. Run this example:
   npx ts-node example.ts

📚 Available Chains:
${Object.values(SupportedChain).map(chain => `   - ${chain}`).join('\n')}

⚠️  Warning: Never use real private keys in code or version control!
Use environment variables or secure key management for production.
  `);
}

// Run the example
if (require.main === module) {
  if (process.argv.includes('--setup')) {
    setupExample();
  } else {
    deployTokenExample();
  }
}

export { deployTokenExample, setupExample }; 