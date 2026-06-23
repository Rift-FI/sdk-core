import { BaseService } from "../base-service";
import {
  ProtocolStats,
  VaultTvlResponse,
  VaultTotalDepositsResponse,
  VaultPendingRewardsResponse,
  VaultRewardsDistributedResponse,
  VaultPendingClaimersResponse,
  VaultPendingWithdrawersResponse,
  VaultVersionResponse,
  VaultStablecoinResponse,
  VaultAdminResponse,
  UserVaultData,
  UserVaultBalanceResponse,
  UserVaultRewardsResponse,
  UserVaultWhitelistResponse,
  VaultDepositRequest,
  VaultDepositResponse,
  VaultWithdrawRequest,
  VaultTransactionResponse,
} from "../types";

export class VaultService extends BaseService {
  // ============================================
  // Protocol Read Methods (API Key only)
  // ============================================

  /**
   * Get all protocol statistics
   * Returns comprehensive protocol statistics including TVL, total deposits,
   * pending rewards, rewards distributed, and queue counts.
   */
  async getProtocolStats(): Promise<ProtocolStats> {
    return this.publicRequest<ProtocolStats>({
      method: "GET",
      url: "/v1/vault/stats",
    });
  }

  /**
   * Get Total Value Locked
   * Returns the total value locked in the protocol (deposits + pending rewards).
   */
  async getTvl(): Promise<VaultTvlResponse> {
    return this.publicRequest<VaultTvlResponse>({
      method: "GET",
      url: "/v1/vault/tvl",
    });
  }

  /**
   * Get total deposits
   * Returns the total amount of USDC deposited in the protocol.
   */
  async getTotalDeposits(): Promise<VaultTotalDepositsResponse> {
    return this.publicRequest<VaultTotalDepositsResponse>({
      method: "GET",
      url: "/v1/vault/deposits",
    });
  }

  /**
   * Get total pending rewards
   * Returns the total pending rewards across all users that have not yet been claimed.
   */
  async getPendingRewards(): Promise<VaultPendingRewardsResponse> {
    return this.publicRequest<VaultPendingRewardsResponse>({
      method: "GET",
      url: "/v1/vault/rewards/pending",
    });
  }

  /**
   * Get total rewards distributed
   * Returns the cumulative total of all rewards that have been distributed to users.
   */
  async getRewardsDistributed(): Promise<VaultRewardsDistributedResponse> {
    return this.publicRequest<VaultRewardsDistributedResponse>({
      method: "GET",
      url: "/v1/vault/rewards/distributed",
    });
  }

  /**
   * Get pending claimers count
   * Returns the number of users with pending claim requests waiting to be processed.
   */
  async getPendingClaimersCount(): Promise<VaultPendingClaimersResponse> {
    return this.publicRequest<VaultPendingClaimersResponse>({
      method: "GET",
      url: "/v1/vault/claims/pending",
    });
  }

  /**
   * Get pending withdrawers count
   * Returns the number of users with pending withdrawal requests waiting to be processed.
   */
  async getPendingWithdrawersCount(): Promise<VaultPendingWithdrawersResponse> {
    return this.publicRequest<VaultPendingWithdrawersResponse>({
      method: "GET",
      url: "/v1/vault/withdrawals/pending",
    });
  }

  // ============================================
  // Contract Information Methods (API Key only)
  // ============================================

  /**
   * Get contract version
   * Returns the current version of the Yield Aggregator smart contract.
   */
  async getContractVersion(): Promise<VaultVersionResponse> {
    return this.publicRequest<VaultVersionResponse>({
      method: "GET",
      url: "/v1/vault/contract",
    });
  }

  /**
   * Get stablecoin address
   * Returns the USDC contract address used by the protocol on Base network.
   */
  async getStablecoinAddress(): Promise<VaultStablecoinResponse> {
    return this.publicRequest<VaultStablecoinResponse>({
      method: "GET",
      url: "/v1/vault/contract",
    });
  }

  /**
   * Get admin address
   * Returns the current admin address of the Yield Aggregator contract.
   */
  async getAdminAddress(): Promise<VaultAdminResponse> {
    return this.publicRequest<VaultAdminResponse>({
      method: "GET",
      url: "/v1/vault/contract",
    });
  }

