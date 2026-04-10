import { db } from './db';
import { DisputeType, DisputeStatus } from '../types';

export interface Dispute {
  id: string;
  agreementId: string;
  raisedBy: string;
  againstUserId: string;
  disputeType: DisputeType;
  description: string;
  evidenceBundleHash?: string;
  attachedEvidenceIds?: string[];
  onChainDisputeId?: string;
  blockchainTxHash?: string;
  blockchainAnchoredAt?: Date;
  status: DisputeStatus;
  resolutionOutcome?: string;
  resolutionNotes?: string;
  resolutionHash?: string;
  resolutionBlockchainTx?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

function rowToDispute(row: Record<string, unknown>): Dispute {
  return {
    id: row.id as string,
    agreementId: row.agreement_id as string,
    raisedBy: row.raised_by as string,
    againstUserId: row.against_user_id as string,
    disputeType: row.dispute_type as DisputeType,
    description: row.description as string,
    evidenceBundleHash: (row.evidence_bundle_hash as string) || undefined,
    attachedEvidenceIds: (row.attached_evidence_ids as string[]) || undefined,
    onChainDisputeId: (row.on_chain_dispute_id as string) || undefined,
    blockchainTxHash: (row.blockchain_tx_hash as string) || undefined,
    blockchainAnchoredAt: (row.blockchain_anchored_at as Date) || undefined,
    status: row.status as DisputeStatus,
    resolutionOutcome: (row.resolution_outcome as string) || undefined,
    resolutionNotes: (row.resolution_notes as string) || undefined,
    resolutionHash: (row.resolution_hash as string) || undefined,
    resolutionBlockchainTx: (row.resolution_blockchain_tx as string) || undefined,
    resolvedBy: (row.resolved_by as string) || undefined,
    resolvedAt: (row.resolved_at as Date) || undefined,
    createdAt: row.created_at as Date,
    updatedAt: row.updated_at as Date,
  };
}

export async function createDispute(data: {
  agreementId: string;
  raisedBy: string;
  againstUserId: string;
  disputeType: DisputeType;
  description: string;
  attachedEvidenceIds?: string[];
}): Promise<Dispute> {
  const result = await db.query(
    `INSERT INTO disputes (agreement_id, raised_by, against_user_id, dispute_type, description, attached_evidence_ids)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [data.agreementId, data.raisedBy, data.againstUserId, data.disputeType,
     data.description, data.attachedEvidenceIds ? `{${data.attachedEvidenceIds.join(',')}}` : null]
  );
  return rowToDispute(result.rows[0]);
}

export async function getDisputeById(id: string): Promise<Dispute | null> {
  const result = await db.query(`SELECT * FROM disputes WHERE id = $1`, [id]);
  return result.rows.length ? rowToDispute(result.rows[0]) : null;
}

export async function listDisputesForUser(userId: string): Promise<Dispute[]> {
  const result = await db.query(
    `SELECT * FROM disputes WHERE raised_by=$1 OR against_user_id=$1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows.map(rowToDispute);
}

export async function anchorDisputeOnChain(id: string, onChainId: string, bundleHash: string, txHash: string): Promise<void> {
  await db.query(
    `UPDATE disputes SET on_chain_dispute_id=$1, evidence_bundle_hash=$2, blockchain_tx_hash=$3, blockchain_anchored_at=NOW(), status='UNDER_REVIEW' WHERE id=$4`,
    [onChainId, bundleHash, txHash, id]
  );
}

export async function resolveDispute(id: string, data: {
  resolvedBy: string;
  outcome: string;
  notes: string;
  resolutionHash: string;
  blockchainTx?: string;
}): Promise<Dispute> {
  const result = await db.query(
    `UPDATE disputes SET status='RESOLVED', resolution_outcome=$1, resolution_notes=$2,
     resolution_hash=$3, resolution_blockchain_tx=$4, resolved_by=$5, resolved_at=NOW(), updated_at=NOW()
     WHERE id=$6 RETURNING *`,
    [data.outcome, data.notes, data.resolutionHash, data.blockchainTx || null, data.resolvedBy, id]
  );
  return rowToDispute(result.rows[0]);
}

export async function listAllDisputes(status?: string): Promise<Dispute[]> {
  const result = status
    ? await db.query(`SELECT * FROM disputes WHERE status=$1 ORDER BY created_at DESC`, [status])
    : await db.query(`SELECT * FROM disputes ORDER BY created_at DESC`);
  return result.rows.map(rowToDispute);
}
