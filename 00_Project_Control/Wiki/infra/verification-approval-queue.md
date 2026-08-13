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

## Known, disclosed gap

**CancelAppointment's real client-calendar event deletion is NOT built.**
No existing DELETE-event pattern exists anywhere in the platform to reuse
(WF-002 CheckAvailability's Provider Router only reads); building and
live-testing a brand-new one against a real calendar deserves its own
Build Card, not a rushed addition here. The DB-side cancellation is real
and live-verified; `execution_result.calendar_delete` is honestly
reported as `'not_implemented_this_card'` — same disclosed-limitation
pattern BC-052 used for Shopify/WooCommerce revoke.

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

## Incident during this card, fixed same session

A copy-paste error in one of BC-053's own migrations briefly overwrote
`public.get_client_appointment_with_customer` (WF-013's and WF-015's
real dependency) with an empty stub. Caught within minutes via a live
disposable-fixture test (not by chance — every RPC this card touched was
being live-verified as a matter of course), restored using the exact
join already proven correct in `dashboard_get_appointment`, reverified.
See `Workflow_Registry.md`'s WF-013 entry for the full incident writeup.

See [[../decisions/verification-tier-redesign]] (closed).
