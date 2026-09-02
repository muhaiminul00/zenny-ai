import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

// BC-076-Card2a (map_existing) + Admin Provisioning Bootstrap
// (create_client / create_admin, T7). The real authorization boundary is
// server-side (admin-provision-dashboard-user's own role checks against
// the caller's JWT) — every check in this file is UX only (hide the
// form / show access-denied), never trusted as the actual gate. See
// docs/designs/admin-provisioning-redesign-bootstrap.md and
// Wiki/infra/dashboard-auth-mapping.md for the full design.

interface ClientRow {
  client_id: string;
  business_name: string;
  archetype: string | null;
  status: string;
  created_at: string;
  email: string | null;
}

type Tab = 'clients' | 'add_client' | 'add_login' | 'add_admin';

async function extractFunctionError(
  data: { error?: { message?: string; code?: string; auth_user_id?: string } } | null,
  error: unknown,
): Promise<{ message: string; code?: string; auth_user_id?: string }> {
  let message = data?.error?.message;
  let code = data?.error?.code;
  let auth_user_id = data?.error?.auth_user_id;
  if (!message && error && typeof error === 'object' && 'context' in error) {
    try {
      const body = await (error as { context: Response }).context.json();
      message = body?.error?.message;
      code = body?.error?.code;
      auth_user_id = body?.error?.auth_user_id;
    } catch {
      // context wasn't valid JSON — fall through to the generic message
    }
  }
  return { message: message ?? (error as { message?: string } | null)?.message ?? 'Request failed.', code, auth_user_id };
}

function ResultBanner({ result }: { result: { auth_user_id: string; created: boolean; initial_password?: string; client_id?: string } }) {
  return (
    <div className="note" role="status">
      <p>
        {result.created ? 'New account created' : 'Existing account reassigned'} (auth user{' '}
        <code>{result.auth_user_id}</code>
        {result.client_id && (
          <>
            , client <code>{result.client_id}</code>
          </>
        )}
        ).
      </p>
      {result.initial_password && (
        <p>
          <strong>
            Initial password (shown once here, not stored anywhere — give it to the user directly; they'll be
            required to change it on first login):
          </strong>{' '}
          <code>{result.initial_password}</code>
        </p>
      )}
    </div>
  );
}

