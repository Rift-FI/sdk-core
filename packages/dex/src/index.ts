import { SwapService } from "./services/swap";
import { LiquidityService } from "./services/liquidity";
import { Config } from "./types";
import { createViemClient } from "./utils/provider";

export class Dex {
  private config: Config;
  private viemClient;

  // Service instances
  public readonly swap: SwapService;
  public readonly liquidity: LiquidityService;

  constructor(config: Config) {
    this.config = config;

    // Initialize viem client
    this.viemClient = createViemClient(config.chain);

    // Initialize services
    this.swap = new SwapService(
      this.config.chain as any,
      this.viemClient as any
    );
    
    this.liquidity = new LiquidityService(
      this.config.chain as any,
      this.viemClient as any
    );
  }
}

// export types
export * from "./types";
export * from "./constants";
export * from "./utils";