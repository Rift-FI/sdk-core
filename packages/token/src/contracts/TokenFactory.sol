// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title Mintable ERC20 Token
/// @notice A standard ERC20 token with minting, burning, and pausing capabilities
contract MintableToken is ERC20, ERC20Burnable, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 public maxSupply;
    bool public mintingEnabled;

    event MaxSupplyUpdated(uint256 newMaxSupply);
    event MintingToggled(bool enabled);

    constructor(
        string memory name,
        string memory symbol,
        uint256 _maxSupply,
        address owner,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        maxSupply = _maxSupply;
        mintingEnabled = true;

        _grantRole(DEFAULT_ADMIN_ROLE, owner);
        _grantRole(MINTER_ROLE, owner);
        _grantRole(BURNER_ROLE, owner);
        _grantRole(PAUSER_ROLE, owner);

        if (initialSupply > 0) {
            _mint(owner, initialSupply);
        }
    }

    /// @notice Mints new tokens to a specified account
    /// @param to The account to mint tokens to
    /// @param amount The amount of tokens to mint
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) whenNotPaused {
        require(mintingEnabled, "Minting is disabled");
        require(maxSupply == 0 || totalSupply() + amount <= maxSupply, "Max supply exceeded");
        _mint(to, amount);
    }

    /// @notice Burns tokens from a specified account
    /// @param account The account whose tokens to burn
    /// @param amount The amount of tokens to burn
    function burn(address account, uint256 amount) public onlyRole(BURNER_ROLE) whenNotPaused {
        _burn(account, amount);
    }

    /// @notice Pauses the contract
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /// @notice Unpauses the contract
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /// @notice Updates the maximum supply
    /// @param newMaxSupply The new maximum supply (0 for unlimited)
    function setMaxSupply(uint256 newMaxSupply) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newMaxSupply == 0 || newMaxSupply >= totalSupply(), "Max supply cannot be less than current supply");
        maxSupply = newMaxSupply;
        emit MaxSupplyUpdated(newMaxSupply);
    }

    /// @notice Toggles minting capability
    /// @param enabled Whether minting should be enabled
    function setMintingEnabled(bool enabled) public onlyRole(DEFAULT_ADMIN_ROLE) {
        mintingEnabled = enabled;
        emit MintingToggled(enabled);
    }

    /// @dev Hook called before any token transfer
    function _update(address from, address to, uint256 value) internal override whenNotPaused {
        super._update(from, to, value);
    }
}

/// @title Token Factory
/// @notice Factory contract for deploying new ERC20 tokens with minting capabilities
contract TokenFactory is Ownable {
    uint256 public deploymentFee;
    address public feeRecipient;
    
    mapping(address => address[]) public userTokens;
    address[] public allTokens;
    
    event TokenDeployed(
        address indexed tokenAddress,
        address indexed owner,
        string name,
        string symbol,
        uint256 maxSupply,
        uint256 initialSupply
    );
    
    event DeploymentFeeUpdated(uint256 newFee);
    event FeeRecipientUpdated(address newRecipient);

    constructor(address _feeRecipient, uint256 _deploymentFee) Ownable(msg.sender) {
        feeRecipient = _feeRecipient;
        deploymentFee = _deploymentFee;
    }

    /// @notice Deploys a new mintable ERC20 token
    /// @param name The name of the token
    /// @param symbol The symbol of the token
    /// @param maxSupply The maximum supply (0 for unlimited)
    /// @param initialSupply The initial supply to mint to the owner
    /// @return tokenAddress The address of the deployed token
    function deployToken(
        string memory name,
        string memory symbol,
        uint256 maxSupply,
        uint256 initialSupply
    ) external payable returns (address tokenAddress) {
        require(msg.value >= deploymentFee, "Insufficient deployment fee");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(symbol).length > 0, "Symbol cannot be empty");
        require(maxSupply == 0 || initialSupply <= maxSupply, "Initial supply exceeds max supply");

        // Deploy new token contract
        MintableToken token = new MintableToken(
            name,
            symbol,
            maxSupply,
            msg.sender,
            initialSupply
        );

        tokenAddress = address(token);
        
        // Record the deployment
        userTokens[msg.sender].push(tokenAddress);
        allTokens.push(tokenAddress);

        // Transfer deployment fee
        if (deploymentFee > 0 && feeRecipient != address(0)) {
            payable(feeRecipient).transfer(deploymentFee);
        }

        // Refund excess payment
        if (msg.value > deploymentFee) {
            payable(msg.sender).transfer(msg.value - deploymentFee);
        }

        emit TokenDeployed(tokenAddress, msg.sender, name, symbol, maxSupply, initialSupply);
    }

    /// @notice Gets all tokens deployed by a user
    /// @param user The user address
    /// @return An array of token addresses
    function getUserTokens(address user) external view returns (address[] memory) {
        return userTokens[user];
    }

    /// @notice Gets all deployed tokens
    /// @return An array of all token addresses
    function getAllTokens() external view returns (address[] memory) {
        return allTokens;
    }

    /// @notice Gets the total number of deployed tokens
    /// @return The count of deployed tokens
    function getTokenCount() external view returns (uint256) {
        return allTokens.length;
    }

    /// @notice Updates the deployment fee
    /// @param newFee The new deployment fee
    function setDeploymentFee(uint256 newFee) external onlyOwner {
        deploymentFee = newFee;
        emit DeploymentFeeUpdated(newFee);
    }

    /// @notice Updates the fee recipient
    /// @param newRecipient The new fee recipient address
    function setFeeRecipient(address newRecipient) external onlyOwner {
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(newRecipient);
    }

    /// @notice Withdraws accumulated fees
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(owner()).transfer(balance);
    }
} 