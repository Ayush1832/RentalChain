import { db } from './db';
import { AgreementStatus } from '../types';

export interface Agreement {
  id: string;
  propertyId: string;
  landlordId: string;
  tenantId: string;
  monthlyRent: number;
  securityDeposit: number;
  startDate: string;
  endDate?: string;
  noticePeriodDays: number;
  rentDueDay: number;
  pdfIpfsCid?: string;
  pdfCloudUrl?: string;
  agreementHash?: string;
  landlordSignedAt?: Date;
  tenantSignedAt?: Date;
  blockchainTxHash?: string;
  blockchainAnchoredAt?: Date;
  onChainAgreementId?: string;
  status: AgreementStatus;
  terminatedAt?: Date;
  terminationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

function rowToAgreement(row: Record<string, unknown>): Agreement {
  return {
    id: row.id as string,
    propertyId: row.property_id as string,
    landlordId: row.landlord_id as string,
    tenantId: row.tenant_id as string,
    monthlyRent: row.monthly_rent as number,
    securityDeposit: row.security_deposit as number,
    startDate: row.start_date as string,
    endDate: (row.end_date as string) || undefined,
    noticePeriodDays: row.notice_period_days as number,
    rentDueDay: row.rent_due_day as number,
    pdfIpfsCid: (row.pdf_ipfs_cid as string) || undefined,
    pdfCloudUrl: (row.pdf_cloud_url as string) || undefined,
    agreementHash: (row.agreement_hash as string) || undefined,
    landlordSignedAt: (row.landlord_signed_at as Date) || undefined,
    tenantSignedAt: (row.tenant_signed_at as Date) || undefined,
    blockchainTxHash: (row.blockchain_tx_hash as string) || undefined,
    blockchainAnchoredAt: (row.blockchain_anchored_at as Date) || undefined,
    onChainAgreementId: (row.on_chain_agreement_id as string) || undefined,
    status: row.status as AgreementStatus,
    terminatedAt: (row.terminated_at as Date) || undefined,
    terminationReason: (row.termination_reason as string) || undefined,
    createdAt: row.created_at as Date,
    updatedAt: row.updated_at as Date,
  };
}

export async function createAgreement(data: {
  propertyId: string;
  landlordId: string;
  tenantId: string;
  monthlyRent: number;
  securityDeposit: number;
  startDate: string;
  endDate?: string;
  noticePeriodDays?: number;
  rentDueDay?: number;
}): Promise<Agreement> {
  const result = await db.query(
    `INSERT INTO rental_agreements
     (property_id, landlord_id, tenant_id, monthly_rent, security_deposit,
      start_date, end_date, notice_period_days, rent_due_day, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'DRAFT')
     RETURNING *`,
    [data.propertyId, data.landlordId, data.tenantId, data.monthlyRent, data.securityDeposit,
     data.startDate, data.endDate || null, data.noticePeriodDays ?? 30, data.rentDueDay ?? 1]
  );
  return rowToAgreement(result.rows[0]);
}

export async function getAgreementById(id: string): Promise<Agreement | null> {
  const result = await db.query(`SELECT * FROM rental_agreements WHERE id = $1`, [id]);
  return result.rows.length ? rowToAgreement(result.rows[0]) : null;
}

export async function listAgreementsForUser(userId: string): Promise<Agreement[]> {
  const result = await db.query(
    `SELECT * FROM rental_agreements
     WHERE landlord_id = $1 OR tenant_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows.map(rowToAgreement);
}

export async function setPDFDetails(id: string, pdfIpfsCid: string, pdfCloudUrl: string): Promise<void> {
  await db.query(
    `UPDATE rental_agreements SET pdf_ipfs_cid=$1, pdf_cloud_url=$2, status='PENDING_SIGNATURES', updated_at=NOW() WHERE id=$3`,
    [pdfIpfsCid, pdfCloudUrl, id]
  );
}

export async function recordSignature(id: string, role: 'LANDLORD' | 'TENANT', method: string): Promise<Agreement> {
  const col = role === 'LANDLORD' ? 'landlord_signed_at' : 'tenant_signed_at';
  const methodCol = role === 'LANDLORD' ? 'landlord_sign_method' : 'tenant_sign_method';
  const result = await db.query(
    `UPDATE rental_agreements SET ${col}=NOW(), ${methodCol}=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
    [method, id]
  );
  return rowToAgreement(result.rows[0]);
}

export async function activateAgreement(id: string, data: {
  agreementHash: string;
  pdfIpfsCid: string;
  pdfCloudUrl: string;
  blockchainTxHash: string;
  onChainAgreementId: string;
}): Promise<Agreement> {
  const result = await db.query(
    `UPDATE rental_agreements
     SET agreement_hash=$1, pdf_ipfs_cid=$2, pdf_cloud_url=$3,
         blockchain_tx_hash=$4, blockchain_anchored_at=NOW(),
         on_chain_agreement_id=$5, status='ACTIVE', updated_at=NOW()
     WHERE id=$6 RETURNING *`,
    [data.agreementHash, data.pdfIpfsCid, data.pdfCloudUrl,
     data.blockchainTxHash, data.onChainAgreementId, id]
  );
  return rowToAgreement(result.rows[0]);
}

export async function terminateAgreement(id: string, reason: string): Promise<void> {
  await db.query(
    `UPDATE rental_agreements SET status='TERMINATED', terminated_at=NOW(), termination_reason=$1, updated_at=NOW() WHERE id=$2`,
    [reason, id]
  );
}
