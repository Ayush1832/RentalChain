# RentalChain — Blockchain Integration Guide

## Network: Ethereum Sepolia (MVP)

| Parameter | Value |
|---|---|
| Network | Sepolia Testnet |
| Chain ID | 11155111 |
| RPC | Infura / Alchemy Sepolia endpoint |
| Explorer | https://sepolia.etherscan.io |
| Native token | Sepolia ETH (free from faucets) |
| Production | Ethereum Mainnet (Phase 2) |

---

## Integration Pattern: Server-Side Wallet

The backend holds a **platform wallet** that signs and broadcasts all transactions.
End users have zero blockchain exposure.

```
User Action (e.g. "Sign Agreement")
         ↓
  Backend API receives request
         ↓
  Backend computes hash (SHA-256)
         ↓
  Backend calls ethers.js with platform wallet
         ↓
  Transaction broadcast to Sepolia
         ↓
  Wait for 1 confirmation
         ↓
  Store tx hash in PostgreSQL
         ↓
  Return response to user with tx hash
```

---

## Backend Blockchain Service

### Dependencies

```json
{
  "ethers": "^6.x",
  "dotenv": "^16.x"
}
```

### Environment Variables

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
PLATFORM_WALLET_PRIVATE_KEY=0x...
RENTAL_REGISTRY_ADDRESS=0x...
IDENTITY_REGISTRY_ADDRESS=0x...
```

### BlockchainService Class Structure

```typescript
class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private rentalRegistry: ethers.Contract;
  private identityRegistry: ethers.Contract;

  // Identity
  async registerDID(didHash: string, userAddress: string): Promise<TxResult>
  async anchorReputation(didHash: string, reputationHash: string): Promise<TxResult>

  // Agreement
  async anchorAgreement(
    agreementId: string,
    agreementHash: string,
    landlordDID: string,
    tenantDID: string
  ): Promise<TxResult>

  // Payment
  async anchorPayment(
    agreementId: string,
    paymentHash: string,
    amountPaise: number,
    paymentDate: Date
  ): Promise<TxResult>

  // Evidence
  async anchorEvidence(
    agreementId: string,
    evidenceHash: string,
    evidenceType: EvidenceType
  ): Promise<TxResult>

  // Dispute
  async openDispute(
    disputeId: string,
    agreementId: string,
    evidenceBundleHash: string
  ): Promise<TxResult>

  async resolveDispute(
    disputeId: string,
    resolutionHash: string
  ): Promise<TxResult>

  // Verification (read-only)
  async verifyAgreement(onChainAgreementId: string): Promise<AgreementRecord>
  async getPaymentHistory(agreementId: string): Promise<PaymentRecord[]>
  async getEvidenceHistory(agreementId: string): Promise<EvidenceRecord[]>
}
```

### TxResult Type

```typescript
interface TxResult {
  txHash: string;
  blockNumber: number;
  timestamp: number;
  gasUsed: string;
}
```

---

## Hashing Implementation

All hashes computed in Node.js before anchoring:

```typescript
import crypto from 'crypto';

// Agreement hash
function hashAgreementPDF(pdfBuffer: Buffer): string {
  return '0x' + crypto.createHash('sha256').update(pdfBuffer).digest('hex');
}

// Payment hash
function hashPayment(data: {
  agreementId: string;
  amount: number;        // in paise
  paymentDate: string;   // ISO date
  upiRefId: string;
}): string {
  const input = JSON.stringify(data);
  return '0x' + crypto.createHash('sha256').update(input).digest('hex');
}

// Evidence hash
function hashEvidence(data: {
  agreementId: string;
  ipfsCid: string;
  timestamp: number;
  evidenceType: string;
}): string {
  const input = JSON.stringify(data);
  return '0x' + crypto.createHash('sha256').update(input).digest('hex');
}

// DID hash
function hashDID(userId: string, createdAt: Date): string {
  const input = `${userId}:rentalchain:${createdAt.toISOString()}`;
  return '0x' + crypto.createHash('sha256').update(input).digest('hex');
}
```

---

## IPFS Integration

Files (PDFs, photos) stored on IPFS via Pinata or Web3.Storage.

```typescript
class IPFSService {
  // Upload single file, returns CID
  async uploadFile(buffer: Buffer, filename: string): Promise<string>

  // Upload multiple files as a directory, returns root CID
  async uploadBundle(files: { name: string; buffer: Buffer }[]): Promise<string>

  // Get URL to access file
  getGatewayURL(cid: string): string  // e.g. https://gateway.pinata.cloud/ipfs/{cid}
}
```

IPFS CID is stored in PostgreSQL. The hash anchored on-chain is:
```
SHA256(CID + agreementId + timestamp + evidenceType)
```

---

## Agreement Anchoring Flow (Full)

```
1. Both parties have signed (OTP verified)
2. Backend generates final PDF from template
3. PDF hashed: hash = SHA256(pdfBuffer)
4. PDF uploaded to IPFS: cid = await ipfs.uploadFile(pdfBuffer)
5. Agreement record updated in DB: pdf_ipfs_cid = cid, agreement_hash = hash
6. On-chain anchoring:
   const onChainId = ethers.id(agreementId)  // bytes32
   const tx = await rentalRegistry.anchorAgreement(
     onChainId, hash, landlordDIDHash, tenantDIDHash
   )
   const receipt = await tx.wait(1)
7. DB updated: blockchain_tx_hash, blockchain_anchored_at, on_chain_agreement_id
8. Response returned to both parties with tx hash
```

---

## Evidence Anchoring Flow (Full)

```
1. User uploads photos (multipart form)
2. Photos uploaded to IPFS as bundle: rootCid = await ipfs.uploadBundle(photos)
3. Evidence hash computed:
   hash = SHA256(rootCid + agreementId + Date.now() + evidenceType)
4. Evidence record created in DB
5. On-chain anchoring:
   const tx = await rentalRegistry.anchorEvidence(
     onChainAgreementId, hash, EvidenceType.MOVE_IN
   )
   const receipt = await tx.wait(1)
6. DB updated with tx hash and evidence_index
```

---

## Transaction Retry & Error Handling

```typescript
async function anchorWithRetry(
  fn: () => Promise<ethers.TransactionResponse>,
  maxRetries = 3
): Promise<TxResult> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const tx = await fn();
      const receipt = await tx.wait(1);
      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        timestamp: Date.now(),
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await sleep(2000 * (i + 1));  // exponential backoff
    }
  }
}
```

Failed anchoring jobs are queued for retry. DB record is created first with `blockchain_tx_hash = NULL`, then updated on success.

---

## Gas Management (MVP)

- Platform wallet funded with Sepolia ETH from faucets (free for MVP)
- Monitoring: alert if platform wallet balance < 0.1 ETH
- For mainnet (Phase 2): gas costs estimated and included in platform fees
  - ~₹2-5 per anchoring transaction at average gas prices
  - Batch anchoring considered to reduce costs

---

## Etherscan Verification (Smart Contracts)

After deployment:
```bash
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS "constructor_arg1"
```

Verified contracts allow anyone to:
- Read source code on Etherscan
- Call view functions directly
- See all events emitted

This is a core trust feature — anyone can verify the contracts are doing what we claim.

---

## Event Indexing (Future)

For production, events should be indexed for fast querying:
- **The Graph** protocol — create a subgraph for RentalRegistry events
- Allows frontend to query all events by agreementId without scanning all blocks
- Also enables public dashboards and analytics

For MVP: events queried directly via ethers.js filter on demand.
