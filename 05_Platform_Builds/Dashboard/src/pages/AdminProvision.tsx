import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// BC-076-Card2a: admin-only dashboard-user provisioning. The real
// authorization boundary is server-side (admin-provision-dashboard-user's
// own role='admin' check against the caller's JWT) — this page's own
// role check is UX only (hide the form / show access-denied), never
// trusted as the actual gate. See docs/designs/zenny-launch-blueprint.md
// Card 2a and Wiki/infra/dashboard-auth-mapping.md for the full design.

interface ClientOption {
  client_id: string;
  business_name: string;
  archetype: string;
}

type Role = 'client_user' | 'admin';

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

export function AdminProvision() {
  const [myRole, setMyRole] = useState<Role | null | 'loading'>('loading');
  const [clients, setClients] = useState<ClientOption[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [clientId, setClientId] = useState('');
  const [role, setRole] = useState<Role>('client_user');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [needsRemapConfirm, setNeedsRemapConfirm] = useState<{ auth_user_id: string } | null>(null);
  const [success, setSuccess] = useState<{ auth_user_id: string; created: boolean; initial_password?: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: roleData, error: roleErr } = await supabase.rpc('dashboard_get_my_role');
      if (cancelled) return;
      if (roleErr || roleData !== 'admin') {
        setMyRole(null);
        return;
      }
      setMyRole('admin');
      const { data: clientsData, error: clientsErr } = await supabase.rpc('dashboard_admin_list_clients');
      if (cancelled) return;
      if (clientsErr) {
        setListError(clientsErr.message);
      } else {
        setClients((clientsData as ClientOption[]) ?? []);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
        email,
        client_id: clientId,
        role,
        remap,
        // Echoes back the exact id the server gave us in the prior 409 —
        // proves this is a genuine confirmed second call, not a blindly
        // guessed remap:true (Codex adversarial review).
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

  if (myRole === 'loading') return <p>Loading…</p>;
  if (myRole === null) {
    return <p className="error-text">Admin access required. Ask an existing admin to provision your account.</p>;
  }

  return (
    <div>
      <h2>Admin — Provision Dashboard User</h2>
      <p className="note">
        Creates a real login for a new or existing client. Existing clients only — this does not create a new
        business, just a dashboard account mapped to one.
      </p>

      {listError && <p className="error-text">Failed to load client list: {listError}</p>}

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
                {c.business_name} ({c.archetype})
              </option>
            ))}
          </select>
        </label>

        <label>
          Role
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="client_user">Client user</option>
            <option value="admin">Admin</option>
          </select>
        </label>

        {formError && <p className="error-text">{formError}</p>}

        {needsRemapConfirm ? (
          <button type="button" disabled={submitting} onClick={() => submit(true)}>
            {submitting ? 'Reassigning…' : 'Confirm — reassign this existing account'}
          </button>
        ) : (
          <button type="submit" disabled={submitting}>
            {submitting ? 'Provisioning…' : 'Provision user'}
          </button>
        )}
      </form>

      {success && (
        <div className="note" role="status">
          <p>
            {success.created ? 'New account created' : 'Existing account reassigned'} (auth user{' '}
            <code>{success.auth_user_id}</code>).
          </p>
          {success.initial_password && (
            <p>
              <strong>Initial password (shown once here, not stored anywhere — give it to the user directly and
              have them change it after first login):</strong> <code>{success.initial_password}</code>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
