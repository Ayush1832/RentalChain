import crypto from 'crypto';

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex');
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * AES-256-GCM encryption for PII fields stored in PostgreSQL.
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return plaintext;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decrypt(ciphertext: string): string {
  if (!ciphertext) return ciphertext;
  const data = Buffer.from(ciphertext, 'base64');
  const iv = data.subarray(0, IV_LENGTH);
  const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted).toString('utf8') + decipher.final('utf8');
}

/**
 * SHA-256 hash of a buffer (for agreement PDF).
 */
export function hashBuffer(buffer: Buffer): string {
  return '0x' + crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * SHA-256 hash of a JSON-serialisable object.
 */
export function hashObject(obj: object): string {
  return '0x' + crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
}

/**
 * SHA-256 hash of a string.
 */
export function hashString(str: string): string {
  return '0x' + crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * Generate a DID hash for a user.
 */
export function generateDIDHash(userId: string, createdAt: Date): string {
  const input = `${userId}:rentalchain:${createdAt.toISOString()}`;
  return '0x' + crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Compute payment hash.
 */
export function computePaymentHash(data: {
  agreementId: string;
  amount: number;
  paymentDate: string;
  upiRefId: string;
}): string {
  return hashObject(data);
}

/**
 * Compute evidence hash.
 */
export function computeEvidenceHash(data: {
  agreementId: string;
  ipfsCid: string;
  timestamp: number;
  evidenceType: string;
}): string {
  return hashObject(data);
}
