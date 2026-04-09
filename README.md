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

## Current Status

**Pre-development** — documentation complete, ready to begin Milestone 0 (project setup).

Network: **Sepolia Testnet** (MVP)
