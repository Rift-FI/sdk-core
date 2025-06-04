// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Token.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TokenFactory
 * @dev A factory contract for creating new ERC20 tokens
 */
contract TokenFactory is Ownable, ReentrancyGuard {
    using Address for address;

    event TokenCreated(
        address indexed tokenAddress,
        string name,
        string symbol,
        uint256 initialSupply,
        address indexed owner
    );

    mapping(address => address[]) private _creatorTokens;
    address[] private _allTokens;

    uint256 private _fee;

    /**
     * @dev Constructor sets the initial owner and fee
     * @param initialFee The fee to create a new token
     */
    constructor(uint256 initialFee) Ownable(msg.sender) {
        _fee = initialFee;
    }

    /**
     * @dev Creates a new ERC20 token
     * @param name The name of the token
     * @param symbol The symbol of the token
     * @param initialSupply The initial supply of the token
     * @param decimals The number of decimals for the token
     * @param isMintable Whether the token can be minted after creation
     * @param isBurnable Whether the token can be burned
     * @param isPausable Whether the token can be paused
     * @return The address of the newly created token
     */
    function createToken(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        uint8 decimals,
        bool isMintable,
        bool isBurnable,
        bool isPausable
    ) external payable nonReentrant returns (address) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(symbol).length > 0, "Symbol cannot be empty");
        require(initialSupply > 0, "Initial supply must be greater than 0");
        require(decimals <= 18, "Decimals cannot exceed 18");
        require(msg.value >= _fee, "Insufficient fee");

        Token newToken = new Token(
            name,
            symbol,
            initialSupply,
            decimals,
            msg.sender,
            isMintable,
            isBurnable,
            isPausable
        );

        _creatorTokens[msg.sender].push(address(newToken));
        _allTokens.push(address(newToken));

        emit TokenCreated(
            address(newToken),
            name,
            symbol,
            initialSupply,
            msg.sender
        );

        uint256 excess = msg.value - _fee;
        if (excess > 0) {
            (bool success, ) = payable(msg.sender).call{value: excess}("");
            require(success, "Refund failed");
        }

        return address(newToken);
    }

    /**
     * @dev Returns all tokens created by a specific address
     * @param creator The address of the creator
     * @return An array of token addresses
     */
    function getTokensByCreator(
        address creator
    ) external view returns (address[] memory) {
        return _creatorTokens[creator];
    }

    /**
     * @dev Returns all tokens created through this factory
     * @return An array of all token addresses
     */
    function getAllTokens() external view returns (address[] memory) {
        return _allTokens;
    }

    /**
     * @dev Returns the current fee for creating a token
     * @return The current fee
     */
    function getFee() external view returns (uint256) {
        return _fee;
    }

    /**
     * @dev Sets a new fee for creating tokens
     * @param newFee The new fee
     */
    function setFee(uint256 newFee) external onlyOwner {
        _fee = newFee;
    }

    /**
     * @dev Withdraws the collected fees to the owner
     */
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
}