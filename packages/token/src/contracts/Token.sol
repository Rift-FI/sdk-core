// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Context.sol";

contract Token is Context, ERC20, Ownable {
    uint8 private _decimals;
    bool private _mintable;
    bool private _burnable;
    bool private _pausable;
    bool private _paused;

    event Paused(address account);
    event Unpaused(address account);

    /**
     * @dev Constructor sets the token properties and mints initial supply
     * @param name The name of the token
     * @param symbol The symbol of the token
     * @param initialSupply The initial supply of the token
     * @param tokenDecimals The number of decimals for the token
     * @param tokenOwner The owner of the token
     * @param isMintable Whether the token can be minted after creation
     * @param isBurnable Whether the token can be burned
     * @param isPausable Whether the token can be paused
     */

    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        uint8 tokenDecimals,
        address tokenOwner,
        bool isMintable,
        bool isBurnable,
        bool isPausable
    ) ERC20(name, symbol) Ownable(tokenOwner) {
        _decimals = tokenDecimals;
        _mintable = isMintable;
        _burnable = isBurnable;
        _pausable = isPausable;
        _paused = false;

        if (initialSupply > 0) {
            _mint(tokenOwner, initialSupply * 10 ** _decimals);
        }
    }

    /**
     * @dev Returns the number of decimals used for token
     * @return The number of decimals
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Mints new tokens if the token is mintable
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     */

    function mint(address to, uint256 amount) public onlyOwner {
        require(_mintable, "Token: minting is not allowed");
        _mint(to, amount * 10 ** _decimals);
    }

    /**
     * @dev Burns tokens if the token is burnable
     * @param amount The amount of tokens to burn
     */
    function burn(uint256 amount) external {
        require(_burnable, "Burning is disabled");
        require(!_paused, "Token is paused");
        _burn(_msgSender(), amount);
    }

    /**
     * @dev Burns tokens from a specific account if the token is burnable
     * @param account The account to burn tokens from
     * @param amount The amount of tokens to burn
     */
    function burnFrom(address account, uint256 amount) external {
        require(_burnable, "Burning is disabled");
        require(!_paused, "Token is paused");

        uint256 currentAllowance = allowance(account, _msgSender());
        require(
            currentAllowance >= amount,
            "ERC20: burn amount exceeds allowance"
        );
        unchecked {
            _approve(account, _msgSender(), currentAllowance - amount);
        }
        _burn(account, amount);
    }

    /**
     * @dev Pauses all token transfers if the token is pausable
     */
    function pause() external onlyOwner {
        require(_pausable, "Pausing is disabled");
        require(!_paused, "Token is already paused");
        _paused = true;
        emit Paused(_msgSender());
    }

    /**
     * @dev Unpauses all token transfers if the token is paused
     */
    function unpause() external onlyOwner {
        require(_pausable, "Pausing is disabled");
        require(_paused, "Token is not paused");
        _paused = false;
        emit Unpaused(_msgSender());
    }

    /**
     * @dev Returns whether the token is paused
     * @return Whether the token is paused
     */
    function paused() external view returns (bool) {
        return _paused;
    }

    /**
     * @dev Returns whether the token is mintable
     * @return Whether the token is mintable
     */
    function mintable() external view returns (bool) {
        return _mintable;
    }

    /**
     * @dev Returns whether the token is burnable
     * @return Whether the token is burnable
     */
    function burnable() external view returns (bool) {
        return _burnable;
    }

    /**
     * @dev Returns whether the token is pausable
     * @return Whether the token is pausable
     */
    function pausable() external view returns (bool) {
        return _pausable;
    }

    /**
     * @dev Hook that is called before any transfer of tokens
     * @param from The address tokens are transferred from
     * @param to The address tokens are transferred to
     * @param amount The amount of tokens transferred
     */
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        require(!_paused, "Token transfers are paused");
        super._update(from, to, amount);
    }
}