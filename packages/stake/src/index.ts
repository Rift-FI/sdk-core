import { StakingConfig, DeploymentConfig, RPC_URLS, Chain, Tranche, StakeInfo, stakingAddress, StakingDeployment, InvestmentProposal } from "./types";
export { StakingConfig, DeploymentConfig, Chain, Tranche, StakeInfo, StakingDeployment, InvestmentProposal } from "./types";
import { PSTStakingAbi } from "./abi/pst-staking.abi";
import { PSTInvestmentAbi } from "./abi/pst-investment.abi";
import { ERC20Abi } from "./abi/erc20.abi";
import { ethers } from "ethers";

type Role = "MINTER_ROLE" | "BURNER_ROLE" | "REBASER_ROLE" | "EMERGENCY_ROLE" | "INVESTOR_ROLE" | "ADMIN_ROLE";

class StakingSDK {
  private getWallet(
    chain: Chain,
    privateKey?: string,
    walletInstance?: ethers.Wallet
  ) {
    if (walletInstance) {
      return walletInstance;
    }
    if (privateKey) {
      const rpcUrl = RPC_URLS[chain];
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      return new ethers.Wallet(privateKey, provider);
    }
    throw new Error("Private key or wallet instance is required");
  }

  private getProvider(chain: Chain) {
    const rpcUrl = RPC_URLS[chain];
    return new ethers.JsonRpcProvider(rpcUrl);
  }

  private getStakingContract(
    stakingAddress: string,
    walletOrProvider: ethers.Wallet | ethers.Provider
  ) {
    return new ethers.Contract(stakingAddress, PSTStakingAbi, walletOrProvider);
  }

  private getInvestmentContract(
    investmentAddress: string,
    walletOrProvider: ethers.Wallet | ethers.Provider
  ) {
    return new ethers.Contract(investmentAddress, PSTInvestmentAbi, walletOrProvider);
  }

  private getERC20Contract(
    tokenAddress: string,
    walletOrProvider: ethers.Wallet | ethers.Provider
  ) {
    return new ethers.Contract(tokenAddress, ERC20Abi, walletOrProvider);
  }

  /**
   * Deploy a complete staking system
   */
  async deployStakingSystem(
    config: DeploymentConfig,
    deployerPrivateKey?: string,
    walletInstance?: ethers.Wallet
  ): Promise<StakingDeployment> {
    const wallet = this.getWallet(config.chain, deployerPrivateKey, walletInstance);

    try {
      // This would be implemented to deploy all contracts
      // For now, return placeholder addresses
      throw new Error("Deployment functionality not yet implemented. Use deployStakingSystemLocal for testing.");
    } catch (error) {
      console.error("Error deploying staking system:", error);
      throw error;
    }
  }

  /**
   * Deploy a complete staking system locally for testing
   */
  async deployStakingSystemLocal(
    config: DeploymentConfig,
    deployerPrivateKey?: string,
    walletInstance?: ethers.Wallet
  ): Promise<StakingDeployment> {
    const wallet = this.getWallet(config.chain, deployerPrivateKey, walletInstance);

    try {
      // Deploy PST Token
      const PSTFactory = await ethers.getContractFactory("PST", wallet);
      const pstToken = await PSTFactory.deploy();
      await pstToken.waitForDeployment();
      const pstTokenAddress = await pstToken.getAddress();

      // Deploy PSTJ Token
      const PSTJFactory = await ethers.getContractFactory("PSTJ", wallet);
      const pstjToken = await PSTJFactory.deploy();
      await pstjToken.waitForDeployment();
      const pstjTokenAddress = await pstjToken.getAddress();

      // Deploy PSTInvestment
      const PSTInvestmentFactory = await ethers.getContractFactory("PSTInvestment", wallet);
      const investmentManager = await PSTInvestmentFactory.deploy(
        config.stablecoinAddress,
        config.treasuryAddress
      );
      await investmentManager.waitForDeployment();
      const investmentAddress = await investmentManager.getAddress();

      // Deploy PSTLiquidity
      const PSTLiquidityFactory = await ethers.getContractFactory("PSTLiquidity", wallet);
      const liquidityManager = await PSTLiquidityFactory.deploy(
        config.stablecoinAddress,
        config.treasuryAddress
      );
      await liquidityManager.waitForDeployment();
      const liquidityAddress = await liquidityManager.getAddress();

      // Deploy PSTStaking
      const PSTStakingFactory = await ethers.getContractFactory("PSTStaking", wallet);
      const stakingContract = await PSTStakingFactory.deploy(
        config.stablecoinAddress,
        pstTokenAddress,
        pstjTokenAddress,
        investmentAddress,
        liquidityAddress,
        config.treasuryAddress
      );
      await stakingContract.waitForDeployment();
      const stakingAddress = await stakingContract.getAddress();

      // Grant roles
      const minterRole = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
      const burnerRole = ethers.keccak256(ethers.toUtf8Bytes("BURNER_ROLE"));

      await pstToken.grantRole(minterRole, stakingAddress);
      await pstToken.grantRole(burnerRole, stakingAddress);
      await pstjToken.grantRole(minterRole, stakingAddress);
      await pstjToken.grantRole(burnerRole, stakingAddress);

      console.log("Staking system deployed successfully.");

      return {
        pstStaking: stakingAddress,
        pstInvestment: investmentAddress,
        pstLiquidity: liquidityAddress,
        pstToken: pstTokenAddress,
        pstjToken: pstjTokenAddress,
        stablecoin: config.stablecoinAddress,
        treasury: config.treasuryAddress
      };

    } catch (error) {
      console.error("Error deploying local staking system:", error);
      throw error;
    }
  }

