import { DividendsError } from "./error";
import {
  Chain,
  DistibuteDividendOutOnChain,
  DistributeDivdendOnchainConfig,
  DistributeDividendIn,
  DistributeDividendOut,
  SupportedChain,
} from "./types";
import {
  createWalletClient,
  http,
  parseUnits,
  PublicClient,
  WalletClient,
  Chain as ViemChain,
} from "viem";
import { DividendABI } from "./abi/dividend.abi";
import { ERC20Abi } from "./abi/erc20.abi";
import { DividendFactoryABI } from "./abi/dividend-factory.abi";
import { Wallet } from "ethers";
import { getChain, getChainFromSupportedChain } from "./utils";

export class Dividends {
  private chain: ViemChain;
  private publicClient: PublicClient;
  private walletClient: WalletClient | null;

  constructor(
    chain: SupportedChain,
    wallet: Wallet,
    viemClient: PublicClient,
    customChain?: Chain
  ) {
    // Use the injected viemClient as publicClient to avoid type conflicts
    this.publicClient = viemClient;

    // Initialize viem clients for blockchain interactions
    this.chain = getChain(
      customChain ? customChain : getChainFromSupportedChain(chain)
    );

    this.walletClient = createWalletClient({
      account: wallet.address as `0x${string}`,
      chain: this.chain,
      transport: http(
        customChain?.rpcUrl ?? this.chain.rpcUrls.default.http[0]
      ),
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

    const holders = await params.indexer(tokenAddress, {
      id: this.chain.id,
      rpcUrl: this.chain.rpcUrls.default.http[0],
    });

    // proceed it to dividend logic
    const dividendPreResult = await params.businessLogic({
      holders,
      totalSupply: tokenInfo.totalSupply,
      dividendAmount: parseUnits(
        params.amount.toString(),
        stableCoinInfo.decimals
      ).toString(),
      tokenAddress: tokenAddress,
      chain: {
        id: this.chain.id,
        rpcUrl: this.chain.rpcUrls.default.http[0],
      },
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
        account: this.walletClient?.account,
      });

      // send tx
      let tx: string | undefined = undefined;

      if (this.walletClient && this.walletClient.account) {
        tx = await this.walletClient.writeContract({
          ...request,
          account: this.walletClient.account,
        });
      }

      dividendResult.push({
        address: divPortion.address,
        amount: divPortion.amount,
        txHash: tx,
        type: "signed",
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

    const holders = await params.indexer(tokenAddress, {
      id: this.chain.id,
      rpcUrl: this.chain.rpcUrls.default.http[0],
    });

    // proceed it to dividend logic

    const dividendPreResult = await params.businessLogic({
      holders,
      totalSupply: tokenInfo.totalSupply,
      dividendAmount: parseUnits(
        params.amount.toString(),
        stableCoinInfo.decimals
      ).toString(),
      tokenAddress: tokenAddress,
      chain: {
        id: this.chain.id,
        rpcUrl: this.chain.rpcUrls.default.http[0],
      },
    });

    // perform dividend address stable coin availability first
    let totalAmountRequired = parseUnits("0", 0);
    {
      // calculate total amount required
      for (const divPortion of dividendPreResult) {
        totalAmountRequired =
          totalAmountRequired + parseUnits(divPortion.amount, 0);
      }

      if (
        config?.directTransfer &&
        this.walletClient &&
        this.walletClient.account
      ) {
        // transfer stable coin to dividend contract
        const { request } = await this.publicClient.simulateContract({
          abi: ERC20Abi,
          address: params.stableCoinAddress as `0x${string}`,
          functionName: "transfer",
          args: [dividendContractAddress as `0x${string}`, totalAmountRequired],
          account: this.walletClient.account,
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
          args: [this.walletClient?.account?.address as `0x${string}`],
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
      account: this.walletClient?.account,
    });

    // send tx
    let tx: string | undefined = undefined;
    if (this.walletClient && this.walletClient.account) {
      tx = await this.walletClient.writeContract({
        ...request,
        account: this.walletClient?.account,
      });
    }

    return {
      txHash: tx,
      txUnsigned: request,
      type: "signed",
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

  // Fee Management Methods

  /**
   * Set the fee percentage for dividend distributions
   * @param dividendContractAddress Address of the dividend contract
   * @param feePercentage Fee percentage in basis points (e.g., 250 = 2.5%)
   * @returns Transaction hash if signed, transaction object if unsigned
   */
  async setFeePercentage(
    dividendContractAddress: string,
    feePercentage: number
  ): Promise<{
    txHash?: string;
    txUnsigned?: any;
    type: "signed" | "unsigned";
  }> {
    const { request } = await this.publicClient.simulateContract({
      abi: DividendABI,
      address: dividendContractAddress as `0x${string}`,
      functionName: "setFeePercentage",
      args: [BigInt(feePercentage)],
      account: this.walletClient?.account,
    });

    let tx: string | undefined = undefined;
    if (this.walletClient && this.walletClient.account) {
      tx = await this.walletClient.writeContract({
        ...request,
        account: this.walletClient.account,
      });
    }

    return {
      txHash: tx,
      txUnsigned: request,
      type: tx ? "signed" : "unsigned",
    };
  }

  /**
   * Set the fee address for dividend distributions
   * @param dividendContractAddress Address of the dividend contract
   * @param feeAddress Address to receive fees
   * @returns Transaction hash if signed, transaction object if unsigned
   */
  async setFeeAddress(
    dividendContractAddress: string,
    feeAddress: string
  ): Promise<{
    txHash?: string;
    txUnsigned?: any;
    type: "signed" | "unsigned";
  }> {
    const { request } = await this.publicClient.simulateContract({
      abi: DividendABI,
      address: dividendContractAddress as `0x${string}`,
      functionName: "setFeeAddress",
      args: [feeAddress as `0x${string}`],
      account: this.walletClient?.account,
    });

    let tx: string | undefined = undefined;
    if (this.walletClient && this.walletClient.account) {
      tx = await this.walletClient.writeContract({
        ...request,
        account: this.walletClient.account,
      });
    }

    return {
      txHash: tx,
      txUnsigned: request,
      type: tx ? "signed" : "unsigned",
    };
  }

  /**
   * Get the current fee configuration
   * @param dividendContractAddress Address of the dividend contract
   * @returns Fee percentage (in basis points) and fee address
   */
  async getFeeConfiguration(
    dividendContractAddress: string
  ): Promise<{ feePercentage: bigint; feeAddress: string }> {
    const result = await this.publicClient.readContract({
      abi: DividendABI,
      address: dividendContractAddress as `0x${string}`,
      functionName: "getFeeConfiguration",
    });

    const [feePercentage, feeAddress] = result as [bigint, string];
    return { feePercentage, feeAddress };
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
}
