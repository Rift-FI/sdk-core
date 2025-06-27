export enum Environment {
  DEVELOPMENT = "development",
  PRODUCTION = "production",
}

export interface SphereConfig {
  apiKey?: string;
  environment: Environment;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
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
    }
  | {
      externalId?: never;
      password?: never;
      phoneNumber?: string;
      email?: string;
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
  | "BERACHAIN"
  | "POLYGON"
  | "BERACHAIN_TESTNET"
  | "POLYGON_TESTNET";


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
  | "SAIL";

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

export interface TransactionRequest {
  to: string;
  value: string;
  token: TokenSymbol;
  chain: ChainName;
  intent?: "unlock";
  type?: TransactionType;
}

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
export type SendSpecificPaymentRequest =
  | {
      time: string;
      value: string;
      token: TokenSymbol;
      chain: ChainName;
      username: string;
      phoneNumber?: never;
      email?: never;
    }
  | {
      time: string;
      value: string;
      token: TokenSymbol;
      chain: ChainName;
      phoneNumber: string;
      username?: never;
      email?: never;
    }
  | {
      time: string;
      value: string;
      token: TokenSymbol;
      chain: ChainName;
      email: string;
      username?: never;
      phoneNumber?: never;
    };

export interface SendOpenPaymentRequest {
  time: string;
  value: string;
  token: TokenSymbol;
  chain: ChainName;
}

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
