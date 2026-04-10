import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';

// Auth
import { LoginPage } from './features/auth/LoginPage';

// Dashboard
import { DashboardPage } from './features/dashboard/DashboardPage';

// Public verify
import { PublicVerifyPage } from './features/verify/PublicVerifyPage';

// Profile & KYC
import { ProfilePage } from './features/profile/ProfilePage';
import { KYCPage } from './features/kyc/KYCPage';

// Properties
import { PropertiesPage } from './features/properties/PropertiesPage';
import { PropertyDetailPage } from './features/properties/PropertyDetailPage';
import { CreatePropertyPage } from './features/properties/CreatePropertyPage';

// Agreements
import { AgreementsPage } from './features/agreements/AgreementsPage';
import { AgreementDetailPage } from './features/agreements/AgreementDetailPage';
import { CreateAgreementPage } from './features/agreements/CreateAgreementPage';

// Payments
import { PaymentsPage } from './features/payments/PaymentsPage';
import { RecordPaymentPage } from './features/payments/RecordPaymentPage';

// Evidence
import { UploadEvidencePage } from './features/evidence/UploadEvidencePage';

// Maintenance
import { MaintenancePage } from './features/maintenance/MaintenancePage';
import { AgreementMaintenancePage } from './features/maintenance/MaintenancePage';

// Disputes
import { DisputesPage } from './features/disputes/DisputesPage';
import { CreateDisputePage } from './features/disputes/CreateDisputePage';
import { DisputeDetailPage } from './features/disputes/DisputeDetailPage';

// Admin
import { AdminKYCPage } from './features/admin/AdminKYCPage';

export default function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      {/* ── Public ─────────────────────────────────────────────────── */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/verify/:txHash" element={<PublicVerifyPage />} />
      <Route path="/verify" element={<PublicVerifyPage />} />

      {/* ── Protected (all inside AppShell) ────────────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          {/* Dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Profile & KYC */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/kyc" element={<KYCPage />} />

          {/* Properties */}
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/properties/new" element={<CreatePropertyPage />} />
          <Route path="/properties/:id" element={<PropertyDetailPage />} />

          {/* Agreements */}
          <Route path="/agreements" element={<AgreementsPage />} />
          <Route path="/agreements/new" element={<CreateAgreementPage />} />
          <Route path="/agreements/:id" element={<AgreementDetailPage />} />

          {/* Payments */}
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/agreements/:id/payments/new" element={<RecordPaymentPage />} />

          {/* Evidence */}
          <Route path="/agreements/:id/evidence/upload" element={<UploadEvidencePage />} />

          {/* Maintenance */}
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/agreements/:id/maintenance" element={<AgreementMaintenancePage />} />

          {/* Disputes */}
          <Route path="/disputes" element={<DisputesPage />} />
          <Route path="/disputes/new" element={<CreateDisputePage />} />
          <Route path="/disputes/:id" element={<DisputeDetailPage />} />

          {/* Admin */}
          <Route path="/admin/kyc" element={<AdminKYCPage />} />
        </Route>
      </Route>

      {/* ── Root redirect ────────────────────────────────────────────── */}
      <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
