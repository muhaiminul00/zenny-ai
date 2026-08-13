# WooCommerce

**Status:** current as of 2026-08-06 (BC-024)

## What's true now

WooCommerce is NOT OAuth — it's a manual-key-entry provider, per
`Client_Integration_and_Credential_Platform_v1.md` Part 8.3's fallback
pattern. `control.oauth_apps`' `woocommerce` row exists only as a marker
(`app_status = 'not_applicable'`) — no OAuth registration needed or
possible, confirmed correct as-is, nothing to seed.

**Connection mechanism:** a plain 3-field form (Store URL / Consumer Key
/ Consumer Secret) submitted directly to the `woocommerce-connect` Edge
Function via `supabase.functions.invoke` — no redirect, no popup
treatment needed (never OAuth-based). The function live-validates the
submitted credentials against the real store BEFORE storing anything,
then stores Consumer Key + Consumer Secret via Vault (Consumer Secret in
`secondary_secret_id`, the two-part-credential slot — same pattern
`client_connections` uses for any provider needing two simultaneous
credential parts).

**Current real state:** the one real test client's WooCommerce connection
is `status: 'connected'` (confirmed BC-024) via a real store URL —
earlier sessions' test stores (`zenny-woocom.free.je`, a non-functional
free-tier WooCommerce test store) returned non-JSON responses to real API
calls, so most Tool-side testing against WooCommerce has exercised the
resilient-fallback path rather than a full live success case, not a
connection-layer problem.

## Why (if a non-obvious decision)

Shopify's Custom App static-token model being killed by Shopify
(Jan 2026) does NOT apply to WooCommerce — WooCommerce's manual-key
pattern was always the intended design (Part 8.3), never a stopgap
waiting for an OAuth alternative, and remains unchanged. No second path
was ever needed here the way Shopify eventually needed one.

## Revoke (BC-052)

WooCommerce has **no app-initiated revoke API** — REST API keys are
only actually removed in wp-admin (WooCommerce → Settings → Advanced →
REST API). The dashboard's Disconnect button discloses this honestly
(`provider_revoked: false` + reason), live-verified against a synthetic
connection. See [[../infra/connection-lifecycle-actions]].

## Gotchas

- The Edge Function had no CORS headers at all in an early version
  (`Access-Control-Allow-Origin` missing) — it had only ever been
  exercised server-to-server, never from an actual browser. Any future
  client-facing connect function should be tested from a real browser
  session, not just curl, before being considered done.
- `supabase-js`'s `FunctionsHttpError` does NOT auto-parse the response
  body into `.message` — read the real error message from
  `error.context` (the raw `Response`) instead, or the UI will only ever
  show a generic "Edge Function returned a non-2xx status code."
- A validation failure against a real (but unreachable/fake) store domain
  produces a specific, useful error (e.g. a DNS resolution failure
  message) — this is the expected disclosed-limitation shape for testing
  without a genuine production store, not a bug to chase.

## Source

- `Phase 5 — Gmail/WooCommerce Connections, Inventory Sync Logged, Supabase Tier (BC-019)` (2026-08-05)
- `Phase 5 — Real OAuth Connection Persistence Bug (BC-021)` (2026-08-06)
- `Phase 5 — Partial-Scope-Grant Handling + Credential Preservation (BC-024)` (2026-08-06)
- `Session Log Archive — Session 3 — BC-003: Credential Platform Gaps (partial)` (2026-08-05)
- `Prior Phase — Conversion Engine (Phase 8a) BC-031 COMPLETE` (2026-08-07)
