# Google OAuth (Calendar + Gmail)

**Status:** current as of 2026-08-07 (BC-033)

## What's true now

Google is one shared, Zenny-owned OAuth app (`control.oauth_apps` row,
provider `google`), used for both the Calendar category and the Email
(Gmail) category from clients' dashboards. There is no separate
`gmail` provider row — `category` (not `provider`) is what distinguishes
a Calendar connection from an Email connection in
`control.client_connections`; `oauth-initiate`'s authorize-URL logic
never branches on category, it always requests the app's full combined
scope.

**Current scopes (final, narrowed twice over the project's life):**
`calendar.events` + `gmail.modify` + `userinfo.email` — requested
together in ONE combined consent screen, not two separate requests.
(History: started as full `calendar` scope, narrowed to `calendar.events`
in BC-023; `userinfo.email` was added in BC-022 to populate the
account-label field, which had been silently failing before that.)

**Current redirect_uri:** `https://auth.zeromanuals.com/oauth-callback`
(as of BC-033) — Google **only**. This is a new Traefik-proxied domain
that replaced the raw Supabase project-ref domain
(`kmhzosyljpzheqvfuyzm.supabase.co/functions/v1/oauth-callback`) for
Google specifically; Shopify/Calendly/Cal.com/Slack still use the old
Supabase-domain `redirect_uri` — updating theirs too was explicitly out
of BC-033's scope (would have broken their real authorize flows against
consoles that weren't also updated). See
[[oauth-redirect-and-proxy-domain]] for the proxy mechanism itself.

**App status:** `testing` (Google Cloud Console Publishing Status).
Verification was submitted at some point but is still pending Google's
review as of the most recent log entry that mentions it (BC-025,
2026-08-06) — no later entry records it moving to Production. While in
Testing status, only registered Test Users can reach the consent screen
at all; reaching a consent screen is itself proof the account is a
registered Test User.

**Category-sharing with Calendly (and Cal.com):** `client_connections`
has `UNIQUE(client_id, category)`. Google Calendar, Calendly, and Cal.com
all map to the same `category = 'calendar'` slot — connecting one
replaces whichever provider previously held that slot for a given
client. Google Calendar and Gmail do NOT collide with each other
(`calendar` vs. `email` categories), so a client can hold both
simultaneously. **This is a real, still-open product question**, not a
bug: should Google's combined Calendar+Gmail grant produce two separate
category rows so a client could also hold a Calendar-competitor at the
same time? Not resolved as of the most recent entry — flagged
repeatedly, still open for the Commander.

**Scope-level partial consent:** Google's own consent screen lets a
user approve Calendar and Gmail permissions independently (deny one,
grant the other) even though they're requested together. `oauth-callback`
checks the REAL granted-scope string (not what was requested) against a
`REQUIRED_SCOPE` map per category (`google.email -> gmail.modify`,
`google.calendar -> calendar.events`) before marking a connection
`status='connected'` — a genuine denial for the category being
connected redirects with a logged `required_scope_denied` reason instead
of a false "Connected."

## Why (if a non-obvious decision)

One shared app + category-based scope routing (instead of two separate
Google OAuth apps) avoids duplicate Google Cloud infrastructure for zero
functional gain — `Client_Integration_and_Credential_Platform_v1.md`
Part 8.1 specifies exactly this shared-app model, and it was verified
live to work as documented (BC-019).

**Real connected test client (found BC-036, 2026-08-10):** Client A
(`baa673b5-c51a-4a7b-91f5-a37027f8dca4`, `client_test_002_acme_commerce_test`)
has a genuinely `connected` Google `email` category connection
(`control.client_connections`, provider `google`) — confirmed by using
it to send a real Gmail message via [[token-refresh-pipeline]]'s
UTIL-006 during WF-018 live testing. This is the one exception to the
platform-wide "no roster client has a real provider connection" limit
noted elsewhere (PROJECT_STATE.md Active Blockers still applies to
Calendar/ecommerce) — use Client A for any future live email-send
verification instead of re-discovering this.

## Gotchas

- Reconnecting Google Calendar when Calendly currently holds the shared
  `calendar` slot silently displaces Calendly (and vice versa) — expected
  behavior given the current schema, not a bug, but easy to mistake for
  data loss.
- Existing connections only pick up a newly-added scope (e.g.
  `userinfo.email`) on their NEXT reconnect — not retroactively.
- SCH-006's Google refresh logic is the only provider-refresh path
  extracted into the shared UTIL-007 helper that's actually implemented;
  see [[token-refresh-pipeline]].
- The consent screen showing only a subset of requested permissions on
  a re-consent (Google's own `consentsummary` behavior for accounts that
  already granted some scopes previously) is expected, not evidence the
  request split into two.

## Source

- `Prior Phase — Phase 5 Dashboard Systems summary (BC-021 through BC-025)` (2026-08-06)
- `Phase 5 — Small Fix Pass + SCH-006 Slack State Verification + codebase-memory-mcp Onboarding (BC-022)` (2026-08-06)
- `Phase 5 — Token-Expiry Diagnosis + Calendar Scope Narrowing + Legal Page Revision (BC-023)` (2026-08-06)
- `Phase 5 — Partial-Scope-Grant Handling + Credential Preservation (BC-024)` (2026-08-06)
- `Phase 5 — Slack Removal + Gmail-Based Notifications + Scope-Request Verification (BC-025)` (2026-08-06)
- `Phase 5 — Real OAuth Connection Persistence Bug (BC-021)` (2026-08-06)
- `Session Log — Session 33 — BC-033 COMPLETE: auth.zeromanuals.com Traefik proxy live...` (2026-08-07)
- `Phase 5 — Gmail/WooCommerce Connections, Inventory Sync Logged, Supabase Tier (BC-019)` (2026-08-05)
