import { Router } from 'express';
import rateLimit from 'express-rate-limit';

export const verifyRouter = Router();

const publicLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  message: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests', statusCode: 429 } },
});

// Public — no auth required
verifyRouter.get('/agreement/:onChainId', publicLimiter, (_req, res) => {
  res.status(501).json({ message: 'TODO: verify agreement' });
});

verifyRouter.get('/payment/:txHash', publicLimiter, (_req, res) => {
  res.status(501).json({ message: 'TODO: verify payment' });
});

verifyRouter.get('/evidence/:txHash', publicLimiter, (_req, res) => {
  res.status(501).json({ message: 'TODO: verify evidence' });
});
