import { Router, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../middleware/authenticate';
import { AuthRequest } from '../types';
import { findUserById, setKYCStatus, listPendingKYC } from '../models/userModel';
import { approveKYC } from '../models/kycModel';
import { listAllDisputes } from '../models/disputeModel';
import { generateDIDHash } from '../utils/crypto';
import { blockchainService } from '../services/blockchain/BlockchainService';
import { setUserDID } from '../models/userModel';
import { logger } from '../utils/logger';

export const adminRouter = Router();
adminRouter.use(authenticate, requireRole('ADMIN'));

// GET /admin/kyc/pending
adminRouter.get('/kyc/pending', async (_req, res: Response, next: NextFunction) => {
  try {
    const pending = await listPendingKYC();
    res.json({ users: pending });
  } catch (err) { next(err); }
});

// POST /admin/kyc/:userId/approve
adminRouter.post('/kyc/:userId/approve', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await findUserById(req.params["userId"] as string);
    if (!user) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found', statusCode: 404 } }); return; }

    await approveKYC(user.id, req.user!.userId);
    await setKYCStatus(user.id, 'VERIFIED');

    // Create DID if not exists
    if (!user.didHash) {
      const didHash = generateDIDHash(user.id, user.createdAt);
      await setUserDID(user.id, didHash);

      // Register on blockchain (best-effort)
      setImmediate(async () => {
        try {
          // Use a deterministic address derived from DID for MVP
          const { ethers } = await import('ethers');
          const wallet = ethers.Wallet.createRandom();
          await blockchainService.registerDID(didHash, wallet.address);
          logger.info(`DID registered on-chain for user ${user.id}: ${didHash}`);
        } catch (err) {
          logger.error('DID blockchain registration failed', err);
        }
      });
    }

    res.json({ message: 'KYC approved', userId: user.id });
  } catch (err) { next(err); }
});

// POST /admin/kyc/:userId/reject
adminRouter.post('/kyc/:userId/reject', async (req, res: Response, next: NextFunction) => {
  try {
    const user = await findUserById(req.params["userId"] as string);
    if (!user) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found', statusCode: 404 } }); return; }
    await setKYCStatus(user.id, 'REJECTED');
    res.json({ message: 'KYC rejected', userId: user.id });
  } catch (err) { next(err); }
});

// GET /admin/disputes
adminRouter.get('/disputes', async (req, res: Response, next: NextFunction) => {
  try {
    const disputes = await listAllDisputes(req.query.status as string);
    res.json({ disputes });
  } catch (err) { next(err); }
});

// GET /admin/users
adminRouter.get('/users', async (_req, res: Response, next: NextFunction) => {
  try {
    const pending = await listPendingKYC();
    res.json({ users: pending });
  } catch (err) { next(err); }
});
