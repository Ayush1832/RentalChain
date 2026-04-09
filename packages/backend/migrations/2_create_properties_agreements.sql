-- Migration 2: Properties and rental agreements

CREATE TABLE properties (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id     UUID NOT NULL REFERENCES users(id),
    title           TEXT NOT NULL,
    description     TEXT,
    address_line1   TEXT NOT NULL,
    address_line2   TEXT,
    city            TEXT NOT NULL,
    state           TEXT NOT NULL,
    pincode         TEXT NOT NULL,
    property_type   TEXT NOT NULL CHECK (property_type IN ('APARTMENT', 'HOUSE', 'PG', 'COMMERCIAL')),
    bedrooms        INTEGER,
    bathrooms       INTEGER,
    area_sqft       INTEGER,
    monthly_rent    INTEGER NOT NULL,
    security_deposit INTEGER,
    is_furnished    BOOLEAN DEFAULT FALSE,
    amenities       JSONB DEFAULT '[]',
    listing_status  TEXT NOT NULL DEFAULT 'DRAFT'
                    CHECK (listing_status IN ('DRAFT', 'ACTIVE', 'RENTED', 'INACTIVE')),
    is_verified     BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE property_images (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID NOT NULL REFERENCES properties(id),
    ipfs_cid        TEXT NOT NULL,
    cloud_url       TEXT,
    is_primary      BOOLEAN DEFAULT FALSE,
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rental_agreements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID NOT NULL REFERENCES properties(id),
    landlord_id     UUID NOT NULL REFERENCES users(id),
    tenant_id       UUID NOT NULL REFERENCES users(id),
    monthly_rent    INTEGER NOT NULL,
    security_deposit INTEGER NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE,
    notice_period_days INTEGER DEFAULT 30,
    rent_due_day    INTEGER DEFAULT 1,
    pdf_ipfs_cid    TEXT,
    pdf_cloud_url   TEXT,
    agreement_hash  TEXT,
    landlord_signed_at  TIMESTAMPTZ,
    tenant_signed_at    TIMESTAMPTZ,
    landlord_sign_method TEXT CHECK (landlord_sign_method IN ('OTP', 'AADHAAR_ESIGN')),
    tenant_sign_method   TEXT CHECK (tenant_sign_method IN ('OTP', 'AADHAAR_ESIGN')),
    blockchain_tx_hash  TEXT,
    blockchain_anchored_at TIMESTAMPTZ,
    on_chain_agreement_id TEXT,
    status          TEXT NOT NULL DEFAULT 'DRAFT'
                    CHECK (status IN ('DRAFT', 'PENDING_SIGNATURES', 'ACTIVE', 'EXPIRED', 'TERMINATED')),
    terminated_at   TIMESTAMPTZ,
    termination_reason TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_properties_landlord ON properties(landlord_id);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_status ON properties(listing_status);
CREATE INDEX idx_property_images_property ON property_images(property_id);
CREATE INDEX idx_agreements_landlord ON rental_agreements(landlord_id);
CREATE INDEX idx_agreements_tenant ON rental_agreements(tenant_id);
CREATE INDEX idx_agreements_property ON rental_agreements(property_id);
CREATE INDEX idx_agreements_status ON rental_agreements(status);
CREATE INDEX idx_agreements_tx ON rental_agreements(blockchain_tx_hash);
