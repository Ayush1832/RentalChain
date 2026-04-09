import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { PublicVerifyPage } from './features/verify/PublicVerifyPage';

// Placeholder pages — replaced as milestones are built
function ComingSoon({ name }: { name: string }) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 text-center">
      <p className="text-2xl font-bold text-gray-300">{name}</p>
      <p className="text-sm text-gray-400 mt-2">Coming in the next milestone</p>
    </div>
  );
}

export default function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/verify/:txHash" element={<PublicVerifyPage />} />
      <Route path="/verify" element={<PublicVerifyPage />} />

      {/* Protected — all wrapped in AppShell */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/properties" element={<ComingSoon name="Properties" />} />
          <Route path="/properties/my" element={<ComingSoon name="My Properties" />} />
          <Route path="/properties/new" element={<ComingSoon name="Create Property" />} />
          <Route path="/properties/:id" element={<ComingSoon name="Property Detail" />} />
          <Route path="/agreements" element={<ComingSoon name="Agreements" />} />
          <Route path="/agreements/new" element={<ComingSoon name="Create Agreement" />} />
          <Route path="/agreements/:id" element={<ComingSoon name="Agreement Detail" />} />
          <Route path="/agreements/:id/sign" element={<ComingSoon name="Sign Agreement" />} />
          <Route path="/agreements/:id/payments/new" element={<ComingSoon name="Record Payment" />} />
          <Route path="/agreements/:id/evidence/upload" element={<ComingSoon name="Upload Evidence" />} />
          <Route path="/payments" element={<ComingSoon name="Payments" />} />
          <Route path="/maintenance" element={<ComingSoon name="Maintenance" />} />
          <Route path="/disputes" element={<ComingSoon name="Disputes" />} />
          <Route path="/disputes/new" element={<ComingSoon name="Raise Dispute" />} />
          <Route path="/profile" element={<ComingSoon name="Profile" />} />
          <Route path="/kyc" element={<ComingSoon name="KYC Verification" />} />
        </Route>
      </Route>

      {/* Root redirect */}
      <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
