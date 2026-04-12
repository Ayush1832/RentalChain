import { useQuery } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

interface Analytics {
  users: { total: number; tenants: number; landlords: number; verified: number };
  properties: { total: number; active: number; draft: number };
  agreements: { total: number; active: number; completed: number };
  payments: { total: number; totalAmountPaise: number };
  disputes: { total: number; open: number; resolved: number };
  kyc: { pending: number };
}

function StatCard({ label, value, sub, to }: { label: string; value: number | string; sub?: string; to?: string }) {
  const content = (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-brand-200 transition-colors">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-600 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

export function AdminDashboard() {
  const { user } = useAuthStore();

  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => api.get<Analytics>('/admin/analytics').then(r => r.data),
  });

  const totalRentCr = analytics
    ? (analytics.payments.totalAmountPaise / 100 / 10_000_000).toFixed(2)
    : '0';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Platform-wide overview</p>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-gray-400">Loading analytics…</div>
      ) : (
        <div className="space-y-8">
          {/* Users */}
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Users</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Total Users" value={analytics?.users.total ?? 0} to="/admin/users" />
              <StatCard label="Verified (KYC)" value={analytics?.users.verified ?? 0} sub="DID on-chain" />
              <StatCard label="Landlords" value={analytics?.users.landlords ?? 0} />
              <StatCard label="Pending KYC" value={analytics?.kyc.pending ?? 0} to="/admin/kyc" sub="Needs review" />
            </div>
          </div>

          {/* Properties & Agreements */}
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Properties & Agreements</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Properties" value={analytics?.properties.total ?? 0} sub={`${analytics?.properties.active ?? 0} active`} />
              <StatCard label="Agreements" value={analytics?.agreements.total ?? 0} />
              <StatCard label="Active Leases" value={analytics?.agreements.active ?? 0} />
              <StatCard label="Completed" value={analytics?.agreements.completed ?? 0} />
            </div>
          </div>

          {/* Payments & Disputes */}
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Payments & Disputes</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Payments Recorded" value={analytics?.payments.total ?? 0} />
              <StatCard label="Total Rent" value={`₹${totalRentCr}Cr`} sub="Across all leases" />
              <StatCard label="Total Disputes" value={analytics?.disputes.total ?? 0} to="/admin/disputes" />
              <StatCard label="Open Disputes" value={analytics?.disputes.open ?? 0} to="/admin/disputes" sub="Needs attention" />
            </div>
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/kyc" className="btn-primary text-sm py-2 px-5">
              Review KYC Queue ({analytics?.kyc.pending ?? 0})
            </Link>
            <Link to="/admin/disputes" className="btn-secondary text-sm py-2 px-5">
              Manage Disputes
            </Link>
            <Link to="/admin/users" className="btn-secondary text-sm py-2 px-5">
              All Users
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
