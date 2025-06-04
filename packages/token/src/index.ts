import { TokenConfig, RPC_URLS, Chain } from "./types";
export { TokenConfig, Chain } from "./types";
import { TokenFactoryAbi } from "./utils/tokenFactory";
import { factoryAddress } from "./types";
import { ethers } from "ethers";

class Token {
  //support provider from metamask too
  async deployToken(
    config: TokenConfig,
    deployerPrivateKey?: string,
    walletInstance?: ethers.Wallet
  ) {
    if (!config.chain) {
      throw new Error("Chain is required");
    }

    if (config.chain !== Chain.BERACHAIN_MAINNET) {
      throw new Error(
        "Unsupported chain: This function only supports Berachain Mainnet."
      );
    }
    let wallet = walletInstance;
    if (!wallet && !deployerPrivateKey) {
      throw new Error("Deployer private key or wallet instance is required");
    }
    if (wallet && deployerPrivateKey) {
      wallet = new ethers.Wallet(deployerPrivateKey, wallet.provider);
    } else if (!wallet && deployerPrivateKey) {
      // Now that we've confirmed the chain is Berachain, we can directly use its string value.
      const rpcUrl = RPC_URLS[Chain.BERACHAIN_MAINNET];
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      wallet = new ethers.Wallet(deployerPrivateKey, provider);
    }

    const tokenFactoryAddress = factoryAddress[Chain.BERACHAIN_MAINNET];
    const tokenFactory = new ethers.Contract(
      tokenFactoryAddress,
      TokenFactoryAbi,
      wallet
    );
    try {
      const tx = await tokenFactory.createToken(
        config.name,
        config.symbol,
        config.totalSupply,
        config.decimals,
        config.isMintable || false,
        config.isBurnable || false,
        config.isPausable || false
      );
      const receipt = await tx.wait();
      console.log("Token deployed successfully:", receipt);
      return receipt?.hash;
    } catch (error) {
      console.error("Error deploying token:", error);
      throw error;
    }
  }
}

export default Token;