  // ==================== STAKING FUNCTIONS ====================

  /**
   * Stake USDC in a specific tranche
   */
  async stake(
    amount: string | number,
    tranche: Tranche,
    stakingAddress: string,
    chain: Chain,
    privateKey?: string,
    walletInstance?: ethers.Wallet
  ): Promise<ethers.TransactionResponse> {
    const wallet = this.getWallet(chain, privateKey, walletInstance);
    const stakingContract = this.getStakingContract(stakingAddress, wallet);

    const amountWei = ethers.parseUnits(amount.toString(), 6); // USDC has 6 decimals
    const trancheIndex = tranche === Tranche.SuperSenior ? 0 : 1;

    return await stakingContract.stake(amountWei, trancheIndex);
  }

  /**
   * Withdraw staked amount
   */
  async withdraw(
    amount: string | number,
    stakingAddress: string,
    chain: Chain,
    privateKey?: string,
    walletInstance?: ethers.Wallet
  ): Promise<ethers.TransactionResponse> {
    const wallet = this.getWallet(chain, privateKey, walletInstance);
    const stakingContract = this.getStakingContract(stakingAddress, wallet);

    const amountWei = ethers.parseUnits(amount.toString(), 6);
    return await stakingContract.withdraw(amountWei);
  }

  /**
   * Claim accrued rewards
   */
  async claimRewards(
    stakingAddress: string,
    chain: Chain,
    privateKey?: string,
    walletInstance?: ethers.Wallet
  ): Promise<ethers.TransactionResponse> {
    const wallet = this.getWallet(chain, privateKey, walletInstance);
    const stakingContract = this.getStakingContract(stakingAddress, wallet);

    return await stakingContract.claimRewards();
  }

  /**
   * Emergency withdraw (admin only)
   */
  async emergencyWithdraw(
    stakingAddress: string,
    chain: Chain,
    privateKey?: string,
    walletInstance?: ethers.Wallet
  ): Promise<ethers.TransactionResponse> {
    const wallet = this.getWallet(chain, privateKey, walletInstance);
    const stakingContract = this.getStakingContract(stakingAddress, wallet);

    return await stakingContract.emergencyWithdraw();
  }

  // ==================== VIEW FUNCTIONS ====================

  /**
   * Get stake information for a user
   */
  async getStakeInfo(
    userAddress: string,
    stakingAddress: string,
    chain: Chain
  ): Promise<StakeInfo> {
    const provider = this.getProvider(chain);
    const stakingContract = this.getStakingContract(stakingAddress, provider);

    const stakeInfo = await stakingContract.getStakeInfo(userAddress);
    
    return {
      amount: ethers.formatUnits(stakeInfo.amount, 6),
      tranche: stakeInfo.tranche === 0 ? Tranche.SuperSenior : Tranche.Junior,
      stakeTimestamp: Number(stakeInfo.stakeTimestamp),
      accruedRewards: ethers.formatUnits(stakeInfo.accruedRewards, 6)
    };
  }

