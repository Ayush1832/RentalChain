// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IdentityRegistry
 * @notice Manages Rental DIDs (Decentralised Identities) and reputation anchors
 *         for the RentalChain platform.
 *
 * Design principles:
 * - All write functions are restricted to the platform owner wallet
 * - No personal data stored — only hashes and wallet addresses
 * - Events are the primary data source (append-only log)
 * - No funds are ever held or transferred
 */
contract IdentityRegistry {
    address public owner;

    // DID hash (bytes32) => wallet address assigned to that DID
    mapping(bytes32 => address) public didToAddress;

    // Wallet address => DID hash
    mapping(address => bytes32) public addressToDID;

    // DID hash => whether it is registered and active
    mapping(bytes32 => bool) public registeredDIDs;

    // DID hash => most recently anchored reputation hash
    mapping(bytes32 => bytes32) public latestReputationHash;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event DIDRegistered(bytes32 indexed didHash, address indexed userAddress, uint256 timestamp);

    event ReputationAnchored(bytes32 indexed didHash, bytes32 reputationHash, uint256 timestamp);

    event DIDRevoked(bytes32 indexed didHash, uint256 timestamp);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // -------------------------------------------------------------------------
    // Modifiers
    // -------------------------------------------------------------------------

    modifier onlyOwner() {
        require(msg.sender == owner, "IdentityRegistry: caller is not the owner");
        _;
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor() {
        owner = msg.sender;
    }

    // -------------------------------------------------------------------------
    // Write functions (owner only)
    // -------------------------------------------------------------------------

    /**
     * @notice Register a new DID for a user.
     * @param didHash  SHA-256 hash of the user's DID string (computed off-chain)
     * @param userAddress  The wallet address associated with this DID (platform-controlled for MVP)
     */
    function registerDID(bytes32 didHash, address userAddress) external onlyOwner {
        require(didHash != bytes32(0), "IdentityRegistry: invalid DID hash");
        require(userAddress != address(0), "IdentityRegistry: invalid address");
        require(!registeredDIDs[didHash], "IdentityRegistry: DID already registered");

        registeredDIDs[didHash] = true;
        didToAddress[didHash] = userAddress;
        addressToDID[userAddress] = didHash;

        emit DIDRegistered(didHash, userAddress, block.timestamp);
    }

    /**
     * @notice Anchor a new reputation snapshot hash for a user.
     * @param didHash       The user's DID hash
     * @param reputationHash  SHA-256 hash of the off-chain reputation JSON snapshot
     */
    function anchorReputation(bytes32 didHash, bytes32 reputationHash) external onlyOwner {
        require(registeredDIDs[didHash], "IdentityRegistry: DID not registered");
        require(reputationHash != bytes32(0), "IdentityRegistry: invalid reputation hash");

        latestReputationHash[didHash] = reputationHash;

        emit ReputationAnchored(didHash, reputationHash, block.timestamp);
    }

    /**
     * @notice Revoke a DID (e.g. for banned users).
     * @param didHash  The DID hash to revoke
     */
    function revokeDID(bytes32 didHash) external onlyOwner {
        require(registeredDIDs[didHash], "IdentityRegistry: DID not registered");

        registeredDIDs[didHash] = false;

        emit DIDRevoked(didHash, block.timestamp);
    }

    /**
     * @notice Transfer contract ownership to a new address.
     * @param newOwner  The new owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "IdentityRegistry: invalid new owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // -------------------------------------------------------------------------
    // View functions (public)
    // -------------------------------------------------------------------------

    function isDIDRegistered(bytes32 didHash) external view returns (bool) {
        return registeredDIDs[didHash];
    }

    function getAddressForDID(bytes32 didHash) external view returns (address) {
        return didToAddress[didHash];
    }

    function getDIDForAddress(address userAddress) external view returns (bytes32) {
        return addressToDID[userAddress];
    }

    function getLatestReputationHash(bytes32 didHash) external view returns (bytes32) {
        return latestReputationHash[didHash];
    }
}
