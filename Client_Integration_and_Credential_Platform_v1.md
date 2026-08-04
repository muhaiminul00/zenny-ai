# Client Integration & Credential Platform v1

```
Status:    DRAFT — Architecture Breakthrough resolution document (Problem 3)
Purpose:   Define HOW a client connects a third-party account (Google,
           Calendly, Cal.com, Shopify, WooCommerce, Slack) to Zenny — the
           OAuth mechanism, Supabase credential storage, token refresh, and
           the Credential Resolver that lets n8n fetch a working token at
           Tool-execution time.
Position:  Sits alongside External_Integration_Strategy_v1.md (which
           decided WHICH provider, per category). This document decides
           HOW a client connects one. Companion documents together resolve
           Architecture Breakthrough Report v1's Problems 2, 3, and 4.
Primary mechanism: Supabase Edge Functions (Deno) handle the OAuth flow
           itself (initiate, callback, code exchange). n8n handles only the
           Credential Resolver (read at Tool-execution time) and the token-
           refresh scheduled sweep — never the OAuth dance itself.
Documented fallback: an n8n-webhook-based OAuth flow, using a proven,
           tested reference implementation (Part 11) built and validated by
           a teammate for a Gmail/Calendar dashboard proof of concept. Not
           built by default — switched to only if Edge Functions fail in
           testing or with the first live client, per your explicit
           instruction. Applies only to OAuth-based providers, not
           WooCommerce (Part 8.3, manual key entry, no OAuth involved).
Revision:  Corrected during review — Shopify's old Custom App token model
           was discontinued (late 2025); real mechanism is a standard
           shared-app Authorization Code Grant, identical in shape to
           Google's flow (Part 8.2). WooCommerce has no OAuth mechanism at
           all — manual Consumer Key/Secret entry via a plain form (Part
           8.3), flagged as needing a detailed onboarding guide. Added a
           full audit log (Part 6.3, "black box" — every connection state
           change recorded with actor and raw reason, never guessed at)
           and an immediate alert system (Part 6.4, fires to both client
           and Zenny on any revocation or refresh failure, not batched).
           Added the Testing-mode 7-day Google refresh-token hard expiry,
           confirmed to have no backend workaround, with proactive-
           reminder handling designed around it (Part 8.1.1). Added a
           permanent, standing hybrid OAuth/API-key model (Part 4.2.1) —
           OAuth is the provider-level default with no client choice
           shown; API-key opens either when a provider's OAuth isn't yet
           ready (static, manually-set per provider, never an automatic
           runtime fallback) or as a rare, human-approved retention
           exception per client. The active method is always derived from
           which credential fields are actually populated, never stored
           as a separate flag that could drift out of sync.
Explicitly NOT covered here: Voice/Twilio (deferred), Convocore-specific
           schema fields (deferred, per your instruction — Convocore
           decisions still finalizing), the client dashboard's general UI
           beyond the Connect flow itself (a later build phase).
```

---

# PART 1 — Purpose & Scope

## 1.1 Why This Document Exists

`External_Integration_Strategy_v1.md` decided which provider(s) Zenny
supports per category, and established the Capability → Router → Provider
Branch pattern so n8n workflows never hardcode a provider. That document
explicitly deferred one question: **how does a client's own account
actually get connected, and where does the resulting credential live?**
This is Architecture Breakthrough Report v1's Problem 3, and this document
resolves it.

## 1.2 What This Document Decides

- The OAuth flow architecture: Supabase Edge Functions as the primary
  mechanism, with a documented, tested fallback.
- The Supabase schema for storing provider connections and encrypted
  credentials (`control` schema, matching every other table in this
  project).
- The Credential Resolver — the new n8n-side utility that fetches a valid,
  fresh token at Tool-execution time.
- Token refresh — automatic, scheduled, before expiry.
- The Tool Execution Fallback pattern — what happens when a provider call
  fails for technical (not business) reasons, distinct from the Fallback
  Pattern Catalog A/B/C/D.
- Per-provider OAuth app registration requirements (Google, Shopify, Slack,
  Calendly, Cal.com), building directly on the research already done in
  `External_Integration_Strategy_v1.md`.

## 1.3 What This Document Does NOT Decide

- Which provider, per category (decided — `External_Integration_Strategy_v1.md`).
- The client dashboard's general UI/UX beyond the Connect flow — a separate,
  later build phase per your earlier decision (same Claude Code + Codex
  pipeline, different phase).
- Voice/Twilio credential handling — deferred, no design yet.
- Convocore-specific schema fields (`convoId`, `origin`) — deferred per your
  instruction; flagged again here only where directly relevant (Part 9).

## 1.4 A Note on Frozen Documents

Per the principle already stated in `External_Integration_Strategy_v1.md`
Part 9.1: documents marked "frozen" are the best decision made with the
information available at the time, not permanently fixed. This document
raises real Change Requests against previously frozen content (Part 12) —
named explicitly, not smoothed over.

---

# PART 2 — Reference Evidence

Two real sources ground this document, not speculation:

1. **`zenny-dashboard-test-only_gmail_calender_-doc.md`** — a working,
   tested Gmail + Calendar OAuth dashboard built by a teammate. Real Google
   Cloud config, real Supabase tables, real n8n workflows, real known
   limitations. Used throughout this document as validated reference — not
   copied wholesale, since it predates the Supabase-native architecture
   decision (Part 3) and used `readonly` scopes only, but its OAuth
   mechanics, CSRF handling, and hard-won limitations are directly reused.