  // ============================================
  // User Read Methods (API Key + JWT required)
  // ============================================

  /**
   * Get current user's vault data
   * Returns comprehensive vault data for the authenticated user including
   * balance, rewards, and pending request status.
   */
  async getMyVaultData(): Promise<UserVaultData> {
    return this.authenticatedRequest<UserVaultData>({
      method: "GET",
      url: "/v1/vault/positions/me",
    });
  }

  /**
   * Get current user's deposited balance
   * Returns the authenticated user's deposited USDC balance in the vault.
   */
  async getMyBalance(): Promise<UserVaultBalanceResponse> {
    return this.authenticatedRequest<UserVaultBalanceResponse>({
      method: "GET",
      url: "/v1/vault/positions/me/balance",
    });
  }

  /**
   * Get current user's pending rewards
   * Returns the authenticated user's pending yield rewards that can be claimed.
   */
  async getMyRewards(): Promise<UserVaultRewardsResponse> {
    return this.authenticatedRequest<UserVaultRewardsResponse>({
      method: "GET",
      url: "/v1/vault/positions/me/rewards",
    });
  }

  /**
   * Check user's whitelist status
   * Returns whether the authenticated user's smart wallet is whitelisted for fund transfers.
   */
  async getMyWhitelistStatus(): Promise<UserVaultWhitelistResponse> {
    return this.authenticatedRequest<UserVaultWhitelistResponse>({
      method: "GET",
      url: "/v1/vault/positions/me/whitelist",
    });
  }

  // ============================================
  // User Write Methods (API Key + JWT required)
  // ============================================

  /**
   * Deposit USDC into the vault
   * Deposits USDC into the yield vault. The backend automatically:
   * 1. Derives the user's smart wallet address
   * 2. Checks current USDC allowance for the vault contract
   * 3. If insufficient, submits a gasless approval transaction via smart wallet
   * 4. Waits for allowance to update on-chain
   * 5. Submits the deposit transaction
   *
   * All transactions are gasless - the user doesn't need ETH for gas.
   *
   * @param request - Deposit request with amount (human readable, e.g., '100' for 100 USDC)
   */
  async deposit(request: VaultDepositRequest): Promise<VaultDepositResponse> {
    return this.authenticatedRequest<VaultDepositResponse>({
      method: "POST",
      url: "/v1/vault/deposits",
      data: request,
    });
  }

  /**
   * Request withdrawal from the vault
   * Requests a withdrawal of deposited USDC from the vault. The withdrawal is queued
   * and will be processed by the admin in the next batch (typically daily).
   * The user's balance is locked until the withdrawal is processed or cancelled.
   *
   * @param request - Withdrawal request with amount (human readable)
   */
  async withdraw(
    request: VaultWithdrawRequest
  ): Promise<VaultTransactionResponse> {
    return this.authenticatedRequest<VaultTransactionResponse>({
      method: "POST",
      url: "/v1/vault/withdrawals",
      data: request,
    });
  }

  /**
   * Cancel pending withdrawal request
   * Cancels a pending withdrawal request and restores the user's balance.
   * Can only be called if the user has a pending withdrawal that hasn't been processed yet.
   */
  async cancelWithdrawal(): Promise<VaultTransactionResponse> {
    return this.authenticatedRequest<VaultTransactionResponse>({
      method: "POST",
      url: "/v1/vault/withdrawals/pending",
    });
  }

  /**
   * Request reward claim
   * Requests to claim pending yield rewards. The claim is queued and will be processed
   * by the admin in the next batch (typically daily). Once processed, the rewards will
   * be sent to the user's smart wallet.
   */
  async claimRewards(): Promise<VaultTransactionResponse> {
    return this.authenticatedRequest<VaultTransactionResponse>({
      method: "POST",
      url: "/v1/vault/claims",
    });
  }

  /**
   * Cancel pending claim request
   * Cancels a pending reward claim request. Can only be called if the user has a
   * pending claim that hasn't been processed yet.
   */
  async cancelClaim(): Promise<VaultTransactionResponse> {
    return this.authenticatedRequest<VaultTransactionResponse>({
      method: "POST",
      url: "/v1/vault/claims/pending",
    });
  }
}

