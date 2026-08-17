# SECURITY DEFINER Views Silently Bypassing RLS

**Status:** current as of 2026-08-07 (BC-028)

## What's true now

**A `public`/convenience view over a table with RLS enabled can silently
bypass that RLS entirely if it doesn't have `security_invoker` set.**
Confirmed real, live instance: `control.client_connections_display` (a
plain `SELECT` passthrough over `control.client_connections`, no
cross-schema logic) had never had `security_invoker` explicitly set — a
known Supabase Dashboard/legacy-view default quirk, not a deliberate
choice by anyone. This meant the view ran with the view OWNER's
(`postgres`) privileges, bypassing `client_connections`' real RLS
(enabled, zero policies, default-deny) entirely. Combined with
`anon`/`authenticated` holding ordinary table-level grants on the view
itself, this meant **any authenticated request could read every
client's connection metadata across the entire platform** through this
one view — a genuine cross-tenant data exposure, not just a Security
Advisor lint nag.

**Fix:** `ALTER VIEW <view> SET (security_invoker = true);` — makes the
view run with the QUERYING user's privileges instead of the owner's, so
the underlying table's RLS actually applies. Supabase's own Security
Advisor flags this as the `security_definer_view` ERROR when present;
re-running it after the fix is the way to confirm it's actually gone
(not just "the ALTER ran without error").

## Why (if a non-obvious decision)

This is a platform DEFAULT, not a decision anyone made — Supabase
Dashboard-created (and some legacy-path) views don't set
`security_invoker` unless it's explicitly requested, so a view can look
completely correct (a simple `SELECT`, no obvious logic bug) and still
be a real security hole purely because of this unset property.

## Gotchas

- **Any convenience view created over a table that has RLS enabled
  should be checked for `security_invoker` explicitly** —
  `reloptions` on the view is the way to confirm whether it was ever
  set, don't assume from the view's simplicity that it's safe.
- A related, structurally similar finding was flagged (BC-028) as "the
  same class" for `control.connection_snapshots` — but no dedicated fix
  entry for that specific table's RLS posture was found in the log.
  **This is a genuine gap worth verifying directly rather than assuming
  it was already fixed** — see the Ambiguous Items note in the session
  report that created this page.
- This bug class is easy to miss because the view's own SQL definition
  looks completely correct — the vulnerability is entirely in an unset
  property, not in visible logic. Don't rely on reading the view
  definition alone to clear it; check `reloptions` / run Security
  Advisor.

## Source

- `Phase 6 — Real Infrastructure Bug Fixes (BC-028)` (log.md, 2026-08-07)
- `Phase 5 — Partial-Scope-Grant Handling + Credential Preservation (BC-024)` (log.md, 2026-08-06) — the `connection_snapshots` table this finding is compared against
