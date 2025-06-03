import { DividendsError } from "./error";
import {
  AddressAmount,
  Chain,
  DistributeDividendIn,
  DistributeDividendOut,
  IndexerParams,
  IndexerType,
  TokenInfo,
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

export class Dividends {
  private indexer: IndexerParams;
  private chain: Chain;
  private tokenAddress: string;
  private publicClient: PublicClient;
  private walletClient: WalletClient;
  private account: Account;
  private tokenInfo: TokenInfo;
  private stableCoinInfo: TokenInfo;

  constructor() {
    this.indexer = {} as IndexerParams;
    this.chain = {} as Chain;
    this.publicClient = {} as PublicClient;
    this.walletClient = {} as WalletClient;
    this.account = {} as Account;
    this.tokenAddress = "";
    this.tokenInfo = {} as TokenInfo;
    this.stableCoinInfo = {} as TokenInfo;
  }

  async distributeDividend(
    params: DistributeDividendIn
  ): Promise<DistributeDividendOut> {
    await this.checkIndexer(params.indexer);
    this.indexer = params.indexer;
    await this.setupChain(params.chain, params.privateKey);
    this.tokenAddress = params.tokenAddress;
    await this.setupToken(params.tokenAddress, params.stableCoinAddress);

    const holders = await this.getTokenHolders();

    // proceed it to dividend logic
    const dividendPreResult = await params.businessLogic({
      holders,
      totalSupply: this.tokenInfo.totalSupply,
      dividendAmount: parseUnits(
        params.amount.toString(),
        this.stableCoinInfo.decimals
      ).toString(),
      tokenAddress: this.tokenAddress,
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
      const tx = await this.walletClient.writeContract({
        ...request,
        account: this.account,
      });

      dividendResult.push({
        address: divPortion.address,
        amount: divPortion.amount,
        txHash: tx,
      });
    }

    return dividendResult;
  }

  private async getTokenHolders(): Promise<AddressAmount[]> {
    if (this.indexer.type === IndexerType.Infura) {
    }

    if (this.indexer.type === IndexerType.TheGraph) {
    }

    if (this.indexer.type === IndexerType.Custom) {
      if (!this.indexer.customLogic) {
        throw new DividendsError("Custom logic is required");
      }

      return this.indexer.customLogic(this.tokenAddress, this.chain);
    }

    return [];
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
    this.tokenInfo = {
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
    this.stableCoinInfo = {
      name: stableCoinInfoResponse[0].result as string,
      symbol: stableCoinInfoResponse[1].result as string,
      decimals: stableCoinDecimals,
      totalSupply: formatUnits(
        stableCoinInfoResponse[3].result,
        stableCoinDecimals
      ),
    };
  }

  private async checkIndexer(indexer: IndexerParams) {
    if (indexer.type === "custom") {
      if (!indexer.customLogic) {
        throw new DividendsError("Custom logic is required");
      }
    }

    if (indexer.type === "infura") {
      if (!indexer.uri) {
        throw new DividendsError("URI for infure is required");
      }
    }

    if (indexer.type === "thegraph") {
      if (!indexer.uri) {
        throw new DividendsError("URI for thegraph is required");
      }
    }
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

  private async setupChain(chain: Chain, pk: string) {
    // check if pk is valid
    if (!isHex(pk)) {
      throw new DividendsError("Invalid private key");
    }

    this.account = privateKeyToAccount(pk as `0x${string}`);

    const chainForUse = this.getChain(chain);
    this.publicClient = createPublicClient({
      transport: http(chainForUse.rpcUrls.default.http[0]),
    });

    this.walletClient = createWalletClient({
      account: this.account,
      chain: chainForUse,
      transport: http(chainForUse.rpcUrls.default.http[0]),
    });

    this.chain = chain;
  }
}