export function AdminProvision() {
  const { role, flagsLoading } = useAuth();
  const [tab, setTab] = useState<Tab>('clients');
  const [clients, setClients] = useState<ClientRow[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const loadClients = useCallback(() => {
    supabase.rpc('dashboard_admin_list_clients').then(({ data, error }) => {
      if (error) {
        setListError(error.message);
      } else {
        setListError(null);
        setClients((data as ClientRow[]) ?? []);
      }
    });
  }, []);

  useEffect(() => {
    if (role === 'admin' || role === 'super_admin') loadClients();
  }, [role, loadClients]);

  if (flagsLoading) return <p>Loading…</p>;
  if (role !== 'admin' && role !== 'super_admin') {
    return <p className="error-text">Admin access required. Ask an existing admin to provision your account.</p>;
  }

  const isSuperAdmin = role === 'super_admin';

  return (
    <div>
      <h2>Admin</h2>

      <nav className="tabs">
        <span className="tabs-group">
          <span className="tabs-group-label">Clients</span>
          <button type="button" className={tab === 'clients' ? 'active' : ''} onClick={() => setTab('clients')}>
            Clients
          </button>
          <button type="button" className={tab === 'add_client' ? 'active' : ''} onClick={() => setTab('add_client')}>
            Add Client
          </button>
          <button type="button" className={tab === 'add_login' ? 'active' : ''} onClick={() => setTab('add_login')}>
            Add Login
          </button>
        </span>
        {isSuperAdmin && (
          <span className="tabs-group tabs-group-admin">
            <span className="tabs-group-label">Internal accounts</span>
            <button type="button" className={tab === 'add_admin' ? 'active' : ''} onClick={() => setTab('add_admin')}>
              Add Admin
            </button>
          </span>
        )}
      </nav>

      {tab === 'clients' && <ClientsTab clients={clients} listError={listError} />}
      {tab === 'add_client' && <AddClientTab onDone={loadClients} />}
      {tab === 'add_login' && <AddLoginTab clients={clients} />}
      {tab === 'add_admin' && isSuperAdmin && <AddAdminTab />}
    </div>
  );
}

function ClientsTab({ clients, listError }: { clients: ClientRow[] | null; listError: string | null }) {
  if (listError) return <p className="error-text">Failed to load client list: {listError}</p>;
  if (!clients) return <p>Loading…</p>;
  return (
    <table>
      <thead>
        <tr>
          <th>Business</th>
          <th>Status</th>
          <th>Archetype</th>
          <th>Login email</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        {clients.map((c) => (
          <tr key={c.client_id}>
            <td>{c.business_name}</td>
            <td>{c.status}</td>
            <td>{c.archetype ?? <em>not yet set</em>}</td>
            <td>{c.email ?? <em>no login yet</em>}</td>
            <td>{c.created_at}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AddClientTab({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [billingTier, setBillingTier] = useState('standard');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [needsRemapConfirm, setNeedsRemapConfirm] = useState<{ auth_user_id: string } | null>(null);
  const [success, setSuccess] = useState<{ auth_user_id: string; client_id: string; created: boolean; initial_password?: string } | null>(null);

  const submit = async (remap: boolean) => {
    if (!email || !businessName) {
      setFormError('Email and business name are both required.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    setSuccess(null);
    const { data, error } = await supabase.functions.invoke('admin-provision-dashboard-user', {
      body: {
        action: 'create_client',
        email,
        business_name: businessName,
        billing_tier: billingTier,
        remap,
        confirm_auth_user_id: remap ? needsRemapConfirm?.auth_user_id : undefined,
      },
    });
    setSubmitting(false);
    if (error || data?.error) {
      const extracted = await extractFunctionError(data, error);
      if (extracted.code === 'USER_EXISTS' && extracted.auth_user_id) {
        setNeedsRemapConfirm({ auth_user_id: extracted.auth_user_id });
        setFormError(extracted.message);
        return;
      }
      setFormError(extracted.message);
      return;
    }
    setNeedsRemapConfirm(null);
    setSuccess(data.result);
    setEmail('');
    setBusinessName('');
    onDone();
  };

  return (
    <div>
      <p className="note">
        Creates a brand-new client (a shell record — status "unprovisioned") plus its first dashboard login. Real
        provisioning (archetype, schema) happens separately, once the client's business details are known.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(false);
        }}
      >
        <label>
          Business name
          <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
        </label>
        <label>
          Login email
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setNeedsRemapConfirm(null);
            }}
            required
          />
        </label>
        <label>
          Billing tier
          <select value={billingTier} onChange={(e) => setBillingTier(e.target.value)}>
            <option value="standard">standard</option>
            <option value="demo">demo</option>
            <option value="test">test</option>
          </select>
        </label>
        {formError && <p className="error-text">{formError}</p>}
        {needsRemapConfirm ? (
          <button type="button" disabled={submitting} onClick={() => submit(true)}>
            {submitting ? 'Reassigning…' : 'Confirm — reassign this existing account to the new client'}
          </button>
        ) : (
          <button type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create client'}
          </button>
        )}
      </form>
      {success && <ResultBanner result={success} />}
    </div>
  );
}

function AddLoginTab({ clients }: { clients: ClientRow[] | null }) {
  const [email, setEmail] = useState('');
  const [clientId, setClientId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [needsRemapConfirm, setNeedsRemapConfirm] = useState<{ auth_user_id: string } | null>(null);
  const [success, setSuccess] = useState<{ auth_user_id: string; created: boolean; initial_password?: string } | null>(null);

  const submit = async (remap: boolean) => {
    if (!email || !clientId) {
      setFormError('Email and client are both required.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    setSuccess(null);
    const { data, error } = await supabase.functions.invoke('admin-provision-dashboard-user', {
      body: {
        action: 'map_existing',
        email,
        client_id: clientId,
        role: 'client_user',
        remap,
        confirm_auth_user_id: remap ? needsRemapConfirm?.auth_user_id : undefined,
      },
    });
    setSubmitting(false);
    if (error || data?.error) {
      const extracted = await extractFunctionError(data, error);
      if (extracted.code === 'USER_EXISTS' && extracted.auth_user_id) {
        setNeedsRemapConfirm({ auth_user_id: extracted.auth_user_id });
        setFormError(extracted.message);
        return;
      }
      setFormError(extracted.message);
      return;
    }
    setNeedsRemapConfirm(null);
    setSuccess(data.result);
    setEmail('');
  };

  return (
    <div>
      <p className="note">
        Adds another client_user login for a client that already exists. To mint an admin instead, use the Add Admin
        tab (super_admin only).
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(false);
        }}
      >
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setNeedsRemapConfirm(null);
            }}
            required
          />
        </label>
        <label>
          Client
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} required>
            <option value="" disabled>
              Select a client…
            </option>
            {clients?.map((c) => (
              <option key={c.client_id} value={c.client_id}>
                {c.business_name} ({c.archetype ?? 'not yet set'})
              </option>
            ))}
          </select>
        </label>
        {formError && <p className="error-text">{formError}</p>}
        {needsRemapConfirm ? (
          <button type="button" disabled={submitting} onClick={() => submit(true)}>
            {submitting ? 'Reassigning…' : 'Confirm — reassign this existing account'}
          </button>
        ) : (
          <button type="submit" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add login'}
          </button>
        )}
      </form>
      {success && <ResultBanner result={success} />}
    </div>
  );
}

function AddAdminTab() {
  const [email, setEmail] = useState('');
  const [adminRole, setAdminRole] = useState<'admin' | 'super_admin'>('admin');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [needsRemapConfirm, setNeedsRemapConfirm] = useState<{ auth_user_id: string } | null>(null);
  const [success, setSuccess] = useState<{ auth_user_id: string; created: boolean; initial_password?: string } | null>(null);

  const submit = async (remap: boolean) => {
    if (!email) {
      setFormError('Email is required.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    setSuccess(null);
    const { data, error } = await supabase.functions.invoke('admin-provision-dashboard-user', {
      body: {
        action: 'create_admin',
        email,
        role: adminRole,
        remap,
        confirm_auth_user_id: remap ? needsRemapConfirm?.auth_user_id : undefined,
      },
    });
    setSubmitting(false);
    if (error || data?.error) {
      const extracted = await extractFunctionError(data, error);
      if (extracted.code === 'USER_EXISTS' && extracted.auth_user_id) {
        setNeedsRemapConfirm({ auth_user_id: extracted.auth_user_id });
        setFormError(extracted.message);
        return;
      }
      setFormError(extracted.message);
      return;
    }
    setNeedsRemapConfirm(null);
    setSuccess(data.result);
    setEmail('');
  };

  return (
    <div>
      <p className="note">
        super_admin only. An admin/super_admin account has no client of its own to view — no client selection
        needed (dashboard_users.client_id is NULL for every admin-tier account).
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(false);
        }}
      >
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setNeedsRemapConfirm(null);
            }}
            required
          />
        </label>
        <label>
          Tier
          <select value={adminRole} onChange={(e) => setAdminRole(e.target.value as 'admin' | 'super_admin')}>
            <option value="admin">admin</option>
            <option value="super_admin">super_admin</option>
          </select>
        </label>
        {formError && <p className="error-text">{formError}</p>}
        {needsRemapConfirm ? (
          <button type="button" disabled={submitting} onClick={() => submit(true)}>
            {submitting ? 'Reassigning…' : 'Confirm — reassign this existing account'}
          </button>
        ) : (
          <button type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create admin'}
          </button>
        )}
      </form>
      {success && <ResultBanner result={success} />}
    </div>
  );
}
