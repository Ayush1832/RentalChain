# RentalChain — Database Schema (PostgreSQL)

## Design Principles

- All PII (name, phone, Aadhaar, PAN) stored **encrypted at rest** (AES-256 via application-layer encryption)
- Blockchain transaction hashes stored alongside every on-chain event for easy cross-referencing
- UUIDs used as primary keys throughout
- Soft-deletes only (no hard delete of rental records)

---

## Tables

### users

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone           TEXT NOT NULL UNIQUE,           -- encrypted
    email           TEXT UNIQUE,                    -- encrypted, optional
    full_name       TEXT NOT NULL,                  -- encrypted
    role            TEXT NOT NULL CHECK (role IN ('TENANT', 'LANDLORD', 'BOTH', 'ADMIN', 'MEDIATOR')),
    did_hash        TEXT UNIQUE,                    -- bytes32 hex, set after DID registration
    kyc_status      TEXT NOT NULL DEFAULT 'PENDING'
                    CHECK (kyc_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
    kyc_verified_at TIMESTAMPTZ,
    reputation_score NUMERIC(4,2) DEFAULT 0.00,    -- 0.00 to 10.00
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### kyc_records

```sql
CREATE TABLE kyc_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    aadhaar_number  TEXT,                           -- encrypted, last 4 digits visible
    pan_number      TEXT,                           -- encrypted
    aadhaar_verified BOOLEAN DEFAULT FALSE,
    pan_verified    BOOLEAN DEFAULT FALSE,
    verification_method TEXT,                       -- 'MANUAL', 'AADHAAR_OTP', 'DIGILOCKER'
    verified_by     UUID REFERENCES users(id),      -- admin who verified (if manual)
    verified_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### properties

```sql
CREATE TABLE properties (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id     UUID NOT NULL REFERENCES users(id),
    title           TEXT NOT NULL,
    description     TEXT,
    address_line1   TEXT NOT NULL,                  -- encrypted
    address_line2   TEXT,
    city            TEXT NOT NULL,
    state           TEXT NOT NULL,
    pincode         TEXT NOT NULL,
    property_type   TEXT NOT NULL CHECK (property_type IN ('APARTMENT', 'HOUSE', 'PG', 'COMMERCIAL')),
    bedrooms        INTEGER,
    bathrooms       INTEGER,
    area_sqft       INTEGER,
    monthly_rent    INTEGER NOT NULL,               -- in paise (INR * 100)
    security_deposit INTEGER,                       -- in paise
    is_furnished    BOOLEAN DEFAULT FALSE,
    amenities       JSONB DEFAULT '[]',
    listing_status  TEXT NOT NULL DEFAULT 'DRAFT'
                    CHECK (listing_status IN ('DRAFT', 'ACTIVE', 'RENTED', 'INACTIVE')),
    is_verified     BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### property_images

```sql
CREATE TABLE property_images (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID NOT NULL REFERENCES properties(id),
    ipfs_cid        TEXT NOT NULL,
    cloud_url       TEXT,
    is_primary      BOOLEAN DEFAULT FALSE,
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### rental_agreements

```sql
CREATE TABLE rental_agreements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID NOT NULL REFERENCES properties(id),
    landlord_id     UUID NOT NULL REFERENCES users(id),
    tenant_id       UUID NOT NULL REFERENCES users(id),

    -- Terms
    monthly_rent    INTEGER NOT NULL,               -- in paise
    security_deposit INTEGER NOT NULL,              -- in paise
    start_date      DATE NOT NULL,
    end_date        DATE,
    notice_period_days INTEGER DEFAULT 30,
    rent_due_day    INTEGER DEFAULT 1,              -- day of month rent is due

    -- Agreement document
    pdf_ipfs_cid    TEXT,                           -- IPFS CID of signed PDF
    pdf_cloud_url   TEXT,
    agreement_hash  TEXT,                           -- SHA-256 of the signed PDF

    -- Signing
    landlord_signed_at  TIMESTAMPTZ,
    tenant_signed_at    TIMESTAMPTZ,
    landlord_sign_method TEXT,                      -- 'OTP', 'AADHAAR_ESIGN'
    tenant_sign_method   TEXT,

    -- Blockchain
    blockchain_tx_hash  TEXT,                       -- Sepolia tx hash
    blockchain_anchored_at TIMESTAMPTZ,
    on_chain_agreement_id TEXT,                     -- bytes32 hex agreement ID

    -- Status
    status          TEXT NOT NULL DEFAULT 'DRAFT'
                    CHECK (status IN ('DRAFT', 'PENDING_SIGNATURES', 'ACTIVE', 'EXPIRED', 'TERMINATED')),
    terminated_at   TIMESTAMPTZ,
    termination_reason TEXT,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### payment_records

```sql
CREATE TABLE payment_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agreement_id    UUID NOT NULL REFERENCES rental_agreements(id),
    tenant_id       UUID NOT NULL REFERENCES users(id),
    landlord_id     UUID NOT NULL REFERENCES users(id),

    -- Payment details
    amount          INTEGER NOT NULL,               -- in paise
    payment_date    DATE NOT NULL,
    payment_month   TEXT NOT NULL,                  -- 'YYYY-MM' e.g. '2025-01'
    upi_ref_id      TEXT,
    payment_method  TEXT DEFAULT 'UPI'
                    CHECK (payment_method IN ('UPI', 'BANK_TRANSFER', 'CASH', 'CHEQUE')),
    notes           TEXT,

    -- Receipt
    receipt_ipfs_cid TEXT,
    receipt_cloud_url TEXT,

    -- Hash & blockchain
    payment_hash    TEXT NOT NULL,                  -- SHA-256 of payment data
    blockchain_tx_hash TEXT,
    blockchain_anchored_at TIMESTAMPTZ,
    payment_index   INTEGER,                        -- index in on-chain mapping

    -- Status
    status          TEXT NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING', 'CONFIRMED', 'DISPUTED')),
    confirmed_by_landlord_at TIMESTAMPTZ,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### evidence_records

```sql
CREATE TABLE evidence_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agreement_id    UUID NOT NULL REFERENCES rental_agreements(id),
    uploaded_by     UUID NOT NULL REFERENCES users(id),

    -- Type
    evidence_type   TEXT NOT NULL
                    CHECK (evidence_type IN ('MOVE_IN', 'MOVE_OUT', 'MAINTENANCE', 'INSPECTION')),

    -- Files
    ipfs_cid_bundle TEXT NOT NULL,                  -- CID of the folder/bundle of images
    cloud_urls      JSONB DEFAULT '[]',             -- array of cloud URLs
    description     TEXT,

    -- Hash & blockchain
    evidence_hash   TEXT NOT NULL,                  -- SHA-256 of IPFS bundle + metadata
    blockchain_tx_hash TEXT,
    blockchain_anchored_at TIMESTAMPTZ,
    evidence_index  INTEGER,                        -- index in on-chain mapping

    -- Linked ticket (for maintenance)
    maintenance_ticket_id UUID,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### maintenance_tickets

```sql
CREATE TABLE maintenance_tickets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agreement_id    UUID NOT NULL REFERENCES rental_agreements(id),
    raised_by       UUID NOT NULL REFERENCES users(id),

    title           TEXT NOT NULL,
    description     TEXT NOT NULL,
    category        TEXT CHECK (category IN ('PLUMBING', 'ELECTRICAL', 'APPLIANCE', 'STRUCTURAL', 'OTHER')),
    priority        TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),

    status          TEXT NOT NULL DEFAULT 'OPEN'
                    CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),

    resolved_at     TIMESTAMPTZ,
    resolution_notes TEXT,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### disputes

```sql
CREATE TABLE disputes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agreement_id    UUID NOT NULL REFERENCES rental_agreements(id),
    raised_by       UUID NOT NULL REFERENCES users(id),
    against_user_id UUID NOT NULL REFERENCES users(id),

    dispute_type    TEXT NOT NULL
                    CHECK (dispute_type IN ('DEPOSIT_REFUND', 'PROPERTY_DAMAGE', 'UNPAID_RENT', 'AGREEMENT_BREACH', 'OTHER')),
    description     TEXT NOT NULL,

    -- Evidence bundle
    evidence_bundle_hash TEXT,                      -- hash of all attached evidence
    attached_evidence_ids UUID[],                   -- array of evidence_record IDs

    -- Blockchain
    on_chain_dispute_id TEXT,                       -- bytes32 hex
    blockchain_tx_hash  TEXT,
    blockchain_anchored_at TIMESTAMPTZ,

    -- Resolution
    status          TEXT NOT NULL DEFAULT 'OPEN'
                    CHECK (status IN ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED')),
    resolution_outcome TEXT CHECK (resolution_outcome IN ('TENANT_FAVOUR', 'LANDLORD_FAVOUR', 'MUTUAL', 'INCONCLUSIVE')),
    resolution_notes TEXT,
    resolution_hash TEXT,                           -- SHA-256 of resolution document
    resolution_blockchain_tx TEXT,
    resolved_by     UUID REFERENCES users(id),      -- mediator
    resolved_at     TIMESTAMPTZ,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### notifications

```sql
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    type            TEXT NOT NULL,
    title           TEXT NOT NULL,
    body            TEXT NOT NULL,
    data            JSONB DEFAULT '{}',
    is_read         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### audit_logs

```sql
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
    action          TEXT NOT NULL,
    entity_type     TEXT,
    entity_id       UUID,
    metadata        JSONB DEFAULT '{}',
    ip_address      INET,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Key Indexes

```sql
-- Performance indexes
CREATE INDEX idx_agreements_landlord ON rental_agreements(landlord_id);
CREATE INDEX idx_agreements_tenant ON rental_agreements(tenant_id);
CREATE INDEX idx_agreements_property ON rental_agreements(property_id);
CREATE INDEX idx_payments_agreement ON payment_records(agreement_id);
CREATE INDEX idx_payments_month ON payment_records(payment_month);
CREATE INDEX idx_evidence_agreement ON evidence_records(agreement_id);
CREATE INDEX idx_disputes_agreement ON disputes(agreement_id);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_landlord ON properties(landlord_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- Blockchain tx hash lookups
CREATE INDEX idx_agreements_tx ON rental_agreements(blockchain_tx_hash);
CREATE INDEX idx_payments_tx ON payment_records(blockchain_tx_hash);
CREATE INDEX idx_evidence_tx ON evidence_records(blockchain_tx_hash);
```
