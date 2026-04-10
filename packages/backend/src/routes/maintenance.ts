import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { AuthRequest } from '../types';
import { getAgreementById } from '../models/agreementModel';
import { createTicket, listTicketsForAgreement, getTicketById, updateTicket } from '../models/maintenanceModel';

export const maintenanceRouter = Router();
export const agreementMaintenanceRouter = Router({ mergeParams: true });

const CreateTicketSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  category: z.enum(['PLUMBING', 'ELECTRICAL', 'APPLIANCE', 'STRUCTURAL', 'OTHER']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
});

// GET /agreements/:id/maintenance
agreementMaintenanceRouter.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const agreement = await getAgreementById(req.params["id"] as string);
    if (!agreement) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Agreement not found', statusCode: 404 } }); return; }
    if (agreement.landlordId !== req.user!.userId && agreement.tenantId !== req.user!.userId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied', statusCode: 403 } }); return;
    }
    const tickets = await listTicketsForAgreement(req.params["id"] as string);
    res.json({ tickets });
  } catch (err) { next(err); }
});

// POST /agreements/:id/maintenance
agreementMaintenanceRouter.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = CreateTicketSchema.parse(req.body);
    const agreement = await getAgreementById(req.params["id"] as string);
    if (!agreement) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Agreement not found', statusCode: 404 } }); return; }
    if (agreement.landlordId !== req.user!.userId && agreement.tenantId !== req.user!.userId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied', statusCode: 403 } }); return;
    }
    const ticket = await createTicket({ ...data, agreementId: req.params["id"] as string, raisedBy: req.user!.userId });
    res.status(201).json({ ticket });
  } catch (err) { next(err); }
});

// GET /maintenance/:id
maintenanceRouter.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ticket = await getTicketById(req.params["id"] as string);
    if (!ticket) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found', statusCode: 404 } }); return; }
    const agreement = await getAgreementById(ticket.agreementId);
    if (agreement?.landlordId !== req.user!.userId && agreement?.tenantId !== req.user!.userId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied', statusCode: 403 } }); return;
    }
    res.json({ ticket });
  } catch (err) { next(err); }
});

// PUT /maintenance/:id
maintenanceRouter.put('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const updates = z.object({
      status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
      resolutionNotes: z.string().max(2000).optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    }).parse(req.body);

    const ticket = await getTicketById(req.params["id"] as string);
    if (!ticket) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found', statusCode: 404 } }); return; }
    const agreement = await getAgreementById(ticket.agreementId);
    if (agreement?.landlordId !== req.user!.userId && agreement?.tenantId !== req.user!.userId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied', statusCode: 403 } }); return;
    }
    const updated = await updateTicket(req.params["id"] as string, updates);
    res.json({ ticket: updated });
  } catch (err) { next(err); }
});
