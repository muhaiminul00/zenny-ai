import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase, supabaseUrl } from '../lib/supabase';
import type { ClientConnection, DashboardClient } from '../lib/types';

// Which categories are shown per archetype, and which provider(s) can
// fill each category. This is a UI-only display judgment call (BC-016,
// widened BC-018/BC-019), not a documented product decision — no source
// doc specifies this mapping. Flagged in the Implementation Report; easy
// to revise. BC-019: added 'email' to every archetype (Gmail — the
// existing 'google' oauth_apps row already requests gmail.modify
// alongside calendar scope, per Client_Integration_and_Credential_
// Platform_v1.md Part 8.1's "one shared app" design; no separate
// oauth_apps row needed, confirmed live before building this).
const ARCHETYPE_CATEGORIES: Record<string, string[]> = {
  emergency: ['calendar', 'notification', 'email'],
  commerce_ecom: ['ecommerce', 'calendar', 'notification', 'email'],
  commerce_restaurant: ['ecommerce', 'calendar', 'notification', 'email'],
  appointment: ['calendar', 'notification', 'email'],
  consultation: ['calendar', 'notification', 'email'],
  engagement: ['notification', 'email'],
};

interface ProviderOption {
  provider: string;
  label: string;
  // BC-018: whether this provider actually works today, independent of
  // control.oauth_apps.app_status (which can be stale/misleading — e.g.
  // Slack's app_status says 'testing' but its client_id is a literal
  // placeholder, per BC-004 Step C). Shown, never hidden, per BC-018's
  // Step 2 resolution.
  ready: boolean;
  unavailableReason?: string;
  // BC-019: 'oauth' (default, goes through oauth-initiate/oauth-callback)
  // or 'api_key' (a direct client-side form + Edge Function POST, no
  // OAuth round-trip — WooCommerce has no OAuth mechanism at all, per
  // Client_Integration_and_Credential_Platform_v1.md Part 8.3).
  kind?: 'oauth' | 'api_key';
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
  ecommerce: [
    { provider: 'shopify', label: 'Shopify', ready: true },
    { provider: 'woocommerce', label: 'WooCommerce', ready: true, kind: 'api_key' },
  ],
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

interface WooForm {
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
}

const EMPTY_WOO_FORM: WooForm = { storeUrl: '', consumerKey: '', consumerSecret: '' };

export function Integrations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [client, setClient] = useState<DashboardClient | null>(null);
  const [connections, setConnections] = useState<ClientConnection[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyProvider, setBusyProvider] = useState<string | null>(null);

  // BC-019: which category's API-key form is currently open, and its
  // field values. Only one provider (WooCommerce) uses this today —
  // kept generic in case a second api_key provider shows up later.
  const [apiKeyFormCategory, setApiKeyFormCategory] = useState<string | null>(null);
  const [wooForm, setWooForm] = useState<WooForm>(EMPTY_WOO_FORM);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  // BC-020: popup-based OAuth. popupNote is a transient status line
  // ("waiting…", "closed before finishing", success/error from the
  // postMessage) — separate from the old connectResult URL-param path,
  // which still exists as oauth-callback's fallback for any hit that
  // arrives without a window.opener (direct link, non-JS, etc.).
  const [popupNote, setPopupNote] = useState<{ kind: 'info' | 'error' | 'success'; text: string } | null>(
    null,
  );
  const popupRef = useRef<Window | null>(null);
  const popupPollRef = useRef<number | null>(null);

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

  // Stop the popup-closed poll if the page itself unmounts mid-flow.
  useEffect(() => {
    return () => stopPopupPoll();
  }, []);

  // BC-020 REVISION 2 — a second real platform constraint found live,
  // after fixing the first (Edge Functions can't serve executable HTML —
  // see below). Confirmed via curl that Google's own sign-in pages send
  // a Cross-Origin-Opener-Policy header — a well-documented, industry-
  // wide cause of `window.opener` going null partway through a real
  // Google OAuth redirect chain, independent of anything in this app's
  // code (it's why Google's own newer identity libraries moved away from
  // relying on window.opener for popup flows at all). Relying on
  // window.opener + postMessage alone is NOT reliable enough here.
  //
  // Real fix: localStorage + the `storage` event as the PRIMARY signal.
  // Unlike postMessage, it doesn't need an opener reference at all —
  // `storage` events fire in every other same-origin window/tab purely
  // because the origin matches, regardless of how that window was
  // opened or whether COOP severed the opener link. postMessage is kept
  // as a secondary, best-effort signal (fires immediately when opener
  // IS available; harmless no-op otherwise).
  //
  // oauth-callback itself is a plain redirect (v5) — Edge Functions
  // can't serve script-executing HTML at all: the gateway forces
  // Content-Type: text/plain + a `sandbox` CSP on real GET responses (a
  // `curl -I` HEAD request misleadingly showed text/html, which is what
  // made an earlier version of this fix look correct until tested in a
  // real browser). This same /integrations route is what oauth-callback
  // redirects to — including inside the popup.
  const OAUTH_RESULT_KEY = 'zenny_oauth_result';
  const hasConnectResult = searchParams.has('connect_result');

