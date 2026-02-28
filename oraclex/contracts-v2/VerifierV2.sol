// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/// @title Verifier V2
    /// @notice Verifies AI commitments and cryptographic proofs
    /// @dev Supports hash/signature verification. Advanced proof types fail closed until implemented.
contract VerifierV2 is
    Initializable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    enum ProofType {
        None,
        Hash,          // Simple hash commitment
        Signature,     // Signed data
        ZKProof,       // Reserved: not yet implemented (fails closed)
        ChainlinkDON   // Reserved: not yet implemented (fails closed)
    }

    struct AICommitment {
        bytes32 commitmentHash;
        ProofType proofType;
        bytes proof;
        address submitter;
        uint256 timestamp;
        string ipfsCid; // Optional metadata
        bool verified;
    }

    struct ModelMetadata {
        string modelName;
        string modelVersion;
        uint256 confidence; // 0-10000 (basis points)
        string dataSourcesHash; // Hash of data sources used
    }

    mapping(bytes32 => AICommitment) public commitments;
    mapping(bytes32 => ModelMetadata) public modelMetadata;
    mapping(bytes32 => mapping(uint256 => bool)) public usedNonces; // Anti-replay

    event AICommitted(
        bytes32 indexed marketId,
        bytes32 indexed commitmentHash,
        ProofType proofType,
        address indexed submitter,
        string ipfsCid
    );
    event ProofVerified(bytes32 indexed marketId, bool valid);
    event ModelMetadataUpdated(bytes32 indexed marketId, string modelName, string modelVersion);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address defaultAdmin) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(VERIFIER_ROLE, defaultAdmin);
        _grantRole(UPGRADER_ROLE, defaultAdmin);
    }

    /// @notice Commit AI prediction with proof
    /// @param marketId Market identifier
    /// @param commitmentHash Hash of AI output (probability + explanation + salt)
    /// @param proofType Type of proof provided
    /// @param proof Proof data (signature, zkProof, etc.)
    /// @param ipfsCid Optional IPFS CID for full AI output
    function commitAI(
        bytes32 marketId,
        bytes32 commitmentHash,
        ProofType proofType,
        bytes calldata proof,
        string calldata ipfsCid
    ) external onlyRole(VERIFIER_ROLE) {
        require(commitments[marketId].commitmentHash == bytes32(0), "Verifier: commitment exists");
        require(commitmentHash != bytes32(0), "Verifier: invalid hash");

        commitments[marketId] = AICommitment({
            commitmentHash: commitmentHash,
            proofType: proofType,
            proof: proof,
            submitter: msg.sender,
            timestamp: block.timestamp,
            ipfsCid: ipfsCid,
            verified: false
        });

        emit AICommitted(marketId, commitmentHash, proofType, msg.sender, ipfsCid);
    }

    /// @notice Update model metadata for a market
    /// @param marketId Market identifier
    /// @param modelName Name of AI model used
    /// @param modelVersion Version of AI model
    /// @param confidence Confidence score (0-10000)
    /// @param dataSourcesHash Hash of data sources
    function updateModelMetadata(
        bytes32 marketId,
        string calldata modelName,
        string calldata modelVersion,
        uint256 confidence,
        string calldata dataSourcesHash
    ) external onlyRole(VERIFIER_ROLE) {
        require(confidence <= 10000, "Verifier: invalid confidence");

        modelMetadata[marketId] = ModelMetadata({
            modelName: modelName,
            modelVersion: modelVersion,
            confidence: confidence,
            dataSourcesHash: dataSourcesHash
        });

        emit ModelMetadataUpdated(marketId, modelName, modelVersion);
    }

    /// @notice Verify outcome with proof
    /// @param marketId Market identifier
    /// @param outcome Proposed outcome
    /// @param proof Proof data
    /// @return valid Whether the proof is valid
    function verifyOutcome(
        bytes32 marketId,
        uint8 outcome,
        bytes calldata proof
    ) external view returns (bool valid) {
        AICommitment storage commitment = commitments[marketId];
        
        if (commitment.commitmentHash == bytes32(0)) {
            return false; // No commitment
        }

        if (commitment.proofType == ProofType.Hash) {
            // Verify hash commitment
            bytes32 expectedHash = keccak256(abi.encodePacked(outcome, proof));
            return expectedHash == commitment.commitmentHash;
        } else if (commitment.proofType == ProofType.Signature) {
            // Verify signature
            return _verifySignature(marketId, outcome, proof, commitment.submitter);
        } else if (commitment.proofType == ProofType.ZKProof) {
            // Fail closed until zk proof verifier integration is implemented.
            return false;
        } else if (commitment.proofType == ProofType.ChainlinkDON) {
            // Fail closed until Chainlink DON attestation verification is implemented.
            return _verifyChainlinkAttestation(marketId, outcome, proof);
        }

        return false;
    }

    /// @notice Verify ECDSA signature
    /// @param marketId Market identifier
    /// @param outcome Outcome value
    /// @param signature Signature bytes
    /// @param expectedSigner Expected signer address
    /// @return valid Whether signature is valid
    function _verifySignature(
        bytes32 marketId,
        uint8 outcome,
        bytes memory signature,
        address expectedSigner
    ) internal pure returns (bool valid) {
        if (signature.length != 65) {
            return false;
        }

        bytes32 messageHash = keccak256(abi.encodePacked(marketId, outcome));
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }

        if (v < 27) {
            v += 27;
        }

        if (v != 27 && v != 28) {
            return false;
        }

        address recoveredSigner = ecrecover(ethSignedMessageHash, v, r, s);
        return recoveredSigner == expectedSigner;
    }

    /// @notice Verify Chainlink DON attestation
    /// @param marketId Market identifier
    /// @param outcome Outcome value
    /// @param attestation Attestation data
    /// @return valid Whether attestation is valid
    function _verifyChainlinkAttestation(
        bytes32 marketId,
        uint8 outcome,
        bytes memory attestation
    ) internal pure returns (bool valid) {
        marketId;
        outcome;
        attestation;
        return false;
    }

    /// @notice Get commitment for a market
    /// @param marketId Market identifier
    function getCommitment(bytes32 marketId) external view returns (
        bytes32 commitmentHash,
        ProofType proofType,
        address submitter,
        uint256 timestamp,
        string memory ipfsCid,
        bool verified
    ) {
        AICommitment storage commitment = commitments[marketId];
        return (
            commitment.commitmentHash,
            commitment.proofType,
            commitment.submitter,
            commitment.timestamp,
            commitment.ipfsCid,
            commitment.verified
        );
    }

    /// @notice Get proof type metadata for a market commitment
    /// @param marketId Market identifier
    /// @return proofType Proof type enum value
    /// @return exists Whether a commitment exists for the market
    function getProofType(bytes32 marketId) external view returns (uint8 proofType, bool exists) {
        AICommitment storage commitment = commitments[marketId];
        return (uint8(commitment.proofType), commitment.commitmentHash != bytes32(0));
    }

    /// @notice Get model metadata for a market
    /// @param marketId Market identifier
    function getModelMetadata(bytes32 marketId) external view returns (
        string memory modelName,
        string memory modelVersion,
        uint256 confidence,
        string memory dataSourcesHash
    ) {
        ModelMetadata storage metadata = modelMetadata[marketId];
        return (
            metadata.modelName,
            metadata.modelVersion,
            metadata.confidence,
            metadata.dataSourcesHash
        );
    }

    /// @notice Mark commitment as verified
    /// @param marketId Market identifier
    function markVerified(bytes32 marketId) external onlyRole(VERIFIER_ROLE) {
        require(commitments[marketId].commitmentHash != bytes32(0), "Verifier: no commitment");
        commitments[marketId].verified = true;
        emit ProofVerified(marketId, true);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
