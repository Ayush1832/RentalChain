import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { propertiesRouter } from './routes/properties';
import { agreementsRouter } from './routes/agreements';
import { agreementPaymentsRouter } from './routes/agreements.payments';
import { paymentsRouter } from './routes/payments';
import { agreementEvidenceRouter, evidenceRouter } from './routes/evidence';
import { agreementMaintenanceRouter, maintenanceRouter } from './routes/maintenance';
import { disputesRouter } from './routes/disputes';
import { verifyRouter } from './routes/verify';
import { adminRouter } from './routes/admin';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

export const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Global rate limits
const apiLimiter = rateLimit({
  windowMs: 60_000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests', statusCode: 429 } },
});
app.use('/api', apiLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount agreement sub-routes before the main agreements router
agreementsRouter.use('/:id/payments', agreementPaymentsRouter);
agreementsRouter.use('/:id/evidence', agreementEvidenceRouter);
agreementsRouter.use('/:id/maintenance', agreementMaintenanceRouter);

// Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/properties', propertiesRouter);
app.use('/api/v1/agreements', agreementsRouter);
app.use('/api/v1/payments', paymentsRouter);
app.use('/api/v1/evidence', evidenceRouter);
app.use('/api/v1/maintenance', maintenanceRouter);
app.use('/api/v1/disputes', disputesRouter);
app.use('/api/v1/verify', verifyRouter);
app.use('/api/v1/admin', adminRouter);

// 404
app.use((_req, res) => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'Route not found', statusCode: 404 },
  });
});

// Error handler (must be last)
app.use(errorHandler);
