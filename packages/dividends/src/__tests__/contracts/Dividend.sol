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
 *      Includes emergency functions and comprehensive event logging
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

    // Structs
    struct DividendInfo {
        string name;
        address token;
        uint256 totalAmount;
        uint256 recipientCount;
        uint256 timestamp;
        bool completed;
    }

    // State variables
    mapping(uint256 => DividendInfo) public dividendHistory;
    uint256 public dividendCounter;
    uint256 public maxBatchSize;

    // Mapping to track if an address has received a specific dividend
    mapping(uint256 => mapping(address => bool)) public hasReceivedDividend;

    /**
     * @dev Initializes the dividend contract
     * @param _maxBatchSize Maximum number of recipients per batch (recommended: 100-200)
     */
    function initialize(uint256 _maxBatchSize) public initializer {
        __Ownable_init(msg.sender);
        // __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        maxBatchSize = _maxBatchSize;
        dividendCounter = 0;
    }

    /**
     * @dev Distributes tokens to multiple recipients in batches
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
        uint256 totalAmount = 0;

        // Calculate total amount needed
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }

        require(
            tokenContract.balanceOf(address(this)) >= totalAmount,
            "Insufficient token balance"
        );

        // Store dividend info
        uint256 currentDividendId = dividendCounter++;
        dividendHistory[currentDividendId] = DividendInfo({
            name: name,
            token: token,
            totalAmount: totalAmount,
            recipientCount: recipients.length,
            timestamp: block.timestamp,
            completed: false
        });

        // Process transfers in batches
        uint256 batchCount = (recipients.length + maxBatchSize - 1) /
            maxBatchSize;

        for (uint256 batchIndex = 0; batchIndex < batchCount; batchIndex++) {
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
                require(
                    !hasReceivedDividend[currentDividendId][recipients[i]],
                    "Recipient already received dividend"
                );

                tokenContract.safeTransfer(recipients[i], amounts[i]);
                hasReceivedDividend[currentDividendId][recipients[i]] = true;
                batchAmount += amounts[i];
            }

            emit BatchTransferCompleted(
                token,
                batchIndex,
                endIndex - startIndex,
                batchAmount
            );
        }

        // Mark dividend as completed
        dividendHistory[currentDividendId].completed = true;

        emit DividendDistributed(
            currentDividendId,
            token,
            name,
            totalAmount,
            recipients.length,
            block.timestamp
        );
    }

    /**
     * @dev Distributes equal amounts to all recipients
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
        uint256 totalAmount = recipients.length * amountPerRecipient;

        require(
            tokenContract.balanceOf(address(this)) >= totalAmount,
            "Insufficient token balance"
        );

        // Store dividend info
        uint256 currentDividendId = dividendCounter++;
        dividendHistory[currentDividendId] = DividendInfo({
            name: name,
            token: token,
            totalAmount: totalAmount,
            recipientCount: recipients.length,
            timestamp: block.timestamp,
            completed: false
        });

        // Process transfers in batches
        uint256 batchCount = (recipients.length + maxBatchSize - 1) /
            maxBatchSize;

        for (uint256 batchIndex = 0; batchIndex < batchCount; batchIndex++) {
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
                require(
                    !hasReceivedDividend[currentDividendId][recipients[i]],
                    "Recipient already received dividend"
                );

                tokenContract.safeTransfer(recipients[i], amountPerRecipient);
                hasReceivedDividend[currentDividendId][recipients[i]] = true;
            }

            emit BatchTransferCompleted(
                token,
                batchIndex,
                endIndex - startIndex,
                (endIndex - startIndex) * amountPerRecipient
            );
        }

        // Mark dividend as completed
        dividendHistory[currentDividendId].completed = true;

        emit DividendDistributed(
            currentDividendId,
            token,
            name,
            totalAmount,
            recipients.length,
            block.timestamp
        );
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
     * @dev Checks if a recipient has received a specific dividend
     * @param dividendId ID of the dividend
     * @param recipient Address of the recipient
     * @return True if recipient has received the dividend
     */
    function hasReceivedDividendById(
        uint256 dividendId,
        address recipient
    ) external view returns (bool) {
        return hasReceivedDividend[dividendId][recipient];
    }

    /**
     * @dev Required by UUPSUpgradeable
     */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
