# PostgREST Schema Exposure Limits

**Status:** current as of 2026-08-07 (BC-029), fix pattern established BC-026

## What's true now

**Client schemas are NOT exposed to PostgREST at all.** Only
`public`, `graphql_public`, and `control` are exposed schemas in this
Supabase project. Any direct PostgREST call against a dynamically-named
client schema (e.g. `client_test_002_acme_commerce_test`) fails with
`PGRST106 - Invalid schema: ... Only the following schemas are exposed:
public, graphql_public, control`. This invalidates the
`Content-Profile`/`Accept-Profile` direct-schema-access pattern this
project used throughout early sessions — it never actually worked
against a real client schema, it just was never execution-tested against
one until BC-026.

**The fix pattern (current, standard for all new client-schema access):**
`public`-schema SECURITY DEFINER RPC wrapper functions, each one safely
scoped to a single client's schema via dynamic SQL:
- `SET search_path TO ''` (prevents search-path injection).
- `format()` with `%I` for identifiers (schema/table names) and `%L` for
  literals — never raw string concatenation.
- `anon` role's EXECUTE explicitly revoked (Supabase grants EXECUTE to
  `anon` on new `public` functions by default, independent of any
  `REVOKE ... FROM PUBLIC` — always verify via
  `information_schema.routine_privileges` after creating a new one).

**Even the shared `control` schema needed an explicit `USAGE` grant.**
Supabase auto-grants schema `USAGE` for `public` but NOT for custom
schemas like `control` — a completely separate gap from the
per-client-schema exposure issue above. Symptom:
`permission denied for schema control` (Postgres `42501`) despite
correct table-level grants existing. Fix:
`GRANT USAGE ON SCHEMA control TO anon, authenticated, service_role`.
This is a database-permission change and was correctly routed through
human approval (blocked by the harness's own auto-mode classifier) per
this project's escalation discipline — expect any future schema-level
grant to need the same human sign-off.

**Same class, table-level this time (BC-049):** a new `control` table
(`client_kb_source`, created BC-047) had never had `SELECT` granted to
`service_role` directly — invisible until SCH-004 tried to query it via
direct REST (`GET /rest/v1/client_kb_source?...`) for the first time;
every prior access went through the `get_client_kb_source` RPC, which
runs as `SECURITY DEFINER` and doesn't need a direct table grant. Same
symptom class (`permission denied for table client_kb_source`, `42501`),
same fix shape: `GRANT SELECT ON control.client_kb_source TO
service_role;`. **Generalized takeaway:** schema-level `USAGE` alone does
not imply table-level `SELECT`/etc. on every table inside it — a new
table under an already-granted schema still needs its own grant the
first time anything queries it directly (not through a `SECURITY
DEFINER` RPC).

**Overload ambiguity (`PGRST203`):** adding a new arity overload of an
existing function (e.g. a 10-arg version of `insert_client_escalation`
alongside the original 9-arg version) makes PostgREST unable to choose
between them for calls that would have matched the OLD arity uniquely —
`PGRST203 — Could not choose the best candidate function`. This is not
theoretical: it silently broke a production caller (`WF-017 NotifyHuman`,
a 9-arg caller) for an entire release cycle, undetected because the only
test coverage that existed always passed the 10th argument explicitly.
Fix: drop the now-redundant lower-arity overload rather than keeping
both (matches the same fix already applied once before for
`upsert_client_connection`'s identical ambiguity class, migration 022).

## Why (if a non-obvious decision)

The RPC-wrapper pattern (rather than trying to get client schemas
exposed to PostgREST directly) was chosen because dynamic per-client
schema exposure isn't a supported PostgREST capability at all in this
environment — this is the same mechanism this project's credential
platform RPC layer (`store_credential_secret`, `get_client_connection`,
etc.) already used successfully, so it's a mechanical extension of
established pattern, not a new architectural choice.

## Gotchas

- **3 pre-existing workflows use the old, broken direct-schema-access
  pattern and were never execution-tested against a real client schema:
  UTIL-003 Error Logger, UTIL-005 Stop Checker, and ADP-002 Convocore
  Adapter.** UTIL-003/005 were fixed in BC-028; check ADP-002's specific
  node before assuming any older workflow's direct-schema access
  actually works — "it validated cleanly" does not mean it was ever
  really executed against a real schema.
- `SET search_path TO ''` inside a wrapper function breaks BARE enum-type
  casts inside dynamic SQL strings (e.g. `$4::escalation_priority_enum`
  fails with `type "escalation_priority_enum" does not exist`) — every
  enum cast inside such a function must be schema-qualified explicitly
  (`$4::public.escalation_priority_enum`).
- Before adding a new overload of an existing RPC, check whether the
  new arity actually needs to coexist with the old one, or whether the
  old one should be dropped — coexisting overloads are a real, proven
  way to silently break every existing caller of the narrower arity.
- Any newly-created `public` RPC needs an explicit
  `information_schema.routine_privileges` check after creation — Supabase's
  default-privilege behavior grants `anon` EXECUTE on new `public`
  functions independent of any `REVOKE ... FROM PUBLIC` already applied
  elsewhere.

## Source

- `Phase 6 — Core Agent Build (BC-026)` (log.md, 2026-08-06)
- `Phase 6 — Real Infrastructure Bug Fixes (BC-028)` (log.md, 2026-08-07)
- `Prior Phase — Phase 7 (Growth Agent) BC-029 COMPLETE` (log.md, 2026-08-07)
- `Phase 5 — 5B Order Lookup Dashboard (BC-015 — BUILT + DEPLOYED)` (log.md, 2026-08-05)
