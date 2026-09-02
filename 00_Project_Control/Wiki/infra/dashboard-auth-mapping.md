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

## Admin provisioning UI (BC-076-Card2a, 2026-09-02)

The gap above is closed: `role` gained a third state's worth of meaning
(`dashboard_users_role_check_constraint` — CHECK constraint,
`role IN ('client_user', 'admin')`), and two new RPCs support it:

- **`dashboard_get_my_role()`** — mirrors `dashboard_get_my_client()`'s
  exact shape (`SECURITY DEFINER`, `auth.uid()`-scoped, fails closed on
  no mapping). `authenticated` has EXECUTE — safe because the function's
  own body is the real gate, same established pattern as its siblings.
- **`dashboard_admin_list_clients()`** — same pattern, additionally
  requires `role = 'admin'` internally before returning anything. Real
  live bug caught only by the browser click-through, not by `tsc`:
  `archetype` is `archetype_enum` in the DB, not `text` — the function's
  first version declared `RETURNS TABLE(archetype text)` and selected
  the raw enum column, producing `structure of query does not match
  function result type` at call time. Fixed with an explicit
  `c.archetype::text` cast.

**New Edge Function, `admin-provision-dashboard-user`** — the first in
this project to have its source version-controlled
(`supabase/functions/admin-provision-dashboard-user/index.ts`; every
other Edge Function here still follows the no-repo-source convention,
not retrofitted). Derives caller identity from the bearer JWT only
(never a body-supplied role flag), checks `role='admin'` via
`dashboard_get_my_role()`, then uses the Auth Admin API to actually
create the Supabase Auth user (`dashboard_provision_user` alone only
maps an *existing* one — it never created a login, a real gap caught by
Codex's adversarial review before this shipped, not by the interactive
review). Duplicate emails require an explicit `remap:true` +
`confirm_auth_user_id` echo (a bare `remap:true` isn't treated as real
confirmation — also a Codex catch). Rolls back (deletes) a
just-created Auth user if the `dashboard_provision_user` mapping call
fails, so a provisioning failure never leaves an orphaned working login
with no mapping.

**New page:** `/admin/provision` (`AdminProvision.tsx`) — email + a real
client picker (`dashboard_admin_list_clients`, not a manually-typed ID)
+ role select.

**Real UX bug found and fixed the same session:** an admin account was
showing the exact same Orders/Appointments/Integrations UI as any
regular client, because every client-scoped page resolves "which client
am I" via `dashboard_get_my_client()` — the admin's nominal `client_id`
(required by the schema, just a technical home) made it look like the
admin account *was* that client. Fixed architecturally, not
cosmetically: `dashboard_users` has one row per `auth_user_id` (role is
per-account, never per-client-view), so `role='admin'` now gets *only*
the admin nav/routes and `role='client_user'` gets the reverse — each
redirects away from the other's paths. Confirmed live both directions:
the admin account only ever sees `/admin/provision`; a non-admin
navigating directly to `/admin/provision` gets redirected to `/orders`.

**Bootstrap note, still true:** this Edge Function cannot create the
very first admin — that one mapping is still a manual step
(`dashboard_provision_user` called directly, same as any dashboard user
before self-serve existed). Every admin after that first one goes
through the real UI.

**Accepted, not fixed:** any admin can create another admin — no
separate `super_admin` tier exists. Reviewed (Codex flagged it,
human explicitly accepted at current single-operator scale) — tracked
in `TODOS.md` under Security, revisit if a second admin with a
different trust level is ever actually needed.

See [[../decisions/dashboard-auth-mapping]] (closed),
[[../credentials/test-fixture-clients]] (the two existing accounts'
real provider connections, documented the same pass), and
`docs/designs/zenny-launch-blueprint.md`'s Card 2a section — n/a, no
n8n workflow touched by this card.
