// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./FUELxToken.sol";

/**
 * @title FuelStaking
 * @notice Staking contract for $FUEL → $FUELx.
 *
 *  FUELx formula: S * ((1/OMEGA_MAX) * weeks + C)
 *  where OMEGA_MAX = 129, C = 1 (modifiable by DAO)
 *
 *  Fees (linear decay):
 *  - Early unstake fee starts at 20%, decays to 2% at max lock
 *  - Claim fee: 2.5% (flat)
 *
 *  Rewards: proportional share of protocol fees deposited by Treasury.
 */
contract FuelStaking is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    IERC20    public immutable fuelToken;
    FUELxToken public immutable fuelxToken;

    uint256 public constant OMEGA_MAX    = 129;   // max weeks
    uint256 public constant C_DEFAULT    = 1e18;  // constant C (1.0 with 18 decimals)
    uint256 public constant CLAIM_FEE    = 25;    // 2.5% (basis points / 10)
    uint256 public constant FEE_INIT     = 2000;  // 20%
    uint256 public constant FEE_FINAL    = 200;   // 2%
    uint256 public constant MAX_WEEKS    = 104;   // 2 years
    uint256 public constant MIN_WEEKS    = 1;

    uint256 public cConstant = C_DEFAULT;         // governance-modifiable

    struct StakeInfo {
        uint256 amount;       // FUEL staked
        uint256 fuelxMinted;  // FUELx minted for this stake
        uint256 startTime;
        uint256 lockWeeks;
        bool    active;
    }

    mapping(address => StakeInfo[]) public stakes;
    mapping(address => uint256)     public pendingRewards;

    uint256 public totalStaked;
    uint256 public rewardPool;      // deposited by Treasury

    event Staked(address indexed user, uint256 stakeId, uint256 amount, uint256 weeks, uint256 fuelxMinted);
    event Unstaked(address indexed user, uint256 stakeId, uint256 amount, uint256 fee);
    event RewardsClaimed(address indexed user, uint256 amount, uint256 fee);
    event RewardsDeposited(uint256 amount);
    event CConstantUpdated(uint256 prev, uint256 next);

    constructor(address fuel, address fuelx, address admin) Ownable(admin) {
        fuelToken  = IERC20(fuel);
        fuelxToken = FUELxToken(fuelx);
    }

    // ─── Staking ─────────────────────────────────────────────────────────────

    function stake(uint256 amount, uint256 weeks_) external nonReentrant whenNotPaused {
        require(amount > 0,                         "Stake: amount = 0");
        require(weeks_ >= MIN_WEEKS && weeks_ <= MAX_WEEKS, "Stake: invalid duration");

        fuelToken.safeTransferFrom(msg.sender, address(this), amount);

        uint256 fuelxAmount = _calcFuelx(amount, weeks_);
        fuelxToken.mint(msg.sender, fuelxAmount);

        stakes[msg.sender].push(StakeInfo({
            amount:      amount,
            fuelxMinted: fuelxAmount,
            startTime:   block.timestamp,
            lockWeeks:   weeks_,
            active:      true,
        }));

        totalStaked += amount;
        emit Staked(msg.sender, stakes[msg.sender].length - 1, amount, weeks_, fuelxAmount);
    }

    function unstake(uint256 stakeId) external nonReentrant {
        StakeInfo storage s = stakes[msg.sender][stakeId];
        require(s.active, "Stake: not active");

        s.active = false;
        totalStaked -= s.amount;

        uint256 elapsed = (block.timestamp - s.startTime) / 1 weeks;
        uint256 fee     = _calcUnstakeFee(s.amount, elapsed, s.lockWeeks);
        uint256 payout  = s.amount - fee;

        // burn FUELx
        fuelxToken.burn(msg.sender, s.fuelxMinted);

        // fee to reward pool
        rewardPool += fee;

        fuelToken.safeTransfer(msg.sender, payout);
        emit Unstaked(msg.sender, stakeId, payout, fee);
    }

    function claimRewards() external nonReentrant {
        uint256 reward = pendingRewards[msg.sender];
        require(reward > 0, "Stake: nothing to claim");

        uint256 fee    = (reward * CLAIM_FEE) / 1000; // 2.5%
        uint256 payout = reward - fee;

        pendingRewards[msg.sender] = 0;
        rewardPool += fee;

        fuelToken.safeTransfer(msg.sender, payout);
        emit RewardsClaimed(msg.sender, payout, fee);
    }

    // ─── Treasury reward distribution ────────────────────────────────────────

    function depositRewards(uint256 amount) external onlyOwner {
        fuelToken.safeTransferFrom(msg.sender, address(this), amount);
        rewardPool += amount;
        emit RewardsDeposited(amount);
    }

    // ─── View helpers ─────────────────────────────────────────────────────────

    function getStakeCount(address user) external view returns (uint256) {
        return stakes[user].length;
    }

    function getStake(address user, uint256 id) external view returns (StakeInfo memory) {
        return stakes[user][id];
    }

    // ─── Governance ──────────────────────────────────────────────────────────

    function setCConstant(uint256 newC) external onlyOwner {
        emit CConstantUpdated(cConstant, newC);
        cConstant = newC;
    }

    // ─── Internal math ───────────────────────────────────────────────────────

    /// FUELx = S * ((1/OMEGA_MAX) * weeks + C)
    function _calcFuelx(uint256 amount, uint256 weeks_) internal view returns (uint256) {
        return (amount * ((1e18 * weeks_ / OMEGA_MAX) + cConstant)) / 1e18;
    }

    /// Early unstake fee: linear from FEE_INIT (0 elapsed) to FEE_FINAL (full lock)
    function _calcUnstakeFee(uint256 amount, uint256 elapsed, uint256 lockWeeks) internal pure returns (uint256) {
        if (elapsed >= lockWeeks) return 0;
        uint256 feeRate = FEE_INIT - ((FEE_INIT - FEE_FINAL) * elapsed / lockWeeks);
        return (amount * feeRate) / 10_000;
    }

    // ─── Admin ───────────────────────────────────────────────────────────────

    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
