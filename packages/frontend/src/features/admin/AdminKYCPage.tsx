import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { Navigate } from 'react-router-dom';

interface PendingKYCUser {
  id: string;
  phone: string;
  fullName?: string;
  email?: string;
  role: string;
  kycStatus: string;
  kycSubmittedAt?: string;
}

export function AdminKYCPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Guard: admin only
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  const { data, isLoading } = useQuery({
    queryKey: ['admin-kyc-pending'],
    queryFn: () => api.get<{ users: PendingKYCUser[] }>('/admin/kyc/pending').then(r => r.data.users),
  });

  const approveMutation = useMutation({
    mutationFn: (userId: string) => api.post(`/admin/kyc/${userId}/approve`),
    onSuccess: () => {
      toast.success('KYC approved — DID created and registered on-chain');
      queryClient.invalidateQueries({ queryKey: ['admin-kyc-pending'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message ?? 'Approval failed'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      api.post(`/admin/kyc/${userId}/reject`, { reason }),
    onSuccess: () => {
      toast.success('KYC rejected');
      queryClient.invalidateQueries({ queryKey: ['admin-kyc-pending'] });
      setRejectingId(null);
      setRejectReason('');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message ?? 'Rejection failed'),
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">KYC Review Queue</h1>
        <p className="text-sm text-gray-500 mt-1">
          Approve or reject pending identity verifications. Approved users get a DID registered on-chain.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : !data?.length ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">All caught up!</p>
          <p className="text-xs text-gray-400 mt-1">No pending KYC submissions</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map(u => (
            <div key={u.id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{u.fullName ?? 'No name set'}</p>
                  <p className="text-sm text-gray-500">{u.phone}</p>
                  {u.email && <p className="text-xs text-gray-400">{u.email}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">{u.role}</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">{u.kycStatus}</span>
                  </div>
                  {u.kycSubmittedAt && (
                    <p className="text-xs text-gray-400 mt-1">Submitted {new Date(u.kycSubmittedAt).toLocaleString('en-IN')}</p>
                  )}
                  <p className="text-xs text-gray-300 font-mono mt-1">ID: {u.id}</p>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => approveMutation.mutate(u.id)}
                    disabled={approveMutation.isPending}
                    className="btn-primary text-sm py-1.5 px-4"
                  >
                    {approveMutation.isPending ? '…' : 'Approve'}
                  </button>
                  <button
                    onClick={() => setRejectingId(rejectingId === u.id ? null : u.id)}
                    className="btn-secondary text-sm py-1.5 px-4 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Reject
                  </button>
                </div>
              </div>

              {rejectingId === u.id && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <label className="label">Rejection Reason</label>
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    rows={2}
                    className="input resize-none mb-2"
                    placeholder="Document unclear, name mismatch, invalid Aadhaar…"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => rejectMutation.mutate({ userId: u.id, reason: rejectReason })}
                      disabled={!rejectReason.trim() || rejectMutation.isPending}
                      className="btn-primary text-sm py-1.5 bg-red-600 hover:bg-red-700"
                    >
                      {rejectMutation.isPending ? 'Rejecting…' : 'Confirm Rejection'}
                    </button>
                    <button onClick={() => setRejectingId(null)} className="btn-secondary text-sm py-1.5">
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
