const fetch = require('node-fetch');

// Configuration
const BERACHAIN_API_URL = 'https://api.berascan.com/api';
const API_KEY = 'verifyContract'; // Use this for Berachain

// Sphere Token source code (exact copy from user)
const SPHERE_TOKEN_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {ERC20BurnableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract Token is
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

    uint8 private _decimals;
    bool private _transferable;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        uint8 tokenDecimals,
        address initialAdmin,
        address initialMinterBurner
    ) public initializer {
        __ERC20_init(name, symbol);
        __ERC20Burnable_init();
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(UPGRADER_ROLE, initialAdmin);
        _grantRole(PAUSER_ROLE, initialAdmin);

        _grantRole(MINTER_ROLE, initialMinterBurner);
        _grantRole(BURNER_ROLE, initialMinterBurner);

        _setRoleAdmin(MINTER_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(BURNER_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(PAUSER_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(UPGRADER_ROLE, DEFAULT_ADMIN_ROLE);

        _decimals = tokenDecimals;
        _transferable = false; // Transfers disabled by default

        if (initialSupply > 0) {
            _mint(initialAdmin, initialSupply * (10 ** uint256(tokenDecimals)));
        }
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function setTransferable(
        bool isTransferable
    ) public virtual onlyRole(DEFAULT_ADMIN_ROLE) whenNotPaused {
        _transferable = isTransferable;
    }

    function transferable() public view virtual returns (bool) {
        return _transferable;
    }

    function mint(
        address to,
        uint256 amount
    ) public virtual onlyRole(MINTER_ROLE) whenNotPaused {
        _mint(to, amount);
    }

    function burn(
        address account,
        uint256 amount
    ) public virtual onlyRole(BURNER_ROLE) whenNotPaused {
        _burn(account, amount);
    }

    function pause() public virtual onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public virtual onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal virtual override onlyRole(UPGRADER_ROLE) {}

    function _update(
        address from,
        address to,
        uint256 value
    ) internal virtual override(ERC20Upgradeable) {
        super._update(from, to, value);

        if (from == address(0) || to == address(0)) {
            return; // Allow minting and burning
        }

        if (!_transferable) {
            if (!hasRole(DEFAULT_ADMIN_ROLE, from)) {
                revert(
                    "Token: Transfers only allowed for admins when disabled"
                );
            }
        }
    }
}`;

async function verifyContract(contractAddress) {
  console.log(`🔍 Verifying contract: ${contractAddress}`);
  
  try {
    // Wait for contract indexing
    console.log('⏳ Waiting 30 seconds for contract indexing...');
    await new Promise(resolve => setTimeout(resolve, 30000));

    const params = new URLSearchParams({
      module: 'contract',
      action: 'verifysourcecode',
      contractaddress: contractAddress,
      sourceCode: SPHERE_TOKEN_SOURCE,
      codeformat: 'solidity-single-file',
      contractname: 'Token',
      compilerversion: 'v0.8.20+commit.a1b79de6',
      optimizationUsed: '1',
      runs: '200',
      constructorArguements: '', // No constructor args for proxy pattern
      apikey: API_KEY
    });

    console.log('📡 Submitting verification request...');
    const response = await fetch(BERACHAIN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    const result = await response.json();
    
    if (result.status === '1') {
      console.log('✅ Verification submitted successfully!');
      console.log('📋 GUID:', result.result);
      
      // Check verification status
      await checkVerificationStatus(result.result);
    } else {
      console.error('❌ Verification failed:', result.result);
    }

  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  }
}

async function checkVerificationStatus(guid) {
  console.log('🔍 Checking verification status...');
  
  for (let i = 0; i < 10; i++) {
    try {
      const params = new URLSearchParams({
        module: 'contract',
        action: 'checkverifystatus',
        guid: guid,
        apikey: API_KEY
      });

      const response = await fetch(`${BERACHAIN_API_URL}?${params.toString()}`);
      const result = await response.json();
      
      console.log(`📊 Status check ${i + 1}/10:`, result.result);
      
      if (result.result === 'Pass - Verified') {
        console.log('🎉 Contract verified successfully!');
        return;
      } else if (result.result.includes('Fail')) {
        console.error('❌ Verification failed:', result.result);
        return;
      }
      
      // Wait 10 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 10000));
    } catch (error) {
      console.error('Error checking status:', error.message);
    }
  }
  
  console.log('⏰ Verification status check timed out. Check manually on Berascan.');
}

// Main function
async function main() {
  const contractAddress = process.argv[2];
  
  if (!contractAddress) {
    console.log('Usage: node verify-sphere-token.js <contract-address>');
    console.log('Example: node verify-sphere-token.js 0x1234567890123456789012345678901234567890');
    process.exit(1);
  }

  console.log('🚀 Sphere Token Verification Script');
  console.log('📍 Contract Address:', contractAddress);
  console.log('🌐 Network: Berachain Mainnet');
  console.log('');

  await verifyContract(contractAddress);
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { verifyContract, SPHERE_TOKEN_SOURCE }; 