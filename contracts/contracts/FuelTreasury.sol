// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IFuelStaking {
    function depositRewards(uint256 amount) external;
}

/**
 * @title FuelTreasury
 * @notice Collects protocol fees and funds the staking reward pool.
 *
 *  In production the owner should be the FuelDAO (via TimelockController)
 *  so all disbursements require a governance vote.
 *
 *  Fees flow:
 *    Protocol revenue (MATIC / ERC-20) → FuelTreasury
 *    DAO vote → fundStakingRewards(amount) → FuelStaking.depositRewards()
 *    DAO vote → withdraw(token, to, amount) for any other expenditure
 */
contract FuelTreasury is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable fuelToken;
    address public stakingContract;

    event StakingFunded(uint256 amount);
    event StakingContractUpdated(address indexed prev, address indexed next);
    event Withdrawn(address indexed token, address indexed to, uint256 amount);
    event MATICWithdrawn(address indexed to, uint256 amount);

    constructor(address fuel_, address staking_, address admin_) Ownable(admin_) {
        fuelToken       = IERC20(fuel_);
        stakingContract = staking_;
    }

    // ─── Staking rewards ─────────────────────────────────────────────────────

    /**
     * @notice Approves and calls FuelStaking.depositRewards() in one tx.
     *         `amount` FUEL must already be held by this contract.
     */
    function fundStakingRewards(uint256 amount) external onlyOwner {
        require(stakingContract != address(0), "Treasury: staking not set");
        fuelToken.forceApprove(stakingContract, amount);
        IFuelStaking(stakingContract).depositRewards(amount);
        emit StakingFunded(amount);
    }

    function setStakingContract(address staking_) external onlyOwner {
        address prev    = stakingContract;
        stakingContract = staking_;
        emit StakingContractUpdated(prev, staking_);
    }

    // ─── General withdrawals ─────────────────────────────────────────────────

    /// @notice Withdraw any ERC-20 held by the Treasury (governance only).
    function withdraw(address token, address to, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(to, amount);
        emit Withdrawn(token, to, amount);
    }

    /// @notice Withdraw MATIC (e.g. gas fees collected from protocol ops).
    function withdrawMATIC(address payable to, uint256 amount) external onlyOwner {
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "Treasury: MATIC transfer failed");
        emit MATICWithdrawn(to, amount);
    }

    /// @dev Allows the Treasury to receive MATIC directly.
    receive() external payable {}
}