  /**
   * Calculate unclaimed rewards for a user
   */
  async calculateUnclaimedRewards(
    userAddress: string,
    stakingAddress: string,
    chain: Chain
  ): Promise<string> {
    const provider = this.getProvider(chain);
    const stakingContract = this.getStakingContract(stakingAddress, provider);

    const rewards = await stakingContract.calculateUnclaimedRewards(userAddress);
    return ethers.formatUnits(rewards, 6);
  }

  /**
   * Get staking contract state
   */
  async getStakingState(
    stakingAddress: string,
    chain: Chain
  ): Promise<{
    totalCollateral: string;
    scalingFactor: string;
    lastRebaseTime: number;
    rebaseCooldown: number;
    baseAPY: number;
    paused: boolean;
  }> {
    const provider = this.getProvider(chain);
    const stakingContract = this.getStakingContract(stakingAddress, provider);

    const [totalCollateral, scalingFactor, lastRebaseTime, rebaseCooldown, baseAPY, paused] = await Promise.all([
      stakingContract.totalCollateral(),
      stakingContract.scalingFactor(),
      stakingContract.lastRebaseTime(),
      stakingContract.rebaseCooldown(),
      stakingContract.baseAPY(),
      stakingContract.paused()
    ]);

    return {
      totalCollateral: ethers.formatUnits(totalCollateral, 6),
      scalingFactor: ethers.formatUnits(scalingFactor, 18),
      lastRebaseTime: Number(lastRebaseTime),
      rebaseCooldown: Number(rebaseCooldown),
      baseAPY: Number(baseAPY),
      paused
    };
  }

  /**
   * Get tranche information
   */
  async getTrancheInfo(
    tranche: Tranche,
    stakingAddress: string,
    chain: Chain
  ): Promise<{
    allocation: string;
    lockupPeriod: number;
    dynamicAPY: number;
    rewards: string;
  }> {
    const provider = this.getProvider(chain);
    const stakingContract = this.getStakingContract(stakingAddress, provider);

    const trancheIndex = tranche === Tranche.SuperSenior ? 0 : 1;

    const [allocation, lockupPeriod, dynamicAPY, rewards] = await Promise.all([
      stakingContract.trancheAllocations(trancheIndex),
      stakingContract.lockupPeriods(trancheIndex),
      stakingContract.dynamicAPY(trancheIndex),
      stakingContract.trancheRewards(trancheIndex)
    ]);

    return {
      allocation: ethers.formatUnits(allocation, 6),
      lockupPeriod: Number(lockupPeriod),
      dynamicAPY: Number(dynamicAPY),
      rewards: ethers.formatUnits(rewards, 6)
    };
  }

  // ==================== ADMIN FUNCTIONS ====================

  /**
   * Distribute rewards (admin only)
   */
  async distributeRewards(
    totalYield: string | number,
    stakingAddress: string,
    chain: Chain,
    privateKey?: string,
    walletInstance?: ethers.Wallet
  ): Promise<ethers.TransactionResponse> {
    const wallet = this.getWallet(chain, privateKey, walletInstance);
    const stakingContract = this.getStakingContract(stakingAddress, wallet);

    const yieldWei = ethers.parseUnits(totalYield.toString(), 6);
    return await stakingContract.distributeRewards(yieldWei);
  }

  /**
   * Set dynamic APY for a tranche (admin only)
   */
  async setDynamicAPY(
    tranche: Tranche,
    newAPY: number,
    stakingAddress: string,
    chain: Chain,
    privateKey?: string,
    walletInstance?: ethers.Wallet
  ): Promise<ethers.TransactionResponse> {
    const wallet = this.getWallet(chain, privateKey, walletInstance);
    const stakingContract = this.getStakingContract(stakingAddress, wallet);

    const trancheIndex = tranche === Tranche.SuperSenior ? 0 : 1;
    return await stakingContract.setDynamicAPY(trancheIndex, newAPY);
  }

