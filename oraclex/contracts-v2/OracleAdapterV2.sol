// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

interface IPredictionAMM {
    function settleMarket(bytes32 marketId, uint8 winningSide) external;
}

interface IVerifierV2 {
    function verifyOutcome(bytes32 marketId, uint8 outcome, bytes calldata proof) external view returns (bool);
}

/// @title Oracle Adapter V2
/// @notice Receives outcomes from Chainlink Functions and settles markets
/// @dev Implements dispute mechanism and multi-oracle support
contract OracleAdapterV2 is
    Initializable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant DISPUTE_RESOLVER_ROLE = keccak256("DISPUTE_RESOLVER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    IPredictionAMM public amm;
    IVerifierV2 public verifier;

    uint256 public constant CHALLENGE_PERIOD = 24 hours;
    uint256 public constant DISPUTE_PERIOD = 48 hours;
    uint256 public disputeStake; // Amount of ORX required to dispute

    enum OutcomeStatus {
        None,
        Proposed,
        Challenged,
        Finalized
    }

    struct Outcome {
        uint8 result; // 0 = NO, 1 = YES
        address oracle;
        uint256 timestamp;
        OutcomeStatus status;
        bytes proof;
    }

    struct Dispute {
        address disputer;
        uint8 proposedResult;
        uint256 stake;
        uint256 timestamp;
        bool resolved;
        bool valid;
    }

    mapping(bytes32 => Outcome) public outcomes;
    mapping(bytes32 => Dispute) public disputes;
    mapping(address => uint256) public oracleReputation; // Track oracle reliability

    event OutcomeProposed(bytes32 indexed marketId, uint8 result, address indexed oracle, uint256 challengeDeadline);
    event OutcomeChallenged(bytes32 indexed marketId, address indexed disputer, uint8 proposedResult);
    event DisputeResolved(bytes32 indexed marketId, bool disputeValid, uint8 finalResult);
    event MarketFinalized(bytes32 indexed marketId, uint8 result);
    event OracleReputationUpdated(address indexed oracle, uint256 newReputation);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _amm,
        address _verifier,
        uint256 _disputeStake,
        address defaultAdmin
    ) public initializer {
        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        amm = IPredictionAMM(_amm);
        verifier = IVerifierV2(_verifier);
        disputeStake = _disputeStake;

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(ORACLE_ROLE, defaultAdmin);
        _grantRole(DISPUTE_RESOLVER_ROLE, defaultAdmin);
        _grantRole(PAUSER_ROLE, defaultAdmin);
        _grantRole(UPGRADER_ROLE, defaultAdmin);
    }

    /// @notice Oracle proposes an outcome (called by Chainlink Functions)
    /// @param marketId Market identifier
    /// @param result Outcome (0 = NO, 1 = YES)
    /// @param proof Optional proof data (zkML proof, API response hash, etc.)
    function proposeOutcome(
        bytes32 marketId,
        uint8 result,
        bytes calldata proof
    ) external onlyRole(ORACLE_ROLE) nonReentrant whenNotPaused {
        require(result == 0 || result == 1, "Oracle: invalid result");
        require(outcomes[marketId].status == OutcomeStatus.None, "Oracle: outcome exists");

        // Verify proof if verifier is set
        if (address(verifier) != address(0) && proof.length > 0) {
            require(verifier.verifyOutcome(marketId, result, proof), "Oracle: invalid proof");
        }

        outcomes[marketId] = Outcome({
            result: result,
            oracle: msg.sender,
            timestamp: block.timestamp,
            status: OutcomeStatus.Proposed,
            proof: proof
        });

        emit OutcomeProposed(marketId, result, msg.sender, block.timestamp + CHALLENGE_PERIOD);
    }

    /// @notice Challenge a proposed outcome
    /// @param marketId Market identifier
    /// @param proposedResult Alternative outcome
    function challengeOutcome(
        bytes32 marketId,
        uint8 proposedResult
    ) external nonReentrant whenNotPaused {
        Outcome storage outcome = outcomes[marketId];
        require(outcome.status == OutcomeStatus.Proposed, "Oracle: not proposed");
        require(block.timestamp < outcome.timestamp + CHALLENGE_PERIOD, "Oracle: challenge period ended");
        require(proposedResult == 0 || proposedResult == 1, "Oracle: invalid result");
        require(proposedResult != outcome.result, "Oracle: same result");
        require(disputes[marketId].disputer == address(0), "Oracle: already disputed");

        // TODO: Transfer dispute stake from disputer
        // For now, just record the dispute
        disputes[marketId] = Dispute({
            disputer: msg.sender,
            proposedResult: proposedResult,
            stake: disputeStake,
            timestamp: block.timestamp,
            resolved: false,
            valid: false
        });

        outcome.status = OutcomeStatus.Challenged;

        emit OutcomeChallenged(marketId, msg.sender, proposedResult);
    }

    /// @notice Resolve a dispute (called by governance or dispute resolver)
    /// @param marketId Market identifier
    /// @param disputeValid Whether the dispute is valid
    /// @param finalResult Final outcome
    function resolveDispute(
        bytes32 marketId,
        bool disputeValid,
        uint8 finalResult
    ) external onlyRole(DISPUTE_RESOLVER_ROLE) nonReentrant {
        Outcome storage outcome = outcomes[marketId];
        Dispute storage dispute = disputes[marketId];
        
        require(outcome.status == OutcomeStatus.Challenged, "Oracle: not challenged");
        require(!dispute.resolved, "Oracle: already resolved");
        require(finalResult == 0 || finalResult == 1, "Oracle: invalid result");

        dispute.resolved = true;
        dispute.valid = disputeValid;

        if (disputeValid) {
            // Dispute was valid - update outcome
            outcome.result = finalResult;
            // TODO: Penalize oracle, reward disputer
            if (oracleReputation[outcome.oracle] > 0) {
                oracleReputation[outcome.oracle]--;
            }
            emit OracleReputationUpdated(outcome.oracle, oracleReputation[outcome.oracle]);
        } else {
            // Dispute was invalid - keep original outcome
            // TODO: Slash disputer stake
        }

        outcome.status = OutcomeStatus.Finalized;

        emit DisputeResolved(marketId, disputeValid, outcome.result);
        emit MarketFinalized(marketId, outcome.result);

        // Settle market in AMM
        amm.settleMarket(marketId, outcome.result);
    }

    /// @notice Finalize outcome after challenge period (no disputes)
    /// @param marketId Market identifier
    function finalizeOutcome(bytes32 marketId) external nonReentrant {
        Outcome storage outcome = outcomes[marketId];
        require(outcome.status == OutcomeStatus.Proposed, "Oracle: not proposed");
        require(block.timestamp >= outcome.timestamp + CHALLENGE_PERIOD, "Oracle: challenge period active");

        outcome.status = OutcomeStatus.Finalized;

        // Increase oracle reputation
        oracleReputation[outcome.oracle]++;
        emit OracleReputationUpdated(outcome.oracle, oracleReputation[outcome.oracle]);

        emit MarketFinalized(marketId, outcome.result);

        // Settle market in AMM
        amm.settleMarket(marketId, outcome.result);
    }

    /// @notice Get outcome for a market
    /// @param marketId Market identifier
    function getOutcome(bytes32 marketId) external view returns (
        uint8 result,
        address oracle,
        uint256 timestamp,
        OutcomeStatus status
    ) {
        Outcome storage outcome = outcomes[marketId];
        return (outcome.result, outcome.oracle, outcome.timestamp, outcome.status);
    }

    /// @notice Update AMM address
    /// @param _amm New AMM address
    function setAMM(address _amm) external onlyRole(DEFAULT_ADMIN_ROLE) {
        amm = IPredictionAMM(_amm);
    }

    /// @notice Update verifier address
    /// @param _verifier New verifier address
    function setVerifier(address _verifier) external onlyRole(DEFAULT_ADMIN_ROLE) {
        verifier = IVerifierV2(_verifier);
    }

    /// @notice Update dispute stake amount
    /// @param _disputeStake New dispute stake
    function setDisputeStake(uint256 _disputeStake) external onlyRole(DEFAULT_ADMIN_ROLE) {
        disputeStake = _disputeStake;
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
