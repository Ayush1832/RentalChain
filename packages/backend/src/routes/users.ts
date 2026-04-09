import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';

export const usersRouter = Router();

usersRouter.get('/me', authenticate, (_req, res) => {
  res.status(501).json({ message: 'TODO: get me' });
});

usersRouter.put('/me', authenticate, (_req, res) => {
  res.status(501).json({ message: 'TODO: update me' });
});

usersRouter.post('/me/kyc', authenticate, (_req, res) => {
  res.status(501).json({ message: 'TODO: submit kyc' });
});

usersRouter.get('/me/reputation', authenticate, (_req, res) => {
  res.status(501).json({ message: 'TODO: get reputation' });
});

usersRouter.get('/:id/public-profile', (_req, res) => {
  res.status(501).json({ message: 'TODO: public profile' });
});
