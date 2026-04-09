import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../../services/api';
import { ReputationScore } from '../../components/ui/ReputationScore';

export function LandlordDashboard() {
  const { data: properties } = useQuery({
    queryKey: ['my-properties'],
    queryFn: () => api.get('/properties?mine=true').then((r) => r.data),
  });

  const { data: agreements } = useQuery({
    queryKey: ['agreements'],
    queryFn: () => api.get('/agreements').then((r) => r.data),
  });

  const activeCount = properties?.filter((p: { listingStatus: string }) => p.listingStatus === 'RENTED').length ?? 0;
  const totalCount = properties?.length ?? 0;
  const pendingConfirmations = agreements?.filter(
    (a: { status: string; pendingConfirmations?: number }) => a.pendingConfirmations > 0
  ).length ?? 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Landlord Dashboard</h1>
        <div className="flex items-center gap-4">
          <ReputationScore score={0} />
          <Link to="/properties/new" className="btn-primary text-sm">
            + Add Property
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-brand-600">{activeCount}</p>
          <p className="text-sm text-gray-500 mt-1">Active Rentals</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-700">{totalCount}</p>
          <p className="text-sm text-gray-500 mt-1">Total Properties</p>
        </div>
        <div className="card text-center">
          <p className={`text-3xl font-bold ${pendingConfirmations > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
            {pendingConfirmations}
          </p>
          <p className="text-sm text-gray-500 mt-1">Pending Confirmations</p>
        </div>
      </div>

      {/* Income Chart (placeholder data) */}
      <div className="card">
        <h2 className="font-semibold mb-4">Monthly Income</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={PLACEHOLDER_INCOME}>
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 100).toLocaleString('en-IN')}`} />
            <Tooltip formatter={(v: number) => [`₹${(v / 100).toLocaleString('en-IN')}`, 'Income']} />
            <Bar dataKey="amount" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Properties List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">My Properties</h2>
          <Link to="/properties/my" className="text-sm text-brand-600 hover:underline">View all</Link>
        </div>
        {!properties?.length ? (
          <p className="text-sm text-gray-400">No properties listed yet</p>
        ) : (
          <div className="space-y-3">
            {properties.slice(0, 4).map((p: { id: string; title: string; city: string; listingStatus: string; monthlyRent: number }) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium">{p.title}</p>
                  <p className="text-xs text-gray-500">{p.city}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold">₹{(p.monthlyRent / 100).toLocaleString('en-IN')}/mo</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    p.listingStatus === 'RENTED' ? 'bg-green-100 text-green-700' :
                    p.listingStatus === 'ACTIVE' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {p.listingStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const PLACEHOLDER_INCOME = [
  { month: 'Aug', amount: 0 },
  { month: 'Sep', amount: 0 },
  { month: 'Oct', amount: 0 },
  { month: 'Nov', amount: 0 },
  { month: 'Dec', amount: 0 },
  { month: 'Jan', amount: 0 },
];
