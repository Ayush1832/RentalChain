import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
        statusCode: 400,
      },
    });
    return;
  }

  // Known app errors
  const appErr = err as unknown as { statusCode?: number; code?: string; message: string };
  if (appErr.statusCode) {
    res.status(appErr.statusCode).json({
      error: { code: appErr.code ?? 'ERROR', message: appErr.message, statusCode: appErr.statusCode },
    });
    return;
  }

  // Unexpected error
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      statusCode: 500,
    },
  });
}
