// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title FUELToken
 * @notice $FUEL — ERC-20 utility token for the FuelLink protocol on Polygon PoS.
 *         Total supply: 12,752,901,000 (fixed cap with controlled minting).
 *         Minting: allowed once per 12 months, only to rewards pool, only when <20% remains.
 */
contract FUELToken is ERC20, ERC20Burnable, ERC20Permit, AccessControl, Pausable {

    bytes32 public constant MINTER_ROLE   = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE   = keccak256("PAUSER_ROLE");
    bytes32 public constant BURNER_ROLE   = keccak256("BURNER_ROLE");

    uint256 public constant MAX_SUPPLY    = 12_752_901_000 * 1e18;

    // Minting control — DAO-gated: once per 12 months, rewards pool only
    uint256 public lastMintTimestamp;
    address public rewardsPool;

    event RewardsPoolUpdated(address indexed prev, address indexed next);
    event Minted(address indexed to, uint256 amount, uint256 timestamp);

    constructor(address admin, address initialRecipient)
        ERC20("FuelLink Token", "FUEL")
        ERC20Permit("FuelLink Token")
    {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(BURNER_ROLE, admin);

        // Mint initial supply to recipient (multisig / vesting contract)
        _mint(initialRecipient, MAX_SUPPLY);
    }

    // ─── Minting control ──────────────────────────────────────────────────────

    /**
     * @notice Controlled mint — only to rewardsPool, only when pool < 20% of MAX_SUPPLY,
     *         only once per 12 months. Governed by DAO (MINTER_ROLE held by governance).
     */
    function mintToRewardsPool(uint256 amount) external onlyRole(MINTER_ROLE) {
        require(rewardsPool != address(0), "FUEL: rewards pool not set");
        require(block.timestamp >= lastMintTimestamp + 365 days, "FUEL: mint cooldown active");
        require(
            balanceOf(rewardsPool) < (MAX_SUPPLY * 20) / 100,
            "FUEL: rewards pool > 20% of supply"
        );
        require(totalSupply() + amount <= MAX_SUPPLY, "FUEL: exceeds max supply");

        lastMintTimestamp = block.timestamp;
        _mint(rewardsPool, amount);
        emit Minted(rewardsPool, amount, block.timestamp);
    }

    function setRewardsPool(address pool) external onlyRole(DEFAULT_ADMIN_ROLE) {
        address prev = rewardsPool;
        rewardsPool = pool;
        emit RewardsPoolUpdated(prev, pool);
    }

    // ─── Pause ────────────────────────────────────────────────────────────────

    function pause()   external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    function _update(address from, address to, uint256 value)
        internal override(ERC20) whenNotPaused
    {
        super._update(from, to, value);
    }
}
