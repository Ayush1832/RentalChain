import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import type { Dispute } from '../../types';

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-700',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-600',
};

const TYPE_LABELS: Record<string, string> = {
  DEPOSIT_REFUND: 'Deposit Refund',
  PROPERTY_DAMAGE: 'Property Damage',
  UNPAID_RENT: 'Unpaid Rent',
  AGREEMENT_BREACH: 'Agreement Breach',
  OTHER: 'Other',
};

function DisputeRow({ d }: { d: Dispute }) {
  return (
    <Link
      to={`/disputes/${d.id}`}
      className="flex items-center justify-between p-4 hover:bg-gray-50 border-b border-gray-100 last:border-0"
    >
      <div>
        <p className="font-medium text-gray-900 text-sm">{TYPE_LABELS[d.disputeType] ?? d.disputeType}</p>
        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{d.description}</p>
        <p className="text-xs text-gray-400 mt-0.5">{new Date(d.createdAt).toLocaleDateString('en-IN')}</p>
      </div>
      <div className="ml-4 flex items-center gap-2">
        {d.blockchainTxHash && (
          <span className="text-xs text-green-600 font-medium">⛓</span>
        )}
        <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${STATUS_COLORS[d.status]}`}>
          {d.status.replace('_', ' ')}
        </span>
      </div>
    </Link>
  );
}

export function DisputesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['disputes'],
    queryFn: () => api.get<{ disputes: Dispute[] }>('/disputes').then(r => r.data.disputes),
  });

  const open = data?.filter(d => d.status === 'OPEN' || d.status === 'UNDER_REVIEW') ?? [];
  const resolved = data?.filter(d => d.status === 'RESOLVED' || d.status === 'CLOSED') ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Disputes</h1>
        <Link to="/disputes/new" className="btn-primary">
          + Raise Dispute
        </Link>
      </div>

      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">Loading…</div>
      ) : !data?.length ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
          <p className="text-gray-400">No disputes</p>
          <p className="text-xs text-gray-400 mt-1">Raise a dispute from an active agreement</p>
        </div>
      ) : (
        <div className="space-y-6">
          {open.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Active ({open.length})</h2>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {open.map(d => <DisputeRow key={d.id} d={d} />)}
              </div>
            </div>
          )}
          {resolved.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Resolved ({resolved.length})</h2>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {resolved.map(d => <DisputeRow key={d.id} d={d} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
