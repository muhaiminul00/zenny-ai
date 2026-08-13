import { Navigate, Route, Routes, NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './lib/AuthContext';
import { EnsoMark } from './components/EnsoMark';
import { Login } from './pages/Login';
import { OrdersList } from './pages/OrdersList';
import { OrderDetail } from './pages/OrderDetail';
import { Integrations } from './pages/Integrations';
import { AppointmentsList, AppointmentDetailPage, PendingApprovals } from './pages/Appointments';

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
          <NavLink to="/integrations" className={({ isActive }) => (isActive ? 'active' : '')}>
            Integrations
          </NavLink>
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
                <Route path="/integrations" element={<Integrations />} />
              </Routes>
            </Layout>
          </RequireAuth>
        }
      />
    </Routes>
  );
}
