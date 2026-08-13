# Incident: `anon`-Granted Internal RPCs (found + fixed BC-052, 2026-08-14)

## What was wrong

~40 `public` schema SECURITY DEFINER RPCs — including `read_credential_secret`,
`store_credential_secret`, `update_connection_status`,
`update_connection_tokens`, `create_client_schema_from_template`, and
every `insert_client_*`/`upsert_client_*` function across every module —
were granted `EXECUTE` to `anon`. None of them check caller identity
internally (no `auth.uid()` check, no ownership filter — they take a raw
`p_secret_id`/`p_connection_id`/`p_client_id` and act on it directly, by
design, since their real callers were always meant to be n8n or an Edge
Function using service_role).

`anon`'s key is public by design (it ships in the dashboard's frontend
JS bundle). With no internal check, anyone holding it — i.e. anyone who
loaded the dashboard once — could call e.g.
`POST .../rest/v1/rpc/read_credential_secret {"p_secret_id": "<any uuid>"}`
and get back **any client's decrypted Vault secret**, or overwrite any
connection's status/tokens, or forge `insert_client_*` rows in any client
schema, or even create new client schemas. Live, exploitable, not
theoretical — confirmed via a real `set local role anon` test.

## Why it existed

Best guess, not confirmed against any specific commit: these RPCs were
likely granted broadly at creation time (a common default-permissive
habit) and never explicitly narrowed once their real caller (n8n via a
`supabaseApi` credential, which uses the project's **service_role** key,
not anon) was established. Dashboard-facing RPCs (`dashboard_get_my_*`,
etc.) never had this problem — they were correctly scoped to
`authenticated` only from the start; the gap was specific to the
internal/n8n-facing RPC surface.

## The fix

A single migration (`revoke_anon_execute_on_internal_rpcs`) walked
`pg_proc` + `aclexplode` (not `information_schema`, to correctly handle
overloaded functions like `insert_client_waitlist_entry`) and revoked
`EXECUTE` from `anon` on every function that had it. `authenticated` and
`service_role` grants were untouched.

**Live-verified:** 0 `anon` EXECUTE grants remain on `public` schema
functions (confirmed via `information_schema.routine_privileges`); a
`set local role anon` call to `read_credential_secret` now correctly
gets `permission denied for function`; the same call as `postgres`
(service_role-equivalent) still succeeds. n8n's real `supabaseApi`
credential type requires the service_role key by design — this fix has
zero legitimate breakage surface.

## Residual, smaller-severity gap — not fixed this card

The Edge Functions that DO front-facing connect/lifecycle work
(`oauth-callback`, `shopify-connect`, `woocommerce-connect`,
`connection-lifecycle` — BC-052) all trust `client_id` from the request
body rather than verifying the caller's own JWT against it
(`verify_jwt: false` at deploy, matching an existing project-wide
convention, not something BC-052 introduced). Today this means a
caller who knows another client's `client_id` UUID could, in principle,
invoke these functions on that client's behalf. Real blast radius is
low today (client_id UUIDs aren't guessable, and there's genuinely one
real dashboard user in the whole system as of this writing — see
[[../infra/dashboard-auth-mapping]]) but this is architecturally the
same class of issue as the `anon`-grant one above, just at the Edge
Function layer instead of the RPC layer. Flagged as an Active Blocker,
worth a small future Build Card (forward the caller's JWT, verify it
resolves to the same `client_id` via `dashboard_get_my_client()` before
proceeding) once self-serve dashboard signup makes `client_id`
enumeration a real concern.

## Source

- BC-052 session, 2026-08-14 — found during Mandatory MCP Verification
  before building Connection Lifecycle Actions, fixed same session
  before continuing (human confirmed: "yes, fix this & continue").
