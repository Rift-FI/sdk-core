// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./Dividend.sol";

/**
 * @title DividendFactory
 * @dev Factory contract for creating upgradeable dividend contracts by token address
 *      Supports fee configuration for all dividend contracts created through this factory
 */
contract DividendFactory is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    // Events
    event DividendCreated(
        address indexed tokenAddress,
        address indexed dividendContract,
        string merchantName,
        address indexed admin,
        uint256 batchSize,
        uint256 feePercentage,
        address feeAddress
    );

    event BatchSizeUpdated(uint256 oldBatchSize, uint256 newBatchSize);

    event FeeConfigurationUpdated(
        uint256 oldFeePercentage,
        uint256 newFeePercentage,
        address oldFeeAddress,
        address newFeeAddress
    );

    // State variables
    address public dividendImplementation;
    uint256 public batchSize; // Contract-controlled batch size
    uint256 public defaultFeePercentage; // Default fee percentage for new dividend contracts
    address public defaultFeeAddress; // Default fee address for new dividend contracts
    mapping(address => address) public tokenToDividend; // token address -> dividend contract

    /**
     * @dev Initializes the factory with dividend implementation and fee configuration
     * @param _dividendImplementation Address of the Dividend implementation contract
     * @param _defaultFeePercentage Default fee percentage in basis points (e.g., 250 = 2.5%)
     * @param _defaultFeeAddress Default address to receive fees
     */
    function initialize(
        address _dividendImplementation,
        uint256 _defaultFeePercentage,
        address _defaultFeeAddress
    ) public initializer {
        require(
            _dividendImplementation != address(0),
            "Invalid implementation"
        );
        require(
            _defaultFeePercentage <= 10000,
            "Fee percentage cannot exceed 100%"
        );
        require(_defaultFeeAddress != address(0), "Invalid fee address");

        __Ownable_init(msg.sender);

        dividendImplementation = _dividendImplementation;
        batchSize = 100; // Production default: works well across all networks
        defaultFeePercentage = _defaultFeePercentage;
        defaultFeeAddress = _defaultFeeAddress;
    }

    /**
     * @dev Creates a new upgradeable dividend contract for a token with default fee configuration
     * @param tokenAddress Address of the token for dividend distribution
     * @param merchantName Name of the merchant for identification
     * @param admin Address that will own the dividend contract
     * @return dividendContract Address of the created dividend contract
     */
    function create(
        address tokenAddress,
        string memory merchantName,
        address admin
    ) external returns (address dividendContract) {
        return
            createWithFeeConfig(
                tokenAddress,
                merchantName,
                admin,
                defaultFeePercentage,
                defaultFeeAddress
            );
    }

    /**
     * @dev Creates a new upgradeable dividend contract for a token with custom fee configuration
     * @param tokenAddress Address of the token for dividend distribution
     * @param merchantName Name of the merchant for identification
     * @param admin Address that will own the dividend contract
     * @param feePercentage Fee percentage in basis points for this dividend contract
     * @param feeAddress Fee address for this dividend contract
     * @return dividendContract Address of the created dividend contract
     */
    function createWithFeeConfig(
        address tokenAddress,
        string memory merchantName,
        address admin,
        uint256 feePercentage,
        address feeAddress
    ) public returns (address dividendContract) {
        require(tokenAddress != address(0), "Invalid token address");
        require(admin != address(0), "Invalid admin address");
        require(bytes(merchantName).length > 0, "Merchant name required");
        require(feePercentage <= 10000, "Fee percentage cannot exceed 100%");
        require(feeAddress != address(0), "Invalid fee address");
        require(
            tokenToDividend[tokenAddress] == address(0),
            "Dividend already exists for token"
        );

        // Create UUPS proxy with initialization data including fee configuration
        bytes memory initData = abi.encodeWithSelector(
            Dividend.initialize.selector,
            batchSize,
            feePercentage,
            feeAddress
        );

        dividendContract = address(
            new ERC1967Proxy(dividendImplementation, initData)
        );

        // Transfer ownership to admin
        Dividend(dividendContract).transferOwnership(admin);

        // Store mapping
        tokenToDividend[tokenAddress] = dividendContract;

        emit DividendCreated(
            tokenAddress,
            dividendContract,
            merchantName,
            admin,
            batchSize,
            feePercentage,
            feeAddress
        );

        return dividendContract;
    }

    /**
     * @dev Gets dividend contract address by token address
     * @param tokenAddress Address of the token
     * @return Address of the dividend contract (zero if not found)
     */
    function getDividendByToken(
        address tokenAddress
    ) external view returns (address) {
        return tokenToDividend[tokenAddress];
    }

    /**
     * @dev Updates the dividend implementation (admin only)
     * @param newImplementation Address of the new implementation
     */
    function updateDividendImplementation(
        address newImplementation
    ) external onlyOwner {
        require(newImplementation != address(0), "Invalid implementation");
        dividendImplementation = newImplementation;
    }

    /**
     * @dev Updates the batch size for new dividend contracts (admin only)
     * @param newBatchSize New batch size (affects only new contracts)
     *
     * Recommended batch sizes:
     * - Ethereum: 50-100 (high gas cost)
     * - Polygon/BSC: 150-200 (medium gas cost)
     * - Layer 2: 200-300 (low gas cost)
     */
    function updateBatchSize(uint256 newBatchSize) external onlyOwner {
        require(newBatchSize > 0, "Invalid batch size");
        require(newBatchSize <= 500, "Batch size too large");

        uint256 oldBatchSize = batchSize;
        batchSize = newBatchSize;

        emit BatchSizeUpdated(oldBatchSize, newBatchSize);
    }

    /**
     * @dev Updates the default fee configuration for new dividend contracts (admin only)
     * @param newFeePercentage New default fee percentage in basis points
     * @param newFeeAddress New default fee address
     */
    function updateDefaultFeeConfiguration(
        uint256 newFeePercentage,
        address newFeeAddress
    ) external onlyOwner {
        require(newFeePercentage <= 10000, "Fee percentage cannot exceed 100%");
        require(newFeeAddress != address(0), "Invalid fee address");

        uint256 oldFeePercentage = defaultFeePercentage;
        address oldFeeAddress = defaultFeeAddress;

        defaultFeePercentage = newFeePercentage;
        defaultFeeAddress = newFeeAddress;

        emit FeeConfigurationUpdated(
            oldFeePercentage,
            newFeePercentage,
            oldFeeAddress,
            newFeeAddress
        );
    }

    /**
     * @dev Gets the current default fee configuration
     * @return feePercentage Current default fee percentage in basis points
     * @return feeAddress Current default fee address
     */
    function getDefaultFeeConfiguration()
        external
        view
        returns (uint256, address)
    {
        return (defaultFeePercentage, defaultFeeAddress);
    }

    /**
     * @dev Required by UUPSUpgradeable
     */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
