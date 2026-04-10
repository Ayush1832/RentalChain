import { db } from './db';
import { encrypt, decrypt, searchHash } from '../utils/crypto';
import { UserRole, KYCStatus } from '../types';

export interface User {
  id: string;
  phone: string;
  email?: string;
  fullName: string;
  role: UserRole;
  didHash?: string;
  kycStatus: KYCStatus;
  kycVerifiedAt?: Date;
  reputationScore: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function rowToUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    phone: decrypt(row.phone as string),
    email: row.email ? decrypt(row.email as string) : undefined,
    fullName: decrypt(row.full_name as string),
    role: row.role as UserRole,
    didHash: (row.did_hash as string) || undefined,
    kycStatus: row.kyc_status as KYCStatus,
    kycVerifiedAt: (row.kyc_verified_at as Date) || undefined,
    reputationScore: parseFloat(String(row.reputation_score)) || 0,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as Date,
    updatedAt: row.updated_at as Date,
  };
}

export async function findUserByPhone(phone: string): Promise<User | null> {
  const result = await db.query(
    `SELECT * FROM users WHERE phone_search_hash = $1 AND is_active = TRUE`,
    [searchHash(phone)]
  );
  return result.rows.length ? rowToUser(result.rows[0]) : null;
}

export async function findUserById(id: string): Promise<User | null> {
  const result = await db.query(
    `SELECT * FROM users WHERE id = $1 AND is_active = TRUE`,
    [id]
  );
  return result.rows.length ? rowToUser(result.rows[0]) : null;
}

export async function createUser(data: {
  phone: string;
  role?: UserRole;
  fullName?: string;
}): Promise<User> {
  const result = await db.query(
    `INSERT INTO users (phone, phone_search_hash, full_name, role)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [
      encrypt(data.phone),
      searchHash(data.phone),
      encrypt(data.fullName || ''),
      data.role || 'TENANT',
    ]
  );
  return rowToUser(result.rows[0]);
}

export async function updateUser(
  id: string,
  updates: Partial<{ fullName: string; email: string; role: UserRole }>
): Promise<User> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (updates.fullName !== undefined) {
    fields.push(`full_name = $${idx++}`);
    values.push(encrypt(updates.fullName));
  }
  if (updates.email !== undefined) {
    fields.push(`email = $${idx++}`);
    values.push(encrypt(updates.email));
  }
  if (updates.role !== undefined) {
    fields.push(`role = $${idx++}`);
    values.push(updates.role);
  }

  if (!fields.length) throw new Error('No fields to update');
  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await db.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return rowToUser(result.rows[0]);
}

export async function setUserDID(userId: string, didHash: string): Promise<void> {
  await db.query(
    `UPDATE users SET did_hash = $1, updated_at = NOW() WHERE id = $2`,
    [didHash, userId]
  );
}

export async function setKYCStatus(userId: string, status: KYCStatus): Promise<void> {
  await db.query(
    `UPDATE users
     SET kyc_status = $1,
         kyc_verified_at = CASE WHEN $1 = 'VERIFIED' THEN NOW() ELSE NULL END,
         updated_at = NOW()
     WHERE id = $2`,
    [status, userId]
  );
}

export async function listPendingKYC(): Promise<User[]> {
  const result = await db.query(
    `SELECT * FROM users WHERE kyc_status IN ('PENDING', 'SUBMITTED') AND is_active = TRUE ORDER BY created_at ASC`
  );
  return result.rows.map(rowToUser);
}
