import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';

export const propertiesRouter = Router();

propertiesRouter.get('/', (_req, res) => {
  res.status(501).json({ message: 'TODO: list properties' });
});

propertiesRouter.post('/', authenticate, (_req, res) => {
  res.status(501).json({ message: 'TODO: create property' });
});

propertiesRouter.get('/:id', (_req, res) => {
  res.status(501).json({ message: 'TODO: get property' });
});

propertiesRouter.put('/:id', authenticate, (_req, res) => {
  res.status(501).json({ message: 'TODO: update property' });
});

propertiesRouter.post('/:id/images', authenticate, (_req, res) => {
  res.status(501).json({ message: 'TODO: upload images' });
});
