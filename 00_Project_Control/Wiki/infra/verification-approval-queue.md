# Verification Approval Queue — Opt-In Third Tier (BC-053)

## What it replaced

WF-013 (CancelAppointment) and WF-016 (UpdateCustomer) were strictly
binary per the Customer Verification Rule: since no verification
mechanism existed anywhere, they **always** routed to Human Handoff
Handler (WF-017) rather than executing. No queued-approval path existed.

## What it is now

**Opt-in per client**, default off — `control.clients.verification_tier_enabled`
(boolean). Existing clients keep today's always-handoff behavior
unchanged; nothing routes differently until this flag is explicitly
turned on for a client (human-decided 2026-08-14).

**Schema — reuses existing columns, no schema invention:**
- "Cancelled" appointment state = `conversions.final_state`/`conversion_state
  = 'cancelled'` (already a real `conversion_state_enum` value) via
  `appointments.conversion_id` — no new `appointments.status` column.
- UpdateCustomer's arbitrary `fields` payload maps `primary_contact_method`
  directly onto `customers`, everything else upserts into
  `customer_preferences` (already a flexible key/value store) — no new
  `customers` columns.
- New `pending_verifications` table, created in all 5 `tpl_*` templates
  and all 5 real client schemas (dynamic migration, not hardcoded per-
  schema DDL), and registered in `create_client_schema_from_template`'s
  common-tables list for future clients.

**WF-013/WF-016** both gained a `Check Verification Tier -> Tier Enabled?`
branch. Off: identical to pre-BC-053 behavior (verified via live regression
test — same response shape). On: calls `queue_pending_verification`,
responds `{status: "pending_approval", pending_verification_id}` instead
of ever calling WF-017.

**Dashboard** — new `/approvals` page (`PendingApprovals` in
`Appointments.tsx`), lists pending items via `dashboard_list_pending_verifications`,
Approve/Reject buttons call the new `resolve-pending-verification` Edge
Function.

**Edge Function `resolve-pending-verification`** (same conventions as
BC-052's `connection-lifecycle`: service_role, trusted body params,
`verify_jwt: false`):
- **approve** — executes the real change (`cancel_client_appointment` /
  `apply_customer_update`), then sends a confirmation from the client's
  own connected email by calling **WF-019 SendEmailReply's real webhook
  directly** (reused as-is — its own `get_email_record` RPC returns
  `{found:false}` for an unknown `email_id`, which its logic already
  treats as "not yet sent" and proceeds; confirmed by reading its live
  definition, not assumed). A send failure doesn't undo the already-made
  DB change — same "don't flip success to error after the real action
  already happened" discipline WF-019 itself uses for its own bookkeeping.
- **reject** — marks the row rejected, no execution, no email.

## Calendar-event deletion — BUILT (BC-055, 2026-08-14)

`resolve-pending-verification`'s approve path now attempts a real
client-calendar event delete after `cancel_client_appointment`, reusing
BC-052's `connection-lifecycle` credential pattern exactly
(`get_client_connection`/`read_credential_secret` via direct RPC, not a
new mechanism). Google: real `DELETE
/calendars/primary/events/{eventId}` (204/404/410 all count as "gone").
Calendly: real `POST /scheduled_events/{uuid}/cancellation` (Calendly
has no DELETE-event endpoint; cancellation is the documented
equivalent) — built per Calendly's documented API but **not live-tested**
(no roster client has a real Calendly connection), same disclosed-
untested pattern BC-052 used for Shopify Refresh. Any other provider, or
an appointment whose `client_calendar_event_id` was never written (an
`our_db_fallback`-authoritative row), is honestly reported as
`not_attempted` — never faked as deleted.

**Real, full end-to-end live proof (Google), not just structural:**
Mandatory MCP Verification first re-checked the "no roster client has a
working calendar connection" assumption from BC-053/PROJECT_STATE rather
than trusting it — found Client A's Google connection is actually
`connected` with a real token, but a real WF-002 CheckAvailability call
returned Google 403 `ACCESS_TOKEN_SCOPE_INSUFFICIENT` for **FreeBusy
Query** specifically. Rather than concluding the whole connection lacked
Calendar scope, tested the actual endpoint this card needed directly: a
real `GET` on a nonexistent event id returned a genuine `404 Not Found`
(not a 403), meaning the events resource IS in scope even though
FreeBusy isn't (Google grants scope per-capability, not per-connection).
Confirmed by going further — created a real disposable Google Calendar
event via the same resolved token, wired a disposable
`pending_verifications` row to it, called the real deployed Edge
Function, got `calendar_delete: "deleted"` / `google delete: 204`, then
independently re-fetched the same event from Google directly and
confirmed `status: "cancelled"` on Google's own side. All disposable DB
fixtures (customers/leads/conversions/appointments/pending_verifications)
deleted after verification; the Google event itself is left in its real
`cancelled` state (Google's own soft-delete, nothing further to clean
up).

