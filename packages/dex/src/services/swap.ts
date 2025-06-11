import { ethers, Wallet } from "ethers";
import {
  BigintIsh,
  Currency,
  CurrencyAmount,
  ONE_HUNDRED_PERCENT,
  Percent,
  Token,
  TradeType,
  ZERO,
} from "@stratospherex/sdk";
import {
  SmartRouter,
  SmartRouterTrade,
  BIPS_BASE,
} from "@stratospherex/smart-router";
import { FeeAmount } from "@stratospherex/v3-sdk";
import { parseAbi, PublicClient } from "viem";
import { EstimatedSwap } from "../types";

export class SwapService {
  private wallet: Wallet;
  private viemClient: PublicClient;

  constructor(wallet: Wallet, viemClient: PublicClient) {
    this.wallet = wallet;
    this.viemClient = viemClient;
  }

  async estimateSwap(tokenIn: string, tokenOut: string, amount: string): Promise<EstimatedSwap> {
    const swapFrom = await this.getToken(tokenIn);
    const swapTo = await this.getToken(tokenOut);

    const estAmount = CurrencyAmount.fromRawAmount(
      swapFrom,
      ethers.parseUnits(amount, swapFrom.decimals) as unknown as BigintIsh
    );
    const router = SmartRouter;

    const pool = await router.getV3CandidatePools({
      onChainProvider: () => this.viemClient,
      currencyA: swapFrom,
      currencyB: swapTo,
      subgraphFallback: false,
    });

    const quoteProvider = router.createQuoteProvider({
      onChainProvider: () => this.viemClient,
    });

    const trade = await router.getBestTrade(
      estAmount,
      swapTo,
      TradeType.EXACT_INPUT,
      {
        gasPriceWei: () => this.viemClient.getGasPrice(),
        maxHops: 10,
        maxSplits: 10,
        poolProvider: router.createStaticPoolProvider(pool),
        quoteProvider,
        quoterOptimization: true,
      }
    );

    const breakdown = this.computeTradePriceBreakdown(trade);
    const route = trade?.routes[0];
    return {
      price: Number(amount) / Number(trade?.outputAmount.toSignificant()),
      total: Number(trade?.outputAmount.toSignificant()),
      trading_fee: Number(breakdown.lpFeeAmount?.toSignificant(6)),
      price_impact: Number(breakdown.priceImpactWithoutFee?.toFixed(2)),
      routes: route?.path as any,
    };
  }

  // Get token details from chain
  async getToken(address: string): Promise<Token> {
    const chainId = await this.viemClient.getChainId();

    const abis = parseAbi([
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)",
      "function name() view returns (string)",
    ]);
    const results = await this.viemClient.multicall({
      contracts: [
        {
          address: address as `0x${string}`,
          abi: abis,
          functionName: "symbol",
        },
        {
          address: address as `0x${string}`,
          abi: abis,
          functionName: "decimals",
        },
        {
          address: address as `0x${string}`,
          abi: abis,
          functionName: "name",
        },
      ],
    });
    const [symbol, decimals, name] = results;

    return new Token(
      Number(chainId),
      address as `0x${string}`,
      Number(decimals.result),
      name?.result as string,
      symbol?.result as string
    );
  }

  // // computes price breakdown for the trade
  computeTradePriceBreakdown(trade?: SmartRouterTrade<TradeType> | null): {
    priceImpactWithoutFee?: Percent | null;
    lpFeeAmount?: CurrencyAmount<Currency> | null;
  } {
    const BASE_FEE = new Percent(25n, BIPS_BASE);
    const INPUT_FRACTION_AFTER_FEE = ONE_HUNDRED_PERCENT.subtract(BASE_FEE);

    if (!trade) {
      return {
        priceImpactWithoutFee: undefined,
        lpFeeAmount: null,
      };
    }

    const { routes, outputAmount, inputAmount } = trade;
    let feePercent = new Percent(0);
    let outputAmountWithoutPriceImpact = CurrencyAmount.fromRawAmount(
      trade.outputAmount.wrapped.currency,
      0
    );
    for (const route of routes) {
      const { inputAmount: routeInputAmount, pools, percent } = route;
      const routeFeePercent = ONE_HUNDRED_PERCENT.subtract(
        pools.reduce<Percent>((currentFee, pool) => {
          if (SmartRouter.isV2Pool(pool)) {
            return currentFee.multiply(INPUT_FRACTION_AFTER_FEE);
          }
          if (SmartRouter.isStablePool(pool)) {
            return currentFee.multiply(ONE_HUNDRED_PERCENT.subtract(pool.fee));
          }
          if (SmartRouter.isV3Pool(pool)) {
            return currentFee.multiply(
              ONE_HUNDRED_PERCENT.subtract(this.v3FeeToPercent(pool.fee))
            );
          }
          return currentFee;
        }, ONE_HUNDRED_PERCENT)
      );
      // Not accurate since for stable swap, the lp fee is deducted on the output side
      feePercent = feePercent.add(
        routeFeePercent.multiply(new Percent(percent, 100))
      );

      const midPrice = SmartRouter.getMidPrice(route);
      outputAmountWithoutPriceImpact = outputAmountWithoutPriceImpact.add(
        midPrice.quote(routeInputAmount.wrapped) as CurrencyAmount<Token>
      );
    }

    if (outputAmountWithoutPriceImpact.quotient === ZERO) {
      return {
        priceImpactWithoutFee: undefined,
        lpFeeAmount: null,
      };
    }

    const priceImpactRaw = outputAmountWithoutPriceImpact
      .subtract(outputAmount.wrapped)
      .divide(outputAmountWithoutPriceImpact);
    const priceImpactPercent = new Percent(
      priceImpactRaw.numerator,
      priceImpactRaw.denominator
    );
    const priceImpactWithoutFee = priceImpactPercent.subtract(feePercent);
    const lpFeeAmount = inputAmount.multiply(feePercent);

    return {
      priceImpactWithoutFee,
      lpFeeAmount,
    };
  }

  private v3FeeToPercent(fee: FeeAmount): Percent {
    return new Percent(fee, BIPS_BASE * 100n);
  }
}
