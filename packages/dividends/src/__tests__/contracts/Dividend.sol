// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title Dividend
 * @dev A contract for distributing ERC20 tokens as dividends to multiple recipients
 *      Supports batch transfers for gas efficiency when dealing with large recipient lists
 *      Includes emergency functions, fee collection, and comprehensive event logging
 */
contract Dividend is
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20 for IERC20;

    // Events
    event DividendDistributed(
        uint256 dividendId,
        address indexed token,
        string dividendName,
        uint256 totalAmount,
        uint256 feeAmount,
        uint256 netAmount,
        uint256 recipientCount,
        uint256 timestamp
    );

    event BatchTransferCompleted(
        address indexed token,
        uint256 batchIndex,
        uint256 recipientsInBatch,
        uint256 amountPerBatch
    );

    event EmergencyWithdrawal(
        address indexed token,
        address indexed to,
        uint256 amount
    );

    event FeeCollected(
        uint256 dividendId,
        address indexed token,
        address indexed feeAddress,
        uint256 feeAmount,
        uint256 feePercentage
    );

    event FeeAddressUpdated(
        address indexed oldFeeAddress,
        address indexed newFeeAddress
    );

    event FeePercentageUpdated(
        uint256 oldFeePercentage,
        uint256 newFeePercentage
    );

    // Structs
    struct DividendInfo {
        string name;
        address token;
        uint256 totalAmount;
        uint256 feeAmount;
        uint256 netAmount;
        uint256 recipientCount;
        uint256 timestamp;
        bool completed;
    }

    // State variables
    mapping(uint256 => DividendInfo) public dividendHistory;
    uint256 public dividendCounter;
    uint256 public maxBatchSize;

    // Fee-related state variables
    uint256 public feePercentage; // Fee percentage in basis points (10000 = 100%)
    address public feeAddress; // Address to receive fees

    /**
     * @dev Initializes the dividend contract
     * @param _maxBatchSize Maximum number of recipients per batch (recommended: 100-200)
     * @param _feePercentage Initial fee percentage in basis points (e.g., 250 = 2.5%)
     * @param _feeAddress Initial address to receive fees
     */
    function initialize(
        uint256 _maxBatchSize,
        uint256 _feePercentage,
        address _feeAddress
    ) public initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();

        require(_maxBatchSize > 0, "Batch size must be greater than 0");
        require(_feePercentage <= 10000, "Fee percentage cannot exceed 100%");
        require(_feeAddress != address(0), "Invalid fee address");

        maxBatchSize = _maxBatchSize;
        feePercentage = _feePercentage;
        feeAddress = _feeAddress;
        dividendCounter = 0;
    }

    /**
     * @dev Calculates the fee amount based on total amount and fee percentage
     * @param totalAmount The total amount to calculate fee from
     * @return The calculated fee amount
     */
    function calculateFee(uint256 totalAmount) public view returns (uint256) {
        return (totalAmount * feePercentage) / 10000;
    }

    /**
     * @dev Distributes tokens to multiple recipients in batches with fee deduction
     * @param name Name of the dividend (e.g., "Quarter 1 dividend")
     * @param token Address of the ERC20 token to distribute
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts corresponding to each recipient
     */
    function distributeDividend(
        string memory name,
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyOwner nonReentrant {
        require(bytes(name).length > 0, "Dividend name required");
        require(token != address(0), "Invalid token address");
        require(recipients.length == amounts.length, "Arrays length mismatch");
        require(recipients.length > 0, "No recipients provided");

        IERC20 tokenContract = IERC20(token);

        // Calculate total dividend amount and fee in a single scope
        uint256 totalDividendAmount;
        uint256 feeAmount;
        uint256 totalAmountNeeded;
        {
            // Calculate total dividend amount needed
            for (uint256 i = 0; i < amounts.length; i++) {
                totalDividendAmount += amounts[i];
            }

            // Calculate fee and total amount needed
            feeAmount = calculateFee(totalDividendAmount);
            totalAmountNeeded = totalDividendAmount + feeAmount;
        }

        require(
            tokenContract.balanceOf(address(this)) >= totalAmountNeeded,
            "Insufficient token balance"
        );

        // Store dividend info and transfer fee in a single scope
        uint256 currentDividendId;
        {
            currentDividendId = dividendCounter++;
            dividendHistory[currentDividendId] = DividendInfo({
                name: name,
                token: token,
                totalAmount: totalAmountNeeded,
                feeAmount: feeAmount,
                netAmount: totalDividendAmount,
                recipientCount: recipients.length,
                timestamp: block.timestamp,
                completed: false
            });

            // Transfer fee to fee address if fee amount > 0
            if (feeAmount > 0) {
                tokenContract.safeTransfer(feeAddress, feeAmount);
                emit FeeCollected(
                    currentDividendId,
                    token,
                    feeAddress,
                    feeAmount,
                    feePercentage
                );
            }
        }

        // Process transfers in batches
        {
            uint256 batchCount = (recipients.length + maxBatchSize - 1) /
                maxBatchSize;

            for (
                uint256 batchIndex = 0;
                batchIndex < batchCount;
                batchIndex++
            ) {
                uint256 startIndex = batchIndex * maxBatchSize;
                uint256 endIndex = startIndex + maxBatchSize;
                if (endIndex > recipients.length) {
                    endIndex = recipients.length;
                }

                uint256 batchAmount = 0;

                // Execute transfers for this batch
                for (uint256 i = startIndex; i < endIndex; i++) {
                    require(
                        recipients[i] != address(0),
                        "Invalid recipient address"
                    );
                    require(amounts[i] > 0, "Amount must be greater than 0");

                    tokenContract.safeTransfer(recipients[i], amounts[i]);
                    batchAmount += amounts[i];
                }

                emit BatchTransferCompleted(
                    token,
                    batchIndex,
                    endIndex - startIndex,
                    batchAmount
                );
            }
        }

        // Mark dividend as completed
        dividendHistory[currentDividendId].completed = true;

        emit DividendDistributed(
            currentDividendId,
            token,
            name,
            totalAmountNeeded,
            feeAmount,
            totalDividendAmount,
            recipients.length,
            block.timestamp
        );
    }

    /**
     * @dev Distributes equal amounts to all recipients with fee deduction
     * @param name Name of the dividend (e.g., "Quarter 1 dividend")
     * @param token Address of the ERC20 token to distribute
     * @param recipients Array of recipient addresses
     * @param amountPerRecipient Amount to send to each recipient
     */
    function distributeEqualDividend(
        string memory name,
        address token,
        address[] calldata recipients,
        uint256 amountPerRecipient
    ) external onlyOwner nonReentrant {
        require(bytes(name).length > 0, "Dividend name required");
        require(token != address(0), "Invalid token address");
        require(recipients.length > 0, "No recipients provided");
        require(amountPerRecipient > 0, "Amount must be greater than 0");

        IERC20 tokenContract = IERC20(token);

        // Calculate amounts in a single scope
        uint256 totalDividendAmount;
        uint256 feeAmount;
        uint256 totalAmountNeeded;
        {
            totalDividendAmount = recipients.length * amountPerRecipient;
            feeAmount = calculateFee(totalDividendAmount);
            totalAmountNeeded = totalDividendAmount + feeAmount;
        }

        require(
            tokenContract.balanceOf(address(this)) >= totalAmountNeeded,
            "Insufficient token balance"
        );

        // Store dividend info and transfer fee in a single scope
        uint256 currentDividendId;
        {
            currentDividendId = dividendCounter++;
            dividendHistory[currentDividendId] = DividendInfo({
                name: name,
                token: token,
                totalAmount: totalAmountNeeded,
                feeAmount: feeAmount,
                netAmount: totalDividendAmount,
                recipientCount: recipients.length,
                timestamp: block.timestamp,
                completed: false
            });

            // Transfer fee to fee address if fee amount > 0
            if (feeAmount > 0) {
                tokenContract.safeTransfer(feeAddress, feeAmount);
                emit FeeCollected(
                    currentDividendId,
                    token,
                    feeAddress,
                    feeAmount,
                    feePercentage
                );
            }
        }

        // Process transfers in batches
        {
            uint256 batchCount = (recipients.length + maxBatchSize - 1) /
                maxBatchSize;

            for (
                uint256 batchIndex = 0;
                batchIndex < batchCount;
                batchIndex++
            ) {
                uint256 startIndex = batchIndex * maxBatchSize;
                uint256 endIndex = startIndex + maxBatchSize;
                if (endIndex > recipients.length) {
                    endIndex = recipients.length;
                }

                // Execute transfers for this batch
                for (uint256 i = startIndex; i < endIndex; i++) {
                    require(
                        recipients[i] != address(0),
                        "Invalid recipient address"
                    );

                    tokenContract.safeTransfer(
                        recipients[i],
                        amountPerRecipient
                    );
                }

                emit BatchTransferCompleted(
                    token,
                    batchIndex,
                    endIndex - startIndex,
                    (endIndex - startIndex) * amountPerRecipient
                );
            }
        }

        // Mark dividend as completed
        dividendHistory[currentDividendId].completed = true;

        emit DividendDistributed(
            currentDividendId,
            token,
            name,
            totalAmountNeeded,
            feeAmount,
            totalDividendAmount,
            recipients.length,
            block.timestamp
        );
    }

    /**
     * @dev Updates the fee percentage
     * @param _feePercentage New fee percentage in basis points (e.g., 250 = 2.5%)
     */
    function setFeePercentage(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 10000, "Fee percentage cannot exceed 100%");

        uint256 oldFeePercentage = feePercentage;
        feePercentage = _feePercentage;

        emit FeePercentageUpdated(oldFeePercentage, _feePercentage);
    }

    /**
     * @dev Updates the fee address
     * @param _feeAddress New address to receive fees
     */
    function setFeeAddress(address _feeAddress) external onlyOwner {
        require(_feeAddress != address(0), "Invalid fee address");

        address oldFeeAddress = feeAddress;
        feeAddress = _feeAddress;

        emit FeeAddressUpdated(oldFeeAddress, _feeAddress);
    }

    /**
     * @dev Updates the maximum batch size for gas optimization
     * @param _maxBatchSize New maximum batch size
     */
    function setMaxBatchSize(uint256 _maxBatchSize) external onlyOwner {
        require(_maxBatchSize > 0, "Batch size must be greater than 0");
        maxBatchSize = _maxBatchSize;
    }

    /**
     * @dev Emergency function to withdraw tokens from the contract
     * @param token Address of the token to withdraw
     * @param to Address to send the tokens to
     * @param amount Amount of tokens to withdraw
     */
    function emergencyWithdraw(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(to != address(0), "Invalid recipient address");
        require(amount > 0, "Amount must be greater than 0");

        IERC20 tokenContract = IERC20(token);
        require(
            tokenContract.balanceOf(address(this)) >= amount,
            "Insufficient token balance"
        );

        tokenContract.safeTransfer(to, amount);

        emit EmergencyWithdrawal(token, to, amount);
    }

    /**
     * @dev Gets the balance of a specific token in the contract
     * @param token Address of the token
     * @return Token balance
     */
    function getTokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    /**
     * @dev Gets dividend information by ID
     * @param dividendId ID of the dividend
     * @return Dividend information
     */
    function getDividendInfo(
        uint256 dividendId
    ) external view returns (DividendInfo memory) {
        return dividendHistory[dividendId];
    }

    /**
     * @dev Gets current fee configuration
     * @return feePercentage Current fee percentage in basis points
     * @return feeAddress Current fee address
     */
    function getFeeConfiguration() external view returns (uint256, address) {
        return (feePercentage, feeAddress);
    }

    /**
     * @dev Required by UUPSUpgradeable
     */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
