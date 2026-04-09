import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';

export const evidenceRouter = Router();

evidenceRouter.get('/:id', authenticate, (_req, res) => {
  res.status(501).json({ message: 'TODO: get evidence' });
});

evidenceRouter.get('/:id/verify', (_req, res) => {
  res.status(501).json({ message: 'TODO: verify evidence on-chain' });
});
