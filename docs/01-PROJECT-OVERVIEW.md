# RentalChain — Project Overview

## What Is RentalChain?

RentalChain is a **blockchain-based rental evidence and trust infrastructure** built for the Indian rental market. It digitises and secures the entire rental lifecycle — from agreement creation to move-out — by anchoring key rental events on the Ethereum blockchain (Sepolia testnet for MVP).

The platform does **not** replace how renting works. It makes renting verifiable, tamper-proof, and trustworthy.

---

## The Problem

India's rental market is largely informal, fragmented, and trust-deficient:

- Agreements are often verbal or on plain paper — easily altered or disputed
- Rent payments have no portable, verifiable proof
- Move-in / move-out condition is never documented objectively
- Tenants have no credit/rental history for loans, visa, or employment
- Landlords have no reliable system to vet tenants or track damage

---

## The Solution

RentalChain creates an **immutable audit trail** for every significant rental event:

| Event | What Gets Anchored |
|---|---|
| Agreement signed | SHA-256 hash of the PDF agreement |
| Rent paid | Hash of payment receipt + amount + timestamp |
| Move-in inspection | Hash of condition photos + metadata |
| Move-out inspection | Hash of condition photos + metadata |
| Maintenance request | Hash of request + resolution records |
| Dispute raised | Hash of evidence bundle + timestamps |

All **personal data and documents remain off-chain** (PostgreSQL + IPFS). Only hashes go on-chain.

---

## Platform Philosophy

| Does NOT | Does |
|---|---|
| Replace legal rental agreements | Anchors the hash of legal agreements on-chain |
| Hold user funds or deposits | Records proof of transactions made via UPI |
| Introduce crypto or tokens | Uses ETH only to pay gas for anchoring |
| Disrupt existing rental flow | Digitises and secures the existing flow |

---

## Target Users — MVP

| User | Profile |
|---|---|
| Tenant | Salaried professional, student, migrant worker |
| Landlord | Individual owner with 1–5 properties |

---

## Revenue Model

| Stream | Price |
|---|---|
| Agreement processing fee | ₹499 – ₹999 per agreement |
| Rent payment recording (optional) | 0.5% – 1% per transaction |
| Landlord subscription | ₹299 – ₹999/month |
| Dispute resolution service | Premium fast-track |
| Government SaaS (future) | Analytics + compliance dashboard |

---

## Blockchain Choice

- **Network:** Ethereum (Sepolia testnet for MVP, Ethereum mainnet for production)
- **Rationale:** Public, tamper-proof, auditable, government-aligned, widely understood
- **On-chain:** Only cryptographic hashes and event timestamps
- **Off-chain:** All documents, images, personal data

---

## Phases

| Phase | Timeline | Focus |
|---|---|---|
| MVP | 0–6 months | Single city, fiat-only, manual KYC, full lifecycle tracking |
| Blockchain Integration | 6–12 months | Ethereum mainnet, evidence anchoring, early partnerships |
| Scale | 12–24 months | Multi-city, government pilot, institutional partnerships |
