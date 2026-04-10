import { db } from './db';
import { EvidenceType } from '../types';

export interface EvidenceRecord {
  id: string;
  agreementId: string;
  uploadedBy: string;
  evidenceType: EvidenceType;
  ipfsCidBundle: string;
  cloudUrls: string[];
  description?: string;
  evidenceHash: string;
  blockchainTxHash?: string;
  blockchainAnchoredAt?: Date;
  evidenceIndex?: number;
  maintenanceTicketId?: string;
  createdAt: Date;
}

function rowToEvidence(row: Record<string, unknown>): EvidenceRecord {
  return {
    id: row.id as string,
    agreementId: row.agreement_id as string,
    uploadedBy: row.uploaded_by as string,
    evidenceType: row.evidence_type as EvidenceType,
    ipfsCidBundle: row.ipfs_cid_bundle as string,
    cloudUrls: (row.cloud_urls as string[]) || [],
    description: (row.description as string) || undefined,
    evidenceHash: row.evidence_hash as string,
    blockchainTxHash: (row.blockchain_tx_hash as string) || undefined,
    blockchainAnchoredAt: (row.blockchain_anchored_at as Date) || undefined,
    evidenceIndex: (row.evidence_index as number) ?? undefined,
    maintenanceTicketId: (row.maintenance_ticket_id as string) || undefined,
    createdAt: row.created_at as Date,
  };
}

export async function createEvidenceRecord(data: {
  agreementId: string;
  uploadedBy: string;
  evidenceType: EvidenceType;
  ipfsCidBundle: string;
  cloudUrls: string[];
  description?: string;
  evidenceHash: string;
  maintenanceTicketId?: string;
}): Promise<EvidenceRecord> {
  const result = await db.query(
    `INSERT INTO evidence_records
     (agreement_id, uploaded_by, evidence_type, ipfs_cid_bundle, cloud_urls, description, evidence_hash, maintenance_ticket_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [data.agreementId, data.uploadedBy, data.evidenceType, data.ipfsCidBundle,
     JSON.stringify(data.cloudUrls), data.description || null, data.evidenceHash,
     data.maintenanceTicketId || null]
  );
  return rowToEvidence(result.rows[0]);
}

export async function listEvidenceForAgreement(agreementId: string): Promise<EvidenceRecord[]> {
  const result = await db.query(
    `SELECT * FROM evidence_records WHERE agreement_id = $1 ORDER BY created_at DESC`,
    [agreementId]
  );
  return result.rows.map(rowToEvidence);
}

export async function getEvidenceById(id: string): Promise<EvidenceRecord | null> {
  const result = await db.query(`SELECT * FROM evidence_records WHERE id = $1`, [id]);
  return result.rows.length ? rowToEvidence(result.rows[0]) : null;
}

export async function anchorEvidenceOnChain(id: string, txHash: string, evidenceIndex: number): Promise<void> {
  await db.query(
    `UPDATE evidence_records SET blockchain_tx_hash=$1, blockchain_anchored_at=NOW(), evidence_index=$2 WHERE id=$3`,
    [txHash, evidenceIndex, id]
  );
}

export async function getEvidenceByTxHash(txHash: string): Promise<EvidenceRecord | null> {
  const result = await db.query(`SELECT * FROM evidence_records WHERE blockchain_tx_hash = $1`, [txHash]);
  return result.rows.length ? rowToEvidence(result.rows[0]) : null;
}
