// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockTokenB is ERC20 {
    constructor() ERC20("Token B", "TKNB") {
        _mint(msg.sender, 1000000 * 10 ** 18); // Mint 1M tokens with 18 decimals
    }
}
