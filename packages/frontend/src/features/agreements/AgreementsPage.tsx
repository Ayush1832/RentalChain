import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import type { Agreement } from '../../types';

function statusColor(s: Agreement['status']) {
  if (s === 'ACTIVE') return 'bg-green-100 text-green-700';
  if (s === 'PENDING_SIGNATURES') return 'bg-yellow-100 text-yellow-700';
  if (s === 'TERMINATED' || s === 'EXPIRED') return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-600';
}

function AgreementRow({ a, role }: { a: Agreement; role: 'landlord' | 'tenant' }) {
  return (
    <Link
      to={`/agreements/${a.id}`}
      className="flex items-center justify-between p-4 hover:bg-gray-50 border-b border-gray-100 last:border-0"
    >
      <div>
        <p className="font-medium text-gray-900 text-sm">
          {role === 'landlord' ? 'Tenant' : 'Landlord'}: {role === 'landlord' ? a.tenantId.slice(0,8) : a.landlordId.slice(0,8)}…
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {new Date(a.startDate).toLocaleDateString('en-IN')}
          {a.endDate ? ` → ${new Date(a.endDate).toLocaleDateString('en-IN')}` : ' (open-ended)'}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-bold text-gray-900">₹{(a.monthlyRent / 100).toLocaleString('en-IN')}/mo</p>
          {a.blockchainTxHash && (
            <span className="text-xs text-green-600 font-medium">⛓ On-Chain</span>
          )}
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(a.status)}`}>
          {a.status.replace('_', ' ')}
        </span>
      </div>
    </Link>
  );
}

export function AgreementsPage() {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['agreements'],
    queryFn: () => api.get<{ agreements: Agreement[] }>('/agreements').then((r) => r.data.agreements),
  });

  const isLandlord = user?.role === 'LANDLORD' || user?.role === 'BOTH';

  const myAgreements = data ?? [];
  const asLandlord = myAgreements.filter((a) => a.landlordId === user?.id);
  const asTenant = myAgreements.filter((a) => a.tenantId === user?.id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Agreements</h1>
        {isLandlord && (
          <Link to="/agreements/new" className="btn-primary">
            + New Agreement
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400">Loading…</div>
      ) : !myAgreements.length ? (
        <div className="bg-white border border-gray-200 rounded-xl p-16 text-center">
          <p className="text-gray-400">No agreements yet</p>
          {isLandlord && (
            <Link to="/agreements/new" className="mt-4 inline-block btn-primary">
              Create your first agreement
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {asLandlord.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">As Landlord</h2>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {asLandlord.map((a) => <AgreementRow key={a.id} a={a} role="landlord" />)}
              </div>
            </div>
          )}
          {asTenant.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">As Tenant</h2>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {asTenant.map((a) => <AgreementRow key={a.id} a={a} role="tenant" />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
