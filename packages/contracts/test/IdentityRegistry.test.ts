import { expect } from 'chai';
import { ethers } from 'hardhat';
import { IdentityRegistry } from '../typechain-types';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

describe('IdentityRegistry', () => {
  let identityRegistry: IdentityRegistry;
  let owner: SignerWithAddress;
  let nonOwner: SignerWithAddress;
  let userAddress: SignerWithAddress;

  // Sample test data
  const DID_HASH = ethers.id('user:rentalchain:2025-01-01'); // returns bytes32
  const DID_HASH_2 = ethers.id('user2:rentalchain:2025-01-01');
  const REPUTATION_HASH = ethers.id('{"score":8.5,"payments":12}');

  beforeEach(async () => {
    [owner, nonOwner, userAddress] = await ethers.getSigners();

    const IdentityRegistryFactory = await ethers.getContractFactory('IdentityRegistry');
    identityRegistry = (await IdentityRegistryFactory.deploy()) as IdentityRegistry;
    await identityRegistry.waitForDeployment();
  });

  // ---------------------------------------------------------------------------
  // Deployment
  // ---------------------------------------------------------------------------
  describe('Deployment', () => {
    it('should set the deployer as owner', async () => {
      expect(await identityRegistry.owner()).to.equal(owner.address);
    });
  });

  // ---------------------------------------------------------------------------
  // registerDID
  // ---------------------------------------------------------------------------
  describe('registerDID', () => {
    it('should register a DID and emit DIDRegistered event', async () => {
      await expect(identityRegistry.registerDID(DID_HASH, userAddress.address))
        .to.emit(identityRegistry, 'DIDRegistered')
        .withArgs(DID_HASH, userAddress.address, (ts: bigint) => ts > 0n);
    });

    it('should store the DID mapping correctly', async () => {
      await identityRegistry.registerDID(DID_HASH, userAddress.address);
      expect(await identityRegistry.didToAddress(DID_HASH)).to.equal(userAddress.address);
      expect(await identityRegistry.addressToDID(userAddress.address)).to.equal(DID_HASH);
      expect(await identityRegistry.isDIDRegistered(DID_HASH)).to.be.true;
    });

    it('should revert if called by non-owner', async () => {
      await expect(
        identityRegistry.connect(nonOwner).registerDID(DID_HASH, userAddress.address)
      ).to.be.revertedWith('IdentityRegistry: caller is not the owner');
    });

    it('should revert if DID hash is zero', async () => {
      await expect(
        identityRegistry.registerDID(ethers.ZeroHash, userAddress.address)
      ).to.be.revertedWith('IdentityRegistry: invalid DID hash');
    });

    it('should revert if address is zero', async () => {
      await expect(
        identityRegistry.registerDID(DID_HASH, ethers.ZeroAddress)
      ).to.be.revertedWith('IdentityRegistry: invalid address');
    });

    it('should revert if DID is already registered', async () => {
      await identityRegistry.registerDID(DID_HASH, userAddress.address);
      await expect(
        identityRegistry.registerDID(DID_HASH, userAddress.address)
      ).to.be.revertedWith('IdentityRegistry: DID already registered');
    });
  });

  // ---------------------------------------------------------------------------
  // anchorReputation
  // ---------------------------------------------------------------------------
  describe('anchorReputation', () => {
    beforeEach(async () => {
      await identityRegistry.registerDID(DID_HASH, userAddress.address);
    });

    it('should anchor reputation and emit ReputationAnchored event', async () => {
      await expect(identityRegistry.anchorReputation(DID_HASH, REPUTATION_HASH))
        .to.emit(identityRegistry, 'ReputationAnchored')
        .withArgs(DID_HASH, REPUTATION_HASH, (ts: bigint) => ts > 0n);
    });

    it('should store the latest reputation hash', async () => {
      await identityRegistry.anchorReputation(DID_HASH, REPUTATION_HASH);
      expect(await identityRegistry.getLatestReputationHash(DID_HASH)).to.equal(REPUTATION_HASH);
    });

    it('should update when reputation anchored again', async () => {
      const NEWER_HASH = ethers.id('{"score":9.0,"payments":13}');
      await identityRegistry.anchorReputation(DID_HASH, REPUTATION_HASH);
      await identityRegistry.anchorReputation(DID_HASH, NEWER_HASH);
      expect(await identityRegistry.getLatestReputationHash(DID_HASH)).to.equal(NEWER_HASH);
    });

    it('should revert if DID not registered', async () => {
      await expect(
        identityRegistry.anchorReputation(DID_HASH_2, REPUTATION_HASH)
      ).to.be.revertedWith('IdentityRegistry: DID not registered');
    });

    it('should revert if reputation hash is zero', async () => {
      await expect(
        identityRegistry.anchorReputation(DID_HASH, ethers.ZeroHash)
      ).to.be.revertedWith('IdentityRegistry: invalid reputation hash');
    });

    it('should revert if called by non-owner', async () => {
      await expect(
        identityRegistry.connect(nonOwner).anchorReputation(DID_HASH, REPUTATION_HASH)
      ).to.be.revertedWith('IdentityRegistry: caller is not the owner');
    });
  });

  // ---------------------------------------------------------------------------
  // revokeDID
  // ---------------------------------------------------------------------------
  describe('revokeDID', () => {
    beforeEach(async () => {
      await identityRegistry.registerDID(DID_HASH, userAddress.address);
    });

    it('should revoke a DID and emit DIDRevoked event', async () => {
      await expect(identityRegistry.revokeDID(DID_HASH))
        .to.emit(identityRegistry, 'DIDRevoked')
        .withArgs(DID_HASH, (ts: bigint) => ts > 0n);
    });

    it('should mark DID as not registered after revocation', async () => {
      await identityRegistry.revokeDID(DID_HASH);
      expect(await identityRegistry.isDIDRegistered(DID_HASH)).to.be.false;
    });

    it('should revert if DID not registered', async () => {
      await expect(identityRegistry.revokeDID(DID_HASH_2)).to.be.revertedWith(
        'IdentityRegistry: DID not registered'
      );
    });

    it('should revert if called by non-owner', async () => {
      await expect(
        identityRegistry.connect(nonOwner).revokeDID(DID_HASH)
      ).to.be.revertedWith('IdentityRegistry: caller is not the owner');
    });
  });

  // ---------------------------------------------------------------------------
  // transferOwnership
  // ---------------------------------------------------------------------------
  describe('transferOwnership', () => {
    it('should transfer ownership and emit event', async () => {
      await expect(identityRegistry.transferOwnership(nonOwner.address))
        .to.emit(identityRegistry, 'OwnershipTransferred')
        .withArgs(owner.address, nonOwner.address);
      expect(await identityRegistry.owner()).to.equal(nonOwner.address);
    });

    it('should revert if new owner is zero address', async () => {
      await expect(
        identityRegistry.transferOwnership(ethers.ZeroAddress)
      ).to.be.revertedWith('IdentityRegistry: invalid new owner');
    });

    it('should revert if called by non-owner', async () => {
      await expect(
        identityRegistry.connect(nonOwner).transferOwnership(nonOwner.address)
      ).to.be.revertedWith('IdentityRegistry: caller is not the owner');
    });
  });
});
