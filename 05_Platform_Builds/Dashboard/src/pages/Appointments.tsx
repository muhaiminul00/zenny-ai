import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type {
  AppointmentDetail,
  AppointmentListItem,
  DashboardClient,
  PausedRecoveryLead,
  PendingVerification,
} from '../lib/types';

function SourcePill({ source }: { source: string }) {
  const label = source === 'client_calendar' ? 'Client calendar (live)' : 'Our DB (fallback)';
  return <span className={`status-pill status-${source === 'client_calendar' ? 'connected' : 'expired'}`}>{label}</span>;
}

function WriteStatusBadge({ label, status }: { label: string; status: string }) {
  const key = status === 'success' ? 'connected' : status === 'failed' ? 'not_connected' : 'expired';
  return (
    <span className="note">
      {label}: <span className={`status-pill status-${key}`}>{status}</span>
    </span>
  );
}

export function AppointmentsList() {
  const [rows, setRows] = useState<AppointmentListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.rpc('dashboard_list_appointments').then(({ data, error }) => {
      if (cancelled) return;
      if (error) setError(error.message);
      else setRows((data as AppointmentListItem[]) ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="error-text">Failed to load appointments: {error}</p>;
  if (rows === null) return <p>Loading appointments…</p>;

  return (
    <div>
      <h2>Appointments</h2>
      <p className="note">
        This view monitors what the appointment-booking Tools write — it's read-only. Those
        Tools (CreateAppointment, CreateReservation, and related — Phase 8) aren't built yet, so
        every row here is real seeded test data, not live traffic.
      </p>

      {rows.length === 0 ? (
        <p>No appointments yet.</p>
      ) : (
        <table className="orders-table" style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>Appointment</th>
              <th>Scheduled for</th>
              <th>Intent</th>
              <th>Source of truth</th>
              <th>Alert</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.appointment_id}>
                <td>
                  <Link to={`/appointments/${a.appointment_id}`}>
                    {a.appointment_id.slice(0, 8)}…
                  </Link>
                </td>
                <td>
                  <strong>{new Date(a.scheduled_at).toLocaleString()}</strong>
                </td>
                <td>{a.intent}</td>
                <td>
                  <SourcePill source={a.authoritative_source} />
                </td>
                <td>
                  {a.alert_fired ? (
                    <span className="status-pill status-expired">⚠ Alert fired</span>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function AppointmentDetailPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const [appt, setAppt] = useState<AppointmentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!appointmentId) return;
    supabase
      .rpc('dashboard_get_appointment', { p_appointment_id: appointmentId })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setAppt(data as AppointmentDetail);
      });
  }, [appointmentId]);

  if (error) return <p className="error-text">Failed to load appointment: {error}</p>;
  if (!appt) return <p>Loading appointment…</p>;

  return (
    <div className="order-detail">
      <p>
        <Link to="/appointments">&larr; Back to appointments</Link>
      </p>
      <h2>
        Appointment {appt.appointment_id.slice(0, 8)}… <SourcePill source={appt.authoritative_source} />
      </h2>
      <p style={{ fontSize: 18 }}>
        <strong>{new Date(appt.scheduled_at).toLocaleString()}</strong>
        <span className="note"> · booked {new Date(appt.created_at).toLocaleString()}</span>
      </p>

      {appt.alert_fired && (
        <section style={{ borderColor: 'var(--danger)' }}>
          <strong className="error-text">⚠ Alert fired</strong>
          <p className="note">
            The client calendar write didn't succeed and Zenny's own record is currently the
            source of truth for this appointment. This needs a human to reconcile it with the
            real calendar.
          </p>
        </section>
      )}

      <section>
        <h3>Conversation</h3>
        <p>{appt.conversation_summary}</p>
        <p className="note">
          Intent: {appt.intent} · Channel: {appt.source_channel}
        </p>
      </section>

      <section>
        <h3>Write status (parallel-write, per BC-013)</h3>
        <p>
          <WriteStatusBadge label="Client calendar" status={appt.client_calendar_write_status} />
        </p>
        <p>
          <WriteStatusBadge label="Our DB" status={appt.our_db_write_status} />
        </p>
        <p className="note">
          Provider: {appt.client_calendar_provider ?? '—'} · Event ID:{' '}
          {appt.client_calendar_event_id ?? 'none (write did not succeed)'}
        </p>
      </section>
    </div>
  );
}

// BC-053: the dashboard side of the opt-in third verification tier.
// WF-013 (CancelAppointment) / WF-016 (UpdateCustomer) queue a row here
// instead of always handing off to a human when
// control.clients.verification_tier_enabled is on for this client.
// Approve genuinely executes the change (real DB write, real confirmation
// email from the client's own connected inbox) via the
// resolve-pending-verification Edge Function — not just a status flip.
function describePendingItem(item: PendingVerification): string {
  if (item.tool_name === 'CancelAppointment') {
    const reason = (item.requested_payload?.reason as string) ?? 'not specified';
    return `Cancel appointment ${item.target_id.slice(0, 8)}… — reason: ${reason}`;
  }
  const fields = Object.keys(item.requested_payload ?? {});
  return `Update customer ${item.target_id.slice(0, 8)}… — fields: ${fields.join(', ') || 'none'}`;
}

export function PendingApprovals() {
  const [client, setClient] = useState<DashboardClient | null>(null);
  const [items, setItems] = useState<PendingVerification[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const [{ data: clientData, error: clientErr }, { data: itemsData, error: itemsErr }] = await Promise.all([
      supabase.rpc('dashboard_get_my_client'),
      supabase.rpc('dashboard_list_pending_verifications'),
    ]);
    if (clientErr) {
      setError(clientErr.message);
      return;
    }
    if (itemsErr) {
      setError(itemsErr.message);
      return;
    }
    setClient(clientData as DashboardClient);
    setItems((itemsData as PendingVerification[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resolve = async (item: PendingVerification, action: 'approve' | 'reject') => {
    if (!client) return;
    setBusyId(item.pending_verification_id);
    const { data, error } = await supabase.functions.invoke('resolve-pending-verification', {
      body: {
        client_id: client.client_id,
        client_schema_name: client.client_schema_name,
        pending_verification_id: item.pending_verification_id,
        action,
      },
    });
    setBusyId(null);
    if (error || data?.error) {
      setError(data?.error?.message ?? error?.message ?? 'Action failed.');
      return;
    }
    load();
  };

  if (error) return <p className="error-text">Failed to load pending approvals: {error}</p>;
  if (!client || items === null) return <p>Loading pending approvals…</p>;

  return (
    <div>
      <h2>Pending Approvals</h2>
      <p className="note">
        Only appears here when the opt-in third verification tier is turned on for this client —
        otherwise CancelAppointment/UpdateCustomer always go straight to a human, as before.
        Approving genuinely executes the change and emails the customer from this client's own
        connected inbox; rejecting does nothing further.
      </p>

      {items.length === 0 ? (
        <p>Nothing waiting on approval.</p>
      ) : (
        <table className="orders-table" style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>Requested</th>
              <th>Queued</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.pending_verification_id}>
                <td>{describePendingItem(item)}</td>
                <td>{new Date(item.created_at).toLocaleString()}</td>
                <td>
                  <button disabled={busyId === item.pending_verification_id} onClick={() => resolve(item, 'approve')}>
                    Approve
                  </button>{' '}
                  <button
                    className="secondary"
                    disabled={busyId === item.pending_verification_id}
                    onClick={() => resolve(item, 'reject')}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// BC-056: INT-008's dedicated dashboard caller. A lead only shows up
// here once a human has taken ownership (an escalation) AND its
// recovery cadence is paused — releasing ownership doesn't just flip a
// flag, it genuinely resumes (or, if the archetype's max step was
// already reached while paused, stops) the automated cadence via
// INT-008. Deliberately a separate action from Pending Approvals above
// — approving/rejecting one queued change and releasing ownership of an
// entire lead are different decisions (see the linked Wiki decision).
export function PausedLeads() {
  const [leads, setLeads] = useState<PausedRecoveryLead[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const { data, error } = await supabase.rpc('dashboard_list_paused_recovery_leads');
    if (error) {
      setError(error.message);
      return;
    }
    setLeads((data as PausedRecoveryLead[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const release = async (lead: PausedRecoveryLead) => {
    setBusyId(lead.lead_id);
    const { data, error } = await supabase.functions.invoke('release-lead-ownership', {
      body: { lead_id: lead.lead_id },
    });
    setBusyId(null);
    if (error || data?.error) {
      setError(data?.error?.message ?? error?.message ?? 'Action failed.');
      return;
    }
    load();
  };

  if (error) return <p className="error-text">Failed to load paused leads: {error}</p>;
  if (leads === null) return <p>Loading paused leads…</p>;

  return (
    <div>
      <h2>Paused Recovery Leads</h2>
      <p className="note">
        Leads a human has taken ownership of, with their automated recovery cadence paused
        (Recovery_Engine_Flow.md §7.1). Releasing genuinely resumes the cadence from its next
        scheduled step — or stops it, if the archetype's max step was already reached while
        paused — it doesn't just clear a flag.
      </p>

      {leads.length === 0 ? (
        <p>No paused, human-owned leads right now.</p>
      ) : (
        <table className="orders-table" style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>Lead</th>
              <th>Step</th>
              <th>Contact</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.lead_id}>
                <td>{lead.conversation_summary}</td>
                <td>
                  {lead.archetype} · step {lead.current_step}
                </td>
                <td>{lead.contact_method}</td>
                <td>
                  <button disabled={busyId === lead.lead_id} onClick={() => release(lead)}>
                    Release &amp; resume
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
