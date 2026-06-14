// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title FUELxToken
 * @notice $FUELx — Non-transferable governance token earned by staking $FUEL.
 *         Formula: FUELx = FUEL_staked * ((1/129) * weeks + 1)
 *         Only the FuelStaking contract (MINTER_ROLE) can mint/burn.
 *         Transfers are disabled — it represents a time-locked commitment.
 */
contract FUELxToken is ERC20, AccessControl {

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(address admin) ERC20("FuelLink Governance Token", "FUELx") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyRole(MINTER_ROLE) {
        _burn(from, amount);
    }

    /// @dev Governance token is soulbound — transfers disabled except mint/burn.
    function transfer(address, uint256) public pure override returns (bool) {
        revert("FUELx: non-transferable");
    }

    function transferFrom(address, address, uint256) public pure override returns (bool) {
        revert("FUELx: non-transferable");
    }
}
