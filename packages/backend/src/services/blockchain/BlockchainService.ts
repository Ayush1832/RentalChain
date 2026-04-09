import { ethers } from 'ethers';
import { logger } from '../../utils/logger';
import { BlockchainTxResult } from '../../types';

// ABIs — only the functions we call
const IDENTITY_REGISTRY_ABI = [
  'function registerDID(bytes32 didHash, address userAddress) external',
  'function anchorReputation(bytes32 didHash, bytes32 reputationHash) external',
  'function revokeDID(bytes32 didHash) external',
  'function isDIDRegistered(bytes32 didHash) external view returns (bool)',
  'function getAddressForDID(bytes32 didHash) external view returns (address)',
  'function getLatestReputationHash(bytes32 didHash) external view returns (bytes32)',
  'event DIDRegistered(bytes32 indexed didHash, address indexed userAddress, uint256 timestamp)',
  'event ReputationAnchored(bytes32 indexed didHash, bytes32 reputationHash, uint256 timestamp)',
];

const RENTAL_REGISTRY_ABI = [
  'function anchorAgreement(bytes32 agreementId, bytes32 agreementHash, bytes32 landlordDID, bytes32 tenantDID) external',
  'function anchorPayment(bytes32 agreementId, bytes32 paymentHash, uint256 amount, uint256 paymentDate) external',
  'function anchorEvidence(bytes32 agreementId, bytes32 evidenceHash, uint8 evidenceType) external',
  'function openDispute(bytes32 disputeId, bytes32 agreementId, bytes32 evidenceBundleHash) external',
  'function resolveDispute(bytes32 disputeId, bytes32 resolutionHash) external',
  'function getAgreement(bytes32 agreementId) external view returns (tuple(bytes32 agreementHash, bytes32 landlordDID, bytes32 tenantDID, uint256 anchoredAt, bool exists))',
  'function getAllPayments(bytes32 agreementId) external view returns (tuple(bytes32 paymentHash, uint256 amount, uint256 paymentDate, uint256 anchoredAt)[])',
  'function getAllEvidence(bytes32 agreementId) external view returns (tuple(bytes32 evidenceHash, uint8 evidenceType, uint256 recordedAt)[])',
  'function getDispute(bytes32 disputeId) external view returns (tuple(bytes32 agreementId, bytes32 evidenceBundleHash, uint8 status, bytes32 resolutionHash, uint256 openedAt, uint256 resolvedAt, bool exists))',
  'function paymentCount(bytes32 agreementId) external view returns (uint256)',
  'function evidenceCount(bytes32 agreementId) external view returns (uint256)',
];

