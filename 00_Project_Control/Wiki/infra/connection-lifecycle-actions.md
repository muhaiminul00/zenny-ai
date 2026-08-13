# Connection Lifecycle Actions — Revoke / Reconnect / Refresh (BC-052)

## What it replaced

Disconnect used to call `dashboard_disconnect_connection`, a local-only
RPC — it flipped `client_connections.status` to `revoked` and logged an
audit event, but never told the provider. Reconnect and Refresh didn't
exist as distinct actions at all.

## What it is now

**New Edge Function `connection-lifecycle`** (`POST
/functions/v1/connection-lifecycle`, body `{client_id, category,
action: 'revoke'|'refresh'}`), matching the existing
`woocommerce-connect`/`shopify-connect` convention exactly:
`SERVICE_ROLE_KEY` throughout, `client_id` trusted from the body,
`verify_jwt: false` at deploy (see
[[../platform-quirks/anon-grant-exposure-bc052]] for the residual gap
this shares with those existing functions).

**Real per-provider facts this was built against** (verified before
coding, not assumed):

| Provider | Revoke | Refresh |
|---|---|---|
| Google | Real endpoint (`oauth2.googleapis.com/revoke`), live-verified | Real endpoint, live-verified against Client A's actual connection (non-destructive — refresh doesn't consume the refresh_token) |
| Calendly | Real endpoint (`auth.calendly.com/oauth/revoke`), live-verified against a synthetic connection | Already covered by SCH-006's scheduled sweep; on-demand refresh via this function is NOT implemented (same disclosed gap as UTIL-007) |
| Shopify | **No app-initiated revoke API exists** — local-only, honestly disclosed (`provider_revoked: false` + reason) | Client Credentials Grant re-request, built mirroring UTIL-007's Shopify branch — **not live-tested end to end**, no real Shopify connection exists in the roster (same disclosed limitation UTIL-007's Wiki page already carries) |
| WooCommerce | **No app-initiated revoke API exists** — local-only, honestly disclosed, live-verified against a synthetic connection | Not applicable — static REST API keys don't expire; correctly rejected server-side (`UNSUPPORTED_PROVIDER`), live-verified |
| Cal.com | Not a real registered app (`oauth_apps.app_status='pending'`) — rejected outright | Same |

**Live-verified without touching Client A's real Google/WooCommerce
connections** for the destructive Revoke path: synthetic
`client_connections` rows were inserted for other roster clients (no
real connections of their own) with disposable Vault secrets, revoke
was called for real against Google's and Calendly's real endpoints
(both returned real HTTP responses — Google 400/already-invalid,
Calendly 200), then the synthetic rows/secrets were deleted. Refresh was
tested directly against Client A's real, live Google connection since
refreshing is non-destructive (rotates the access token, refresh_token
stays valid) — confirmed via `token_expires_at` genuinely advancing
~1hr.

**Dashboard (`Integrations.tsx`):**
- **Disconnect** — same button, upgraded behavior: now calls
  `connection-lifecycle` (`action: 'revoke'`) instead of the old local-
  only RPC. Copy at the bottom of the page updated to describe the real
  per-provider behavior (Google/Calendly genuinely revoked; Shopify/
  WooCommerce local-only, told to the user honestly).
- **Refresh** — new button, shown only for `google`/`shopify` (the two
  providers where on-demand refresh is actually implemented).
- **Reconnect** — new button, shown whenever a connection exists but
  isn't in the healthy `connected` state (expired/error). No new
  backend — reuses the exact same Connect flow (`handleConnect` /
  `openWooForm` / `openShopifyClientCredentialsForm`) the original
  "Connect" buttons already use.

`tsc -b` and `oxlint` both clean on the changed file (3 pre-existing
unrelated warnings, not introduced by this card).

## Not done this card

- Full browser click-through of the new buttons — the one real
  dashboard user's password isn't available to this session (Credential
  Gate: not invented). Backend (Edge Function + RPCs) is directly
  live-verified instead; frontend is typecheck/lint-clean. Disclosed
  limitation, not a silent gap.
- Shopify refresh's real end-to-end path (no live Shopify connection in
  the roster to test against) — same disclosed limitation as UTIL-007.

See [[../decisions/disconnect-provider-revocation]] (closed) and
`Workflow_Registry.md` — n/a, no n8n workflow touched by this card.
