import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/authenticate';
import { upload } from '../middleware/upload';
import { ipfsService } from '../services/ipfs/IPFSService';
import {
  createProperty, getPropertyById, listProperties, updateProperty, addPropertyImage,
} from '../models/propertyModel';
import { AuthRequest, PropertyType, ListingStatus } from '../types';

export const propertiesRouter = Router();

const CreatePropertySchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().max(2000).optional(),
  addressLine1: z.string().min(5),
  addressLine2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().regex(/^\d{6}$/),
  propertyType: z.enum(['APARTMENT', 'HOUSE', 'PG', 'COMMERCIAL']),
  bedrooms: z.number().int().min(0).max(20).optional(),
  bathrooms: z.number().int().min(0).max(10).optional(),
  areaSqft: z.number().int().min(50).optional(),
  monthlyRent: z.number().int().positive(),
  securityDeposit: z.number().int().min(0).optional(),
  isFurnished: z.boolean().optional(),
  amenities: z.array(z.string()).optional(),
});

// ─── GET /properties ─────────────────────────────────────────────────────────

propertiesRouter.get('/', async (req, res: Response, next: NextFunction) => {
  try {
    const q = req.query;
    const { properties, total } = await listProperties({
      city: q.city as string,
      minRent: q.minRent ? parseInt(q.minRent as string) : undefined,
      maxRent: q.maxRent ? parseInt(q.maxRent as string) : undefined,
      propertyType: q.type as PropertyType,
      bedrooms: q.bedrooms ? parseInt(q.bedrooms as string) : undefined,
      landlordId: q.mine === 'true' ? (req as AuthRequest).user?.userId : undefined,
      status: (q.status as ListingStatus) || 'ACTIVE',
      page: q.page ? parseInt(q.page as string) : 1,
      limit: q.limit ? parseInt(q.limit as string) : 20,
    });
    res.json({ properties, total, page: parseInt((q.page as string) || '1') });
  } catch (err) { next(err); }
});

// ─── POST /properties ────────────────────────────────────────────────────────

propertiesRouter.post('/', authenticate, requireRole('LANDLORD', 'BOTH', 'ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = CreatePropertySchema.parse(req.body);
    const property = await createProperty({ ...data, landlordId: req.user!.userId, propertyType: data.propertyType as PropertyType });
    res.status(201).json({ property });
  } catch (err) { next(err); }
});

// ─── GET /properties/:id ─────────────────────────────────────────────────────

propertiesRouter.get('/:id', async (req, res: Response, next: NextFunction) => {
  try {
    const property = await getPropertyById(req.params["id"] as string);
    if (!property) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Property not found', statusCode: 404 } }); return; }
    res.json({ property });
  } catch (err) { next(err); }
});

// ─── PUT /properties/:id ─────────────────────────────────────────────────────

propertiesRouter.put('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const property = await getPropertyById(req.params["id"] as string);
    if (!property) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Property not found', statusCode: 404 } }); return; }
    if (property.landlordId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not your property', statusCode: 403 } }); return;
    }
    const updates = CreatePropertySchema.partial().parse(req.body);
    const updated = await updateProperty(req.params["id"] as string, updates as Parameters<typeof updateProperty>[1]);
    res.json({ property: updated });
  } catch (err) { next(err); }
});

// ─── DELETE /properties/:id ──────────────────────────────────────────────────

propertiesRouter.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const property = await getPropertyById(req.params["id"] as string);
    if (!property) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Property not found', statusCode: 404 } }); return; }
    if (property.landlordId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not your property', statusCode: 403 } }); return;
    }
    // Soft-delete by setting status INACTIVE
    await updateProperty(req.params["id"] as string, { listingStatus: 'INACTIVE' } as Parameters<typeof updateProperty>[1]);
    res.json({ message: 'Property deactivated' });
  } catch (err) { next(err); }
});

// ─── GET /properties/:id/images ──────────────────────────────────────────────

propertiesRouter.get('/:id/images', async (req, res: Response, next: NextFunction) => {
  try {
    const property = await getPropertyById(req.params["id"] as string);
    if (!property) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Property not found', statusCode: 404 } }); return; }
    res.json({ images: property.images ?? [] });
  } catch (err) { next(err); }
});

// ─── POST /properties/:id/images ─────────────────────────────────────────────

propertiesRouter.post('/:id/images', authenticate, upload.array('images', 10), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const property = await getPropertyById(req.params["id"] as string);
    if (!property) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Property not found', statusCode: 404 } }); return; }
    if (property.landlordId !== req.user!.userId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not your property', statusCode: 403 } }); return;
    }

    const files = req.files as Express.Multer.File[];
    if (!files?.length) { res.status(400).json({ error: { code: 'NO_FILES', message: 'No images uploaded', statusCode: 400 } }); return; }

    const uploaded: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const cid = await ipfsService.uploadFile(file.buffer, file.originalname, file.mimetype);
      await addPropertyImage({
        propertyId: req.params["id"] as string,
        ipfsCid: cid,
        cloudUrl: ipfsService.getGatewayURL(cid),
        isPrimary: i === 0 && req.body.setPrimary === 'true',
      });
      uploaded.push(cid);
    }

    res.json({ uploaded, message: `${uploaded.length} images uploaded to IPFS` });
  } catch (err) { next(err); }
});
