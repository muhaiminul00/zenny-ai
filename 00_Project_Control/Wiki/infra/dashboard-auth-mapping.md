# Dashboard Auth Mapping — `control.dashboard_users` (BC-051)

## What it replaced

Until BC-051, every dashboard RPC that needed to know "which client does
this logged-in user belong to" read `auth.jwt() -> 'app_metadata' ->>
'client_schema_name'` — a per-user JWT field set manually via the Admin
API at account-creation time. This was explicitly flagged as a temporary
stopgap at BC-015 (see `Wiki/decisions/dashboard-auth-mapping.md`,
now closed): it worked, but had no self-serve signup path and no
queryable mapping table.

## What it is now

`control.dashboard_users`:
```
auth_user_id uuid PK, REFERENCES auth.users(id) ON DELETE CASCADE
client_id    uuid NOT NULL REFERENCES control.clients(client_id)
role         text NOT NULL DEFAULT 'client_user'
created_at   timestamptz NOT NULL DEFAULT now()
```

FKs to `control.clients.client_id` (the real PK), not
`client_schema_name` (no unique constraint exists on that column —
confirmed via `pg_constraint` during BC-051's Mandatory MCP Verification
before designing the table). RLS enabled, `REVOKE ALL FROM anon,
authenticated` — this table is never read directly by a client role,
only through the two SECURITY DEFINER RPCs below.

**`dashboard_get_my_client_schema()`** and **`dashboard_get_my_client()`**
— same names/signatures as before, `CREATE OR REPLACE`'d in place (their
existing `authenticated`/`postgres`/`service_role` EXECUTE grants
survived the replace, verified via `information_schema.routine_privileges`
before and after). Both now join `dashboard_users → clients` on
`auth.uid()` instead of reading the JWT's `app_metadata`. Fail closed:
no mapping row (or an offboarded client) raises, same as before.

**`dashboard_provision_user(p_auth_user_id, p_client_id, p_role)`** — new.
`service_role`-only (`REVOKE ALL ... FROM PUBLIC, anon, authenticated`,
confirmed live: an `authenticated`-role call correctly gets `permission
denied for function`). Upserts a `dashboard_users` row
(`ON CONFLICT (auth_user_id) DO UPDATE`). This is the real replacement
for manually setting `app_metadata.client_schema_name` — call it (via
service_role, e.g. from whatever script/flow creates the Admin API user)
whenever a new dashboard user needs mapping to a client, or an existing
one's client/role needs to change.

## Backfill

The one pre-existing dashboard user (`test-dashboard-bc015@zenny.internal`,
BC-015) was backfilled from its `app_metadata` at migration time — live
regression-tested: `dashboard_get_my_client_schema()` under that user's
JWT returns the identical `client_test_002_acme_commerce_test` before and
after.

## Not yet built

No dashboard-side (React/Vite) code path calls `dashboard_provision_user`
yet — there is no UI for creating dashboard users at all currently (every
existing user, still just the one, was created directly via Admin API).
This RPC exists so the *next* time a user-creation flow is built (self-
serve signup or an admin-side "create dashboard user" action), it has a
real mechanism to call instead of reaching for `app_metadata` again.

See [[../decisions/dashboard-auth-mapping]] (closed) and
[[Workflow_Registry BC-051 entry]] — n/a, no n8n workflow touched by this
card.
