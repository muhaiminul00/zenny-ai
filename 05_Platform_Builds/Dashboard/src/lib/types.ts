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

export type ConnectionStatus = 'connected' | 'expired' | 'revoked' | 'error';

export interface ClientConnection {
  connection_id: string;
  provider: string;
  category: string;
  provider_account_id: string | null;
  token_expires_at: string | null;
  status: ConnectionStatus;
  last_error: string | null;
  scopes_granted: string;
  connected_at: string;
  updated_at: string;
}

export interface DashboardClient {
  client_id: string;
  client_schema_name: string;
  archetype: string;
  business_name: string;
}

export type CalendarWriteStatus = 'pending' | 'success' | 'failed';
export type AuthoritativeSource = 'client_calendar' | 'our_db_fallback';

export interface AppointmentListItem {
  appointment_id: string;
  conversion_id: string;
  client_calendar_event_id: string | null;
  client_calendar_provider: string | null;
  client_calendar_write_status: CalendarWriteStatus;
  our_db_write_status: CalendarWriteStatus;
  authoritative_source: AuthoritativeSource;
  alert_fired: boolean;
  scheduled_at: string;
  created_at: string;
  conversation_summary: string;
  intent: string;
}

export interface AppointmentDetail extends AppointmentListItem {
  source_channel: string;
}

// BC-053: opt-in third verification tier (queued human-approval -> real
// auto-execute) for WF-013 CancelAppointment / WF-016 UpdateCustomer.
export type PendingVerificationTool = 'CancelAppointment' | 'UpdateCustomer';
export type PendingVerificationTargetType = 'appointment' | 'customer';

export interface PendingVerification {
  pending_verification_id: string;
  tool_name: PendingVerificationTool;
  target_type: PendingVerificationTargetType;
  target_id: string;
  customer_id: string;
  requested_payload: Record<string, unknown>;
  status: 'pending' | 'approved_executed' | 'rejected';
  created_at: string;
  resolved_at: string | null;
  execution_result: Record<string, unknown> | null;
}
