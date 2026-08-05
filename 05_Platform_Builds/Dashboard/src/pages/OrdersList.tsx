import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { OrderListItem, OrderStatus } from '../lib/types';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_review: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  pushed: 'Pushed',
  push_failed: 'Push Failed',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABELS[status] ?? status}</span>;
}

export function OrdersList() {
  const [orders, setOrders] = useState<OrderListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    supabase.rpc('dashboard_list_orders').then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        setError(error.message);
      } else {
        setOrders((data as OrderListItem[]) ?? []);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="error-text">Failed to load orders: {error}</p>;
  if (orders === null) return <p>Loading orders…</p>;
  if (orders.length === 0) return <p>No orders yet.</p>;

  return (
    <table className="orders-table">
      <thead>
        <tr>
          <th>Order</th>
          <th>Status</th>
          <th>Qty</th>
          <th>Cart Value</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((o) => (
          <tr key={o.order_id}>
            <td>
              <Link to={`/orders/${o.order_id}`}>{o.order_id.slice(0, 8)}…</Link>
            </td>
            <td>
              <StatusBadge status={o.status} />
            </td>
            <td>{o.quantity}</td>
            <td>${Number(o.cart_value).toFixed(2)}</td>
            <td>{new Date(o.created_at).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
