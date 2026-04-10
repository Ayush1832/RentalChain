import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ethers } from 'ethers';
import { authenticate } from '../middleware/authenticate';
import { AuthRequest } from '../types';
import {
  createAgreement, getAgreementById, listAgreementsForUser,
  setPDFDetails, recordSignature, activateAgreement, terminateAgreement,
} from '../models/agreementModel';
import { getPropertyById, updateProperty } from '../models/propertyModel';
import { findUserById } from '../models/userModel';
import { verifyOTP } from '../services/otp/OtpService';
import { generateAgreementPDF } from '../services/pdf/PDFService';
import { ipfsService } from '../services/ipfs/IPFSService';
import { blockchainService } from '../services/blockchain/BlockchainService';
import { hashBuffer } from '../utils/crypto';
import { logger } from '../utils/logger';

export const agreementsRouter = Router();

const CreateAgreementSchema = z.object({
  propertyId: z.string().uuid(),
  tenantId: z.string().uuid(),
  monthlyRent: z.number().int().positive(),
  securityDeposit: z.number().int().min(0),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  noticePeriodDays: z.number().int().min(7).max(180).optional(),
  rentDueDay: z.number().int().min(1).max(28).optional(),
});

// ─── GET /agreements ─────────────────────────────────────────────────────────

agreementsRouter.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const agreements = await listAgreementsForUser(req.user!.userId);
    res.json({ agreements });
  } catch (err) { next(err); }
});

// ─── POST /agreements ────────────────────────────────────────────────────────

agreementsRouter.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = CreateAgreementSchema.parse(req.body);

    const property = await getPropertyById(data.propertyId);
    if (!property) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Property not found', statusCode: 404 } }); return; }
    if (property.landlordId !== req.user!.userId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only the property landlord can create an agreement', statusCode: 403 } }); return;
    }

    const tenant = await findUserById(data.tenantId);
    if (!tenant) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Tenant not found', statusCode: 404 } }); return; }

    const agreement = await createAgreement({ ...data, landlordId: req.user!.userId });
    res.status(201).json({ agreement });
  } catch (err) { next(err); }
});

// ─── GET /agreements/:id ─────────────────────────────────────────────────────

agreementsRouter.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const agreement = await getAgreementById(req.params["id"] as string);
    if (!agreement) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Agreement not found', statusCode: 404 } }); return; }
    if (agreement.landlordId !== req.user!.userId && agreement.tenantId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied', statusCode: 403 } }); return;
    }
    res.json({ agreement });
  } catch (err) { next(err); }
});

// ─── POST /agreements/:id/generate-pdf ───────────────────────────────────────

agreementsRouter.post('/:id/generate-pdf', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const agreement = await getAgreementById(req.params["id"] as string);
    if (!agreement) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Agreement not found', statusCode: 404 } }); return; }
    if (agreement.landlordId !== req.user!.userId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only landlord can generate the PDF', statusCode: 403 } }); return;
    }

    const [property, landlord, tenant] = await Promise.all([
      getPropertyById(agreement.propertyId),
      findUserById(agreement.landlordId),
      findUserById(agreement.tenantId),
    ]);
    if (!property || !landlord || !tenant) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Related data not found', statusCode: 404 } }); return; }

    const pdfBuffer = await generateAgreementPDF({
      agreementId: agreement.id,
      landlord: { fullName: landlord.fullName, phone: landlord.phone },
      tenant: { fullName: tenant.fullName, phone: tenant.phone },
      property: { title: property.title, addressLine1: property.addressLine1, city: property.city, state: property.state, pincode: property.pincode },
      monthlyRent: agreement.monthlyRent,
      securityDeposit: agreement.securityDeposit,
      startDate: agreement.startDate,
      endDate: agreement.endDate,
      noticePeriodDays: agreement.noticePeriodDays,
      rentDueDay: agreement.rentDueDay,
      generatedAt: new Date().toISOString(),
    });

    const cid = await ipfsService.uploadFile(pdfBuffer, `agreement-${agreement.id}.pdf`, 'application/pdf');
    const url = ipfsService.getGatewayURL(cid);
    await setPDFDetails(agreement.id, cid, url);

    res.json({ pdfIpfsCid: cid, pdfUrl: url, status: 'PENDING_SIGNATURES' });
  } catch (err) { next(err); }
});

// ─── POST /agreements/:id/sign ───────────────────────────────────────────────

