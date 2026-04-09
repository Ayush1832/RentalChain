import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';

export const maintenanceRouter = Router();

maintenanceRouter.get('/:id', authenticate, (_req, res) => {
  res.status(501).json({ message: 'TODO: get maintenance ticket' });
});

maintenanceRouter.put('/:id', authenticate, (_req, res) => {
  res.status(501).json({ message: 'TODO: update maintenance ticket' });
});
