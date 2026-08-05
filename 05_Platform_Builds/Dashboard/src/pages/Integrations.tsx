import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase, supabaseUrl } from '../lib/supabase';
import type { ClientConnection, DashboardClient } from '../lib/types';

// Which categories are shown per archetype, and which provider(s) can
// fill each category. This is a UI-only display judgment call (BC-016),
// not a documented product decision — no source doc specifies this
// mapping. Flagged in the Implementation Report; easy to revise.
const ARCHETYPE_CATEGORIES: Record<string, string[]> = {
  emergency: ['calendar', 'notification'],
  commerce_ecom: ['ecommerce', 'calendar'],
  commerce_restaurant: ['ecommerce', 'calendar'],
  appointment: ['calendar'],
  consultation: ['calendar'],
  engagement: ['notification'],
};

const CATEGORY_PROVIDERS: Record<string, { provider: string; label: string }[]> = {
  calendar: [
    { provider: 'google', label: 'Google Calendar' },
    { provider: 'calendly', label: 'Calendly' },
  ],
  ecommerce: [{ provider: 'shopify', label: 'Shopify' }],
  email: [{ provider: 'google', label: 'Gmail' }],
  notification: [{ provider: 'slack', label: 'Slack' }],
};

const CATEGORY_LABELS: Record<string, string> = {
  calendar: 'Calendar',
  ecommerce: 'Store',
  email: 'Email',
  notification: 'Notifications',
};

export function Integrations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [client, setClient] = useState<DashboardClient | null>(null);
  const [connections, setConnections] = useState<ClientConnection[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyProvider, setBusyProvider] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const [{ data: clientData, error: clientErr }, { data: connData, error: connErr }] =
      await Promise.all([
        supabase.rpc('dashboard_get_my_client'),
        supabase.rpc('dashboard_list_connections'),
      ]);
    if (clientErr) {
      setError(clientErr.message);
      return;
    }
    if (connErr) {
      setError(connErr.message);
      return;
    }
    setClient(clientData as DashboardClient);
    setConnections((connData as ClientConnection[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const connectResult = searchParams.get('connect_result');

  const handleConnect = (provider: string, category: string) => {
    if (!client) return;
    setBusyProvider(provider);
    const url = new URL(`${supabaseUrl}/functions/v1/oauth-initiate`);
    url.searchParams.set('client_id', client.client_id);
    url.searchParams.set('category', category);
    url.searchParams.set('provider', provider);
    window.location.href = url.toString();
  };

  const handleDisconnect = async (connectionId: string) => {
    setBusyProvider(connectionId);
    const { error } = await supabase.rpc('dashboard_disconnect_connection', {
      p_connection_id: connectionId,
    });
    setBusyProvider(null);
    if (error) {
      setError(error.message);
    } else {
      load();
    }
  };

  if (error) return <p className="error-text">Failed to load integrations: {error}</p>;
  if (!client || !connections) return <p>Loading integrations…</p>;

  const categories = ARCHETYPE_CATEGORIES[client.archetype] ?? [];

  return (
    <div>
      <h2>Integrations</h2>
      <p className="note">
        Connect the tools {client.business_name} already uses — Zenny reads and writes through
        them directly, nothing is duplicated.
      </p>

      {connectResult === 'success' && (
        <p className="note" style={{ color: 'var(--sage)' }}>
          Connected. Below reflects the current status, not this message alone.
        </p>
      )}
      {connectResult === 'error' && (
        <p className="error-text">
          Couldn't connect ({searchParams.get('reason') ?? 'unknown reason'}). Try again.
        </p>
      )}
      {connectResult && (
        <button
          className="secondary"
          onClick={() => setSearchParams({}, { replace: true })}
          style={{ marginBottom: 12 }}
        >
          Dismiss
        </button>
      )}

      <div className="integration-list">
        {categories.map((category) => {
          const options = CATEGORY_PROVIDERS[category] ?? [];
          const existing = connections.find((c) => c.category === category);
          return (
            <div className="integration-card" key={category}>
              <div className="provider-name">
                {CATEGORY_LABELS[category] ?? category}
                {existing && existing.status !== 'revoked' && (
                  <div className="note">
                    {existing.provider}
                    {existing.provider_account_id ? ` · ${existing.provider_account_id}` : ''}
                  </div>
                )}
              </div>

              {existing && existing.status !== 'revoked' ? (
                <>
                  <span className={`status-pill status-${statusKey(existing)}`}>
                    {statusLabel(existing)}
                  </span>
                  <button
                    className="reject-button"
                    disabled={busyProvider === existing.connection_id}
                    onClick={() => handleDisconnect(existing.connection_id)}
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <>
                  <span className="status-pill status-not_connected">Not connected</span>
                  {options.map((opt) => (
                    <button
                      key={opt.provider}
                      disabled={busyProvider === opt.provider}
                      onClick={() => handleConnect(opt.provider, category)}
                    >
                      Connect {opt.label}
                    </button>
                  ))}
                </>
              )}
            </div>
          );
        })}
      </div>

      <p className="note" style={{ marginTop: 20 }}>
        Disconnect clears Zenny's own record of the connection. It does not currently revoke
        access on the provider's side (e.g. Google's own connected-apps list) — that's a
        separate step you'd take there if you want to fully cut access.
      </p>
    </div>
  );
}

function statusKey(c: ClientConnection): string {
  if (c.status === 'connected' && c.token_expires_at && new Date(c.token_expires_at) < new Date()) {
    return 'expired';
  }
  return c.status === 'connected' ? 'connected' : c.status;
}

function statusLabel(c: ClientConnection): string {
  const key = statusKey(c);
  if (key === 'expired') return 'Token expired';
  if (key === 'connected') return 'Connected';
  if (key === 'error') return 'Error';
  return key;
}
