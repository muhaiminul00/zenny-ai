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
