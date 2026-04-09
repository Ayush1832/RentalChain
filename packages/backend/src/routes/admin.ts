import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authenticate';

export const adminRouter = Router();

adminRouter.use(authenticate, requireRole('ADMIN'));

adminRouter.get('/kyc/pending', (_req, res) => {
  res.status(501).json({ message: 'TODO: list pending KYC' });
});

adminRouter.post('/kyc/:userId/approve', (_req, res) => {
  res.status(501).json({ message: 'TODO: approve KYC' });
});

adminRouter.post('/kyc/:userId/reject', (_req, res) => {
  res.status(501).json({ message: 'TODO: reject KYC' });
});

adminRouter.get('/disputes', (_req, res) => {
  res.status(501).json({ message: 'TODO: list all disputes' });
});

adminRouter.put('/disputes/:id/assign', (_req, res) => {
  res.status(501).json({ message: 'TODO: assign mediator' });
});

adminRouter.get('/users', (_req, res) => {
  res.status(501).json({ message: 'TODO: list users' });
});
