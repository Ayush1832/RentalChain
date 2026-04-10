import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';
import { api } from '../../services/api';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/properties', label: 'Properties' },
  { to: '/agreements', label: 'Agreements' },
  { to: '/payments', label: 'Payments' },
  { to: '/maintenance', label: 'Maintenance' },
  { to: '/disputes', label: 'Disputes' },
];

export function AppShell() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    logout();
    navigate('/login');
    toast.success('Logged out');
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <NavLink to="/dashboard" className="text-lg font-bold text-brand-700">
              RentalChain
            </NavLink>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/dashboard'}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              {user?.role === 'ADMIN' && (
                <NavLink
                  to="/admin/kyc"
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`
                  }
                >
                  Admin
                </NavLink>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user && user.kycStatus !== 'VERIFIED' && user.kycStatus !== 'SUBMITTED' && (
              <Link
                to="/kyc"
                className="text-xs px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 font-medium hover:bg-yellow-100 transition-colors"
              >
                Complete KYC
              </Link>
            )}
            {user?.kycStatus === 'VERIFIED' && (
              <span className="chain-badge text-xs hidden sm:inline-flex">
                ID Verified
              </span>
            )}
            <Link
              to="/profile"
              className="text-sm text-gray-600 hover:text-gray-900 hidden sm:block font-medium"
            >
              {user?.fullName ?? user?.role}
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-4">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <p className="text-xs text-gray-400">RentalChain — Blockchain-backed rental trust infrastructure</p>
          <Link to="/verify" className="text-xs text-gray-400 hover:text-gray-600">
            Verify a document →
          </Link>
        </div>
      </footer>
    </div>
  );
}
