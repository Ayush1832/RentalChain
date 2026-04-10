import { db } from './db';
import { PaymentMethod, PaymentStatus } from '../types';

export interface PaymentRecord {
  id: string;
  agreementId: string;
  tenantId: string;
  landlordId: string;
  amount: number;
  paymentDate: string;
  paymentMonth: string;
  upiRefId?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  receiptIpfsCid?: string;
  receiptCloudUrl?: string;
  paymentHash: string;
  blockchainTxHash?: string;
  blockchainAnchoredAt?: Date;
  paymentIndex?: number;
  status: PaymentStatus;
  confirmedByLandlordAt?: Date;
  createdAt: Date;
}

function rowToPayment(row: Record<string, unknown>): PaymentRecord {
  return {
    id: row.id as string,
    agreementId: row.agreement_id as string,
    tenantId: row.tenant_id as string,
    landlordId: row.landlord_id as string,
    amount: row.amount as number,
    paymentDate: row.payment_date as string,
    paymentMonth: row.payment_month as string,
    upiRefId: (row.upi_ref_id as string) || undefined,
    paymentMethod: row.payment_method as PaymentMethod,
    notes: (row.notes as string) || undefined,
    receiptIpfsCid: (row.receipt_ipfs_cid as string) || undefined,
    receiptCloudUrl: (row.receipt_cloud_url as string) || undefined,
    paymentHash: row.payment_hash as string,
    blockchainTxHash: (row.blockchain_tx_hash as string) || undefined,
    blockchainAnchoredAt: (row.blockchain_anchored_at as Date) || undefined,
    paymentIndex: (row.payment_index as number) ?? undefined,
    status: row.status as PaymentStatus,
    confirmedByLandlordAt: (row.confirmed_by_landlord_at as Date) || undefined,
    createdAt: row.created_at as Date,
  };
}

export async function createPayment(data: {
  agreementId: string;
  tenantId: string;
  landlordId: string;
  amount: number;
  paymentDate: string;
  paymentMonth: string;
  upiRefId?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
  paymentHash: string;
  receiptIpfsCid?: string;
  receiptCloudUrl?: string;
}): Promise<PaymentRecord> {
  const result = await db.query(
    `INSERT INTO payment_records
     (agreement_id, tenant_id, landlord_id, amount, payment_date, payment_month,
      upi_ref_id, payment_method, notes, payment_hash, receipt_ipfs_cid, receipt_cloud_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [data.agreementId, data.tenantId, data.landlordId, data.amount, data.paymentDate,
     data.paymentMonth, data.upiRefId || null, data.paymentMethod || 'UPI', data.notes || null,
     data.paymentHash, data.receiptIpfsCid || null, data.receiptCloudUrl || null]
  );
  return rowToPayment(result.rows[0]);
}

export async function getPaymentById(id: string): Promise<PaymentRecord | null> {
  const result = await db.query(`SELECT * FROM payment_records WHERE id = $1`, [id]);
  return result.rows.length ? rowToPayment(result.rows[0]) : null;
}

export async function listPaymentsForAgreement(agreementId: string): Promise<PaymentRecord[]> {
  const result = await db.query(
    `SELECT * FROM payment_records WHERE agreement_id = $1 ORDER BY payment_date DESC`,
    [agreementId]
  );
  return result.rows.map(rowToPayment);
}

export async function anchorPaymentOnChain(id: string, txHash: string, paymentIndex: number): Promise<void> {
  await db.query(
    `UPDATE payment_records SET blockchain_tx_hash=$1, blockchain_anchored_at=NOW(), payment_index=$2 WHERE id=$3`,
    [txHash, paymentIndex, id]
  );
}

export async function confirmPayment(id: string): Promise<void> {
  await db.query(
    `UPDATE payment_records SET status='CONFIRMED', confirmed_by_landlord_at=NOW() WHERE id=$1`,
    [id]
  );
}

export async function getPaymentByTxHash(txHash: string): Promise<PaymentRecord | null> {
  const result = await db.query(`SELECT * FROM payment_records WHERE blockchain_tx_hash = $1`, [txHash]);
  return result.rows.length ? rowToPayment(result.rows[0]) : null;
}
