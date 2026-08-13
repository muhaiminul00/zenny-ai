# Shopify

**Status:** current as of 2026-08-07 (BC-032)

## What's true now

Shopify supports **two parallel, independent connection mechanisms**,
both live in the dashboard as of BC-032 — an "alternative, not a
replacement" per explicit instruction, not a migration from one to the
other:

1. **OAuth ("sign in with Shopify")** — the original shared-app
   Authorization Code Grant, per
   `Client_Integration_and_Credential_Platform_v1.md` Part 8.2. Uses the
   existing `control.oauth_apps` `shopify` row (real seeded Client ID +
   Vault-stored Client Secret, `app_status: 'testing'`) and the standard
   `oauth-initiate`/`oauth-callback` flow, redirect_uri still on the old
   Supabase-domain (not migrated to `auth.zeromanuals.com` — that's
   Google-only, see [[oauth-redirect-and-proxy-domain]]). Requires a
   Shopify Partner Dashboard "distribution method" selection on the app
   itself before install works at all (a Shopify Partner Dashboard
   setting, not a Zenny code issue — confirmed non-code via well-formed
   real 302 redirects to Shopify's own authorize endpoint).

2. **Client Credentials Grant ("Client ID + Secret")** — a genuinely
   different, per-client mechanism: the client submits their store's own
   Client ID + Client Secret, and Zenny auto-requests a short-lived token
   on each call (`POST https://{shop}.myshopify.com/admin/oauth/
   access_token`, form-urlencoded `client_id`/`client_secret`/
   `grant_type=client_credentials`, returns
   `{access_token, scope, expires_in: 86399}` — a ~24-hour token).
   Implemented via a new `shopify-connect` Edge Function (mirrors
   `woocommerce-connect`'s live-validate-then-store pattern: a real
   Client Credentials Grant token request is made BEFORE anything is
   stored, and that response's access token becomes the connection's
   initial live token, not a placeholder) and a new `shopify` branch on
   UTIL-007's `Route By Provider` (5 outputs total:
   google/shopify/calendly/cal_com/fallback).

**Static Custom App tokens are permanently dead** — Shopify removed the
ability to generate new static Custom App tokens entirely as of Jan 1,
2026 (live-confirmed via WebSearch, BC-032). Do not build or suggest
this mechanism; it does not exist anymore.

## Why (if a non-obvious decision)

BC-032's Build Card originally asked for a Custom App static-token form
— the exact mechanism that had just been permanently removed by Shopify.
Per Mandatory MCP Verification, the dead functionality was not built;
the human was asked directly (not guessed past), and the answer was to
pivot to Client Credentials Grant. This is architecturally distinct from
the shared-app OAuth case that
`Client_Integration_and_Credential_Platform_v1.md` Part 8.2 already
rejected Client Credentials Grant for — this is a genuine per-client
alternative fallback (matches Part 8.5.1's general API-key-fallback
principle), not a contradiction of that earlier decision.

## Revoke (BC-052)

Shopify has **no app-initiated revoke API** for Client Credentials Grant
tokens — access is only actually cut by removing the key from the
Shopify Partner/Dev Dashboard. The dashboard's Disconnect button
discloses this honestly (`provider_revoked: false` + reason) rather than
pretending to revoke. See [[../infra/connection-lifecycle-actions]].

## Gotchas

- **The stable Client ID for the Client Credentials Grant path is stored
  in `refresh_token_secret_id`, NOT `access_token_secret_id`.**
  `access_token_secret_id` is the ROTATING slot every refresh overwrites
  with the fresh access token — the same slot every Tool reads for live
  calls. An early draft read the Client ID from that rotating slot,
  which would have silently broken every refresh after the first one.
  Corrected to mirror exactly how Google's branch keeps its long-lived
  refresh_token in that same `refresh_token_secret_id` slot.
- UTIL-007's Shopify branch has never been exercised end-to-end through
  a real production connection — no currently-built Tool performs a live
  ecommerce API call that would trigger it naturally, and the available
  test tooling can't invoke the workflow's trigger directly without
  faking the very external call the branch needs to prove. Structural
  correctness (full node graph, all 5 `Route By Provider` outputs wired)
  was verified instead — a disclosed testing limitation, not a silent
  gap.
- Real bug shape worth remembering: n8n's `updateNodeParameters` alone
  can update a switch node's own parameters without updating the
  workflow-level `connections` object — use explicit
  `addConnection`/`removeConnection` operations for new switch branches.
- The double-`.myshopify.com`-suffix bug (BC-021) is fixed: Shopify's
  real callback sends `shop` as the full domain; `exchangeCode` now
  strips any existing `.myshopify.com` suffix before re-appending it.

## Source

- `Current Phase — Self-resolved document-level item (BC-032, Shopify Client Credentials Grant pivot)` (2026-08-07)
- `Session Log — Session 32 — BC-032 (Infrastructure catch-up)...` (2026-08-07)
- `Phase 5 — Real OAuth Connection Persistence Bug (BC-021)` (2026-08-06)
- `Phase 5 — 3 Defect Fixes From Manual Testing (BC-018)` (2026-08-05)
- `Phase 5 — Gmail/WooCommerce Connections, Inventory Sync Logged, Supabase Tier (BC-019)` (2026-08-05)
