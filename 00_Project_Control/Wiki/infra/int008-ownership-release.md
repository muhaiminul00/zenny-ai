# INT-008 Ownership-Release Caller (BC-056)

## What it closed

INT-008 (Resume Recovery, built BC-050) had no real caller — nothing in
the built system ever flipped `recovery_queue.human_ownership_flag` back
to `false`. See [[../decisions/int-008-ownership-release-caller]] for
the mechanism decision (dedicated dashboard action, not piggybacked on
`/approvals` Reject).

## Real finding during Mandatory MCP Verification

**Neither INT-008 nor its `resume_client_recovery` RPC ever touch
`human_ownership_flag` at all** — both only read/write `recovery_queue
.status`. The prior assumption (that INT-008 itself implemented
"ownership release") was wrong; INT-008 only implements "resume from
paused," a distinct step. The real flag-clear had to be added as new
logic, not just a new caller for existing logic.

## What's built

**`control.dashboard_release_lead_ownership(p_lead_id)`** — new RPC,
same `auth.uid()`-via-`control.dashboard_users` scoping pattern as
BC-051's `dashboard_get_my_client_schema`. Sets
`human_ownership_flag = false` on the caller's own client schema only
(fail-closed: no mapping → exception; wrong/foreign `lead_id` → no row
matched → exception). **`dashboard_list_paused_recovery_leads()`** —
companion read RPC, lists only leads that are both `status='paused'`
AND `human_ownership_flag=true` (the real precondition for Trigger B,
Recovery_Engine_Flow.md §7.1 Ownership Rule) — a paused lead a human
never took ownership of doesn't show up.

**INT-008 gained a real webhook** (`POST /webhook/resume-recovery`) —
it previously had zero production triggers, only an internal
`executeWorkflowTrigger`. Added a `Normalize Contract` node (matching
WF-018/WF-019's own convention) so both entry points feed the existing
decision logic identically; all downstream `$('Resume Recovery
Trigger')` references were switched to `$('Normalize Contract')`. 3 new
`Respond to Webhook` nodes cover the 3 terminal branches (resumed/
stopped, no-op, unknown client). INT-008's own internal logic
(resume-vs-stop-at-max-step decision, `resume_client_recovery` call) is
completely unchanged.

**New Edge Function `release-lead-ownership`** — deliberately deployed
with `verify_jwt: true` (a real, intentional deviation from BC-052/053's
`verify_jwt: false` convention): those functions trust a body-supplied
`client_id` because their real authority comes from a scoped RPC keyed
on data the caller can't forge; this action genuinely needs to know
*who* is calling, since `dashboard_release_lead_ownership` is scoped by
`auth.uid()`. The function forwards the caller's real `Authorization`
header into its Supabase client so the RPC runs under the caller's own
session, then calls INT-008's new webhook with the RPC's own
`client_id` (never a client-supplied one).

**Dashboard** — new `/paused-leads` page (`PausedLeads` in
`Appointments.tsx`), lists via `dashboard_list_paused_recovery_leads`,
"Release & resume" button calls `release-lead-ownership`.

## Live verification

- `dashboard_release_lead_ownership`/`dashboard_list_paused_recovery_leads`:
  tested directly via a simulated `auth.uid()` session (real
  `dashboard_users` row, Client A) against a disposable paused+owned
  fixture — flag correctly cleared; fail-closed correctly confirmed
  against an unmapped user.
- INT-008's new webhook: called directly, twice, against the same
  fixture (now flag-cleared) — first call correctly resumed
  (`status: 'paused' → 'active'`, real `resume_client_recovery` RPC
  call), second call on the same lead correctly no-op'd
  (`NOT_PAUSED`, since it was already active).
- `release-lead-ownership` Edge Function: gateway correctly rejects a
  missing `Authorization` header (401); a structurally-valid-but-
  unauthenticated (anon-role) token correctly reaches the RPC and gets
  rejected as `Not authenticated` — proves the auth-forwarding wiring is
  real, not bypassed. **Not tested:** the full real-user happy path
  through this specific Edge Function (as opposed to the RPC and the
  webhook, both proven standalone) — no real dashboard user
  session/credentials exist to mint a live JWT with (Credential Gate,
  not invented). Low risk given both pieces it glues together are
  independently proven correct.

All disposable DB fixtures deleted after verification.

See [[../decisions/int-008-ownership-release-caller]] (closed).
