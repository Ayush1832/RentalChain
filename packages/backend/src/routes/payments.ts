import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { AuthRequest } from '../types';
import { getPaymentById, confirmPayment } from '../models/paymentModel';
import { getAgreementById } from '../models/agreementModel';

export const paymentsRouter = Router();

// GET /payments/:id
paymentsRouter.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const payment = await getPaymentById(req.params["id"] as string);
    if (!payment) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Payment not found', statusCode: 404 } }); return; }
    if (payment.tenantId !== req.user!.userId && payment.landlordId !== req.user!.userId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied', statusCode: 403 } }); return;
    }
    res.json({ payment });
  } catch (err) { next(err); }
});

// POST /payments/:id/confirm
paymentsRouter.post('/:id/confirm', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const payment = await getPaymentById(req.params["id"] as string);
    if (!payment) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Payment not found', statusCode: 404 } }); return; }
    if (payment.landlordId !== req.user!.userId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only landlord can confirm payments', statusCode: 403 } }); return;
    }
    await confirmPayment(payment.id);
    res.json({ message: 'Payment confirmed' });
  } catch (err) { next(err); }
});

// GET /payments/:id/verify
paymentsRouter.get('/:id/verify', async (req, res: Response, next: NextFunction) => {
  try {
    const payment = await getPaymentById(req.params["id"] as string);
    if (!payment || !payment.blockchainTxHash) {
      res.status(404).json({ error: { code: 'NOT_ANCHORED', message: 'Payment not anchored on-chain', statusCode: 404 } }); return;
    }
    res.json({
      paymentId: payment.id,
      paymentHash: payment.paymentHash,
      blockchainTxHash: payment.blockchainTxHash,
      anchoredAt: payment.blockchainAnchoredAt,
      amount: payment.amount,
      paymentMonth: payment.paymentMonth,
      sepoliaUrl: `https://sepolia.etherscan.io/tx/${payment.blockchainTxHash}`,
    });
  } catch (err) { next(err); }
});
