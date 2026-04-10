import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { BlockchainBadge } from '../../components/blockchain/BlockchainBadge';
import type { Payment, Agreement } from '../../types';

function PaymentCard({ payment, agreement, isLandlord }: { payment: Payment; agreement?: Agreement; isLandlord: boolean }) {
  const queryClient = useQueryClient();

  const confirmMutation = useMutation({
    mutationFn: () => api.post(`/payments/${payment.id}/confirm`),
    onSuccess: () => {
      toast.success('Payment confirmed');
      queryClient.invalidateQueries({ queryKey: ['all-payments'] });
    },
    onError: () => toast.error('Failed to confirm'),
  });

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-bold text-gray-900 text-lg">₹{(payment.amount / 100).toLocaleString('en-IN')}</p>
          <p className="text-sm text-gray-500">{payment.paymentMonth} · {payment.paymentMethod}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {payment.confirmedAt ? (
            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">Confirmed</span>
          ) : (
            <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">Pending confirmation</span>
          )}
        </div>
      </div>

      {payment.upiTransactionId && (
        <p className="text-xs text-gray-400 font-mono mb-2">UPI: {payment.upiTransactionId}</p>
      )}

      {payment.blockchainTxHash && (
        <div className="mt-2">
          <BlockchainBadge txHash={payment.blockchainTxHash} label="Payment Anchored" />
        </div>
      )}

      {agreement && (
        <Link to={`/agreements/${agreement.id}`} className="text-xs text-brand-600 hover:underline mt-2 block">
          View Agreement →
        </Link>
      )}

      {isLandlord && !payment.confirmedAt && (
        <button
          onClick={() => confirmMutation.mutate()}
          disabled={confirmMutation.isPending}
          className="mt-3 btn-primary text-sm py-1.5"
        >
          {confirmMutation.isPending ? 'Confirming…' : 'Confirm Receipt'}
        </button>
      )}
    </div>
  );
}

export function PaymentsPage() {
  const { user } = useAuthStore();
  const isLandlord = user?.role === 'LANDLORD' || user?.role === 'BOTH';

  // Fetch all agreements first, then their payments
  const { data: agreements } = useQuery({
    queryKey: ['agreements'],
    queryFn: () => api.get<{ agreements: Agreement[] }>('/agreements').then(r => r.data.agreements),
  });

  const { data: allPayments, isLoading } = useQuery({
    queryKey: ['all-payments'],
    queryFn: async () => {
      if (!agreements?.length) return [];
      const results = await Promise.all(
        agreements.map(a =>
          api.get<{ payments: Payment[] }>(`/agreements/${a.id}/payments`)
            .then(r => r.data.payments.map(p => ({ ...p, _agreement: a })))
            .catch(() => [])
        )
      );
      return results.flat().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    enabled: !!agreements,
  });

  const agreementMap = new Map(agreements?.map(a => [a.id, a]));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Payments</h1>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
              <div className="h-5 bg-gray-100 rounded w-1/3 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : !allPayments?.length ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
          <p className="text-gray-400">No payments recorded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allPayments.map(p => (
            <PaymentCard
              key={p.id}
              payment={p}
              agreement={agreementMap.get(p.agreementId)}
              isLandlord={isLandlord}
            />
          ))}
        </div>
      )}
    </div>
  );
}
