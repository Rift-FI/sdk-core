import { Environment, RiftConfig } from "./types";
import { RiftHttpClient } from "./http-client";
import { AuthService } from "./services/auth";
import { WalletService } from "./services/wallet";
import { TransactionService } from "./services/transactions";
import { PaymentLinksService } from "./services/payment-links";
import { SignerService } from "./services/signer";
import { DeFiService } from "./services/defi";
import { AssetsService } from "./services/assets";
import { OnrampService } from "./services/onramp";
import { OfframpService } from "./services/offramp";
import { NotificationService } from "./services/notifications";
import { MerchantService } from "./services/merchant";
import { OnrampServiceV2 } from "./services/onramp_v2";
import { DepositsService } from "./services/Deposits";

export class Rift {
  public readonly config: RiftConfig;
  private readonly httpClient: RiftHttpClient;

  // Service instances
  public readonly auth: AuthService;
  public readonly wallet: WalletService;
  public readonly transactions: TransactionService;
  public readonly paymentLinks: PaymentLinksService;
  public readonly signer: SignerService;
  public readonly defi: DeFiService;
  public readonly assets: AssetsService;
  public readonly onramp: OnrampService;
  public readonly offramp: OfframpService;
  public readonly notifications: NotificationService;
  public readonly merchant: MerchantService;
  public readonly deposits: DepositsService;
  public readonly onrampV2: OnrampServiceV2;

  constructor(config: RiftConfig) {
    this.config = config;
    this.httpClient = new RiftHttpClient(config);

    // Initialize all services
    this.auth = new AuthService(this.httpClient, config);
    this.deposits = new DepositsService(this.httpClient);
    this.wallet = new WalletService(this.httpClient);
    this.transactions = new TransactionService(this.httpClient);
    this.paymentLinks = new PaymentLinksService(this.httpClient);
    this.signer = new SignerService(this.httpClient);
    this.defi = new DeFiService(this.httpClient);
    this.assets = new AssetsService(this.httpClient);
    this.onramp = new OnrampService(this.httpClient, config);
    this.offramp = new OfframpService(this.httpClient);
    this.onrampV2 = new OnrampServiceV2(this.httpClient);
    this.notifications = new NotificationService(this.httpClient);
    this.merchant = new MerchantService(this.httpClient);
  }

  /**
   * Set the API key for project authentication
   */
  setApiKey(apiKey: string): void {
    this.httpClient.setApiKey(apiKey);
  }

  /**
   * Set the bearer token for user authentication across all services
   */
  setBearerToken(token: string): void {
    this.auth.setBearerToken(token);
    this.wallet.setBearerToken(token);
    this.transactions.setBearerToken(token);
    this.paymentLinks.setBearerToken(token);
    this.signer.setBearerToken(token);
    this.defi.setBearerToken(token);
    this.assets.setBearerToken(token);
    this.notifications.setBearerToken(token);
    this.merchant.setBearerToken(token);
    this.offramp.setBearerToken(token);
    this.onrampV2.setBearerToken(token);
    this.deposits.setBearerToken(token);
    // Note: onramp doesn't use bearer tokens
  }

  /**
   * Clear the bearer token from all services
   */
  clearBearerToken(): void {
    this.auth.clearBearerToken();
    this.wallet.clearBearerToken();
    this.transactions.clearBearerToken();
    this.paymentLinks.clearBearerToken();
    this.signer.clearBearerToken();
    this.defi.clearBearerToken();
    this.assets.clearBearerToken();
    this.notifications.clearBearerToken();
    this.merchant.clearBearerToken();
    this.offramp.clearBearerToken();
    this.onrampV2.clearBearerToken();
    this.deposits.clearBearerToken();
    // Note: onramp doesn't use bearer tokens
  }

  /**
   * Set API key specifically for M-Pesa operations
   */
  setMpesaApiKey(apiKey: string): void {
    this.onramp.setMpesaApiKey(apiKey);
  }

  /**
   * Check if the SDK is configured with an API key
   */
  hasApiKey(): boolean {
    return !!this.config.apiKey;
  }

  /**
   * Check if the user is authenticated
   */
  isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }

  /**
   * Get the current environment
   */
  getEnvironment(): Environment {
    return this.config.environment;
  }

  /**
   * Get the base URL being used
   */
  getBaseUrl(): string {
    return this.httpClient["baseUrl"];
  }
}

// Export types and enums for consumers
export * from "./types";
export { Environment };

// Export service classes
export { NotificationService } from "./services/notifications";
export { OfframpService } from "./services/offramp";

// Default export
export default Rift;
