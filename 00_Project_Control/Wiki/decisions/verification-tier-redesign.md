# DECIDED: CancelAppointment / UpdateCustomer Third Verification Tier

**Status:** DECIDED + BUILT (BC-053, 2026-08-14) — built, opt-in per client
(`control.clients.verification_tier_enabled`, default off — human-decided
2026-08-14, does not replace always-handoff for existing clients). Full
mechanism: [[../infra/verification-approval-queue]].

## The question

`WF-013` (CancelAppointment) and `WF-016` (UpdateCustomer) currently
operate on a strict BINARY model per the Customer Verification Rule:
either auto-execute (if a real verification mechanism existed — none
currently does) or ALWAYS hand off to a human (the current real
behavior, since no verification mechanism exists anywhere in the system).

The Commander and human have discussed a **THIRD tier**: a config-driven
"queue for one-click human dashboard approval, then auto-execute for
real" pattern — the actual cancellation/update would happen only AFTER
a human approves it via a dashboard action, with any client-facing
confirmation sent from the CLIENT's own connected email (not Zenny's).

**Should this third tier be built, and if so, exactly how should the
approval queue and auto-execute-after-approval mechanism work?**

## Options considered (if any)

Only the one three-tier concept above has been described in the log — no
concrete schema, RPC, or UI design has been drafted or evaluated. This
also connects to a second, related open item: Phase 5C's Appointments
dashboard is currently READ-ONLY (a monitoring view only); building this
verification tier would require making it write-capable, which is
itself a separate scope expansion not yet started.

## Current state while open

WF-013 and WF-016 remain strictly binary as described above — every
real cancellation/update request currently always routes to human
handoff (WF-017), with no queued-approval path anywhere in the system.
No build action has been taken toward this redesign; it is logged
purely so the idea isn't lost, per explicit instruction (BC-029 Step 6).

## Source

- `Blockers Right Now — main list...` (log.md, 2026-08-07) — "FUTURE WORK (flagged per BC-029 Step 4, not built this card)"
- `Prior Phase — Phase 7 (Growth Agent) BC-029 COMPLETE` (log.md, 2026-08-07) — Step 6, logged as future work, no build action taken
