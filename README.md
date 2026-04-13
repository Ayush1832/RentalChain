# RentalChain

**Blockchain-Based Rental Evidence & Trust Infrastructure for India**

RentalChain anchors key rental lifecycle events (agreements, payments, property condition evidence) on Ethereum, creating tamper-proof, portable proof of rental history — without disrupting how renting works.

---

## Documentation

| Doc | Description |
|---|---|
| [01 — Project Overview](docs/01-PROJECT-OVERVIEW.md) | What, why, who, and revenue model |
| [02 — Architecture](docs/02-ARCHITECTURE.md) | System architecture, layers, data flow |
| [03 — Smart Contracts](docs/03-SMART-CONTRACTS.md) | Solidity contract specs, events, functions |
| [04 — Database Schema](docs/04-DATABASE-SCHEMA.md) | Full PostgreSQL schema with all tables |
| [05 — API Design](docs/05-API-DESIGN.md) | All REST endpoints with request/response formats |
| [06 — Frontend Design](docs/06-FRONTEND-DESIGN.md) | Pages, routes, components, UX decisions |
| [07 — Blockchain Integration](docs/07-BLOCKCHAIN-INTEGRATION.md) | ethers.js, hashing, IPFS, gas, Sepolia |
| [08 — Implementation Plan](docs/08-IMPLEMENTATION-PLAN.md) | 6 milestones, folder structure, tech stack |
| [09 — TODO](docs/09-TODO.md) | Master task list broken down by milestone |
| [10 — Rental Lifecycle](docs/10-RENTAL-LIFECYCLE.md) | Step-by-step trace of a complete rental |
| [11 — Security & Privacy](docs/11-SECURITY-PRIVACY.md) | Encryption, auth, DPDP compliance, contract security |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Blockchain | Ethereum (Sepolia testnet → Mainnet) |
| Smart Contracts | Solidity ^0.8.20 + Hardhat |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL |
| Storage | IPFS (Pinata) + Cloud |
| Frontend | React 18 + Vite + TypeScript + Tailwind |
| Blockchain lib | ethers.js v6 |
| PDF | Puppeteer |
| OTP | Fast2SMS |

---

## Project Structure

```
rentalchain/
├── packages/
│   ├── contracts/    # Solidity smart contracts + Hardhat
│   ├── backend/      # Node.js + Express API
│   └── frontend/     # React + Vite web app
├── docs/             # All documentation
└── docker-compose.yml
```

---

## Quick Start (Local Dev)

### Prerequisites
- Node.js 20+
- Docker Desktop (for PostgreSQL)
- Git

### 1. Install dependencies
```bash
npm install
```

### 2. Start PostgreSQL
```bash
docker-compose up -d
```

### 3. Configure environment
```bash
cp packages/backend/.env.example packages/backend/.env
# Edit packages/backend/.env — at minimum set ENCRYPTION_KEY to 64 random hex chars
```

Generate a secure encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Run database migrations
```bash
cd packages/backend
psql $DATABASE_URL -f migrations/1_create_users.sql
psql $DATABASE_URL -f migrations/2_create_properties_agreements.sql
psql $DATABASE_URL -f migrations/3_create_payments_evidence_disputes.sql
psql $DATABASE_URL -f migrations/4_add_search_hashes.sql
psql $DATABASE_URL -f migrations/5_fix_kyc_status_disputes.sql
```

### 5. Start the backend
```bash
npm run dev --workspace=packages/backend
```

### 6. Start the frontend
```bash
npm run dev --workspace=packages/frontend
```

Open [http://localhost:5173](http://localhost:5173)

---

## Smart Contracts

### Compile & Test
```bash
npm run compile --workspace=packages/contracts
npm run test --workspace=packages/contracts    # 49/49 tests
```

### Deploy (Sepolia)
1. Set `SEPOLIA_RPC_URL` and `PLATFORM_WALLET_PRIVATE_KEY` in `.env`
2. Fund the wallet with Sepolia ETH from a faucet
3. `npm run deploy:sepolia --workspace=packages/contracts`
4. Copy deployed addresses to `.env` as `IDENTITY_REGISTRY_ADDRESS` and `RENTAL_REGISTRY_ADDRESS`

---

## External Services (optional for dev)

| Service | Purpose | Without it |
|---|---|---|
| Fast2SMS | OTP delivery | OTP is logged to console |
| Pinata (IPFS) | File pinning | Mock CIDs returned |
| Alchemy/Infura | Sepolia RPC | Blockchain anchoring skipped |

---

## Current Status

**MVP Development** — Milestones 0–5 complete (contracts, backend, frontend all implemented).

- Smart contracts: **49/49 tests passing**
- Backend: All routes implemented, TypeScript clean
- Frontend: All pages implemented, TypeScript clean
- Blockchain: Ready for Sepolia deployment

Network: **Sepolia Testnet** (MVP)