  useEffect(() => {
    if (!hasConnectResult) return;
    const success = searchParams.get('connect_result') === 'success';
    const category = searchParams.get('category');
    const reason = searchParams.get('reason');
    const payload = { type: 'zenny-oauth-result', success, category, reason, at: Date.now() };

    try {
      localStorage.setItem(OAUTH_RESULT_KEY, JSON.stringify(payload));
    } catch (_e) {
      // localStorage unavailable (private browsing etc.) — postMessage
      // below is still attempted as a fallback.
    }
    try {
      window.opener?.postMessage(payload, window.location.origin);
    } catch (_e) {
      // opener gone or a cross-origin restriction — localStorage above
      // is the real signal now, this was always best-effort.
    }
    // Only a genuine popup (opened via script) can close itself — if
    // this URL was hit directly in a normal tab, close() is a silent
    // no-op and the component falls through to the full dashboard
    // render below instead of hanging on a blank "Finishing up" page.
    window.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Parent-window listener: 'storage' is the primary, reliable signal
  // (see above); 'message' is a secondary best-effort one for the case
  // where window.opener did survive. Both funnel into the same handler;
  // harmless if both fire for the same result.
  useEffect(() => {
    function handleResult(data: { type?: string; success?: boolean; category?: string; reason?: string }) {
      if (data?.type !== 'zenny-oauth-result') return;
      stopPopupPoll();
      setBusyProvider(null);
      if (data.success) {
        setPopupNote({ kind: 'success', text: 'Connected. Refreshing status…' });
      } else {
        setPopupNote({ kind: 'error', text: `Couldn't connect (${data.reason ?? 'unknown reason'}).` });
      }
      load();
    }

    function onStorage(event: StorageEvent) {
      if (event.key !== OAUTH_RESULT_KEY || !event.newValue) return;
      try {
        handleResult(JSON.parse(event.newValue));
      } catch (_e) {
        // malformed value — ignore
      }
    }

    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      handleResult(event.data as { type?: string; success?: boolean; category?: string; reason?: string });
    }

    window.addEventListener('storage', onStorage);
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('message', onMessage);
    };
  }, [load]);

  // Fallback path: oauth-callback redirected a full page here (no
  // window.opener was present when it ran — e.g. this URL was opened
  // directly rather than via a popup). Kept working, not the primary
  // path anymore as of BC-020.
  const connectResult = searchParams.get('connect_result');

  function stopPopupPoll() {
    if (popupPollRef.current !== null) {
      window.clearInterval(popupPollRef.current);
      popupPollRef.current = null;
    }
  }

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

    const url = new URL(`${supabaseUrl}/functions/v1/oauth-initiate`);
    url.searchParams.set('client_id', client.client_id);
    url.searchParams.set('category', category);
    url.searchParams.set('provider', provider);
    if (shop) url.searchParams.set('shop', shop);

    // BC-020: popup instead of a full-page redirect. Explicit width/
    // height, not a new tab (per the card's explicit instruction). A
    // unique target name per attempt, not a fixed 'zenny-oauth' —
    // reusing one fixed name across repeated opens in the same session
    // showed inconsistent same-tab-navigation behavior during testing
    // instead of a genuine new popup; a fresh name each time avoids any
    // browser-level named-window reuse entirely, which is the safer,
    // more standard pattern for repeatable popup flows regardless.
    setPopupNote(null);
    setBusyProvider(provider);
    const popup = window.open(
      url.toString(),
      `zenny-oauth-${Date.now()}`,
      'width=520,height=680,menubar=no,toolbar=no,location=yes',
    );

    if (!popup) {
      setBusyProvider(null);
      setPopupNote({ kind: 'error', text: 'Popup blocked — allow popups for this site and try again.' });
      return;
    }

    popupRef.current = popup;
    setPopupNote({ kind: 'info', text: 'Waiting for you to finish in the popup…' });

