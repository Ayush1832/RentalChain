import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { BlockchainBadge } from '../../components/blockchain/BlockchainBadge';
import { ReputationScore } from '../../components/ui/ReputationScore';
import { useAuthStore } from '../../stores/authStore';

export function TenantDashboard() {
  const { user } = useAuthStore();

  const { data: agreements } = useQuery({
    queryKey: ['agreements'],
    queryFn: () => api.get('/agreements').then((r) => r.data),
  });

  const activeAgreement = agreements?.find((a: { status: string }) => a.status === 'ACTIVE');

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Rental</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Rental ID: <span className="font-mono text-brand-600">{user?.didHash ? `RC-${user.didHash.slice(2, 10).toUpperCase()}` : 'Pending KYC'}</span>
          </p>
        </div>
        <ReputationScore score={0} />
      </div>

      {/* KYC Banner */}
      {user?.kycStatus !== 'VERIFIED' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-yellow-800">Complete your KYC</p>
            <p className="text-sm text-yellow-700 mt-0.5">
              You need to verify your identity before creating or signing agreements.
            </p>
          </div>
          <Link to="/kyc" className="btn-primary text-sm whitespace-nowrap ml-4">
            Verify Now
          </Link>
        </div>
      )}

      {/* Active Rental Card */}
      {activeAgreement ? (
        <div className="card">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">{activeAgreement.propertyTitle}</h2>
              <p className="text-sm text-gray-500">{activeAgreement.propertyCity}</p>
            </div>
            <span className="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
              Active
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
            <div>
              <p className="text-gray-500">Monthly Rent</p>
              <p className="font-semibold">₹{(activeAgreement.monthlyRent / 100).toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-gray-500">Lease End</p>
              <p className="font-semibold">{activeAgreement.endDate ?? 'Open-ended'}</p>
            </div>
            <div>
              <p className="text-gray-500">Rent Due</p>
              <p className="font-semibold">Day {activeAgreement.rentDueDay} of month</p>
            </div>
          </div>

          {activeAgreement.blockchainTxHash && (
            <BlockchainBadge
              txHash={activeAgreement.blockchainTxHash}
              anchoredAt={activeAgreement.blockchainAnchoredAt}
            />
          )}

          <div className="flex gap-3 mt-4">
            <Link to={`/agreements/${activeAgreement.id}/payments/new`} className="btn-primary text-sm">
              Record Payment
            </Link>
            <Link to={`/agreements/${activeAgreement.id}/evidence/upload`} className="btn-secondary text-sm">
              Upload Evidence
            </Link>
            <Link to={`/agreements/${activeAgreement.id}`} className="btn-secondary text-sm">
              View Agreement
            </Link>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-400 text-sm">No active rental agreement</p>
          <Link to="/properties" className="btn-primary text-sm mt-4 inline-block">
            Browse Properties
          </Link>
        </div>
      )}

      {/* Recent Payments */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Recent Payments</h2>
          <Link to="/payments" className="text-sm text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        <PaymentHistoryStub agreementId={activeAgreement?.id} />
      </div>
    </div>
  );
}

function PaymentHistoryStub({ agreementId }: { agreementId?: string }) {
  const { data: payments } = useQuery({
    queryKey: ['payments', agreementId],
    queryFn: () => api.get(`/agreements/${agreementId}/payments`).then((r) => r.data),
    enabled: !!agreementId,
  });

  if (!agreementId) {
    return <p className="text-sm text-gray-400">No active agreement</p>;
  }

  if (!payments?.length) {
    return <p className="text-sm text-gray-400">No payments recorded yet</p>;
  }

  return (
    <div className="space-y-2">
      {payments.slice(0, 3).map((p: { id: string; paymentMonth: string; amount: number; status: string; blockchainTxHash?: string }) => (
        <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
          <div>
            <p className="text-sm font-medium">{p.paymentMonth}</p>
            <p className="text-xs text-gray-500">₹{(p.amount / 100).toLocaleString('en-IN')}</p>
          </div>
          <div className="flex items-center gap-2">
            {p.blockchainTxHash && (
              <span className="chain-badge text-xs">On-Chain</span>
            )}
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              p.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {p.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
