import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ethers } from 'ethers';
import { authenticate } from '../middleware/authenticate';
import { upload } from '../middleware/upload';
import { AuthRequest, EvidenceType } from '../types';
import { getAgreementById } from '../models/agreementModel';
import { createEvidenceRecord, listEvidenceForAgreement, getEvidenceById, anchorEvidenceOnChain } from '../models/evidenceModel';
import { ipfsService } from '../services/ipfs/IPFSService';
import { blockchainService, OnChainEvidenceType } from '../services/blockchain/BlockchainService';
import { computeEvidenceHash } from '../utils/crypto';
import { logger } from '../utils/logger';

export const evidenceRouter = Router();

// Also handle sub-routes from agreements
export const agreementEvidenceRouter = Router({ mergeParams: true });

const EVIDENCE_TYPE_MAP: Record<EvidenceType, OnChainEvidenceType> = {
  MOVE_IN: OnChainEvidenceType.MOVE_IN,
  MOVE_OUT: OnChainEvidenceType.MOVE_OUT,
  MAINTENANCE: OnChainEvidenceType.MAINTENANCE,
  INSPECTION: OnChainEvidenceType.INSPECTION,
};

const UploadEvidenceSchema = z.object({
  evidenceType: z.enum(['MOVE_IN', 'MOVE_OUT', 'MAINTENANCE', 'INSPECTION']),
  description: z.string().max(1000).optional(),
  maintenanceTicketId: z.string().uuid().optional(),
});

// GET /agreements/:id/evidence
agreementEvidenceRouter.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const agreement = await getAgreementById(req.params["id"] as string);
    if (!agreement) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Agreement not found', statusCode: 404 } }); return; }
    if (agreement.landlordId !== req.user!.userId && agreement.tenantId !== req.user!.userId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied', statusCode: 403 } }); return;
    }
    const evidence = await listEvidenceForAgreement(req.params["id"] as string);
    res.json({ evidence });
  } catch (err) { next(err); }
});

// POST /agreements/:id/evidence/upload
agreementEvidenceRouter.post('/upload', authenticate, upload.array('photos', 20), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const rawData = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;
    const data = UploadEvidenceSchema.parse(rawData);

    const agreement = await getAgreementById(req.params["id"] as string);
    if (!agreement) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Agreement not found', statusCode: 404 } }); return; }
    if (agreement.landlordId !== req.user!.userId && agreement.tenantId !== req.user!.userId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied', statusCode: 403 } }); return;
    }

    const files = req.files as Express.Multer.File[];
    if (!files?.length) { res.status(400).json({ error: { code: 'NO_FILES', message: 'No photos uploaded', statusCode: 400 } }); return; }

    // Upload as IPFS bundle
    const fileObjects = files.map((f, i) => ({ name: `photo-${i + 1}${require('path').extname(f.originalname)}`, buffer: f.buffer, mimeType: f.mimetype }));
    const bundleCid = await ipfsService.uploadBundle(fileObjects);
    const cloudUrls = fileObjects.map((f) => ipfsService.getGatewayURL(`${bundleCid}/${f.name}`));

    const ts = Date.now();
    const evidenceHash = computeEvidenceHash({
      agreementId: agreement.id,
      ipfsCid: bundleCid,
      timestamp: ts,
      evidenceType: data.evidenceType,
    });

    const record = await createEvidenceRecord({
      agreementId: agreement.id,
      uploadedBy: req.user!.userId,
      evidenceType: data.evidenceType as EvidenceType,
      ipfsCidBundle: bundleCid,
      cloudUrls,
      description: data.description,
      evidenceHash,
      maintenanceTicketId: data.maintenanceTicketId,
    });

    // Anchor on blockchain
    setImmediate(async () => {
      try {
        const onChainAgreementId = ethers.id(agreement.id);
        const txResult = await blockchainService.anchorEvidence(
          onChainAgreementId, evidenceHash, EVIDENCE_TYPE_MAP[data.evidenceType as EvidenceType]
        );
        const allEvidence = await listEvidenceForAgreement(agreement.id);
        await anchorEvidenceOnChain(record.id, txResult.txHash, allEvidence.length - 1);
        logger.info(`Evidence ${record.id} anchored: ${txResult.txHash}`);
      } catch (err) {
        logger.error('Evidence blockchain anchor failed', err);
      }
    });

    res.status(201).json({
      evidence: record,
      ipfsCid: bundleCid,
      message: `${files.length} photos uploaded. Blockchain anchoring in progress.`,
    });
  } catch (err) { next(err); }
});

// GET /evidence/:id
evidenceRouter.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const evidence = await getEvidenceById(req.params["id"] as string);
    if (!evidence) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Evidence not found', statusCode: 404 } }); return; }
    const agreement = await getAgreementById(evidence.agreementId);
    if (agreement?.landlordId !== req.user!.userId && agreement?.tenantId !== req.user!.userId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied', statusCode: 403 } }); return;
    }
    res.json({ evidence });
  } catch (err) { next(err); }
});

// GET /evidence/:id/verify (public)
evidenceRouter.get('/:id/verify', async (req, res: Response, next: NextFunction) => {
  try {
    const evidence = await getEvidenceById(req.params["id"] as string);
    if (!evidence || !evidence.blockchainTxHash) {
      res.status(404).json({ error: { code: 'NOT_ANCHORED', message: 'Evidence not anchored on-chain', statusCode: 404 } }); return;
    }
    res.json({
      evidenceId: evidence.id,
      evidenceType: evidence.evidenceType,
      evidenceHash: evidence.evidenceHash,
      ipfsCid: evidence.ipfsCidBundle,
      blockchainTxHash: evidence.blockchainTxHash,
      anchoredAt: evidence.blockchainAnchoredAt,
      sepoliaUrl: `https://sepolia.etherscan.io/tx/${evidence.blockchainTxHash}`,
    });
  } catch (err) { next(err); }
});
