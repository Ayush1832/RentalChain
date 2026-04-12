import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

interface AdminUser {
  id: string;
  phone: string;
  fullName?: string;
  email?: string;
  role: string;
  kycStatus: string;
  didHash?: string;
  reputationScore: number;
  isActive: boolean;
  createdAt: string;
}

const KYC_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  SUBMITTED: 'bg-yellow-100 text-yellow-700',
  VERIFIED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

export function AdminUsersPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');

  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get<{ users: AdminUser[] }>('/admin/users').then(r => r.data.users),
  });

  const filtered = data?.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (u.fullName?.toLowerCase().includes(q)) ||
      (u.email?.toLowerCase().includes(q)) ||
      u.role.toLowerCase().includes(q) ||
      u.kycStatus.toLowerCase().includes(q)
    );
  }) ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Users</h1>
          <p className="text-sm text-gray-500 mt-1">{data?.length ?? 0} registered users</p>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, email, role…"
          className="input py-1.5 text-sm w-60"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : !filtered.length ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-xl text-gray-400">
          No users found
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">User</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">KYC</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Rep Score</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Joined</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">DID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{u.fullName || '—'}</p>
                    {u.email && <p className="text-xs text-gray-400">{u.email}</p>}
                    <p className="text-xs text-gray-300 font-mono">{u.id.slice(0, 8)}…</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${KYC_COLORS[u.kycStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                      {u.kycStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{u.reputationScore.toFixed(1)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    {u.didHash ? (
                      <span className="text-xs text-green-700 font-mono">{u.didHash.slice(0, 10)}…</span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
