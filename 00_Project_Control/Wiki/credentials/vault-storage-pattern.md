# Vault Storage Pattern

**Status:** current as of 2026-08-07 (BC-032/BC-028)

## What's true now

All real secret material (OAuth client secrets, access/refresh tokens,
API keys, Consumer Secrets, webhook signing keys) is stored in Supabase
Vault (`vault.secrets`), never in plain columns. Every credential-bearing
table (`control.oauth_apps`, `control.client_connections`) holds only a
Vault **UUID reference** (`client_secret_id`, `access_token_secret_id`,
`refresh_token_secret_id`, `secondary_secret_id`), never the decrypted
value itself.

**Core RPCs (all SECURITY DEFINER, `public` schema):**
- `store_credential_secret(value, name, description) -> uuid` — writes a
  secret and returns its Vault UUID.
- `read_credential_secret(secret_id) -> text` — reads a secret back by
  UUID.

**The upsert-by-name pattern (the fix, current since migration 045):**
`store_credential_secret` now looks up any existing Vault secret with
the given name FIRST and calls `vault.update_secret` in place, instead
of unconditionally calling `vault.create_secret`. Verified live:
calling it twice with the same name returns the same secret UUID both
times, with the second call's value correctly overwriting the first —
no error.

**`secondary_secret_id` column (on `client_connections`):** holds a
second simultaneous credential part for providers that need two pieces
at once — e.g. WooCommerce's Consumer Secret (alongside Consumer Key in
the primary slot), or a second Shopify Client Credentials Grant field.

**`refresh_token_secret_id` vs `access_token_secret_id`:** the refresh
slot holds long-lived, stable material (an OAuth refresh token, or — for
Shopify's Client Credentials Grant — the stable Client ID); the access
slot holds short-lived material that gets overwritten on every refresh
(an OAuth access token, or a freshly-minted Client Credentials Grant
token). Any code reading a "stable" identifier must read the refresh
slot, not the access slot — see [[shopify]]'s gotchas for a real bug
this caused.

## Why (if a non-obvious decision)

Before the fix, `store_credential_secret` called `vault.create_secret`
with a STATIC name per client+category (e.g.
`client_{id}_calendar_access`). The first connect for any category
worked fine; any reconnect/retry (disconnect-then-reconnect, or simply
retrying after not seeing the UI update) tried to create a SECOND secret
with the identical name, which Vault's own `secrets_name_idx` UNIQUE
constraint rejected. Neither `oauth-callback` nor `woocommerce-connect`
checked this RPC's error before proceeding — both blindly continued to
`upsert_client_connection` with a null secret id (which also failed, a
real column is `NOT NULL`, also uncaught) while both functions still
logged a "connected" audit event (and `woocommerce-connect` returned a
real HTTP 200 to the browser) — meaning the UI reported success while
the real database row was left completely untouched. This was the root
cause of a real production incident (BC-021) where Google Calendar,
Gmail, WooCommerce, and Calendly connections all silently failed to
persist despite real, successful consent.

## Gotchas

- **Defense in depth beyond the upsert fix:** every RPC call in
  `oauth-callback` and `woocommerce-connect` (and `shopify-connect`) now
  actually checks the `error`/`data` result before proceeding, and logs
  a real, specific audit event on every failure branch — several early
  exit paths (missing_state, invalid_state, app_lookup_failed) used to
  log nothing at all, which is also why a real Calendly connection
  attempt once left no diagnosable trace.
- `read_credential_secret`/`store_credential_secret`/
  `insert_audit_log_event` return a bare scalar via PostgREST's
  `application/vnd.pgrst.object+json` content type — n8n's response-format
  autodetect does NOT recognize this as JSON. Set `responseFormat: "text"`
  explicitly on these HTTP nodes (NOT `json`, and do NOT `JSON.parse()`
  the result) — the plain unwrapped value lands directly in `.data`.
  This bit multiple workflows independently (SCH-006, UTIL-003, UTIL-005,
  UTIL-006, Tool Execution Fallback) before being recognized as a
  systemic pattern.
- A separate, unrelated quirk: with `responseFormat: json` forced on a
  bare JSON scalar (e.g. a boolean), n8n lands the value as the item's
  WHOLE `.json` directly (not nested under `.data`) — the opposite shape
  from the `text`-format scalar case above. Check which format is
  actually in play before assuming where the value lives.
- `control.connection_snapshots` (migration 048) is a testing-safety net
  that references existing Vault secret IDs only (never duplicates
  decrypted material) — it is informational/historical only, never read
  by any live code path, never auto-restored. A snapshot's
  `snapshotted_at` must be compared against the live row's current
  `updated_at` before treating it as "what's connected right now" — it
  is not a parallel source of truth.
- Orphaned/unreferenced Vault secrets (e.g. old placeholder rows from
  early sessions) are harmless but were left in place rather than force-
  deleted through the harness's permission classifier — safe to leave or
  clean up later, not a live risk.
- `control.client_connections_display` (a SECURITY DEFINER convenience
  view) was found bypassing RLS entirely — any authenticated request
  could read every client's connection metadata cross-tenant — because
  it had never had `security_invoker` explicitly set (a known Supabase
  Dashboard/legacy-view default quirk). Fixed via
  `ALTER VIEW ... SET (security_invoker = true)`. Worth checking on any
  new convenience view over a credential-bearing table.

## Source

- `Phase 5 — Real OAuth Connection Persistence Bug (BC-021)` (2026-08-06)
- `Phase 5 — Partial-Scope-Grant Handling + Credential Preservation (BC-024)` (2026-08-06)
- `Phase 6 — Real Infrastructure Bug Fixes (BC-028)` (2026-08-07)
- `Session Log — Session 32 — BC-032 (Infrastructure catch-up)...` (2026-08-07)
- `Database — Real Current State (BC-003 live audit, project zenny-vault ONLY)` (2026-08-05)
