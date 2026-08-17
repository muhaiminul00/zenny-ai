# Token Refresh Pipeline (SCH-006 / UTIL-006 / UTIL-007)

**Status:** current as of 2026-08-07 (BC-032)

## What's true now

Two independent refresh mechanisms exist and both are real/active:

**1. SCH-006 (Token Refresh Sweep) — scheduled, background.** Currently
`active: true`, running **every 2 hours** (the human retuned it directly
in n8n from its original 6-hour build default; confirmed live). Sweeps
`control.client_connections` for connections due for refresh and
refreshes them proactively. Implements Google and Calendly refresh
logic directly (inline, not via UTIL-007). Its own 4 Slack alert nodes
were removed entirely in BC-025 — see [[slack-status]] — replaced with
Gmail notifications via UTIL-004.

**2. UTIL-006 (Credential Resolver) + UTIL-007 (Refresh Connection
Token) — synchronous, per-call.** UTIL-006 is what Tools actually call
to get a live, guaranteed-fresh credential before making an external
API call. It checks `Token Expiring Soon?` (`!token_expires_at ||
token_expires_at <= now + 5min`); if true, it calls UTIL-007
synchronously BEFORE returning a token, rather than returning a
possibly-stale one. If the refresh itself fails, it routes to Tool
Execution Fallback with a real, logged reason instead of silently
returning a dead token.

**UTIL-007's `Route By Provider` currently has 5 outputs:**
google (implemented), shopify (implemented, BC-032, via Client
Credentials Grant), calendly (NOT implemented), cal_com (NOT
implemented), fallback. Calendly and Cal.com synchronous refresh return
an honest "unsupported provider" error rather than silently failing —
Google is the only provider with real tested credentials across every
session to date; this is a disclosed scope cut, not an oversight.
(Calendly IS refreshed by SCH-006's separate inline logic — see above —
just not yet by UTIL-007's synchronous path.)

SCH-006 was deliberately NOT refactored to call UTIL-007 instead of its
own inline refresh logic — a possible future consolidation, not required
for any fix to date.

## Why (if a non-obvious decision)

Two mechanisms exist because they solve different problems: SCH-006
keeps tokens fresh proactively in the background so most Tool calls
never hit an expired token in the first place; UTIL-006/UTIL-007 is the
synchronous safety net for the case where a token expires between sweeps
(SCH-006 only runs every 2 hours; Google access tokens live ~1 hour) —
without it, a Tool could still hit a genuinely expired token mid-call.

## Gotchas

- `Token Expiring Soon?`'s 5-minute buffer is deliberately conservative
  relative to Google's ~1-hour access-token lifetime — don't assume a
  token is safe to use just because `token_expires_at` is technically
  still in the future.
- UTIL-006/UTIL-007 both hit the same `responseFormat: "text"` +
  `.data`-access pattern documented in [[vault-storage-pattern]] — every
  HTTP node reading `read_credential_secret`/`store_credential_secret`
  needs this set explicitly, and several real bugs (missing credential
  attachment entirely, missing `responseFormat`) were found live the
  FIRST time each of these workflows was actually execution-tested, not
  caught by validation alone.
- Revoked connections are correctly excluded from SCH-006's sweep
  (`get_connections_due_for_refresh` filters `status <> 'revoked'`,
  migration 049) — before this fix, the sweep could silently un-revoke a
  connection a human had explicitly disconnected, since revoking is
  local-only and doesn't delete the underlying Vault refresh token. If a
  disconnected provider ever appears "connected" again unexpectedly,
  check this exclusion is still in place before assuming a new bug.
- UTIL-007's Shopify branch has never been exercised end-to-end against
  a real production connection — see [[shopify]]'s gotchas.

## Source

- `Phase 6 — Real Infrastructure Bug Fixes (BC-028)` (2026-08-07)
- `Session Log — Session 32 — BC-032 (Infrastructure catch-up)...` (2026-08-07)
- `Phase 5 — Partial-Scope-Grant Handling + Credential Preservation (BC-024)` (2026-08-06)
- `Phase 5 — Real OAuth Connection Persistence Bug (BC-021)` (2026-08-06)
- `Phase 5 — Slack Removal + Gmail-Based Notifications + Scope-Request Verification (BC-025)` (2026-08-06)
- `Prior Phase — Phase 6 documentation catch-up (BC-027)` (2026-08-07)
