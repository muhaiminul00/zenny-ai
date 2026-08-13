# DECIDED: INT-008 Ownership-Release Caller Mechanism

**Status:** DECIDED + BUILT (BC-056, 2026-08-14) — dedicated dashboard
action (Option 1), not piggybacked on BC-053's `/approvals` Reject
action. See [[../infra/int008-ownership-release]] for the full built
mechanism.

## The question

INT-008 (Resume Recovery, built BC-050) has no real caller — nothing in
the built system ever flips `human_ownership_flag` back to `false`. Two
mechanisms were considered for the dashboard action that should do this:

1. A dedicated "Release / Resume Recovery" action on an escalation or
   lead-detail view — explicit human action, net-new dashboard surface.
2. Piggyback on BC-053's `/approvals` **Reject** action for
   escalation-sourced pending-verification items — reuses existing UI,
   no new surface.

## Decision

**Option 1 — dedicated action.** Ownership release is a distinct human
decision from approving/rejecting one queued verification item.
Conflating them (Option 2) risks a human rejecting a single queued
change and unintentionally resuming an automated recovery cadence they
never meant to touch. A dedicated action keeps the two decisions
separate and the intent unambiguous.

## Source

- Commander build-plan turn, 2026-08-14 (this session) — recommended
  Option 1 with the above reasoning; human confirmed.
- Original gap: `Wiki/platform-quirks/recovery-queue-sweep-design.md`
  (`human_ownership_flag` — the one real gate WF-018 itself doesn't
  cover) and `PROJECT_STATE.md` Active Blockers (INT-008 has no caller).

## Status while open

N/A — decided same session it was raised. BC-056 not yet built as of
this decision; see PROJECT_STATE.md for build status.
