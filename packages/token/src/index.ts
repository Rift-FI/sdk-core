import { TokenConfig, RPC_URLS, Chain } from "./types";
export { TokenConfig, Chain } from "./types";
import { TokenFactoryAbi } from "./utils/tokenFactory";
import { TokenAbi } from "./utils/token";
import { factoryAddress } from "./types";
import { ethers } from "ethers";

type Role = "MINTER_ROLE" | "BURNER_ROLE" | "PAUSER_ROLE" | "UPGRADER_ROLE";

class Token {
  private getWallet(
    chain: Chain,
    privateKey?: string,
    walletInstance?: ethers.Wallet
  ) {
    if (walletInstance) {
      return walletInstance;
    }
    if (privateKey) {
      const rpcUrl = RPC_URLS[chain];
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      return new ethers.Wallet(privateKey, provider);
    }
    throw new Error("Private key or wallet instance is required");
  }

  private getProvider(chain: Chain) {
    const rpcUrl = RPC_URLS[chain];
    return new ethers.JsonRpcProvider(rpcUrl);
  }

  private getTokenContract(
    tokenAddress: string,
    walletOrProvider: ethers.Wallet | ethers.Provider
  ) {
    return new ethers.Contract(tokenAddress, TokenAbi, walletOrProvider);
  }

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
    const wallet = this.getWallet(
      config.chain,
      deployerPrivateKey,
      walletInstance
    );

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
        config.decimals
      );
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error("Transaction failed: no receipt");
      }

      const eventTopic =
        tokenFactory.interface.getEvent("TokenCreated")?.topicHash;
      if (!eventTopic) {
        throw new Error("TokenCreated event topic not found in ABI");
      }
      const log = receipt.logs.find((x: any) => x.topics[0] === eventTopic);

      if (!log) {
        throw new Error("TokenCreated event not found in transaction receipt");
      }
      const decodedLog = tokenFactory.interface.parseLog({
        topics: [...log.topics],
        data: log.data,
      });
      if (!decodedLog) {
        throw new Error("Failed to decode TokenCreated event");
      }
      const tokenAddress = decodedLog.args.tokenAddress;

      console.log("Token deployed successfully.");

      return {
        transactionHash: receipt.hash,
        tokenAddress: tokenAddress,
      };
    } catch (error) {
      console.error("Error deploying token:", error);
      throw error;
    }
  }

  async grantRole(
    chain: Chain,
    tokenAddress: string,
    role: Role,
    toAddress: string,
    deployerPrivateKey?: string,
    walletInstance?: ethers.Wallet
  ) {
    const wallet = this.getWallet(chain, deployerPrivateKey, walletInstance);
    const tokenContract = this.getTokenContract(tokenAddress, wallet);
    const roleHash = ethers.keccak256(ethers.toUtf8Bytes(role));
    const tx = await tokenContract.grantRole(roleHash, toAddress);
    return await tx.wait();
  }

  async revokeRole(
    chain: Chain,
    tokenAddress: string,
    role: Role,
    fromAddress: string,
    deployerPrivateKey?: string,
    walletInstance?: ethers.Wallet
  ) {
    const wallet = this.getWallet(chain, deployerPrivateKey, walletInstance);
    const tokenContract = this.getTokenContract(tokenAddress, wallet);
    const roleHash = ethers.keccak256(ethers.toUtf8Bytes(role));
    const tx = await tokenContract.revokeRole(roleHash, fromAddress);
    return await tx.wait();
  }

  async hasRole(
    chain: Chain,
    tokenAddress: string,
    role: Role,
    address: string
  ): Promise<boolean> {
    const provider = this.getProvider(chain);
    const tokenContract = this.getTokenContract(tokenAddress, provider);
    const roleHash = ethers.keccak256(ethers.toUtf8Bytes(role));
    return await tokenContract.hasRole(roleHash, address);
  }

  async setTransferable(
    chain: Chain,
    tokenAddress: string,
    isTransferable: boolean,
    deployerPrivateKey?: string,
    walletInstance?: ethers.Wallet
  ) {
    const wallet = this.getWallet(chain, deployerPrivateKey, walletInstance);
    const tokenContract = this.getTokenContract(tokenAddress, wallet);
    const tx = await tokenContract.setTransferable(isTransferable);
    return await tx.wait();
  }

  async pause(
    chain: Chain,
    tokenAddress: string,
    deployerPrivateKey?: string,
    walletInstance?: ethers.Wallet
  ) {
    const wallet = this.getWallet(chain, deployerPrivateKey, walletInstance);
    const tokenContract = this.getTokenContract(tokenAddress, wallet);
    const tx = await tokenContract.pause();
    return await tx.wait();
  }

  async unpause(
    chain: Chain,
    tokenAddress: string,
    deployerPrivateKey?: string,
    walletInstance?: ethers.Wallet
  ) {
    const wallet = this.getWallet(chain, deployerPrivateKey, walletInstance);
    const tokenContract = this.getTokenContract(tokenAddress, wallet);
    const tx = await tokenContract.unpause();
    return await tx.wait();
  }

  async upgradeTo(
    chain: Chain,
    tokenAddress: string,
    newImplementationAddress: string,
    deployerPrivateKey?: string,
    walletInstance?: ethers.Wallet
  ) {
    const wallet = this.getWallet(chain, deployerPrivateKey, walletInstance);
    const tokenContract = this.getTokenContract(tokenAddress, wallet);
    const tx = await tokenContract.upgradeToAndCall(
      newImplementationAddress,
      "0x"
    );
    return await tx.wait();
  }
}

export default Token;
