# Calendly

**Status:** current as of 2026-08-06 (BC-024)

## What's true now

Calendly is a standard OAuth provider (`control.oauth_apps` row,
`provider: 'calendly'`), real seeded Client ID + Vault-stored Client
Secret, `app_status: 'testing'`. It also has a webhook signing key
stored via the same non-FK Vault-reference pattern as `client_secret_id`
(`oauth_apps.webhook_signing_key_id`, added migration 024).

Calendly maps to the dashboard's `category = 'calendar'` slot — the same
slot Google Calendar and Cal.com also use. Because
`client_connections` enforces `UNIQUE(client_id, category)`, only one of
these three providers can be connected at a time per client; connecting
any one of them replaces whichever previously held that slot. **As of
the most recent relevant entry, Google Calendar occupies this slot for
the one real test client** — Calendly was displaced when the human
reconnected Google Calendar during BC-023's scope-narrowing verification,
and remains disconnected (not broken — a direct, expected consequence of
the shared-slot design, confirmed via the audit log timeline: the same
connection_id flipped from `provider='calendly'` to `provider='google'`
at the exact moment of the reconnect). Reconnecting Calendly again would
simply replace Google Calendar back in that same slot.

SCH-006's token refresh sweep DOES refresh Calendly tokens successfully
(both access token and refresh token rotate on every refresh — verified
against a real execution: new access token + rotated refresh token from
Calendly's real token endpoint, both persisted correctly). This is
distinct from UTIL-007 (the newer synchronous per-call refresh helper),
which currently only implements the Google branch — Calendly/Cal.com
synchronous refresh via UTIL-007 is explicitly NOT implemented (returns
an honest "unsupported provider" error) — a real, disclosed scope cut,
not an oversight, since Google is the only provider with real tested
credentials across every session to date.

## Why (if a non-obvious decision)

The `UNIQUE(client_id, category)` shared-slot design (Google
Calendar/Calendly/Cal.com all competing for one `calendar` category row
per client) is a real, still-open product question for the Commander —
should Google's combined Calendar+Gmail grant produce a separate
category row so a client could hold both a Calendar AND a
Calendly/Cal.com connection simultaneously? Not resolved as of the most
recent log entry; flagged repeatedly across BC-021, BC-023, and BC-024.

## Revoke (BC-052)

Calendly has a real OAuth revoke endpoint (`auth.calendly.com/oauth/revoke`,
`POST` with `client_id`/`client_secret`/`token`) — live-verified via the
new `connection-lifecycle` Edge Function against a synthetic connection
(real 200 response). See [[../infra/connection-lifecycle-actions]].

## Gotchas

- A "disconnected" Calendly connection after reconnecting Google
  Calendar (or vice versa) is expected behavior given the current shared
  `category='calendar'` slot design — do not treat it as a regression or
  bug without checking which provider currently occupies that client's
  calendar slot.
- Before any test that might overwrite a shared-category slot
  (reconnecting a provider that shares a category with another),
  snapshot the current working connection first via
  `control.connection_snapshots` — this is a standing testing-safety
  practice established in BC-024, not a one-time fix. See
  [[vault-storage-pattern]].
- A real historical Calendly connection failure was traced not to
  Calendly itself but to a missing-audit-log gap in `oauth-callback`'s
  early-exit branches (fixed in BC-021) — if a future Calendly attempt
  fails silently, check that the defense-in-depth logging fix is still
  in place before assuming a new provider-side issue.

## Source

- `Phase 5 — Real OAuth Connection Persistence Bug (BC-021)` (2026-08-06)
- `Phase 5 — Token-Expiry Diagnosis + Calendar Scope Narrowing + Legal Page Revision (BC-023)` (2026-08-06)
- `Phase 5 — Partial-Scope-Grant Handling + Credential Preservation (BC-024)` (2026-08-06)
- `Phase 6 — Real Infrastructure Bug Fixes (BC-028)` (2026-08-07)
- `Credentials — Real Current State` (2026-08-05, BC-004-era content)
