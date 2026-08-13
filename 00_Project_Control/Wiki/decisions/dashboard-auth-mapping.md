# DECIDED: Client-Schema-to-Auth-User Mapping Mechanism

**Status:** DECIDED + BUILT (BC-051, 2026-08-14) — Option 1
(`control.dashboard_users` mapping table) chosen and shipped, live-verified.
Full mechanism: [[../infra/dashboard-auth-mapping]].

## The question

No table or mechanism maps a Supabase Auth user to a
`control.clients` row / `client_schema_name` in a production-ready way.
Confirmed empirically (BC-015): no such table or mechanism existed
anywhere in the system when checked directly. **Which real,
production-grade mechanism should map a dashboard-logged-in Auth user
to the specific client schema they're allowed to see?**

## Options considered

Three real options were identified (BC-015), none chosen:

1. **A `control.dashboard_users` mapping table** — an explicit table
   pairing `auth.users.id` to `client_schema_name`.
2. **A custom access token hook** injecting `client_schema_name` as a
   JWT claim at login time.
3. **Continuing to use Supabase Auth's built-in `app_metadata` field**
   per-user (the current stopgap) — simplest to keep, but means every
   client user account must be created via the Admin API with the right
   metadata set explicitly; it does not support self-serve signup.

## Current state while open

**Option 3 (`app_metadata`) is the current, explicitly-temporary
mechanism** — used for every dashboard RPC's caller-identity check since
BC-015 (`dashboard_get_my_client_schema()` reads `auth.jwt()`'s
`app_metadata.client_schema_name`). This was stated at the time as
**explicitly NOT a production design decision** — flagged for the
Commander to choose between the 3 options above whenever the real
multi-client, self-serve dashboard system is built. No later log entry
records this being revisited or decided.

## Source

- `Phase 5 — 5B Order Lookup Dashboard (BC-015 — BUILT + DEPLOYED)` (log.md, 2026-08-05)
- `Blockers Right Now — main list...` (log.md, 2026-08-07) — repeated flag, still listed unresolved
- `Blockers Right Now — Self-resolved document-level item (BC-015 — dashboard data-access mechanism)...` (log.md, 2026-08-05) — note: this entry resolves a DIFFERENT, related question (the RPC data-access mechanism itself), not this auth-mapping question — the two are explicitly distinguished in the log and should not be conflated.
