// Payment sub-routes mounted on agreementsRouter at /:id/payments
import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ethers } from 'ethers';
import { authenticate } from '../middleware/authenticate';
import { upload } from '../middleware/upload';
import { uploadLimiter } from '../middleware/rateLimiters';
import { AuthRequest } from '../types';
import { getAgreementById } from '../models/agreementModel';
import { createPayment, listPaymentsForAgreement, anchorPaymentOnChain } from '../models/paymentModel';
import { ipfsService } from '../services/ipfs/IPFSService';
import { blockchainService } from '../services/blockchain/BlockchainService';
import { computePaymentHash } from '../utils/crypto';
import { logger } from '../utils/logger';

export const agreementPaymentsRouter = Router({ mergeParams: true });

const RecordPaymentSchema = z.object({
  amount: z.number().int().positive(),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paymentMonth: z.string().regex(/^\d{4}-\d{2}$/),
  upiRefId: z.string().max(50).optional(),
  paymentMethod: z.enum(['UPI', 'BANK_TRANSFER', 'CASH', 'CHEQUE']).optional(),
  notes: z.string().max(500).optional(),
});

// GET /agreements/:id/payments
agreementPaymentsRouter.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const agreement = await getAgreementById(req.params["id"] as string);
    if (!agreement) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Agreement not found', statusCode: 404 } }); return; }
    if (agreement.landlordId !== req.user!.userId && agreement.tenantId !== req.user!.userId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied', statusCode: 403 } }); return;
    }
    const payments = await listPaymentsForAgreement(req.params["id"] as string);
    res.json({ payments });
  } catch (err) { next(err); }
});

// POST /agreements/:id/payments
agreementPaymentsRouter.post('/', authenticate, uploadLimiter, upload.single('receipt'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = RecordPaymentSchema.parse(
      typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body
    );
    const agreement = await getAgreementById(req.params["id"] as string);
    if (!agreement) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Agreement not found', statusCode: 404 } }); return; }
    if (agreement.tenantId !== req.user!.userId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only tenant can record payments', statusCode: 403 } }); return;
    }
    if (agreement.status !== 'ACTIVE') {
      res.status(400).json({ error: { code: 'AGREEMENT_NOT_ACTIVE', message: 'Agreement is not active', statusCode: 400 } }); return;
    }

    // Upload receipt if provided
    let receiptCid: string | undefined;
    let receiptUrl: string | undefined;
    if (req.file) {
      receiptCid = await ipfsService.uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype);
      receiptUrl = ipfsService.getGatewayURL(receiptCid);
    }

    const paymentHash = computePaymentHash({
      agreementId: agreement.id,
      amount: data.amount,
      paymentDate: data.paymentDate,
      upiRefId: data.upiRefId || '',
    });

    const payment = await createPayment({
      agreementId: agreement.id,
      tenantId: req.user!.userId,
      landlordId: agreement.landlordId,
      amount: data.amount,
      paymentDate: data.paymentDate,
      paymentMonth: data.paymentMonth,
      upiRefId: data.upiRefId,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
      paymentHash,
      receiptIpfsCid: receiptCid,
      receiptCloudUrl: receiptUrl,
    });

    // Anchor on blockchain (best-effort)
    setImmediate(async () => {
      try {
        const onChainId = ethers.id(agreement.id);
        const txResult = await blockchainService.anchorPayment(
          onChainId, paymentHash, data.amount, new Date(data.paymentDate)
        );
        const payments = await listPaymentsForAgreement(agreement.id);
        await anchorPaymentOnChain(payment.id, txResult.txHash, payments.length - 1);
        logger.info(`Payment ${payment.id} anchored: ${txResult.txHash}`);
      } catch (err) {
        logger.error('Payment blockchain anchor failed', err);
      }
    });

    res.status(201).json({ payment, message: 'Payment recorded. Blockchain anchoring in progress.' });
  } catch (err) { next(err); }
});
