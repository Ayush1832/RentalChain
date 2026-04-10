import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { BlockchainBadge } from '../../components/blockchain/BlockchainBadge';
import type { Dispute } from '../../types';

const resolveSchema = z.object({
  outcome: z.string().min(5, 'Describe the outcome'),
  resolutionNotes: z.string().min(10, 'Provide resolution details').max(2000),
});
type ResolveData = z.infer<typeof resolveSchema>;

const TYPE_LABELS: Record<string, string> = {
  DEPOSIT_REFUND: 'Security Deposit Refund',
  PROPERTY_DAMAGE: 'Property Damage',
  UNPAID_RENT: 'Unpaid Rent',
  AGREEMENT_BREACH: 'Agreement Breach',
  OTHER: 'Other',
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-700',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-600',
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-50 last:border-0 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 text-right max-w-xs">{value}</span>
    </div>
  );
}

export function DisputeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: dispute, isLoading } = useQuery({
    queryKey: ['dispute', id],
    queryFn: () => api.get<{ dispute: Dispute }>(`/disputes/${id}`).then(r => r.data.dispute),
    enabled: !!id,
  });

  const { register, handleSubmit, formState: { errors } } = useForm<ResolveData>({
    resolver: zodResolver(resolveSchema),
  });

  const resolveMutation = useMutation({
    mutationFn: (data: ResolveData) => api.put(`/disputes/${id}/resolve`, data),
    onSuccess: () => {
      toast.success('Dispute resolved and anchored on blockchain');
      queryClient.invalidateQueries({ queryKey: ['dispute', id] });
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message ?? 'Failed to resolve'),
  });

  const canResolve = user?.role === 'ADMIN' || user?.role === 'MEDIATOR';

  if (isLoading) return <div className="max-w-3xl mx-auto px-4 py-12 text-center text-gray-400">Loading…</div>;
  if (!dispute) return <div className="max-w-3xl mx-auto px-4 py-12 text-center text-gray-400">Dispute not found</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link to="/disputes" className="text-gray-400 hover:text-gray-600 text-sm">← Disputes</Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{TYPE_LABELS[dispute.disputeType]}</h1>
          <p className="text-xs font-mono text-gray-400 mt-1">{dispute.id}</p>
        </div>
        <span className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_COLORS[dispute.status]}`}>
          {dispute.status.replace('_', ' ')}
        </span>
      </div>

      {/* Blockchain anchor */}
      {dispute.blockchainTxHash && (
        <div className="mb-6">
          <BlockchainBadge txHash={dispute.blockchainTxHash} label="Dispute Anchored on Chain" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-800 mb-3">Details</h2>
          <InfoRow label="Type" value={TYPE_LABELS[dispute.disputeType]} />
          <InfoRow label="Status" value={dispute.status.replace('_', ' ')} />
          <InfoRow label="Raised On" value={new Date(dispute.createdAt).toLocaleDateString('en-IN')} />
          <InfoRow label="Agreement" value={
            <Link to={`/agreements/${dispute.agreementId}`} className="text-brand-600 hover:underline">
              View Agreement →
            </Link>
          } />
        </div>

        {dispute.resolvedAt && (
          <div className="bg-green-50 border border-green-100 rounded-xl p-5">
            <h2 className="font-semibold text-green-800 mb-3">Resolution</h2>
            <p className="text-sm font-medium text-green-800 mb-1">{dispute.outcome}</p>
            <p className="text-sm text-green-700">{dispute.resolutionNotes}</p>
            <p className="text-xs text-green-600 mt-2">
              Resolved on {new Date(dispute.resolvedAt).toLocaleDateString('en-IN')}
            </p>
            {dispute.blockchainTxHash && (
              <a
                href={`https://sepolia.etherscan.io/tx/${dispute.blockchainTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-green-600 hover:underline mt-1 block"
              >
                View on Etherscan →
              </a>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-gray-800 mb-2">Description</h2>
        <p className="text-sm text-gray-600 whitespace-pre-line">{dispute.description}</p>
      </div>

      {/* Hash info */}
      {dispute.bundleHash && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
          <p className="text-xs text-gray-400 mb-1">Bundle Hash</p>
          <p className="text-xs font-mono text-gray-600 break-all">{dispute.bundleHash}</p>
        </div>
      )}

      {/* Resolve form (admin/mediator only) */}
      {canResolve && (dispute.status === 'OPEN' || dispute.status === 'UNDER_REVIEW') && (
        <div className="bg-white border border-brand-200 rounded-xl p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Resolve Dispute</h2>
          <form onSubmit={handleSubmit(d => resolveMutation.mutate(d))} className="space-y-4">
            <div>
              <label className="label">Outcome</label>
              <input
                {...register('outcome')}
                placeholder="e.g. Deposit refunded in full, Tenant pays ₹5000 damages…"
                className="input"
              />
              {errors.outcome && <p className="error">{errors.outcome.message}</p>}
            </div>
            <div>
              <label className="label">Resolution Notes</label>
              <textarea
                {...register('resolutionNotes')}
                rows={4}
                className="input resize-none"
                placeholder="Explain the basis for this resolution, evidence reviewed, and any conditions…"
              />
              {errors.resolutionNotes && <p className="error">{errors.resolutionNotes.message}</p>}
            </div>
            <button type="submit" disabled={resolveMutation.isPending} className="btn-primary w-full">
              {resolveMutation.isPending ? 'Resolving…' : 'Resolve & Anchor on Blockchain'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
