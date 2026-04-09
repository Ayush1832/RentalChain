-- Migration 3: Payments, evidence, maintenance, disputes

CREATE TABLE payment_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agreement_id    UUID NOT NULL REFERENCES rental_agreements(id),
    tenant_id       UUID NOT NULL REFERENCES users(id),
    landlord_id     UUID NOT NULL REFERENCES users(id),
    amount          INTEGER NOT NULL,
    payment_date    DATE NOT NULL,
    payment_month   TEXT NOT NULL,
    upi_ref_id      TEXT,
    payment_method  TEXT DEFAULT 'UPI'
                    CHECK (payment_method IN ('UPI', 'BANK_TRANSFER', 'CASH', 'CHEQUE')),
    notes           TEXT,
    receipt_ipfs_cid TEXT,
    receipt_cloud_url TEXT,
    payment_hash    TEXT NOT NULL,
    blockchain_tx_hash TEXT,
    blockchain_anchored_at TIMESTAMPTZ,
    payment_index   INTEGER,
    status          TEXT NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING', 'CONFIRMED', 'DISPUTED')),
    confirmed_by_landlord_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE evidence_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agreement_id    UUID NOT NULL REFERENCES rental_agreements(id),
    uploaded_by     UUID NOT NULL REFERENCES users(id),
    evidence_type   TEXT NOT NULL
                    CHECK (evidence_type IN ('MOVE_IN', 'MOVE_OUT', 'MAINTENANCE', 'INSPECTION')),
    ipfs_cid_bundle TEXT NOT NULL,
    cloud_urls      JSONB DEFAULT '[]',
    description     TEXT,
    evidence_hash   TEXT NOT NULL,
    blockchain_tx_hash TEXT,
    blockchain_anchored_at TIMESTAMPTZ,
    evidence_index  INTEGER,
    maintenance_ticket_id UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TABLE disputes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agreement_id    UUID NOT NULL REFERENCES rental_agreements(id),
    raised_by       UUID NOT NULL REFERENCES users(id),
    against_user_id UUID NOT NULL REFERENCES users(id),
    dispute_type    TEXT NOT NULL
                    CHECK (dispute_type IN ('DEPOSIT_REFUND', 'PROPERTY_DAMAGE', 'UNPAID_RENT', 'AGREEMENT_BREACH', 'OTHER')),
    description     TEXT NOT NULL,
    evidence_bundle_hash TEXT,
    attached_evidence_ids UUID[],
    on_chain_dispute_id TEXT,
    blockchain_tx_hash  TEXT,
    blockchain_anchored_at TIMESTAMPTZ,
    status          TEXT NOT NULL DEFAULT 'OPEN'
                    CHECK (status IN ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED')),
    resolution_outcome TEXT CHECK (resolution_outcome IN ('TENANT_FAVOUR', 'LANDLORD_FAVOUR', 'MUTUAL', 'INCONCLUSIVE')),
    resolution_notes TEXT,
    resolution_hash TEXT,
    resolution_blockchain_tx TEXT,
    resolved_by     UUID REFERENCES users(id),
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payments_agreement ON payment_records(agreement_id);
CREATE INDEX idx_payments_tenant ON payment_records(tenant_id);
CREATE INDEX idx_payments_month ON payment_records(payment_month);
CREATE INDEX idx_payments_tx ON payment_records(blockchain_tx_hash);
CREATE INDEX idx_evidence_agreement ON evidence_records(agreement_id);
CREATE INDEX idx_evidence_tx ON evidence_records(blockchain_tx_hash);
CREATE INDEX idx_maintenance_agreement ON maintenance_tickets(agreement_id);
CREATE INDEX idx_disputes_agreement ON disputes(agreement_id);
CREATE INDEX idx_disputes_raised_by ON disputes(raised_by);
