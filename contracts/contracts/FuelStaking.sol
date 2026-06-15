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
 *
 *  Reward distribution uses a Synthetix-style per-share accumulator:
 *    earned(user) = fuelxBalance × (rewardPerFuelxStored − userRewardPerFuelxPaid[user]) / 1e18
 *                  + rewards[user]
 *  Snapshots are taken in the updateReward modifier BEFORE any FUELx mint/burn,
 *  so newly minted FUELx never earns past rewards retroactively.
 *
 *  Fee recycling: early-unstake fees and claim fees re-enter the accumulator,
 *  compounding rewards for remaining stakers.
 */
contract FuelStaking is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    IERC20     public immutable fuelToken;
    FUELxToken public immutable fuelxToken;

    uint256 public constant OMEGA_MAX = 129;
    uint256 public constant C_DEFAULT = 1e18;
    uint256 public constant CLAIM_FEE = 25;   // 2.5%  (basis-points / 10)
    uint256 public constant FEE_INIT  = 2000; // 20%
    uint256 public constant FEE_FINAL = 200;  // 2%
    uint256 public constant MAX_WEEKS = 104;  // 2 years
    uint256 public constant MIN_WEEKS = 1;

    uint256 public cConstant = C_DEFAULT;

    // ─── Reward accumulator ───────────────────────────────────────────────────
    uint256 public rewardPerFuelxStored;                        // ×1e18 per 1 FUELx
    mapping(address => uint256) public userRewardPerFuelxPaid;  // snapshot per user
    mapping(address => uint256) public rewards;                 // earned, unclaimed

    // ─── Stakes ───────────────────────────────────────────────────────────────
    struct StakeInfo {
        uint256 amount;
        uint256 fuelxMinted;
        uint256 startTime;
        uint256 lockWeeks;
        bool    active;
    }

    mapping(address => StakeInfo[]) public stakes;
    uint256 public totalStaked;

    // ─── Events ───────────────────────────────────────────────────────────────
    event Staked(address indexed user, uint256 stakeId, uint256 amount, uint256 lockWeeks, uint256 fuelxMinted);
    event Unstaked(address indexed user, uint256 stakeId, uint256 amount, uint256 fee);
    event RewardsClaimed(address indexed user, uint256 amount, uint256 fee);
    event RewardsDeposited(uint256 amount);
    event CConstantUpdated(uint256 prev, uint256 next);

    constructor(address fuel, address fuelx, address admin) Ownable(admin) {
        fuelToken  = IERC20(fuel);
        fuelxToken = FUELxToken(fuelx);
    }

    // ─── Reward accumulator ───────────────────────────────────────────────────

    /// @notice Accrued rewards for `user` including unsettled accumulator delta.
    function earned(address user) public view returns (uint256) {
        uint256 fuelxBal = fuelxToken.balanceOf(user);
        return (fuelxBal * (rewardPerFuelxStored - userRewardPerFuelxPaid[user])) / 1e18
               + rewards[user];
    }

    /// @dev Must be called (via modifier) BEFORE any FUELx mint/burn so the
    ///      balance used for the snapshot reflects the position BEFORE the change.
    modifier updateReward(address user) {
        if (user != address(0)) {
            rewards[user] = earned(user);
            userRewardPerFuelxPaid[user] = rewardPerFuelxStored;
        }
        _;
    }

    /// @dev Distributes `amount` FUEL proportionally to current FUELx holders.
    ///      If there are no stakers the FUEL sits idle in the contract.
    function _addToAccumulator(uint256 amount) internal {
        uint256 totalFuelx = fuelxToken.totalSupply();
        if (totalFuelx > 0) {
            rewardPerFuelxStored += (amount * 1e18) / totalFuelx;
        }
    }

    // ─── Staking ─────────────────────────────────────────────────────────────

    function stake(uint256 amount, uint256 weeks_)
        external nonReentrant whenNotPaused updateReward(msg.sender)
    {
        require(amount > 0,                                     "Stake: amount = 0");
        require(weeks_ >= MIN_WEEKS && weeks_ <= MAX_WEEKS,     "Stake: invalid duration");

        fuelToken.safeTransferFrom(msg.sender, address(this), amount);

        uint256 fuelxAmount = _calcFuelx(amount, weeks_);
        fuelxToken.mint(msg.sender, fuelxAmount);

        stakes[msg.sender].push(StakeInfo({
            amount:      amount,
            fuelxMinted: fuelxAmount,
            startTime:   block.timestamp,
            lockWeeks:   weeks_,
            active:      true
        }));

        totalStaked += amount;
        emit Staked(msg.sender, stakes[msg.sender].length - 1, amount, weeks_, fuelxAmount);
    }

    function unstake(uint256 stakeId) external nonReentrant updateReward(msg.sender) {
        StakeInfo storage s = stakes[msg.sender][stakeId];
        require(s.active, "Stake: not active");

        s.active    = false;
        totalStaked -= s.amount;

        uint256 elapsed = (block.timestamp - s.startTime) / 1 weeks;
        uint256 fee     = _calcUnstakeFee(s.amount, elapsed, s.lockWeeks);
        uint256 payout  = s.amount - fee;

        // Burn FUELx snapshot was taken before this burn
        fuelxToken.burn(msg.sender, s.fuelxMinted);

        // Early-exit fee re-enters the pool for remaining stakers
        if (fee > 0) {
            _addToAccumulator(fee);
        }

        fuelToken.safeTransfer(msg.sender, payout);
        emit Unstaked(msg.sender, stakeId, payout, fee);
    }

    function claimRewards() external nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "Stake: nothing to claim");

        uint256 fee    = (reward * CLAIM_FEE) / 1000;
        uint256 payout = reward - fee;

        rewards[msg.sender] = 0;

        // Claim fee also re-enters the pool
        if (fee > 0) {
            _addToAccumulator(fee);
        }

        fuelToken.safeTransfer(msg.sender, payout);
        emit RewardsClaimed(msg.sender, payout, fee);
    }

    // ─── Treasury deposits ────────────────────────────────────────────────────

    /// @notice Treasury/owner deposits FUEL rewards, immediately distributed
    ///         proportionally to all current FUELx holders via the accumulator.
    function depositRewards(uint256 amount) external onlyOwner {
        fuelToken.safeTransferFrom(msg.sender, address(this), amount);
        _addToAccumulator(amount);
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

    function _calcFuelx(uint256 amount, uint256 weeks_) internal view returns (uint256) {
        return (amount * ((1e18 * weeks_ / OMEGA_MAX) + cConstant)) / 1e18;
    }

    function _calcUnstakeFee(uint256 amount, uint256 elapsed, uint256 lockWeeks)
        internal pure returns (uint256)
    {
        if (elapsed >= lockWeeks) return 0;
        uint256 feeRate = FEE_INIT - ((FEE_INIT - FEE_FINAL) * elapsed / lockWeeks);
        return (amount * feeRate) / 10_000;
    }

    // ─── Admin ───────────────────────────────────────────────────────────────

    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
