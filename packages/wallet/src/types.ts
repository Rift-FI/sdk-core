// Recovery System Types
export interface RecoveryData {
  id: string;
  email?: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateRecoveryRequest {
  externalId: string;
  password: string;
  emailRecovery?: string;
  phoneRecovery?: string;
}

export interface CreateRecoveryResponse {
  message: string;
  recovery: RecoveryData;
}

export interface RecoveryOptionsResponse {
  recoveryOptions: {
    email?: string;
    phone?: string;
  };
}

export interface RequestPasswordResetRequest {
  externalId: string;
  method: "emailRecovery" | "phoneRecovery";
}

export interface RequestPasswordResetResponse {
  message: string;
  target: string;
}

export type ResetPasswordRequest =
  | {
      username: string;
      newPassword: string;
      email: string;
      otpCode: string;
      phoneNumber?: never;
    }
  | {
      username: string;
      newPassword: string;
      phoneNumber: string;
      otpCode: string;
      email?: never;
    };

export interface ResetPasswordResponse {
  message: string;
}

export interface UpdateRecoveryRequest {
  externalId: string;
  password: string;
  emailRecovery?: string;
  phoneRecovery?: string;
}

export interface UpdateRecoveryResponse {
  message: string;
  recovery: RecoveryData;
}

export interface AddRecoveryMethodRequest {
  externalId: string;
  password: string;
  method: "emailRecovery" | "phoneRecovery";
  value: string;
}

export interface AddRecoveryMethodResponse {
  message: string;
  recovery: RecoveryData;
}

export interface RemoveRecoveryMethodRequest {
  externalId: string;
  password: string;
  method: "emailRecovery" | "phoneRecovery";
}

export interface RemoveRecoveryMethodResponse {
  message: string;
  recovery: RecoveryData;
}

export interface UpdateRecoveryMethodRequest {
  externalId: string;
  password: string;
  method: "emailRecovery" | "phoneRecovery";
  value: string;
}

export interface UpdateRecoveryMethodResponse {
  message: string;
  recovery: RecoveryData;
}

export interface GetMyRecoveryMethodsRequest {
  externalId: string;
  password: string;
}

export interface GetMyRecoveryMethodsResponse {
  recovery: RecoveryData;
}

export interface DeleteAllRecoveryMethodsRequest {
  externalId: string;
  password: string;
}

export interface DeleteAllRecoveryMethodsResponse {
  message: string;
}

export enum Environment {
  DEVELOPMENT = "development",
  PRODUCTION = "production",
}

export interface RiftConfig {
  apiKey?: string;
  environment: Environment;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

export interface ExchangeRateRequest {
  from: string;
  to: string;
}

export interface ExchangeRateResponse {
  from: string;
  to: string;
  rate: number;
}

// Offramp Types
export enum OfframpCurrency {
  KES = "KES",  // Kenya
  NGN = "NGN",  // Nigeria
  UGX = "UGX",  // Uganda
  CDF = "CDF",  // Democratic Republic of Congo
  ETB = "ETB",  // Ethiopia
  GHS = "GHS",  // Ghana
}

export enum RampChain {
  POLYGON = "polygon",
  BASE = "base",
}

export enum RampToken {
  USDC = "USDC",
}

export interface Recipient {
  name: string;
  bankCode: string;
  accountNumber: string;
  email?: string;
  phoneNumber?: string;
}

export interface PreviewExchangeRateRequest {
  currency: OfframpCurrency;
  amount?: number;
  type?: "offramp" | "onramp";
}


export interface PaymentType {
  type: string;
  name: string;
  description: string;
  requires_account_number: boolean;
}

export type SendPaymentLinkRequest = {
  paymentLink: string;
  message: string;
} & (
  | { recipientPhone: string; recipientEmail?: string }
  | { recipientPhone?: string; recipientEmail: string }
  | { recipientPhone: string; recipientEmail: string }
);

export interface SendPaymentLinkResults {
  emailSent: boolean;
  smsSent: boolean;
  totalSent: number;
  errors: string[];
}
export interface GetWithdrawalFeeResponse {
  fee: number;
}
export interface SendPaymentLinkResponse {
  message: string;
  results?: SendPaymentLinkResults;
  error?: string;
}

export interface SupportedInstitutionsMetadata {
  country: string;
  currency_symbol: string;
  supports_banks: boolean;
  supports_mobile_money: boolean;
}

export interface GetSupportedInstitutionsResponse {
  currency: string;
  institutions: string[];
  payment_types: PaymentType[];
  mobile_networks: string[];
  metadata: SupportedInstitutionsMetadata;
}

export interface FeeBreakdown {
  type?: string;
  usdcAmount?: number;
  userReceivesFiat?: number;
  fee?: number;
  feePercentage?: number;
  totalFiatDeducted?: number;
  totalUsdcNeeded?: number;
  exchangeRate?: number;
  fiatValue?: number;
  userPays?: number;
  userReceivesUsdc?: number;
  currency?: string;
}

export interface PreviewExchangeRateResponse {
  rate: number;
  buying_rate: number;
  selling_rate: number;
  quoted_rate: number;
  feePercentage?: number;
  feeBps?: number;
  feeBreakdown?: FeeBreakdown;
}

export interface CreateOfframpOrderRequest {
  token: RampToken;
  amount: number;
  localAmount?: number;
  currency: OfframpCurrency;
  chain: RampChain;
  recipient: string; // JSON stringified Recipient object
  otpCode?: string;
  password?: string;
  // New optional utility payment fields
  utilities?: boolean;
  service_code?: string;
  contact_number?: string;
  shortcode?: string;
}

export interface OfframpOrder {
  id: string;
  status: string;
  transactionCode: string;
  amount: number;
  createdAt: string;
  transaction_hash?: string;
  receipt_number?: string;
  currency?: string;
  chain?: string | null;
  token?: string | null;
  totalDeducted?: number;
  usdcDeducted?: number;
  fee?: number;
  feePercentage?: number;
  feeNote?: string;
  provider?: string;
  public_name?: string | null;
}


// const { token, amount, currency, chain, recipient} = req.body;
export interface PayRequest {
  token: RampToken;
  amount: number;
  localAmount?: number;
  currency: OfframpCurrency;
  chain: RampChain;
  recipient: string; // JSON stringified Recipient object
  otpCode?: string;
  password?: string;
  // New optional utility payment fields
  utilities?: boolean;
  service_code?: string;
  contact_number?: string;
  shortcode?: string;
}

//const { shortcode, amount, chain, asset,  mobile_network, country_code} = req.body;
export interface BuyRequest {
  shortcode: string;
  amount: number;
  localAmount?: number;
  chain: RampChain;
  asset: RampToken;
  mobile_network: string;
  country_code: string;
}

// //{
//   code: 200,
//   message: 'Collection status',
//   data: {
//     transaction_code: 'e44419a6-88f3-4754-b7d4-e4f09aa82916',
//     status: 'PENDING',
//     message: 'Success, kindly accept prompt sent.'
//   }
// }

export interface BuyResponse {
  success?: boolean;
  message: string;
  transaction_code?: string;
  status?: string;
  data?: {
    id?: string;
    shortcode?: string;
    amount?: string;
    chain?: string;
    asset?: string;
    status?: string;
    account_number?: string;
  };
  feeBreakdown?: FeeBreakdown;
}

// //const order: {
//   id: string;
//   createdAt: Date;
//   userId: string;
//   status: string;
//   transactionCode: string;
//   receipt_number: string | null;
// }

export interface OnrampStatusResponse {
  id?: string;
  status: string;
  transactionCode: string;
  receipt_number?: string | null;
  transaction_hash?: string | null;
  amount?: string | null;
  shortcode?: string;
  chain?: string | null;
  asset?: string;
  account_number?: string;
  currency?: string;
  token?: string | null;
  public_name?: string | null;
}


export interface PayResponse {
  order: OfframpOrder;


}
export interface CreateOfframpOrderResponse {
  order: OfframpOrder;
}

export interface UpdateUserResponse {
  message: string;
  user: any;
}

export interface PollOfframpOrderRequest {
 transactionCode: string;
 currency: OfframpCurrency;
}

export interface PollOfframpOrderResponse {
  status: string;
  transactionCode: string;
  receipt_number?: string;
  amount?: string;
  currency?: string;
  chain?: string | null;
  token?: string | null;
}

export interface GetOfframpOrdersResponse {
  orders: OfframpOrder[];
}

// Onramp Types (existing order types - updated naming for clarity)
export interface CreateOrderRequest {
  amount: number;
  currency: string;
  paymentMethod: string;
  callbackUrl: string;
  cancelUrl: string;
  successUrl: string;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  callbackUrl: string;
  cancelUrl: string;
  successUrl: string;
}

export interface PollOrderRequest {
  orderId: string;
}

export interface PollOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  callbackUrl: string;
  cancelUrl: string;
  successUrl: string;
}

export interface allOrdersRequest {
  page: number;
  limit: number;
}

export interface allOrdersResponse {
  orders: CreateOrderResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface LoginResponse {
  user: string;
  address: string;
  btcAddress: string;
  accessToken: string;
}

// Authentication Types
export type LoginRequest =
  | {
      phoneNumber: string;
      otpCode: string;
      externalId?: never;
      email?: never;
    }
  | {
      externalId: string;
      password: string;
      phoneNumber?: never;
      otpCode?: never;
      email?: never;
    }
  | {
      email: string;
      otpCode: string;
      phoneNumber?: never;
      externalId?: never;
      password?: never;
    };

export type SignupRequest =
  | {
      externalId: string;
      password: string;
      phoneNumber?: string;
      email?: string;
      displayName: string;
      paymentAccount?: string;
    }
  | {
      externalId?: never;
      password?: never;
      phoneNumber?: string;
      email?: string;
      displayName: string;
      paymentAccount?: string;
    };

export interface SignupResponse {
  message: string;
  userId: string;
}

export interface AuthResponse {
  message: string;
  token: string;
}

export type OtpRequest =
  | {
      phone: string;
      email?: never;
    }
  | {
      email: string;
      phone?: never;
    };
export interface OtpResponse {
  status: string;
  message?: string;
}

export type OtpVerifyRequest =
  | {
      phone: string;
      code: string;
      email?: never;
    }
  | {
      email: string;
      code: string;
      phone?: never;
    };

export interface OtpResponse {
  status: string;
  message?: string;
}

// User Types
export type AutoSwapTargetChain = "BASE" | "ARBITRUM" | "POLYGON" | "ETHEREUM";

export interface User {
  id: string;
  externalId: string;
  referrer?: string;
  createdAt?: string;
  updatedAt?: string;
  email?: string;
  telegramId?: string;
  phoneNumber?: string;
  address?: string;
  displayName?: string;
  paymentAccount?: string;
  notificationEmail?: string;
  instantWithdrawals?: boolean;
  autoSwapEnabled?: boolean;
  autoSwapTargetChain?: AutoSwapTargetChain | null;
  [key: string]: any;
}
export interface UpdateUserRequest {
  id?: string;
  externalId?: string;
  referrer?: string;
  createdAt?: string;
  updatedAt?: string;
  email?: string;
  telegramId?: string;
  phoneNumber?: string;
  address?: string;
  displayName?: string;
  paymentAccount?: string;
  notificationEmail?: string;
  instantWithdrawals?: boolean;
  autoSwapEnabled?: boolean;
  autoSwapTargetChain?: AutoSwapTargetChain | null;
  [key: string]: any;
}

export interface UserResponse {
  user: User;
}

export type DeleteUserRequest =
  | {
      externalId: string;
      password: string;
      phoneNumber?: never;
      email?: never;
      otpCode?: never;
    }
  | {
      phoneNumber: string;
      otpCode: string;
      externalId?: never;
      password?: never;
      email?: never;
    }
  | {
      email: string;
      otpCode: string;
      externalId?: never;
      password?: never;
      phoneNumber?: never;
    };
export interface DeleteUserResponse {
  message: string;
}

// Get All Users Types
export interface GetAllUsersResponse {
  externalId: string[];
  phoneNumber: string[];
  email: string[];
}

// Project Types
export interface Project {
  id: string;
  name: string;
  api_key: string;
  created_at: string;
}

export interface CreateProjectRequest {
  name: string;
}

export interface ProjectsResponse {
  projects: Project[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Wallet Types
export type ChainName =
  | "ARBITRUM"
  | "BASE"
  | "OPTIMISM"
  | "ETHEREUM"
  | "LISK"
  | "BNB"
  | "POLYGON"
  | "POLYGON_TESTNET"
  | "AVAX"
  | "BSC"
  | "BERACHAIN"
  | "BERACHAIN_TESTNET"
  | "CELO";

export type TokenSymbol =
  | "USDC"
  | "USDT"
  | "DYU"
  | "ETH"
  | "BTC"
  | "WBERA"
  | "USDC.e"
  | "LSK"
  | "BNB"
  | "MATIC"
  | "SAIL"
  | "cUSD";

export interface Balance {
  amount: number;
  chain: string;
  token: string;
  chainName: string;
}

export interface TokenBalanceRequest {
  token: TokenSymbol;
  chain?: ChainName;
}

export interface ChainBalanceRequest {
  chain?: ChainName;
}

// Transaction Types
export type TransactionType = "gasless" | "normal";

export type TransactionRequest = {
  to: string;
  value: string;
  token: TokenSymbol;
  chain: ChainName;
  intent?: "unlock";
  type?: TransactionType;
} & (
  | {
      externalId: string;
      password: string;
      phoneNumber?: never;
      otpCode?: never;
      email?: never;
    }
  | {
      phoneNumber: string;
      otpCode: string;
      externalId?: never;
      password?: never;
      email?: never;
    }
  | {
      email: string;
      otpCode: string;
      externalId?: never;
      password?: never;
      phoneNumber?: never;
    }
);

export interface TransactionResponse {
  message: string;
  transactionHash: string;
}

export interface TransactionHistoryRequest {
  limit?: number;
  page?: number;
  token?: string;
  chain?: string;
}

export interface Transaction {
  transaction_hash: string;
  user_email: string;
  amount: string;
  chain: string;
  token: string;
  recipient_address: string;
  created_at: string;
}

export interface TransactionHistory {
  id: string;
  userId: string;
  transactionHash: string;
  chain: string;
  token: string;
  currency?: string;
  amount: number;
  recipientAddress: string;
  createdAt: string;
}

export interface TransactionHistoryResponse {
  transactions: TransactionHistory[];
  pagination: {
    total: number;
    pages: number;
    currentPage: number;
    perPage: number;
  };
}

// Transaction Fee Types
export interface TransactionFeeRequest {
  recipient: string;
  amount: string;
  chain: string;
  token: string;
}

export interface TransactionFeeResponse {
  amount: number;
  token: string;
}

// DeFi Types
export type SwapFlow = "normal" | "gasless";

export interface SwapRequest {
  chain: ChainName;
  flow: SwapFlow;
  token_to_sell_address?: string;
  token_to_buy_address?: string;
  amountOut?: string;
  token_to_sell: string;
  token_to_buy: string;
  value: string;
  isEth?: boolean;
  isBuyingEth?: boolean;
}

export interface SwapResponse {
  "swap successful": string;
}

// AI Types
export interface ConversationRequest {
  accessToken: string;
  user_prompt: string;
  conversation_id: string;
  nonce: string;
}

export interface ConversationResponse {
  message: string;
}

export interface ChatRequest {
  secret: string;
  prompt: string;
}

export interface ChatResponse {
  response: string;
}

export interface ConversationHistoryRequest {
  conversation_id: string;
}

export interface ConversationMessage {
  prompt: string;
  response: string;
}

// Assets Types
export interface Asset {
  chain: string;
  chainId: number;
  symbol: string;
  address?: string;
  decimals: number;
  type: string;
  category: string;
  isNative: boolean;
}

export interface AssetsResponse {
  message: string;
  assets: Asset[];
}

export interface Chain {
  id: string;
  name: string;
  enabled: boolean;
}

export interface ChainsResponse {
  message: string;
  data: Chain[];
}

export interface Token {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  contract_address?: string;
  chain_id: string;
}

export interface TokensResponse {
  message: string;
  data: Token[];
}

// Wallet Asset Types
export interface WalletChain {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  enabled: boolean;
}

export interface WalletToken {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  contract_address?: string | null;
  chain_id: string;
  icon?: string;
}

// Burn Incentives Types
export interface BurnRequest {
  amountToBurn: string;
}

export interface BurnResponse {
  message: string;
  burnTransactionHash: string;
  rewardApiResponse: any;
}

export interface BurnStats {
  totalSphereBurnt: number;
  totalUsdcRewarded: number;
  recordCount: number;
}

// Sphere Accounts Types
export interface SphereAccount {
  id: string;
  userId: string;
  isDefault: boolean;
  accessToken?: string;
}

export interface CreateSphereAccountRequest {
  makeDefault?: boolean;
}

export interface SphereAccountResponse {
  message: string;
  sphereAccount: SphereAccount;
}

export interface SphereAccountsResponse {
  sphereAccount: SphereAccount[];
}

export interface SetDefaultAccountRequest {
  sphereAccountId: string;
}

// Rewards Types
export interface ClaimRewardsRequest {
  campaignId?: string;
  amount?: string;
}

// Secrets Types
export type SecretPurpose = "AIRWALLEX" | "OPENAI";

export interface ImportSecretRequest {
  key: string;
  purpose: SecretPurpose;
}
export interface Secret {
  id: string;
  purpose: string;
  email: string;
  url: string;
  locked: boolean;
}

export interface ShareSecretRequest {
  email: string;
  key: string;
  time: string;
  purpose: SecretPurpose;
  charge?: string;
  token?: string;
  chain?: string;
  amountInUSD?: string;
}

export interface ShareSecretResponse {
  message: string;
  data: string;
}

// Platform Types
export enum Platform {
  SERVER = "SERVER",
  MOBILE = "MOBILE",
  WEB = "WEB",
  TELEGRAM = "TELEGRAM",
}

// Redirect URL Registration
export interface RegisterRedirectUrlRequest {
  url?: string;
  phoneNumber?: string;
  telegram_url?: string;
  mobile_url?: string;
  email?: string;
  otpCode: string;
  project_api_key: string;
}

export interface RegisterRedirectUrlResponse {
  message: string;
  data: {
    url: string;
    telegram_url?: string;
    mobile_url?: string;
    project_api_key: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

// Redirect Link Models
export interface RequestLinkRedirect {
  url: string;
  telegram_url?: string;
  mobile_url?: string;
  project_api_key: string;
  createdAt: string;
  updatedAt: string;
}

export interface SendLinkRedirect {
  url: string;
  telegram_url?: string;
  mobile_url?: string;
  project_api_key: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetRedirectLinksResponse {
  sendLinkRedirect: SendLinkRedirect | null;
  requestRedirectLink: RequestLinkRedirect | null;
}

export interface GetRedirectLinksRequest {
  project_api_key: string;
}

// Payment Request Creation
export interface CreatePaymentRequestInput {
  amount: number;
  chain: ChainName;
  token: TokenSymbol;
}

export interface PaymentRequestResult {
  data: string;
  message?: string;
  error?: string;
}

// Payment Execution
export interface PayPaymentRequestInput {
  nonce: string;
}

export interface PayPaymentRequestResponse {
  message: string;
  data?: any; // Transaction result data when successful
  error?: any; // Error details when transaction fails
}

// Send Payment Creation
export type SendSpecificPaymentRequest = {
  time: string;
  value: string;
  token: TokenSymbol;
  chain: ChainName;
} & (
  | {
      recipientUsername: string;
      recipientPhoneNumber?: never;
      recipientEmail?: never;
    }
  | {
      recipientPhoneNumber: string;
      recipientUsername?: never;
      recipientEmail?: never;
    }
  | {
      recipientEmail: string;
      recipientUsername?: never;
      recipientPhoneNumber?: never;
    }
) &
  (
    | {
        externalId: string;
        password: string;
        phoneNumber?: never;
        otpCode?: never;
        email?: never;
      }
    | {
        phoneNumber: string;
        otpCode: string;
        externalId?: never;
        password?: never;
        email?: never;
      }
    | {
        email: string;
        otpCode: string;
        externalId?: never;
        password?: never;
        phoneNumber?: never;
      }
  );

export type SendOpenPaymentRequest = {
  time: string;
  value: string;
  token: TokenSymbol;
  chain: ChainName;
} & (
  | {
      externalId: string;
      password: string;
      phoneNumber?: never;
      otpCode?: never;
      email?: never;
    }
  | {
      phoneNumber: string;
      otpCode: string;
      externalId?: never;
      password?: never;
      email?: never;
    }
  | {
      email: string;
      otpCode: string;
      externalId?: never;
      password?: never;
      phoneNumber?: never;
    }
);

export interface SendPaymentResponse {
  data: string;
  error?: string;
}

// Payment Claiming
export interface ClaimPaymentRequest {
  id: string;
}

export interface ClaimPaymentResponse {
  message: string;
  error?: any;
}

// Payment Links Error Types
export interface PaymentLinkValidationError {
  error?: string;
  message?: string;
  supportedCombinations?: {
    [key in ChainName]?: TokenSymbol[];
  };
}

export interface PaymentLinkNotFoundError {
  message: "Payment link not found" | "Token not found or expired";
}

export interface PaymentLinkAlreadyPaidError {
  message: "Payment link already paid";
}

export interface UnauthorizedPaymentError {
  message:
    | "Unauthorized"
    | "Unauthorized: You are not authorized to spend this!"
    | "Forbidden: Invalid spend token.";
}

export interface CreateSendLinkInput {
  /**
   * Expiration time for the send link
   * Format: number followed by time unit (s, m, h, d)
   * Examples: "1s", "5m", "2h", "30d"
   * - s: seconds
   * - m: minutes
   * - h: hours
   * - d: days
   */
  time: string;
  receiver?: string;
  value: string;
  token: TokenSymbol;
  chain: ChainName;
}

export interface ClaimSendLinkInput {
  id: string;
}

export interface ClaimSendLinkResult {
  message: string;
  error?: any;
}

// Payment Links Management Types
export interface GetPaymentRequestsInput {
  expired?: "true" | "false";
  limit?: string;
  page?: string;
}

export interface PaymentRequestItem {
  id: string;
  nonce: string;
  amount: number;
  token: string;
  chain: string;
  creatorAddress: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  paidByAddress?: string | null;
  paidByUserId?: string | null;
  paidAt?: string | null;
}

export interface GetPaymentRequestsResult {
  data: PaymentRequestItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface GetSendLinksInput {
  fulfilled?: "true" | "false";
  limit?: string;
  page?: string;
}

export interface SendLinkItem {
  id: string;
  urlId: string;
  value: string;
  receiver?: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetSendLinksResult {
  data: SendLinkItem[];
  fulfilled: boolean;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface CancelPaymentRequestInput {
  nonce: string;
}

export interface CancelPaymentRequestResult {
  message: string;
  data: {
    nonce: string;
    amount: string;
    token: string;
    chain: string;
  };
}

export interface CancelSendLinkInput {
  urlId: string;
}

export interface CancelSendLinkResult {
  message: string;
  data: {
    urlId: string;
    value: string;
    receiver?: string;
    expiresAt: string;
  };
}

// Error Types
export interface ApiError {
  message: string;
  error?: string;
  status?: number;
}

// Merchant Types
export enum InvoiceStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  EXPIRED = "EXPIRED",
}

export interface Invoice {
  id: string;
  description: string;
  chain: string;
  token: string;
  amount: number;
  recipientEmail?: string;
  recipientPhone?: string;
  status: InvoiceStatus;
  url: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  expiresAt?: string;
  userId: string;
}

export interface CreateInvoiceRequest {
  description: string;
  chain: ChainName;
  token: TokenSymbol;
  amount: number;
  recipientEmail?: string;
  recipientPhone?: string;
  originUrl?:string;
  [key: string]: string | number | undefined; 
}

export interface CreateInvoiceResponse {
  invoice: Invoice;
}

export interface GetInvoicesRequest {
  status?: InvoiceStatus;
  sortBy?: "createdAt" | "updatedAt" | "paidAt";
  sortOrder?: "asc" | "desc";
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

export interface GetInvoicesResponse {
  invoices: Invoice[];
}

export interface MerchantServiceError {
  message: string;
  code: string;
  details?: any;
}

// HTTP Client Types
export interface RequestConfig {
  method: "GET" | "POST" | "PUT" | "DELETE";
  url: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

export interface HttpClient {
  request<T>(config: RequestConfig): Promise<T>;
}

// Socket.IO Event Types
export interface SocketConfig {
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  reconnectionDelayMax?: number;
  timeout?: number;
  transports?: string[];
}

export interface EventSubscription {
  eventName: string;
  handler: EventHandler;
  id: string;
}

export type EventHandler<T = any> = (data: T) => void | Promise<void>;

export interface ConnectionStatus {
  connected: boolean;
  connecting: boolean;
  disconnected: boolean;
  error?: string;
}

// Server-specific events
export interface TXFailedEvent {
  email: string;
  message: string;
  error: string;
}

export interface TXConfirmedEvent {
  email: string;
  message: string;
  transactionHash: string;
}

export interface AccountCreationSuccessEvent {
  user: string;
  address: string;
  btcAdress: string;
  accessToken: string;
}

export interface AccountCreationFailedEvent {
  email: string;
  message: string;
  error: string;
}

// Mpesa OnRamp/OffRamp Types
export interface MpesaSTKInitiateRequest {
  email?: string;
  amount: number;
  phone: string;
  cryptoAsset: "POL-USDC" | "BERA-USDC" | "ETH" | "WBERA";
  cryptoWalletAddress: string;
  externalReference: string; // unique identifier
}

export interface MpesaSafaricomResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export interface MpesaCryptoIntent {
  asset: string;
  walletAddress: string;
}

export interface MpesaSTKInitiateResponse {
  success: boolean;
  message: string;
  data: {
    message: string;
    merchantRequestID: string;
    checkoutRequestID: string;
    safaricomResponse: MpesaSafaricomResponse;
    cryptoIntent: MpesaCryptoIntent;
    note: string;
  };
}

export interface MpesaTransactionStatusRequest {
  checkoutRequestId?: string;
  merchantRequestId?: string;
}

export interface MpesaTransactionData {
  id: string;
  checkoutRequestId: string;
  merchantRequestId: string;
  status: "pending" | "success" | "failed";
  failureReason: string | null;
  amount: number;
  currency: string;
  phoneNumber: string;
  userEmail: string;
  mpesaReceiptNumber: string | null;
  transactionDate: string | null;
  cryptoIntent: MpesaCryptoIntent;
  cryptoStatus: "pending" | "success" | "failed" | null;
  cryptoTxHash: string | null;
  cryptoFailureReason: string | null;
  cryptoAmount: number | null;
  amountInUSD: number | null;
  cryptoProcessedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MpesaTransactionStatusResponse {
  success: boolean;
  status: "pending" | "success" | "failed";
  data: MpesaTransactionData;
}

// Mpesa Transaction History Types
export interface MpesaTransactionHistoryRequest {
  email?: string;
  externalReference?: string;
  status?: "pending" | "success" | "failed";
  cryptoStatus?: "pending" | "success" | "failed";
  cryptoTxHash?: string;
  mpesaReceiptNumber?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: string; // Format: YYYY-MM-DD
  endDate?: string; // Format: YYYY-MM-DD
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface MpesaTransactionHistoryItem {
  id: string;
  checkoutRequestId: string;
  merchantRequestId: string;
  phoneNumber: string;
  amount: number;
  currency: string;
  status: "pending" | "success" | "failed";
  failureReason: string | null;
  mpesaReceiptNumber: string | null;
  accountReference: string;
  transactionDate: string | null;
  cryptoIntent: MpesaCryptoIntent;
  cryptoStatus: "pending" | "success" | "failed" | null;
  cryptoTxHash: string | null;
  cryptoFailureReason: string | null;
  cryptoAmount: number | null;
  amountInUSD: number | null;
  cryptoProcessedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MpesaTransactionHistoryPagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface MpesaTransactionHistoryResponse {
  success: boolean;
  data: MpesaTransactionHistoryItem[];
  pagination: MpesaTransactionHistoryPagination;
}

// Proxy Wallet / Signature Types
export interface GetWalletInstanceRequest {
  chain: ChainName;
  [key: string]: any;
}

export interface ChainInfo {
  id: number;
  name: string;
  nativeToken: string;
  tokens: string[];
}

export interface ProviderInfo {
  url: string;
  chainId: number;
  name: string;
}

export interface WalletInstanceResponse {
  address: string;
  publicKey: string;
  provider: ProviderInfo;
  chain: ChainInfo;
  _isWallet: boolean;
  _isSigner: boolean;
  availableMethods: {
    getAddress: string;
    getBalance: string;
    sendTransaction: string;
    signTransaction: string;
    signMessage: string;
  };
}

export interface SignTransactionRequest {
  chain: ChainName;
  transactionData: {
    to?: string;
    value?: string;
    data?: string;
    gasLimit?: string;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    nonce?: number;
    type?: number;
    chainId?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface SignTransactionResponse {
  signedTransaction: string;
  txHash: string;
  from: string;
  originalTx: SignTransactionRequest["transactionData"];
}

export interface SendTransactionRequest {
  chain: ChainName;
  transactionData: {
    to?: string;
    value?: string;
    data?: string;
    gasLimit?: string;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    nonce?: number;
    type?: number;
    chainId?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface SendTransactionResponse {
  hash: string;
  to?: string;
  from: string;
  value?: string;
  gasLimit?: string;
  gasPrice?: string;
  nonce: number;
  chainId?: number;
  blockNumber?: number;
  blockHash?: string;
  timestamp?: number;
  confirmations: number;
  raw: any; // Raw transaction object
}

export interface SignMessageRequest {
  chain: ChainName;
  message: string;
  [key: string]: any;
}

export interface SignMessageResponse {
  signature: string;
  message: string;
  signer: string;
  messageHash: string;
  recoveredAddress: string;
}

export interface GenerateSignatureResponse {
  address: string;
  publicKey: string;
  signature: string;
  availableEndpoints: {
    signMessage: string;
    signTransaction: string;
    sendTransaction: string;
    getWallet: string;
  };
}

export interface ProxyWalletError {
  error: string;
  supportedChains?: string[];
}

// Notification-related types
export interface NotificationSubscriptionRequest {
  subscriberId: string;
  deviceInfo?: string;
  platform?: string; // 'web', 'mobile', etc.
}

export interface NotificationSubscription {
  id: string;
  subscriberId: string;
  isActive: boolean;
}

export interface UserNotificationSubscription {
  id: string;
  subscriberId: string;
  deviceInfo?: string;
  platform?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationTestRequest {
  subscriberId: string;
  message: string;
  targetUrl?: string;
  title?: string;
}

export interface NotificationSendRequest {
  message: string;
  targetUrl?: string;
  title?: string;
}

export interface NotificationSendResponse {
  summary: {
    sent: number;
    failed: number;
    total: number;
  };
  details: Array<{
    subscriberId: string;
    success: boolean;
    error?: string;
    requestId?: string;
  }>;
}

// Request type for getting merchant status
export interface GetMerchantStatusRequest {
  user?: string; // Optional: specific user ID to check
}

// Response type for merchant status
export interface GetMerchantStatusResponse {
  success: boolean;
  data: {
    userId: string;
    email: string | null;
    phoneNumber: string | null;
    externalId: string | null;
    displayName: string | null;
    merchantApproved: boolean;
    approvedAt: string | null; // ISO date string
    approvedBy: string | null; // Email or phone of approver
    kybNotes: string | null; // KYB verification notes
  };
}

// Error response for unapproved merchants
export interface MerchantNotApprovedError {
  error: string;
  message: string;
  merchantStatus: {
    approved: false;
    userId: string;
    identifier: string | null;
  };
}

// Ramp Balance Error Types
export interface InsufficientFloatBalanceError {
  error: "Insufficient float balance";
  message: string;
  required: number;
  available: number;
  currency: string;
}

export interface InsufficientUsdcBalanceError {
  error: "Insufficient USDC balance";
  message: string;
  required: number;
  available: number;
  asset: string;
  chain: string;
}

export interface UsdcTransferFailedError {
  error: "USDC transfer failed";
  message: string;
  provider: string;
  transferError: string;
}

export interface RampTimeoutError {
  error: string; // e.g., "timeout of 30000ms exceeded"
  message?: string;
}

// Deposit Types
export interface Deposit {
  id: string;
  userId: string;
  transactionHash: string;
  blockNumber: string;
  blockTimestamp: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  rawAmount: string;
  exchangeRate: number;
  kesAmount: number;
  processed: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    email: string;
    phoneNumber: string;
  };
}

export interface GetAllDepositsResponse {
  deposits: Deposit[];
}

export interface DepositStatsResponse {
  stats: {
    totalDeposits: number;
    totalUsdcAmount: number;
    totalKesAmount: number;
    deposits: Deposit[];
  };
}

// Vault Types

// Protocol Statistics
export interface ProtocolStats {
  tvl: string;
  totalDeposits: string;
  pendingRewards: string;
  rewardsDistributed: string;
  pendingClaimersCount: number;
  pendingWithdrawersCount: number;
  version: string;
  stablecoin: string;
  admin: string;
}

export interface VaultTvlResponse {
  tvl: string;
}

export interface VaultTotalDepositsResponse {
  totalDeposits: string;
}

export interface VaultPendingRewardsResponse {
  pendingRewards: string;
}

export interface VaultRewardsDistributedResponse {
  rewardsDistributed: string;
}

export interface VaultPendingClaimersResponse {
  pendingClaimersCount: number;
}

export interface VaultPendingWithdrawersResponse {
  pendingWithdrawersCount: number;
}

// Contract Information
export interface VaultVersionResponse {
  version: string;
}

export interface VaultStablecoinResponse {
  stablecoin: string;
}

export interface VaultAdminResponse {
  admin: string;
}

// User Data
export interface UserVaultData {
  address: string;
  balance: string;
  rewards: string;
  hasPendingClaim: boolean;
  pendingWithdrawal: string;
  hasPendingWithdrawal: boolean;
}

export interface UserVaultBalanceResponse {
  balance: string;
}

export interface UserVaultRewardsResponse {
  rewards: string;
}

export interface UserVaultWhitelistResponse {
  address: string;
  isWhitelisted: boolean;
}

// User Operations
export interface VaultDepositRequest {
  amount: string;
}

export interface VaultApprovalInfo {
  success: boolean;
  userOperationHash: string;
}

export interface VaultDepositInfo {
  success: boolean;
  transactionHash: string;
}

export interface VaultDepositResponse {
  message: string;
  ownerEOA: string;
  smartWalletAddress: string;
  approvalPerformed: boolean;
  approval: VaultApprovalInfo | null;
  deposit: VaultDepositInfo;
}

export interface VaultWithdrawRequest {
  amount: string;
}

export interface VaultTransactionResponse {
  message: string;
  success: boolean;
  transactionHash: string;
}

// ============================================
// KYC Types
// ============================================

export interface KYCTokenRequest {
  country_code: string;
  identifier: string;
}

export interface KYCTokenResponse {
  token: string | null;
  provider: "smileid" | "sumsub";
  expires_at: string;
  verificationUrl?: string;
  linkDelivered?: boolean;
  deliveryMethod?: "email" | "sms" | "none";
}

export interface KYCUserExistsRequest {
  email?: string;
  phoneNumber?: string;
  externalId?: string;
}

export interface KYCUserExistsResponse {
  exists: boolean;
  userId?: string;
  kycStatus?: "verified" | "failed" | "pending" | "provisional";
}

export interface KYCStatusRequest {
  email?: string;
  phoneNumber?: string;
  externalId?: string;
}

export interface KYCStatusResponse {
  status: "verified" | "failed" | "pending" | "provisional";
  message: string;
}

export interface KYCVerifyAndSendOtpRequest {
  identifier: string;
  maxWaitTime?: number;
}

export interface KYCVerifyRequest {
  jobId: string;
}

export interface KYCVerifyResponse {
  success: boolean;
  kycVerified: boolean;
  message: string;
}

export interface KYCVerifiedResponse {
  success: boolean;
  kycVerified: boolean;
}

export interface KYCJobStatusResponse {
  success: boolean;
  status: "verified" | "failed" | "pending" | "provisional";
  complete: boolean;
  passed: boolean;
  underReview: boolean;
  message: string;
}

// ============================================
// Loyalty Types
// ============================================

export interface LoyaltyStats {
  totalPoints: number;
  availablePoints: number;
  claimedPoints: number;
  stats: {
    currentStreak: number;
    uniqueActionTypes: number;
    cumulativeVolume: number;
    lastActivityDate: string | null;
    dailyPointsToday: number;
  };
}

export interface LoyaltyStatsResponse {
  success: boolean;
  data: LoyaltyStats;
}

export interface LoyaltyHistoryRequest {
  limit?: number;
  offset?: number;
}

export interface LoyaltyActivity {
  id: string;
  actionType: string;
  transactionValue: number;
  pointsEarned: number;
  pointValue: number;
  multiplier: number;
  metadata: any;
  createdAt: string;
}

export interface LoyaltyHistoryResponse {
  success: boolean;
  data: {
    activities: LoyaltyActivity[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}

export interface LoyaltyLeaderboardRequest {
  limit?: number;
}

export interface LoyaltyLeaderboardEntry {
  rank: number;
  userId: string;
  totalPoints: number;
  address: string;
}

export interface LoyaltyLeaderboardResponse {
  success: boolean;
  data: {
    leaderboard: LoyaltyLeaderboardEntry[];
  };
}

export interface LoyaltyMetricsResponse {
  success: boolean;
  data: {
    totalPointsIssued: number;
    totalUsers: number;
    totalRedemptions: number;
    totalRedeemed: number;
    averagePointsPerUser: number;
  };
}

export interface LoyaltyPointValueResponse {
  success: boolean;
  data: {
    pointValue: number;
    totalSupply: number;
    budget: number;
    commitment: number;
    remaining: number;
  };
}

export interface LoyaltyRedeemRequest {
  points: number;
  redemptionType?: string;
}

export interface LoyaltyRedemption {
  redemptionId: string;
  pointsRedeemed: number;
  usdValue: number;
  recipientAddress: string;
  chain: string;
  token: string;
  status: "COMPLETED" | "FAILED";
  transactionHash: string;
  transactionUrl: string;
}

export interface LoyaltyRedeemResponse {
  success: boolean;
  message: string;
  data: LoyaltyRedemption;
}

export interface LoyaltyRedemptionHistoryItem {
  id: string;
  accountId: string;
  pointsRedeemed: number;
  pointValue: number;
  usdValue: number;
  redemptionType: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  completedAt: string | null;
  metadata: any;
  createdAt: string;
}

export interface LoyaltyRedemptionsResponse {
  success: boolean;
  data: {
    redemptions: LoyaltyRedemptionHistoryItem[];
  };
}

export interface LoyaltyConfigResponse {
  success: boolean;
  data: {
    config: {
      TOTAL_BUDGET: number;
      REDEMPTION: {
        MIN_POINTS: number;
      };
    };
    note: string;
  };
}

// ============================================
// Weekly Pool Types
// ============================================

export interface WeeklyPoolResponse {
  currentPool: any;
  userProgress: any;
  leaderboard: any[];
  pastWinners: any[];
}

export interface WeeklyPoolHistoryRequest {
  page?: number;
  limit?: number;
}

export interface WeeklyPoolHistoryResponse {
  pools: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface WeeklyPoolReferralResponse {
  referralCode: string;
  referralLink: string;
  referralsCount: number;
  referralStats: any;
}

// ============================================
// Referral Fee Types
// ============================================

export interface ReferralFeeBalanceResponse {
  totalUsd: number;
  currencyBreakdown: Record<string, number>;
  entryCount: number;
  canClaim: boolean;
  nextClaimDate: string | null;
}

export interface ReferralFeeEntry {
  id: string;
  currency: string;
  amount: number;
  date: string;
}

export interface ReferralFeeEntriesResponse {
  totalUsd: number;
  currencyBreakdown: Record<string, number>;
  entries: ReferralFeeEntry[];
}

export interface ReferralFeeClaim {
  id: string;
  totalUsd: number;
  status: "PENDING" | "COMPLETED";
  createdAt: string;
  completedAt?: string | null;
}

export interface ReferralFeeClaimResponse {
  success: boolean;
  error?: string;
  claim: ReferralFeeClaim;
}

export interface ReferralFeeClaimsResponse {
  claims: ReferralFeeClaim[];
}

export interface ReferralFeeReferralsRequest {
  referralCode?: string;
  list?: "true" | "false";
}

export interface ReferralFeeReferralsResponse {
  referralCode: string;
  totalReferrals: number;
  referredUsers?: any[];
}

// ============================================
// Bridge Types
// ============================================

export interface BridgeRoutesResponse {
  routes: Record<string, string[]>;
  supportedTokens: string[];
}

export interface BridgeQuoteRequest {
  sourceChain: string;
  destinationChain: string;
  token: string;
  amount: string;
}

export interface BridgeQuoteResponse {
  sourceChain: string;
  destinationChain: string;
  token: string;
  inputAmount: string;
  outputAmount: string;
  fee: string;
  feeBps: number;
  estimatedTime: string;
}

export interface BridgeExecuteRequest {
  sourceChain: string;
  destinationChain: string;
  token: string;
  amount: string;
  recipient?: string;
}

export interface BridgeExecuteResponse {
  success: boolean;
  sourceChain: string;
  destinationChain: string;
  token: string;
  inputAmount: string;
  outputAmount: string;
  fee: string;
  recipient: string;
  transactionHash: string;
  smartWalletAddress: string;
  sourceChainId: number;
  destinationChainId: number;
}

// ============================================
// WalletConnect Types
// ============================================

export interface WalletConnectPairRequest {
  uri: string;
  chain: string;
}

export interface WalletConnectPairResponse {
  success: boolean;
  topic: string;
  smartWalletAddress: string;
  chain: string;
  chainId: number;
  peerName: string;
  peerUrl: string;
}

export interface WalletConnectSession {
  topic: string;
  peerName: string;
  peerUrl: string;
  chains: string[];
  [key: string]: any;
}

export interface WalletConnectRequest {
  id: string;
  method: string;
  params: any;
  [key: string]: any;
}

// ============================================
// Project Types (extended)
// ============================================

export interface CreateProjectRequest {
  name: string;
  email?: string;
  phoneNumber?: string;
  known_origins?: string;
  payment_link_widget?: string;
}

export interface ProjectData {
  id: string;
  name: string;
  api_key?: string;
  owner_phone?: string;
  owner_email?: string;
  known_origins?: string[];
  api_calls?: number;
  payment_link_widget?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateProjectResponse {
  success: boolean;
  message: string;
  data: ProjectData;
}

export interface GetProjectsRequest {
  page?: number;
  limit?: number;
}

export interface GetProjectsResponse {
  success: boolean;
  data: {
    projects: ProjectData[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface GetMyProjectsRequest {
  email?: string;
  phoneNumber?: string;
}

export interface GetMyProjectsResponse {
  success: boolean;
  data: ProjectData[];
}

export interface GetProjectResponse {
  success: boolean;
  data: ProjectData;
}

export interface ProjectStatsResponse {
  success: boolean;
  data: {
    api_calls: number;
  };
}

export interface RegenerateKeyResponse {
  success: boolean;
  message: string;
  data: ProjectData;
}

export interface AddOriginRequest {
  origin: string;
  phoneNumber?: string;
  email?: string;
}

export interface AddOriginResponse {
  success: boolean;
  message: string;
  data: ProjectData;
}

export interface UpdatePaymentWidgetRequest {
  id: string;
  payment_link_widget: string;
}

export interface UpdatePaymentWidgetResponse {
  success: boolean;
  data: ProjectData;
}

// ============================================
// User Management Types
// ============================================

export interface SuspendUserRequest {
  phoneNumber?: string;
  email?: string;
  externalId?: string;
  userId?: string;
  reason?: string;
  projectOwnerPhone?: string;
  projectOwnerEmail?: string;
}

export interface SuspendUserResponse {
  success: boolean;
  message: string;
  data: {
    userId: string;
    email: string;
    phoneNumber: string;
    externalId: string;
    suspendedAt: string;
    suspendedReason: string;
  };
}

export interface UnsuspendUserRequest {
  phoneNumber?: string;
  email?: string;
  externalId?: string;
  userId?: string;
  projectOwnerPhone?: string;
  projectOwnerEmail?: string;
}

export interface UnsuspendUserResponse {
  success: boolean;
  message: string;
  data: {
    userId: string;
    email: string;
    phoneNumber: string;
    externalId: string;
    isSuspended: false;
  };
}

export interface GetSuspendedUsersRequest {
  projectOwnerPhone?: string;
  projectOwnerEmail?: string;
}

export interface SuspendedUser {
  id: string;
  email: string;
  phoneNumber: string;
  externalId: string;
  display_name: string;
  suspendedAt: string;
  suspendedReason: string;
  suspendedBy: string;
  createdAt: string;
}

export interface GetSuspendedUsersResponse {
  success: boolean;
  message: string;
  data: {
    suspendedUsers: SuspendedUser[];
    totalCount: number;
  };
}

export interface GetUserStatusRequest {
  phoneNumber?: string;
  email?: string;
  externalId?: string;
  userId?: string;
}

export interface GetUserStatusResponse {
  success: boolean;
  data: {
    userId: string;
    email: string;
    phoneNumber: string;
    externalId: string;
    isSuspended: boolean;
    suspendedAt: string | null;
    suspendedReason: string | null;
    suspendedBy: string | null;
  };
}

// ============================================
// Stats Types
// ============================================

export interface StatsVolumeResponse {
  data: {
    usdcDeposits: number;
    usdcDepositsCount: number;
    usdcDepositsInKes: number;
    offrampVolume: number;
    offrampVolumeInKes: number;
    offrampVolumeCount: number;
    totalVolume: number;
    totalVolumeCount: number;
    totalVolumeInKes: number;
  };
}

export interface StatsUsersResponse {
  data: number;
}

export interface StatsTvlResponse {
  data: {
    totalValueLocked: number;
    totalValueLockedInKes: number;
    walletsCount: number;
    exchangeRate: number;
    currency: string;
  };
}
