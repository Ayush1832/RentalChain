import crypto from 'crypto';
import { db } from '../../models/db';
import { logger } from '../../utils/logger';

const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 3;
const LOCKOUT_MINUTES = 15;

function generateOTP(): string {
  // Cryptographically random 6-digit OTP
  return String(crypto.randomInt(100000, 999999));
}

function hashOTP(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

export async function sendOTP(phone: string): Promise<void> {
  // Clean up expired OTPs for this phone
  await db.query(`DELETE FROM otp_codes WHERE phone = $1 AND expires_at < NOW()`, [phone]);

  // Check if locked out (too many recent attempts)
  const recent = await db.query(
    `SELECT COUNT(*) FROM otp_codes
     WHERE phone = $1 AND created_at > NOW() - INTERVAL '${LOCKOUT_MINUTES} minutes' AND attempts >= $2`,
    [phone, MAX_ATTEMPTS]
  );
  if (parseInt(recent.rows[0].count) >= 5) {
    throw Object.assign(new Error('Too many OTP requests. Try again in 15 minutes.'), {
      code: 'OTP_RATE_LIMITED',
      statusCode: 429,
    });
  }

  const otp = generateOTP();
  const hash = hashOTP(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await db.query(
    `INSERT INTO otp_codes (phone, code_hash, expires_at) VALUES ($1, $2, $3)`,
    [phone, hash, expiresAt]
  );

  if (process.env.NODE_ENV === 'production') {
    await sendViaSMS(phone, otp);
  } else {
    // Dev mode — log OTP to console
    logger.info(`[DEV OTP] Phone: ${phone} → OTP: ${otp}`);
  }
}

export async function verifyOTP(phone: string, otp: string): Promise<boolean> {
  const hash = hashOTP(otp);

  // Find valid, unused OTP
  const result = await db.query(
    `SELECT id, attempts FROM otp_codes
     WHERE phone = $1 AND expires_at > NOW() AND used = FALSE
     ORDER BY created_at DESC LIMIT 1`,
    [phone]
  );

  if (!result.rows.length) {
    throw Object.assign(new Error('OTP expired or not found. Request a new one.'), {
      code: 'OTP_EXPIRED',
      statusCode: 400,
    });
  }

  const { id, attempts } = result.rows[0];

  if (attempts >= MAX_ATTEMPTS) {
    throw Object.assign(new Error('Too many incorrect attempts. Request a new OTP.'), {
      code: 'OTP_MAX_ATTEMPTS',
      statusCode: 400,
    });
  }

  // Check if hash matches
  const match = await db.query(
    `SELECT id FROM otp_codes WHERE id = $1 AND code_hash = $2`,
    [id, hash]
  );

  if (!match.rows.length) {
    // Increment attempts
    await db.query(`UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1`, [id]);
    throw Object.assign(new Error('Invalid OTP.'), {
      code: 'OTP_INVALID',
      statusCode: 400,
    });
  }

  // Mark as used
  await db.query(`UPDATE otp_codes SET used = TRUE WHERE id = $1`, [id]);
  return true;
}

async function sendViaSMS(phone: string, otp: string): Promise<void> {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) throw new Error('FAST2SMS_API_KEY not configured');

  const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: {
      authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      route: 'otp',
      variables_values: otp,
      numbers: phone,
    }),
  });

  const data = await response.json() as { return: boolean; message: string[] };
  if (!data.return) {
    logger.error('Fast2SMS error', data);
    throw new Error('Failed to send OTP via SMS');
  }
}
