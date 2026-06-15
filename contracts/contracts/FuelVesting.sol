// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FuelVesting
 * @notice Linear vesting with cliff for $FUEL token distribution.
 *
 *  Each schedule:
 *    - Has a cliff: no tokens available until cliff has passed.
 *    - After cliff: tokens vest linearly from start until (start + duration).
 *    - Can be revoked by owner; unvested tokens return to owner.
 *
 *  Typical use cases:
 *    - Team tokens: 1-year cliff, 3-year vest
 *    - Seed investors: 6-month cliff, 2-year vest
 *    - Community rewards: no cliff, 1-year vest
 */
contract FuelVesting is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable fuelToken;

    struct Schedule {
        address beneficiary;
        uint256 amount;      // total FUEL to vest
        uint256 released;    // already claimed
        uint256 start;       // unix timestamp
        uint256 cliff;       // seconds after start before any tokens vest
        uint256 duration;    // total vesting window in seconds (from start)
        bool    revoked;
    }

    mapping(uint256 => Schedule) public schedules;
    uint256 public scheduleCount;

    event ScheduleCreated(
        uint256 indexed id, address indexed beneficiary,
        uint256 amount, uint256 start, uint256 cliff, uint256 duration
    );
    event Released(uint256 indexed id, address indexed beneficiary, uint256 amount);
    event Revoked(uint256 indexed id, uint256 unvestedReturned);

    constructor(address fuel_, address admin_) Ownable(admin_) {
        fuelToken = IERC20(fuel_);
    }

    // ─── Create ───────────────────────────────────────────────────────────────

    /**
     * @param beneficiary  Recipient address.
     * @param amount       Total FUEL to vest (must be pre-transferred to this contract).
     * @param cliffDays    Days after `startTimestamp` before any tokens vest.
     * @param durationDays Total vesting window in days from `startTimestamp`.
     * @param startTimestamp Unix timestamp; pass 0 to use block.timestamp.
     */
    function createSchedule(
        address beneficiary,
        uint256 amount,
        uint256 cliffDays,
        uint256 durationDays,
        uint256 startTimestamp
    ) external onlyOwner returns (uint256 id) {
        require(beneficiary != address(0),  "Vesting: zero beneficiary");
        require(amount > 0,                 "Vesting: zero amount");
        require(durationDays > 0,           "Vesting: zero duration");
        require(cliffDays <= durationDays,  "Vesting: cliff > duration");

        uint256 start = startTimestamp == 0 ? block.timestamp : startTimestamp;
        id = ++scheduleCount;

        schedules[id] = Schedule({
            beneficiary: beneficiary,
            amount:      amount,
            released:    0,
            start:       start,
            cliff:       cliffDays * 1 days,
            duration:    durationDays * 1 days,
            revoked:     false
        });

        emit ScheduleCreated(id, beneficiary, amount, start, cliffDays * 1 days, durationDays * 1 days);
    }

    // ─── Release ──────────────────────────────────────────────────────────────

    /// @notice Claim all currently vested but unreleased tokens for a schedule.
    function release(uint256 scheduleId) external nonReentrant {
        Schedule storage s = schedules[scheduleId];
        require(msg.sender == s.beneficiary, "Vesting: not beneficiary");
        require(!s.revoked,                  "Vesting: schedule revoked");

        uint256 vested = releasable(scheduleId);
        require(vested > 0, "Vesting: nothing to release");

        s.released += vested;
        fuelToken.safeTransfer(s.beneficiary, vested);
        emit Released(scheduleId, s.beneficiary, vested);
    }

    // ─── Revoke ───────────────────────────────────────────────────────────────

    /// @notice Cancel a schedule and return unvested tokens to the owner.
    function revoke(uint256 scheduleId) external onlyOwner nonReentrant {
        Schedule storage s = schedules[scheduleId];
        require(!s.revoked, "Vesting: already revoked");

        uint256 vested   = releasable(scheduleId);
        uint256 unvested = s.amount - s.released - vested;

        s.revoked = true;

        // Pay out any already-vested portion to beneficiary first
        if (vested > 0) {
            s.released += vested;
            fuelToken.safeTransfer(s.beneficiary, vested);
        }

        // Return unvested to owner
        if (unvested > 0) {
            fuelToken.safeTransfer(owner(), unvested);
        }

        emit Revoked(scheduleId, unvested);
    }

    // ─── View ─────────────────────────────────────────────────────────────────

    /// @notice Tokens that have vested but have not been released yet.
    function releasable(uint256 scheduleId) public view returns (uint256) {
        Schedule storage s = schedules[scheduleId];
        if (s.revoked) return 0;
        return _vestedAmount(s) - s.released;
    }

    /// @notice Total tokens vested as of now (including already released).
    function vestedAmount(uint256 scheduleId) external view returns (uint256) {
        return _vestedAmount(schedules[scheduleId]);
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _vestedAmount(Schedule storage s) internal view returns (uint256) {
        uint256 cliffEnd = s.start + s.cliff;
        if (block.timestamp < cliffEnd) return 0;

        uint256 vestEnd = s.start + s.duration;
        if (block.timestamp >= vestEnd) return s.amount;

        // Linear: amount * (elapsed since start) / duration
        return (s.amount * (block.timestamp - s.start)) / s.duration;
    }
}
