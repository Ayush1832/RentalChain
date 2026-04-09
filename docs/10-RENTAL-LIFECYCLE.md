# RentalChain — End-to-End Rental Lifecycle

This document traces every step of a rental relationship on RentalChain, showing what happens in the backend, database, blockchain, and UI at each stage.

---

## Phase 1: Onboarding

### Landlord Onboards

```
1. Opens platform → enters phone → receives OTP
2. Verifies OTP → account created (role: LANDLORD)
3. Completes profile (name, email)
4. Uploads KYC (Aadhaar + PAN)
5. Admin reviews → approves KYC
6. Platform creates DID hash
7. Platform calls IdentityRegistry.registerDID(didHash, walletAddress)
8. Landlord sees: "Rental ID: RC-L-1234 | [🔗 On-Chain Verified]"
9. Landlord creates property listing with photos
10. Photos uploaded to IPFS → CIDs stored in DB
11. Listing status: ACTIVE
```

### Tenant Onboards

```
Same flow as landlord (role: TENANT)
Tenant DID registered on-chain
Tenant browses verified property listings
```

---

## Phase 2: Pre-Agreement

### Tenant Expresses Interest

```
1. Tenant finds listing → contacts landlord (via platform messaging, Phase 2)
2. MVP: Tenant and Landlord connect off-platform, agree on terms
3. Landlord initiates agreement creation on platform
```

---

## Phase 3: Agreement Creation & Signing

### Landlord Creates Agreement

```
1. Landlord fills agreement form:
   - Select property
   - Select tenant (by phone/Rental ID)
   - Monthly rent, security deposit
   - Start date, end date
   - Notice period, rent due day

2. Backend creates agreement record (status: DRAFT)
3. Landlord reviews → clicks "Generate Agreement"
4. Backend generates PDF via Puppeteer from legal template
5. PDF uploaded to IPFS → CID stored in DB
6. Agreement status: PENDING_SIGNATURES
7. Both parties notified
```

### Both Parties Sign

```
1. Tenant opens agreement → reviews PDF (react-pdf viewer)
2. Clicks "Sign Agreement" → enters OTP (phone verification)
3. OTP verified → tenant_signed_at recorded
4. Same process for landlord

5. Both signed:
   - Backend reads PDF from IPFS
   - Computes: hash = SHA256(pdfBuffer)
   - On-chain: rentalRegistry.anchorAgreement(
       agreementId, hash, landlordDID, tenantDID
     )
   - Waits for 1 block confirmation
   - Stores: blockchain_tx_hash, on_chain_agreement_id
   - Agreement status: ACTIVE

6. Both parties see:
   "Agreement Signed & Secured on Blockchain"
   [🔗 On-Chain] TX: 0xabc... [View on Sepolia Etherscan →]
```

---

## Phase 4: Move-In

### Deposit Recorded (Off-Chain)

```
1. Tenant pays security deposit offline
2. Landlord confirms receipt in platform
3. Deposit amount stored in DB (NOT on-chain — no fund handling)
```

### Move-In Evidence

```
1. Both parties meet at property
2. Both upload move-in condition photos via platform
3. Backend:
   - Accepts photo uploads (Multer)
   - Uploads as IPFS bundle → root CID
   - Computes: hash = SHA256(CID + agreementId + timestamp + "MOVE_IN")
   - Calls: rentalRegistry.anchorEvidence(agreementId, hash, MOVE_IN)
   - Stores tx hash, evidence_index in DB

4. Both parties see:
   "Move-In Evidence Anchored on Blockchain at [timestamp]"
   Photos visible, hash verifiable
```

---

## Phase 5: Monthly Operations

### Rent Payment (Each Month)

