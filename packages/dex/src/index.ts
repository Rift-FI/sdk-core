import { SwapService } from "./services/swap";
import { Config } from "./types";
import { Wallet } from "ethers";
import { createProvider, createViemClient } from "./utils/provider";

export class Dex {
  private config: Config;
  private viemClient;
  private wallet: Wallet;

  // Service instances
  public readonly swap: SwapService;

  constructor(config: Config) {
    this.config = config;

    // Initialize viem client
    this.viemClient = createViemClient(config.chain);

    // If wallet missing provider, create one
    this.wallet = config.wallet;
    if (!this.wallet.provider) {
      const provider = createProvider(this.config.chain);
      this.wallet = this.wallet.connect(provider);
    }

    // Initialize services
    this.swap = new SwapService(
      this.config.chain as any,
      this.wallet,
      this.viemClient as any
    );
  }
}
