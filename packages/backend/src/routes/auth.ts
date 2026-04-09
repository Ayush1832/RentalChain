import { Router } from 'express';
import rateLimit from 'express-rate-limit';

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  message: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many auth requests', statusCode: 429 } },
});

// POST /api/v1/auth/send-otp
authRouter.post('/send-otp', authLimiter, (_req, res) => {
  res.status(501).json({ message: 'TODO: send-otp' });
});

// POST /api/v1/auth/verify-otp
authRouter.post('/verify-otp', authLimiter, (_req, res) => {
  res.status(501).json({ message: 'TODO: verify-otp' });
});

// POST /api/v1/auth/refresh
authRouter.post('/refresh', (_req, res) => {
  res.status(501).json({ message: 'TODO: refresh' });
});

// POST /api/v1/auth/logout
authRouter.post('/logout', (_req, res) => {
  res.status(501).json({ message: 'TODO: logout' });
});