  /**
   * Set lockup period for a tranche (admin only)
   */
  async setLockupPeriod(
    tranche: Tranche,
    period: number,
    stakingAddress: string,
    chain: Chain,
    privateKey?: string,
    walletInstance?: ethers.Wallet
  ): Promise<ethers.TransactionResponse> {
    const wallet = this.getWallet(chain, privateKey, walletInstance);
    const stakingContract = this.getStakingContract(stakingAddress, wallet);

    const trancheIndex = tranche === Tranche.SuperSenior ? 0 : 1;
    return await stakingContract.setLockupPeriod(trancheIndex, period);
  }

  /**
   * Rebase scaling factor (rebaser role only)
   */
  async rebaseScalingFactor(
    newScalingFactor: string | number,
    totalYield: string | number,
    stakingAddress: string,
    chain: Chain,
    privateKey?: string,
    walletInstance?: ethers.Wallet
  ): Promise<ethers.TransactionResponse> {
    const wallet = this.getWallet(chain, privateKey, walletInstance);
    const stakingContract = this.getStakingContract(stakingAddress, wallet);

    const scalingFactorWei = ethers.parseUnits(newScalingFactor.toString(), 18);
    const yieldWei = ethers.parseUnits(totalYield.toString(), 6);

    return await stakingContract.rebaseScalingFactor(scalingFactorWei, yieldWei);
  }

  /**
   * Pause/unpause the staking contract (admin only)
   */
  async pauseContract(
    stakingAddress: string,
    chain: Chain,
    privateKey?: string,
    walletInstance?: ethers.Wallet
  ): Promise<ethers.TransactionResponse> {
    const wallet = this.getWallet(chain, privateKey, walletInstance);
    const stakingContract = this.getStakingContract(stakingAddress, wallet);

    return await stakingContract.pause();
  }

  async unpauseContract(
    stakingAddress: string,
    chain: Chain,
    privateKey?: string,
    walletInstance?: ethers.Wallet
  ): Promise<ethers.TransactionResponse> {
    const wallet = this.getWallet(chain, privateKey, walletInstance);
    const stakingContract = this.getStakingContract(stakingAddress, wallet);

    return await stakingContract.unpause();
  }

  // ==================== INVESTMENT MANAGEMENT FUNCTIONS ====================

  /**
   * Propose an investment
   */
  async proposeInvestment(
    target: string,
    amount: string | number,
    data: string,
    investmentAddress: string,
    chain: Chain,
    privateKey?: string,
    walletInstance?: ethers.Wallet
  ): Promise<ethers.TransactionResponse> {
    const wallet = this.getWallet(chain, privateKey, walletInstance);
    const investmentContract = this.getInvestmentContract(investmentAddress, wallet);

    const amountWei = ethers.parseUnits(amount.toString(), 6);
    return await investmentContract.proposeInvestment(target, amountWei, data);
  }

  /**
   * Approve an investment proposal
   */
  async approveProposal(
    proposalId: number,
    investmentAddress: string,
    chain: Chain,
    privateKey?: string,
    walletInstance?: ethers.Wallet
  ): Promise<ethers.TransactionResponse> {
    const wallet = this.getWallet(chain, privateKey, walletInstance);
    const investmentContract = this.getInvestmentContract(investmentAddress, wallet);

    return await investmentContract.approveProposal(proposalId);
  }

  /**
   * Execute an approved investment proposal
   */
  async executeProposal(
    proposalId: number,
    investmentAddress: string,
    chain: Chain,
    privateKey?: string,
    walletInstance?: ethers.Wallet
  ): Promise<ethers.TransactionResponse> {
    const wallet = this.getWallet(chain, privateKey, walletInstance);
    const investmentContract = this.getInvestmentContract(investmentAddress, wallet);

    return await investmentContract.executeProposal(proposalId);
  }

  /**
   * Invest in treasury (simple investment)
   */
  async investInTreasury(
    amount: string | number,
    investmentAddress: string,
    chain: Chain,
    privateKey?: string,
    walletInstance?: ethers.Wallet
  ): Promise<ethers.TransactionResponse> {
    const wallet = this.getWallet(chain, privateKey, walletInstance);
    const investmentContract = this.getInvestmentContract(investmentAddress, wallet);

    const amountWei = ethers.parseUnits(amount.toString(), 6);
    return await investmentContract.investInTreasury(amountWei);
  }

