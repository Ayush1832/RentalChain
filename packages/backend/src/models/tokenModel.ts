import { db } from './db';
import crypto from 'crypto';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function saveRefreshToken(userId: string, token: string, expiresAt: Date): Promise<void> {
  await db.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, hashToken(token), expiresAt]
  );
}

export async function validateRefreshToken(token: string): Promise<string | null> {
  const result = await db.query(
    `SELECT user_id FROM refresh_tokens
     WHERE token_hash = $1 AND revoked = FALSE AND expires_at > NOW()`,
    [hashToken(token)]
  );
  return result.rows[0]?.user_id ?? null;
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await db.query(
    `UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1`,
    [hashToken(token)]
  );
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await db.query(
    `UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1`,
    [userId]
  );
}
