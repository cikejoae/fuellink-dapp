// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./FUELxToken.sol";

/**
 * @title FuelDAO
 * @notice DAO governance with quadratic voting using $FUELx.
 *
 *  Quadratic voting: votes = sqrt(FUELx). This prevents whales from dominating.
 *  Approval threshold: 75% of votes cast (emergency: 55%, 24h).
 *  Quorum: minimum participation required (configurable, default 4M $FUELx).
 *
 *  Lifecycle: Debate (7d) → Voting (7d) → Execution delay (2d).
 */
contract FuelDAO is ReentrancyGuard, Ownable {

    FUELxToken public immutable fuelxToken;

    uint256 public constant DEBATE_PERIOD    = 7 days;
    uint256 public constant VOTING_PERIOD    = 7 days;
    uint256 public constant EXECUTION_DELAY  = 2 days;
    uint256 public constant EMERGENCY_PERIOD = 1 days;

    uint256 public approvalThreshold  = 7500; // 75% (basis points)
    uint256 public emergencyThreshold = 5500; // 55%
    uint256 public quorum             = 4_000_000 * 1e18;
    uint256 public proposalStake      = 500 * 1e18; // 500 FUELx to propose

    enum State { Debate, Voting, Queued, Executed, Rejected, Cancelled }

    struct Proposal {
        address proposer;
        string  description;
        bytes   callData;
        address target;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 debateStart;
        uint256 votingStart;
        uint256 votingEnd;
        bool    emergency;
        bool    executed;
        bool    cancelled;
    }

    mapping(uint256 => Proposal)                     public proposals;
    mapping(uint256 => mapping(address => bool))     public hasVoted;
    mapping(uint256 => mapping(address => uint256))  public votePower;

    uint256 public proposalCount;

    event ProposalCreated(uint256 indexed id, address proposer, string description, bool emergency);
    event VoteCast(uint256 indexed id, address voter, bool support, uint256 votes);
    event ProposalExecuted(uint256 indexed id);
    event ProposalCancelled(uint256 indexed id);

    constructor(address fuelx, address admin) Ownable(admin) {
        fuelxToken = FUELxToken(fuelx);
    }

    // ─── Propose ──────────────────────────────────────────────────────────────

    function propose(string calldata description, address target, bytes calldata data) external returns (uint256) {
        require(fuelxToken.balanceOf(msg.sender) >= proposalStake, "DAO: insufficient FUELx");

        uint256 id = ++proposalCount;
        proposals[id] = Proposal({
            proposer:    msg.sender,
            description: description,
            callData:    data,
            target:      target,
            forVotes:    0,
            againstVotes:0,
            debateStart: block.timestamp,
            votingStart: block.timestamp + DEBATE_PERIOD,
            votingEnd:   block.timestamp + DEBATE_PERIOD + VOTING_PERIOD,
            emergency:   false,
            executed:    false,
            cancelled:   false,
        });

        emit ProposalCreated(id, msg.sender, description, false);
        return id;
    }

    function proposeEmergency(string calldata description, address target, bytes calldata data) external onlyOwner returns (uint256) {
        uint256 id = ++proposalCount;
        proposals[id] = Proposal({
            proposer:    msg.sender,
            description: description,
            callData:    data,
            target:      target,
            forVotes:    0,
            againstVotes:0,
            debateStart: block.timestamp,
            votingStart: block.timestamp,
            votingEnd:   block.timestamp + EMERGENCY_PERIOD,
            emergency:   true,
            executed:    false,
            cancelled:   false,
        });

        emit ProposalCreated(id, msg.sender, description, true);
        return id;
    }

    // ─── Vote ─────────────────────────────────────────────────────────────────

    function vote(uint256 proposalId, bool support) external nonReentrant {
        Proposal storage p = proposals[proposalId];
        require(block.timestamp >= p.votingStart,  "DAO: voting not started");
        require(block.timestamp <  p.votingEnd,    "DAO: voting ended");
        require(!hasVoted[proposalId][msg.sender], "DAO: already voted");
        require(!p.cancelled && !p.executed,       "DAO: proposal closed");

        uint256 fuelxBal = fuelxToken.balanceOf(msg.sender);
        require(fuelxBal > 0, "DAO: no FUELx");

        // Quadratic voting: cost increases quadratically
        // votes = floor(sqrt(fuelxBal / 1e18))
        uint256 votes = _sqrt(fuelxBal / 1e18);
        require(votes > 0, "DAO: insufficient FUELx for vote");

        hasVoted[proposalId][msg.sender] = true;
        votePower[proposalId][msg.sender] = votes;

        if (support) {
            p.forVotes += votes;
        } else {
            p.againstVotes += votes;
        }

        emit VoteCast(proposalId, msg.sender, support, votes);
    }

    // ─── Execute ─────────────────────────────────────────────────────────────

    function execute(uint256 proposalId) external nonReentrant {
        Proposal storage p = proposals[proposalId];
        require(!p.executed && !p.cancelled, "DAO: already closed");
        require(block.timestamp > p.votingEnd, "DAO: voting ongoing");

        State state = _state(p);
        require(state == State.Queued, "DAO: not approved");
        require(block.timestamp >= p.votingEnd + EXECUTION_DELAY || p.emergency, "DAO: execution delay");

        p.executed = true;

        if (p.callData.length > 0 && p.target != address(0)) {
            (bool ok, ) = p.target.call(p.callData);
            require(ok, "DAO: execution failed");
        }

        emit ProposalExecuted(proposalId);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getState(uint256 proposalId) external view returns (State) {
        return _state(proposals[proposalId]);
    }

    function _state(Proposal storage p) internal view returns (State) {
        if (p.cancelled) return State.Cancelled;
        if (p.executed)  return State.Executed;
        if (block.timestamp < p.votingStart) return State.Debate;
        if (block.timestamp < p.votingEnd)   return State.Voting;

        uint256 total     = p.forVotes + p.againstVotes;
        uint256 threshold = p.emergency ? emergencyThreshold : approvalThreshold;

        if (total * 1e18 < quorum / 1e18) return State.Rejected; // quorum not met
        if (p.forVotes * 10_000 >= total * threshold) return State.Queued;
        return State.Rejected;
    }

    // ─── Governance params (self-amending via proposals) ─────────────────────

    function setQuorum(uint256 q)            external onlyOwner { quorum = q; }
    function setApprovalThreshold(uint256 t) external onlyOwner { require(t >= 5500 && t <= 10000); approvalThreshold = t; }
    function setProposalStake(uint256 s)     external onlyOwner { proposalStake = s; }

    // ─── Math ─────────────────────────────────────────────────────────────────

    function _sqrt(uint256 x) internal pure returns (uint256 y) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) { y = z; z = (x / z + z) / 2; }
    }
}
