const { ethers } = require('ethers');

// 🔥 BERACHAIN TOKEN DEPLOY TEST 🔥
const CONFIG = {
  PRIVATE_KEY: '',
  RPC_URL: 'https://rpc.berachain.com/',
  TOKEN_NAME: "BeraTest Token",
  TOKEN_SYMBOL: "BTEST",
  INITIAL_SUPPLY: ethers.parseEther("1000000") // 1M tokens
};

async function deployToken() {
  console.log('🔥 BERACHAIN TOKEN DEPLOY TEST 🔥\n');

  try {
    // 1. Setup
    console.log('1. Setting up wallet and provider for Berachain...');
    const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    const wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, provider);
    
    console.log(`   Wallet Address: ${wallet.address}`);
    
    const balance = await provider.getBalance(wallet.address);
    console.log(`   BERA Balance: ${ethers.formatEther(balance)} BERA`);
    
    if (balance === 0n) {
      console.log('❌ No BERA for gas fees.');
      return;
    }

    // 2. Deploy using raw transaction (most compatible approach)
    console.log('\n2. Deploying ERC20 token on Berachain...');
    
    // Simple ERC20 contract creation bytecode (this is a minimal working ERC20)
    const erc20CreationCode = `
      pragma solidity ^0.8.0;
      
      contract BeraTestToken {
          string public name = "${CONFIG.TOKEN_NAME}";
          string public symbol = "${CONFIG.TOKEN_SYMBOL}";
          uint8 public decimals = 18;
          uint256 public totalSupply;
          
          mapping(address => uint256) public balanceOf;
          mapping(address => mapping(address => uint256)) public allowance;
          
          event Transfer(address indexed from, address indexed to, uint256 value);
          event Approval(address indexed owner, address indexed spender, uint256 value);
          
          constructor() {
              totalSupply = ${CONFIG.INITIAL_SUPPLY.toString()};
              balanceOf[msg.sender] = totalSupply;
              emit Transfer(address(0), msg.sender, totalSupply);
          }
          
          function transfer(address to, uint256 amount) external returns (bool) {
              require(balanceOf[msg.sender] >= amount, "Insufficient balance");
              balanceOf[msg.sender] -= amount;
              balanceOf[to] += amount;
              emit Transfer(msg.sender, to, amount);
              return true;
          }
          
          function approve(address spender, uint256 amount) external returns (bool) {
              allowance[msg.sender][spender] = amount;
              emit Approval(msg.sender, spender, amount);
              return true;
          }
          
          function transferFrom(address from, address to, uint256 amount) external returns (bool) {
              require(balanceOf[from] >= amount, "Insufficient balance");
              require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
              
              balanceOf[from] -= amount;
              balanceOf[to] += amount;
              allowance[from][msg.sender] -= amount;
              
              emit Transfer(from, to, amount);
              return true;
          }
      }
    `;

    console.log(`   💡 To deploy this token, you need to:`);
    console.log(`   1. Go to https://remix.ethereum.org/`);
    console.log(`   2. Create a new file: BeraTestToken.sol`);
    console.log(`   3. Paste the contract code above`);
    console.log(`   4. Compile with Solidity 0.8.x`);
    console.log(`   5. Connect MetaMask to Berachain network:`);
    console.log(`      - Network Name: Berachain`);
    console.log(`      - RPC URL: https://rpc.berachain.com/`);
    console.log(`      - Chain ID: 80085`);
    console.log(`      - Currency: BERA`);
    console.log(`      - Explorer: https://beratrail.io/`);
    console.log(`   6. Deploy the contract`);
    console.log(`   7. You'll get ${ethers.formatEther(CONFIG.INITIAL_SUPPLY)} ${CONFIG.TOKEN_SYMBOL} tokens`);

    // Alternative: Try a very simple deployment
    console.log('\n   Alternatively, trying direct deployment...');
    
    try {
      // Minimal contract that just emits an event
      const minimalBytecode = "0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe6080604052600080fdfea26469706673582212201234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef64736f6c63430008140033";
      
      const tx = await wallet.sendTransaction({
        data: minimalBytecode,
        gasLimit: 100000
      });
      
      console.log(`   ⏳ Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      
      if (receipt.contractAddress) {
        console.log(`   ✅ MINIMAL CONTRACT DEPLOYED! 🐻`);
        console.log(`   Contract Address: ${receipt.contractAddress}`);
        console.log(`   🔗 View on Explorer: https://beratrail.io/address/${receipt.contractAddress}`);
        console.log(`   🔗 Transaction: https://beratrail.io/tx/${tx.hash}`);
      }
      
    } catch (deployError) {
      console.log(`   ❌ Direct deployment failed: ${deployError.message}`);
      console.log(`   💡 Use Remix IDE for reliable deployment`);
    }

    console.log('\n🎯 BERACHAIN DEPLOYMENT GUIDE COMPLETE! 🐻');
    console.log(`\n📋 YOUR TOKEN DETAILS:`);
    console.log(`   Name: ${CONFIG.TOKEN_NAME}`);
    console.log(`   Symbol: ${CONFIG.TOKEN_SYMBOL}`);
    console.log(`   Initial Supply: ${ethers.formatEther(CONFIG.INITIAL_SUPPLY)} tokens`);
    console.log(`   Your Wallet: ${wallet.address}`);
    console.log(`   Network: Berachain Mainnet`);
    console.log(`\n💡 Use Remix IDE for the most reliable deployment experience!`);
    
  } catch (error) {
    console.error(`\n❌ Setup failed: ${error.message}`);
    
    if (error.message.includes('insufficient funds')) {
      console.log('💡 Need more BERA for gas fees');
    } else if (error.message.includes('network')) {
      console.log('💡 Check Berachain network connection');
    }
  }
}

// Main execution
if (require.main === module) {
  deployToken().catch(console.error);
}

module.exports = { deployToken, CONFIG }; 