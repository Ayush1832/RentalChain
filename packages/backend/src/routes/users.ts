import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { findUserById, findUserByPhone, updateUser, setKYCStatus } from '../models/userModel';
import { createKYCRecord, getKYCRecord } from '../models/kycModel';
import { AuthRequest, UserRole } from '../types';

export const usersRouter = Router();

// ─── GET /users/me ───────────────────────────────────────────────────────────

usersRouter.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await findUserById(req.user!.userId);
    if (!user) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found', statusCode: 404 } }); return; }
    res.json({ user });
  } catch (err) { next(err); }
});

// ─── PUT /users/me ───────────────────────────────────────────────────────────

const UpdateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(['TENANT', 'LANDLORD', 'BOTH']).optional(),
});

usersRouter.put('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = UpdateProfileSchema.parse(req.body);
    const user = await updateUser(req.user!.userId, data as Partial<{ fullName: string; email: string; role: UserRole }>);
    res.json({ user });
  } catch (err) { next(err); }
});

// ─── POST /users/me/kyc ──────────────────────────────────────────────────────

const KYCSchema = z.object({
  aadhaarNumber: z.string().regex(/^\d{12}$/, 'Aadhaar must be 12 digits'),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Invalid PAN format'),
  fullName: z.string().min(2).max(100),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  address: z.string().min(10).max(500).optional(),
});

usersRouter.post('/me/kyc', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await findUserById(req.user!.userId);
    if (!user) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found', statusCode: 404 } }); return; }

    if (user.kycStatus === 'VERIFIED') {
      res.status(400).json({ error: { code: 'KYC_ALREADY_VERIFIED', message: 'KYC already verified', statusCode: 400 } });
      return;
    }

    const data = KYCSchema.parse(req.body);
    // Also update fullName on user profile if not already set
    if (data.fullName && !user.fullName) {
      await updateUser(user.id, { fullName: data.fullName });
    }
    await createKYCRecord({ userId: user.id, aadhaarNumber: data.aadhaarNumber, panNumber: data.panNumber });
    await setKYCStatus(user.id, 'SUBMITTED');

    res.json({ kycStatus: 'SUBMITTED', message: 'KYC submitted for review. You will be notified once verified.' });
  } catch (err) { next(err); }
});

// ─── GET /users/me/kyc ───────────────────────────────────────────────────────

usersRouter.get('/me/kyc', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const kyc = await getKYCRecord(req.user!.userId);
    const user = await findUserById(req.user!.userId);
    res.json({ kycStatus: user?.kycStatus, kyc });
  } catch (err) { next(err); }
});

// ─── GET /users/me/reputation ────────────────────────────────────────────────

usersRouter.get('/me/reputation', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await findUserById(req.user!.userId);
    if (!user) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found', statusCode: 404 } }); return; }
    res.json({
      score: user.reputationScore,
      didHash: user.didHash,
      kycStatus: user.kycStatus,
    });
  } catch (err) { next(err); }
});

// ─── GET /users/by-phone?phone=XXXXXXXXXX ────────────────────────────────────

usersRouter.get('/by-phone', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const phone = z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone').parse(req.query['phone']);
    const user = await findUserByPhone(phone);
    if (!user) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'No user with that phone number', statusCode: 404 } }); return; }
    // Return only what the caller needs — no sensitive PII
    res.json({ user: { id: user.id, fullName: user.fullName, role: user.role, kycStatus: user.kycStatus } });
  } catch (err) { next(err); }
});

// ─── GET /users/:id/public-profile ───────────────────────────────────────────

usersRouter.get('/:id/public-profile', async (req, res: Response, next: NextFunction) => {
  try {
    const user = await findUserById(req.params.id);
    if (!user) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found', statusCode: 404 } }); return; }
    // Return only public fields — no PII
    res.json({
      id: user.id,
      role: user.role,
      didHash: user.didHash,
      kycStatus: user.kycStatus,
      reputationScore: user.reputationScore,
    });
  } catch (err) { next(err); }
});