    // BC-020 Step 4: the popup closing (postMessage already handles the
    // success/error case and calls stopPopupPoll() itself) is the only
    // signal available for "user closed it manually before finishing" —
    // there's no server-side event for that. Poll rather than hang
    // forever waiting for a message that will never come.
    popupPollRef.current = window.setInterval(() => {
      if (popup.closed) {
        stopPopupPoll();
        setBusyProvider((current) => {
          if (current === provider) {
            setPopupNote({ kind: 'info', text: 'Window closed before finishing — nothing was connected.' });
            return null;
          }
          return current;
        });
      }
    }, 500);
  };

  const openWooForm = (category: string) => {
    setApiKeyError(null);
    setWooForm(EMPTY_WOO_FORM);
    setApiKeyFormCategory(category);
  };

  const submitWooForm = async () => {
    if (!client) return;
    if (!wooForm.storeUrl || !wooForm.consumerKey || !wooForm.consumerSecret) {
      setApiKeyError('All 3 fields are required.');
      return;
    }
    setBusyProvider('woocommerce');
    setApiKeyError(null);
    // Minimal UI per the card's explicit "functionality over polish"
    // instruction — plain form, direct call to the real Edge Function
    // (woocommerce-connect), same {client_id, store_url, consumer_key,
    // consumer_secret} shape its real source expects (re-read live, not
    // guessed).
    const { data, error } = await supabase.functions.invoke('woocommerce-connect', {
      body: {
        client_id: client.client_id,
        store_url: wooForm.storeUrl,
        consumer_key: wooForm.consumerKey,
        consumer_secret: wooForm.consumerSecret,
      },
    });
    setBusyProvider(null);
    if (error || data?.error) {
      // supabase-js's FunctionsHttpError doesn't auto-parse the response
      // body into `error.message` (that stays a generic "non-2xx status
      // code") — the real reason lives in the raw Response on
      // `error.context`, per supabase-js's own error shape. Caught via
      // live testing: the generic message alone told the user nothing
      // useful (e.g. which real WooCommerce validation actually failed).
      let message = data?.error?.message;
      if (!message && error && 'context' in error) {
        try {
          const body = await (error as { context: Response }).context.json();
          message = body?.error?.message;
        } catch {
          // context wasn't valid JSON — fall through to the generic message
        }
      }
      setApiKeyError(message ?? error?.message ?? 'Connection failed.');
      return;
    }
    setApiKeyFormCategory(null);
    load();
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

  // BC-020: if this load IS a popup completing, window.close() already
  // fired in the effect above and the tab vanishes before this even
  // paints. If close() was a no-op (this wasn't actually a script-opened
  // window — e.g. the raw callback URL was hit directly), falling
  // through to the normal dashboard render below — complete with the
  // existing connectResult banner — is the correct fallback, not a
  // separate "finishing up" state.

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
      <p className="note">
        Connecting Google (Calendar or Gmail) opens a popup showing "Google hasn't verified this
        app" — that's Google's own trust warning, not a bug here. It goes away once Google's
        verification review finishes; nothing in this dashboard can remove it sooner.
      </p>

      {popupNote && (
        <p className={popupNote.kind === 'error' ? 'error-text' : 'note'}>{popupNote.text}</p>
      )}

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
            <div className="integration-card" key={category} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
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
                      !opt.ready ? (
                        <span key={opt.provider} className="note" title={opt.unavailableReason}>
                          {opt.label}: <span className="status-pill status-expired">Not yet available</span>
                        </span>
                      ) : opt.kind === 'api_key' ? (
                        <button
                          key={opt.provider}
                          disabled={busyProvider === opt.provider}
                          onClick={() => openWooForm(category)}
                        >
                          Connect {opt.label}
                        </button>
                      ) : (
                        <button
                          key={opt.provider}
                          disabled={busyProvider === opt.provider}
                          onClick={() => handleConnect(opt.provider, category)}
                        >
                          Connect {opt.label}
                        </button>
                      ),
                    )}
                  </>
                )}
              </div>

              {apiKeyFormCategory === category && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <p className="note">
                    WooCommerce has no OAuth flow — generate these in your store's wp-admin under
                    WooCommerce → Settings → Advanced → REST API, then paste them here.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 420 }}>
                    <label>
                      Store URL
                      <input
                        type="text"
                        placeholder="https://yourstore.com"
                        value={wooForm.storeUrl}
                        onChange={(e) => setWooForm({ ...wooForm, storeUrl: e.target.value })}
                      />
                    </label>
                    <label>
                      Consumer Key
                      <input
                        type="text"
                        value={wooForm.consumerKey}
                        onChange={(e) => setWooForm({ ...wooForm, consumerKey: e.target.value })}
                      />
                    </label>
                    <label>
                      Consumer Secret
                      <input
                        type="password"
                        value={wooForm.consumerSecret}
                        onChange={(e) => setWooForm({ ...wooForm, consumerSecret: e.target.value })}
                      />
                    </label>
                  </div>
                  {apiKeyError && <p className="error-text">{apiKeyError}</p>}
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button disabled={busyProvider === 'woocommerce'} onClick={submitWooForm}>
                      {busyProvider === 'woocommerce' ? 'Validating…' : 'Connect'}
                    </button>
                    <button className="secondary" onClick={() => setApiKeyFormCategory(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
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
