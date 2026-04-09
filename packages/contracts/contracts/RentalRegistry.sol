// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RentalRegistry
 * @notice Anchors all rental lifecycle events on-chain for the RentalChain platform.
 *
 * Supported event types:
 *   - Agreement anchoring (SHA-256 of signed PDF)
 *   - Payment anchoring (hash of payment data)
 *   - Evidence anchoring (hash of IPFS photo bundle — move-in, move-out, maintenance)
 *   - Dispute opening and resolution
 *
 * Design principles:
 * - All write functions restricted to platform owner wallet
 * - No funds held or transferred — pure event log
 * - No personal data — only hashes and timestamps
 * - Events are the primary data source; storage is secondary
 */
contract RentalRegistry {
    address public owner;

    // -------------------------------------------------------------------------
    // Enums
    // -------------------------------------------------------------------------

    enum EvidenceType {
        MOVE_IN,
        MOVE_OUT,
        MAINTENANCE,
        INSPECTION
    }

    enum DisputeStatus {
        OPENED,
        RESOLVED
    }

    // -------------------------------------------------------------------------
    // Structs
    // -------------------------------------------------------------------------

    struct AgreementRecord {
        bytes32 agreementHash; // SHA-256 of the signed PDF
        bytes32 landlordDID;
        bytes32 tenantDID;
        uint256 anchoredAt;
        bool exists;
    }

    struct PaymentRecord {
        bytes32 paymentHash; // SHA-256 of: agreementId + amount + date + upiRefId
        uint256 amount; // in paise (INR * 100)
        uint256 paymentDate; // unix timestamp of the payment date
        uint256 anchoredAt;
    }

    struct EvidenceRecord {
        bytes32 evidenceHash; // SHA-256 of IPFS bundle CID + metadata
        EvidenceType evidenceType;
        uint256 recordedAt;
    }

    struct DisputeRecord {
        bytes32 agreementId;
        bytes32 evidenceBundleHash;
        DisputeStatus status;
        bytes32 resolutionHash; // hash of resolution document (if resolved)
        uint256 openedAt;
        uint256 resolvedAt;
        bool exists;
    }

    // -------------------------------------------------------------------------
    // Storage
    // -------------------------------------------------------------------------

    // agreementId => AgreementRecord
    mapping(bytes32 => AgreementRecord) public agreements;

    // agreementId => payment index => PaymentRecord
    mapping(bytes32 => mapping(uint256 => PaymentRecord)) public payments;
    mapping(bytes32 => uint256) public paymentCount;

    // agreementId => evidence index => EvidenceRecord
    mapping(bytes32 => mapping(uint256 => EvidenceRecord)) public evidenceRecords;
    mapping(bytes32 => uint256) public evidenceCount;

    // disputeId => DisputeRecord
    mapping(bytes32 => DisputeRecord) public disputes;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event AgreementAnchored(
        bytes32 indexed agreementId,
        bytes32 agreementHash,
        bytes32 indexed landlordDID,
        bytes32 indexed tenantDID,
        uint256 timestamp
    );

    event PaymentAnchored(
        bytes32 indexed agreementId,
        uint256 indexed paymentIndex,
        bytes32 paymentHash,
        uint256 amount,
        uint256 paymentDate,
        uint256 timestamp
    );

    event EvidenceAnchored(
        bytes32 indexed agreementId,
        uint256 indexed evidenceIndex,
        bytes32 evidenceHash,
        EvidenceType evidenceType,
        uint256 timestamp
    );

    event DisputeOpened(
        bytes32 indexed disputeId,
        bytes32 indexed agreementId,
        bytes32 evidenceBundleHash,
        uint256 timestamp
    );

    event DisputeResolved(
        bytes32 indexed disputeId,
        bytes32 resolutionHash,
        uint256 timestamp
    );

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // -------------------------------------------------------------------------
    // Modifiers
    // -------------------------------------------------------------------------

    modifier onlyOwner() {
        require(msg.sender == owner, "RentalRegistry: caller is not the owner");
        _;
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor() {
        owner = msg.sender;
    }

    // -------------------------------------------------------------------------
    // Agreement
    // -------------------------------------------------------------------------

    /**
     * @notice Anchor a signed rental agreement on-chain.
     * @param agreementId    Unique agreement identifier (bytes32 of UUID)
     * @param agreementHash  SHA-256 of the signed PDF document
     * @param landlordDID    DID hash of the landlord
     * @param tenantDID      DID hash of the tenant
     */
    function anchorAgreement(
        bytes32 agreementId,
        bytes32 agreementHash,
        bytes32 landlordDID,
        bytes32 tenantDID
    ) external onlyOwner {
        require(agreementId != bytes32(0), "RentalRegistry: invalid agreement ID");
        require(agreementHash != bytes32(0), "RentalRegistry: invalid agreement hash");
        require(!agreements[agreementId].exists, "RentalRegistry: agreement already anchored");

        agreements[agreementId] = AgreementRecord({
            agreementHash: agreementHash,
            landlordDID: landlordDID,
            tenantDID: tenantDID,
            anchoredAt: block.timestamp,
            exists: true
        });

        emit AgreementAnchored(agreementId, agreementHash, landlordDID, tenantDID, block.timestamp);
    }

    // -------------------------------------------------------------------------
    // Payments
    // -------------------------------------------------------------------------

    /**
     * @notice Anchor a payment record on-chain.
     * @param agreementId  The agreement this payment belongs to
     * @param paymentHash  SHA-256 of: agreementId + amount + paymentDate + upiRefId
     * @param amount       Payment amount in paise (INR * 100)
     * @param paymentDate  Unix timestamp of the payment date
     */
    function anchorPayment(
        bytes32 agreementId,
        bytes32 paymentHash,
        uint256 amount,
        uint256 paymentDate
    ) external onlyOwner {
        require(agreements[agreementId].exists, "RentalRegistry: agreement not found");
        require(paymentHash != bytes32(0), "RentalRegistry: invalid payment hash");
        require(amount > 0, "RentalRegistry: amount must be positive");

        uint256 index = paymentCount[agreementId];

        payments[agreementId][index] = PaymentRecord({
            paymentHash: paymentHash,
            amount: amount,
            paymentDate: paymentDate,
            anchoredAt: block.timestamp
        });

        paymentCount[agreementId] = index + 1;

        emit PaymentAnchored(agreementId, index, paymentHash, amount, paymentDate, block.timestamp);
    }

    // -------------------------------------------------------------------------
    // Evidence
    // -------------------------------------------------------------------------

    /**
     * @notice Anchor a property evidence bundle on-chain.
     * @param agreementId   The agreement this evidence belongs to
     * @param evidenceHash  SHA-256 of: IPFS CID + agreementId + timestamp + evidenceType
     * @param evidenceType  MOVE_IN | MOVE_OUT | MAINTENANCE | INSPECTION
     */
    function anchorEvidence(
        bytes32 agreementId,
        bytes32 evidenceHash,
        EvidenceType evidenceType
    ) external onlyOwner {
        require(agreements[agreementId].exists, "RentalRegistry: agreement not found");
        require(evidenceHash != bytes32(0), "RentalRegistry: invalid evidence hash");

        uint256 index = evidenceCount[agreementId];

        evidenceRecords[agreementId][index] = EvidenceRecord({
            evidenceHash: evidenceHash,
            evidenceType: evidenceType,
            recordedAt: block.timestamp
        });

        evidenceCount[agreementId] = index + 1;

        emit EvidenceAnchored(agreementId, index, evidenceHash, evidenceType, block.timestamp);
    }

    // -------------------------------------------------------------------------
    // Disputes
    // -------------------------------------------------------------------------

    /**
     * @notice Open a dispute on-chain.
     * @param disputeId           Unique dispute identifier
     * @param agreementId         The agreement under dispute
     * @param evidenceBundleHash  SHA-256 of the evidence bundle attached to this dispute
     */
    function openDispute(
        bytes32 disputeId,
        bytes32 agreementId,
        bytes32 evidenceBundleHash
    ) external onlyOwner {
        require(disputeId != bytes32(0), "RentalRegistry: invalid dispute ID");
        require(agreements[agreementId].exists, "RentalRegistry: agreement not found");
        require(!disputes[disputeId].exists, "RentalRegistry: dispute already exists");

        disputes[disputeId] = DisputeRecord({
            agreementId: agreementId,
            evidenceBundleHash: evidenceBundleHash,
            status: DisputeStatus.OPENED,
            resolutionHash: bytes32(0),
            openedAt: block.timestamp,
            resolvedAt: 0,
            exists: true
        });

        emit DisputeOpened(disputeId, agreementId, evidenceBundleHash, block.timestamp);
    }

    /**
     * @notice Resolve a dispute on-chain.
     * @param disputeId       The dispute to resolve
     * @param resolutionHash  SHA-256 of the resolution document
     */
    function resolveDispute(bytes32 disputeId, bytes32 resolutionHash) external onlyOwner {
        require(disputes[disputeId].exists, "RentalRegistry: dispute not found");
        require(
            disputes[disputeId].status == DisputeStatus.OPENED,
            "RentalRegistry: dispute already resolved"
        );
        require(resolutionHash != bytes32(0), "RentalRegistry: invalid resolution hash");

        disputes[disputeId].status = DisputeStatus.RESOLVED;
        disputes[disputeId].resolutionHash = resolutionHash;
        disputes[disputeId].resolvedAt = block.timestamp;

        emit DisputeResolved(disputeId, resolutionHash, block.timestamp);
    }

    // -------------------------------------------------------------------------
    // Admin
    // -------------------------------------------------------------------------

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "RentalRegistry: invalid new owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // -------------------------------------------------------------------------
    // View functions
    // -------------------------------------------------------------------------

    function getAgreement(bytes32 agreementId) external view returns (AgreementRecord memory) {
        return agreements[agreementId];
    }

    function getPayment(
        bytes32 agreementId,
        uint256 index
    ) external view returns (PaymentRecord memory) {
        require(index < paymentCount[agreementId], "RentalRegistry: payment index out of range");
        return payments[agreementId][index];
    }

    function getAllPayments(bytes32 agreementId) external view returns (PaymentRecord[] memory) {
        uint256 count = paymentCount[agreementId];
        PaymentRecord[] memory result = new PaymentRecord[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = payments[agreementId][i];
        }
        return result;
    }

    function getEvidence(
        bytes32 agreementId,
        uint256 index
    ) external view returns (EvidenceRecord memory) {
        require(index < evidenceCount[agreementId], "RentalRegistry: evidence index out of range");
        return evidenceRecords[agreementId][index];
    }

    function getAllEvidence(bytes32 agreementId) external view returns (EvidenceRecord[] memory) {
        uint256 count = evidenceCount[agreementId];
        EvidenceRecord[] memory result = new EvidenceRecord[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = evidenceRecords[agreementId][i];
        }
        return result;
    }

    function getDispute(bytes32 disputeId) external view returns (DisputeRecord memory) {
        return disputes[disputeId];
    }
}
