import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';

export const paymentsRouter = Router();

paymentsRouter.get('/:id', authenticate, (_req, res) => {
  res.status(501).json({ message: 'TODO: get payment' });
});

paymentsRouter.post('/:id/confirm', authenticate, (_req, res) => {
  res.status(501).json({ message: 'TODO: confirm payment' });
});

paymentsRouter.get('/:id/verify', (_req, res) => {
  res.status(501).json({ message: 'TODO: verify payment on-chain' });
});