```
1. Tenant pays rent via UPI (outside platform, OR via integrated UPI)
2. Tenant opens platform → "Record Payment"
3. Enters: amount, date, UPI ref ID, uploads receipt photo
4. Backend:
   - Creates payment record in DB
   - Computes: hash = SHA256(agreementId + amount + date + upiRefId)
   - Calls: rentalRegistry.anchorPayment(agreementId, hash, amount, date)
   - Stores tx hash, payment_index

5. Landlord gets notification → confirms receipt
6. Payment shows: [🔗 On-Chain] | TX: 0xdef...

RESULT after 12 months: 12 payment anchors = portable, verifiable rent history
```

### Maintenance Ticket

```
1. Tenant raises maintenance ticket (title, description, category, photos)
2. Ticket created in DB
3. Optional: photos uploaded as evidence with type MAINTENANCE
4. Landlord responds / resolves
5. Resolution photos uploaded as evidence
6. Ticket closed
```

---

## Phase 6: Dispute Handling (If Needed)

### Dispute Raised

```
1. Party raises dispute:
   - Type: DEPOSIT_REFUND | PROPERTY_DAMAGE | UNPAID_RENT | etc.
   - Description
   - Select evidence to attach (existing evidence records)

2. Backend:
   - Creates dispute record in DB
   - Computes: bundleHash = SHA256(agreementId + [evidenceHashes] + timestamp)
   - Calls: rentalRegistry.openDispute(disputeId, agreementId, bundleHash)
   - Stores tx hash, on_chain_dispute_id

3. Dispute shows as OPEN with on-chain anchor
4. Both parties notified
5. Assigned to platform mediator (or admin for MVP)
```

### Dispute Resolution

```
1. Mediator reviews:
   - Agreement terms (on-chain hash verifiable)
   - Payment history (on-chain anchors)
   - Move-in evidence (on-chain hash, photos on IPFS)
   - Dispute description

2. Mediator records resolution:
   - Outcome: TENANT_FAVOUR | LANDLORD_FAVOUR | MUTUAL
   - Notes
   - Uploads resolution document

3. Backend:
   - Computes: resolutionHash = SHA256(resolution document)
   - Calls: rentalRegistry.resolveDispute(disputeId, resolutionHash)
   - Stores tx hash

4. Resolution permanently on-chain — both parties have verifiable proof
```

---

## Phase 7: Move-Out

### Move-Out Evidence

```
1. Same as move-in evidence upload
2. Evidence type: MOVE_OUT
3. Anchored on-chain

4. Platform can now surface:
   - Side-by-side: Move-In photos vs Move-Out photos
   - Both with on-chain timestamps
   - Pre-existing damage vs new damage clearly distinguishable
```

### Final Settlement

```
1. Deposit refund discussed based on evidence comparison
2. If disputed → Phase 6
3. If agreed:
   - Final settlement recorded in DB
   - Agreement status: EXPIRED

4. Reputation scores updated for both parties:
   - Based on: payment history, dispute outcomes, agreement adherence
   - reputationHash anchored: identityRegistry.anchorReputation(didHash, reputationHash)
```

---

## Portable Rental History

After completing a rental, the tenant has:

- **Payment proof:** 12 on-chain payment anchors with TX hashes
- **Agreement proof:** Signed PDF on IPFS + hash on-chain
- **Condition proof:** Move-in and move-out evidence on-chain
- **Reputation score:** On-chain anchor

This is their **rental passport** — verifiable by any landlord, bank, or employer without contacting the previous landlord.

---

## Public Verification (No Login Required)

Anyone with a TX hash or agreement on-chain ID can visit:

```
https://rentalchain.in/verify/0xabc...
```

And see:
```
✅ Verified on Ethereum Sepolia

Type: Agreement Anchoring
Anchored At: 15 Jan 2025, 10:30 AM IST
Landlord DID: RC-L-1234
Tenant DID: RC-T-5678
Agreement Hash: 0xabc123...
Transaction: 0xdef456... [View on Etherscan →]

This record has been independently verified on the Ethereum blockchain.
It cannot be altered or deleted.
```
