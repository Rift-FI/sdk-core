import { DividendsError } from "./error";
import {
  Chain,
  DistibuteDividendOutOnChain,
  DistributeDivdendOnchainConfig,
  DistributeDividendIn,
  DistributeDividendOut,
} from "./types";
import {
  Account,
  createPublicClient,
  createWalletClient,
  defineChain,
  encodeFunctionData,
  formatUnits,
  http,
  isHex,
  parseUnits,
  PublicClient,
  WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  mainnet,
  polygon,
  sepolia,
  base,
  arbitrum,
  optimism,
  baseSepolia,
  berachain,
  berachainBepolia,
} from "viem/chains";
import { DividendABI } from "./abi/dividend.abi";
import { ERC20Abi } from "./abi/erc20.abi";
import { DividendFactoryABI } from "./abi/dividend-factory.abi";

export class Dividends {
  private chain: Chain;
  private publicClient: PublicClient;
  private walletClient: WalletClient | null;
  private account: Account;
  private isPrivateKey: boolean;

  constructor(chain: Chain, privateKeyOrAddress: string) {
    this.chain = chain;
    this.publicClient = {} as PublicClient;
    this.walletClient = {} as WalletClient;

    const chainForUse = this.getChain(chain);
    if (isHex(privateKeyOrAddress)) {
      if (privateKeyOrAddress.length >= 60) {
        this.account = privateKeyToAccount(
          privateKeyOrAddress as `0x${string}`
        );
        this.walletClient = createWalletClient({
          account: this.account,
          chain: chainForUse,
          transport: http(chainForUse.rpcUrls.default.http[0]),
        });
        this.isPrivateKey = true;
      } else {
        this.isPrivateKey = false;
        this.account = {
          address: privateKeyOrAddress,
          type: "json-rpc",
        };
        this.walletClient = null;
      }
    } else {
      throw new DividendsError("Invalid private key or address");
    }

    this.publicClient = createPublicClient({
      transport: http(chainForUse.rpcUrls.default.http[0]),
    });
  }

  async distributeDividendManual(
    params: DistributeDividendIn
  ): Promise<DistributeDividendOut> {
    const tokenAddress = params.tokenAddress;
    const { tokenInfo, stableCoinInfo } = await this.setupToken(
      params.tokenAddress,
      params.stableCoinAddress
    );

    const holders = await params.indexer(tokenAddress, this.chain);

    // proceed it to dividend logic
    const dividendPreResult = await params.businessLogic({
      holders,
      totalSupply: tokenInfo.totalSupply,
      dividendAmount: parseUnits(
        params.amount.toString(),
        stableCoinInfo.decimals
      ).toString(),
      tokenAddress: tokenAddress,
      chain: this.chain,
    });

    // iterate over holders and send tx
    const dividendResult: DistributeDividendOut = [];
    for (const divPortion of dividendPreResult) {
      // perform erc20 transfer from stableCoinAddress to holder.address

      // we parse amount to 1 decimals, we assume that service will return amount in adjusted decimals
      const parsedAmount = parseUnits(divPortion.amount, 0);

      const { request } = await this.publicClient.simulateContract({
        address: params.stableCoinAddress as `0x${string}`,
        abi: ERC20Abi,
        functionName: "transfer",
        args: [divPortion.address as `0x${string}`, parsedAmount],
        account: this.account,
      });

      // send tx
      let tx: string | undefined = undefined;

      if (this.walletClient) {
        tx = await this.walletClient.writeContract({
          ...request,
          account: this.account,
        });
      }

      dividendResult.push({
        address: divPortion.address,
        amount: divPortion.amount,
        txHash: tx,
        type: this.isPrivateKey ? "signed" : "unsigned",
        txUnsigned: request,
      });
    }

    return dividendResult;
  }

