import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';

export const disputesRouter = Router();

disputesRouter.get('/', authenticate, (_req, res) => {
  res.status(501).json({ message: 'TODO: list disputes' });
});

disputesRouter.post('/', authenticate, (_req, res) => {
  res.status(501).json({ message: 'TODO: create dispute' });
});

disputesRouter.get('/:id', authenticate, (_req, res) => {
  res.status(501).json({ message: 'TODO: get dispute' });
});

disputesRouter.put('/:id/resolve', authenticate, (_req, res) => {
  res.status(501).json({ message: 'TODO: resolve dispute' });
});
