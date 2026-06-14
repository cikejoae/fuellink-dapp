// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title FuelSTO
 * @notice Security Token Offering for a single gas station (RWA).
 *         Each deployment represents one FUEL-ESG-No.CRE LLC.
 *
 *  Flow:
 *    1. Investors buy shares (fractional) with USDT during the funding window.
 *    2. Operator raises capital, builds/operates station.
 *    3. Returns (USDT) are distributed proportionally via distributeReturns().
 *    4. On exit, remaining capital is returned proportionally.
 *
 *  This is a simplified MVP — production deployments need securities law compliance.
 */
contract FuelSTO is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdt;

    string  public stationName;
    string  public stationId;
    uint256 public fundingTarget;      // USDT (6 decimals)
    uint256 public minInvestment;
    uint256 public fundingDeadline;
    uint256 public projectedAPY;       // basis points (e.g. 1600 = 16%)

    uint256 public totalRaised;
    bool    public fundingComplete;
    bool    public divestComplete;

    mapping(address => uint256) public shares;      // investor → USDT invested
    address[]                   public investors;

    event InvestmentReceived(address indexed investor, uint256 amount);
    event ReturnsDistributed(uint256 totalAmount, uint256 timestamp);
    event DivestComplete(uint256 totalReturned);
    event FundingComplete(uint256 totalRaised);

    constructor(
        address usdtAddr,
        address admin,
        string memory name_,
        string memory id_,
        uint256 target,
        uint256 minInv,
        uint256 deadline,
        uint256 apy
    ) Ownable(admin) {
        usdt           = IERC20(usdtAddr);
        stationName    = name_;
        stationId      = id_;
        fundingTarget  = target;
        minInvestment  = minInv;
        fundingDeadline = deadline;
        projectedAPY   = apy;
    }

    // ─── Invest ───────────────────────────────────────────────────────────────

    function invest(uint256 amount) external nonReentrant {
        require(!fundingComplete,                         "STO: funding complete");
        require(block.timestamp < fundingDeadline,        "STO: deadline passed");
        require(amount >= minInvestment,                  "STO: below minimum");
        require(totalRaised + amount <= fundingTarget,    "STO: exceeds target");

        usdt.safeTransferFrom(msg.sender, address(this), amount);

        if (shares[msg.sender] == 0) {
            investors.push(msg.sender);
        }
        shares[msg.sender] += amount;
        totalRaised        += amount;

        emit InvestmentReceived(msg.sender, amount);

        if (totalRaised == fundingTarget) {
            fundingComplete = true;
            emit FundingComplete(totalRaised);
        }
    }

    // ─── Distribute returns ───────────────────────────────────────────────────

    /**
     * @notice Operator deposits USDT returns; distributed proportionally.
     * @param amount Total USDT to distribute (must be pre-approved).
     */
    function distributeReturns(uint256 amount) external onlyOwner nonReentrant {
        require(fundingComplete, "STO: not funded");
        require(amount > 0,      "STO: zero amount");

        usdt.safeTransferFrom(msg.sender, address(this), amount);

        for (uint256 i = 0; i < investors.length; i++) {
            address inv   = investors[i];
            uint256 share = (amount * shares[inv]) / totalRaised;
            if (share > 0) {
                usdt.safeTransfer(inv, share);
            }
        }

        emit ReturnsDistributed(amount, block.timestamp);
    }

    // ─── Exit / divest ────────────────────────────────────────────────────────

    function distributeDivest(uint256 amount) external onlyOwner nonReentrant {
        require(!divestComplete, "STO: already divested");
        usdt.safeTransferFrom(msg.sender, address(this), amount);

        for (uint256 i = 0; i < investors.length; i++) {
            address inv   = investors[i];
            uint256 share = (amount * shares[inv]) / totalRaised;
            if (share > 0) {
                usdt.safeTransfer(inv, share);
            }
        }

        divestComplete = true;
        emit DivestComplete(amount);
    }

    // ─── Refund if deadline passed without reaching target ───────────────────

    function refund() external nonReentrant {
        require(!fundingComplete,                      "STO: already funded");
        require(block.timestamp >= fundingDeadline,    "STO: deadline not passed");
        require(shares[msg.sender] > 0,               "STO: no investment");

        uint256 amount = shares[msg.sender];
        shares[msg.sender] = 0;
        totalRaised       -= amount;

        usdt.safeTransfer(msg.sender, amount);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getInvestorCount() external view returns (uint256) {
        return investors.length;
    }

    function getSharePercentage(address investor) external view returns (uint256) {
        if (totalRaised == 0) return 0;
        return (shares[investor] * 10_000) / totalRaised; // basis points
    }

    // Emergency withdraw (admin only, with timelock in production)
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
}
