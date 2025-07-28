// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract PSTJ is ERC20, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Events
    event PSTJMinted(address indexed to, uint256 amount, uint256 trancheIndex);
    event PSTJBurned(address indexed from, uint256 amount, uint256 trancheIndex);

    constructor(address _admin) ERC20("PST Junior", "PSTJ") {
        require(_admin != address(0), "Admin address cannot be zero");
        
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(MINTER_ROLE, _admin);
        _grantRole(BURNER_ROLE, _admin);
        _grantRole(PAUSER_ROLE, _admin);
    }

    /**
     * @dev Mints PSTJ tokens to represent Junior staking position
     * @param to The address to mint tokens to
     * @param amount The amount of PSTJ tokens to mint
     * @param trancheIndex The tranche index (should be 1 for Junior)
     */
    function mint(address to, uint256 amount, uint256 trancheIndex) 
        external 
        onlyRole(MINTER_ROLE) 
        whenNotPaused 
    {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than 0");
        require(trancheIndex == 1, "PSTJ is only for Junior tranche (index 1)");
        
        _mint(to, amount);
        emit PSTJMinted(to, amount, trancheIndex);
    }

    /**
     * @dev Burns PSTJ tokens when Junior position is withdrawn
     * @param from The address to burn tokens from
     * @param amount The amount of PSTJ tokens to burn
     * @param trancheIndex The tranche index (should be 1 for Junior)
     */
    function burn(address from, uint256 amount, uint256 trancheIndex) 
        external 
        onlyRole(BURNER_ROLE) 
        whenNotPaused 
    {
        require(from != address(0), "Cannot burn from zero address");
        require(amount > 0, "Amount must be greater than 0");
        require(trancheIndex == 1, "PSTJ is only for Junior tranche (index 1)");
        require(balanceOf(from) >= amount, "Insufficient PSTJ balance to burn");
        
        _burn(from, amount);
        emit PSTJBurned(from, amount, trancheIndex);
    }

    /**
     * @dev Pauses all token transfers
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpauses all token transfers
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Override to prevent transfers - PSTJ tokens are non-transferable
     */
    function _update(address from, address to, uint256 amount)
        internal
        override
        whenNotPaused
    {
        // Only allow minting and burning operations
        require(from == address(0) || to == address(0), "PSTJ tokens are non-transferable");
        super._update(from, to, amount);
    }

    /**
     * @dev Returns the number of decimals used to get its user representation
     */
    function decimals() public view virtual override returns (uint8) {
        return 6; // Same as USDC for consistency
    }
} 