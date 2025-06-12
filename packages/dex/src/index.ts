import { SwapService } from "./services/swap";
import { Config } from "./types";
import {
  createProvider,
  createViemClient,
} from "@stratosphere-network/shared/src/utils/provider";
import { Wallet } from "ethers";

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
      this.config.chain,
      this.wallet,
      this.viemClient
    );
  }
}
