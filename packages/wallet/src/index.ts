import { Environment, RiftConfig } from "./types";
import { RiftHttpClient } from "./http-client";
import { AuthService } from "./services/auth";
import { WalletService } from "./services/wallet";
import { TransactionService } from "./services/transactions";
import { PaymentLinksService } from "./services/payment-links";
import { SignerService } from "./services/signer";
import { DeFiService } from "./services/defi";
import { AssetsService } from "./services/assets";
import { OfframpService } from "./services/offramp";
import { NotificationService } from "./services/notifications";
import { MerchantService } from "./services/merchant";
import { OnrampServiceV2 } from "./services/onramp_v2";
import { DepositsService } from "./services/Deposits";
import { VaultService } from "./services/vault";
import { KYCService } from "./services/kyc";
import { LoyaltyService } from "./services/loyalty";
import { WeeklyPoolService } from "./services/weekly-pool";
import { ReferralFeeService } from "./services/referral-fees";
import { BridgeService } from "./services/bridge";
import { WalletConnectService } from "./services/wallet-connect";
import { ProjectService } from "./services/project";
import { UserManagementService } from "./services/user-management";
import { StatsService } from "./services/stats";

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
  public readonly offramp: OfframpService;
  public readonly notifications: NotificationService;
  public readonly merchant: MerchantService;
  public readonly deposits: DepositsService;
  public readonly onrampV2: OnrampServiceV2;
  public readonly vault: VaultService;
  public readonly kyc: KYCService;
  public readonly loyalty: LoyaltyService;
  public readonly weeklyPool: WeeklyPoolService;
  public readonly referralFees: ReferralFeeService;
  public readonly bridge: BridgeService;
  public readonly walletConnect: WalletConnectService;
  public readonly project: ProjectService;
  public readonly userManagement: UserManagementService;
  public readonly stats: StatsService;

  constructor(config: RiftConfig) {
    this.config = config;
    this.httpClient = new RiftHttpClient(config);

    // Initialize all services
    this.auth = new AuthService(this.httpClient);
    this.deposits = new DepositsService(this.httpClient);
    this.wallet = new WalletService(this.httpClient);
    this.transactions = new TransactionService(this.httpClient);
    this.paymentLinks = new PaymentLinksService(this.httpClient);
    this.signer = new SignerService(this.httpClient);
    this.defi = new DeFiService(this.httpClient);
    this.assets = new AssetsService(this.httpClient);
    this.offramp = new OfframpService(this.httpClient);
    this.onrampV2 = new OnrampServiceV2(this.httpClient);
    this.notifications = new NotificationService(this.httpClient);
    this.merchant = new MerchantService(this.httpClient);
    this.vault = new VaultService(this.httpClient);
    this.kyc = new KYCService(this.httpClient);
    this.loyalty = new LoyaltyService(this.httpClient);
    this.weeklyPool = new WeeklyPoolService(this.httpClient);
    this.referralFees = new ReferralFeeService(this.httpClient);
    this.bridge = new BridgeService(this.httpClient);
    this.walletConnect = new WalletConnectService(this.httpClient);
    this.project = new ProjectService(this.httpClient);
    this.userManagement = new UserManagementService(this.httpClient);
    this.stats = new StatsService(this.httpClient);
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
    this.vault.setBearerToken(token);
    this.kyc.setBearerToken(token);
    this.loyalty.setBearerToken(token);
    this.weeklyPool.setBearerToken(token);
    this.referralFees.setBearerToken(token);
    this.bridge.setBearerToken(token);
    this.walletConnect.setBearerToken(token);
    this.project.setBearerToken(token);
    this.userManagement.setBearerToken(token);
    this.stats.setBearerToken(token);
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
    this.vault.clearBearerToken();
    this.kyc.clearBearerToken();
    this.loyalty.clearBearerToken();
    this.weeklyPool.clearBearerToken();
    this.referralFees.clearBearerToken();
    this.bridge.clearBearerToken();
    this.walletConnect.clearBearerToken();
    this.project.clearBearerToken();
    this.userManagement.clearBearerToken();
    this.stats.clearBearerToken();
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
export { VaultService } from "./services/vault";
export { KYCService } from "./services/kyc";
export { LoyaltyService } from "./services/loyalty";
export { WeeklyPoolService } from "./services/weekly-pool";
export { ReferralFeeService } from "./services/referral-fees";
export { BridgeService } from "./services/bridge";
export { WalletConnectService } from "./services/wallet-connect";
export { ProjectService } from "./services/project";
export { UserManagementService } from "./services/user-management";
export { StatsService } from "./services/stats";

// Default export
export default Rift;
