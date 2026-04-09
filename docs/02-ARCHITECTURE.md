# RentalChain — System Architecture

## High-Level Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                          CLIENTS                                     │
│   [React Web App]              [React Native Mobile App (future)]    │
└──────────────────────┬───────────────────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼───────────────────────────────────────────────┐
│                     BACKEND API (Node.js + Express)                  │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │
│  │  Auth/KYC   │  │  Agreement  │  │  Evidence   │  │  Payment  │  │
│  │  Service    │  │  Service    │  │  Service    │  │  Service  │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │  Property   │  │  Dispute    │  │  Blockchain  │                  │
│  │  Service    │  │  Service    │  │  Service     │                  │
│  └─────────────┘  └─────────────┘  └─────────────┘                  │
└────────┬─────────────────┬─────────────────────┬────────────────────┘
         │                 │                     │
┌────────▼──────┐ ┌────────▼──────┐   ┌──────────▼────────────────────┐
│  PostgreSQL   │ │  IPFS/Cloud   │   │   Ethereum (Sepolia)           │
│  Database     │ │  Storage      │   │                                │
│               │ │               │   │  ┌──────────────────────────┐  │
│  - users      │ │  - PDFs       │   │  │  RentalRegistry.sol      │  │
│  - properties │ │  - Photos     │   │  │  IdentityRegistry.sol    │  │
│  - agreements │ │  - Documents  │   │  └──────────────────────────┘  │
│  - payments   │ └───────────────┘   └───────────────────────────────┘
│  - evidence   │
│  - disputes   │
└───────────────┘
```

---

## Layer-by-Layer Breakdown

### Layer 1 — Identity & Trust

**Purpose:** Establish verifiable user identity without storing personal data on-chain.

**Components:**
- KYC verification (Aadhaar/PAN off-chain, stored in PostgreSQL encrypted)
- Rental DID (Decentralised Identity) — a unique identifier per user, anchored on-chain
- Reputation score — computed off-chain from rental history, anchored periodically

**Flow:**
1. User signs up → submits KYC docs
2. Backend verifies → creates DID → registers DID hash on `IdentityRegistry` contract
3. Reputation updated after each rental cycle

---

### Layer 2 — Agreement Layer

**Purpose:** Create standardised, legally aligned rental agreements with blockchain proof.

**Components:**
- Auto-generated PDF agreement (filled from form inputs)
- DigiSign / e-signature (via OTP or Aadhaar eSign)
- Agreement PDF hashed (SHA-256) → hash anchored on `RentalRegistry` contract

**Flow:**
1. Landlord creates listing → Tenant applies
2. Both parties fill in agreement terms
3. Backend generates PDF → both parties e-sign
4. SHA-256 hash of signed PDF → stored in DB + anchored on-chain
5. IPFS stores the actual PDF

---

### Layer 3 — Payment Record Layer

**Purpose:** Create tamper-proof payment history without handling any funds.

**Components:**
- UPI payment made by tenant (off-platform or via integrated UPI)
- Receipt uploaded or auto-fetched
- Payment data (amount, date, UPI ref ID) hashed → anchored on-chain

**Flow:**
1. Tenant pays rent via UPI
2. Payment details entered on platform
3. Backend creates payment record → hashes it → anchors on-chain
4. Monthly payment log built up on-chain per agreement

---

### Layer 4 — Evidence Layer

**Purpose:** Time-stamped, tamper-proof property condition documentation.

**Components:**
- Move-in photo upload (tenant + landlord)
- Move-out photo upload
- Maintenance request + resolution photos
- IPFS stores images; image bundle hash anchored on-chain

**Flow:**
1. At move-in: both parties upload photos → hashed → anchored with `MOVE_IN` type
2. During tenancy: maintenance photos added with ticket ID
3. At move-out: comparison evidence package created → anchored with `MOVE_OUT` type

---

### Layer 5 — Dispute & Audit Layer

**Purpose:** Provide evidence-backed dispute resolution and full audit trail.

**Components:**
- Structured communication thread (off-chain, in DB)
- Dispute evidence bundle (pulls from on-chain hashes + off-chain files)
- Time-stamped audit log for every action on the platform

**Flow:**
1. Party raises dispute → creates evidence bundle
2. Platform mediator (or automated system) reviews on-chain evidence
3. Resolution recorded on-chain with outcome hash

---

## Data Separation — On-Chain vs Off-Chain

| Data Type | Storage | Rationale |
|---|---|---|
| Agreement hash | On-chain | Immutable proof of agreement |
| Payment proof hash | On-chain | Tamper-proof payment record |
| Evidence hash | On-chain | Undeniable condition proof |
| Dispute outcome hash | On-chain | Permanent resolution record |
| DID hash | On-chain | Portable identity |
| Agreement PDF | IPFS | Accessible but decentralised |
| Condition photos | IPFS / Cloud | Large binary, off-chain |
| User PII (name, phone, KYC) | PostgreSQL (encrypted) | Privacy compliance (DPDP Act) |
| Reputation score | PostgreSQL (anchored hash on-chain) | Computed dynamically |
| Maintenance tickets | PostgreSQL | Operational data |

---

## Security Architecture

- All PII encrypted at rest in PostgreSQL (AES-256)
- IPFS files pinned via Pinata or Web3.Storage
- Backend uses JWT for auth + refresh token rotation
- Role-based access: TENANT, LANDLORD, ADMIN, MEDIATOR
- Smart contracts: non-upgradable (immutability is a feature), owner-gated admin functions only
- Gas paid by platform (backend wallet) on behalf of users — users never touch crypto

---

## Blockchain Interaction Pattern

The platform uses a **server-side wallet** pattern for MVP:

1. Backend holds a funded Sepolia wallet (platform wallet)
2. All on-chain writes are signed by the platform wallet
3. Each anchoring call includes the `userDID` or `agreementId` as an indexed parameter
4. No user ever needs MetaMask or any wallet — zero crypto UX for end users
5. Transaction hash stored in DB linked to the rental event

This approach removes all blockchain complexity from end users while still providing full on-chain verifiability.
