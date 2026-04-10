import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { sendOTP, verifyOTP } from '../services/otp/OtpService';
import { findUserByPhone, createUser, findUserById } from '../models/userModel';
import { saveRefreshToken, validateRefreshToken, revokeRefreshToken } from '../models/tokenModel';
import { signAccessToken, signRefreshToken, verifyRefreshToken, getRefreshExpiry } from '../utils/jwt';
import { authenticate } from '../middleware/authenticate';
import { AuthRequest } from '../types';

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  message: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many auth requests', statusCode: 429 } },
});

// ─── Schemas ────────────────────────────────────────────────────────────────

const SendOtpSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
});

const VerifyOtpSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/),
  otp: z.string().length(6).regex(/^\d+$/),
});

// ─── POST /auth/send-otp ─────────────────────────────────────────────────────

authRouter.post('/send-otp', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = SendOtpSchema.parse(req.body);
    await sendOTP(phone);
    res.json({ message: 'OTP sent', expiresIn: 300 });
  } catch (err) {
    next(err);
  }
});

// ─── POST /auth/verify-otp ───────────────────────────────────────────────────

authRouter.post('/verify-otp', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, otp } = VerifyOtpSchema.parse(req.body);
    await verifyOTP(phone, otp);

    // Find or create user
    let user = await findUserByPhone(phone);
    if (!user) {
      user = await createUser({ phone });
    }

    // Issue tokens
    const accessToken = signAccessToken({
      userId: user.id,
      role: user.role,
      didHash: user.didHash,
    });
    const refreshToken = signRefreshToken(user.id);
    await saveRefreshToken(user.id, refreshToken, getRefreshExpiry());

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
        kycStatus: user.kycStatus,
        didHash: user.didHash,
        reputationScore: user.reputationScore,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /auth/refresh ──────────────────────────────────────────────────────

authRouter.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);

    // Verify JWT signature
    const { userId } = verifyRefreshToken(refreshToken);

    // Check DB (not revoked)
    const validUserId = await validateRefreshToken(refreshToken);
    if (!validUserId || validUserId !== userId) {
      res.status(401).json({ error: { code: 'INVALID_REFRESH_TOKEN', message: 'Invalid or revoked refresh token', statusCode: 401 } });
      return;
    }

    const user = await findUserById(userId);
    if (!user) {
      res.status(401).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found', statusCode: 401 } });
      return;
    }

    // Rotate refresh token
    await revokeRefreshToken(refreshToken);
    const newRefreshToken = signRefreshToken(user.id);
    await saveRefreshToken(user.id, newRefreshToken, getRefreshExpiry());

    const accessToken = signAccessToken({
      userId: user.id,
      role: user.role,
      didHash: user.didHash,
    });

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
});

// ─── POST /auth/logout ───────────────────────────────────────────────────────

authRouter.post('/logout', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string().optional() }).parse(req.body);
    if (refreshToken) await revokeRefreshToken(refreshToken);
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
});
