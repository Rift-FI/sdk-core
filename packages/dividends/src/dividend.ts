import { DividendsError } from "./error";
import {
  AddressAmount,
  Chain,
  DistibuteDividendOutOnChain,
  DistributeDividendIn,
  DistributeDividendOut,
} from "./types";
import {
  Account,
  createPublicClient,
  createWalletClient,
  defineChain,
  erc20Abi,
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
import moment from "moment";

export class Dividends {
  private chain: Chain;
  private publicClient: PublicClient;
  private walletClient: WalletClient | null;
  private account: Account | null;

  constructor(chain: Chain, privateKey?: string) {
    this.chain = chain;
    this.publicClient = {} as PublicClient;
    this.walletClient = {} as WalletClient;

    const chainForUse = this.getChain(chain);
    if (privateKey && privateKey.length > 0) {
      if (!isHex(privateKey)) {
        throw new DividendsError("Invalid private key");
      }

      this.account = privateKeyToAccount(privateKey as `0x${string}`);
      this.walletClient = createWalletClient({
        account: this.account,
        chain: chainForUse,
        transport: http(chainForUse.rpcUrls.default.http[0]),
      });
    } else {
      this.account = null;
      this.walletClient = null;
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
      const parsedAmount = parseUnits(divPortion.amount, 1);

      const { request } = await this.publicClient.simulateContract({
        address: params.stableCoinAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "transfer",
        args: [divPortion.address as `0x${string}`, parsedAmount],
      });

      // send tx
      let tx: string | undefined = undefined;
      if (this.account && this.walletClient) {
        tx = await this.walletClient.writeContract({
          ...request,
          account: this.account,
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
    dividendName?: string
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

    // distribute divident through smart contract
    const now = moment().unix();
    const title = dividendName ?? `dividend-${now}`;
    const { request } = await this.publicClient.simulateContract({
      abi: DividendABI,
      address: dividendContractAddress as `0x${string}`,
      functionName: "distributeDividend",
      args: [
        title,
        params.stableCoinAddress,
        dividendPreResult.map((dpr) => dpr.address),
        dividendPreResult.map((dpr) => parseUnits(dpr.amount, 1)), // we parse amount to 1 decimals, we assume that service will return amount in adjusted decimals
      ],
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
      type: tx ? "signed" : "unsigned",
      dividendPortion: dividendPreResult,
    };
  }

  private async setupToken(tokenAddress: string, stableCoinAddress: string) {
    const tokenContract = {
      abi: erc20Abi,
      address: tokenAddress as `0x${string}`,
    } as const;

    const stableCoinContract = {
      abi: erc20Abi,
      address: stableCoinAddress as `0x${string}`,
    } as const;

    const tokenInfoResponse = await this.publicClient.multicall({
      contracts: [
        {
          ...tokenContract,
          functionName: "name",
        },
        {
          ...tokenContract,
          functionName: "symbol",
        },
        {
          ...tokenContract,
          functionName: "decimals",
        },
        {
          ...tokenContract,
          functionName: "totalSupply",
        },
      ],
    });

    if (
      !tokenInfoResponse[0].result ||
      !tokenInfoResponse[1].result ||
      !tokenInfoResponse[2].result ||
      !tokenInfoResponse[3].result
    ) {
      throw new DividendsError("Failed to get token info");
    }

    const tokenDecimals = tokenInfoResponse[2].result;
    const tokenInfo = {
      name: tokenInfoResponse[0].result as string,
      symbol: tokenInfoResponse[1].result as string,
      decimals: tokenDecimals,
      totalSupply: formatUnits(tokenInfoResponse[3].result, tokenDecimals),
    };

    // get stable coin info
    const stableCoinInfoResponse = await this.publicClient.multicall({
      contracts: [
        {
          ...stableCoinContract,
          functionName: "name",
        },
        {
          ...stableCoinContract,
          functionName: "symbol",
        },
        {
          ...stableCoinContract,
          functionName: "decimals",
        },
        {
          ...stableCoinContract,
          functionName: "totalSupply",
        },
      ],
    });

    if (
      !stableCoinInfoResponse[0].result ||
      !stableCoinInfoResponse[1].result ||
      !stableCoinInfoResponse[2].result ||
      !stableCoinInfoResponse[3].result
    ) {
      throw new DividendsError("Failed to get stable coin info");
    }

    const stableCoinDecimals = stableCoinInfoResponse[2].result;
    const stableCoinInfo = {
      name: stableCoinInfoResponse[0].result as string,
      symbol: stableCoinInfoResponse[1].result as string,
      decimals: stableCoinDecimals,
      totalSupply: formatUnits(
        stableCoinInfoResponse[3].result,
        stableCoinDecimals
      ),
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
      case 289:
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
