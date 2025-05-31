// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {ERC20BurnableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/// @title SPHR Token
/// @author Sphere
/// @notice An ERC20 token representing validated user engagement (CAC).
/// Initially non-transferable, controlled via UUPS proxy.
/// Minting and burning are restricted by roles.
contract SPHR is
    Initializable,
    ERC20Upgradeable,
    ERC20BurnableUpgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    bool private _transferable;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initializes the SPHR token contract.
    /// @param initialAdmin The address to grant DEFAULT_ADMIN_ROLE, UPGRADER_ROLE, and PAUSER_ROLE.
    /// @param initialMinterBurner The address to grant MINTER_ROLE and BURNER_ROLE (typically the CAC Verifier contract).
    function initialize(address initialAdmin, address initialMinterBurner) public initializer {
        __ERC20_init("Sphere", "SPHR");
        __ERC20Burnable_init();
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(UPGRADER_ROLE, initialAdmin);
        _grantRole(PAUSER_ROLE, initialAdmin);

        _grantRole(MINTER_ROLE, initialMinterBurner);
        _grantRole(BURNER_ROLE, initialMinterBurner);

        // Explicitly set DEFAULT_ADMIN_ROLE as admin for other roles
        _setRoleAdmin(MINTER_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(BURNER_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(PAUSER_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(UPGRADER_ROLE, DEFAULT_ADMIN_ROLE);

        _transferable = false;
    }

    // --- External Functions ---

    /// @notice Sets the transferability status of the token.
    /// @dev Requires DEFAULT_ADMIN_ROLE.
    /// @param isTransferable The new transferability status.
    function setTransferable(bool isTransferable)
        public
        virtual
        onlyRole(DEFAULT_ADMIN_ROLE)
        whenNotPaused
    {
        _transferable = isTransferable;
    }

    /// @notice Returns true if the token is currently transferable.
    function transferable() public view virtual returns (bool) {
        return _transferable;
    }

    /// @notice Mints new tokens to a specified account.
    /// @dev Requires MINTER_ROLE. Cannot mint when paused.
    /// @param to The account to mint tokens to.
    /// @param amount The amount of tokens to mint.
    function mint(address to, uint256 amount) public virtual onlyRole(MINTER_ROLE) whenNotPaused {
        _mint(to, amount);
    }

    /// @notice Burns tokens from a specified account.
    /// @dev Requires BURNER_ROLE. Cannot burn when paused.
    /// This function is needed because the standard `burnFrom` requires allowance,
    /// but the CAC contract needs to burn directly during redemption.
    /// @param account The account whose tokens to burn.
    /// @param amount The amount of tokens to burn.
    function burn(address account, uint256 amount) public virtual onlyRole(BURNER_ROLE) whenNotPaused {
        _burn(account, amount);
    }

    /// @notice Pauses the contract, disabling minting, burning, and transfers.
    /// @dev Requires PAUSER_ROLE.
    function pause() public virtual onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /// @notice Unpauses the contract.
    /// @dev Requires PAUSER_ROLE.
    function unpause() public virtual onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // --- UUPS Upgrade ---

    /// @notice Authorizes an upgrade to a new implementation contract.
    /// @dev Requires UPGRADER_ROLE.
    function _authorizeUpgrade(address newImplementation) internal virtual override onlyRole(UPGRADER_ROLE) {}

    // --- Internal Hooks ---

    /// @dev Hook called before any token transfer, including minting and burning.
    /// Overridden to enforce non-transferability (except for admins) and pausability.
    function _update(address from, address to, uint256 value) internal virtual override(ERC20Upgradeable) {
        super._update(from, to, value);

        // Allow minting (from == address(0)) and burning (to == address(0)) regardless of transferability status
        if (from == address(0) || to == address(0)) {
            return; // Mint or burn operation
        }

        // Check for regular transfers
        if (!_transferable) {
            // If transfers are generally disabled, allow only if 'from' is an admin
            if (!hasRole(DEFAULT_ADMIN_ROLE, from)) {
                revert("SPHR: Transfers only allowed for admins when disabled");
            }
        }
    }
} 