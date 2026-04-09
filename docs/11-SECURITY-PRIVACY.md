# RentalChain — Security & Privacy Design

## Privacy Principles

RentalChain handles sensitive personal data (KYC, financial records, addresses) and must comply with India's **Digital Personal Data Protection (DPDP) Act, 2023**.

### Core Privacy Rules
1. **Zero PII on blockchain** — only cryptographic hashes go on-chain
2. **Encrypted at rest** — all PII fields encrypted in PostgreSQL
3. **Minimal data collection** — collect only what is necessary
4. **Purpose limitation** — KYC data used only for identity verification
5. **Data subject rights** — users can request data export or deletion (soft-delete)
6. **Consent** — explicit consent at sign-up for data collection and blockchain anchoring

---

## Data Classification

| Data Class | Examples | Storage | Encryption |
|---|---|---|---|
| Public on-chain | Agreement hash, payment hash, DID hash | Ethereum Sepolia | N/A (public) |
| Semi-public | Property city, property type, reputation score | PostgreSQL | No |
| Private | Name, phone, email, address | PostgreSQL | AES-256 |
| Sensitive | Aadhaar, PAN, KYC documents | PostgreSQL + Cloud | AES-256 |
| Highly sensitive | Private keys (platform wallet) | Env vars / Secrets Manager | N/A |

---

## Encryption at Rest

### Application-Layer Encryption

Encrypt PII **before** writing to the database, so even a DB dump reveals nothing.

```typescript
// Encrypted columns
const ENCRYPTED_FIELDS = [
  'users.full_name',
  'users.phone',
  'users.email',
  'kyc_records.aadhaar_number',
  'kyc_records.pan_number',
  'properties.address_line1',
];

// AES-256-GCM encryption
import crypto from 'crypto';

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes

function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decrypt(ciphertext: string): string {
  const data = Buffer.from(ciphertext, 'base64');
  const iv = data.subarray(0, 16);
  const tag = data.subarray(16, 32);
  const encrypted = data.subarray(32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final('utf8');
}
```

### Key Management
- Encryption key stored in environment variable (never in code or DB)
- Production: use AWS KMS or HashiCorp Vault for key management
- Key rotation: plan for annual rotation with re-encryption migration

---

## Authentication Security

### JWT Design
```typescript
// Access token: 15 minutes
// Refresh token: 30 days (stored in httpOnly cookie)
// Refresh token rotation: new refresh token issued on each use
// Refresh token revocation: stored in DB, invalidated on logout

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '30d';
```

### OTP Security
- OTP: 6 digits, valid for 5 minutes
- Max 3 attempts before lockout (15-minute lockout)
- Rate limit: max 5 OTP requests per phone per hour
- OTPs stored hashed in DB (never plaintext)

---

## API Security

### Input Validation
All request bodies validated with Zod schemas before processing:
```typescript
const RecordPaymentSchema = z.object({
  amount: z.number().int().positive().max(100_000_000_00), // max ₹10 crore in paise
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paymentMonth: z.string().regex(/^\d{4}-\d{2}$/),
  upiRefId: z.string().max(50).optional(),
  paymentMethod: z.enum(['UPI', 'BANK_TRANSFER', 'CASH', 'CHEQUE']),
});
```

### SQL Injection Prevention
- **No raw string interpolation in SQL** — all queries use parameterised statements
- Use `pg` library with `$1, $2` parameters exclusively

```typescript
// CORRECT
const result = await db.query(
  'SELECT * FROM users WHERE phone = $1',
  [encryptedPhone]
);

// NEVER DO THIS
const result = await db.query(`SELECT * FROM users WHERE phone = '${phone}'`);
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({ windowMs: 60_000, max: 10 });     // 10/min
const apiLimiter = rateLimit({ windowMs: 60_000, max: 100 });     // 100/min
const uploadLimiter = rateLimit({ windowMs: 60_000, max: 20 });   // 20/min
const publicLimiter = rateLimit({ windowMs: 60_000, max: 60 });   // 60/min
```

### Security Headers (Helmet.js)
```typescript
import helmet from 'helmet';
app.use(helmet());
// Sets: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection,
//       Strict-Transport-Security, Content-Security-Policy
```

### CORS
```typescript
app.use(cors({
  origin: ['https://rentalchain.in', 'https://www.rentalchain.in'],
  credentials: true,
}));
```

---

## File Upload Security

- File type validation (only JPEG, PNG, PDF allowed)
- File size limits: images max 10MB, PDFs max 5MB
- Virus scanning: consider ClamAV integration for KYC documents
- Files stored on IPFS/cloud, not on application server
- Filenames sanitised (use UUID-based names, ignore user-provided names)

---

## Smart Contract Security

### Non-Upgradability
Contracts are intentionally non-upgradable. This is a trust guarantee:
- No admin can alter past records
- No upgrade can retroactively change what was anchored

### Access Control
- All write functions gated by `onlyOwner` (platform wallet)
- No user wallet ever interacts with contracts
- Owner can be transferred (for key rotation)

### What's NOT in Contracts
- No funds stored or transferred
- No complex logic that could have bugs with financial impact
- No user data — only hashes

### Audit Plan
1. Internal review against [SWC Registry](https://swcregistry.io/)
2. Community review on Code4rena or Sherlock (Phase 2)
3. Automated analysis: Slither + Mythril
4. Key checks: reentrancy, integer overflow, access control, event emission

---

## Blockchain Key Security

### Platform Wallet
- Private key stored only in environment variables
- Never logged, never committed to git
- Production: use AWS KMS or a Hardware Security Module (HSM)
- Separate wallets for testnet and mainnet
- Monitor balance; alert if < 0.1 ETH

### Key Rotation Plan
1. Deploy new wallet
2. Call `transferOwnership(newWallet)` on both contracts
3. Update env vars
4. Decommission old wallet

---

## DPDP Act Compliance Checklist

- [x] Data collection with explicit consent (sign-up agreement)
- [x] Purpose limitation (KYC only for identity, not marketing)
- [x] Zero PII on blockchain
- [x] PII encrypted at rest
- [x] Data subject can request deletion (soft-delete + anonymisation)
- [x] Data subject can request export
- [x] Breach notification plan (notify users within 72 hours)
- [ ] Data Protection Officer (DPO) designation (required at scale)
- [ ] Privacy policy published
- [ ] Data processing agreements with third parties (Pinata, Fast2SMS, etc.)
