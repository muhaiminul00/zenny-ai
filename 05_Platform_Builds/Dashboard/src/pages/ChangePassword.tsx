import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

// Admin Provisioning Bootstrap, T8 (D4). Rendered by App.tsx's route
// guard whenever must_change_password is true, in place of every other
// route -- not a one-time login-page nag (Codex's explicit correction).
// A password change is a self-service action on one's own account, so
// this goes straight through supabase-js auth.updateUser() (the user's
// own session JWT already authorizes it) -- no Edge Function needed.
// Clearing the flag afterward needs a privileged write to
// control.dashboard_users (REVOKE ALL from anon/authenticated, same
// pattern as every other control table), so that step goes through the
// new dashboard_clear_must_change_password() RPC instead of a direct
// table write.
export function ChangePassword() {
  const { refreshFlags, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    const { error: updateErr } = await supabase.auth.updateUser({ password });
    if (updateErr) {
      setSubmitting(false);
      setError(updateErr.message);
      return;
    }
    const { error: clearErr } = await supabase.rpc('dashboard_clear_must_change_password');
    setSubmitting(false);
    if (clearErr) {
      // Password itself already changed successfully -- don't block the
      // user behind a flag-clear failure, but surface it plainly.
      setError(`Password changed, but could not clear the reset flag: ${clearErr.message}`);
      return;
    }
    refreshFlags();
  };

  return (
    <div className="app-shell">
      <main>
        <h2>Set a new password</h2>
        <p className="note">
          Your account was provisioned with a temporary password. Choose a new one before continuing.
        </p>
        <form onSubmit={submit}>
          <label>
            New password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </label>
          <label>
            Confirm new password
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
          </label>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Set password'}
          </button>
        </form>
        <p className="note">
          Wrong account? <button type="button" onClick={() => signOut()}>Sign out</button>
        </p>
      </main>
    </div>
  );
}
