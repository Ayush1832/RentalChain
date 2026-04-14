# RentalChain — Remaining Items

All code for Milestones 0–5 is complete. These items are left to complete Milestone 6 (Hardening & Pilot).

---

## Blockchain Deployment (Requires live Sepolia environment)

1. **Fund platform wallet with Sepolia test ETH**
   - Get free ETH from `sepoliafaucet.com`
   - Wallet address is derived from `PLATFORM_WALLET_PRIVATE_KEY`

2. **Deploy contracts to Sepolia**
   ```bash
   cd packages/contracts
   npx hardhat run scripts/deploy.ts --network sepolia
   ```
   This auto-generates `packages/contracts/deployments/sepolia.json`.

3. **Verify contracts on Sepolia Etherscan**
   ```bash
   npx hardhat verify --network sepolia <IDENTITY_REGISTRY_ADDRESS>
   npx hardhat verify --network sepolia <RENTAL_REGISTRY_ADDRESS>
   ```
   Requires `ETHERSCAN_API_KEY` in `packages/contracts/.env`.

4. **Copy deployed addresses to backend env**
   Set `IDENTITY_REGISTRY_ADDRESS` and `RENTAL_REGISTRY_ADDRESS` from `sepolia.json`.

---

## Testing (Milestone 6)

5. **Integration tests for all API endpoints**
   - Use Supertest + Jest for all route handlers
   - Test database: same PostgreSQL schema, separate test DB
   - Target: every route in `packages/backend/src/routes/`

6. **E2E tests — full rental lifecycle**
   - Tool: Playwright (already a peer dep in contracts, add to frontend)
   - Flow: login → onboarding → create property → create agreement → sign → record payment → upload evidence → raise dispute
   - Run against staging environment

7. **Smart contract audit**
   - Run Slither: `pip install slither-analyzer && slither packages/contracts/contracts`
   - Run Mythril: `myth analyze packages/contracts/contracts/*.sol`
   - Review against SWC Registry (https://swcregistry.io/)
   - Community review: Code4rena or Sherlock (Phase 2)

---

## Ops & Monitoring (Milestone 6)

8. **Sentry error monitoring**
   - Backend: `npm install @sentry/node` in `packages/backend`
   - Frontend: `npm install @sentry/react` in `packages/frontend`
   - Initialise in `packages/backend/src/index.ts` and `packages/frontend/src/main.tsx`
   - Set `SENTRY_DSN` env var on both Railway and Vercel

9. **Platform wallet balance monitor**
   - Cron job (or Railway cron service) that checks ETH balance every hour
   - Alert via email/Slack if balance < 0.1 ETH
   - Simple script: `ethers.provider.getBalance(wallet.address)`

10. **Database backup policy**
    - Supabase free tier: 7-day PITR (point-in-time recovery) — already covered
    - For additional safety: `pg_dump` daily via a Railway cron or GitHub Actions scheduled job

---

## Deployment (already covered in deployment guide, section for reference)

11. **Backend deployed to Railway** — see `docs/DEPLOYMENT.md`
12. **Frontend deployed to Vercel** — see `docs/DEPLOYMENT.md`
13. **PostgreSQL on Supabase** — see `docs/DEPLOYMENT.md`
14. **Environment secrets secured** — Railway + Vercel encrypted env vars

---

## Pilot

15. **Onboard 5–10 beta users**
    - 2–3 landlords, 5–7 tenants
    - Complete one full rental lifecycle end-to-end with real users
    - Collect feedback via a simple Google Form
    - Fix critical bugs before broader rollout
