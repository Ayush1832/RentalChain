# RentalChain — Implementation Plan

## Overview

MVP target: **Single city pilot, all core lifecycle features, Sepolia testnet**

The implementation is broken into 6 milestones. Each milestone produces working, deployable software.

---

## Milestone 0 — Project Setup (Week 1)

### Goal: Working monorepo with CI, linting, and test scaffolding

**Tasks:**
- [ ] Initialise monorepo structure (see Folder Structure below)
- [ ] Set up Hardhat project for smart contracts
- [ ] Set up Node.js + Express backend with TypeScript
- [ ] Set up React frontend with Vite + Tailwind
- [ ] Configure PostgreSQL with Docker Compose (local dev)
- [ ] Set up environment variable management (.env files)
- [ ] Configure ESLint + Prettier across all packages
- [ ] Set up basic CI pipeline (GitHub Actions)
- [ ] Write initial README

**Deliverable:** `npm install && docker-compose up` boots the full stack locally.

---

## Milestone 1 — Smart Contracts (Week 2)

### Goal: Deployed, tested, verified contracts on Sepolia

**Tasks:**
- [ ] Write `IdentityRegistry.sol`
- [ ] Write `RentalRegistry.sol`
- [ ] Write Hardhat tests for all contract functions
- [ ] Deploy to local Hardhat network (tests pass)
- [ ] Deploy to Sepolia testnet
- [ ] Verify both contracts on Sepolia Etherscan
- [ ] Write `BlockchainService` in backend (ethers.js wrapper)
- [ ] Write backend tests for BlockchainService

**Deliverable:** Both contracts live on Sepolia, verified, with 100% test coverage.

---

## Milestone 2 — Auth, KYC & Identity (Week 3)

### Goal: Users can register, verify KYC, and get a DID

**Tasks:**
- [ ] Set up PostgreSQL schema (all tables from DB schema doc)
- [ ] Implement phone OTP auth (Twilio/Fast2SMS)
- [ ] JWT access + refresh token flow
- [ ] User profile CRUD endpoints
- [ ] KYC upload endpoint (Aadhaar + PAN)
- [ ] Admin KYC review endpoint (approve/reject)
- [ ] DID creation on KYC approval → `IdentityRegistry.registerDID()`
- [ ] Frontend: Login page (OTP flow)
- [ ] Frontend: Onboarding flow (role selection, profile, KYC upload)
- [ ] Frontend: KYC status page

**Deliverable:** User can sign up, submit KYC, get approved, and see their Rental ID on-chain.

---

## Milestone 3 — Property & Agreement (Week 4–5)

### Goal: Landlord creates listing, tenant applies, both sign agreement, hash anchored on-chain

**Tasks:**
- [ ] Property CRUD API
- [ ] Property image upload (IPFS via Pinata)
- [ ] Property search/filter API
- [ ] Agreement creation API (from template)
- [ ] PDF generation (from agreement data using pdfkit or Puppeteer)
- [ ] E-signature via OTP (both parties)
- [ ] Agreement PDF upload to IPFS
- [ ] Agreement hash computation + on-chain anchoring
- [ ] `GET /agreements/:id/verify` endpoint
- [ ] Frontend: Create property listing
- [ ] Frontend: Property browse/search
- [ ] Frontend: Agreement creation flow
- [ ] Frontend: Agreement signing flow (both parties)
- [ ] Frontend: Agreement detail with on-chain badge + Etherscan link

**Deliverable:** A fully signed agreement with PDF on IPFS and hash on Sepolia.

---

## Milestone 4 — Payments & Evidence (Week 6–7)

### Goal: Tenant records rent payments and uploads condition evidence, both anchored on-chain

**Tasks:**
- [ ] Payment record API (create, list, confirm)
- [ ] Payment hash computation + on-chain anchoring
- [ ] Evidence upload API (multi-photo upload)
- [ ] IPFS bundle upload for evidence
- [ ] Evidence hash computation + on-chain anchoring
- [ ] Maintenance ticket CRUD
- [ ] Frontend: Record payment flow
- [ ] Frontend: Payment history list with on-chain badges
- [ ] Frontend: Evidence upload (drag-and-drop, camera)
- [ ] Frontend: Evidence gallery with blockchain timestamps
- [ ] Frontend: Maintenance tickets

**Deliverable:** Complete payment history and condition evidence trail anchored on Sepolia.

---

## Milestone 5 — Disputes, Verification & Dashboard (Week 8–9)

### Goal: Dispute flow, public verification page, polished dashboards

