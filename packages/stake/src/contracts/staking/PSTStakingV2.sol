// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../tokens/PST.sol";
import "../tokens/PSTJ.sol";
import "./PSTInvestment.sol";
import "./PSTLiquidity.sol";

contract PSTStakingV2 is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Roles for access control
    bytes32 public constant REBASER_ROLE = keccak256("REBASER_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    // Token and external contract interfaces
    IERC20 public stablecoin; // USDC for staking and rewards
    PST public pstToken; // PST token for Super Senior positions
    PSTJ public pstjToken; // PSTJ token for Junior positions
    PSTInvestment public investmentManager;
    PSTLiquidity public liquidityManager;
    address public treasury; // Address to receive profits or penalties

    // Core state variables
    uint256 public totalCollateral;
    uint256 public scalingFactor = 1e18;
    uint256 public lastRebaseTime;
    uint256 public rebaseCooldown = 7 days;
    uint256 public constant PRECISION = 1e18;
    uint256 public baseAPY = 10; // Default base APY in percentage

    // Tranche definitions and related mappings
    enum Tranche { SuperSenior, Junior }
    mapping(Tranche => uint256) public trancheAllocations;
    mapping(Tranche => uint256) public lockupPeriods;
    mapping(Tranche => uint256) public dynamicAPY;
    mapping(Tranche => uint256) public trancheRewards;

    // Staking and reward tracking
    struct Stake {
        uint256 amount; // Amount of USDC staked
        Tranche tranche;
        uint256 stakeTimestamp;
        uint256 accruedRewards; // Track unclaimed USDC rewards
    }
    mapping(address => Stake) public stakes;
    address[] public stakers;
    mapping(address => bool) public isStaker;

    // Events
    event Staked(address indexed user, uint256 amount, Tranche tranche);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardsDistributed(uint256 totalYield, uint256 superSeniorReturn, uint256 juniorReturn);
    event RewardClaimed(address indexed user, uint256 amount);
    event APYUpdated(Tranche tranche, uint256 newAPY);
    event Rebasing(uint256 newScalingFactor, uint256 totalYield);
    event RewardSent(address indexed user, uint256 amount);
    event RebaseCooldownUpdated(uint256 newCooldown);
    event LockupPeriodUpdated(Tranche tranche, uint256 period);
    event RewardsAccrued(address indexed user, uint256 amount);
    event InvestmentProposed(address indexed user, uint256 amount, address target);
    event PSTMinted(address indexed user, uint256 amount);
    event PSTBurned(address indexed user, uint256 amount);
    event PSTJMinted(address indexed user, uint256 amount);
    event PSTJBurned(address indexed user, uint256 amount);

    /**
     * @notice Constructor to initialize the contract with necessary addresses and roles.
     * @param _stablecoin Address of the stablecoin (e.g., USDC).
     * @param _pstToken Address of the PST token contract.
     * @param _pstjToken Address of the PSTJ token contract.
     * @param _investmentManager Address of the PSTInvestment contract.
     * @param _liquidityManager Address of the PSTLiquidity contract.
     * @param _treasury Address to receive profits or penalties.
     */
    constructor(
        address _stablecoin,
        address _pstToken,
        address _pstjToken,
        address _investmentManager,
        address _liquidityManager,
        address _treasury
    ) {
        require(_stablecoin != address(0), "Stablecoin address cannot be zero");
        require(_pstToken != address(0), "PST token address cannot be zero");
        require(_pstjToken != address(0), "PSTJ token address cannot be zero");
        require(_investmentManager != address(0), "Investment manager address cannot be zero");
        require(_liquidityManager != address(0), "Liquidity manager address cannot be zero");
        require(_treasury != address(0), "Treasury address cannot be zero");

        stablecoin = IERC20(_stablecoin);
        pstToken = PST(_pstToken);
        pstjToken = PSTJ(_pstjToken);
        investmentManager = PSTInvestment(_investmentManager);
        liquidityManager = PSTLiquidity(_liquidityManager);
        treasury = _treasury;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REBASER_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);

        lockupPeriods[Tranche.SuperSenior] = 10 seconds;
        lockupPeriods[Tranche.Junior] = 10 seconds;
        dynamicAPY[Tranche.SuperSenior] = 11; // Fixed at 11%
        dynamicAPY[Tranche.Junior] = 5; // Adjustable
    }

    /**
     * @notice Stakes USDC directly into a specific tranche and mints corresponding tokens.
     * @param amount The amount of USDC to stake.
     * @param tranche The tranche in which to stake.
     */
    function stake(uint256 amount, Tranche tranche) external whenNotPaused nonReentrant {
        require(amount > 0, "Cannot stake 0");
        require(stablecoin.allowance(msg.sender, address(this)) >= amount, "Insufficient allowance");

        // Transfer USDC directly
        SafeERC20.safeTransferFrom(stablecoin, msg.sender, address(this), amount);

        if (!isStaker[msg.sender]) {
            stakers.push(msg.sender);
            isStaker[msg.sender] = true;
        }

        Stake storage userStake = stakes[msg.sender];
        if (userStake.amount == 0) {
            stakes[msg.sender] = Stake({
                amount: amount,
                tranche: tranche,
                stakeTimestamp: block.timestamp,
                accruedRewards: 0
            });
        } else {
            userStake.amount += amount;
            userStake.tranche = tranche;
            userStake.stakeTimestamp = block.timestamp;
        }

        trancheAllocations[tranche] += amount;
        totalCollateral += amount;

        // Mint corresponding tokens based on tranche
        if (tranche == Tranche.SuperSenior) {
            pstToken.mint(msg.sender, amount, 0); // 0 for Super Senior
            emit PSTMinted(msg.sender, amount);
        } else if (tranche == Tranche.Junior) {
            pstjToken.mint(msg.sender, amount, 1); // 1 for Junior
            emit PSTJMinted(msg.sender, amount);
        }

        emit Staked(msg.sender, amount, tranche);
    }

    /**
     * @notice Withdraws staked USDC from the contract and burns corresponding tokens.
     * @param amount The amount of USDC to withdraw.
     */
    function withdraw(uint256 amount) external whenNotPaused nonReentrant {
        Stake storage userStake = stakes[msg.sender];
        require(userStake.amount >= amount, "Insufficient staked amount");
        require(
            block.timestamp >= userStake.stakeTimestamp + lockupPeriods[userStake.tranche],
            "Lockup period active"
        );

        uint256 penalty = calculatePenalty(userStake.tranche, block.timestamp - userStake.stakeTimestamp);
        uint256 amountToWithdraw = amount - penalty;

        userStake.amount -= amount;
        trancheAllocations[userStake.tranche] -= amount;
        totalCollateral -= amount;

        // Burn corresponding tokens based on tranche
        if (userStake.tranche == Tranche.SuperSenior) {
            pstToken.burn(msg.sender, amount, 0); // 0 for Super Senior
            emit PSTBurned(msg.sender, amount);
        } else if (userStake.tranche == Tranche.Junior) {
            pstjToken.burn(msg.sender, amount, 1); // 1 for Junior
            emit PSTJBurned(msg.sender, amount);
        }

        if (penalty > 0) {
            SafeERC20.safeTransfer(stablecoin, treasury, penalty);
        }

        SafeERC20.safeTransfer(stablecoin, msg.sender, amountToWithdraw);

        if (userStake.amount == 0) {
            removeStaker(msg.sender);
            delete stakes[msg.sender];
        }

        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @notice Proposes to send staked USDC to a specified investment target via PSTInvestment.
     * @param amount The amount of USDC to invest.
     * @param target The target address for the investment (must be whitelisted in PSTInvestment).
     * @param data Optional calldata for the investment (e.g., function call on target).
     * @return proposalId The ID of the proposed investment.
     */
    function proposeInvestment(uint256 amount, address target, bytes calldata data)
        external
        whenNotPaused
        nonReentrant
        onlyRole(DEFAULT_ADMIN_ROLE)
        returns (uint256 proposalId)
    {
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= totalCollateral, "Insufficient collateral");
        require(target != address(0), "Invalid target address");

        // Approve PSTInvestment to spend USDC
        stablecoin.approve(address(investmentManager), amount);

        // Propose investment via PSTInvestment
        proposalId = investmentManager.proposeInvestment(target, amount, data);

        emit InvestmentProposed(msg.sender, amount, target);
        return proposalId;
    }

    /**
     * @notice Rebases the scaling factor to distribute profits, accrues rewards, and updates APY.
     */
    function rebase() external onlyRole(REBASER_ROLE) whenNotPaused nonReentrant {
        require(totalCollateral > 0, "No collateral to rebase");
        require(block.timestamp >= lastRebaseTime + rebaseCooldown, "Rebase cooldown active");

        uint256 totalYield = calculateTotalYield();
        require(totalYield > 0, "No yield available for rebase");

        // Safer scaling factor calculation
        uint256 newScalingFactor;
        if (totalCollateral + totalYield <= type(uint256).max / scalingFactor) {
            newScalingFactor = (scalingFactor * (totalCollateral + totalYield)) / totalCollateral;
        } else {
            newScalingFactor = scalingFactor + ((totalYield * scalingFactor) / totalCollateral);
            uint256 remainder = (totalYield * scalingFactor) % totalCollateral;
            if (remainder > 0) {
                newScalingFactor += (remainder * scalingFactor) / totalCollateral;
            }
        }
        require(newScalingFactor >= scalingFactor, "Scaling factor overflow");

        // Update state
        scalingFactor = newScalingFactor;
        totalCollateral += totalYield;
        lastRebaseTime = block.timestamp;

        // Update APY and accrue rewards
        updateDynamicAPY(totalYield);
        accrueRewards(totalYield);

        emit Rebasing(newScalingFactor, totalYield);
    }

    /**
     * @notice Transfers funds to the investment manager
     * @param amount The amount to transfer
     */
    function transferToInvestment(uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(amount <= totalCollateral, "Cannot transfer more than collateral");
        stablecoin.approve(address(investmentManager), amount);
    }

    /**
     * @notice Transfers funds to the liquidity manager
     * @param amount The amount to transfer
     */
    function transferToLiquidity(uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(amount <= totalCollateral, "Cannot transfer more than collateral");
        stablecoin.approve(address(liquidityManager), amount);
    }

    /**
     * @notice Calculates the penalty for early withdrawal.
     * @param tranche The tranche of the stake.
     * @param stakedDuration The duration the funds have been staked.
     * @return The penalty amount.
     */
    function calculatePenalty(Tranche tranche, uint256 stakedDuration) public view returns (uint256) {
        uint256 lockup = lockupPeriods[tranche];
        if (stakedDuration >= lockup) return 0;

        uint256 penaltyRate = ((lockup - stakedDuration) * 1e18) / lockup;
        return (stakes[msg.sender].amount * penaltyRate) / 1e18;
    }

    /**
     * @notice Calculates the total yield based on dynamic APY.
     * @return The total yield.
     */
    function calculateTotalYield() public view returns (uint256) {
        uint256 superSeniorYield = (trancheAllocations[Tranche.SuperSenior] * dynamicAPY[Tranche.SuperSenior]) / 100;
        uint256 juniorYield = (trancheAllocations[Tranche.Junior] * dynamicAPY[Tranche.Junior]) / 100;
        return superSeniorYield + juniorYield;
    }

    /**
     * @notice Retrieves stake details for a user.
     * @param user The address of the user.
     * @return amount The staked amount, stakeTimestamp The timestamp of the stake.
     */
    function getStake(address user, Tranche) external view returns (uint256, uint256) {
        Stake memory s = stakes[user];
        return (s.amount, s.stakeTimestamp);
    }

    /**
     * @notice Allows users to claim accrued USDC rewards.
     */
    function claimRewards() external whenNotPaused nonReentrant {
        Stake storage userStake = stakes[msg.sender];
        uint256 reward = userStake.accruedRewards;
        require(reward > 0, "No rewards to claim");

        userStake.accruedRewards = 0;
        stablecoin.safeTransfer(msg.sender, reward);

        emit RewardSent(msg.sender, reward);
    }

    /**
     * @notice Internal function to accrue USDC rewards instead of transferring.
     * @param totalYield The total yield to distribute.
     */
    function accrueRewards(uint256 totalYield) internal {
        uint256 dailyTotalYield = totalYield / 365;

        uint256 superSeniorDailyReturn = (trancheAllocations[Tranche.SuperSenior] * dynamicAPY[Tranche.SuperSenior]) /
            (100 * 365);
        require(dailyTotalYield >= superSeniorDailyReturn, "Insufficient yield for guarantees");

        uint256 juniorDailyReturn = dailyTotalYield - superSeniorDailyReturn;

        for (uint256 i = 0; i < stakers.length; i++) {
            address staker = stakers[i];
            Stake storage userStake = stakes[staker];

            if (userStake.amount > 0) {
                if (userStake.tranche == Tranche.SuperSenior && trancheAllocations[Tranche.SuperSenior] > 0) {
                    uint256 reward = (userStake.amount * superSeniorDailyReturn) /
                        trancheAllocations[Tranche.SuperSenior];
                    userStake.accruedRewards += reward;
                    emit RewardsAccrued(staker, reward);
                } else if (userStake.tranche == Tranche.Junior && trancheAllocations[Tranche.Junior] > 0) {
                    uint256 reward = (userStake.amount * juniorDailyReturn) / trancheAllocations[Tranche.Junior];
                    userStake.accruedRewards += reward;
                    emit RewardsAccrued(staker, reward);
                }
            }
        }

        emit RewardsDistributed(totalYield, superSeniorDailyReturn, juniorDailyReturn);
    }

    /**
     * @notice Internal function to update dynamic APY based on yield.
     * @param totalYield The total yield generated.
     */
    function updateDynamicAPY(uint256 totalYield) internal {
        uint256 yieldRatio = (totalYield * 1e18) / totalCollateral;

        uint256 newJuniorAPY = dynamicAPY[Tranche.Junior];

        if (yieldRatio > 1e18) {
            newJuniorAPY += ((yieldRatio - 1e18) * baseAPY) / 1e18;
        } else if (yieldRatio < 1e18) {
            newJuniorAPY -= ((1e18 - yieldRatio) * baseAPY) / (1e18 * 10);
        }

        if (newJuniorAPY < 2) {
            newJuniorAPY = 2;
        } else if (newJuniorAPY > 100) {
            newJuniorAPY = 100;
        }

        if (newJuniorAPY != dynamicAPY[Tranche.Junior]) {
            dynamicAPY[Tranche.Junior] = newJuniorAPY;
            emit APYUpdated(Tranche.Junior, newJuniorAPY);
        }
    }

    /**
     * @notice Removes a staker from the stakers array.
     * @param staker The address of the staker to remove.
     */
    function removeStaker(address staker) internal {
        if (!isStaker[staker]) return;

        for (uint256 i = 0; i < stakers.length; i++) {
            if (stakers[i] == staker) {
                if (i != stakers.length - 1) {
                    stakers[i] = stakers[stakers.length - 1];
                }
                stakers.pop();
                isStaker[staker] = false;
                break;
            }
        }
    }

    /**
     * @notice Sets the lockup period for a specific tranche.
     * @param tranche The tranche to update.
     * @param period The new lockup period in seconds.
     */
    function setLockupPeriod(Tranche tranche, uint256 period) external onlyRole(DEFAULT_ADMIN_ROLE) {
        lockupPeriods[tranche] = period;
        emit LockupPeriodUpdated(tranche, period);
    }

    /**
     * @notice Sets the rebase cooldown period.
     * @param newCooldown The new cooldown period in seconds.
     */
    function setRebaseCooldown(uint256 newCooldown) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newCooldown > 0, "Cooldown must be greater than 0");
        rebaseCooldown = newCooldown;
        emit RebaseCooldownUpdated(newCooldown);
    }

    /**
     * @notice Sets the Junior tranche APY.
     * @param newAPY The new APY value.
     */
    function setJuniorAPY(uint256 newAPY) external onlyRole(REBASER_ROLE) {
        require(newAPY >= 2 && newAPY <= 100, "APY out of bounds");
        dynamicAPY[Tranche.Junior] = newAPY;
        emit APYUpdated(Tranche.Junior, newAPY);
    }

    /**
     * @notice Pauses the contract in emergencies.
     */
    function pause() external onlyRole(EMERGENCY_ROLE) {
        _pause();
    }

    /**
     * @notice Unpauses the contract.
     */
    function unpause() external onlyRole(EMERGENCY_ROLE) {
        _unpause();
    }

    /**
     * @notice Returns the timestamp of the last rebase.
     * @return The last rebase timestamp.
     */
    function getLastRebaseTime() external view returns (uint256) {
        return lastRebaseTime;
    }

    /**
     * @notice Get user's PST balance (Super Senior staking position)
     * @param user The user address
     * @return The PST balance
     */
    function getPSTBalance(address user) external view returns (uint256) {
        return pstToken.balanceOf(user);
    }

    /**
     * @notice Get user's PSTJ balance (Junior staking position)
     * @param user The user address
     * @return The PSTJ balance
     */
    function getPSTJBalance(address user) external view returns (uint256) {
        return pstjToken.balanceOf(user);
    }
} 