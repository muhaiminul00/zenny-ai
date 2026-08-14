# Incident: `anon`/`authenticated`-Granted Internal RPCs (found + fixed BC-052/BC-064)

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

## BC-064 (2026-08-15) — the `authenticated` half of the same gap, found via the live Supabase Security Advisor

BC-052's fix above explicitly left `authenticated` grants untouched
("`authenticated` and `service_role` grants were untouched"). That was
a real, disclosed scope cut at the time, not an oversight — but it left
the exact same class of exposure open to any **signed-in** caller
instead of any anonymous one. The human flagged 117 live Supabase
Security Advisor warnings (screenshot of the "Security Advisor →
Warnings" tab); investigation found:

- `anon_security_definer_function_executable`: 43 (BC-052's fix had
  regressed — new functions built since, including this session's own
  `get_client_agent_prompt`, inherit Supabase's ambient default
  privilege grant to `anon`+`authenticated` on new `public`-schema
  functions unless explicitly revoked; BC-052's migration only ran
  once, against what existed at the time).
- `authenticated_security_definer_function_executable`: 73 — the real,
  never-fixed half of this gap. Includes `read_credential_secret` and
  `store_credential_secret` themselves — meaning any real signed-in
  dashboard user (not just anon) could read/rotate any client's Vault
  secrets directly via `/rest/v1/rpc/read_credential_secret`.
- 1 unrelated `auth_leaked_password_protection` (Supabase Auth setting,
  not a function grant — see below, not fixed this card).

**Fix:** cross-checked the dashboard's actual frontend code (`grep
supabase.rpc(...)` across `05_Platform_Builds/Dashboard/src`) plus the
one Edge Function that genuinely forwards a caller's real JWT
(`release-lead-ownership`, BC-056) to find the true "needs
`authenticated`" set — 10 functions total
(`dashboard_get_appointment`, `dashboard_get_my_client`,
`dashboard_get_order`, `dashboard_list_appointments`,
`dashboard_list_connections`, `dashboard_list_orders`,
`dashboard_list_paused_recovery_leads`,
`dashboard_list_pending_verifications`, `dashboard_review_order`,
`dashboard_release_lead_ownership`). Every other flagged function (62)
is called only by n8n or a `service_role`-key Edge Function and has no
legitimate `authenticated`/`anon` caller — revoked from both, granted
`service_role` only. The 10 dashboard-facing ones kept `authenticated`,
had `anon` revoked (should never be callable with no login at all).

**Live-verified, not assumed:** re-ran the Security Advisor after —
`anon` warnings: 43 → 0. `authenticated` warnings: 73 → 10 (exactly the
intentional set). Re-ran INT-010's real `test_workflow` against the
tightened grants — `List Categories`, `Get Classification Prompt
Template`, `Upsert Email` all still executed live (real Supabase
response headers/data, not simulated) — **empirically confirms n8n's
`supabaseApi` credential resolves to `service_role`**, exactly as
BC-052 already stated, now re-proven after a stricter revoke.

## Residual, smaller-severity gap — Edge Function client_id trust (BC-063, in progress)

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
Function layer instead of the RPC layer. **BC-063 (2026-08-15) is
building the fix** — see [[../log]] for the live investigation of each
function's actual call pattern before changing `verify_jwt`.

## Still open, not a grant issue — `auth_leaked_password_protection`

Supabase Auth setting ("Leaked Password Protection Disabled"), flagged
by the same Security Advisor pass. This is a project-level Auth
configuration toggle (Authentication → Policies in the Supabase
dashboard UI), not a database grant — no MCP tool available this
session can flip it. Left for the human to enable directly; low
urgency today (one real dashboard user, no self-serve signup yet).

## Source

- BC-052 session, 2026-08-14 — found during Mandatory MCP Verification
  before building Connection Lifecycle Actions, fixed same session
  before continuing (human confirmed: "yes, fix this & continue").
- BC-064 session, 2026-08-15 — human flagged the live Security Advisor
  warning count via screenshot; investigated and fixed the
  `authenticated` half of the same gap the same session.
