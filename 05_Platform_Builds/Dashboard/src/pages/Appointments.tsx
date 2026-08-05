import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { AppointmentDetail, AppointmentListItem } from '../lib/types';

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
              <th>Intent</th>
              <th>Source of truth</th>
              <th>Alert</th>
              <th>Created</th>
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
                <td>{new Date(a.created_at).toLocaleString()}</td>
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
