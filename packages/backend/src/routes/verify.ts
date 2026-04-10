import { Router, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { blockchainService } from '../services/blockchain/BlockchainService';
import { getAgreementById } from '../models/agreementModel';
import { getPaymentByTxHash } from '../models/paymentModel';
import { getEvidenceByTxHash } from '../models/evidenceModel';

export const verifyRouter = Router();

const publicLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  message: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests', statusCode: 429 } },
});

// GET /verify/agreement/:agreementId — verify by DB agreement UUID
verifyRouter.get('/agreement/:agreementId', publicLimiter, async (req, res: Response, next: NextFunction) => {
  try {
    const agreement = await getAgreementById(req.params["agreementId"] as string);
    if (!agreement || !agreement.onChainAgreementId) {
      res.status(404).json({ error: { code: 'NOT_ANCHORED', message: 'Agreement not anchored on-chain', statusCode: 404 } }); return;
    }
    let onChainData = null;
    try {
      onChainData = await blockchainService.getAgreement(agreement.onChainAgreementId);
    } catch {
      // blockchain read failure is non-fatal
    }
    res.json({
      agreementId: agreement.id,
      status: agreement.status,
      agreementHash: agreement.agreementHash,
      pdfIpfsCid: agreement.pdfIpfsCid,
      blockchainTxHash: agreement.blockchainTxHash,
      anchoredAt: agreement.blockchainAnchoredAt,
      onChainData,
      sepoliaUrl: agreement.blockchainTxHash
        ? `https://sepolia.etherscan.io/tx/${agreement.blockchainTxHash}`
        : null,
    });
  } catch (err) { next(err); }
});

// GET /verify/payment/:txHash — public payment verification by blockchain TX hash
verifyRouter.get('/payment/:txHash', publicLimiter, async (req, res: Response, next: NextFunction) => {
  try {
    const payment = await getPaymentByTxHash(req.params["txHash"] as string);
    if (!payment) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Payment not found for this TX hash', statusCode: 404 } }); return;
    }
    res.json({
      paymentId: payment.id,
      agreementId: payment.agreementId,
      paymentHash: payment.paymentHash,
      amount: payment.amount,
      paymentMonth: payment.paymentMonth,
      blockchainTxHash: payment.blockchainTxHash,
      anchoredAt: payment.blockchainAnchoredAt,
      sepoliaUrl: `https://sepolia.etherscan.io/tx/${payment.blockchainTxHash}`,
    });
  } catch (err) { next(err); }
});

// GET /verify/evidence/:txHash — public evidence verification by blockchain TX hash
verifyRouter.get('/evidence/:txHash', publicLimiter, async (req, res: Response, next: NextFunction) => {
  try {
    const evidence = await getEvidenceByTxHash(req.params["txHash"] as string);
    if (!evidence) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Evidence not found for this TX hash', statusCode: 404 } }); return;
    }
    res.json({
      evidenceId: evidence.id,
      agreementId: evidence.agreementId,
      evidenceType: evidence.evidenceType,
      evidenceHash: evidence.evidenceHash,
      ipfsCid: evidence.ipfsCidBundle,
      blockchainTxHash: evidence.blockchainTxHash,
      anchoredAt: evidence.blockchainAnchoredAt,
      sepoliaUrl: `https://sepolia.etherscan.io/tx/${evidence.blockchainTxHash}`,
    });
  } catch (err) { next(err); }
});