agreementsRouter.post('/:id/sign', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { otp, method = 'OTP' } = z.object({ otp: z.string().length(6), method: z.string().optional() }).parse(req.body);

    const agreement = await getAgreementById(req.params["id"] as string);
    if (!agreement) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Agreement not found', statusCode: 404 } }); return; }
    if (!agreement.pdfIpfsCid) {
      res.status(400).json({ error: { code: 'PDF_NOT_GENERATED', message: 'Generate the PDF first', statusCode: 400 } }); return;
    }

    const userId = req.user!.userId;
    const isLandlord = agreement.landlordId === userId;
    const isTenant = agreement.tenantId === userId;
    if (!isLandlord && !isTenant) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not a party to this agreement', statusCode: 403 } }); return;
    }

    const role = isLandlord ? 'LANDLORD' : 'TENANT';
    const alreadySigned = role === 'LANDLORD' ? agreement.landlordSignedAt : agreement.tenantSignedAt;
    if (alreadySigned) {
      res.status(400).json({ error: { code: 'ALREADY_SIGNED', message: `${role} has already signed`, statusCode: 400 } }); return;
    }

    // Verify OTP
    const user = await findUserById(userId);
    if (!user) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found', statusCode: 404 } }); return; }
    await verifyOTP(user.phone, otp);

    const updated = await recordSignature(agreement.id, role, method);

    // If both have signed — anchor on blockchain
    const bothSigned = updated.landlordSignedAt && updated.tenantSignedAt;
    if (bothSigned) {
      logger.info(`Both parties signed agreement ${agreement.id} — anchoring on blockchain`);

      try {
        // Fetch the PDF from IPFS (or use local buffer if just generated)
        const pdfUrl = updated.pdfCloudUrl!;
        const pdfResponse = await fetch(pdfUrl);
        const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
        const agreementHash = hashBuffer(pdfBuffer);

        // Get DIDs
        const [landlord, tenant] = await Promise.all([
          findUserById(updated.landlordId),
          findUserById(updated.tenantId),
        ]);
        const landlordDID = landlord?.didHash || ethers.id(`did:landlord:${updated.landlordId}`);
        const tenantDID = tenant?.didHash || ethers.id(`did:tenant:${updated.tenantId}`);

        const onChainAgreementId = ethers.id(updated.id);

        const txResult = await blockchainService.anchorAgreement(
          onChainAgreementId, agreementHash, landlordDID, tenantDID
        );

        const activated = await activateAgreement(updated.id, {
          agreementHash,
          pdfIpfsCid: updated.pdfIpfsCid!,
          pdfCloudUrl: updated.pdfCloudUrl!,
          blockchainTxHash: txResult.txHash,
          onChainAgreementId,
        });

        // Mark property as RENTED
        await updateProperty(agreement.propertyId, { listingStatus: 'RENTED' });

        res.json({
          agreement: activated,
          message: 'Agreement signed and anchored on blockchain',
          blockchainTxHash: txResult.txHash,
          sepoliaUrl: `https://sepolia.etherscan.io/tx/${txResult.txHash}`,
        });
      } catch (blockchainErr) {
        logger.error('Blockchain anchoring failed, agreement activated without chain proof', blockchainErr);
        // Still activate — blockchain can be retried
        res.json({ agreement: updated, message: 'Both parties signed. Blockchain anchoring pending.', blockchainPending: true });
      }
    } else {
      res.json({ agreement: updated, message: `${role} signed. Waiting for other party.` });
    }
  } catch (err) { next(err); }
});

// ─── GET /agreements/:id/verify ──────────────────────────────────────────────

agreementsRouter.get('/:id/verify', async (req, res: Response, next: NextFunction) => {
  try {
    const agreement = await getAgreementById(req.params["id"] as string);
    if (!agreement || !agreement.onChainAgreementId) {
      res.status(404).json({ error: { code: 'NOT_ANCHORED', message: 'Agreement not anchored on-chain', statusCode: 404 } }); return;
    }
    const onChain = await blockchainService.getAgreement(agreement.onChainAgreementId);
    res.json({
      agreementId: agreement.id,
      onChainAgreementId: agreement.onChainAgreementId,
      agreementHash: agreement.agreementHash,
      blockchainTxHash: agreement.blockchainTxHash,
      anchoredAt: agreement.blockchainAnchoredAt,
      onChainData: onChain,
      sepoliaUrl: `https://sepolia.etherscan.io/tx/${agreement.blockchainTxHash}`,
    });
  } catch (err) { next(err); }
});

// ─── POST /agreements/:id/terminate ──────────────────────────────────────────

agreementsRouter.post('/:id/terminate', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { reason } = z.object({ reason: z.string().min(5) }).parse(req.body);
    const agreement = await getAgreementById(req.params["id"] as string);
    if (!agreement) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Agreement not found', statusCode: 404 } }); return; }
    if (agreement.landlordId !== req.user!.userId && agreement.tenantId !== req.user!.userId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied', statusCode: 403 } }); return;
    }
    await terminateAgreement(agreement.id, reason);
    await updateProperty(agreement.propertyId, { listingStatus: 'ACTIVE' });
    res.json({ message: 'Agreement terminated' });
  } catch (err) { next(err); }
});
