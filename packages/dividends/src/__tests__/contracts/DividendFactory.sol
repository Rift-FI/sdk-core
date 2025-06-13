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
 */
contract DividendFactory is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    // Events
    event DividendCreated(
        address indexed tokenAddress,
        address indexed dividendContract,
        string merchantName,
        address indexed admin,
        uint256 batchSize
    );

    event BatchSizeUpdated(uint256 oldBatchSize, uint256 newBatchSize);

    // State variables
    address public dividendImplementation;
    uint256 public batchSize; // Contract-controlled batch size
    mapping(address => address) public tokenToDividend; // token address -> dividend contract

    /**
     * @dev Initializes the factory with dividend implementation
     * @param _dividendImplementation Address of the Dividend implementation contract
     */
    function initialize(address _dividendImplementation) public initializer {
        require(
            _dividendImplementation != address(0),
            "Invalid implementation"
        );

        __Ownable_init(msg.sender);
        // __UUPSUpgradeable_init();

        dividendImplementation = _dividendImplementation;
        batchSize = 100; // Production default: works well across all networks
    }

    /**
     * @dev Creates a new upgradeable dividend contract for a token
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
        require(tokenAddress != address(0), "Invalid token address");
        require(admin != address(0), "Invalid admin address");
        require(bytes(merchantName).length > 0, "Merchant name required");
        require(
            tokenToDividend[tokenAddress] == address(0),
            "Dividend already exists for token"
        );

        // Create UUPS proxy with initialization data
        bytes memory initData = abi.encodeWithSelector(
            Dividend.initialize.selector,
            batchSize
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
            batchSize
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
     * @dev Required by UUPSUpgradeable
     */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
