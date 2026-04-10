import { db } from './db';
import { encrypt, decrypt } from '../utils/crypto';

export interface KYCRecord {
  id: string;
  userId: string;
  aadhaarNumber?: string;
  panNumber?: string;
  aadhaarVerified: boolean;
  panVerified: boolean;
  verificationMethod?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  createdAt: Date;
}

function rowToKYC(row: Record<string, unknown>): KYCRecord {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    aadhaarNumber: row.aadhaar_number ? decrypt(row.aadhaar_number as string) : undefined,
    panNumber: row.pan_number ? decrypt(row.pan_number as string) : undefined,
    aadhaarVerified: row.aadhaar_verified as boolean,
    panVerified: row.pan_verified as boolean,
    verificationMethod: row.verification_method as string | undefined,
    verifiedBy: row.verified_by as string | undefined,
    verifiedAt: row.verified_at as Date | undefined,
    createdAt: row.created_at as Date,
  };
}

export async function createKYCRecord(data: {
  userId: string;
  aadhaarNumber?: string;
  panNumber?: string;
}): Promise<KYCRecord> {
  // Upsert — replace any existing pending record
  await db.query(`DELETE FROM kyc_records WHERE user_id = $1`, [data.userId]);

  const result = await db.query(
    `INSERT INTO kyc_records (user_id, aadhaar_number, pan_number)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [
      data.userId,
      data.aadhaarNumber ? encrypt(data.aadhaarNumber) : null,
      data.panNumber ? encrypt(data.panNumber) : null,
    ]
  );
  return rowToKYC(result.rows[0]);
}

export async function getKYCRecord(userId: string): Promise<KYCRecord | null> {
  const result = await db.query(
    `SELECT * FROM kyc_records WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
  return result.rows.length ? rowToKYC(result.rows[0]) : null;
}

export async function approveKYC(userId: string, adminId: string): Promise<void> {
  await db.query(
    `UPDATE kyc_records
     SET aadhaar_verified = TRUE, pan_verified = TRUE,
         verification_method = 'MANUAL', verified_by = $1, verified_at = NOW()
     WHERE user_id = $2`,
    [adminId, userId]
  );
}

export async function getPendingKYCUsers(): Promise<{ userId: string; createdAt: Date }[]> {
  const result = await db.query(
    `SELECT u.id as user_id, k.created_at
     FROM users u
     JOIN kyc_records k ON k.user_id = u.id
     WHERE u.kyc_status = 'PENDING'
     ORDER BY k.created_at ASC`
  );
  return result.rows.map((r) => ({ userId: r.user_id, createdAt: r.created_at }));
}
