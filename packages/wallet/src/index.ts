import { Environment, SphereConfig } from "./types";
import { SphereHttpClient } from "./http-client";
import { AuthService } from "./services/auth";
import { WalletService } from "./services/wallet";
import { TransactionService } from "./services/transactions";
import { PaymentLinksService } from "./services/payment-links";
import { ProxyWalletService } from "./services/proxy-wallet";
import { DeFiService } from "./services/defi";
import { AssetsService } from "./services/assets";
import { OnrampService } from "./services/onramp";

export class Sphere {
  public readonly config: SphereConfig;
  private readonly httpClient: SphereHttpClient;

  // Service instances
  public readonly auth: AuthService;
  public readonly wallet: WalletService;
  public readonly transactions: TransactionService;
  public readonly paymentLinks: PaymentLinksService;
  public readonly proxyWallet: ProxyWalletService;
  public readonly defi: DeFiService;
  public readonly assets: AssetsService;
  public readonly onramp: OnrampService;

  constructor(config: SphereConfig) {
    this.config = config;
    this.httpClient = new SphereHttpClient(config);

    // Initialize all services
    this.auth = new AuthService(this.httpClient);
    this.wallet = new WalletService(this.httpClient);
    this.transactions = new TransactionService(this.httpClient);
    this.paymentLinks = new PaymentLinksService(this.httpClient);
    this.proxyWallet = new ProxyWalletService(this.httpClient);
    this.defi = new DeFiService(this.httpClient);
    this.assets = new AssetsService(this.httpClient);
    this.onramp = new OnrampService(this.httpClient, config);
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
    this.proxyWallet.setBearerToken(token);
    this.defi.setBearerToken(token);
    this.assets.setBearerToken(token);
    // Note: onramp service doesn't use bearer tokens
  }

  /**
   * Clear the bearer token from all services
   */
  clearBearerToken(): void {
    this.auth.clearBearerToken();
    this.wallet.clearBearerToken();
    this.transactions.clearBearerToken();
    this.paymentLinks.clearBearerToken();
    this.proxyWallet.clearBearerToken();
    this.defi.clearBearerToken();
    this.assets.clearBearerToken();
    // Note: onramp service doesn't use bearer tokens
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

// Default export
export default Sphere;
