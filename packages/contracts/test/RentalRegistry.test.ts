import { expect } from 'chai';
import { ethers } from 'hardhat';
import { RentalRegistry } from '../typechain-types';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

describe('RentalRegistry', () => {
  let rentalRegistry: RentalRegistry;
  let owner: SignerWithAddress;
  let nonOwner: SignerWithAddress;

  // Test data
  const AGREEMENT_ID = ethers.id('agreement-uuid-001');
  const AGREEMENT_HASH = ethers.id('sha256-of-signed-pdf');
  const LANDLORD_DID = ethers.id('landlord-did');
  const TENANT_DID = ethers.id('tenant-did');

  const PAYMENT_HASH = ethers.id('payment-hash-001');
  const AMOUNT_PAISE = 2500000n; // ₹25,000 in paise

  const EVIDENCE_HASH = ethers.id('evidence-hash-001');
  const EvidenceType = { MOVE_IN: 0, MOVE_OUT: 1, MAINTENANCE: 2, INSPECTION: 3 };

  const DISPUTE_ID = ethers.id('dispute-uuid-001');
  const EVIDENCE_BUNDLE_HASH = ethers.id('bundle-hash-001');
  const RESOLUTION_HASH = ethers.id('resolution-hash-001');

  beforeEach(async () => {
    [owner, nonOwner] = await ethers.getSigners();

    const RentalRegistryFactory = await ethers.getContractFactory('RentalRegistry');
    rentalRegistry = (await RentalRegistryFactory.deploy()) as RentalRegistry;
    await rentalRegistry.waitForDeployment();
  });

  // ---------------------------------------------------------------------------
  // Deployment
  // ---------------------------------------------------------------------------
  describe('Deployment', () => {
    it('should set the deployer as owner', async () => {
      expect(await rentalRegistry.owner()).to.equal(owner.address);
    });
  });

  // ---------------------------------------------------------------------------
  // anchorAgreement
  // ---------------------------------------------------------------------------
  describe('anchorAgreement', () => {
    it('should anchor an agreement and emit AgreementAnchored', async () => {
      await expect(
        rentalRegistry.anchorAgreement(AGREEMENT_ID, AGREEMENT_HASH, LANDLORD_DID, TENANT_DID)
      )
        .to.emit(rentalRegistry, 'AgreementAnchored')
        .withArgs(
          AGREEMENT_ID,
          AGREEMENT_HASH,
          LANDLORD_DID,
          TENANT_DID,
          (ts: bigint) => ts > 0n
        );
    });

    it('should store the agreement record correctly', async () => {
      await rentalRegistry.anchorAgreement(
        AGREEMENT_ID,
        AGREEMENT_HASH,
        LANDLORD_DID,
        TENANT_DID
      );
      const record = await rentalRegistry.getAgreement(AGREEMENT_ID);
      expect(record.agreementHash).to.equal(AGREEMENT_HASH);
      expect(record.landlordDID).to.equal(LANDLORD_DID);
      expect(record.tenantDID).to.equal(TENANT_DID);
      expect(record.exists).to.be.true;
      expect(record.anchoredAt).to.be.gt(0n);
    });

    it('should revert if called by non-owner', async () => {
      await expect(
        rentalRegistry
          .connect(nonOwner)
          .anchorAgreement(AGREEMENT_ID, AGREEMENT_HASH, LANDLORD_DID, TENANT_DID)
      ).to.be.revertedWith('RentalRegistry: caller is not the owner');
    });

    it('should revert for zero agreement ID', async () => {
      await expect(
        rentalRegistry.anchorAgreement(ethers.ZeroHash, AGREEMENT_HASH, LANDLORD_DID, TENANT_DID)
      ).to.be.revertedWith('RentalRegistry: invalid agreement ID');
    });

    it('should revert for zero agreement hash', async () => {
      await expect(
        rentalRegistry.anchorAgreement(AGREEMENT_ID, ethers.ZeroHash, LANDLORD_DID, TENANT_DID)
      ).to.be.revertedWith('RentalRegistry: invalid agreement hash');
    });

    it('should revert if agreement already anchored', async () => {
      await rentalRegistry.anchorAgreement(AGREEMENT_ID, AGREEMENT_HASH, LANDLORD_DID, TENANT_DID);
      await expect(
        rentalRegistry.anchorAgreement(AGREEMENT_ID, AGREEMENT_HASH, LANDLORD_DID, TENANT_DID)
      ).to.be.revertedWith('RentalRegistry: agreement already anchored');
    });
  });

  // ---------------------------------------------------------------------------
  // anchorPayment
  // ---------------------------------------------------------------------------
  describe('anchorPayment', () => {
    beforeEach(async () => {
      await rentalRegistry.anchorAgreement(AGREEMENT_ID, AGREEMENT_HASH, LANDLORD_DID, TENANT_DID);
    });

    const paymentDate = Math.floor(Date.now() / 1000);

    it('should anchor a payment and emit PaymentAnchored', async () => {
      await expect(
        rentalRegistry.anchorPayment(AGREEMENT_ID, PAYMENT_HASH, AMOUNT_PAISE, paymentDate)
      )
        .to.emit(rentalRegistry, 'PaymentAnchored')
        .withArgs(AGREEMENT_ID, 0n, PAYMENT_HASH, AMOUNT_PAISE, paymentDate, (ts: bigint) => ts > 0n);
    });

    it('should increment payment count', async () => {
      await rentalRegistry.anchorPayment(AGREEMENT_ID, PAYMENT_HASH, AMOUNT_PAISE, paymentDate);
      const PAYMENT_HASH_2 = ethers.id('payment-hash-002');
      await rentalRegistry.anchorPayment(AGREEMENT_ID, PAYMENT_HASH_2, AMOUNT_PAISE, paymentDate);
      expect(await rentalRegistry.paymentCount(AGREEMENT_ID)).to.equal(2n);
    });

    it('should return all payments via getAllPayments', async () => {
      await rentalRegistry.anchorPayment(AGREEMENT_ID, PAYMENT_HASH, AMOUNT_PAISE, paymentDate);
      const payments = await rentalRegistry.getAllPayments(AGREEMENT_ID);
      expect(payments.length).to.equal(1);
      expect(payments[0].paymentHash).to.equal(PAYMENT_HASH);
      expect(payments[0].amount).to.equal(AMOUNT_PAISE);
    });

    it('should revert for unknown agreement', async () => {
      const UNKNOWN_ID = ethers.id('unknown-agreement');
      await expect(
        rentalRegistry.anchorPayment(UNKNOWN_ID, PAYMENT_HASH, AMOUNT_PAISE, paymentDate)
      ).to.be.revertedWith('RentalRegistry: agreement not found');
    });

    it('should revert for zero amount', async () => {
      await expect(
        rentalRegistry.anchorPayment(AGREEMENT_ID, PAYMENT_HASH, 0n, paymentDate)
      ).to.be.revertedWith('RentalRegistry: amount must be positive');
    });

    it('should revert if called by non-owner', async () => {
      await expect(
        rentalRegistry
          .connect(nonOwner)
          .anchorPayment(AGREEMENT_ID, PAYMENT_HASH, AMOUNT_PAISE, paymentDate)
      ).to.be.revertedWith('RentalRegistry: caller is not the owner');
    });
  });

  // ---------------------------------------------------------------------------
  // anchorEvidence
  // ---------------------------------------------------------------------------
  describe('anchorEvidence', () => {
    beforeEach(async () => {
      await rentalRegistry.anchorAgreement(AGREEMENT_ID, AGREEMENT_HASH, LANDLORD_DID, TENANT_DID);
    });

    it('should anchor evidence and emit EvidenceAnchored', async () => {
      await expect(
        rentalRegistry.anchorEvidence(AGREEMENT_ID, EVIDENCE_HASH, EvidenceType.MOVE_IN)
      )
        .to.emit(rentalRegistry, 'EvidenceAnchored')
        .withArgs(AGREEMENT_ID, 0n, EVIDENCE_HASH, EvidenceType.MOVE_IN, (ts: bigint) => ts > 0n);
    });

    it('should increment evidence count', async () => {
      await rentalRegistry.anchorEvidence(AGREEMENT_ID, EVIDENCE_HASH, EvidenceType.MOVE_IN);
      const EVIDENCE_HASH_2 = ethers.id('evidence-hash-002');
      await rentalRegistry.anchorEvidence(AGREEMENT_ID, EVIDENCE_HASH_2, EvidenceType.MOVE_OUT);
      expect(await rentalRegistry.evidenceCount(AGREEMENT_ID)).to.equal(2n);
    });

    it('should store correct evidence type', async () => {
      await rentalRegistry.anchorEvidence(
        AGREEMENT_ID,
        EVIDENCE_HASH,
        EvidenceType.MAINTENANCE
      );
      const record = await rentalRegistry.getEvidence(AGREEMENT_ID, 0);
      expect(record.evidenceType).to.equal(EvidenceType.MAINTENANCE);
    });

    it('should return all evidence via getAllEvidence', async () => {
      await rentalRegistry.anchorEvidence(AGREEMENT_ID, EVIDENCE_HASH, EvidenceType.MOVE_IN);
      const evidence = await rentalRegistry.getAllEvidence(AGREEMENT_ID);
      expect(evidence.length).to.equal(1);
      expect(evidence[0].evidenceHash).to.equal(EVIDENCE_HASH);
    });

    it('should revert for unknown agreement', async () => {
      const UNKNOWN_ID = ethers.id('unknown-agreement');
      await expect(
        rentalRegistry.anchorEvidence(UNKNOWN_ID, EVIDENCE_HASH, EvidenceType.MOVE_IN)
      ).to.be.revertedWith('RentalRegistry: agreement not found');
    });

    it('should revert if called by non-owner', async () => {
      await expect(
        rentalRegistry
          .connect(nonOwner)
          .anchorEvidence(AGREEMENT_ID, EVIDENCE_HASH, EvidenceType.MOVE_IN)
      ).to.be.revertedWith('RentalRegistry: caller is not the owner');
    });
  });

  // ---------------------------------------------------------------------------
  // openDispute / resolveDispute
  // ---------------------------------------------------------------------------
  describe('Disputes', () => {
    beforeEach(async () => {
      await rentalRegistry.anchorAgreement(AGREEMENT_ID, AGREEMENT_HASH, LANDLORD_DID, TENANT_DID);
    });

    it('should open a dispute and emit DisputeOpened', async () => {
      await expect(
        rentalRegistry.openDispute(DISPUTE_ID, AGREEMENT_ID, EVIDENCE_BUNDLE_HASH)
      )
        .to.emit(rentalRegistry, 'DisputeOpened')
        .withArgs(DISPUTE_ID, AGREEMENT_ID, EVIDENCE_BUNDLE_HASH, (ts: bigint) => ts > 0n);
    });

    it('should resolve a dispute and emit DisputeResolved', async () => {
      await rentalRegistry.openDispute(DISPUTE_ID, AGREEMENT_ID, EVIDENCE_BUNDLE_HASH);
      await expect(rentalRegistry.resolveDispute(DISPUTE_ID, RESOLUTION_HASH))
        .to.emit(rentalRegistry, 'DisputeResolved')
        .withArgs(DISPUTE_ID, RESOLUTION_HASH, (ts: bigint) => ts > 0n);
    });

    it('should store resolution hash after resolving', async () => {
      await rentalRegistry.openDispute(DISPUTE_ID, AGREEMENT_ID, EVIDENCE_BUNDLE_HASH);
      await rentalRegistry.resolveDispute(DISPUTE_ID, RESOLUTION_HASH);
      const record = await rentalRegistry.getDispute(DISPUTE_ID);
      expect(record.resolutionHash).to.equal(RESOLUTION_HASH);
      expect(record.resolvedAt).to.be.gt(0n);
      expect(record.status).to.equal(1); // DisputeStatus.RESOLVED
    });

    it('should revert if dispute already resolved', async () => {
      await rentalRegistry.openDispute(DISPUTE_ID, AGREEMENT_ID, EVIDENCE_BUNDLE_HASH);
      await rentalRegistry.resolveDispute(DISPUTE_ID, RESOLUTION_HASH);
      await expect(
        rentalRegistry.resolveDispute(DISPUTE_ID, RESOLUTION_HASH)
      ).to.be.revertedWith('RentalRegistry: dispute already resolved');
    });

    it('should revert if dispute already exists', async () => {
      await rentalRegistry.openDispute(DISPUTE_ID, AGREEMENT_ID, EVIDENCE_BUNDLE_HASH);
      await expect(
        rentalRegistry.openDispute(DISPUTE_ID, AGREEMENT_ID, EVIDENCE_BUNDLE_HASH)
      ).to.be.revertedWith('RentalRegistry: dispute already exists');
    });

    it('should revert if agreement not found when opening dispute', async () => {
      const UNKNOWN_AGREEMENT = ethers.id('unknown-agreement');
      await expect(
        rentalRegistry.openDispute(DISPUTE_ID, UNKNOWN_AGREEMENT, EVIDENCE_BUNDLE_HASH)
      ).to.be.revertedWith('RentalRegistry: agreement not found');
    });

    it('should revert openDispute if called by non-owner', async () => {
      await expect(
        rentalRegistry
          .connect(nonOwner)
          .openDispute(DISPUTE_ID, AGREEMENT_ID, EVIDENCE_BUNDLE_HASH)
      ).to.be.revertedWith('RentalRegistry: caller is not the owner');
    });

    it('should revert resolveDispute if called by non-owner', async () => {
      await rentalRegistry.openDispute(DISPUTE_ID, AGREEMENT_ID, EVIDENCE_BUNDLE_HASH);
      await expect(
        rentalRegistry.connect(nonOwner).resolveDispute(DISPUTE_ID, RESOLUTION_HASH)
      ).to.be.revertedWith('RentalRegistry: caller is not the owner');
    });
  });

  // ---------------------------------------------------------------------------
  // transferOwnership
  // ---------------------------------------------------------------------------
  describe('transferOwnership', () => {
    it('should transfer ownership', async () => {
      await rentalRegistry.transferOwnership(nonOwner.address);
      expect(await rentalRegistry.owner()).to.equal(nonOwner.address);
    });

    it('should revert for zero address', async () => {
      await expect(
        rentalRegistry.transferOwnership(ethers.ZeroAddress)
      ).to.be.revertedWith('RentalRegistry: invalid new owner');
    });
  });
});
