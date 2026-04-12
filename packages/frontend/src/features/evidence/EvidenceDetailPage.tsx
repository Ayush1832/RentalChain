import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import type { Evidence } from '../../types';

const EVIDENCE_TYPE_LABELS: Record<string, string> = {
  MOVE_IN: 'Move-In Inspection',
  MOVE_OUT: 'Move-Out Inspection',
  MAINTENANCE: 'Maintenance Record',
  INSPECTION: 'General Inspection',
};

export function EvidenceDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['evidence', id],
    queryFn: () => api.get<{ evidence: Evidence }>(`/evidence/${id}`).then(r => r.data.evidence),
    enabled: !!id,
  });

  if (isLoading) return <div className="text-center py-16 text-gray-400">Loading…</div>;
  if (!data) return <div className="text-center py-16 text-gray-400">Evidence not found</div>;

  const e = data;
  const isAnchored = !!e.blockchainTxHash;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/agreements/${e.agreementId}`} className="text-gray-400 hover:text-gray-600">← Agreement</Link>
        <h1 className="text-2xl font-bold text-gray-900">{EVIDENCE_TYPE_LABELS[e.evidenceType] ?? e.evidenceType}</h1>
      </div>

      {/* Status bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-gray-400 mb-1">Evidence Type</p>
            <span className="text-sm font-semibold text-gray-800">{EVIDENCE_TYPE_LABELS[e.evidenceType] ?? e.evidenceType}</span>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Uploaded</p>
            <span className="text-sm text-gray-700">{new Date(e.createdAt).toLocaleString('en-IN')}</span>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Blockchain Status</p>
            {isAnchored ? (
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                On-Chain Anchored
              </span>
            ) : (
              <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-100 font-medium">
                Anchoring Pending
              </span>
            )}
          </div>
        </div>

        {e.description && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Description</p>
            <p className="text-sm text-gray-700">{e.description}</p>
          </div>
        )}
      </div>

      {/* Photos */}
      {e.cloudUrls && e.cloudUrls.length > 0 ? (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
            Photos ({e.cloudUrls.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {e.cloudUrls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                <img
                  src={url}
                  alt={`Evidence photo ${i + 1}`}
                  className="w-full h-40 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity"
                  onError={ev => { (ev.target as HTMLImageElement).style.display = 'none'; }}
                />
              </a>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center mb-6">
          <p className="text-gray-400 text-sm">No photos attached</p>
        </div>
      )}

      {/* Blockchain details */}
      {isAnchored && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">Blockchain Proof</h2>
          <dl className="space-y-3 text-sm">
            {e.evidenceHash && (
              <div>
                <dt className="text-xs text-gray-400 mb-0.5">Evidence Hash</dt>
                <dd className="font-mono text-xs text-gray-700 break-all">{e.evidenceHash}</dd>
              </div>
            )}
            {e.ipfsCidBundle && (
              <div>
                <dt className="text-xs text-gray-400 mb-0.5">IPFS Bundle CID</dt>
                <dd className="font-mono text-xs text-gray-700 break-all">{e.ipfsCidBundle}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-gray-400 mb-0.5">Transaction Hash</dt>
              <dd className="font-mono text-xs break-all">
                <a
                  href={`https://sepolia.etherscan.io/tx/${e.blockchainTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 hover:underline"
                >
                  {e.blockchainTxHash}
                </a>
              </dd>
            </div>
            {e.blockchainAnchoredAt && (
              <div>
                <dt className="text-xs text-gray-400 mb-0.5">Anchored At</dt>
                <dd className="text-gray-700">{new Date(e.blockchainAnchoredAt).toLocaleString('en-IN')}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      <div className="flex gap-3">
        <Link to={`/agreements/${e.agreementId}`} className="btn-secondary text-sm py-2">
          ← Back to Agreement
        </Link>
        {isAnchored && (
          <Link to={`/verify/${e.blockchainTxHash}`} className="btn-secondary text-sm py-2">
            Verify Publicly
          </Link>
        )}
      </div>
    </div>
  );
}
