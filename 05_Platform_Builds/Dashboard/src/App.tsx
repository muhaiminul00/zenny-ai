import { Navigate, Route, Routes, NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth, type DashboardRole } from './lib/AuthContext';
import { EnsoMark } from './components/EnsoMark';
import { Login } from './pages/Login';
import { OrdersList } from './pages/OrdersList';
import { OrderDetail } from './pages/OrderDetail';
import { Integrations } from './pages/Integrations';
import { AppointmentsList, AppointmentDetailPage, PendingApprovals, PausedLeads } from './pages/Appointments';
import { AdminProvision } from './pages/AdminProvision';
import { ChangePassword } from './pages/ChangePassword';

// BC-076-Card2a: UX-only role gate — drives which nav links/pages render,
// NOT the real security boundary (that's server-side in
// admin-provision-dashboard-user's own role check and AdminProvision's
// own page-level check; a guessed URL still hits both of those).
//
// dashboard_users has one row per auth_user_id (role is per-account, not
// per-client-view), so an admin account can never also be a real
// client's viewer under the same login — Orders/Appointments/Pending
// Approvals/Paused Leads/Integrations all resolve "which client am I"
// via dashboard_get_my_client(), which would otherwise show the admin
// account as if it WERE its own nominal client_id (confusing: an admin
// logging in saw a random test client's orders, not an admin-only view).
// Admin accounts get ONLY the admin pages; client accounts get the
// reverse — never both, per the schema's own real constraint.
//
// Admin Provisioning Bootstrap (T8): role + must_change_password now
// come from AuthContext (dashboard_get_my_flags(), one call) instead of
// this file's own separate RPC fetch — see lib/AuthContext.tsx.
// super_admin is a superset of admin for routing purposes; the Add Admin
// tab's own tier gate lives inside AdminProvision.tsx.

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

function Layout({ children, role }: { children: ReactNode; role: DashboardRole }) {
  const { session, signOut } = useAuth();
  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="brand">
          <EnsoMark size={22} />
          Zenny<span className="dot">.</span>
        </span>
        <nav>
          {role === 'admin' || role === 'super_admin' ? (
            <NavLink to="/admin/provision" className={({ isActive }) => (isActive ? 'active' : '')}>
              Admin
            </NavLink>
          ) : (
            <>
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
            </>
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

function DashboardRoutes() {
  const { role: rawRole, mustChangePassword, flagsLoading } = useAuth();
  if (flagsLoading) return <p>Loading…</p>;

  // T8 (D4, Codex correction): forced password-change is a route-guard
  // check on every render of this tree, not a one-time login-page nag —
  // no path below this reaches any other page while the flag is set.
  if (mustChangePassword) {
    return <ChangePassword />;
  }

  const role: DashboardRole = rawRole ?? 'client_user';
  const isAdminTier = role === 'admin' || role === 'super_admin';

  return (
    <Layout role={role}>
      <Routes>
        {isAdminTier ? (
          <>
            <Route path="/" element={<Navigate to="/admin/provision" replace />} />
            <Route path="/admin/provision" element={<AdminProvision />} />
            {/* An admin account has no client to view — every other path
                redirects to the one page it actually has. */}
            <Route path="*" element={<Navigate to="/admin/provision" replace />} />
          </>
        ) : (
          <>
            <Route path="/" element={<Navigate to="/orders" replace />} />
            <Route path="/orders" element={<OrdersList />} />
            <Route path="/orders/:orderId" element={<OrderDetail />} />
            <Route path="/appointments" element={<AppointmentsList />} />
            <Route path="/appointments/:appointmentId" element={<AppointmentDetailPage />} />
            <Route path="/approvals" element={<PendingApprovals />} />
            <Route path="/paused-leads" element={<PausedLeads />} />
            <Route path="/integrations" element={<Integrations />} />
            {/* A client account has no admin page to view — redirect
                rather than let AdminProvision's own access-denied message
                render inside a client's nav chrome. */}
            <Route path="/admin/*" element={<Navigate to="/orders" replace />} />
          </>
        )}
      </Routes>
    </Layout>
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
            <DashboardRoutes />
          </RequireAuth>
        }
      />
    </Routes>
  );
}
