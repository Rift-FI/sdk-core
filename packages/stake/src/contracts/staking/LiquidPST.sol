// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LiquidPST is ERC20, Ownable {
    uint256 public scalingFactor = 1e18;

    /**
     * @notice Initializes the LiquidPST token contract.
     */
    constructor() Ownable(msg.sender) ERC20("Liquid Profit Sharing Token", "LPST") {
        _mint(msg.sender, 0);
    }

    /**
     * @notice Rebases the scaling factor, affecting all token holders.
     * @dev Restricted to the contract owner.
     * @param newScalingFactor The new scaling factor to apply.
     */
    function rebase(uint256 newScalingFactor) external onlyOwner {
        require(newScalingFactor >= scalingFactor, "Scaling factor cannot decrease");
        scalingFactor = newScalingFactor;

        // Emit a dummy transfer event to notify off-chain systems of a rebase.
        emit Transfer(address(0), address(0), 0);
    }

    /**
     * @notice Mints new tokens to a specified account.
     * @dev Restricted to the contract owner.
     * @param account The address to receive the minted tokens.
     * @param amount The amount of tokens to mint.
     */
    function mint(address account, uint256 amount) external onlyOwner {
        _mint(account, amount);
    }

    /**
     * @notice Burns tokens from a specified account.
     * @dev Restricted to the contract owner.
     * @param account The address from which tokens will be burned.
     * @param amount The amount of tokens to burn.
     */
    function burn(address account, uint256 amount) external onlyOwner {
        _burn(account, amount);
    }
}
