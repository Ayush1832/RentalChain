-- Migration 4: Add deterministic search hashes for encrypted PII
-- These allow lookups on encrypted fields without decrypting all rows.
-- Uses a separate HMAC hash (not the encryption key).

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_search_hash TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_users_phone_search ON users(phone_search_hash);
