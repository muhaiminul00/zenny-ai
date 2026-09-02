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

**Superseded below:** the "any admin can create another admin" gap
noted here was closed by the Admin Provisioning Bootstrap card
(2026-09-02) — see that section.

## Admin Provisioning Bootstrap (2026-09-02) — closes the admin-minting gap, adds real client creation

Card2a's `/admin/provision` could only map a login to a client that
**already existed** — creating the client itself, and minting an admin,
had no real gate beyond "any `role='admin'` account can do both."  This
card closes both gaps.

**Schema changes:**
- `dashboard_users_role_check` extended to a 3rd tier:
  `role IN ('client_user', 'admin', 'super_admin')`.
- `dashboard_users.must_change_password boolean NOT NULL DEFAULT false`
  — set `true` whenever a brand-new Auth user is created with an
  admin-set temp password; cleared by the user themselves after a real
  password change (see the forced-reset flow below).
- `client_status_enum` gained `'unprovisioned'` — used only for
  Add-Client shell rows (a client that exists as a login but has no
  archetype/schema yet). `'onboarding'` keeps its existing meaning
  (schema exists, still being set up) — **note:** all 6 pre-existing
  clients still sit at `'onboarding'` and nothing transitions status
  forward automatically; this ambiguity is real and tracked in
  `TODOS.md` ("`control.clients.status` lifecycle is broken"), not
  fixed by this card.
- `control.clients.archetype` and `.client_schema_name` both loosened
  to nullable (live-verified both were `NOT NULL` before this — a real
  blocker for shell rows, not assumed). **Live-audited** every one of
  the 13 functions that reads either column before loosening them —
  all already NULL-safe (`IF ... IS NULL THEN RAISE EXCEPTION` guards
  or `coalesce()`); no crash risk found. One real, disclosed UX
  corollary from that audit: a freshly created "unprovisioned" client
  can log in immediately, but every client-facing page will hit a
  clean (not crashing) RPC exception until an admin finishes real
  provisioning — tracked in `TODOS.md`, not fixed here (out of this
  card's approved scope).
- `created_by uuid REFERENCES auth.users(id)` added to both
  `control.clients` and `control.dashboard_users` — audit trail for who
  created each privileged row.

**`dashboard_admin_list_clients()` extended** (DROP+CREATE required —
Postgres cannot `CREATE OR REPLACE` a changed `RETURNS TABLE` column
list; this is the exact grant-loss trap this project has hit 3 times
before, BC-052/063/064) to return `status`, `created_at`, `email` (the
first client_user login mapped to that client, via a `LEFT JOIN
LATERAL`, ordered by earliest mapping — `NULL` for a shell client with
no login yet). **Grants re-verified live after the DROP+CREATE**
(`has_function_privilege`): `anon`/`authenticated`/`service_role` all
still have `EXECUTE` — Postgres grants `EXECUTE` to `PUBLIC` by default
on newly created `public`-schema functions, so no explicit re-grant was
even needed this time, but it was verified, not assumed. Also gated on
`role IN ('admin', 'super_admin')` now, not just `'admin'` — the
original check would have wrongly rejected a `super_admin` trying to
view the client list. **Regression-checked** (per the Iron Rule, this
RPC's return shape already caused a real live bug once in Card2a): ran
the underlying query directly against all 6 real client rows before
touching the Dashboard — every existing client still resolves
`client_id`/`business_name`/`archetype` correctly, so `AdminProvision.tsx`'s
picker keeps working unchanged.

**`admin-provision-dashboard-user` Edge Function extended** with a new
`action` field (`map_existing` | `create_client` | `create_admin`,
default `map_existing` for backward compatibility):
- **`map_existing`** (Card2a's original path) — now restricted to
  `role: 'client_user'` only. Assigning `admin`/`super_admin` through
  this path is exactly the risk this card closes; it's rejected with a
  message pointing at `create_admin` instead. Caller must be
  `admin` or `super_admin`.
- **`create_client`** — new. Creates a real client (write order,
  cheapest-rollback-first: `control.clients` row →Auth user → 
  `dashboard_provision_user` mapping, each step's failure rolling back
  everything written so far) with `status='unprovisioned'`,
  `archetype`/`client_schema_name` both `NULL` — the client's own
  onboarding, not this card, decides those later (the design doc's own
  key insight: you can't pick an archetype before the client tells you
  their business). Duplicate email checked *before* any write. Caller
  must be `admin` or `super_admin`.
- **`create_admin`** — new. Mints an `admin` or `super_admin` mapped to
  a nominal home client (still required — `dashboard_users.client_id`
  is `NOT NULL`). **Caller must already be `super_admin`** — the actual
  gate closure. Identity is derived from the caller's own JWT only,
  never a body-supplied role/tier flag (same doctrine as Card2a's D4).
- Every action sets `created_by` on the `dashboard_users` row it
  touches, and `must_change_password = true` whenever a *brand-new*
  Auth user was created this call (never for a `remap` of an existing
  account — they already have a working password).

**Dashboard UI:** `AdminProvision.tsx` rewritten with tabs — Clients
(list view: business/status/archetype/login email/created), Add Client,
Add Login (existing client — the relocated Card2a form, `client_user`
only), and Add Admin (rendered only for `super_admin`, both hidden
client-side and blocked server-side). New `ChangePassword.tsx` +
`AuthContext.tsx` now holds `role`/`must_change_password` from a single
`dashboard_get_my_flags()` call — `App.tsx`'s route guard renders
`ChangePassword` in place of every other route whenever the flag is
set, checked on every render (not a one-time login-page nag). Two new
RPCs support this: `dashboard_get_my_flags()` (read) and
`dashboard_clear_must_change_password()` (self-service clear, called
after a real `supabase.auth.updateUser()` password change).

**Verification status:** SQL/schema changes and the `dashboard_admin_list_clients`
regression check are live-verified. `tsc -b` and `oxlint` clean on
every changed Dashboard file (1 pre-existing `react(only-export-components)`
warning on `AuthContext.tsx`, not introduced by this card). The Edge
Function's platform-level auth checks are live-verified (401 with no
Authorization header, 401 on a malformed JWT). The admin/super_admin-gated
paths (`ADMIN_REQUIRED`, `SUPER_ADMIN_REQUIRED`, forged-role-ignored,
and the `create_client`/`create_admin` happy paths) — see this card's
final wrap-up entry in `Wiki/log.md` for how those were actually
verified before shipping.

See [[../decisions/dashboard-auth-mapping]] (closed),
[[../credentials/test-fixture-clients]] (the two existing accounts'
real provider connections, documented the same pass), and
`docs/designs/admin-provisioning-redesign-bootstrap.md` for the full
spec and review history.
