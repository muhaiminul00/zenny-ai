// Regression tests for the Add-Admin client-picker fix (2026-09-02).
// Found by /qa on 2026-09-02
// First real tests for this component -- test framework was bootstrapped
// this same session (see TESTING.md).
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminProvision } from './AdminProvision';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

vi.mock('../lib/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    functions: { invoke: vi.fn() },
  },
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedRpc = vi.mocked(supabase.rpc);
const mockedInvoke = vi.mocked(supabase.functions.invoke);

function renderAsSuperAdmin() {
  mockedUseAuth.mockReturnValue({
    role: 'super_admin',
    flagsLoading: false,
  } as ReturnType<typeof useAuth>);
  mockedRpc.mockResolvedValue({ data: [], error: null } as never);
  return render(<AdminProvision />);
}

describe('AdminProvision', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render a client picker on the Add Admin tab', async () => {
    renderAsSuperAdmin();
    await userEvent.click(await screen.findByRole('button', { name: 'Add Admin' }));

    // Regression: AddAdminTab used to require selecting a "nominal home
    // client" here. That field must be gone entirely, not just optional.
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Tier')).toBeInTheDocument();
    expect(screen.queryByLabelText(/client/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/nominal home client/i)).not.toBeInTheDocument();
  });

  it('rejects submission with no email and never calls the Edge Function', async () => {
    renderAsSuperAdmin();
    await userEvent.click(await screen.findByRole('button', { name: 'Add Admin' }));
    await userEvent.click(screen.getByRole('button', { name: 'Create admin' }));

    // The email input's own `required` attribute blocks native form
    // submission before React's onSubmit ever runs (same as a real
    // browser) -- the visible effect is the input failing HTML5
    // constraint validation, not the custom "Email is required." message
    // (that message only fires via the remap-confirm button, which isn't
    // a <button type="submit"> and so isn't blocked by native validation).
    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
    expect(emailInput.validity.valid).toBe(false);
    expect(mockedInvoke).not.toHaveBeenCalled();
  });

  it('submits create_admin with no client field at all', async () => {
    mockedInvoke.mockResolvedValue({
      data: { result: { auth_user_id: 'auth-1', client_id: null, role: 'admin', created: true, initial_password: 'temp-pw' } },
      error: null,
    } as never);
    renderAsSuperAdmin();

    await userEvent.click(await screen.findByRole('button', { name: 'Add Admin' }));
    await userEvent.type(screen.getByLabelText('Email'), 'new-admin@zenny.internal');
    await userEvent.click(screen.getByRole('button', { name: 'Create admin' }));

    await waitFor(() => expect(mockedInvoke).toHaveBeenCalledTimes(1));
    const [fnName, options] = mockedInvoke.mock.calls[0];
    expect(fnName).toBe('admin-provision-dashboard-user');
    // The actual regression: no admin_client_id (or any client field) in
    // the request body -- the old UI always sent one.
    expect(options?.body).toEqual({
      action: 'create_admin',
      email: 'new-admin@zenny.internal',
      role: 'admin',
      remap: false,
      confirm_auth_user_id: undefined,
    });
    expect(options?.body).not.toHaveProperty('admin_client_id');
    expect(options?.body).not.toHaveProperty('client_id');
  });

  it('hides the Add Admin tab entirely for a plain admin (UX gate, not the real security boundary)', async () => {
    mockedUseAuth.mockReturnValue({ role: 'admin', flagsLoading: false } as ReturnType<typeof useAuth>);
    mockedRpc.mockResolvedValue({ data: [], error: null } as never);
    render(<AdminProvision />);

    await screen.findByRole('button', { name: 'Clients' });
    expect(screen.queryByRole('button', { name: 'Add Admin' })).not.toBeInTheDocument();
  });
});