  async distributeDividend(
    params: DistributeDividendIn,
    dividendContractAddress: string,
    config?: DistributeDivdendOnchainConfig
  ): Promise<DistibuteDividendOutOnChain> {
    const tokenAddress = params.tokenAddress;
    const { tokenInfo, stableCoinInfo } = await this.setupToken(
      params.tokenAddress,
      params.stableCoinAddress
    );

    const holders = await params.indexer(tokenAddress, this.chain);

    // proceed it to dividend logic

    const dividendPreResult = await params.businessLogic({
      holders,
      totalSupply: tokenInfo.totalSupply,
      dividendAmount: parseUnits(
        params.amount.toString(),
        stableCoinInfo.decimals
      ).toString(),
      tokenAddress: tokenAddress,
      chain: this.chain,
    });

    // perform dividend address stable coin availability first
    let totalAmountRequired = parseUnits("0", 0);
    {
      // calculate total amount required
      for (const divPortion of dividendPreResult) {
        totalAmountRequired =
          totalAmountRequired + parseUnits(divPortion.amount, 0);
      }

      if (config?.directTransfer && this.walletClient) {
        // transfer stable coin to dividend contract
        const { request } = await this.publicClient.simulateContract({
          abi: ERC20Abi,
          address: params.stableCoinAddress as `0x${string}`,
          functionName: "transfer",
          args: [dividendContractAddress as `0x${string}`, totalAmountRequired],
          account: this.account,
        });

        await this.walletClient.writeContract({
          ...request,
        });
      } else {
        // check admin balance through stable coin contract, if not enough, throw error
        const adminBalance = await this.publicClient.readContract({
          abi: ERC20Abi,
          address: params.stableCoinAddress as `0x${string}`,
          functionName: "balanceOf",
          args: [this.account?.address as `0x${string}`],
        });

        if (adminBalance < totalAmountRequired) {
          throw new DividendsError(
            "Admin balance is not enough to distribute dividend"
          );
        }
      }
    }

    // distribute divident through smart contract
    const now = new Date().getTime();
    const title = config?.title ?? `dividend-${now}`;
    const { request } = await this.publicClient.simulateContract({
      abi: DividendABI,
      address: dividendContractAddress as `0x${string}`,
      functionName: "distributeDividend",
      args: [
        title,
        params.stableCoinAddress,
        dividendPreResult.map((dpr) => dpr.address),
        dividendPreResult.map((dpr) => parseUnits(dpr.amount, 0)), // we parse amount to 1 decimals, we assume that service will return amount in adjusted decimals
      ],
      account: this.account,
    });

    // send tx
    let tx: string | undefined = undefined;
    if (this.account && this.walletClient) {
      tx = await this.walletClient.writeContract({
        ...request,
        account: this.account,
      });
    }

    return {
      txHash: tx,
      txUnsigned: request,
      type: this.isPrivateKey ? "signed" : "unsigned",
      dividendPortion: dividendPreResult,
    };
  }

  async getDividendContractAddress(
    factoryAddress: string,
    tokenAddress: string
  ): Promise<string> {
    const result = await this.publicClient.readContract({
      abi: DividendFactoryABI,
      address: factoryAddress as `0x${string}`,
      functionName: "getDividendByToken",
      args: [tokenAddress as `0x${string}`],
    });

    return result as string;
  }

  private async setupToken(tokenAddress: string, stableCoinAddress: string) {
    const tokenContract = {
      abi: ERC20Abi,
      address: tokenAddress as `0x${string}`,
    } as const;

    const stableCoinContract = {
      abi: ERC20Abi,
      address: stableCoinAddress as `0x${string}`,
    } as const;

    // Replace multicall with Promise.all for token info
    const [tokenName, tokenSymbol, tokenDecimals, tokenTotalSupply] =
      await Promise.all([
        this.publicClient.readContract({
          ...tokenContract,
          functionName: "name",
        }),
        this.publicClient.readContract({
          ...tokenContract,
          functionName: "symbol",
        }),
        this.publicClient.readContract({
          ...tokenContract,
          functionName: "decimals",
        }),
        this.publicClient.readContract({
          ...tokenContract,
          functionName: "totalSupply",
        }),
      ]);

    if (
      !tokenName ||
      !tokenSymbol ||
      tokenDecimals === undefined ||
      !tokenTotalSupply
    ) {
      throw new DividendsError("Failed to get token info");
    }

    const tokenInfo = {
      name: tokenName as string,
      symbol: tokenSymbol as string,
      decimals: tokenDecimals,
      totalSupply: tokenTotalSupply.toString(),
    };

    // Replace multicall with Promise.all for stable coin info
    const [
      stableCoinName,
      stableCoinSymbol,
      stableCoinDecimals,
      stableCoinTotalSupply,
    ] = await Promise.all([
      this.publicClient.readContract({
        ...stableCoinContract,
        functionName: "name",
      }),
      this.publicClient.readContract({
        ...stableCoinContract,
        functionName: "symbol",
      }),
      this.publicClient.readContract({
        ...stableCoinContract,
        functionName: "decimals",
      }),
      this.publicClient.readContract({
        ...stableCoinContract,
        functionName: "totalSupply",
      }),
    ]);

    if (
      !stableCoinName ||
      !stableCoinSymbol ||
      stableCoinDecimals === undefined ||
      !stableCoinTotalSupply
    ) {
      throw new DividendsError("Failed to get stable coin info");
    }

    const stableCoinInfo = {
      name: stableCoinName as string,
      symbol: stableCoinSymbol as string,
      decimals: stableCoinDecimals,
      totalSupply: stableCoinTotalSupply.toString(),
    };

    return {
      tokenInfo,
      stableCoinInfo,
    };
  }

  private getChain(chain: Chain) {
    switch (chain.id) {
      case 1:
        return mainnet;
      case 137:
        return polygon;
      case 8453:
        return base;
      case 42161:
        return arbitrum;
      case 10:
        return optimism;
      case 84532:
        return baseSepolia;
      case 288:
        return berachain;
      case 80069:
        return berachainBepolia;
      case 1313161554:
        return sepolia;
      default:
        if (!chain.rpcUrl) {
          throw new DividendsError(
            "No id match for chain, RPC URL is required"
          );
        }

        return defineChain({
          id: chain.id,
          name: "Custom",
          nativeCurrency: {
            decimals: 18,
            name: "Ether",
            symbol: "ETH",
          },
          rpcUrls: {
            default: {
              http: [chain.rpcUrl! as string],
            },
          },
        });
    }
  }
}
