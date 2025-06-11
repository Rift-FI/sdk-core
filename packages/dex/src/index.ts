import { SwapService } from "./services/swap";
import { Config } from "./types";
import { createViemClient } from "@stratosphere-network/shared/src/utils/provider";

export class Dex {
  private config: Config;
  private viemClient;

  // Service instances
  public readonly swap: SwapService;

  constructor(config: Config) {
    this.config = config;

    // Initialize viem client
    this.viemClient = createViemClient(config.chain);

    // Initialize services
    this.swap = new SwapService(this.config.wallet, this.viemClient);
  }
}
