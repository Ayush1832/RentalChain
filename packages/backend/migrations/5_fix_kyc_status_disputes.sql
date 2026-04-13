-- Migration 5: Fix kyc_status constraint + add assigned_mediator_id to disputes

-- Add SUBMITTED to kyc_status enum
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_kyc_status_check;
ALTER TABLE users ADD CONSTRAINT users_kyc_status_check
    CHECK (kyc_status IN ('PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED'));

-- Add assigned_mediator_id column to disputes (for PUT /admin/disputes/:id/assign)
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS assigned_mediator_id UUID REFERENCES users(id);

-- Index for mediator assignments
CREATE INDEX IF NOT EXISTS idx_disputes_mediator ON disputes(assigned_mediator_id);
