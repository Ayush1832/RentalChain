import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import type { Dispute } from '../../types';

const STATUS_COLORS: Record<string, string> = {
  FILED: 'bg-yellow-100 text-yellow-700',
  UNDER_REVIEW: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-green-100 text-green-700',
  DISMISSED: 'bg-gray-100 text-gray-500',
};

const RESOLUTION_OUTCOMES = ['LANDLORD_WINS', 'TENANT_WINS', 'MUTUAL_SETTLEMENT', 'DISMISSED'] as const;

export function AdminDisputesPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<string>('MUTUAL_SETTLEMENT');
  const [notes, setNotes] = useState('');

  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-disputes', statusFilter],
    queryFn: () =>
      api.get<{ disputes: Dispute[] }>(`/admin/disputes${statusFilter ? `?status=${statusFilter}` : ''}`).then(r => r.data.disputes),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, outcome, notes }: { id: string; outcome: string; notes: string }) =>
      api.post(`/disputes/${id}/resolve`, { outcome, notes }),
    onSuccess: () => {
      toast.success('Dispute resolved');
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      setResolvingId(null);
      setNotes('');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message ?? 'Failed to resolve'),
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Disputes</h1>
          <p className="text-sm text-gray-500 mt-1">Admin view — resolve, review, dismiss</p>
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="input py-1.5 text-sm w-40"
        >
          <option value="">All statuses</option>
          <option value="FILED">Filed</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : !data?.length ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-xl text-gray-400">
          No disputes {statusFilter ? `with status "${statusFilter}"` : ''}
        </div>
      ) : (
        <div className="space-y-4">
          {data.map(d => (
            <div key={d.id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{d.disputeType.replace(/_/g, ' ')}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[d.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {d.status.replace('_', ' ')}
                    </span>
                    {d.blockchainTxHash && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium border border-green-100">On-chain</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{d.description?.slice(0, 120)}{d.description && d.description.length > 120 ? '…' : ''}</p>
                  <p className="text-xs text-gray-400 mt-1.5">
                    Filed {new Date(d.createdAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Link to={`/disputes/${d.id}`} className="btn-secondary text-xs py-1 px-3">
                    View
                  </Link>
                  {d.status !== 'RESOLVED' && d.status !== 'DISMISSED' && d.status !== 'CLOSED' && (
                    <button
                      onClick={() => setResolvingId(resolvingId === d.id ? null : d.id)}
                      className="btn-primary text-xs py-1 px-3"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>

              {resolvingId === d.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                  <div>
                    <label className="label">Outcome</label>
                    <select value={outcome} onChange={e => setOutcome(e.target.value)} className="input">
                      {RESOLUTION_OUTCOMES.map(o => (
                        <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Resolution Notes</label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={3}
                      className="input resize-none"
                      placeholder="Explain the resolution…"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => resolveMutation.mutate({ id: d.id, outcome, notes })}
                      disabled={resolveMutation.isPending}
                      className="btn-primary text-sm py-1.5"
                    >
                      {resolveMutation.isPending ? 'Saving…' : 'Confirm Resolution'}
                    </button>
                    <button onClick={() => setResolvingId(null)} className="btn-secondary text-sm py-1.5">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