export enum OnChainEvidenceType {
  MOVE_IN = 0,
  MOVE_OUT = 1,
  MAINTENANCE = 2,
  INSPECTION = 3,
}

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private identityRegistry: ethers.Contract;
  private rentalRegistry: ethers.Contract;

  constructor() {
    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    const privateKey = process.env.PLATFORM_WALLET_PRIVATE_KEY;
    const identityAddr = process.env.IDENTITY_REGISTRY_ADDRESS;
    const rentalAddr = process.env.RENTAL_REGISTRY_ADDRESS;

    if (!rpcUrl || !privateKey || !identityAddr || !rentalAddr) {
      logger.warn('Blockchain env vars not fully configured — BlockchainService in stub mode');
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl || 'http://localhost:8545');
    this.wallet = new ethers.Wallet(privateKey || ethers.Wallet.createRandom().privateKey, this.provider);
    this.identityRegistry = new ethers.Contract(identityAddr || ethers.ZeroAddress, IDENTITY_REGISTRY_ABI, this.wallet);
    this.rentalRegistry = new ethers.Contract(rentalAddr || ethers.ZeroAddress, RENTAL_REGISTRY_ABI, this.wallet);
  }

  // ---------------------------------------------------------------------------
  // Identity
  // ---------------------------------------------------------------------------

  async registerDID(didHash: string, userAddress: string): Promise<BlockchainTxResult> {
    logger.info(`Registering DID on-chain: ${didHash}`);
    return this.sendTx(() => this.identityRegistry.registerDID(didHash, userAddress));
  }

  async anchorReputation(didHash: string, reputationHash: string): Promise<BlockchainTxResult> {
    logger.info(`Anchoring reputation for DID: ${didHash}`);
    return this.sendTx(() => this.identityRegistry.anchorReputation(didHash, reputationHash));
  }

  // ---------------------------------------------------------------------------
  // Agreements
  // ---------------------------------------------------------------------------

  async anchorAgreement(
    agreementId: string,
    agreementHash: string,
    landlordDID: string,
    tenantDID: string
  ): Promise<BlockchainTxResult> {
    logger.info(`Anchoring agreement on-chain: ${agreementId}`);
    return this.sendTx(() =>
      this.rentalRegistry.anchorAgreement(agreementId, agreementHash, landlordDID, tenantDID)
    );
  }

  // ---------------------------------------------------------------------------
  // Payments
  // ---------------------------------------------------------------------------

  async anchorPayment(
    agreementId: string,
    paymentHash: string,
    amountPaise: number,
    paymentDate: Date
  ): Promise<BlockchainTxResult> {
    const paymentTimestamp = Math.floor(paymentDate.getTime() / 1000);
    logger.info(`Anchoring payment for agreement: ${agreementId}`);
    return this.sendTx(() =>
      this.rentalRegistry.anchorPayment(agreementId, paymentHash, amountPaise, paymentTimestamp)
    );
  }

  // ---------------------------------------------------------------------------
  // Evidence
  // ---------------------------------------------------------------------------

  async anchorEvidence(
    agreementId: string,
    evidenceHash: string,
    evidenceType: OnChainEvidenceType
  ): Promise<BlockchainTxResult> {
    logger.info(`Anchoring evidence (type=${evidenceType}) for agreement: ${agreementId}`);
    return this.sendTx(() =>
      this.rentalRegistry.anchorEvidence(agreementId, evidenceHash, evidenceType)
    );
  }

  // ---------------------------------------------------------------------------
  // Disputes
  // ---------------------------------------------------------------------------

  async openDispute(
    disputeId: string,
    agreementId: string,
    evidenceBundleHash: string
  ): Promise<BlockchainTxResult> {
    logger.info(`Opening dispute on-chain: ${disputeId}`);
    return this.sendTx(() =>
      this.rentalRegistry.openDispute(disputeId, agreementId, evidenceBundleHash)
    );
  }

  async resolveDispute(disputeId: string, resolutionHash: string): Promise<BlockchainTxResult> {
    logger.info(`Resolving dispute on-chain: ${disputeId}`);
    return this.sendTx(() => this.rentalRegistry.resolveDispute(disputeId, resolutionHash));
  }

  // ---------------------------------------------------------------------------
  // Read (verification)
  // ---------------------------------------------------------------------------

  async getAgreement(agreementId: string) {
    return this.rentalRegistry.getAgreement(agreementId);
  }

  async getPayments(agreementId: string) {
    return this.rentalRegistry.getAllPayments(agreementId);
  }

  async getEvidence(agreementId: string) {
    return this.rentalRegistry.getAllEvidence(agreementId);
  }

  async getDispute(disputeId: string) {
    return this.rentalRegistry.getDispute(disputeId);
  }

  async isDIDRegistered(didHash: string): Promise<boolean> {
    return this.identityRegistry.isDIDRegistered(didHash);
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private async sendTx(
    fn: () => Promise<ethers.TransactionResponse>,
    maxRetries = 3
  ): Promise<BlockchainTxResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const tx = await fn();
        const receipt = await tx.wait(1);
        if (!receipt) throw new Error('Transaction receipt is null');

        logger.info(`TX confirmed: ${receipt.hash} (block ${receipt.blockNumber})`);
        return {
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          timestamp: Date.now(),
          gasUsed: receipt.gasUsed.toString(),
        };
      } catch (err) {
        lastError = err as Error;
        logger.warn(`TX attempt ${attempt}/${maxRetries} failed: ${lastError.message}`);
        if (attempt < maxRetries) {
          await this.sleep(1000 * attempt); // 1s, 2s backoff
        }
      }
    }

    throw Object.assign(new Error(`Blockchain transaction failed: ${lastError?.message}`), {
      code: 'BLOCKCHAIN_ERROR',
      statusCode: 500,
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton
export const blockchainService = new BlockchainService();
