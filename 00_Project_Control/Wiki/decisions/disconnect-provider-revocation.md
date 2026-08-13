# DECIDED: Should Disconnect Also Revoke Access At The Provider?

**Status:** DECIDED + BUILT (BC-052, 2026-08-14) — yes. Real per-provider
revoke where the provider actually supports it (Google, Calendly);
honestly disclosed local-only where it doesn't (Shopify, WooCommerce —
no app-initiated revoke API exists for either). Reconnect and Refresh
added as separate real actions too. Full mechanism:
[[../infra/connection-lifecycle-actions]].

## The question

The dashboard's "Disconnect" action (`dashboard_disconnect_connection`)
is currently **local-only**: it calls `update_connection_status(...,
'revoked', ...)` and logs a real audit event, but does NOT call the
provider's own token-revocation endpoint (e.g. Google's OAuth token
revocation API). The underlying Vault secret is also deliberately not
deleted on disconnect (so a revoked connection's refresh token still
technically exists, though [[../platform-quirks/security-definer-rls]]
and the token-refresh pipeline now correctly exclude revoked connections
from being silently re-activated by the refresh sweep).

**Should Disconnect also call the provider's real revoke endpoint, so
the provider itself considers Zenny's access actually withdrawn — not
just Zenny's own local record?**

## Options considered (if any)

No options were formally weighed in the log. The current local-only
behavior was implemented and explicitly DISCLOSED in the dashboard's own
UI copy at the time (BC-016) — "Claude Code's own call per the card's
'flag if unsure'" — rather than either silently claiming full revocation
or building per-provider revoke calls without being asked.

## Current state while open

Disconnect reliably updates Zenny's own `client_connections.status` and
is honestly disclosed as local-only in the dashboard's copy. No
per-provider revoke call exists for any provider (Google, Shopify,
Calendly, Cal.com, WooCommerce). This has not caused any known incident,
but means a "disconnected" client, from the provider's own perspective,
may still show Zenny as an authorized app until the end user separately
revokes access on the provider's own account-security page.

## Source

- `Phase 5 — Brand Pass + Integrations Dashboard (BC-016 — BUILT + DEPLOYED)` (log.md, 2026-08-05)
- `Blockers Right Now — main list...` (log.md, 2026-08-07) — repeated flag, still listed unresolved
