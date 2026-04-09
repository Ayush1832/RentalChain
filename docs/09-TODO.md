# RentalChain — Master TODO

Status legend: [ ] = not started | [~] = in progress | [x] = done

---

## MILESTONE 0 — Project Setup

- [ ] Create monorepo root with npm workspaces
- [ ] Create `packages/contracts/` — Hardhat init
- [ ] Create `packages/backend/` — Express + TypeScript
- [ ] Create `packages/frontend/` — Vite + React + TypeScript
- [ ] Add `docker-compose.yml` for local PostgreSQL
- [ ] Add `.env.example` files for backend and contracts
- [ ] Configure ESLint + Prettier (shared config)
- [ ] Set up GitHub Actions CI (lint + test on push)
- [ ] Write root `README.md`

---

## MILESTONE 1 — Smart Contracts

### Contracts
- [ ] `IdentityRegistry.sol` — DID registration + reputation anchoring
- [ ] `RentalRegistry.sol` — Agreement, payment, evidence, dispute anchoring
- [ ] `onlyOwner` modifier on all write functions
- [ ] Events on every state change

### Tests (`packages/contracts/test/`)
- [ ] `IdentityRegistry.test.ts` — registerDID, anchorReputation, revokeDID
- [ ] `RentalRegistry.test.ts` — anchorAgreement, anchorPayment, anchorEvidence
- [ ] `RentalRegistry.disputes.test.ts` — openDispute, resolveDispute
- [ ] Edge cases: duplicate IDs, non-owner calls, invalid inputs

### Deployment
- [ ] `deploy.ts` script for both contracts
- [ ] Deploy to local Hardhat network (verify tests pass)
- [ ] Fund platform wallet with Sepolia test ETH
- [ ] Deploy `IdentityRegistry` to Sepolia
- [ ] Deploy `RentalRegistry` to Sepolia
- [ ] Verify both on Sepolia Etherscan (`hardhat verify`)
- [ ] Save deployed addresses to `contracts/deployments/sepolia.json`

### Backend Blockchain Service
- [ ] `BlockchainService.ts` — ethers.js wrapper for all contract calls
- [ ] Unit tests for BlockchainService (mock provider)

---

## MILESTONE 2 — Auth, KYC & Identity

### Database
- [ ] Set up PostgreSQL locally via Docker Compose
- [ ] Write migration: `users` table
- [ ] Write migration: `kyc_records` table
- [ ] Write migration: `audit_logs` table
- [ ] Write migration: `notifications` table
- [ ] Test all migrations run cleanly

### Backend — Auth
- [ ] `POST /auth/send-otp` — Fast2SMS integration
- [ ] `POST /auth/verify-otp` — create user if new, issue JWT
- [ ] `POST /auth/refresh` — refresh token rotation
- [ ] `POST /auth/logout` — revoke refresh token
- [ ] JWT middleware (authenticate + role check)
- [ ] Input validation (Zod schemas)
- [ ] Tests for all auth endpoints

### Backend — Users & KYC
- [ ] `GET /users/me` — current user profile
- [ ] `PUT /users/me` — update profile
- [ ] `POST /users/me/kyc` — submit KYC (file upload via Multer)
- [ ] `GET /users/me/reputation` — reputation details
- [ ] `GET /users/:id/public-profile` — public DID-based profile
- [ ] Admin: `GET /admin/kyc/pending`
- [ ] Admin: `POST /admin/kyc/:userId/approve` — triggers DID creation
- [ ] Admin: `POST /admin/kyc/:userId/reject`
- [ ] DID creation flow: hash → `IdentityRegistry.registerDID()`
- [ ] Tests for KYC endpoints

### Frontend — Auth
- [ ] `LoginPage` — phone input + OTP verification
- [ ] OTP timer + resend logic
- [ ] JWT storage (httpOnly cookie or memory)
- [ ] Auth store (Zustand)
- [ ] Protected route wrapper

### Frontend — Onboarding
- [ ] `OnboardingFlow` — multi-step (role, profile, KYC upload)
- [ ] KYC document upload with preview
- [ ] KYC status polling page ("Your KYC is under review")
- [ ] DID created confirmation screen ("Your Rental ID: RC-XXXXXX")

---

## MILESTONE 3 — Property & Agreement

### Database
- [ ] Migration: `properties` table
- [ ] Migration: `property_images` table
- [ ] Migration: `rental_agreements` table

### Backend — Properties
- [ ] `POST /properties` — create listing
- [ ] `GET /properties` — search/filter
- [ ] `GET /properties/:id` — detail
- [ ] `PUT /properties/:id` — update (landlord only)
- [ ] `POST /properties/:id/images` — upload images to IPFS
- [ ] IPFSService — Pinata SDK integration
- [ ] Tests for property endpoints

### Backend — Agreements
- [ ] Agreement PDF template (HTML/CSS for Puppeteer)
- [ ] `POST /agreements` — create draft agreement
- [ ] `POST /agreements/:id/generate-pdf` — generate PDF via Puppeteer
- [ ] `POST /agreements/:id/sign` — OTP-based e-signature
- [ ] Agreement activation flow (both signed → hash → IPFS → on-chain)
- [ ] `GET /agreements` — list for current user
- [ ] `GET /agreements/:id` — detail with blockchain info
- [ ] `GET /agreements/:id/verify` — on-chain verification data
- [ ] `POST /agreements/:id/terminate`
- [ ] Tests for agreement endpoints