**Tasks:**
- [ ] Dispute creation API (with evidence bundle)
- [ ] Dispute on-chain anchoring (openDispute)
- [ ] Dispute resolution API (admin/mediator)
- [ ] Resolution on-chain anchoring (resolveDispute)
- [ ] Public verification endpoint + page (no auth)
- [ ] Reputation score computation (off-chain, anchored periodically)
- [ ] Frontend: Tenant dashboard (full)
- [ ] Frontend: Landlord dashboard (with charts)
- [ ] Frontend: Dispute flow
- [ ] Frontend: Public verify page
- [ ] Frontend: Reputation score widget

**Deliverable:** Complete rental lifecycle from onboarding to dispute resolution.

---

## Milestone 6 — Hardening, Testing & Pilot (Week 10)

### Goal: Production-ready MVP ready for single-city pilot

**Tasks:**
- [ ] Full integration tests for all API endpoints
- [ ] Smart contract audit (self-review + community review)
- [ ] Security review: JWT, input validation, SQL injection, XSS
- [ ] PII encryption at rest (AES-256 for all sensitive fields)
- [ ] Rate limiting on all endpoints
- [ ] Logging + monitoring setup (Winston + basic alerts)
- [ ] Deployment to production (Railway / Render / AWS)
- [ ] PostgreSQL on managed service (Supabase / RDS)
- [ ] Environment secrets management
- [ ] User acceptance testing (small beta group)
- [ ] Admin KYC review workflow tested end-to-end

**Deliverable:** Deployed MVP accessible to pilot users.

---

## Folder Structure

```
rentalchain/
├── packages/
│   ├── contracts/          # Hardhat smart contracts
│   │   ├── contracts/
│   │   │   ├── IdentityRegistry.sol
│   │   │   └── RentalRegistry.sol
│   │   ├── scripts/
│   │   │   └── deploy.ts
│   │   ├── test/
│   │   ├── hardhat.config.ts
│   │   └── package.json
│   │
│   ├── backend/            # Node.js + Express API
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   │   ├── blockchain/
│   │   │   │   ├── ipfs/
│   │   │   │   ├── pdf/
│   │   │   │   └── otp/
│   │   │   ├── middleware/
│   │   │   ├── models/      # DB query functions (no ORM)
│   │   │   ├── utils/
│   │   │   └── index.ts
│   │   ├── migrations/      # SQL migration files
│   │   ├── .env.example
│   │   └── package.json
│   │
│   └── frontend/           # React + Vite
│       ├── src/
│       │   ├── app/
│       │   ├── features/
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── services/
│       │   ├── stores/
│       │   └── types/
│       └── package.json
│
├── docs/                   # All documentation
├── docker-compose.yml      # Local dev: PostgreSQL
├── package.json            # Root (workspaces)
└── README.md
```

---

## Tech Stack — Final Decisions

| Layer | Choice | Reason |
|---|---|---|
| Smart Contracts | Solidity ^0.8.20 + Hardhat | Industry standard, good tooling |
| Contract testing | Hardhat + Chai | Built-in, fast |
| Backend | Node.js + Express + TypeScript | Fast development, good ecosystem |
| DB | PostgreSQL (raw queries via `pg`) | No ORM overhead, full control |
| DB migrations | node-pg-migrate | Simple, SQL-native |
| Blockchain lib | ethers.js v6 | Best TypeScript support |
| IPFS | Pinata SDK | Reliable pinning, good free tier |
| PDF generation | Puppeteer (HTML → PDF) | Best quality, flexible templates |
| OTP | Fast2SMS (Indian numbers) | Cheap, reliable for India |
| Auth | JWT (jsonwebtoken) | Simple, stateless |
| Frontend | React 18 + Vite + TypeScript | Fast, modern |
| Styling | Tailwind CSS | Rapid UI development |
| State | Zustand | Simple, no boilerplate |
| Data fetching | TanStack Query | Caching, loading states |
| File upload | Multer (backend) + react-dropzone | Standard, well-tested |
| Deployment | Railway or Render (MVP) | Simple deployment, affordable |

---

## Dependencies & External Services

| Service | Purpose | Cost |
|---|---|---|
| Infura / Alchemy | Sepolia RPC | Free tier sufficient for MVP |
| Pinata | IPFS pinning | Free tier: 1GB |
| Fast2SMS | OTP for Indian numbers | ~₹0.10 per OTP |
| Sepolia faucet | Test ETH | Free |
| Supabase / Neon | Managed PostgreSQL | Free tier for MVP |
| Railway / Render | Backend hosting | ~$5/month |
| Vercel | Frontend hosting | Free |

**MVP infrastructure cost: ~$10-15/month**