2. **Live research** (this project's prior conversation) — Google OAuth
   verification requirements, Shopify's Custom App model, Slack's
   unverified-app installation model, Supabase Vault's encryption
   mechanism, Supabase Edge Function pricing — all confirmed current as of
   2026-07-18 through 2026-08-01.

---

# PART 3 — Architecture Decision: Supabase-Native, Not a Separate Service

## 3.1 The Decision

No separate FastAPI/PostgreSQL/VPS backend (an earlier draft proposed this
shape). The Integration Platform is **Supabase-native**:

```
Client Dashboard (frontend, built in a later phase)
   ↓ reads/writes
Supabase (Postgres + Auth + Edge Functions + Vault) — the ONLY backend
   ↓ read-only, at Tool-execution time
n8n (Credential Resolver + refresh sweep)
```

## 3.2 Why

- Every other frozen document in this project (Database Structure,
  Integration Contract, Workflow Specification) is built on Supabase as the
  single trust boundary. A second backend service would be a new
  architectural layer nothing else in the project has, duplicating
  Supabase's own database/auth/function capabilities for no benefit.
- Supabase Edge Functions cost effectively nothing for this workload
  (500,000 free invocations/month; OAuth connect/refresh events are
  occasional, not per-conversation-turn — this workload will not
  meaningfully approach that limit).
- This is confirmed as the industry-standard pattern for OAuth callback
  handling — a real server-side HTTP handler (serverless function or
  traditional backend route), not a workflow-automation tool as primary.

## 3.3 What This Replaces From the Earlier Draft

| Earlier draft concept | Supabase-native equivalent |
|---|---|
| OAuth Manager (Python service) | Supabase Edge Function(s) |
| Token Manager (Python service) | `control` schema table + Supabase Vault |
| Capability Manager (Python service) | Mapping logic inside each Edge Function + each n8n provider branch (`External_Integration_Strategy_v1.md` Part 5) |
| Provider Adapter interface (Python class) | Same interface *shape*, one Edge Function per provider category |
| FastAPI + SQLAlchemy + Celery + VPS + Nginx | Supabase (Postgres, Auth, Edge Functions, Vault, `pg_cron` or n8n scheduled workflow) |
| Authlib (Python OAuth library) | Hand-rolled OAuth in Deno (not complex for Authorization Code flow — confirmed via the teammate's working reference, Part 11) or a Deno-compatible OAuth library if one is selected at build time |

---

# PART 4 — Supabase Schema

## 4.1 Design Principle

These tables live in **`control`**, not a separate Supabase project and not
`public` — matching this project's existing schema discipline exactly
(`Database_Structure_v4_FINAL.md` §1: `control` is the Control Plane,
`service_role`-only, RLS enabled with zero policies). This is the single
largest correction versus the teammate's reference build, which used a
standalone Supabase project with no `client_id` linkage to this project's
real multi-tenant schema design.

## 4.2 New Tables

### `control.oauth_apps` — one row per provider, Zenny's own registered app credentials

```sql
provider          text PRIMARY KEY   -- 'google' | 'calendly' | 'cal_com' |
                                      -- 'shopify' | 'slack' | 'gmail'
                                      -- (gmail and google_calendar share
                                      -- one Google Cloud app — see Part 8.1)
client_id          text NOT NULL      -- OAuth Client ID (or Cal.com/etc
                                      -- equivalent) — Slack/Calendly may
                                      -- name this differently per provider
client_secret_id    uuid NOT NULL     -- references a Vault secret, NOT the
                                      -- plaintext secret itself (Part 4.4)
redirect_uri          text NOT NULL
scopes                  text NOT NULL  -- space-separated, provider-specific
app_status                text NOT NULL -- 'testing' | 'published' |
                                      -- 'not_applicable' (Shopify Custom
                                      -- App has no such concept, Part 8.2)
updated_at                timestamptz NOT NULL DEFAULT now()
```

Directly generalizes the teammate's `google_oauth_config` singleton-row
pattern into a real multi-provider table — one row per provider instead of
one hardcoded singleton, since this platform needs 6 provider apps, not 1.

**Access: `service_role` only, RLS enabled, zero policies** — identical
posture to every other `control` table (`Database_Structure_v4_FINAL.md`
§9's verified security posture, applied here without exception).

### `control.client_connections` — per-client, per-provider connection record

```sql
connection_id       uuid PRIMARY KEY DEFAULT gen_random_uuid()
client_id            uuid NOT NULL REFERENCES control.clients(client_id)
provider              text NOT NULL REFERENCES control.oauth_apps(provider)
category                text NOT NULL  -- 'calendar' | 'email' | 'ecommerce' |
                                      -- 'notification'
provider_account_id      text          -- provider's own account/email
                                      -- identifier, for display in the
                                      -- dashboard (e.g. the connected
                                      -- Gmail address)
access_token_secret_id     uuid NOT NULL -- references a Vault secret. For
                                      -- OAuth: the access token. For
                                      -- API-key: the key itself. Always
                                      -- populated, either way.
refresh_token_secret_id      uuid         -- references a Vault secret.
                                      -- NULLABLE — this is the entire
                                      -- mechanism, see 4.2.1 below.
token_expires_at                timestamptz  -- NULL for API-key
                                             -- connections (most API keys
                                             -- don't expire on a schedule)
status                             text NOT NULL DEFAULT 'connected'
                                    -- 'connected' | 'expired' | 'revoked' |
                                    -- 'error'
                                    -- This is the CURRENT state only.
                                    -- The full history of HOW it got here
                                    -- lives in control.connection_audit_log
                                    -- (Part 6.3) — this column is never
                                    -- the only record of what happened.
scopes_granted                       text NOT NULL
connected_at                          timestamptz NOT NULL DEFAULT now()
updated_at                             timestamptz NOT NULL DEFAULT now()
CONSTRAINT client_connections_one_per_category
   UNIQUE (client_id, category)  -- enforces single-provider-per-category,
                                 -- per External_Integration_Strategy_v1.md
                                 -- Part 3.3's confirmed decision. This same
                                 -- constraint also enforces "one method at
                                 -- a time" for free (Part 4.2.1) — there is
                                 -- only ever one row, so it can only ever
                                 -- hold one method's credentials.
```

### 4.2.1 Hybrid OAuth / API-Key Model — Method Is Derived, Never Stored

Per your explicit design decision: OAuth is the default, provider-level,
no-choice path. API-key is a standing, permanent fallback — not temporary
scaffolding — offered only when a provider's OAuth isn't ready yet
(`control.oauth_apps.app_status = 'testing'` or equivalent non-published
state, Part 8) or granted to an individual client on request, at Zenny's
discretion, as a retention accommodation (never self-serve — see 4.2.2).

**No separate `auth_method` column exists.** Which method a connection uses
is derived directly from what's actually stored, never declared
independently:

```
IF refresh_token_secret_id IS NOT NULL  → this connection is OAuth
   (only the OAuth flow ever produces a refresh token)
IF refresh_token_secret_id IS NULL       → this connection is API-key
   (access_token_secret_id holds the plain key; there is nothing to refresh)
```

This is a deliberate simplicity choice: a separate flag column could drift
out of sync with the actual stored credentials (a bug, a manual fix, a
migration that updates one but not the other). Deriving the method from
the data itself means there is only ever one source of truth — the stored
secrets — never two things that are supposed to agree but aren't
mechanically forced to.

**Switching a connection's method** (Part 8.5.1's Cal.com fallback,
or any future case) is a straightforward overwrite of the same row: the
old credential's Vault secret is retired, the new one is created and
written into `access_token_secret_id` (and `refresh_token_secret_id`, set
or cleared as appropriate), `updated_at` bumps. No new row, no new
`connection_id` — same client, same provider, same category, just a
different credential shape underneath. The Credential Resolver (Part 6.2)
never needs to know a switch happened; it just reads whatever is currently
there and behaves accordingly (skips the refresh-check entirely for
API-key connections, since there's nothing to refresh).

### 4.2.2 Enabling API-Key for a Provider or a Client

**Provider-level (the common case):** purely manual and static, set by a
human, once, in `control.oauth_apps.app_status` (Part 8) — never an
automatic runtime decision. A live technical outage (Edge Function down,
provider API down) is handled by Part 7's Tool Execution Fallback, and is
never, by itself, a trigger to open the API-key path — API-key is reserved
strictly for "we know in advance OAuth isn't ready," not "something broke
just now."

**Client-level exception (rare, discretionary):** a client requests
API-key access despite OAuth being available, gives a reason, and a human
at Zenny approves it in a support conversation — never a self-service
dashboard toggle. No new "pending approval" status is needed in the
schema for this — the approval happens entirely outside the system; only
the *result* (a human manually enabling the client's API-key form in the
dashboard/backend) ever touches the database.

**Permanence, confirmed:** once a client is on API-key, they are not
force-migrated when OAuth later becomes available for that provider. They
may be informed/invited to migrate. If API-key support for a provider is
ever discontinued entirely (the provider itself closes it off, as Shopify
did with the old Custom App tokens), affected clients receive advance
warning before removal — this path is standing infrastructure, not
temporary scaffolding, for as long as any client actively depends on it.

**Access: `service_role` only** — the dashboard frontend never reads this
table directly; it goes through a narrower, purpose-built view or RPC
(Part 4.5) that never exposes token secret IDs to the browser.

### `control.oauth_state` — CSRF nonce, short-lived

```sql
state         text PRIMARY KEY   -- random UUID per connect attempt
client_id      uuid NOT NULL REFERENCES control.clients(client_id)
category        text NOT NULL     -- which category this connect attempt is for
provider          text NOT NULL     -- which provider was selected
created_at          timestamptz NOT NULL DEFAULT now()
```

Directly reuses the teammate's proven `oauth_state` pattern (Part 2) —
inserted at connect start, verified + deleted at callback, preventing
forged OAuth callbacks. Extended with `category`/`provider` since this
platform supports multiple categories and providers, unlike the reference
build's single-provider scope. Applies to OAuth connections only — API-key
connections (Part 4.2.1) skip this entirely, since there is no redirect/
callback dance to protect against forgery for a manually-pasted key.

**Access: `service_role` only.** A scheduled cleanup (Part 10.4) removes
stale unclaimed states.

### `control.provider_status_board` — Optional, Manual-Only, Not Load-Bearing

Per your explicit instruction: purely a human convenience table, skipped
entirely if not needed. **Not read by any workflow, Edge Function, or the
Credential Resolver** — it exists only so you/your team can glance at every
provider's setup status in one place, without opening Google Cloud
Console, Cal.com's dashboard, and Shopify's Partner Dashboard separately.

```sql
provider              text PRIMARY KEY
provider_app_client_id  text     -- Zenny's own registered app's Client ID
                                 -- for this provider (mirrors oauth_apps,
                                 -- kept here only for at-a-glance viewing)
client_secret_ref         uuid     -- points to the SAME Vault secret already
                                 -- referenced in oauth_apps.client_secret_id
                                 -- — never a second copy of the secret itself
oauth_active                 boolean  -- manually set: is OAuth ready/
                                    -- approved for this provider right now?
api_key_active                 boolean  -- manually set: is the API-key
                                       -- fallback currently open for this
                                       -- provider?
notes                             text     -- free text, e.g. "pending
                                         -- Cal.com review since 2026-07-20"
```

**This table is entirely optional.** It does not gate any real behavior —
`control.oauth_apps.app_status` (Part 8) is the only field the system
itself ever reads to decide anything. Build this only if/when it proves
genuinely useful once things are running; it is explicitly not a
prerequisite for any Build Card.

## 4.3 Relationship to Existing Tables

`control.client_connections.client_id` references `control.clients` — the
same table every other `control`-schema record in this project already
references. No new identity system; this platform is an extension of the
existing multi-tenant design, not a parallel one.

## 4.4 Token Storage — Supabase Vault, Not Plaintext

**Correction versus the teammate's reference build**, which stored
`refresh_token`/`access_token` as plain `text` columns — acceptable for a
proof of concept, not for production credential storage. This document
specifies Supabase Vault (`vault.secrets`, `pgsodium`-backed, Authenticated
Encryption with Associated Data) instead:

```sql
-- Storing a token (called from an Edge Function via service_role RPC):
SELECT vault.create_secret(
  '<the actual token value>',
  'client_' || client_id || '_' || category || '_refresh',  -- name
  'OAuth refresh token'  -- description
);
-- Returns a UUID — this is what's stored in
-- control.client_connections.refresh_token_secret_id, never the raw token

-- Reading a token (called from n8n via service_role, at Tool-execution time):
SELECT decrypted_secret FROM vault.decrypted_secrets
WHERE id = '<refresh_token_secret_id>';
```

Per Supabase's own documented pattern (confirmed via research): wrap both
operations in `SECURITY DEFINER` SQL functions with grants restricted to
`service_role`, called via RPC — not raw table/view access — mirroring this
project's own existing `create_client_schema_from_template()` RPC pattern
(`Database_API_Reference.md`), for consistency with an established
convention rather than a new one.

**Vault's root encryption key is stored outside SQL entirely** (per
Supabase's architecture) — even a full database dump does not expose
readable tokens without that key, which Supabase itself manages.

## 4.5 Dashboard-Facing View (No Raw Tokens Exposed)

A narrow view, safe for the dashboard frontend to query (still gated by
Supabase Auth RLS — a client can only see their own row):

```sql
CREATE VIEW control.client_connections_display AS
SELECT connection_id, client_id, provider, category, provider_account_id,
       status, connected_at
FROM control.client_connections;
-- No token secret IDs, no expiry internals exposed.
```

RLS on this view: a client (via their Supabase Auth session) may `SELECT`
only rows where `client_id` matches their authenticated identity — the same
`clients_select_own`-style policy pattern the teammate's reference build
already validated (Part 2).

---

# PART 5 — OAuth Flow (Primary: Supabase Edge Functions)

## 5.1 Flow Diagram

```
Client Dashboard: clicks "Connect Google Calendar"
   ↓
Edge Function: oauth-initiate
   → reads control.oauth_apps for 'google' → client_id, redirect_uri, scopes
   → generates random state UUID
   → inserts control.oauth_state {state, client_id, category, provider}
   → builds provider's authorization URL
   → redirects browser to provider's consent screen
   ↓
Client approves on Google's/Calendly's/etc. own consent screen
   ↓
Provider redirects back to: Edge Function: oauth-callback
   ?code=...&state=...
   ↓
Edge Function: oauth-callback
   → looks up control.oauth_state by state → recovers client_id, category,
     provider (if not found: redirect to dashboard with ?error=invalid_state)
   → reads control.oauth_apps for client_secret (via Vault RPC)
   → POSTs to the provider's token endpoint: exchanges code for
     access_token + refresh_token
   → (Google only) calls userinfo endpoint to get the connected account's
     email, for provider_account_id
   → stores both tokens via vault.create_secret() (Part 4.4)
   → UPSERTs control.client_connections (respecting the one-per-category
     UNIQUE constraint — a re-connect replaces the existing row)
   → deletes the used control.oauth_state row
   → redirects browser back to the dashboard with a success indicator
```

## 5.2 Correction to a Known Gap in the Reference Build

The teammate's build used a URL query param (`?connected=1`) as the
frontend's only signal of success — documented there as a known limitation
(cosmetic only, doesn't survive a hard refresh). **This document specifies
instead:** the dashboard re-queries `control.client_connections_display`
(Part 4.5) after redirect, using the real `status` column as the source of
truth, not a URL param. This is a direct, deliberate fix, not a
re-invention — the gap was already correctly diagnosed by the teammate's
own documentation.

## 5.3 `invalid_grant` Handling — Built In From the Start

The reference build's second documented known gap: no detection of a
revoked/expired refresh token, silently showing "not connected." **This
document requires:** any provider token-endpoint call (initial exchange,
or refresh — Part 6) that returns an OAuth error response sets
`control.client_connections.status = 'error'` or `'expired'` explicitly,
with the specific reason retained (e.g., in a short-lived log or a
`last_error` column — exact field TBD at Build Card time), so the dashboard
can render an accurate "Reconnect" prompt instead of a generic
"not connected" state.

---

# PART 6 — Token Refresh

## 6.1 Mechanism

Not on every API call (unlike the reference build's simpler "refresh on
every request, no caching" approach) — that pattern is fine for a low-
volume dashboard fetch, but real Tool execution (`CreateAppointment`,
`SendEmailReply`, etc.) may fire frequently and shouldn't add an extra
round-trip to every single Tool call. Instead:

```
New scheduled n8n workflow (SCH-{NNN}, per Workflow Spec Part 8's pattern):
   "Token Refresh Sweep"
   ↓
Runs periodically (interval TBD at Build Card time)
   ↓
Queries control.client_connections WHERE token_expires_at < (now + buffer)
   ↓
For each due connection:
   → fetches refresh_token via Vault RPC
   → calls the provider's token refresh endpoint
   → on success: updates access_token_secret_id (new Vault secret) +
     token_expires_at
   → on failure (invalid_grant): sets status = 'expired', per Part 5.3
```

## 6.2 Credential Resolver — the n8n-Side Read

A new utility, referenced but not yet specified in
`n8n_Workflow_Specification_v1.md` (flagged as a Change Request, Part 12) —
this is the mechanism every provider branch (`External_Integration_Strategy_v1.md`
Part 5.1) actually calls:

```
Business Workflow (e.g., CreateAppointment, WF-003)
   ↓
Schema Resolver (existing, UTIL-001) → client_schema_name
   ↓
Credential Resolver (NEW):
   → queries control.client_connections for this client_id + category
   → if status != 'connected' → this IS a Tool Execution Fallback
     trigger (Part 7), not a normal continuation
   → fetches access_token via Vault RPC (already fresh, per 6.1's sweep —
     no refresh-on-read needed in the normal path)
   ↓
Provider Router branch (per External_Integration_Strategy_v1.md Part 5.1)
   → builds Authorization: Bearer {token} header
   → calls the provider's API
```

This is the single missing piece that makes the whole
Capability → Router → Provider Branch pattern actually executable — Part 5
of the Integration Strategy named the pattern; this document supplies the
credential-fetch step that pattern depends on.

## 6.3 Audit Log — "Black Box" Record, Every Event, No Guessing

Flagged as insufficient in the earlier draft (a bare `status` field and a
vague "log OAuth events" line, Part 10.6). This is a real, separate
requirement: **every state change to a connection must be recorded with
enough detail that nobody ever has to guess why access stopped working.**

### `control.connection_audit_log` — new table

```sql
log_id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
connection_id      uuid NOT NULL REFERENCES control.client_connections(connection_id)
client_id            uuid NOT NULL REFERENCES control.clients(client_id)
event_type              text NOT NULL
   -- 'connected' | 'token_refreshed' | 'token_refresh_failed' |
   -- 'revoked_by_client' | 'revoked_by_provider' | 'revoked_by_zenny' |
   -- 'expired' | 'reconnected' | 'method_switched' | 'scope_changed' |
   -- 'error'
auth_method             text NOT NULL
   -- 'oauth' | 'api_key' — recorded per event (not just derivable from
   -- the CURRENT row state, Part 4.2.1) so the log clearly shows which
   -- method was active AT THE TIME of each historical event, even after
   -- a later method_switched event changes what's currently stored.
   -- Per your instruction: entries read plainly, e.g. "OAuth - connected",
   -- "API - token_refresh_failed" — the method is always visible in the
   -- event itself, never left to be inferred.
actor                     text NOT NULL
   -- 'client' | 'system_scheduled_refresh' | 'system_credential_resolver' |
   -- 'provider_webhook' | 'zenny_admin' | 'unknown'
reason                       text
   -- the RAW error/response from the provider where available
   -- (e.g. 'invalid_grant: Token has been expired or revoked') —
   -- never a paraphrase, the actual returned message
triggered_by_tool_call_id       uuid  -- references tool_call_log.call_id,
                                       -- IF this event was discovered
                                       -- during a Tool execution attempt,
                                       -- so the specific failed customer
                                       -- interaction is traceable
occurred_at                        timestamptz NOT NULL DEFAULT now()
```

**Every one of the following writes a row here — no exceptions, no
silent transitions:**

```
Client clicks Connect, succeeds        → 'connected', actor='client'
Scheduled sweep refreshes a token       → 'token_refreshed',
                                          actor='system_scheduled_refresh'
Scheduled sweep's refresh attempt fails  → 'token_refresh_failed',
                                          actor='system_scheduled_refresh',
                                          reason=<raw provider error>
Credential Resolver hits invalid_grant    → 'revoked_by_provider' (this is
    mid-Tool-execution                       the "we didn't do it, they did"
                                             case — client revoked from
                                             Google's own security settings,
                                             or Shopify uninstall, etc.),
                                          actor='system_credential_resolver',
                                          reason=<raw provider error>,
                                          triggered_by_tool_call_id=<the
                                          specific Tool call that surfaced it>
Client disconnects from Zenny's dashboard  → 'revoked_by_client',
                                            actor='client'
A human on the Zenny side manually revokes  → 'revoked_by_zenny',
   (support action, security response)         actor='zenny_admin'
Provider sends a deauthorization webhook       → 'revoked_by_provider',
   (Shopify/Slack support this; confirm         actor='provider_webhook'
   per-provider at Build Card time)
```

**Design principle: `reason` always holds the actual returned error, not an
interpretation.** If Google returns `invalid_grant: Token has been expired
or revoked`, that exact string is stored — never rewritten as "token
expired" or "unknown error." This is the "no guessing" requirement,
enforced structurally: anyone reading this table later sees exactly what
the provider said, not someone's summary of it.

**This table is retained, not purged** — an aeroplane black box isn't
useful if old entries get deleted. No automatic cleanup job removes rows
from `connection_audit_log` (contrast with `control.oauth_state`, Part
10.4, which *is* short-lived by design). Retention policy/archival beyond
"never auto-delete" is a later operational decision, not made here.

## 6.4 Alert System — Immediate, Not Batched

**Every `revoked_by_provider`, `revoked_by_zenny`, or
`token_refresh_failed` event triggers an immediate alert — not a daily
digest, not something the client discovers when a booking silently fails.**

```
Audit log event written (Part 6.3)
   ↓
IF event_type IN ('revoked_by_provider', 'revoked_by_zenny',
                   'token_refresh_failed')
   ↓
   TWO alerts fire, not one:
   1. TO THE CLIENT — via their configured notification_option
      (External_Integration_Strategy_v1.md Part 6.2): "Your {provider}
      connection for {category} has stopped working. Reason: {reason}.
      Reconnect here: {dashboard link}." Plain language, not the raw
      provider error verbatim to the client — but the raw error IS what's
      stored in the log (6.3) for Zenny's own diagnosis.
   2. TO ZENNY (internal, via UTIL-004 Notification Router or an
      equivalent internal channel) — includes the raw `reason`, the
      `client_id`, the `provider`, and whether a Tool call was actively
      failing because of it (`triggered_by_tool_call_id`), so this is
      diagnosable immediately, not discovered later from a client
      complaint.
```

**This is not the same mechanism as Part 7's Tool Execution Fallback** —
that governs what the *customer* experiences in the moment (their booking
still gets captured via the dashboard-approval degrade path). This Part
governs what the *client* (business owner) and *Zenny* are told, which is a
separate, mandatory, parallel notification — a customer's booking
degrading gracefully does not excuse the client from being told their
integration just broke.

## 6.5 Relationship to Token Refresh (6.1) and Fallback (7)

```
Token Refresh Sweep (6.1) attempts a refresh
   ↓
SUCCESS → 6.3 logs 'token_refreshed', no alert (normal operation)
FAILURE → 6.3 logs 'token_refresh_failed' + reason
           → 6.4 alerts fire immediately (client + Zenny)
           → control.client_connections.status set to 'expired' (Part 5.3)
           → next Tool call needing this connection triggers Part 7's
             Tool Execution Fallback (degrade to dashboard-request), NOT
             a raw failure to the customer
```

This closes the loop precisely: refresh failing is caught proactively by
the sweep (not discovered only when a customer's booking fails), logged
with the real reason, alerted immediately, and any subsequent Tool call is
already routed through the graceful degrade path rather than surfacing a
technical error mid-conversation.

---

# PART 7 — Tool Execution Fallback (New Pattern)

## 7.1 Why This Is Distinct From Fallback Pattern A/B/C/D

Flagged during earlier discussion, formalized here. The existing Fallback
Pattern Catalog (`n8n_Execution_Architecture_v1.md` / Integration Contract)
governs **business-outcome failures** — no slot available, validation
failed, needs a human. It does not cover a **technical, provider-level
failure** happening underneath a Tool call, before any business outcome is
even determined — a Google API timeout, a Shopify rate limit, a token that
turns out to be revoked mid-flow.

## 7.2 The Pattern

```
Provider API call fails (via the Router branch, External_Integration_
Strategy_v1.md Part 5.1)
   ↓
Is it Retryable? (network timeout, 5xx, rate limit — HTTP-level, not
   business-level)
   YES → one silent retry (Integration Contract Part 10's existing pattern)
          → still fails → escalate as below
   NO (401/invalid_grant, 403 scope error) → escalate immediately
   ↓
Tool Execution Fallback (NOT the same as Fallback Pattern A/B/C/D):
   1. If the failure is a credential problem (invalid_grant, revoked) →
      set control.client_connections.status accordingly (Part 5.3), then
      degrade: capture the customer's request into Zenny's own dashboard
      queue instead of completing agentically — the customer experience
      should read as "confirming this for you," never as a technical error
      (this reuses the SAME dashboard-approval mechanism already frozen
      for Ecommerce, External_Integration_Strategy_v1.md Part 6.1, and
      available as Emergency's dashboard_request mode, Part 6.4 — not a
      new mechanism, a reused one)
   2. If no degrade path exists for this Tool → escalate via NotifyHuman
      (maps into Fallback Pattern D at the conversational layer)
```

## 7.3 Relationship to Notification

A credential entering `'error'`/`'expired'` status should also trigger an
internal Notification (per `External_Integration_Strategy_v1.md` Part 6.2's
`notification_option`) to the client — they need to know to reconnect,
independent of whatever the customer-facing fallback did in the moment.

---

# PART 8 — Per-Provider OAuth App Registration

Building directly on `External_Integration_Strategy_v1.md` Part 8's
research — restated here in the form this document needs (what to actually
configure), not re-researched.

## 8.0 Credential Summary — What Gets Saved, Per Provider

| Provider | Zenny registers once (`control.oauth_apps`) | Per-client, saved automatically after Connect (`control.client_connections` + Vault) |
|---|---|---|
| Google (Calendar+Gmail) | Client ID, Client Secret | access_token, refresh_token |
| Shopify | Client ID, Client Secret | access_token (long-lived, Authorization Code Grant — Part 8.2) |
| Slack | Client ID, Client Secret | Bot Token (`xoxb-...`) |
| Calendly | Client ID, Client Secret (if OAuth) | access_token, refresh_token |
| Cal.com | Client ID/Secret (if OAuth) or nothing (if API-key based) | access_token+refresh_token, OR a client-pasted API key |
| WooCommerce | **Nothing — no Zenny-side app exists** (Part 8.3) | Consumer Key + Consumer Secret, entered manually by the client, no OAuth involved |

WooCommerce is the one structural exception in this table — every other
provider follows the same one-shared-app, many-client-installs shape.

## 8.1 Google (Calendar + Gmail — one shared app)

- One Google Cloud project, one OAuth 2.0 Client (Web Application type).
- Redirect URI: the Edge Function's callback URL (not an n8n webhook URL,
  correcting the reference build's n8n-based redirect URI).
- Scopes: full read/write for both Calendar and Gmail (not `readonly` —
  the reference build's test scopes are insufficient for real Tools:
  `CreateAppointment`, `SendEmailReply` both need write).
- **Start in Testing mode now** (per your confirmed decision) — up to 100
  test users, each client added individually while verification proceeds
  in parallel as its own tracked workstream (not part of this document's
  scope — an operational task, per earlier discussion).
- Verification (2–6+ weeks, possibly requiring annual CASA assessment if
  write-scope Gmail access lands in the restricted tier) — tracked
  separately, does not block build/test work per your decision.

### 8.1.1 The 7-Day Testing-Mode Refresh Token Expiry — No Backend Workaround

**Confirmed via research, verified as a hard platform rule, not a
limitation of this design:** while a Google Cloud OAuth app is in Testing
status, Google **revokes every refresh token exactly 7 days after the
grant**, regardless of use, regardless of whether it was refreshed earlier
in that window. Refreshing at day 6 does not reset the clock — the
original grant's age is what's tracked, not the token's individual
freshness. There is no API-based or backend workaround; the only
documented fix is completing Google's verification and switching the
project's Publishing Status from Testing to Production (a manual, UI-only
toggle — confirmed there is no API to automate even that step). This is
independently confirmed by multiple production teams who attempted exactly
this workaround and hit the same hard wall.

**Consequence for this document's design, made explicit rather than left
as background risk:**

```
control.client_connections gets one additional derived concern (not a new
   column necessarily — exact implementation TBD at Build Card time, but
   the LOGIC must exist):
   ↓
   IF provider = 'google' AND control.oauth_apps.app_status = 'testing'
      → this connection is subject to the 7-day hard expiry
      → the Token Refresh Sweep (Part 6.1) must treat this as a DIFFERENT
        case from a normal refresh-nearing-expiry check — a normal refresh
        succeeds silently; a Testing-mode Google connection nearing day 7
        CANNOT be silently refreshed and WILL require the client to
        physically reconnect
      → PROACTIVE alert (Part 6.4's mechanism, but fired BEFORE failure,
        not after): notify the client at ~day 5-6, "Your Google
        connection will need to be reconnected soon to avoid
        interruption" — giving them a window to act before the hard cutoff,
        not just a reactive "it broke" message after the fact
   ↓
   Once control.oauth_apps.app_status flips to 'published' (verification
      complete) for 'google' → this entire proactive-reminder mechanism
      becomes inert for all Google connections going forward — worth a
      code comment or equivalent marking it as temporary, Testing-mode-
      only logic, not permanent architecture, so a future maintainer
      doesn't mistake it for a permanent design requirement.
```

This is real, unavoidable operational overhead for every Google-connected
client during the verification-pending period — not a corner case, a
certainty, recurring every 7 days per client, for however many weeks
verification takes. Flagged here explicitly so it's budgeted for
(support load, client communication) rather than discovered the first time
a client's calendar integration silently goes dead mid-week.

## 8.2 Shopify (shared app, standard Authorization Code Grant — corrected)

**Correction to an earlier assumption in this document's drafting process:**
Shopify's old "Custom App" workflow (merchant copies an access token
directly from their admin panel) was discontinued in late 2025. The current,
correct mechanism is Shopify's standard **Authorization Code Grant** flow —
structurally identical to Google's OAuth pattern, not a per-client app
registration:

```
One Zenny-owned Shopify app (registered once, Shopify Partner/Dev
   Dashboard) — one Client ID + Client Secret, shared across all clients
   ↓
Client clicks "Connect Shopify" in Zenny's dashboard
   ↓
Redirected to: https://{their-store}.myshopify.com/admin/oauth/authorize
   ?client_id={Zenny's shared Client ID}&scope=...&redirect_uri=...&state=...
   ↓
Client approves an "Install Zenny App" screen on their own store
   ↓
Standard code exchange (Edge Function, Part 5) → long-lived access_token
   (Authorization Code Grant tokens do not expire until the client
   uninstalls the app — confirmed via research; this is the flow to use,
   NOT the separate Client Credentials Grant, whose tokens expire every
   24 hours and would require daily refresh for no benefit here)
```

**This resolves the schema question this document originally flagged as
open.** Shopify fits `control.oauth_apps`'s single-row-per-provider design
exactly like Google — one shared row, many per-client tokens in
`client_connections`. No client-specific variant of `oauth_apps` is needed.
The client never sees or handles a Client ID/Secret at all — identical
experience to connecting Google Calendar.

## 8.3 WooCommerce — Not OAuth, Manual Key Entry

**WooCommerce has no OAuth flow at all** — it is self-hosted WordPress, not
a centralized platform, so there is no "redirect, approve, callback"
experience possible. The client must generate **Consumer Key + Consumer
Secret** themselves, inside their own WooCommerce admin panel
(WooCommerce → Settings → Advanced → REST API), and paste both values into
Zenny's dashboard manually.

**Mechanism, distinct from every other provider in this document:**

```
Client dashboard: "Connect WooCommerce" → a plain form, not a redirect
   (Consumer Key field, Consumer Secret field, Store URL field)
   ↓
Client pastes in the two keys they generated on their own site
   ↓
Dashboard → Supabase (directly, or via a thin Edge Function for
   validation) → stores both values via Vault (same encryption mechanism
   as every OAuth token, Part 4.4), writes a control.client_connections
   row with category='ecommerce', provider='woocommerce'
   ↓
No control.oauth_apps row needed for WooCommerce at all — there is no
   Zenny-side app to register; Consumer Key/Secret are entirely
   client-generated and client-specific from the start
```

**Flagged requirement, not resolved by this document:** because this is a
manual, multi-step process happening entirely on the client's own
WordPress site (navigating their admin panel, finding the REST API
settings, generating keys, copying them correctly), the **client onboarding
guide** (a separate deliverable, not this document) must include a
detailed, step-by-step walkthrough for this specific task — screenshots or
equivalent — since there is no "click one button" experience to fall back
on the way there is for every OAuth-based provider. This is a real support-
burden difference between WooCommerce and every other provider in this
document, and should be treated as such when the onboarding guide is
written.

## 8.4 Slack (shared app, no review gate)

- One Zenny-owned Slack app, standard "Add to Slack" OAuth v2 button.
- Scope: `chat:write` only (per `External_Integration_Strategy_v1.md` Part
  6.2's confirmed reduced scope).
- No verification/review process — confirmed via research.

## 8.5 Calendly and Cal.com

**Calendly — confirmed via research, no review gate.** Self-service:
register a developer account, create an OAuth app (Sandbox for testing,
Production when ready), select scopes, done — no waiting period, no human
review team involved. Access tokens are short-lived (2 hours), but refresh
tokens do not expire until actually used/revoked — no equivalent of
Google's 7-day trap.

**Cal.com — confirmed via research, DOES require manual human approval,
no published timeline.** This is a real, meaningfully different risk
profile from every other provider in this document: after registering an
OAuth client, it sits in a `"pending"` state, fully unusable, until "an
admin from Cal.com" reviews and either accepts or rejects it by email — no
documented SLA anywhere found, unlike Google's stated 2–6 week estimate.

**Decision, confirmed:** keep Cal.com in v1 as planned — submit the OAuth
app for review now, in parallel with everything else, same principle as
Google's verification (start early, don't let it become a bottleneck
discovered late). **If approval does not come, or is significantly
delayed:** migrate to Cal.com's API-key-based authentication instead of
OAuth (Cal.com supports both; Bearer API key is the client-provided-secret
path, avoiding the review gate entirely — mechanically similar to
WooCommerce's manual-paste flow, Part 8.3, rather than a Connect-button
OAuth flow).

### 8.5.1 General Principle: API-Key Fallback Where Available

Per your instruction, generalized rather than left as a Cal.com-only
note: **for any provider where a direct API-key or token-based
authentication method exists as a genuine alternative to OAuth, that path
should be documented as a standing fallback** — not built by default, but
available to switch to if the OAuth path proves unreliable, slow, or
blocked, the same way Part 11 documents an n8n-webhook fallback for the
Edge Function mechanism itself. This is the same risk-mitigation pattern
applied one layer down: primary path (OAuth, best UX, one-click) with a
documented, ready secondary path (API key, worse UX but no external
dependency on a review process) for providers where Zenny doesn't control
the timeline.

**Applies concretely to:**
- **Cal.com** — Bearer API key, if OAuth approval stalls (this section).
- **Calendly** — Personal Access Token exists as an alternative to OAuth,
  though not currently needed given Calendly has no review gate; worth
  keeping documented rather than assuming OAuth will always be preferable.
- **Google, Shopify, Slack** — no meaningful API-key alternative exists for
  these (Google requires OAuth for any user-data access; Shopify's and
  Slack's models are OAuth-native) — this fallback principle does not apply
  to them, noted here so it's clear the omission is deliberate, not
  overlooked.

---

# PART 9 — Convocore-Related Fields (Flagged, Not Added)

Per your explicit instruction across this project: `convoId` and `origin`
storage (needed for Recovery's channel re-engagement,
`External_Integration_Strategy_v1.md` Part 6.3) is **not** added by this
document. Noted here only because `control.client_connections`' shape
(Part 4.2) was deliberately designed to be extensible — a future Convocore-
linkage table would follow the same `control`-schema, `service_role`-only,
`client_id`-referencing pattern already established here, not a new
convention.

---

# PART 10 — Security Requirements

Directly inherited from the reference build's validated model (Part 2),
extended where this platform's larger scope requires it:

1. OAuth `state` parameter validated and single-use (Part 4.2, Part 5.1) —
   proven pattern, reused as-is.
2. Tokens never reach the browser — Vault-encrypted, `service_role`-only,
   dashboard queries only the narrow display view (Part 4.5).
3. Client identity via Supabase Auth JWT verification (`/auth/v1/user`),
   never a URL parameter — proven pattern (Part 2), reused as-is.
4. `client_connections`'s `UNIQUE (client_id, category)` constraint
   database-enforces the single-provider-per-category rule — not just an
   application-level check.
5. **New requirement beyond the reference build:** rate limiting on Edge
   Functions — the reference build's n8n webhooks had none, flagged there
   as a known gap; Supabase Edge Functions support this more naturally and
   it should be enabled from the start, not retrofitted.
6. **Superseded by Part 6.3's `connection_audit_log`** — every OAuth event
   (initiate, callback success, callback failure, refresh success, refresh
   failure, revocation of any kind) is logged there in full detail, never
   just a generic "logged" line. Raw token values are never written to any
   log, including this audit table — only the token's *secret ID* reference
   or a raw provider error *message* is ever stored, never the token itself
   (Supabase's own Vault-logging caution: raw `INSERT` statements can
   appear in Supabase's own logs, so token values must never be passed
   through a logged statement directly).
7. Google scopes are write-capable (Part 8.1) — a materially higher-
   sensitivity grant than the reference build's read-only proof of
   concept, meaning the consequences of a token leak are correspondingly
   higher. No token, at any point in any flow (Edge Function, n8n,
   dashboard), is ever written to plaintext logs.

---

# PART 11 — Fallback Mechanism: n8n Webhook-Based OAuth

**Not built by default.** Documented here as a ready reference in case
Part 5's Edge Function approach fails during testing or with the first
live client, per your explicit instruction to keep both, with one primary.

**Scope, corrected:** this fallback applies only to the OAuth-based
providers — Google, Shopify (per the corrected shared-app model, Part 8.2),
Slack, Calendly, Cal.com. **WooCommerce is out of scope for this fallback
entirely** — Part 8.3 established that WooCommerce has no OAuth flow to
begin with (manual Consumer Key/Secret entry, a plain form write to
Supabase), so there is nothing about it that could fail in a way an
"OAuth fallback" would address. If WooCommerce's manual-entry form itself
needs a fallback mechanism, that's a frontend/dashboard reliability
question, unrelated to this Part.

The reference implementation is the teammate's own tested build
(`zenny-dashboard-test-only_gmail_calender_-doc.md`), directly reusable
with the following adaptations if activated:

- Redirect URI changes from the Edge Function's URL to an n8n webhook path
  (`/webhook/zenny/oauth/callback`, matching the reference build's naming).
- `control.oauth_state`/`control.oauth_apps`/`control.client_connections`
  (Part 4) are reused as-is — only the *handler* changes from Edge Function
  to n8n workflow, not the schema. This holds for Shopify too, now that
  Part 8.2's correction confirms Shopify uses the same shared-app,
  `oauth_apps`-row pattern as Google — the fallback's schema-reuse claim
  was written before that correction and is now fully accurate rather than
  partially so.
- The reference build's 4-workflow structure (`oauth-start`, `oauth-
  callback`, plus one read-workflow per provider category) is the direct
  template — proven to work for Google; would need replication per
  additional OAuth provider (Calendly, Cal.com, Shopify, Slack) if this
  path is ever activated.
- **Known limitations already documented in the reference build** (Part
  2) — `?connected=1` fragility, no `invalid_grant` detection, no rate
  limiting — would need to be fixed as part of activating this fallback,
  not inherited as-is, per the same standard this document holds the
  primary path to (Parts 5.2, 5.3, 10.5).

**Switching condition:** a real, encountered failure in testing or with an
actual client — not a preference switch, per your explicit instruction.

---

# PART 12 — Impact on Frozen Documents (Change Requests Raised)

1. **`n8n_Workflow_Specification_v1.md`** — needs a new utility entry: the
   Credential Resolver (Part 6.2 of this document), alongside the existing
   5 canonical utilities (Schema Resolver, Data Validator, Error Logger,
   Notification Router, Stop Checker). This is a 6th utility, not a
   variant of an existing one — requires an ID (`UTIL-006`, per the
   Workflow Spec's own ID convention, Part 3.1) and a Utility Ownership
   Matrix entry (Part 6.0.1).
2. **`n8n_Workflow_Specification_v1.md` Part 8** (Scheduled Workflows) —
   needs a new entry: "Token Refresh Sweep" (Part 6.1 of this document),
   a new `SCH-{NNN}` ID.
3. **`INTEGRATION_CONTRACT_v1.md` Part 9** (Error Contract) — the Tool
   Execution Fallback (Part 7 of this document) is a new failure-handling
   layer sitting beneath the existing Fallback Pattern Catalog; the
   Integration Contract's Error Contract section should reference this
   document rather than being silently bypassed by it.
4. **`Database_Structure_v4_FINAL.md`** — 4 new `control` tables
   (`oauth_apps`, `client_connections`, `oauth_state`,
   `connection_audit_log` — Part 6.3) plus 1 view
   (`client_connections_display`), all specified in Part 4 and Part 6.3.
   Optionally, a 5th table (`provider_status_board`, Part 4.2) — purely a
   manual convenience aid, not load-bearing, build only if useful.
   **Not added by this document** — goes through
   `Template_Migration_Process.md`, and per your established sequencing
   this can proceed independently of the Convocore-related migration (Part
   9), since none of these tables depend on Convocore fields.
5. **`External_Integration_Strategy_v1.md` Part 6.1** (Ecommerce) — that
   document names Shopify and WooCommerce as a pair without distinguishing
   their fundamentally different connection mechanisms (Shopify: full
   OAuth, one-click; WooCommerce: manual key entry, no OAuth at all, per
   Part 8.3 of this document). That document's Part 6.1 should be updated
   to note this asymmetry, since it affects the onboarding guide and the
   client-facing Connect experience materially differently per provider.

---

# PART 13 — Open Items Carried Forward

1. ~~Shopify's per-client Custom App vs. shared `oauth_apps` row~~ —
   **RESOLVED** during document review: Shopify's Custom App token
   workflow was discontinued; the correct mechanism is the standard
   Authorization Code Grant (Part 8.2), identical in shape to Google's
   flow. No longer an open item.
2. ~~Calendly/Cal.com's exact review/verification requirements~~ —
   **RESOLVED via research:** Calendly has no review gate (self-service).
   Cal.com requires manual human admin approval, no published timeline
   (Part 8.5) — kept in v1 per your decision, with a documented API-key
   fallback if approval stalls (Part 8.5.1).
3. **Token Refresh Sweep's interval** (Part 6.1) — not decided, consistent
   with this project's discipline of not inventing timing values
   speculatively (matches Workflow Spec Part 12.2's stance on Tool
   timeouts).
4. **`last_error`/error-reason field's exact shape** (Part 5.3) — flagged
   for Build Card time.
5. ~~Calendly/Cal.com: OAuth vs. Personal Access Token / API key as the
   default connect method~~ — **RESOLVED:** OAuth is the default/primary
   for both; API-key is a documented fallback (Part 8.5.1), not a default
   choice between the two.
6. **Convocore `convoId`/`origin` storage** — deferred per your
   instruction (Part 9), tracked here for visibility, not solved here.
7. **WooCommerce onboarding guide requirement** (Part 8.3): the
   client-facing onboarding guide (a separate deliverable — not this
   document, not yet written) must include a detailed, step-by-step,
   screenshot-level walkthrough for generating WooCommerce Consumer
   Key/Secret, since this is the one provider in this document with no
   one-click Connect experience. Flagged here so it is not lost by the
   time the onboarding guide is actually written.
8. **Provider deauthorization webhooks** — **partially resolved via
   research:** Shopify's `app/uninstalled` webhook exists but is
   documented as unreliable in practice (multiple independent developer
   reports of inconsistent firing); Shopify's own guidance recommends
   using it *in combination with* watching for 401/403 responses — which
   the Credential Resolver (Part 6.2) already does regardless. **This
   means reactive detection (401 → `revoked_by_provider`) is not a weak
   fallback, it's the recommended primary mechanism even for providers
   that offer a webhook.** Google, Calendly, Cal.com, and Slack's
   equivalent webhooks (if any) remain unconfirmed — verify per provider
   at Build Card time, but do not treat any webhook as sufficient on its
   own even once confirmed to exist.
9. ~~Practitioner/specialist/team-level availability~~ — **RESOLVED, not
   a gap:** confirmed as a deliberate v1 scope decision (not this
   document's concern directly, but referenced here for completeness) —
   v1 offers only direct-calendar booking or dashboard-request booking,
   no per-staff-member routing. See
   `External_Integration_Strategy_v1.md` Part 3.2 / Workflow Spec Part
   7.3 for the authoritative closure of this item.

---

```
ZeroManual · Zenny AI Workforce · Client Integration & Credential Platform v1
Resolves Architecture Breakthrough Report v1, Problem 3.
Built against: External_Integration_Strategy_v1.md, Database_Structure_v4_FINAL.md,
INTEGRATION_CONTRACT_v1.md, n8n_Workflow_Specification_v1.md,
AI_Builder_Operating_Manual_v1.md, and zenny-dashboard-test-only_gmail_calender_-doc.md
(validated teammate reference build). Supabase Vault mechanism and Edge Function
pricing verified via live web research, 2026-07-18 through 2026-08-01.
```
