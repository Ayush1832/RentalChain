import { db } from './db';

export interface MaintenanceTicket {
  id: string;
  agreementId: string;
  raisedBy: string;
  title: string;
  description: string;
  category?: string;
  priority: string;
  status: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

function rowToTicket(row: Record<string, unknown>): MaintenanceTicket {
  return {
    id: row.id as string,
    agreementId: row.agreement_id as string,
    raisedBy: row.raised_by as string,
    title: row.title as string,
    description: row.description as string,
    category: (row.category as string) || undefined,
    priority: row.priority as string,
    status: row.status as string,
    resolvedAt: (row.resolved_at as Date) || undefined,
    resolutionNotes: (row.resolution_notes as string) || undefined,
    createdAt: row.created_at as Date,
    updatedAt: row.updated_at as Date,
  };
}

export async function createTicket(data: {
  agreementId: string;
  raisedBy: string;
  title: string;
  description: string;
  category?: string;
  priority?: string;
}): Promise<MaintenanceTicket> {
  const result = await db.query(
    `INSERT INTO maintenance_tickets (agreement_id, raised_by, title, description, category, priority)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [data.agreementId, data.raisedBy, data.title, data.description, data.category || null, data.priority || 'MEDIUM']
  );
  return rowToTicket(result.rows[0]);
}

export async function listTicketsForAgreement(agreementId: string): Promise<MaintenanceTicket[]> {
  const result = await db.query(
    `SELECT * FROM maintenance_tickets WHERE agreement_id = $1 ORDER BY created_at DESC`,
    [agreementId]
  );
  return result.rows.map(rowToTicket);
}

export async function getTicketById(id: string): Promise<MaintenanceTicket | null> {
  const result = await db.query(`SELECT * FROM maintenance_tickets WHERE id = $1`, [id]);
  return result.rows.length ? rowToTicket(result.rows[0]) : null;
}

export async function updateTicket(id: string, updates: {
  status?: string;
  resolutionNotes?: string;
  priority?: string;
}): Promise<MaintenanceTicket> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  if (updates.status) { fields.push(`status=$${idx++}`); values.push(updates.status); }
  if (updates.resolutionNotes) { fields.push(`resolution_notes=$${idx++}`); values.push(updates.resolutionNotes); }
  if (updates.priority) { fields.push(`priority=$${idx++}`); values.push(updates.priority); }
  if (updates.status === 'RESOLVED') { fields.push(`resolved_at=NOW()`); }
  fields.push(`updated_at=NOW()`);
  values.push(id);
  const result = await db.query(
    `UPDATE maintenance_tickets SET ${fields.join(',')} WHERE id=$${idx} RETURNING *`,
    values
  );
  return rowToTicket(result.rows[0]);
}
