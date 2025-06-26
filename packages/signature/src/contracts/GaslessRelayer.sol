// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ERC20Permit.sol";

/**
 * @title GaslessRelayer
 * @dev Contract that executes gasless token transfers using EIP-2612 permits
 */
contract GaslessRelayer {
    // Events
    event GaslessTransfer(
        address indexed token,
        address indexed from,
        address indexed to,
        uint256 amount,
        address relayer
    );

    // Custom errors
    error RelayerInvalidToken(address token);
    error RelayerTransferFailed();
    error RelayerPermitFailed();

    /**
     * @dev Execute a gasless transfer using EIP-2612 permit
     * @param token Address of the ERC20 permit token
     * @param owner Token owner (signer of the permit)
     * @param spender Address authorized to spend (usually this contract)
     * @param value Amount authorized in the permit
     * @param deadline Permit expiration timestamp
     * @param v Recovery byte of the signature
     * @param r First 32 bytes of the signature
     * @param s Second 32 bytes of the signature
     * @param to Recipient of the transfer
     * @param amount Amount to transfer (must be <= value)
     */
    function executePermitTransfer(
        address token,
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s,
        address to,
        uint256 amount
    ) external returns (bool) {
        if (token == address(0)) {
            revert RelayerInvalidToken(address(0));
        }

        ERC20Permit permitToken = ERC20Permit(token);

        // Execute the permit to grant allowance
        try permitToken.permit(owner, spender, value, deadline, v, r, s) {
            // Permit successful, now execute the transfer
        } catch {
            revert RelayerPermitFailed();
        }

        // Transfer tokens from owner to recipient
        try permitToken.transferFrom(owner, to, amount) returns (bool success) {
            if (!success) {
                revert RelayerTransferFailed();
            }
        } catch {
            revert RelayerTransferFailed();
        }

        emit GaslessTransfer(token, owner, to, amount, msg.sender);
        return true;
    }

    /**
     * @dev Get nonce for a specific token and owner
     */
    function getNonce(
        address token,
        address owner
    ) external view returns (uint256) {
        ERC20Permit permitToken = ERC20Permit(token);
        return permitToken.nonces(owner);
    }

    /**
     * @dev Get domain separator for a specific token
     */
    function getDomainSeparator(address token) external view returns (bytes32) {
        ERC20Permit permitToken = ERC20Permit(token);
        return permitToken.getDomainSeparator();
    }
}