### Frontend — Properties
- [ ] `MyPropertiesPage` — landlord's properties list
- [ ] `CreatePropertyPage` — listing form
- [ ] `PropertyListPage` — tenant browse with filters
- [ ] `PropertyDetailPage` — photos, details, contact landlord button

### Frontend — Agreements
- [ ] `CreateAgreementPage` — agreement terms form
- [ ] `SignAgreementPage` — PDF preview + OTP signing
- [ ] `AgreementsListPage` — all user's agreements
- [ ] `AgreementDetailPage` — full detail, blockchain badge, Etherscan link

---

## MILESTONE 4 — Payments & Evidence

### Database
- [ ] Migration: `payment_records` table
- [ ] Migration: `evidence_records` table
- [ ] Migration: `maintenance_tickets` table

### Backend — Payments
- [ ] `POST /agreements/:id/payments` — record payment + hash + anchor
- [ ] `GET /agreements/:id/payments` — payment history
- [ ] `POST /payments/:id/confirm` — landlord confirms
- [ ] `GET /payments/:id/verify` — on-chain verification
- [ ] Tests for payment endpoints

### Backend — Evidence
- [ ] `POST /agreements/:id/evidence` — upload photos, bundle to IPFS, hash, anchor
- [ ] `GET /agreements/:id/evidence` — list evidence records
- [ ] `GET /evidence/:id/verify` — on-chain verification
- [ ] Tests for evidence endpoints

### Backend — Maintenance
- [ ] `POST /agreements/:id/maintenance` — raise ticket
- [ ] `GET /agreements/:id/maintenance` — list tickets
- [ ] `PUT /maintenance/:id` — update / resolve
- [ ] Tests for maintenance endpoints

### Frontend — Payments
- [ ] `RecordPaymentPage` — UPI ref, date, amount, receipt upload
- [ ] Payment list component with on-chain badges
- [ ] Landlord confirmation flow

### Frontend — Evidence
- [ ] `UploadEvidencePage` — drag-drop, type selector, description
- [ ] IPFS + blockchain anchoring progress indicator
- [ ] Evidence gallery with timestamp badges
- [ ] `EvidenceDetailPage` — photos, hash, Etherscan link

### Frontend — Maintenance
- [ ] Maintenance ticket list
- [ ] Create ticket form
- [ ] Ticket detail + resolution flow

---

## MILESTONE 5 — Disputes, Verification & Dashboards

### Database
- [ ] Migration: `disputes` table

### Backend — Disputes
- [ ] `POST /disputes` — raise dispute + anchor
- [ ] `GET /disputes` — list user's disputes
- [ ] `GET /disputes/:id` — detail
- [ ] `PUT /disputes/:id/resolve` — mediator resolves + anchor resolution
- [ ] Tests for dispute endpoints

### Backend — Public Verification
- [ ] `GET /verify/agreement/:onChainId` — public, no auth
- [ ] `GET /verify/payment/:txHash` — public, no auth
- [ ] `GET /verify/evidence/:txHash` — public, no auth

### Backend — Reputation
- [ ] Reputation score computation function
- [ ] `anchorReputation` called periodically (or after each rental cycle)

### Frontend — Dashboards
- [ ] `TenantDashboard` — active rental, quick actions, payments, reputation
- [ ] `LandlandlordDashboard` — properties, pending confirmations, income chart
- [ ] Reputation score widget (circular meter)
- [ ] Notification bell + dropdown

### Frontend — Disputes
- [ ] `CreateDisputePage` — type, description, evidence selection
- [ ] `DisputesPage` — list with status
- [ ] `DisputeDetailPage` — timeline, evidence, resolution

### Frontend — Public Verify
- [ ] `PublicVerifyPage` — input tx hash, shows on-chain data
- [ ] No-auth public page
- [ ] Hash match / tamper detection display

### Frontend — Landing Page
- [ ] Marketing landing page
- [ ] Feature sections
- [ ] CTA → Login

---

## MILESTONE 6 — Hardening & Pilot

### Security
- [ ] PII encryption at rest (all sensitive DB fields)
- [ ] Input sanitisation on all endpoints
- [ ] SQL injection prevention (parameterised queries audit)
- [ ] XSS prevention on frontend
- [ ] Rate limiting (express-rate-limit)
- [ ] CORS configuration
- [ ] Helmet.js security headers
- [ ] JWT expiry and rotation review

### Testing
- [ ] Integration tests for all critical API paths
- [ ] Smart contract audit (internal + community)
- [ ] E2E test for full rental lifecycle (Playwright or Cypress)

### Ops
- [ ] Structured logging (Winston)
- [ ] Error monitoring (Sentry)
- [ ] Platform wallet balance monitor + alert
- [ ] DB backup policy
- [ ] Health check endpoints

### Deployment
- [ ] Backend deploy to Railway/Render
- [ ] Frontend deploy to Vercel
- [ ] PostgreSQL on Supabase/Neon
- [ ] Environment variables secured
- [ ] Custom domain setup
- [ ] SSL certificates

### Pilot
- [ ] Onboard 5–10 beta users (2–3 landlords, 5–7 tenants)
- [ ] One complete rental lifecycle end-to-end with real users
- [ ] Collect feedback
- [ ] Fix critical bugs

---

## ONGOING

- [ ] Sepolia faucet top-up (platform wallet)
- [ ] IPFS pin health monitoring
- [ ] Etherscan tx tracking for failed anchoring jobs
- [ ] User support flow (email / WhatsApp)
