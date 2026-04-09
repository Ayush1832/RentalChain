import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';

export const agreementsRouter = Router();

agreementsRouter.get('/', authenticate, (_req, res) => {
  res.status(501).json({ message: 'TODO: list agreements' });
});

agreementsRouter.post('/', authenticate, (_req, res) => {
  res.status(501).json({ message: 'TODO: create agreement' });
});

agreementsRouter.get('/:id', authenticate, (_req, res) => {
  res.status(501).json({ message: 'TODO: get agreement' });
});

agreementsRouter.post('/:id/generate-pdf', authenticate, (_req, res) => {
  res.status(501).json({ message: 'TODO: generate pdf' });
});

agreementsRouter.post('/:id/sign', authenticate, (_req, res) => {
  res.status(501).json({ message: 'TODO: sign agreement' });
});

agreementsRouter.get('/:id/verify', (_req, res) => {
  res.status(501).json({ message: 'TODO: verify agreement on-chain' });
});

agreementsRouter.post('/:id/terminate', authenticate, (_req, res) => {
  res.status(501).json({ message: 'TODO: terminate agreement' });
});