**Real, incidental side-effect of building this:** a
`resolve-pending-verification` redeploy briefly defaulted to
`verify_jwt: true` (the Supabase MCP deploy tool's own default) instead
of the project's established `verify_jwt: false` convention for this
class of Edge Function — caught immediately via the deploy tool's own
returned state, corrected with an explicit redeploy before any real
caller could hit it.

## Real, unrelated finding surfaced during this card

Attempting a live confirmation-email send for a client without a real
connected email surfaced a **pre-existing internal credential problem**:
n8n's `zenny-notification-sender` Gmail credential (used inside UTIL-006's
Credential Resolver, unrelated to any per-client credential) has expired
and needs manual reconnection — this crashes the sub-workflow with an
uncaught error instead of failing gracefully. Not fixed this card
(Credential Gate — needs human OAuth re-auth, can't be resolved
programmatically). `resolve-pending-verification` itself handles this
correctly regardless (catches the failure, reports it honestly,
doesn't crash or lie about success) — but the underlying UTIL-006
reliability gap is real and should be fixed independently. See Active
Blockers.

## Real double-fulfillment race — FIXED (BC-2026-08-31)

**Found live during a multi-tenant/concurrency audit, not anticipated in
planning:** `resolve-pending-verification`'s approve path read the row's
status via `get_pending_verification_for_action` (plain SELECT), checked
`status !== 'pending'` in application code, and only wrote the new
status at the very end via `resolve_pending_verification` (plain UPDATE,
no `WHERE status = 'pending'` guard, no row lock in between). Two
concurrent approve calls on the same `pending_verification_id` (a
double-click, or two staff members approving at once) both passed the
pending-check before either resolved it — `insert_client_cart`/
`cancel_client_appointment`/the calendar-delete above could fire twice
for one request. A real money-shaped bug, not cosmetic.

**Fix:** a new `'processing'` intermediate status (added to
`pending_verifications_status_check` in all 11 schemas) and a new RPC,
`claim_pending_verification(p_schema, p_id)` — an atomic
`UPDATE ... SET status = 'processing' WHERE status = 'pending' RETURNING *`.
Zero rows returned means someone else already claimed it. The Edge
Function now calls this claim **first**, before any of the three
execution branches — a losing concurrent call gets an immediate `409
ALREADY_RESOLVED`, no execution attempted. On an execution failure
*after* a successful claim, a companion `unclaim_pending_verification`
reverts the row to `'pending'` (not a dead-end `'failed'` state) so it
stays retryable/reviewable rather than silently lost — the edge case a
naive version of this fix misses. **Live-verified:** two concurrent
claims on the same real `pending_verification_id` — exactly one
succeeded (`status: "processing"`), the other returned `null`; this is
Postgres's atomic conditional-UPDATE guarantee under MVCC, provably
race-safe regardless of timing, not something that needs a forced
microsecond-level race to "prove" once. Full pattern, plus the sibling
`find_or_create_conversation`/`queue_pending_verification` fixes from
the same audit: `Wiki/platform-quirks/n8n-concurrency-race-patterns.md`.

**Stale claim flagged, not fixed this card:** this page's own "Edge
Function" section above still says `verify_jwt: false` for
`resolve-pending-verification` — the live function is actually deployed
`verify_jwt: true` and derives `client_id`/`client_schema_name` from the
caller's session JWT (per BC-063, `Wiki/index.md`'s
`anon-grant-exposure-bc052` entry). Out of this card's scope to rewrite;
flagged here so the next session touching this page corrects it.

## Incident during this card, fixed same session

A copy-paste error in one of BC-053's own migrations briefly overwrote
`public.get_client_appointment_with_customer` (WF-013's and WF-015's
real dependency) with an empty stub. Caught within minutes via a live
disposable-fixture test (not by chance — every RPC this card touched was
being live-verified as a matter of course), restored using the exact
join already proven correct in `dashboard_get_appointment`, reverified.
See `Workflow_Registry.md`'s WF-013 entry for the full incident writeup.

See [[../decisions/verification-tier-redesign]] (closed).
