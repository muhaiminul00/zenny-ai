import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import type { OrderDetail as OrderDetailType } from '../lib/types';
import { StatusBadge } from './OrdersList';

export function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const { session } = useAuth();
  const [order, setOrder] = useState<OrderDetailType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    if (!orderId) return;
    setError(null);
    supabase.rpc('dashboard_get_order', { p_order_id: orderId }).then(({ data, error }) => {
      if (error) {
        setError(error.message);
      } else {
        setOrder(data as OrderDetailType);
      }
    });
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleReview = async (decision: 'approved' | 'rejected') => {
    if (!orderId) return;
    setSubmitting(true);
    setActionError(null);
    const reviewer = session?.user?.email ?? 'unknown';
    const { error } = await supabase.rpc('dashboard_review_order', {
      p_order_id: orderId,
      p_decision: decision,
      p_reviewer: reviewer,
    });
    setSubmitting(false);
    if (error) {
      setActionError(error.message);
    } else {
      load();
    }
  };

  if (error) return <p className="error-text">Failed to load order: {error}</p>;
  if (!order) return <p>Loading order…</p>;

  return (
    <div className="order-detail">
      <p>
        <Link to="/orders">&larr; Back to orders</Link>
      </p>
      <h2>
        Order {order.order_id.slice(0, 8)}… <StatusBadge status={order.status} />
      </h2>

      <section>
        <h3>Items</h3>
        <ul>
          {order.items.map((item, i) => (
            <li key={i}>
              {item.qty}x {item.name ?? item.sku} — ${item.price?.toFixed(2)}
            </li>
          ))}
        </ul>
        <p>
          <strong>Cart value:</strong> ${Number(order.cart_value).toFixed(2)} ({order.quantity}{' '}
          item{order.quantity === 1 ? '' : 's'})
        </p>
        {order.delivery_details && (
          <p>
            <strong>Delivery:</strong> {order.delivery_details}
          </p>
        )}
      </section>

      <section>
        <h3>Review</h3>
        <p>
          <strong>Reviewed by:</strong> {order.reviewed_by ?? '—'}
          {order.reviewed_at && ` on ${new Date(order.reviewed_at).toLocaleString()}`}
        </p>
        <p>
          <strong>Provider push:</strong>{' '}
          {order.provider_order_id
            ? `${order.provider} order ${order.provider_order_id}`
            : 'not pushed'}
          {order.push_error && <span className="error-text"> — {order.push_error}</span>}
        </p>

        {order.status === 'pending_review' ? (
          <div className="review-actions">
            <button disabled={submitting} onClick={() => handleReview('approved')}>
              Approve
            </button>
            <button
              disabled={submitting}
              className="reject-button"
              onClick={() => handleReview('rejected')}
            >
              Reject
            </button>
            {actionError && <p className="error-text">{actionError}</p>}
            <p className="note">
              Note: approving marks the order as approved but does not yet push it to{' '}
              {order.provider} — the provider-push n8n workflow is not built yet (flagged in
              Phase5_Dashboard_Data_Flow.md, 5B, since BC-013). A human must currently complete
              the provider-side order manually after approval.
            </p>
          </div>
        ) : (
          <p className="note">This order has already been reviewed.</p>
        )}
      </section>
    </div>
  );
}
