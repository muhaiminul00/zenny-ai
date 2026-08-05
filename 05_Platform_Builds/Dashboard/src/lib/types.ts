export type OrderStatus =
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'pushed'
  | 'push_failed'
  | 'fulfilled'
  | 'cancelled';

export interface OrderListItem {
  order_id: string;
  status: OrderStatus;
  provider: string;
  provider_order_id: string | null;
  push_attempted_at: string | null;
  push_error: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  cart_value: number;
  quantity: number;
}

export interface OrderItem {
  sku?: string;
  name?: string;
  qty?: number;
  price?: number;
  [key: string]: unknown;
}

export interface OrderDetail extends OrderListItem {
  items: OrderItem[];
  delivery_details: string | null;
}
