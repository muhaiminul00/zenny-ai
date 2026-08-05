import { Navigate, Route, Routes, Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './lib/AuthContext';
import { Login } from './pages/Login';
import { OrdersList } from './pages/OrdersList';
import { OrderDetail } from './pages/OrderDetail';

function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <p>Loading…</p>;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function Layout({ children }: { children: ReactNode }) {
  const { session, signOut } = useAuth();
  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="brand">Zenny Dashboard</span>
        <nav>
          <Link to="/orders">Orders</Link>
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
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/orders" replace />} />
                <Route path="/orders" element={<OrdersList />} />
                <Route path="/orders/:orderId" element={<OrderDetail />} />
              </Routes>
            </Layout>
          </RequireAuth>
        }
      />
    </Routes>
  );
}
