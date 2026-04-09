# RentalChain — Smart Contract Specifications

## Overview

Two smart contracts for MVP on Ethereum Sepolia:

| Contract | Responsibility |
|---|---|
| `IdentityRegistry.sol` | User DID registration and reputation anchoring |
| `RentalRegistry.sol` | All rental event anchoring (agreements, payments, evidence, disputes) |

**Key Design Principle:**
- Contracts are **append-only event logs** — they emit events and store minimal state
- No funds are held by any contract
- No user data stored — only hashes and timestamps
- Platform wallet is the sole authorized caller for write functions (MVP simplification)

---

## Contract 1: IdentityRegistry.sol

### Purpose
Register and manage user Decentralised Identities (DIDs) on-chain.

### State Variables

```solidity
address public owner;
mapping(bytes32 => address) public didToAddress;      // DID hash => wallet address
mapping(address => bytes32) public addressToDID;       // wallet address => DID hash
mapping(bytes32 => uint256) public reputationAnchors;  // DID hash => last anchored reputation hash
mapping(bytes32 => bool) public registeredDIDs;
```

### Events

```solidity
event DIDRegistered(
    bytes32 indexed didHash,
    address indexed userAddress,
    uint256 timestamp
);

event ReputationAnchored(
    bytes32 indexed didHash,
    bytes32 reputationHash,      // hash of off-chain reputation data
    uint256 timestamp
);

event DIDRevoked(
    bytes32 indexed didHash,
    uint256 timestamp
);
```

### Functions

```solidity
// Register a new DID for a user
// Only callable by platform (owner)
function registerDID(bytes32 didHash, address userAddress) external onlyOwner

// Anchor updated reputation snapshot hash
// Only callable by platform (owner)
function anchorReputation(bytes32 didHash, bytes32 reputationHash) external onlyOwner

// Revoke a DID (banned user, etc.)
function revokeDID(bytes32 didHash) external onlyOwner

// View functions
function isDIDRegistered(bytes32 didHash) external view returns (bool)
function getAddressForDID(bytes32 didHash) external view returns (address)
```

---

## Contract 2: RentalRegistry.sol

### Purpose
Anchor all rental lifecycle events on-chain with immutable timestamps.

### Evidence Types (Enum)

```solidity
enum EvidenceType {
    MOVE_IN,
    MOVE_OUT,
    MAINTENANCE,
    INSPECTION
}

enum DisputeStatus {
    OPENED,
    RESOLVED,
    CLOSED
}
```

### State Variables

```solidity
address public owner;

// agreementId => AgreementRecord
mapping(bytes32 => AgreementRecord) public agreements;

// agreementId => paymentIndex => PaymentRecord
mapping(bytes32 => mapping(uint256 => PaymentRecord)) public payments;
mapping(bytes32 => uint256) public paymentCount;

// agreementId => evidenceIndex => EvidenceRecord
mapping(bytes32 => mapping(uint256 => EvidenceRecord)) public evidenceRecords;
mapping(bytes32 => uint256) public evidenceCount;

// disputeId => DisputeRecord
mapping(bytes32 => DisputeRecord) public disputes;
```

### Structs

```solidity
struct AgreementRecord {
    bytes32 agreementHash;      // SHA-256 of the signed PDF
    bytes32 landlordDID;
    bytes32 tenantDID;
    uint256 anchoredAt;
    bool exists;
}

struct PaymentRecord {
    bytes32 paymentHash;        // hash of: agreementId + amount + date + UPI ref
    uint256 amount;             // in paise (INR * 100) for integer precision
    uint256 paymentDate;        // unix timestamp
    uint256 anchoredAt;
}

struct EvidenceRecord {
    bytes32 evidenceHash;       // hash of IPFS CID bundle
    EvidenceType evidenceType;
    uint256 recordedAt;
}

struct DisputeRecord {
    bytes32 agreementId;
    bytes32 evidenceBundleHash;
    DisputeStatus status;
    bytes32 resolutionHash;     // hash of resolution document, if resolved
    uint256 openedAt;
    uint256 resolvedAt;
}
```

### Events

```solidity
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
```

### Functions

```solidity
// Anchor a new signed agreement
function anchorAgreement(
    bytes32 agreementId,
    bytes32 agreementHash,
    bytes32 landlordDID,
    bytes32 tenantDID
) external onlyOwner

// Anchor a payment record
function anchorPayment(
    bytes32 agreementId,
    bytes32 paymentHash,
    uint256 amount,
    uint256 paymentDate
) external onlyOwner

// Anchor evidence (move-in, move-out, maintenance, inspection)
function anchorEvidence(
    bytes32 agreementId,
    bytes32 evidenceHash,
    EvidenceType evidenceType
) external onlyOwner

// Open a dispute
function openDispute(
    bytes32 disputeId,
    bytes32 agreementId,
    bytes32 evidenceBundleHash
) external onlyOwner

// Resolve a dispute
function resolveDispute(
    bytes32 disputeId,
    bytes32 resolutionHash
) external onlyOwner

// View functions
function getAgreement(bytes32 agreementId) external view returns (AgreementRecord memory)
function getPayment(bytes32 agreementId, uint256 index) external view returns (PaymentRecord memory)
function getPaymentCount(bytes32 agreementId) external view returns (uint256)
function getEvidence(bytes32 agreementId, uint256 index) external view returns (EvidenceRecord memory)
function getEvidenceCount(bytes32 agreementId) external view returns (uint256)
function getDispute(bytes32 disputeId) external view returns (DisputeRecord memory)
```

---

## Hashing Standards

All hashes are computed off-chain by the backend before anchoring:

| Entity | Hash Input |
|---|---|
| Agreement | `SHA256(PDF binary)` |
| Payment | `SHA256(agreementId + amount + paymentDate + upiRefId)` |
| Evidence | `SHA256(IPFS_CID + agreementId + timestamp + type)` |
| DID | `SHA256(userId + platform + createdAt)` |
| Reputation | `SHA256(JSON of reputation snapshot)` |
| Dispute bundle | `SHA256(agreementId + [evidenceHashes] + timestamp)` |

---

## Gas Estimates (Sepolia)

| Function | Estimated Gas |
|---|---|
| `registerDID` | ~50,000 |
| `anchorAgreement` | ~80,000 |
| `anchorPayment` | ~65,000 |
| `anchorEvidence` | ~60,000 |
| `openDispute` | ~70,000 |
| `resolveDispute` | ~50,000 |

At Sepolia these are free (test ETH). For mainnet, gas costs will be factored into platform fees.

---

## Deployment Plan

1. Write contracts in Solidity (^0.8.20)
2. Test with Hardhat on local network
3. Deploy to Sepolia testnet
4. Store deployed addresses in backend `.env`
5. Verify contracts on Etherscan (Sepolia)
6. Backend interacts via ethers.js

---

## Security Considerations

- `onlyOwner` modifier restricts all write functions to the platform wallet
- No `payable` functions — no ETH can be sent to or stored in contracts
- All mappings return default values (not reverts) for unknown IDs — checked via `exists` flag or count
- Events are the primary data source — contracts optimised for event emission over storage
- No upgradability — immutability is a core trust guarantee
