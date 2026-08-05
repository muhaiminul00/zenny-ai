import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase, supabaseUrl } from '../lib/supabase';
import type { ClientConnection, DashboardClient } from '../lib/types';

// Which categories are shown per archetype, and which provider(s) can
// fill each category. This is a UI-only display judgment call (BC-016,
// widened BC-018), not a documented product decision — no source doc
// specifies this mapping. Flagged in the Implementation Report; easy to
// revise. BC-018: added 'notification' to every archetype (ops
// notifications aren't really archetype-specific) and cal_com to
// 'calendar' (it was missing entirely — the real bug this card fixes).
const ARCHETYPE_CATEGORIES: Record<string, string[]> = {
  emergency: ['calendar', 'notification'],
  commerce_ecom: ['ecommerce', 'calendar', 'notification'],
  commerce_restaurant: ['ecommerce', 'calendar', 'notification'],
  appointment: ['calendar', 'notification'],
  consultation: ['calendar', 'notification'],
  engagement: ['notification'],
};

interface ProviderOption {
  provider: string;
  label: string;
  // BC-018: whether this provider actually works today, independent of
  // control.oauth_apps.app_status (which can be stale/misleading — e.g.
  // Slack's app_status says 'testing' but its client_id is a literal
  // placeholder, per BC-004 Step C). Shown, never hidden, per this
  // card's Step 2 resolution — see the Implementation Report for the
  // Slack reasoning specifically.
  ready: boolean;
  unavailableReason?: string;
}

const CATEGORY_PROVIDERS: Record<string, ProviderOption[]> = {
  calendar: [
    { provider: 'google', label: 'Google Calendar', ready: true },
    { provider: 'calendly', label: 'Calendly', ready: true },
    {
      provider: 'cal_com',
      label: 'Cal.com',
      ready: false,
      unavailableReason: 'Cal.com app registration is still pending (no real client yet).',
    },
  ],
  ecommerce: [{ provider: 'shopify', label: 'Shopify', ready: true }],
  email: [{ provider: 'google', label: 'Gmail', ready: true }],
  notification: [
    {
      provider: 'slack',
      label: 'Slack',
      ready: false,
      unavailableReason:
        "Slack isn't connectable yet — there's no real multi-tenant OAuth app behind it (a bot-token placeholder only, per BC-004).",
    },
  ],
};

const CATEGORY_LABELS: Record<string, string> = {
  calendar: 'Calendar',
  ecommerce: 'Store',
  email: 'Email',
  notification: 'Notifications',
};

/** Normalizes anything the user types into a bare myshopify.com subdomain. */
function normalizeShopifyShop(input: string): string {
  let s = input.trim().toLowerCase();
  s = s.replace(/^https?:\/\//, '');
  s = s.replace(/\.myshopify\.com\/?$/, '');
  s = s.replace(/\/$/, '');
  return s;
}

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

    // BC-018 Step 1: Shopify's authorize URL needs the merchant's
    // {shop}.myshopify.com subdomain — oauth-initiate correctly rejects
    // the request without it (BUILD_URL_FAILED). Minimal UI per the
    // card's explicit instruction: a plain prompt, not a styled form.
    let shop: string | undefined;
    if (provider === 'shopify') {
      const raw = window.prompt(
        "What's your store's Shopify subdomain? (the part before .myshopify.com)",
      );
      if (!raw) return;
      shop = normalizeShopifyShop(raw);
      if (!shop) return;
    }

    setBusyProvider(provider);
    const url = new URL(`${supabaseUrl}/functions/v1/oauth-initiate`);
    url.searchParams.set('client_id', client.client_id);
    url.searchParams.set('category', category);
    url.searchParams.set('provider', provider);
    if (shop) url.searchParams.set('shop', shop);
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
                  {options.map((opt) =>
                    opt.ready ? (
                      <button
                        key={opt.provider}
                        disabled={busyProvider === opt.provider}
                        onClick={() => handleConnect(opt.provider, category)}
                      >
                        Connect {opt.label}
                      </button>
                    ) : (
                      <span key={opt.provider} className="note" title={opt.unavailableReason}>
                        {opt.label}: <span className="status-pill status-expired">Not yet available</span>
                      </span>
                    ),
                  )}
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
