// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract PSTInvestment is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant INVESTOR_ROLE = keccak256("INVESTOR_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    IERC20 public stablecoin;
    address public treasury;

    struct InvestmentProposal {
        address target;
        uint256 amount;
        bytes data;
        uint256 approvals;
        mapping(address => bool) approvedBy;
        bool executed;
        address proposer;
        uint256 timestamp;
        uint256 expiry;
    }

    InvestmentProposal[] public proposals;
    mapping(address => bool) public whitelistedTargets;
    uint256 public requiredApprovals = 2;
    uint256 public proposalExpiryTime = 7 days;

    event InvestmentProposed(uint256 indexed proposalId, address indexed proposer, address target, uint256 amount);
    event InvestmentApproved(uint256 indexed proposalId, address indexed approver, uint256 approvals);
    event InvestmentExecuted(uint256 indexed proposalId, address target, uint256 amount);
    event InvestmentToTreasury(uint256 amount, address target);
    event TargetWhitelisted(address indexed target, bool status);
    event ProposalExpiryTimeUpdated(uint256 newExpiryTime);
    event RequiredApprovalsUpdated(uint256 newRequiredApprovals);

    constructor(address _stablecoin, address _treasury, address _admin) {
        require(_stablecoin != address(0), "Stablecoin address cannot be zero");
        require(_treasury != address(0), "Treasury address cannot be zero");
        require(_admin != address(0), "Admin address cannot be zero");

        stablecoin = IERC20(_stablecoin);
        treasury = _treasury;

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(INVESTOR_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);

        whitelistedTargets[_treasury] = true;
    }

    function proposeInvestment(address target, uint256 amount, bytes calldata data)
        external
        onlyRole(INVESTOR_ROLE)
        whenNotPaused
        nonReentrant
        returns (uint256 proposalId)
    {
        require(target != address(0), "Invalid target address");
        require(whitelistedTargets[target], "Target not whitelisted");
        require(amount > 0, "Amount must be greater than 0");

        require(
            stablecoin.allowance(treasury, address(this)) >= amount,
            "Insufficient allowance from treasury"
        );

        proposalId = proposals.length;
        proposals.push();
        InvestmentProposal storage proposal = proposals[proposalId];
        proposal.target = target;
        proposal.amount = amount;
        proposal.data = data;
        proposal.proposer = msg.sender;
        proposal.timestamp = block.timestamp;
        proposal.expiry = block.timestamp + proposalExpiryTime;
        proposal.approvals = 1;
        proposal.approvedBy[msg.sender] = true;

        emit InvestmentProposed(proposalId, msg.sender, target, amount);

        if (requiredApprovals == 1) {
            _executeInvestment(proposalId);
        }

        return proposalId;
    }

    function approveInvestment(uint256 proposalId) external onlyRole(INVESTOR_ROLE) nonReentrant {
        require(proposalId < proposals.length, "Invalid proposal ID");
        InvestmentProposal storage proposal = proposals[proposalId];

        require(!proposal.executed, "Proposal already executed");
        require(block.timestamp <= proposal.expiry, "Proposal expired");
        require(!proposal.approvedBy[msg.sender], "Already approved");
        require(whitelistedTargets[proposal.target], "Target no longer whitelisted");

        proposal.approvedBy[msg.sender] = true;
        proposal.approvals += 1;

        emit InvestmentApproved(proposalId, msg.sender, proposal.approvals);

        if (proposal.approvals >= requiredApprovals) {
            _executeInvestment(proposalId);
        }
    }

    function _executeInvestment(uint256 proposalId) internal {
        InvestmentProposal storage proposal = proposals[proposalId];

        require(!proposal.executed, "Proposal already executed");
        require(proposal.approvals >= requiredApprovals, "Not enough approvals");

        proposal.executed = true;
        stablecoin.safeTransferFrom(treasury, proposal.target, proposal.amount);

        if (proposal.data.length > 0) {
            (bool success, ) = proposal.target.call(proposal.data);
            require(success, "Target call failed");
        }

        emit InvestmentExecuted(proposalId, proposal.target, proposal.amount);
        emit InvestmentToTreasury(proposal.amount, proposal.target);
    }

    function setProposalExpiryTime(uint256 newExpiryTime) external onlyRole(ADMIN_ROLE) {
        require(newExpiryTime > 0, "Expiry time must be greater than 0");
        proposalExpiryTime = newExpiryTime;
        emit ProposalExpiryTimeUpdated(newExpiryTime);
    }

    function setRequiredApprovals(uint256 newRequiredApprovals) external onlyRole(ADMIN_ROLE) {
        require(newRequiredApprovals > 0, "Approvals must be greater than 0");
        requiredApprovals = newRequiredApprovals;
        emit RequiredApprovalsUpdated(newRequiredApprovals);
    }

    function setTargetWhitelisted(address target, bool isWhitelisted) external onlyRole(ADMIN_ROLE) {
        require(target != address(0), "Invalid target address");
        whitelistedTargets[target] = isWhitelisted;
        emit TargetWhitelisted(target, isWhitelisted);
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function getProposalCount() external view returns (uint256) {
        return proposals.length;
    }

    function getProposal(uint256 proposalId)
        external
        view
        returns (
            address targetPool,
            uint256 amount,
            uint256 approvals,
            bool executed,
            address proposer,
            uint256 timestamp
        )
    {
        require(proposalId < proposals.length, "Invalid proposal ID");
        InvestmentProposal storage p = proposals[proposalId];
        return (p.target, p.amount, p.approvals, p.executed, p.proposer, p.timestamp);
    }

    function hasApproved(uint256 proposalId, address voter) external view returns (bool) {
        require(proposalId < proposals.length, "Invalid proposal ID");
        InvestmentProposal storage proposal = proposals[proposalId];
        return proposal.approvedBy[voter];
    }
}
