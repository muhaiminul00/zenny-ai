import { Navigate, Route, Routes, NavLink } from 'react-router-dom';
import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './lib/AuthContext';
import { supabase } from './lib/supabase';
import { EnsoMark } from './components/EnsoMark';
import { Login } from './pages/Login';
import { OrdersList } from './pages/OrdersList';
import { OrderDetail } from './pages/OrderDetail';
import { Integrations } from './pages/Integrations';
import { AppointmentsList, AppointmentDetailPage, PendingApprovals, PausedLeads } from './pages/Appointments';
import { AdminProvision } from './pages/AdminProvision';

// BC-076-Card2a: UX-only nav-link gate — hides the admin link for non-
// admins. NOT the real security boundary; that lives server-side in
// admin-provision-dashboard-user's own role check and AdminProvision's
// own page-level check (a guessed URL still hits both of those).
function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    let cancelled = false;
    supabase.rpc('dashboard_get_my_role').then(({ data, error }) => {
      if (!cancelled && !error) setIsAdmin(data === 'admin');
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return isAdmin;
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <p>Loading…</p>;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function LoginRoute() {
  const { session, loading } = useAuth();
  if (loading) return <p>Loading…</p>;
  if (session) return <Navigate to="/orders" replace />;
  return <Login />;
}

function Layout({ children }: { children: ReactNode }) {
  const { session, signOut } = useAuth();
  const isAdmin = useIsAdmin();
  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="brand">
          <EnsoMark size={22} />
          Zenny<span className="dot">.</span>
        </span>
        <nav>
          <NavLink to="/orders" className={({ isActive }) => (isActive ? 'active' : '')}>
            Orders
          </NavLink>
          <NavLink to="/appointments" className={({ isActive }) => (isActive ? 'active' : '')}>
            Appointments
          </NavLink>
          <NavLink to="/approvals" className={({ isActive }) => (isActive ? 'active' : '')}>
            Pending Approvals
          </NavLink>
          <NavLink to="/paused-leads" className={({ isActive }) => (isActive ? 'active' : '')}>
            Paused Leads
          </NavLink>
          <NavLink to="/integrations" className={({ isActive }) => (isActive ? 'active' : '')}>
            Integrations
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin/provision" className={({ isActive }) => (isActive ? 'active' : '')}>
              Admin
            </NavLink>
          )}
        </nav>
        {session && (
          <div className="header-right">
            <span>{session.user.email}</span>
            <button onClick={() => signOut()}>Sign out</button>
          </div>
        )}
      </header>
      <main>{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/orders" replace />} />
                <Route path="/orders" element={<OrdersList />} />
                <Route path="/orders/:orderId" element={<OrderDetail />} />
                <Route path="/appointments" element={<AppointmentsList />} />
                <Route path="/appointments/:appointmentId" element={<AppointmentDetailPage />} />
                <Route path="/approvals" element={<PendingApprovals />} />
                <Route path="/paused-leads" element={<PausedLeads />} />
                <Route path="/integrations" element={<Integrations />} />
                <Route path="/admin/provision" element={<AdminProvision />} />
              </Routes>
            </Layout>
          </RequireAuth>
        }
      />
    </Routes>
  );
}
