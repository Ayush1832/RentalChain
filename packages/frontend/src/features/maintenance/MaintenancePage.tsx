import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import type { MaintenanceTicket, Agreement } from '../../types';

const createSchema = z.object({
  title: z.string().min(5, 'Title too short').max(200),
  description: z.string().min(10, 'Describe the issue in detail').max(2000),
  category: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
});
type CreateData = z.infer<typeof createSchema>;

const updateSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
  resolutionNotes: z.string().max(1000).optional(),
});
type UpdateData = z.infer<typeof updateSchema>;

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-yellow-100 text-yellow-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-600',
};

function TicketCard({ ticket, agreementId, onUpdate }: { ticket: MaintenanceTicket; agreementId: string; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();

  const { register, handleSubmit } = useForm<UpdateData>({
    defaultValues: { status: ticket.status },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateData) => api.put(`/maintenance/${ticket.id}`, data),
    onSuccess: () => {
      toast.success('Ticket updated');
      queryClient.invalidateQueries({ queryKey: ['maintenance', agreementId] });
      onUpdate();
      setExpanded(false);
    },
    onError: () => toast.error('Failed to update ticket'),
  });

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{ticket.title}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{ticket.category} · {new Date(ticket.createdAt).toLocaleDateString('en-IN')}</p>
        </div>
        <div className="flex items-center gap-2 ml-3">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${PRIORITY_COLORS[ticket.priority]}`}>
            {ticket.priority}
          </span>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[ticket.status]}`}>
            {ticket.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      <p className="text-sm text-gray-600 mt-2">{ticket.description}</p>

      {ticket.resolutionNotes && (
        <div className="mt-3 p-3 bg-green-50 border border-green-100 rounded-lg">
          <p className="text-xs font-medium text-green-700 mb-1">Resolution</p>
          <p className="text-sm text-green-800">{ticket.resolutionNotes}</p>
        </div>
      )}

      {ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED' && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-xs text-brand-600 hover:underline"
        >
          {expanded ? 'Cancel' : 'Update Status'}
        </button>
      )}

      {expanded && (
        <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="mt-3 space-y-3 border-t border-gray-100 pt-3">
          <div>
            <label className="label">New Status</label>
            <select {...register('status')} className="input">
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div>
            <label className="label">Resolution Notes (optional)</label>
            <textarea {...register('resolutionNotes')} rows={2} className="input resize-none" placeholder="What was done to fix this?" />
          </div>
          <button type="submit" disabled={updateMutation.isPending} className="btn-primary text-sm py-1.5">
            {updateMutation.isPending ? 'Saving…' : 'Save Update'}
          </button>
        </form>
      )}
    </div>
  );
}

// Per-agreement maintenance view (used from agreement detail)
export function AgreementMaintenancePage() {
  const { id: agreementId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['maintenance', agreementId],
    queryFn: () => api.get<{ tickets: MaintenanceTicket[] }>(`/agreements/${agreementId}/maintenance`).then(r => r.data.tickets),
    enabled: !!agreementId,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateData>({
    resolver: zodResolver(createSchema),
    defaultValues: { priority: 'MEDIUM' },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateData) => api.post(`/agreements/${agreementId}/maintenance`, data),
    onSuccess: () => {
      toast.success('Ticket raised');
      queryClient.invalidateQueries({ queryKey: ['maintenance', agreementId] });
      setShowCreate(false);
      reset();
    },
    onError: () => toast.error('Failed to create ticket'),
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to={`/agreements/${agreementId}`} className="text-gray-400 hover:text-gray-600">←</Link>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary">
          {showCreate ? 'Cancel' : '+ Raise Ticket'}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="bg-white border border-brand-200 rounded-xl p-6 mb-6 space-y-4">
          <h2 className="font-semibold text-gray-800">New Maintenance Ticket</h2>
          <div>
            <label className="label">Title</label>
            <input {...register('title')} placeholder="Leaking pipe in bathroom" className="input" />
            {errors.title && <p className="error">{errors.title.message}</p>}
          </div>
          <div>
            <label className="label">Description</label>
            <textarea {...register('description')} rows={3} className="input resize-none" placeholder="Describe the issue in detail…" />
            {errors.description && <p className="error">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select {...register('category')} className="input">
                <option value="">Select…</option>
                {['Plumbing', 'Electrical', 'Appliances', 'Structural', 'Pest Control', 'Cleaning', 'Other'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select {...register('priority')} className="input">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={createMutation.isPending} className="btn-primary w-full">
            {createMutation.isPending ? 'Raising…' : 'Raise Ticket'}
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : !tickets?.length ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-xl text-gray-400">
          No maintenance tickets yet
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map(t => (
            <TicketCard key={t.id} ticket={t} agreementId={agreementId!} onUpdate={() => {}} />
          ))}
        </div>
      )}
    </div>
  );
}

// Global maintenance page — shows all tickets across all agreements
export function MaintenancePage() {
  const queryClient = useQueryClient();

  const { data: agreements } = useQuery({
    queryKey: ['agreements'],
    queryFn: () => api.get<{ agreements: Agreement[] }>('/agreements').then(r => r.data.agreements),
  });

  const { data: allTickets, isLoading } = useQuery({
    queryKey: ['all-maintenance'],
    queryFn: async () => {
      if (!agreements?.length) return [];
      const results = await Promise.all(
        agreements.map(a =>
          api.get<{ tickets: MaintenanceTicket[] }>(`/agreements/${a.id}/maintenance`)
            .then(r => r.data.tickets.map(t => ({ ...t, _agreement: a })))
            .catch(() => [])
        )
      );
      return results.flat().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    enabled: !!agreements,
  });

  const openTickets = allTickets?.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS') ?? [];
  const closedTickets = allTickets?.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED') ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Maintenance</h1>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : !allTickets?.length ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
          <p className="text-gray-400">No maintenance tickets</p>
          <p className="text-xs text-gray-400 mt-1">Raise tickets from within an active agreement</p>
        </div>
      ) : (
        <div className="space-y-8">
          {openTickets.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Open ({openTickets.length})</h2>
              <div className="space-y-3">
                {openTickets.map(t => (
                  <TicketCard key={t.id} ticket={t} agreementId={t.agreementId} onUpdate={() => queryClient.invalidateQueries({ queryKey: ['all-maintenance'] })} />
                ))}
              </div>
            </div>
          )}
          {closedTickets.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Resolved / Closed ({closedTickets.length})</h2>
              <div className="space-y-3">
                {closedTickets.map(t => (
                  <TicketCard key={t.id} ticket={t} agreementId={t.agreementId} onUpdate={() => queryClient.invalidateQueries({ queryKey: ['all-maintenance'] })} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
