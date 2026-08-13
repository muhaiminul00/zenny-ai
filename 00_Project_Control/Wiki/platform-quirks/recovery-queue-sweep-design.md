# Recovery Queue Sweep — Design Facts (INT-006/SCH-001, BC-037)

## `control.clients.status` is not used as a gate anywhere in the built system

`control.clients.status` (enum: `active`, `paused`, `onboarding`, `offboarded`)
exists but is **not checked** by UTIL-001 (Schema Resolver) or any other real
workflow in the registry. Every roster client is currently `onboarding` — a
real value, but used as a permanent test-fixture marker (all 5 clients are
`"DO NOT USE"`-named test rows from earlier Build Cards), not a genuine
in-progress onboarding state.

**Consequence for BC-037:** INT-006's client sweep (`Get Active Clients`)
reads `control.clients` with no status filter. Gating on `status='active'`
would have silently excluded 100% of the real test roster and introduced a
filter no other real workflow uses — self-resolved per Document Resolution
Authority (mechanical decision, one obviously correct answer given UTIL-001's
own precedent).

**Revised BC-038 (verification requested by Commander before acknowledging
the gate):** re-checked whether any document defines real production
behavior for `client_status_enum`, not just current n8n workflow behavior.
Found one real precedent: `Template_Migration_Process.md` filters
`status NOT IN ('offboarded')` for template syncs, reasoning that an
offboarded client's schema may not even exist and acting on it serves no
purpose. That reasoning applies directly to recovery sends too — dispatching
automated messages for a client who has left the platform is a real risk,
not just a theoretical inconsistency. **Action taken (BC-038):** `Get Active
Clients` now excludes `status='offboarded'` clients.

**`paused` intentionally left unfiltered** — no document anywhere defines
what `paused` means operationally (billing pause? agent pause? both?), so
there's no mechanical basis to exclude it. This is a genuine open product
decision, not resolved here — see `Wiki/decisions/` if/when it needs one.

## `human_ownership_flag` — the one real gate WF-018 itself doesn't cover

Per `Recovery_Engine_Flow.md` §"1.H Global Active Issue Lock": a human-owned
lead must never receive an automated recovery send ("Human owns → Pause — do
not create/send"). WF-018 (SendRecoveryMessage, [[BC-036]]/WF-018 in
Workflow_Registry.md) documents its own gates as UTIL-005 suppression +
`status='active'` + step-match only — it never checks `human_ownership_flag`.

This is closed at the sweep level, not inside WF-018: the new
`public.get_due_recovery_queue(p_schema, p_limit)` RPC filters
`status='active' AND human_ownership_flag=false AND next_follow_up<=now()`.
WF-018 itself was not modified and still has no independent
`human_ownership_flag` check — if anything other than INT-006's sweep ever
calls WF-018 directly for a due row (it currently doesn't; WF-018 is only
reachable via direct Tool call or this sweep), that caller would need its own
`human_ownership_flag` check, since WF-018 doesn't provide one.

**Live-confirmed (BC-037):** a synthetic `human_ownership_flag=true` row was
excluded both by a direct `get_due_recovery_queue` call and by the real
5-minute sweep's dispatched rows, then deleted after verification.

See [[Workflow_Registry INT-006 + SCH-001 entry]] for the full live-test
detail and 06_Infrastructure/n8n/Workflow_Registry.md for WF-018's own entry.

## Per-client active hours replace the hardcoded UTC 8am–8pm window (BC-041)

WF-018's `Time Window Check` previously hardcoded `hourUtc >= 8 && hourUtc < 20`.
BC-041 (2026-08-11) replaced that with two new `control.clients` columns —
`active_hours_start_utc`/`active_hours_end_utc` (smallint, default `8`/`20`) —
fetched by a new `Get Client Active Hours` node and read defensively (falls
back to `8`/`20` on any fetch failure, so the failure mode is identical to
pre-BC-041 behavior). `start=0, end=24` means always-on. Verified via
`test_workflow` with pinned data (executions 4379/4384) — see
`Workflow_Registry.md`'s WF-018 entry for the exact scenarios.

**Still not solved:** true per-client *timezone*. This is UTC-hour
configurability only, not timezone-awareness — the "local" framing in
`Recovery_Engine_Flow.md` §3.1 remains an honest placeholder, just a
configurable one now instead of a fixed one. A real timezone column/system
is a separate, larger future problem.

## Reply-triggered stop, and why resume isn't reply-triggered (BC-050)

`Agent_Runtime_System_v1.md` §6.1 Recovery Reply Handling ("stop the
cadence the moment a customer replies") is INT-007, wired directly into
INT-010 (Categorize Email) — every inbound email calls it right after
customer/lead identity resolution, before categorization. It stops every
active/paused `recovery_queue` row for the resolved `customer_id` via a
new `stop_client_recovery_for_customer` RPC (joins `leads`→`recovery_queue`
by `customer_id`, since INT-010 only ever resolves `customer_id`, not
`lead_id`, and a customer can have more than one lead/recovery record).

**INT-008 (Resume Recovery) is easy to mis-scope as "the reply-handling
counterpart" — it isn't.** Per the spec's own Paused-State Resumption
section, a customer reply (trigger A) is handled entirely by INT-007's
stop-and-re-enter-as-new-session flow, not by "resuming" anything. INT-008
implements triggers B (a human closes their task without the customer
replying — needs `human_ownership_flag` to flip back to `false`) and C (a
live conversation ends without conversion). **Confirmed by grep: nothing in
the built system writes `human_ownership_flag=false` anywhere** — trigger B
has no real event source yet, and trigger C isn't built either. INT-008 was
still built and live-tested standalone (per explicit human decision,
BC-050) rather than deferred again, so the resume/stop-at-max-steps logic
is proven the moment a real ownership-release mechanism gets scoped.

**Gap closed (BC-054, 2026-08-14):** `control.archetype_recovery_defaults`
(one row per archetype, seeded from `Recovery_Engine_Flow.md` §3's exact
step counts — emergency 3, appointment 4, commerce_ecom 3,
commerce_restaurant 2, consultation 5, engagement 3, the same source
INT-008's own hardcoded map already reproduced) + a nullable
`control.clients.max_recovery_steps` per-client override (`NULL` = use
the archetype default; no roster client has this set, so no existing
behavior changed). Enforced in two places: `advance_client_recovery_step`
now flips `status` to `'stopped'` in the same atomic UPDATE the instant
a step reaches the effective max (matching
`Recovery_Engine_Flow.md` §6's StatusMap — "Max steps reached → Stopped"
— exactly, real cause not a synthetic one), and `get_due_recovery_queue`
defensively excludes any row whose `current_step` already reached the
max as a second gate. Live-verified against 3 disposable fixtures on
Client B (emergency, effective max 3): a step-2 row advanced to step 3
and correctly flipped to `stopped`; a pre-existing step-3 row was
correctly excluded from the sweep; a step-0 row advanced to step 1 and
correctly stayed `active` (regression — below-max advances unaffected).
All fixtures deleted after verification. See `PROJECT_STATE.md` (Active
Blocker removed).
