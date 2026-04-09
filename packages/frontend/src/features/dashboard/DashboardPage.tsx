import { useAuthStore } from '../../stores/authStore';
import { TenantDashboard } from './TenantDashboard';
import { LandlordDashboard } from './LandlordDashboard';

export function DashboardPage() {
  const { user } = useAuthStore();

  if (!user) return null;

  if (user.role === 'LANDLORD') return <LandlordDashboard />;
  return <TenantDashboard />;
}
