# DECIDED: Calendar Provider Category-Sharing

**Status:** DECIDED (2026-08-14, human decision, advisor-mode conversation) —
"one calendar provider at a time" is the intended design. No schema
change. `UNIQUE(client_id, category)` stays as-is; Google
Calendar/Calendly/Cal.com continue sharing the single `category='calendar'`
slot, and connecting one continues to displace whichever provider
previously held it for that client. This closes the question raised in
BC-021/023/024 — no future Build Card needed for this item.

## The question

`control.client_connections` enforces `UNIQUE(client_id, category)`.
Google Calendar, Calendly, and Cal.com all currently map to the SAME
`category = 'calendar'` slot — meaning a client can only hold ONE of
these three calendar providers connected at a time. Connecting any one
of them replaces whichever provider previously held that slot for that
client (confirmed via real audit-log evidence: the same `connection_id`
flipped `provider` from `calendly` to `google` at the exact moment of a
reconnect, BC-023).

**Should Google's combined Calendar+Gmail OAuth grant produce two
separate category rows** (so a client could hold both a Calendar
connection AND a competing Calendly/Cal.com connection at the same
time), **or is "one calendar provider at a time" the intended design?**

## Options considered (if any)

No formal options were drafted in the log — this has only ever been
stated as an open question, not weighed against alternatives. The
practical shape of a fix would presumably involve either:
- Splitting `category` into finer-grained values (e.g. `calendar_google`
  vs `calendar_third_party`), or
- Relaxing the `UNIQUE(client_id, category)` constraint to allow
  multiple simultaneous calendar connections with an explicit
  "primary"/"active" flag.

Neither has been evaluated or decided.

## Current state while open

Whichever provider was connected most recently occupies the shared slot;
reconnecting a displaced provider simply displaces the current occupant
back. This is treated as expected behavior, not a bug, in every session
that has encountered it — see [[../credentials/google-oauth]] and
[[../credentials/calendly]] for the concrete current behavior.

## Source

- `Phase 5 — Real OAuth Connection Persistence Bug (BC-021)` (log.md, 2026-08-06)
- `Phase 5 — Token-Expiry Diagnosis + Calendar Scope Narrowing + Legal Page Revision (BC-023)` (log.md, 2026-08-06)
- `Phase 5 — Partial-Scope-Grant Handling + Credential Preservation (BC-024)` (log.md, 2026-08-06)
- `Session Log Archive — Session 22 — BC-021 COMPLETE...` (log.md, 2026-08-06)