  /**
   * Get investment proposal details
   */
  async getProposal(
    proposalId: number,
    investmentAddress: string,
    chain: Chain
  ): Promise<InvestmentProposal> {
    const provider = this.getProvider(chain);
    const investmentContract = this.getInvestmentContract(investmentAddress, provider);

    const proposal = await investmentContract.proposals(proposalId);
    
    return {
      target: proposal.target,
      amount: ethers.formatUnits(proposal.amount, 6),
      data: proposal.data,
      approvals: Number(proposal.approvals),
      executed: proposal.executed,
      proposer: proposal.proposer,
      timestamp: Number(proposal.timestamp),
      expiry: Number(proposal.expiry)
    };
  }

  /**
   * Set target whitelist status (admin only)
   */
  async setTargetWhitelisted(
    target: string,
    status: boolean,
    investmentAddress: string,
    chain: Chain,
    privateKey?: string,
    walletInstance?: ethers.Wallet
  ): Promise<ethers.TransactionResponse> {
    const wallet = this.getWallet(chain, privateKey, walletInstance);
    const investmentContract = this.getInvestmentContract(investmentAddress, wallet);

    return await investmentContract.setTargetWhitelisted(target, status);
  }

  /**
   * Set required approvals (admin only)
   */
  async setRequiredApprovals(
    requiredApprovals: number,
    investmentAddress: string,
    chain: Chain,
    privateKey?: string,
    walletInstance?: ethers.Wallet
  ): Promise<ethers.TransactionResponse> {
    const wallet = this.getWallet(chain, privateKey, walletInstance);
    const investmentContract = this.getInvestmentContract(investmentAddress, wallet);

    return await investmentContract.setRequiredApprovals(requiredApprovals);
  }

  // ==================== TOKEN UTILITY FUNCTIONS ====================

  /**
   * Approve stablecoin spending for staking
   */
  async approveStablecoin(
    spender: string,
    amount: string | number,
    stablecoinAddress: string,
    chain: Chain,
    privateKey?: string,
    walletInstance?: ethers.Wallet
  ): Promise<ethers.TransactionResponse> {
    const wallet = this.getWallet(chain, privateKey, walletInstance);
    const stablecoinContract = this.getERC20Contract(stablecoinAddress, wallet);

    const amountWei = ethers.parseUnits(amount.toString(), 6);
    return await stablecoinContract.approve(spender, amountWei);
  }

  /**
   * Get stablecoin balance
   */
  async getStablecoinBalance(
    userAddress: string,
    stablecoinAddress: string,
    chain: Chain
  ): Promise<string> {
    const provider = this.getProvider(chain);
    const stablecoinContract = this.getERC20Contract(stablecoinAddress, provider);

    const balance = await stablecoinContract.balanceOf(userAddress);
    return ethers.formatUnits(balance, 6);
  }

  /**
   * Get stablecoin allowance
   */
  async getStablecoinAllowance(
    owner: string,
    spender: string,
    stablecoinAddress: string,
    chain: Chain
  ): Promise<string> {
    const provider = this.getProvider(chain);
    const stablecoinContract = this.getERC20Contract(stablecoinAddress, provider);

    const allowance = await stablecoinContract.allowance(owner, spender);
    return ethers.formatUnits(allowance, 6);
  }

  /**
   * Get PST token balance
   */
  async getPSTBalance(
    userAddress: string,
    pstAddress: string,
    chain: Chain
  ): Promise<string> {
    const provider = this.getProvider(chain);
    const pstContract = this.getERC20Contract(pstAddress, provider);

    const balance = await pstContract.balanceOf(userAddress);
    return ethers.formatUnits(balance, 18);
  }

  /**
   * Get PSTJ token balance
   */
  async getPSTJBalance(
    userAddress: string,
    pstjAddress: string,
    chain: Chain
  ): Promise<string> {
    const provider = this.getProvider(chain);
    const pstjContract = this.getERC20Contract(pstjAddress, provider);

    const balance = await pstjContract.balanceOf(userAddress);
        return ethers.formatUnits(balance, 18);
  }
}

export default StakingSDK; 