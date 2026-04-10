import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ethers } from 'ethers';
import { authenticate, requireRole } from '../middleware/authenticate';
import { AuthRequest, DisputeType } from '../types';
import { getAgreementById } from '../models/agreementModel';
import { getEvidenceById } from '../models/evidenceModel';
import { createDispute, getDisputeById, listDisputesForUser, anchorDisputeOnChain, resolveDispute } from '../models/disputeModel';
import { blockchainService } from '../services/blockchain/BlockchainService';
import { hashObject, hashString } from '../utils/crypto';
import { logger } from '../utils/logger';

export const disputesRouter = Router();

const CreateDisputeSchema = z.object({
  agreementId: z.string().uuid(),
  disputeType: z.enum(['DEPOSIT_REFUND', 'PROPERTY_DAMAGE', 'UNPAID_RENT', 'AGREEMENT_BREACH', 'OTHER']),
  description: z.string().min(20).max(3000),
  attachedEvidenceIds: z.array(z.string().uuid()).optional(),
});

// GET /disputes
disputesRouter.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const disputes = await listDisputesForUser(req.user!.userId);
    res.json({ disputes });
  } catch (err) { next(err); }
});

// POST /disputes
disputesRouter.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = CreateDisputeSchema.parse(req.body);
    const agreement = await getAgreementById(data.agreementId);
    if (!agreement) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Agreement not found', statusCode: 404 } }); return; }

    const isLandlord = agreement.landlordId === req.user!.userId;
    const isTenant = agreement.tenantId === req.user!.userId;
    if (!isLandlord && !isTenant) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not a party to this agreement', statusCode: 403 } }); return;
    }

    const againstUserId = isLandlord ? agreement.tenantId : agreement.landlordId;

    const dispute = await createDispute({
      agreementId: data.agreementId,
      raisedBy: req.user!.userId,
      againstUserId,
      disputeType: data.disputeType as DisputeType,
      description: data.description,
      attachedEvidenceIds: data.attachedEvidenceIds,
    });

    // Compute evidence bundle hash and anchor on blockchain
    setImmediate(async () => {
      try {
        const evidenceHashes: string[] = [];
        for (const eid of data.attachedEvidenceIds || []) {
          const ev = await getEvidenceById(eid);
          if (ev?.evidenceHash) evidenceHashes.push(ev.evidenceHash);
        }
        const bundleHash = hashObject({
          agreementId: data.agreementId,
          evidenceHashes,
          timestamp: Date.now(),
        });
        const onChainDisputeId = ethers.id(dispute.id);
        const onChainAgreementId = ethers.id(data.agreementId);
        const txResult = await blockchainService.openDispute(onChainDisputeId, onChainAgreementId, bundleHash);
        await anchorDisputeOnChain(dispute.id, onChainDisputeId, bundleHash, txResult.txHash);
        logger.info(`Dispute ${dispute.id} anchored: ${txResult.txHash}`);
      } catch (err) {
        logger.error('Dispute blockchain anchor failed', err);
      }
    });

    res.status(201).json({ dispute, message: 'Dispute raised. Blockchain anchoring in progress.' });
  } catch (err) { next(err); }
});

// GET /disputes/:id
disputesRouter.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const dispute = await getDisputeById(req.params["id"] as string);
    if (!dispute) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Dispute not found', statusCode: 404 } }); return; }
    if (dispute.raisedBy !== req.user!.userId && dispute.againstUserId !== req.user!.userId && req.user!.role !== 'ADMIN' && req.user!.role !== 'MEDIATOR') {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied', statusCode: 403 } }); return;
    }
    res.json({ dispute });
  } catch (err) { next(err); }
});

// PUT /disputes/:id/resolve (mediator/admin only)
disputesRouter.put('/:id/resolve', authenticate, requireRole('ADMIN', 'MEDIATOR'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = z.object({
      outcome: z.enum(['TENANT_FAVOUR', 'LANDLORD_FAVOUR', 'MUTUAL', 'INCONCLUSIVE']),
      notes: z.string().min(10).max(3000),
    }).parse(req.body);

    const dispute = await getDisputeById(req.params["id"] as string);
    if (!dispute) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Dispute not found', statusCode: 404 } }); return; }
    if (dispute.status === 'RESOLVED' || dispute.status === 'CLOSED') {
      res.status(400).json({ error: { code: 'ALREADY_RESOLVED', message: 'Dispute already resolved', statusCode: 400 } }); return;
    }

    const resolutionHash = hashString(`${dispute.id}:${data.outcome}:${data.notes}:${Date.now()}`);

    // Anchor resolution on blockchain
    let blockchainTx: string | undefined;
    try {
      const txResult = await blockchainService.resolveDispute(dispute.onChainDisputeId!, resolutionHash);
      blockchainTx = txResult.txHash;
    } catch (err) {
      logger.error('Resolution blockchain anchor failed', err);
    }

    const resolved = await resolveDispute(dispute.id, {
      resolvedBy: req.user!.userId,
      outcome: data.outcome,
      notes: data.notes,
      resolutionHash,
      blockchainTx,
    });

    res.json({ dispute: resolved, blockchainTx });
  } catch (err) { next(err); }
});
