# RentalChain — Frontend Design

## Tech Stack

- **Framework:** React 18 (Vite)
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Data Fetching:** TanStack Query (React Query)
- **Forms:** React Hook Form + Zod
- **Routing:** React Router v6
- **File Upload:** react-dropzone
- **PDF Viewer:** react-pdf
- **Charts:** Recharts (for landlord analytics)
- **Toast/Notifications:** react-hot-toast

---

## Application Structure

```
src/
├── app/                    # App entry, routes, providers
├── features/               # Feature-based modules
│   ├── auth/
│   ├── onboarding/
│   ├── properties/
│   ├── agreements/
│   ├── payments/
│   ├── evidence/
│   ├── maintenance/
│   ├── disputes/
│   └── dashboard/
├── components/             # Shared UI components
│   ├── ui/                 # Base components (Button, Input, Modal, etc.)
│   ├── layout/             # Header, Sidebar, Footer
│   └── blockchain/         # BlockchainBadge, TxHashLink, etc.
├── hooks/                  # Shared hooks
├── services/               # API service layer
├── stores/                 # Zustand stores
├── utils/                  # Helpers, formatters
└── types/                  # TypeScript types
```

---

## Pages & Routes

### Public Routes

| Path | Component | Description |
|---|---|---|
| `/` | `LandingPage` | Marketing landing page |
| `/verify/:txHash` | `PublicVerifyPage` | Anyone can verify a rental event |
| `/login` | `LoginPage` | Phone OTP login |

### Protected Routes (Authenticated)

| Path | Component | Who |
|---|---|---|
| `/dashboard` | `DashboardPage` | All users |
| `/onboarding` | `OnboardingFlow` | New users |
| `/kyc` | `KYCPage` | All users |
| `/properties` | `PropertyListPage` | Tenants browse |
| `/properties/:id` | `PropertyDetailPage` | Tenants |
| `/properties/my` | `MyPropertiesPage` | Landlords |
| `/properties/new` | `CreatePropertyPage` | Landlords |
| `/properties/:id/edit` | `EditPropertyPage` | Landlords |
| `/agreements` | `AgreementsListPage` | All users |
| `/agreements/:id` | `AgreementDetailPage` | All users |
| `/agreements/new` | `CreateAgreementPage` | Landlords |
| `/agreements/:id/sign` | `SignAgreementPage` | Both parties |
| `/payments` | `PaymentsPage` | All users |
| `/agreements/:id/payments/new` | `RecordPaymentPage` | Tenants |
| `/evidence/:id` | `EvidenceDetailPage` | All users |
| `/agreements/:id/evidence/upload` | `UploadEvidencePage` | All users |
| `/maintenance` | `MaintenancePage` | All users |
| `/disputes` | `DisputesPage` | All users |
| `/disputes/new` | `CreateDisputePage` | All users |
| `/profile` | `ProfilePage` | All users |

### Admin Routes

| Path | Component |
|---|---|
| `/admin` | `AdminDashboard` |
| `/admin/kyc` | `KYCReviewPage` |
| `/admin/disputes` | `AdminDisputesPage` |
| `/admin/users` | `AdminUsersPage` |

---

## Key Screens — Wireframe Descriptions

### 1. Landing Page
- Hero: "Your Rental, Secured on Blockchain"
- 3 feature blocks: Agreements, Payment Proof, Evidence
- How it works: 4-step visual
- CTA: "Get Started" → Login
- Trust badges: Ethereum, IPFS, DPDP compliant

### 2. Onboarding Flow (Steps)
```
Step 1: Role Selection (Tenant / Landlord / Both)
Step 2: Basic Profile (Name, Email)
Step 3: Phone Verification (OTP)
Step 4: KYC Upload (Aadhaar + PAN)
Step 5: DID Creation (auto, shown as "Creating your Rental ID...")
```

### 3. Dashboard

**Tenant Dashboard:**
- Active rental card (property, rent due date, days remaining)
- Quick actions: Pay Rent, Upload Evidence, Raise Ticket
- Payment history (last 3 months)
- Reputation score widget
- Active disputes (if any)

**Landlord Dashboard:**
- Properties summary (active/inactive count)
- Pending rent confirmations
- Maintenance tickets needing attention
- Monthly income chart (Recharts)
- Tenant reputation badges

### 4. Agreement Detail Page
- Agreement summary (parties, property, dates, rent)
- Signing status (landlord ✓, tenant pending)
- Blockchain anchor badge: `[On-Chain] TX: 0xabc...` → links to Sepolia Etherscan
- PDF viewer (react-pdf)
- Timeline of events (anchored at, signed at, etc.)
- Download PDF button
- "Verify on Etherscan" external link

### 5. Evidence Upload Page
- Evidence type selector (Move-In / Move-Out / Maintenance / Inspection)
- Drag-and-drop photo upload (react-dropzone)
- Preview grid of uploaded photos
- Description text area
- Submit → shows IPFS pinning progress → then blockchain anchoring progress
- Final: shows `Evidence Hash: 0x...` and Sepolia TX link

### 6. Public Verify Page (No login required)
- Input: Transaction hash or Agreement ID
- Shows: Event type, timestamp, hash, parties (by DID — no names)
- "This record was anchored on Ethereum Sepolia at [timestamp]"
- Link to Etherscan
- Green checkmark if hash matches, red X if tampered

---

## Blockchain UX Components

### BlockchainBadge
A reusable badge component shown wherever something is anchored on-chain:
```
[🔗 On-Chain Verified]  TX: 0xabc1234...  [View on Etherscan →]
```
- Shows anchoring time
- Colour: green = anchored, yellow = pending, red = failed

### AnchoringProgress
A step-by-step progress indicator shown during anchoring:
```
[✓] Generating hash
[✓] Uploading to IPFS
[⏳] Anchoring on Ethereum Sepolia...
[ ] Complete
```

### ReputationScore
A circular progress meter (0–10) with colour coding:
- 0–4: Red
- 4–7: Yellow
- 7–10: Green

---

## Mobile Responsiveness

MVP targets desktop-first with full mobile responsiveness. Key mobile flows:
- Login (OTP flow)
- Dashboard quick actions
- Record Payment
- Upload evidence (camera capture)
- View agreement status

React Native app is a Phase 2 item.

---

## No Crypto UX

Critical design constraint: **users never see wallet addresses, private keys, or gas fees**.

- Platform handles all blockchain interactions server-side
- Users only see:
  - "Your rental ID" (human-readable DID alias)
  - "Transaction hash" (shown as proof, linked to Etherscan)
  - "On-Chain Verified" badge
- Gas costs absorbed into platform fees
