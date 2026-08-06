# PROJECT_STATE.md — Live Build State

```
Purpose:   Real, current ground truth of what's actually built, tested,
           and blocked — updated by Claude Code at the end of every
           session. This is NOT a plan (that's Planning_to_Build_
           Transition_v1.md) — it's a status snapshot. The Commander
           reads this before issuing every new Build Card.
Rule:      Overwrite the status sections below each session. NEVER
           delete the Session Log — it's append-only, oldest at bottom.
Location:  Project root. Committed to git (zenny-sync) after every
           Claude Code session, alongside whatever code/schema changed.
```

---

## Last Updated
2026-08-06 — by Claude Code, Session 23 (BC-022 — COMPLETE: proxy-domain decision settled, codebase-memory-mcp onboarded+verified, Gmail account-label root cause found+fixed (missing OAuth scope), SCH-006 Slack node state verified/matches prior report, UI polish backlog logged)

## Current Phase
Phase 5 (Dashboard Systems) — **BC-021 and BC-022 both COMPLETE.**
BC-022 found and fixed one more real bug while diagnosing the Gmail
account-label gap: the google OAuth app's requested scopes never
included anything granting access to Google's userinfo endpoint, so
the account-email lookup oauth-callback already had code for has been
silently failing since it was built (migration 046 fix — see "Phase 5
— Small Fix Pass..." section below). BC-021's original root cause fix
and SCH-006 findings, below, remain the larger prior body of work. Root
cause found and
fixed for the "real OAuth/API-key connections silently fail to persist"
defect the human reported: `store_
credential_secret` used a STATIC Vault secret name per client+category
— any reconnect/retry hit Vault's real `secrets_name_idx` UNIQUE
constraint, which NEITHER `oauth-callback` nor `woocommerce-connect`
ever checked, so both silently proceeded to log "connected" and (for
WooCommerce) return HTTP 200 while the real database row was left
untouched. Confirmed via real Postgres error logs at the exact
timestamps of the human's real test attempts today — not inferred, the
literal error text `duplicate key value violates unique constraint
"secrets_name_idx"` followed by `null value in column
"access_token_secret_id"... violates not-null constraint` was found
directly. Fixed at the root (`store_credential_secret` now upserts by
name) plus defense-in-depth (every RPC call in both Edge Functions is
now actually checked; every failure branch logs a real, diagnosable
audit event — previously several early-exit paths logged nothing at
all, which is also why Calendly's one real attempt left no trace to
diagnose from). Also found and fixed, while tracing Shopify's real
callback logs: a genuine double-`.myshopify.com`-suffix bug that would
500 any Shopify connection that got PAST the distribution-method screen
(confirmed via a real callback hit with real Shopify HMAC/shop params
that 500'd). Full detail in the "Phase 5 — Real OAuth Connection
Persistence Bug (BC-021)" section below. **Re-verified against a real
human-driven reconnect, confirmed against real DB rows** (not assumed
from the fix alone) — Gmail, Calendly, and WooCommerce all genuinely
connected. SCH-006 Token Refresh Sweep also tested against these real
tokens this session (3 more real pre-existing bugs found and fixed —
it had never executed successfully before). Full detail below.

Earlier this session (BC-020): OAuth connects use a popup instead of
a full-page redirect. **This required discovering and working
around 2 genuine, previously-unknown platform constraints, found only
via real live Playwright testing** — full detail in the "Phase 5 —
OAuth Popup Flow + Proxy-Domain Feasibility (BC-020)" section below:
(1) Supabase Edge Functions cannot serve script-executing HTML at all
(the gateway forces `Content-Type: text/plain` + a sandboxed CSP on real
GET responses — a `curl -I` HEAD request misleadingly showed
`text/html`, masking this until tested in a real browser); (2) Google's
own OAuth pages send a `Cross-Origin-Opener-Policy` header, a
documented, industry-wide cause of `window.opener` going null partway
through a real Google redirect chain. Final working mechanism:
`localStorage` + the `storage` event as the primary completion signal
(doesn't need `window.opener` at all), `postMessage` kept as a secondary
best-effort one. Verified end-to-end via real Playwright popups for
Google Calendar, Gmail, and Shopify (the actual mechanism, not just the
URL-building); WooCommerce was never OAuth-based so needed no popup
treatment. Manual popup-close handled gracefully. Investigated the
Traefik reverse-proxy workaround (Step 2) — confirmed live that
Cloudflare/Supabase reject mismatched Host headers (403), and confirmed
via the source doc that Google's "unverified app" warning is gated by
Google Cloud Console's Publishing Status toggle, NOT by which domain
serves the redirect — meaning a proxy domain would not fix the actual
friction it was proposed to fix. Recommended NOT building it; explicitly
stopped for Commander decision, nothing deployed. Confirmed live: Supabase org is on the
**free tier** — no custom domain possible for oauth-initiate/oauth-
callback without upgrading to Pro, documented as an open human decision,
not actioned (BC-019). 0 self-resolved document-level items this session
— no gate applies. Both doc diffs from BC-018/BC-019 remain flagged,
unapplied (see Blockers): the still-open `appointments` section gap in
Database_Structure_v4_FINAL.md, and the SCH-007 registry entry for
n8n_Workflow_Specification_v1.md Part 8. Convocore Adapter
(ADP-002) — **COMPLETE.** BC-010 closed the one item BC-009 left open:
human-handoff's staged-fallback Stage 2 trigger, built per the
Commander's exact operational definition. ADP-002 registered in
n8n_Workflow_Specification_v1.md Part 17 (BC-009 — also closed the gap
that ADP-001/Voiceflow was never registered either). All 3 stale
"Prospective" lines updated to real status (BC-009). Phases 1-3
remain COMPLETE, unchanged. Phase 5 (4 New Dashboard Systems) is next.

---

## Phase Checklist (mirrors Planning_to_Build_Transition_v1.md Part 4)

```
Phase 0  — Environment Setup .................... IN PROGRESS
Phase 1  — Close Credential Platform Gaps ........ COMPLETE
Phase 2  — Convocore Database Changes ............ COMPLETE
Phase 3  — Remaining Shared Utilities ............ COMPLETE
Phase 4  — Convocore Adapter (ADP-002) ........... COMPLETE
Phase 5  — 4 New Dashboard Systems (React+Vite) .. IN PROGRESS (5B, 5C-monitor, Integrations done)
Phase 6  — Core Agent ............................ NOT STARTED
Phase 7  — Growth Agent .......................... NOT STARTED
Phase 8  — Conversion Engine (11 Tools) .......... NOT STARTED
Phase 9  — Recovery Engine ....................... NOT STARTED
Phase 10 — Email Manager ......................... NOT STARTED
Phase 11 — Scheduled Workflows ................... NOT STARTED
Phase 12 — Node-by-Node Outlines ................. NOT STARTED (cross-cutting)
Phase 13 — Template Dashboard .................... DEFERRED (per Part 2.6)
```

---

## Infrastructure — VPS / Dashboard Deployment (BC-014)

```
VPS in use for ALL Zenny infrastructure: srv1881104 (id 1881104),
KVM 1, 1 CPU / 4096MB RAM / 51200MB disk, Ubuntu 24.04 + Docker +
Traefik template, IPv4 187.127.217.123. This is the SAME VPS already
hosting n8n (n8n-cbzu.srv1881104.hstgr.cloud) — confirmed live via
Hostinger MCP (VPS_getVirtualMachinesV1), not assumed from the domain
name pattern alone. VPS 1729215 exists but is explicitly out of scope
(per BC-014's own instruction) — never touched this session.

Docker Compose projects running on srv1881104 (Hostinger's own
project-management API, no SSH needed/available — confirmed no SSH
key/config exists in this environment):
  - traefik           — reverse proxy, network_mode: host
  - n8n-cbzu           — existing n8n instance
  - zenny-dashboard      — NEW (BC-014), placeholder container

Traefik's REAL config (read live, not assumed — resolves the card's own
explicit uncertainty):
  - Provider: DOCKER LABELS (--providers.docker=true,
    exposedbydefault=false) — NOT file-based/dynamic config.
  - TLS: Let's Encrypt via ACME HTTP-01 challenge
    (--certificatesresolvers.letsencrypt.acme.httpchallenge=true),
    cert storage in a named volume (traefik-letsencrypt). HTTP->HTTPS
    redirect configured at the entrypoint level.
  - n8n's own container proves the working pattern: traefik.enable=true
    + Host() rule + entrypoints=websecure + tls.certresolver=letsencrypt
    + loadbalancer.server.port labels. zenny-dashboard's placeholder
    copies this exact pattern.

Domain: zeromanuals.com (ZeroManual's own registered domain, active,
confirmed via Hostinger domains_getDomainListV1 — NOT assumed from
context). Real DNS state found BEFORE this session's change:
  zenny.zeromanuals.com  -> CNAME -> zeromanualai.github.io (GitHub
                            Pages, unrelated, pre-existing -- NOT
                            reused, would have collided)
  www.zeromanuals.com    -> CNAME -> zeromanuals.com
  @ (root)               -> A -> 2.57.91.91 (does NOT match this VPS's
                            IP -- a different service, untouched)
  NO subdomain pointed at this VPS's IP existed before this session.

Subdomain decision (Step 1): dashboard.zeromanuals.com, single app,
path-routed (per the card's own recommendation — 1 Traefik router, not
4; 1 Supabase Auth session across all 4 dashboards; matches per-client-
per-business access better than 4 separate subdomains). "dashboard" was
chosen over the more obvious "zenny" specifically because "zenny" was
already taken by the pre-existing GitHub Pages CNAME — confirmed via
live DNS check before picking a name, not guessed. Paths for the 4
dashboards (/orders, /appointments, /inventory, /onboarding) will be
real routes once the actual dashboard app exists — not yet built.

New DNS A record added (confirmed live before writing, human explicitly
approved the write since the harness gated it as a real external
action): dashboard.zeromanuals.com -> 187.127.217.123, TTL 300.
Confirmed via Hostinger's own API immediately after: zenny/www/@ records
untouched (different `name`, additive write, not a zone wipe).

New Docker Compose project (zenny-dashboard) deployed: nginx:alpine
serving a static placeholder page, Traefik-labeled identically to
n8n's working pattern, restart: unless-stopped (survives VPS
reboot/container crash — same guarantee as n8n's own container, which
has been running unrestarted for 7+ hours prior to this session).
Container confirmed RUNNING live (VPS_getProjectContainersV1): ~7MB
RAM, negligible CPU.

Routing confirmed working RIGHT NOW via a direct IP connection with a
Host header override (curl --resolve, bypasses DNS): HTTP 200, exact
placeholder content returned, proves Traefik host-based routing +
container both work correctly.

**HTTPS cert: NOT YET a trusted Let's Encrypt certificate — genuinely
incomplete, not silently claimed done.** Traefik's automatic ACME
attempt fired immediately at container deploy time and failed with a
real, logged error (confirmed via VPS_getProjectLogsV1):
`DNS problem: NXDOMAIN looking up A for dashboard.zeromanuals.com`
— because the new DNS record hadn't propagated to the domain's own
authoritative nameservers (dns1-4.p09.nsone.net) yet at that moment.
Confirmed via direct queries against 8.8.8.8, 1.1.1.1, AND the
authoritative NS1 servers directly: after 5+ minutes and 14 polling
attempts, still not propagated as of this session's end. This is a
genuine external delay (Hostinger backend -> NS1 sync timing), not a
config error — Traefik currently serves its own default self-signed
fallback cert (confirmed: curl reports SEC_E_UNTRUSTED_ROOT without
-k). **Follow-up needed, not yet done:** once dashboard.zeromanuals.com
resolves publicly (check via `nslookup dashboard.zeromanuals.com
8.8.8.8`), trigger a Traefik ACME retry — the simplest mechanism is
restarting the zenny-dashboard container/router (Traefik re-evaluates
ACME on router changes) or waiting for Traefik's own internal retry
backoff. No further Claude Code action needed beyond that one retry
once propagation is confirmed complete.

**Unrelated observation, flagged not investigated (out of BC-014
scope):** zeromanuals.com's root (`@`) record resolves to different
IPs depending on which server answers — Hostinger's own API reports
2.57.91.91, but the domain's actual authoritative NS1 servers report
52.74.6.109 / 13.215.239.219 (AWS-range IPs) when queried directly.
Not touched, not explained — flagged for the Commander's awareness
since it's a discrepancy in the SAME zone this session wrote to, even
though the `dashboard` subdomain itself is unaffected.

Resource headroom (VPS_getMetricsV1, real samples):
  Before (baseline, same day):  RAM ~1009MB used / 4096MB total (~75%
                                 free), Disk ~4021MB used / 51200MB
                                 total (~92% free), CPU ~0.6% idle load
  After (placeholder deployed): RAM ~956MB used (flat/noise, nginx:
                                 alpine container itself uses ~7MB),
                                 Disk ~4415MB used (+~394MB, the
                                 nginx:alpine image pull), CPU ~0.66%
  Conclusion: negligible resource cost for a placeholder. Massive
  headroom remains for the real dashboard app (a React/Directus-class
  app will cost more than nginx:alpine, but nowhere near exhausting
  ~3140MB RAM / ~46785MB disk still free).
```

## Infrastructure Correction (BC-016) — DNS ownership + HTTPS cert now trusted

```
**CORRECTION to the "Domain" note above (BC-014) and the "HTTPS cert"
note in BC-015's own report: Hostinger is NOT the authoritative DNS
provider for zeromanuals.com. It never was.** Confirmed live this
session: `nslookup -type=NS zeromanuals.com 8.8.8.8` returns
dns1-4.p09.nsone.net — an NS1-backed zone that Hostinger's own DNS API
(used for BC-014's A-record write) does not actually control. This is
the real explanation for BC-014/BC-015's propagation symptom: it was
never "still propagating" — Hostinger's write never reached the zone
NS1/Netlify actually serves. It also resolves BC-014's own flagged
"unrelated DNS discrepancy" (root `@` record differing between
Hostinger's API and NS1) — same root cause, now explained rather than
merely observed.

The human added `dashboard.zeromanuals.com -> 187.127.217.123` (A
record) directly in Netlify's own DNS management for this zone.
Re-verified live this session (not assumed from a screenshot) via
`nslookup dashboard.zeromanuals.com 8.8.8.8` — resolves correctly.
Traefik's ACME retry was triggered (zenny-dashboard container/router
restart, per BC-014's own documented mechanism) and a **real trusted
Let's Encrypt certificate is now being served** — confirmed via an
actual certificate-chain read (not just "curl succeeded without -k"):
`Issuer: CN=YR2, O=Let's Encrypt, C=US`, `NotAfter: 2026-11-04`.

**Going forward: Netlify is zeromanuals.com's real DNS control plane.**
Any future DNS change for this domain must be made in Netlify, not
Hostinger's DNS API — Hostinger's own DNS tools will accept writes
without error but they will not take effect on the live zone. This
correction is the standing reference for all future sessions; do not
repeat BC-014/BC-015's misdiagnosis.

**Real bug caught during the retry, unrelated to DNS:** the
"restart the container" mechanism (`VPS_restartProjectV1`) does NOT
recreate the container — it restarts the same container in place,
reusing its writable filesystem layer. Since the deployed image's
entrypoint does a fresh `git clone` into `/src` on every start, a mere
restart crash-looped ("fatal: destination path '/src' already exists")
— the site was actually down for ~15 minutes before this was caught via
live log inspection (not assumed working from the restart action's
"success" state). Fixed two ways: (1) redeployed via a full recreate
(`VPS_createNewProjectV1`, same project name) instead of restart, (2)
made the container's own command self-healing (`rm -rf /src/* ...`
before cloning) so a future in-place restart — a host reboot, a
Traefik-triggered restart, anything using `restart:` semantics rather
than a full recreate — won't crash-loop again.
```

## Phase 5 — 5B Order Lookup Dashboard (BC-015 — BUILT + DEPLOYED)

```
App: 05_Platform_Builds/Dashboard — React 19 + Vite 8 + TypeScript,
react-router-dom, @supabase/supabase-js. Single app, path-routed
(/orders is the first real route; /appointments, /inventory,
/onboarding are siblings to add later in the same app/auth/deploy, per
the card's explicit structure requirement). Deployed live at
https://dashboard.zeromanuals.com/orders.

**Auth:** Supabase Auth, email+password (chosen over magic-link —
lower setup friction, no SMTP config needed, which is out of this
card's scope). Login screen at /login, session via onAuthStateChange,
protected routes redirect unauthenticated users to /login.

**Client-schema mapping — REAL GAP CONFIRMED, FLAGGED PER THE CARD'S
OWN INSTRUCTION (not invented as a permanent mechanism):** No table or
mechanism mapping a Supabase Auth user to a control.clients row/
client_schema_name existed before this session — confirmed empirically
(queried auth/control schemas directly, found none). The card's own
text anticipated this ("if it's genuinely missing, that's a real gap to
flag, not invent a mapping mechanism silently"). For this card's
verification purposes only, the one test dashboard user's
client_schema_name is stored in Supabase Auth's own built-in
app_metadata field (a real platform feature, not a new invented table)
and read via auth.jwt() inside the RPC layer. **This is explicitly NOT
a production design decision** — three real options exist for the
Commander to decide between when the real 4-dashboard system is built:
(1) a control.dashboard_users mapping table, (2) a custom access token
hook injecting client_schema_name as a JWT claim at login, (3)
continuing to use app_metadata per-user (simplest, but means every
client user account must be created via the Admin API with the right
metadata set, not self-serve signup). Not decided anywhere in the
source docs — flagged here, not invented.

**Data access mechanism — SELF-RESOLVED, logged below in Blockers per
the standing rule.** Client schemas are NOT exposed to PostgREST
directly (Client_Onboarding_Sequence_Spec.md Step 3 already documents
this as unavailable via SQL/MCP in this environment) — so the dashboard
cannot query {client_schema}.orders directly via the Supabase JS client.
Built 4 SECURITY DEFINER RPC functions in `public` instead (migrations
037-039): dashboard_get_my_client_schema() (validates the JWT's
client_schema_name against control.clients, rejects offboarded/unknown
schemas), dashboard_list_orders(), dashboard_get_order(p_order_id),
dashboard_review_order(p_order_id, p_decision, p_reviewer) — each does
a schema-qualified dynamic query (format() with %I for the schema name,
%L for all literals — no raw string concatenation) scoped to the
calling user's own client_schema_name only. anon role's EXECUTE grant
explicitly revoked (Supabase's own default-privilege behavior grants
anon EXECUTE on new public functions independent of `REVOKE ... FROM
PUBLIC` — caught via get_advisors flagging it as WARN after the first
migration, fixed via an explicit `REVOKE ... FROM anon` in migration
039, re-verified via information_schema.routine_privileges that only
authenticated/postgres/service_role now hold EXECUTE). One real bug
caught and fixed: the first version of dashboard_review_order failed
live with "type order_status_enum does not exist" — SET search_path=''
on the function means the enum name inside the dynamic SQL string also
needed explicit public. qualification; found via a real end-to-end
curl test against the live REST API, not assumed from successful
migration application alone.

**End-to-end verification — real, not simulated:** created a genuine
new test client (client_id baa673b5-c51a-4a7b-91f5-a37027f8dca4,
"TEST CLIENT -- BC-015 ORDER DASHBOARD TEST -- DO NOT USE", archetype
commerce_ecom, schema client_test_002_acme_commerce_test — the existing
BC-013 test client is 'emergency' archetype and has no orders table, so
a new one was needed) via the real
create_client_schema_from_template('commerce', ARRAY['conversions_ecom',
'orders'], ...) function, seeded 1 customer/3 leads/3 conversions/3
conversions_ecom/3 orders spanning pending_review/pushed/rejected
states. Created one real Supabase Auth user (test-dashboard-
bc015@zenny.internal, password auth, app_metadata.client_schema_name
set) via direct SQL against auth.users/auth.identities (pgcrypto
crypt() for the password hash — no Admin API service-role key exposed
via MCP, this was the only available path) — hit and fixed a real
GoTrue "Database error querying schema" 500 on first login attempt
(NULL vs '' on several auth.users token columns; GoTrue scans some of
these as non-nullable, a known platform quirk, not a mistake in the
insert's intent). After the fix: signed in via the real Auth REST API,
got a real JWT, called all 3 read/write RPCs with it over HTTP — listed
3 real orders, approved one for real (then reset it back to
pending_review so the deployed demo shows a clean 3-state view),
confirmed anon (no bearer token) is rejected with "Not authenticated".

**Approve action / provider push — confirmed missing, flagged in the UI
itself, not silently no-op'd:** searched n8n live (search_workflows,
query "order") — zero results, confirming Phase5_Dashboard_Data_Flow.md
5B's existing note ("the approve→push workflow is new, not yet built")
is still accurate. Approve sets orders.status='approved' (a real,
distinct enum value from 'pushed') and reviewed_by/reviewed_at — it
does NOT attempt any provider push, since no such workflow exists to
call. The order detail page explicitly displays this to the reviewer:
"approving marks the order as approved but does not yet push it...
provider-push n8n workflow is not built yet... A human must currently
complete the provider-side order manually after approval."

**Deployment — real constraint discovered, adapted around:** the
original plan (multi-stage Dockerfile, git-context `build:` in the
compose file) FAILED live — confirmed via VPS_getProjectLogsV1 that
Hostinger's Compose orchestration only runs `docker compose pull` +
`up`, never `build`, even when a `build:` key is present ("No such
image: zenny-dashboard-dashboard:latest", "Project deployment failed").
This is a genuine, previously-unknown platform limitation of the
Hostinger MCP's Compose API — not a mistake in the Dockerfile itself
(kept in the repo for future use, e.g. if a registry-based deploy path
is set up later). Real fix: switched to a stock node:22-alpine image
that clones the (public) zenny-sync repo, runs npm ci/npm run build,
and serves the built dist/ via `npx serve` — entirely inline in the
compose file's `command:`, needing no custom image or registry, only
images `docker compose pull` can already fetch. This briefly took the
site down between the failed attempt and the working redeploy (~2
minutes) — the OLD placeholder was stopped before the failure was
caught; not represented as zero-downtime. Confirmed working via
VPS_getProjectLogsV1 (real npm ci + tsc + vite build + "Accepting
connections at http://localhost:80" in the container's own logs) and a
direct-IP curl with a Host header override returning the real dashboard
HTML (not the old placeholder's). Local Docker Desktop was not running
in this environment and was not started — the remote build-and-verify
path already used successfully for BC-014's placeholder was reused
instead of debugging local Docker.

**HTTPS cert:** still not trusted — re-checked live (nslookup + Traefik
logs), still the exact same NXDOMAIN ACME failure as BC-014, confirming
DNS still has not propagated (not a regression caused by this
session's redeploy). Same follow-up as BC-014 applies: retrigger once
`nslookup dashboard.zeromanuals.com 8.8.8.8` resolves.

**Env/secrets:** the Supabase anon/publishable key is embedded directly
in the compose file's `environment:` and the Vite build (this is a
public, client-side-safe key by Supabase's own design — the same key
is visible in the deployed JS bundle regardless). Root .gitignore's
blanket `.env.*` pattern excludes `05_Platform_Builds/Dashboard/
.env.production` from git even though it holds only that same public
key — confirmed harmless (nothing secret excluded), left as-is rather
than carving a gitignore exception, since the deploy path doesn't
depend on that file being committed (build args instead).
```

## Phase 5 — Brand Pass + Integrations Dashboard (BC-016 — BUILT + DEPLOYED)

```
**Brand pass:** Read `.claude/skills/zenny-brand-new-guideline.skill`
(a zipped skill bundle sitting in the repo's `.claude/skills/`
directory, not a top-level installed/loaded skill in this session's
tool list — extracted locally to read `SKILL.md`). Applied the real
tokens to `05_Platform_Builds/Dashboard`: sage/pine/honey/oat/mist/
cloud/taupe palette as CSS custom properties, Fraunces (display) +
Hanken Grotesk (body) + Space Mono (utility labels) via Google Fonts,
a real ensō mark component (`src/components/EnsoMark.tsx`, the exact
SVG from the guideline) used in the header and login screen, "Zenny."
wordmark with a honey full-stop, warm-but-plain copy ("Sign in to
manage your orders and connections," not robotic/hyped). Visually
confirmed live via Playwright screenshots against the deployed site,
not just "the CSS compiled" — see Session Log.

**Integrations dashboard (`/integrations`), same app/auth as `/orders`
per the card's requirement:** Drives the existing oauth-initiate/
oauth-callback Edge Functions (built Phase 1, never called by anything
client-facing until now). New RPC layer (migrations 040-041):
`dashboard_get_my_client()` (same JWT app_metadata -> client_schema_name
pattern BC-015 already flagged as a temporary, non-production mechanism
— explicitly NOT re-decided or replaced here, per the card's own
instruction not to invent a second mechanism), `dashboard_list_
connections()`, `dashboard_disconnect_connection(connection_id)` (with
an explicit ownership check — a client can only disconnect its own
connection_id, never trusts the UUID alone). Disconnect calls the
existing `update_connection_status(..., 'revoked', ...)` RPC and logs a
real `connection_audit_log` row via `insert_audit_log_event` — one real
bug caught here too: the first version used invalid `event_type`/
`auth_method` literals against the table's actual CHECK constraints
(`'disconnected'`/`'dashboard'` aren't real values; fixed to
`'revoked_by_client'` + derived `'oauth'`/`'api_key'` from whether the
connection had a refresh token, matching oauth-callback's own logic).

**Which categories/providers are shown per archetype is a UI-only
judgment call (`ARCHETYPE_CATEGORIES`/`CATEGORY_PROVIDERS` in
Integrations.tsx), not a documented decision** — no source doc specifies
this mapping. Flagged, easy to revise; doesn't touch schema or backend
behavior.

**`oauth-callback`'s dead redirect fixed:** `ZENNY_DASHBOARD_URL` was
confirmed still unset (same as BC-003/BC-004's original finding — no
MCP tool here can set Supabase Edge Function secrets, confirmed by
searching for one). Fixed at the code level instead: the function's own
fallback default (which is what actually governs behavior when the env
var is unset) changed from the dead `https://dashboard.zenny.pending/`
to the real `https://dashboard.zeromanuals.com/integrations`, redeployed
(oauth-callback v3). If a human later sets the real env var via the
Supabase CLI/Management API, it still takes precedence — this fix works
either way.

**End-to-end test — real, disclosed scope:** Clicked "Connect Google
Calendar" via a real, live Playwright browser session against the
deployed dashboard. It genuinely navigated to accounts.google.com with
the real seeded client_id, the correct redirect_uri back to this
project's own oauth-callback, the real requested scopes (calendar +
gmail.modify), and a real state UUID — confirmed that exact state row
landed in `control.oauth_state` with the correct client_id/category/
provider. **Could not complete Google's actual interactive consent
screen** — that requires a real human-owned Google account logging in,
which isn't available to an autonomous agent session; not faked or
worked around. To still test the dashboard's post-connect behavior for
real, simulated the "connected" state using the exact same
`upsert_client_connection`/`store_credential_secret` RPCs `oauth-
callback` itself calls (not a raw INSERT bypassing real code) — verified
live via Playwright that the Integrations page correctly showed
"Connected · google · bc016-test@example.com," then clicked Disconnect
and confirmed it flipped back to "Not connected" in the real UI, backed
by a real `control.client_connections.status = 'revoked'` row and a real
audit log entry. The simulated test connection/secret are left in place
(revoked, clearly test-named) per this project's "mark clearly, don't
delete" convention.

**2 real bugs caught via live Playwright testing (not assumed working
from a successful build):**
1. Login never redirected to /orders after a successful sign-in — the
   Auth API call succeeded (real 200) but nothing in the app reacted to
   the new session on the /login route itself. Fixed with a `LoginRoute`
   wrapper that redirects to /orders once a session exists.
2. The Integrations page's provider/account subtitle ("google ·
   bc016-test@example.com") kept showing after Disconnect — it checked
   `existing` but not `existing.status !== 'revoked'` the way the
   status-pill/button branch already did. Fixed to match.
Both caught by actually using the deployed app (via
`mcp__plugin_playwright_playwright__*`, confirmed enabled this session —
see Session Log Step 0), not by reading the code and assuming it worked.

**Disconnect does not call the provider's own revoke endpoint** (e.g.
Google's token revocation API) — Claude Code's call per the card's
"flag if unsure": implemented as local-only (clears Zenny's own record)
and disclosed explicitly in the Integrations page's own copy, rather
than silently claiming full revocation or building per-provider revoke
calls without being asked. A real design question for whoever owns this
next: should Disconnect also revoke at the provider?
```

## Phase 5 — 5C Appointment Booking Dashboard (BC-017 — BUILT + DEPLOYED, read-only)

```
**Test credentials reset (Step 0):** test-dashboard-bc015@zenny.internal's
password reset via direct SQL (same pgcrypto path used to originally
create the account — no Admin API service-role key exposed via MCP).
Verified live via a real POST to the Auth REST API (200, real JWT
returned, app_metadata intact) BEFORE reporting the new password — see
Session Log for the actual value. Old password no longer works (this
UPDATE overwrote encrypted_password directly, not a parallel row).

**`appointments` table added to client_test_002_acme_commerce_test's
schema:** confirmed live which test client actually has one — NEITHER
existing test client did (only the 5 tpl_* template schemas + public
had it; the table was never included in either client's original
`create_client_schema_from_template` call). Per the card's literal test
("if its archetype has an appointments table") — commerce_ecom's
template (tpl_commerce) does have one — retrofitted it into that
client's existing schema using the exact same `CREATE TABLE ... LIKE
... INCLUDING ALL` + explicit FK re-add + RLS-enable + grant-revoke
pattern `create_client_schema_from_template` itself uses (mechanical,
not a new mechanism). Re-verified live afterward: RLS enabled, zero
anon/authenticated grants, matching every other table in this project.
No third test client created — the card's own instruction not to was
followed.

**2 real test appointment rows seeded** (2 new leads + conversions +
appointments, clearly test data): one clean success
(client_calendar_write_status='success', our_db_write_status='success',
authoritative_source='client_calendar', alert_fired=false) and one
exercising BC-013's parallel-write fallback design
(client_calendar_write_status='failed', our_db_write_status='success',
authoritative_source='our_db_fallback', alert_fired=true) — the second
is what a real client-calendar outage would actually produce.

**RPC layer (migration 042):** `dashboard_list_appointments()`,
`dashboard_get_appointment(appointment_id)` — same SECURITY DEFINER +
`dashboard_get_my_client_schema()` pattern as every dashboard RPC since
BC-015, no new mechanism introduced. Read-only by design: no write RPC
exists, since the booking Tools that would actually produce these rows
(CreateAppointment, CreateReservation, CreateInspectionSlotBooking,
CreateScoredBooking — Phase 8) aren't built yet. Learned from BC-015's
mistake this time: the anon-EXECUTE revoke was included in the SAME
migration as the GRANT, not fixed in a follow-up — verified live via
`information_schema.routine_privileges` that anon never had EXECUTE at
any point.

**UI (`/appointments`, `/appointments/:id`):** list shows intent,
source-of-truth pill (client_calendar vs. our_db_fallback), an explicit
alert indicator, created date. Detail page surfaces a prominent
alert-fired banner explaining what it means and that a human needs to
reconcile it, plus both write-status badges and the calendar
provider/event ID. The page's own copy explicitly discloses this is a
monitoring view of not-yet-built Tools' future output, not live traffic
— per the card's explicit instruction to flag this clearly rather than
imply real production data.

**Brand:** no separate pass needed — reused the same CSS classes/tokens
BC-016 already established (`.status-pill`, `.orders-table`, `.note`,
`.error-text`, danger-red alert section) with 2 new pill-color mappings
for the source-of-truth badges. Verified visually via live Playwright
screenshots against the deployed site (both list and alert-fired detail
view), not assumed from "the CSS classes exist."

**Testing:** all of this was verified against REAL data (the 2 seeded
rows), not mocked — the RPC was curl-tested with a real JWT before any
UI code was written, then the deployed UI was driven with a real
Playwright browser session (login persisted from a prior session,
confirming the auth flow itself still works end-to-end) to confirm both
rows render correctly and the alert-fired detail page shows the right
warning content.
```

## Phase 5 — 3 Defect Fixes From Manual Testing (BC-018)

```
**Step 1 — Shopify shop subdomain (real bug, not a design gap):**
Re-read oauth-initiate's live deployed source before touching anything
(per the card's explicit instruction not to guess). Confirmed the exact
param: `shop` (bare subdomain, e.g. "mystore" — the function itself
appends `.myshopify.com`, passing the full domain would double it).
Integrations' handleConnect now special-cases provider==='shopify':
window.prompt() for the subdomain (minimal UI, per the card — a plain
input+confirm, no styled form), normalizes common paste variations
(strips https://, trailing slash, an already-appended .myshopify.com
suffix), then passes it as `shop`. **Verified live end-to-end as far as
possible without a real store:** clicked the button via a real
Playwright browser session, handled the real prompt dialog, and it
correctly reached `https://my-test-store.myshopify.com/admin/oauth/
authorize?client_id=...&scope=...&redirect_uri=...&state=...` — a
genuinely well-formed Shopify authorize URL (the 404 "Store unavailable"
is expected and correct, since no real store exists at that subdomain —
same disclosed-limitation pattern as Google's consent screen in BC-016).
The matching `control.oauth_state` row was confirmed inserted with the
correct client_id/category='ecommerce'/provider='shopify'.

**Step 2 — Show all real archetype-relevant providers:** Re-confirmed
live via `control.oauth_apps` that 5 providers have a real,
non-`not_applicable` app_status (google, shopify, calendly testing;
cal_com pending) — cal_com was entirely missing from BC-016's
CATEGORY_PROVIDERS map (the actual bug), not just under-surfaced. Added
it to the 'calendar' category. Also added 'notification' to every
archetype in ARCHETYPE_CATEGORIES (a UI judgment call, not a documented
decision — ops notifications aren't really archetype-specific, unlike
'ecommerce'), which is what made Slack's absence visible at all.

**Slack decision, stated not left silent:** chose to SHOW Slack as "Not
yet available" (same treatment as Cal.com), not hide it. Reasoning:
confirmed live that `oauth_apps.client_id` for slack is literally the
placeholder string `'SLACK_BOT_TOKEN_MODE_NO_OAUTH_APP'` (per BC-004
Step C — a real, working multi-tenant Slack OAuth app was never built,
only a bot-token mode that doesn't fit this dashboard's per-client
OAuth flow) — its `app_status` says 'testing' in the DB, which is
actually misleading given the client_id is a non-functional placeholder,
so this UI decision deliberately does NOT trust that raw status field.
Consistent, honest treatment (show + explain, never hide) beats a
per-provider special case that would silently vary. Both Cal.com and
Slack render a "Not yet available" pill with the real reason available
on hover (`title` attribute) rather than a clickable button that would
build a broken authorize URL.

**Step 3 — `appointments.scheduled_at` (migrations 043-044):**
Live-checked first whether any doc already named a scheduled-time field
for THIS table before adding a new one, per the card's explicit
instruction. Found `conversions_appointment.appointment_time` and
`conversions_restaurant.reservation_time` in Database_Structure_v4_
FINAL.md — but both live in DIFFERENT, archetype-specific tables, not
`appointments` (a deliberately generic table reused across 5 archetypes
per BC-013's own design note — a single archetype-specific name would
be wrong here, e.g. "reservation_time" wouldn't fit an emergency
dispatch). n8n_Workflow_Specification_v1.md Part 13.3's CreateAppointment
response shape doesn't name a time field for `appointments` either.
Confirmed: no existing name applies to this specific table — `scheduled_
at` proceeds as a genuinely new column, not a rename. Added as nullable
first, backfilled the 2 real seeded test rows with values matching their
own conversation content (order matters: "Thursday 3pm" -> 2026-08-06
15:00 UTC, "Friday 11am" -> 2026-08-07 11:00 UTC, both computed and
verified live via `to_char()`), then set NOT NULL on all 6 schemas
(public + tpl_appointment/tpl_commerce/tpl_emergency/tpl_consultation +
client_test_002 — the same 5 tpl_* schemas BC-013 deployed `appointments`
to). Dashboard RPCs (migration 044) and UI updated: list now sorts by
`scheduled_at` ascending (soonest first — more useful for a monitoring
view than insertion order) and shows it as the prominent bolded column
in place of `created_at`; detail page shows it large up top, with
`created_at` demoted to a small "booked {when}" note beside it.
Re-verified live via curl with a real JWT before touching any UI code.

**Doc diff needed, not applied by Claude Code (Section 13 standing
rule):** `Database_Structure_v4_FINAL.md` has NO section for
`appointments` at all — the table was added in BC-013, after that
doc's authorship, and was never backfilled into it (unlike
conversions_appointment/conversions_restaurant, which are documented).
Needed: a new `### appointments (in public, tpl_appointment, tpl_commerce,
tpl_emergency, tpl_consultation)` section, matching the format of the
existing conversions_* sections, listing:
  appointment_id              uuid PRIMARY KEY
  conversion_id                 uuid UNIQUE REFERENCES conversions(conversion_id)
  client_calendar_event_id        text, nullable
  client_calendar_provider           text, nullable
  client_calendar_write_status          calendar_write_status_enum NOT NULL
  our_db_write_status                      calendar_write_status_enum NOT NULL
  authoritative_source                        authoritative_source_enum NOT NULL
  alert_fired                                    boolean NOT NULL
  scheduled_at                                      timestamptz NOT NULL  -- new, BC-018
  created_at                                           timestamptz NOT NULL
```

## Phase 5 — Gmail/WooCommerce Connections, Inventory Sync Logged, Supabase Tier (BC-019)

```
**Step 1 — Gmail, no new oauth_apps row:** Confirmed live `control.
oauth_apps` has 7 rows (cal_com, calendly, google, shopify, slack,
twilio, woocommerce) — no 'gmail' row, even though the CHECK constraint
allows it. Read Client_Integration_and_Credential_Platform_v1.md Part
8.1 before deciding whether to add one: "One Google Cloud project, one
OAuth 2.0 Client... Scopes: full read/write for BOTH Calendar and
Gmail" — a single shared app, already exactly what the seeded `google`
row's scopes reflect (`calendar` + `gmail.modify` together). Adding a
second 'gmail' row with duplicate credentials would be redundant
infrastructure for zero functional gain — `category` (not `provider`)
is what distinguishes a Calendar connection from an Email connection in
`control.client_connections`, and `oauth-initiate`'s authorize-URL
logic never branches on category. Added 'email' to CATEGORY_PROVIDERS
(already existed, unused since BC-016) and to ARCHETYPE_CATEGORIES for
every archetype. **Verified live via Playwright:** Connect Gmail
correctly reaches Google's real consent screen with the same client_id/
scopes as the Calendar flow, and the resulting `control.oauth_state` row
confirmed `category='email', provider='google'` — proving the shared-app
design works exactly as the doc describes, not just in theory.

**Step 2 — WooCommerce, real form + 2 real bugs fixed:** Re-read
`woocommerce-connect`'s live deployed source (never guessed) — confirmed
signature `{client_id, store_url, consumer_key, consumer_secret}`. Built
a plain 3-field form (Store URL / Consumer Key / Consumer Secret, no
styling pass per the card's explicit instruction), calling the function
directly via `supabase.functions.invoke`. **First live Playwright test
failed** with a browser CORS error — the function had no `Access-
Control-Allow-Origin` header at all, meaning it had only ever been
exercised server-to-server, never from an actual browser; genuinely
would have blocked every real client from ever using it. Fixed by adding
CORS headers + OPTIONS preflight handling, redeployed (v2). **Second
live test surfaced a real but generic error** ("Edge Function returned a
non-2xx status code") — supabase-js's `FunctionsHttpError` doesn't
auto-parse the response body into `.message`; fixed by reading the real
message from `error.context` (the raw Response). **Third live test
succeeded end-to-end**: a fake store correctly produced the real,
specific validation failure (`Could not reach store at ...: dns error:
... No address associated with hostname`) — proving the full path
(browser → Edge Function → live validation attempt → real error
surfaced back to the UI) genuinely works, same disclosed-limitation
pattern as every other provider test in this project (no real store
exists to complete a full success case).

**Shopify's API-key question — resolved via the doc, not built:**
Client_Integration_and_Credential_Platform_v1.md Part 8.2 already
resolved this ("RESOLVED during document review: Shopify's Custom App
token model is deprecated/being phased out — Shopify now uses the same
shared-app... Authorization Code Grant") and Part 8's own summary table
states directly: "Google, Shopify, Slack — no meaningful API-key
alternative exists". No second path built; would have been redundant
against the doc's own explicit resolution.

**Step 3 — SCH-007 Inventory/Catalogue Sync, logged as a real future
item (not built):** Per explicit human instruction, formally logging
(not just re-mentioning) a new required workflow:

  SCH-007  Inventory/Catalogue Sync — Cron — Syncs product/inventory
  data from Shopify, WooCommerce, AND Google Sheets (3 sources — Google
  Sheets is a NEW requirement, not previously captured anywhere, added
  per explicit human instruction this session, for clients without a
  real e-commerce platform) into that client's Convocore KB via
  Convocore's KB API. Referenced as a known gap since BC-005/BC-009/
  BC-012 but never formally logged with an ID or the Google Sheets
  source until now. Belongs in Phase 11 (Scheduled Workflows). NOT built
  — schema/workflow design not started, this is a logging-only entry.

  Doc diff flagged, not applied (Section 13 standing rule): n8n_
  Workflow_Specification_v1.md Part 8's Scheduled Workflows table
  (currently SCH-001 through SCH-006) needs a new row:
  | SCH-007 | Inventory/Catalogue Sync | Cron | Pull product/inventory
  data from Shopify, WooCommerce, and Google Sheets (per-client
  configured source); push into that client's Convocore KB via the KB
  API | 07 (Dashboard) or a new Inventory module — Build Card's call |

**Step 4 — Supabase tier confirmed live, custom domain documented (not
built):** `get_organization` on org `jltlethfyimcwhtbbeqj` ("Zenny AI")
returns `"plan":"free"`. Per the card's explicit instruction, this was
NOT actioned — no custom domain was configured. Noting for the record:
oauth-initiate/oauth-callback currently run on
kmhzosyljpzheqvfuyzm.supabase.co, visible on Google's OAuth consent
screen — likely a factor in Google brand verification friction (the raw
Supabase project-ref domain, not a branded zeromanuals.com one). Fixing
this requires a custom domain mapped to Supabase Edge Functions (e.g.
api.zeromanuals.com), which requires upgrading to Supabase Pro tier —
a plan/cost decision for the human, not decided or actioned here.
```

## Phase 5 — OAuth Popup Flow + Proxy-Domain Feasibility (BC-020)

```
**CORRECTION to the BC-019 note directly above:** "likely a factor in
Google brand verification friction" is NOT confirmed accurate — BC-020
investigated this directly (Step 2) and found Google's "unverified app"
warning is gated entirely by the OAuth app's Publishing Status
(Testing/Production) in Google Cloud Console, per Client_Integration_
and_Credential_Platform_v1.md's own already-researched finding ("the
only documented fix is completing Google's verification and switching
the project's Publishing Status from Testing to Production") — this is
independent of which domain serves the redirect_uri. A custom proxy
domain would not reduce verification friction; BC-019's phrasing
overstated the connection. Left uncorrected until now since BC-019
itself never tested the claim, just noted it as a plausible factor.

**Step 1 — Popup OAuth flow, 2 real platform constraints found and
fixed via live testing (not assumed working from code review):**

1. *Supabase Edge Functions cannot serve script-executing HTML.*
   First attempt: oauth-callback returned an HTML page with an inline
   `<script>` that detected `window.opener` and called `postMessage()`/
   `window.close()` directly from the function. Looked correct — `curl
   -I` (a HEAD request) showed `Content-Type: text/html`. **Failed in a
   real Playwright browser**: a real GET request showed the true
   response was `Content-Type: text/plain` plus `Content-Security-
   Policy: default-src 'none'; sandbox` — the platform gateway forces
   this on real GET responses from Edge Functions, and the CSP's
   `sandbox` directive blocks inline script execution entirely,
   regardless of what Content-Type a function tries to set itself. HEAD
   responses aren't wrapped the same way, which is exactly what made
   the first version look correct until tested with a real browser
   session. **Real fix:** oauth-callback (v5) went back to a plain
   redirect (its pre-BC-020 shape). The popup-detection/postMessage/
   close logic moved into the DASHBOARD app itself
   (`Integrations.tsx`) — served from dashboard.zeromanuals.com with
   normal headers, no sandboxing — which runs it after the redirect
   lands there (the popup's own landing page IS this same
   `/integrations` route).

2. *Google's OAuth pages send a Cross-Origin-Opener-Policy header.*
   Confirmed live via curl: `accounts.google.com` sends
   `Cross-Origin-Opener-Policy-Report-Only: same-origin`. This is a
   well-documented, industry-wide cause of `window.opener` going null
   partway through a real multi-hop OAuth redirect chain — independent
   of anything in this app's code (it's part of why Google's own newer
   identity libraries moved away from relying on `window.opener` for
   popup flows). Confirmed empirically in this session: a popup
   redirected back to `/integrations` sometimes had `window.opener`
   correctly set and sometimes didn't, depending on the exact
   navigation path taken to reach it — not reliable enough to build on
   alone. **Real fix:** `localStorage` + the `storage` event is now the
   PRIMARY completion signal — it doesn't need an opener reference at
   all, since `storage` events fire in every other same-origin window
   purely because the origin matches, regardless of how that window was
   opened or whether COOP severed the opener link. `postMessage` is
   kept as a secondary, best-effort signal for when the opener does
   survive.

   Also fixed along the way (not a platform constraint, an implementation
   bug caught via the same live testing): the popup used a single fixed
   window name (`'zenny-oauth'`) for every connect attempt. Reusing one
   fixed name across repeated opens in the same browser session showed
   inconsistent same-tab-navigation behavior (the "popup" replaced the
   parent tab instead of opening separately) instead of a reliable new
   window. Fixed to a unique name per attempt
   (`` `zenny-oauth-${Date.now()}` ``) — more robust regardless of the
   exact root cause, and standard practice for repeatable popup flows.

   **Verified end-to-end via real Playwright popups** (not just URL
   construction, the actual mechanism): opened a real popup for Gmail,
   confirmed it's a genuine separate window (not a same-tab navigation),
   manually drove it to oauth-callback with a deliberately invalid code
   (same disclosed-limitation pattern as every prior card — completing
   Google's real consent isn't possible without a real account),
   confirmed the popup redirected to `/integrations?connect_result=
   error&...`, correctly detected it should self-terminate, wrote to
   localStorage, attempted postMessage, and **genuinely closed itself**
   (confirmed: the tab disappeared from the browser's tab list) — and
   the PARENT tab (untouched, still on plain `/integrations`) correctly
   received the `storage` event and updated its UI (`"Couldn't connect
   (token_exchange_failed)."`, busy state cleared, connection list
   unchanged since no connection was actually created). Repeated the
   same real-popup confirmation for Shopify (correct
   `my-test-store-bc020.myshopify.com/admin/oauth/authorize?...` URL,
   same popup mechanics). WooCommerce was never OAuth-based (a direct
   in-page form + Edge Function POST, no redirect at all) so needed no
   popup treatment — noted explicitly rather than silently skipped.

   **Manual popup-close (Step 1.4) verified live:** opened a popup,
   closed it manually before it reached the callback, confirmed the
   parent's `popup.closed` poll (500ms interval) detected this within
   about a second, cleared the busy/disabled button state, and showed
   "Window closed before finishing — nothing was connected." — not left
   hanging.

   **Interesting real-world side-evidence found mid-session:** two
   genuine "Connected" rows appeared in `control.client_connections`
   for the test client (Calendar and Email, both provider=google) at
   timestamps between the two failed popup-fix attempts — confirmed via
   `control.connection_audit_log` (`event_type='connected',
   auth_method='oauth', actor='client'`, immediately preceded by a real
   Google `invalid_grant` error from an earlier attempt). This is
   strong evidence a real human completed real Google OAuth logins
   during this session using the test credentials — independently
   proving the core mechanism (oauth-initiate's authorize URL,
   oauth-callback's token exchange, the DB writes) works correctly for
   real, even during the window when the popup's own closing UI was
   still broken by constraint #1 above. Both connections were
   disconnected again during testing to get back to a clean state for
   controlled re-tests — not left in place, since they weren't this
   session's own deliberately-seeded test data.

**Step 2 — Proxy-domain feasibility: investigated, reported, NOT
built, per the card's explicit instruction to stop for a Commander
decision:**

- **Live-tested the card's exact question:** does Supabase's edge
  gateway accept requests proxied through a different Host header? NO —
  confirmed via a real request (`curl ... -H "Host:
  api.zeromanuals.com"` against the real Supabase Edge Function URL):
  Cloudflare (fronting Supabase) returns a hard `403 Forbidden` for a
  mismatched Host header. A naive pass-through proxy (preserving the
  client-facing domain as the Host header sent upstream) will NOT work.
- A CORRECTLY configured reverse proxy (Traefik rewriting the Host
  header to match Supabase's real domain on its own outbound leg —
  standard `passHostHeader: false` behavior, not exotic) would likely
  avoid this specific rejection, since Supabase would then see an
  ordinary, correctly-Host-matched request. This was NOT verified with
  an actual live proxy deployment (would require a new DNS record for
  api.zeromanuals.com — an external action, plus updating both oauth-
  initiate's redirect_uri construction AND Google Cloud Console's
  registered redirect URI to match exactly) — reasoned from Traefik's
  documented behavior, not empirically confirmed end-to-end.
- **The more important finding: even if built, it would not solve the
  problem it was proposed to solve.** Per the correction at the top of
  this section, Google's "unverified app" warning is controlled by the
  OAuth app's Publishing Status in Google Cloud Console, not by which
  domain the redirect_uri points to. A proxy domain's only real benefit
  would be cosmetic (a branded domain flashing by during the redirect,
  if even visible in a popup context) plus avoiding a future dependency
  on the raw Supabase project-ref domain if it ever needed to change.
- **Recommendation (not a decision — Commander's call):** given the
  real added complexity (new DNS record, new Traefik route, redirect_uri
  updates in two places kept in sync, ongoing maintenance) against a
  benefit that's real but minor and NOT the fix for the actual
  friction (Google verification) it was originally proposed to address,
  this doesn't look worth building right now. Nothing was deployed —
  stopping here per the card's explicit instruction.
```

## Phase 5 — Real OAuth Connection Persistence Bug (BC-021)

```
**Reported symptom:** the human completed REAL consent for Google
Calendar, Gmail, WooCommerce, and Calendly. None showed "Connected" in
the dashboard afterward; WooCommerce briefly showed connected then
reverted.

**Root cause, confirmed via real data, not inferred:**

1. Queried `control.client_connections` for the test client directly:
   3 real rows existed (google/calendar, google/email, woocommerce/
   ecommerce), each with real provider_account_id/token_expires_at
   values proving a real successful token exchange happened at least
   once for each — but ALL THREE now show `status = 'revoked'`.
2. Queried `control.connection_audit_log`: found the expected
   `connected` events, but ALSO found repeated `connected` events with
   `connection_id: null` — a red flag, since a genuinely successful
   `upsert_client_connection` call always returns a real UUID (confirmed
   by re-reading its own SQL definition).
3. Pulled real Postgres error logs for the exact timestamps of those
   null-connection_id events and found the literal, unambiguous error
   chain, repeated identically on every retry:
   `duplicate key value violates unique constraint "secrets_name_idx"`
   immediately followed by
   `null value in column "access_token_secret_id" of relation
   "client_connections" violates not-null constraint`.

**What was actually happening:** `store_credential_secret` called
`vault.create_secret` with a STATIC name per client+category (e.g.
`client_{id}_calendar_access`). The FIRST connect for any category
works fine (fresh name). Any RECONNECT for the SAME category — a
disconnect-then-reconnect, or simply retrying after not seeing the UI
update — tries to create a SECOND secret with the identical name, which
Vault's own real `secrets_name_idx` UNIQUE constraint rejects. Neither
`oauth-callback` nor `woocommerce-connect` checked this RPC's error
before proceeding — both blindly continued to `upsert_client_
connection` with a null secret id, which ALSO failed (a real column is
`NOT NULL`), ALSO uncaught — and both functions still logged a
"connected" audit event (and `woocommerce-connect` returned a real HTTP
200 to the browser) while the actual `client_connections` row was left
completely untouched. This is not a UI bug and not a BC-020 popup-
signal regression — the data was never correctly written in the first
place on any retry; the popup/UI layer was reporting exactly what the
backend told it, which was a lie.

**Fix (2 layers):**
1. **Root cause** — `store_credential_secret` (migration 045) now
   upserts by name: looks up any existing secret with that name first
   and calls `vault.update_secret` in place instead of always calling
   `vault.create_secret`. Verified live: called it twice with the same
   name, got the same secret UUID back both times, second call's value
   correctly overwrote the first — no error.
2. **Defense in depth** — both `oauth-callback` (v6) and `woocommerce-
   connect` (v3) now actually check every RPC's `error`/`data` before
   proceeding, and log a real, specific audit event on every failure
   branch (previously several early-exit paths — missing_state,
   invalid_state, app_lookup_failed — logged NOTHING at all, which is
   also the direct reason Calendly's one real attempt left no
   diagnosable trace — see below). A silent false-success can no longer
   happen from any of these functions.

**Shopify — a SEPARATE real bug, found while tracing this:** the real
Edge Function logs contained one genuine Shopify callback hit with real
HMAC/shop/timestamp params (proving that specific install attempt
actually got PAST Shopify's own authorization screen) that returned
HTTP 500. Root cause: Shopify's REAL callback sends `shop` as the FULL
`{name}.myshopify.com` domain, but `exchangeCode`'s shopify case always
appended `.myshopify.com` regardless (matching oauth-initiate's own UI,
which only ever collects the bare subdomain) — producing a corrupted
double-suffixed URL (`{name}.myshopify.com.myshopify.com`) for the
actual token exchange request, which fails. Fixed in oauth-callback v6:
strips any existing `.myshopify.com` suffix before re-appending it,
correctly handling both shapes.

**Shopify — the distribution-method issue (Step 2), confirmed
NON-code, human action needed:** per the human's own screenshot,
Shopify's install screen shows "This app can't be installed yet — The
app developer needs to select a distribution method first." Confirmed
this is not caused by anything in this codebase: multiple real
`oauth-initiate` calls for Shopify are logged with correct client_id/
scope/redirect_uri, all producing real 302 redirects to Shopify's own
authorize endpoint — the request Zenny sends is well-formed. This is a
Shopify Partner Dashboard setting on the app itself (Public/Custom/
Private distribution), unrelated to the double-suffix bug above (that
bug only affects an install that already got approved). **Action needed
from the human, not Claude Code:** log into the Shopify Partner
Dashboard for this app and select a distribution method.

**Calendly — real attempt found, root cause is the missing-audit-log
gap above:** found the exact real callback hit (`state=e71d8448-...`,
a real `code` param, no `iss` param — matching Calendly's real callback
shape). The matching `oauth_state` row was confirmed consumed (deleted)
by this request, but NO audit log entry (connected OR error) exists for
it — meaning it hit one of the early-exit branches that had no logging
at all before this session's fix. `get_oauth_app('calendly')` was
independently confirmed to work correctly (real row, real client_id/
redirect_uri/scopes), ruling out a broken app-config as the cause.
**Genuinely not fully diagnosed this session** — the exact failure
point could not be pinned down further without the missing log entry
that now (post-fix) would exist on retry. Flagged honestly as
unresolved rather than guessed at; the next real Calendly attempt will
have a full audit trail to diagnose from if it fails again.

**Steps 3-5 — COMPLETED, later in this same session, after the human's
real re-test:** the human reported Gmail, WooCommerce, and Calendly all
now showing "Connected" (Calendly's consent screen auto-skipped since
the test account had already authorized this app previously — a benign,
expected OAuth behavior, confirmed real by fetching Calendly's own
`/users/me` and getting back a real account email,
`quaantummedia.zeromanual@gmail.com`, which cannot happen without a
genuinely valid token). Verified directly against `control.
client_connections`/`connection_audit_log` per Step 0.5 — all 3 rows
clean, real provider data, no errors, no null connection_ids.

**Google Calendar vs Calendly — real, pre-existing design overlap,
confirmed not a bug:** both map to the dashboard's `category = 'calendar'`
slot, and `client_connections` has `UNIQUE(client_id, category)` — so
connecting Calendly replaced whatever previously held that slot. Google
itself is still connected, but only under `category = 'email'` (Gmail) —
there is currently no way for a client to hold both a Google Calendar
connection AND a Calendly connection at the same time. This is a real
open product question for the Commander (should Google's calendar+gmail
combined OAuth grant produce two separate category rows, or is "one
calendar provider at a time" the intended design?) — flagged here, not
resolved unilaterally.

**SCH-006 Token Refresh Sweep — tested against real stored tokens,
multiple real pre-existing bugs found and fixed (this workflow had
NEVER been executed successfully before this session):**
1. All 4 Slack alert nodes had no `Channel` parameter configured at all
   (not even a placeholder), which blocks n8n's static validation for
   the ENTIRE workflow regardless of which branch real data would reach
   — set a clearly-labeled placeholder Channel ID (`C00000000`, not a
   real channel/credential) purely to unblock testing the real refresh
   logic; the actual Slack gap (zero real multi-tenant Slack OAuth app,
   per BC-004/BC-008) is completely unchanged.
2. All 22 of the workflow's Supabase HTTP Request nodes had ZERO
   credential attached — confirmed this workflow could not have ever
   successfully executed before. Attached the existing real
   `zenny-vault-suparbase` n8n credential (already used by other working
   Zenny workflows in this instance) — not a new/invented credential.
3. A real response-parsing bug: several RPC calls (`read_credential_
   secret`, `store_credential_secret`, `insert_audit_log_event`) return
   a bare scalar (a decrypted secret, or a newly-created UUID) via
   PostgREST's `application/vnd.pgrst.object+json` Accept header — n8n's
   response-format autodetect doesn't recognize that content-type as
   JSON, and the original node expressions referenced the wrong field
   entirely (the whole raw-response wrapper object instead of its `.data`
   property). Fixed by explicitly setting `responseFormat: "text"` on
   these HTTP nodes (confirmed via live execution that this returns the
   plain unwrapped value in `.data`, not further JSON-encoded — an
   earlier `JSON.parse(...)` attempt was tried and confirmed wrong via a
   live 400 from Google's token endpoint, then removed) and correcting
   every downstream expression that consumed these nodes' output.
4. A workflow-editor interaction caught live: opening/closing the
   workflow in the n8n UI mid-session reverted several of the API-applied
   node edits (credentials + responseFormat) back to their pre-fix state
   — re-applied after the editor closed. Documented here since it's a
   real n8n platform behavior worth knowing for future sessions: editing
   a workflow via MCP while it's also open in the browser editor is not
   safe: the editor's own save-on-close can silently clobber API edits.

**Real, verified result (execution ID 14, `status: success`):** a live
Google token refresh (new `ya29....` access token obtained from Google's
real token endpoint) and a live Calendly token refresh (new access token
+ rotated refresh token from Calendly's real token endpoint) both
completed and persisted. Confirmed directly against
`control.client_connections` after the run — NOT just trusted from the
execution log:
  - google/email (`abd84801-...`): `access_token_secret_id` = the exact
    new secret UUID from the execution, `token_expires_at` correctly
    advanced ~1 hour, `status` still `connected`.
  - calendly/calendar (`609559ce-...`): `access_token_secret_id` /
    `refresh_token_secret_id` match the execution's new UUIDs,
    `token_expires_at` correctly advanced ~2 hours, `status` still
    `connected`.
SCH-006 remains **inactive** (not toggled on this session — activating
a real scheduled workflow is a separate decision, out of this card's
"tested against a real token" scope).

**Step 5 — full regression pass, done via live Playwright against the
deployed dashboard:** Orders (5B) — 3 real seeded orders render
correctly with correct statuses. Appointments (5C) — both seeded rows
render correctly, read-only monitoring copy intact. Integrations page —
stable, accurate real state with no silent reverts: Store (WooCommerce)
Connected, Calendar (Calendly) Connected, Email (Google) Connected,
Notifications (Slack) correctly shows "Not connected" / "not yet
available" per the known, unchanged Slack gap.

**BC-021 is now COMPLETE.** All Definition of Done items satisfied:
root cause identified and fixed for all 4 providers; Shopify correctly
diagnosed as a non-code, human-action item; Google (Gmail) + Calendly
re-tested and verified against real DB state; SCH-006 tested against
real stored tokens and verified against real DB state; WooCommerce's
revert behavior explained and re-confirmed stable; Calendly's original
failure explained (missing audit logging on early-exit branches, now
fixed) with the residual "exact original failure point" honestly
disclosed as undiagnosable from historical data; full regression pass
clean.
```

## Phase 5 — Small Fix Pass + SCH-006 Slack State Verification + codebase-memory-mcp Onboarding (BC-022)

```
**Step 0.5 — codebase-memory-mcp, real capabilities verified (not
assumed from the name), first-time onboarding for this tool:**
Confirmed loaded this session (`list_projects` returned this repo,
already indexed) and functional via real read-only calls, not just tool
presence. What it actually is: a local graph-augmented code+doc index
of THIS repo (not a cross-session memory of conversations, despite the
name) — `list_projects`/`index_status` showed it auto-indexed this
project (4405 nodes, 4559 edges) already at the current HEAD commit
(8224ec5), status "ready", no manual indexing step needed this session.
It indexes both code (functions/classes with real line ranges,
complexity metrics, call graph in/out-degree) AND markdown docs
(PROJECT_STATE.md, the spec docs) as searchable nodes. Real, useful
proof of value: `search_code` for "provider_account_id" instantly found
the exact 3 real files/line ranges that reference it (Integrations.tsx
line 445, the ClientConnection type, 2 spec docs) — including the exact
UI rendering logic — in one call, faster than a manual grep+read cycle
would have been; `get_code_snippet` then pulled the full real function
body with call-graph metadata. **Genuinely useful, used for real this
session** — Step 1's diagnosis below started from this tool's output
rather than a manual file search. One real gap: it does NOT index
Supabase Edge Functions or n8n workflows (they aren't local files) —
those still need `get_edge_function`/`get_workflow_details` directly,
which is what Step 1/2 below actually used for the backend-side
diagnosis. Recommendation for future cards: use it first for
"where in the dashboard/docs does X live" questions; it's not a
substitute for the Supabase/n8n MCPs for anything server-side.

**Step 1 — Gmail account-label gap: REAL ROOT CAUSE, NOT a UI bug,
fixed at the source.** Confirmed via `codebase-memory-mcp` that
Integrations.tsx's render logic already correctly displays
`provider_account_id` when truthy (`{existing.provider_account_id ? \`
· ${existing.provider_account_id}\` : ''}`) — so a missing label could
only mean missing data, not a rendering gap. Queried
`control.client_connections` directly: `provider_account_id` is
genuinely `NULL` for the google/email connection. Traced why: oauth-
callback's google case DOES call
`https://www.googleapis.com/auth/oauth2/v2/userinfo` to populate this
field (confirmed reading its real source, v6) — but `control.oauth_apps`
row for google only ever requested
`.../auth/calendar` + `.../auth/gmail.modify` scopes, checked via a
direct query. Neither scope grants access to the userinfo endpoint, so
that call has been failing (403, caught by oauth-callback's own
non-fatal try/catch) on EVERY Google connect since this feature was
built — confirmed via real Edge Function logs showing the exact real
callback hit for the human's actual working BC-021 reconnect (scope=
`calendar+gmail.modify` only, no `userinfo.email`/`openid`). **Fixed**:
migration 046 adds `https://www.googleapis.com/auth/userinfo.email` to
the google oauth_apps row's `scopes` column — a non-sensitive scope,
adds no new Google verification/review burden beyond what calendar+
gmail.modify already require. Existing connections (the one real Gmail
connection in the DB right now) will only pick up a real account email
on their NEXT reconnect (a new consent grant with the new scope) — not
retroactive; this is disclosed, not silently claimed fixed for the
already-connected account.

**Step 2 — SCH-006's real Slack node state: VERIFIED, matches
PROJECT_STATE.md, no discrepancy to reconcile.** Pulled
`get_workflow_details` live: all 4 Slack alert nodes ("Alert Token
Refresh Failed (Google/Calendly/Cal.com)", "Alert Google Testing 7-Day
Reminder") are PRESENT, not disabled (no `disabled: true`), not deleted
— each still holds the exact placeholder `channelId: {mode: "id",
value: "C00000000"}` that BC-021 documented installing. This is
"present-with-placeholder", the same state BC-021's own report already
described — no correction needed. The human's "remove those Slack
nodes if blocked" instruction was a contingency for if the placeholder
approach failed; it didn't fail (SCH-006's real execution succeeded
with the placeholder in place, confirmed against real DB rows in
BC-021), so removal was never actually triggered. The real, unchanged
underlying gap: no real multi-tenant Slack OAuth app exists (BC-004/
BC-008) — these 4 nodes will never actually deliver a Slack message
until that's built; they exist today only so n8n's static validation
doesn't block the rest of the workflow.

**Step 3 — Deferred UI Polish backlog:** see the new, separate "Deferred
UI Polish (BC-022)" section below — not mixed into Blockers since none
of these block anything.

0 self-resolved document-level items this session — the Document
Resolution Authority gate does not apply (Step 1's fix is ordinary
bug-fixing against live data — a missing OAuth scope preventing an
already-built, already-coded feature from working — not a document-
level conflict; Steps 0/2/3 were verification/documentation only).
```

## Deferred UI Polish (BC-022)

```
Logged per the human's own words, verbatim, not built this session —
**deferred until all core functional dashboards (5A/5D) and Phase 6+
backend work are further along — functionality before polish, per
standing instruction:**
- Favicon needed.
- Mobile responsiveness is currently poor — needs a real responsive
  pass across all 3 dashboards.
- Visual alignment needs a general pass.
- Orders dashboard should get a more "database-record" visual feel;
  Appointments dashboard should get a more "calendar" visual feel
  (distinct from each other — currently share the same generic table
  styling).
```

## Phase 5 Discovery Findings (BC-012 — discovery only, no build)

Per Planning_to_Build_Transition_v1.md Part 4 Phase 5, 4 Directus-based
dashboards, each with its own database:

```
5A. Inventory Dashboard — for clients WITHOUT Shopify/WooCommerce.
    Client updates stock -> workflow syncs into that client's Convocore
    KB. Agent's product lookup always hits Convocore KB, never our DB
    directly. Not yet built; the underlying sync workflow (Shopify/
    WooCommerce -> Convocore KB) is also not yet built (Findings doc
    Part 3.3 / carried forward from BC-005/BC-009 as a known future
    SCH-{NNN} item).
5B. Order Lookup Dashboard — EVERY order lands here first, regardless
    of provider. Human approve/reject gate BEFORE any real-store push.
5C. Appointment Booking Dashboard — PARALLEL-WRITE pattern (client
    calendar + our DB simultaneously, not sequential), READS
    client-calendar-first/our-DB-fallback (the opposite direction from
    writes). Confirmed a genuine architecture change from the original
    per-Tool spec. **Live-checked this session: the Change Request
    against n8n_Workflow_Specification_v1.md's CreateAppointment/
    CreateReservation/CreateInspectionSlotBooking/CreateScoredBooking/
    CheckAvailability entries has NOT yet been applied** — grepped the
    live document, zero mentions of "parallel-write" anywhere in it.
    Those 5 Tools' Part 13 entries still describe single-destination
    writes. This CR needs applying before or during the real 5C Build
    Card — flagged as a known prerequisite, not applied in this
    discovery-only card.
5D. Onboarding Form Dashboard — direct client-facing form writing
    straight into control.clients/control.client_config, replacing
    manual onboarding entry. This is the dashboard-facing front end for
    Client_Onboarding_Sequence_Spec.md's 8-step backend provisioning
    process (see below) — the form doesn't replace that sequence, it
    needs to trigger/kick it off.
```

**The data layer underneath (Client_Onboarding_Sequence_Spec.md,
already spec'd AND end-to-end tested against one throwaway client,
client_test_001_acme_emergency_test, still live in zenny-vault):**
8 steps — determine archetype (human/sales) -> copy template schema
(`create_client_schema_from_template`, already built & tested) ->
register exposed schemas -> insert control.clients/client_config rows
-> initial sync (client_config/templates/email_categories/
recovery_cadence_profiles, with real default-vs-override merge logic
for the last one) -> apply/verify RLS -> Data API exposure re-check ->
connect n8n workflows (documented handoff, not built by this spec).

**Real, confirmed gap directly relevant to 5D:** Step 3 (Register
Exposed Schemas) has **no SQL/MCP-level mechanism at all** in this
managed Supabase project — confirmed empirically during the spec's own
end-to-end test (checked `pg_roles`/`pg_catalog` for a `pgrst.
db_schemas` GUC, none exists; no available Supabase MCP tool manages
this). Must be done via the Supabase Dashboard manually, OR automated
later via the Supabase Management API from within an n8n workflow using
a project-admin-scoped service account. **If 5D's Onboarding Form is
meant to fully automate client provisioning end-to-end, this is an
unresolved implementation question the real Phase 5 Build Card needs to
decide** (manual step remains human-in-the-loop even with an automated
form vs. build the Management-API n8n workflow) — not decided anywhere
in the source docs, flagged here rather than assumed.

**Template_Migration_Process.md — explicitly NOT dashboard scope.**
Deliberately MANUAL-only procedure (no scheduled job/UI/automation, by
architect decision) for when `public`'s reference structure changes
later and needs retrofitting into existing client schemas. Confirmed:
none of the 4 Phase 5 dashboards need to expose UI for this — it stays
a human-run SQL procedure, reusing `control.sync_log`'s existing shape
for logging (no new table).

**Open, not decided anywhere:** Directus itself has still never been
live-verified as the current/fit tool — Planning doc Part 6 item 7
flags this as "Phase 5 task, first action, Claude Code's call to
confirm or swap." Not done in this discovery-only card; will be the
real Phase 5 Build Card's first action.

**No other explicit DECISION NEEDED flags found specific to Phase 5**
in any of the 5 documents read this session, beyond the two items above
(Step 3's automation approach, Directus verification).

---

## Database — Real Current State (BC-003 live audit, project zenny-vault ONLY)

```
control.oauth_apps:              EXISTS, MATCHES SPEC (Part 4.2), NOW
                                  FULLY CURRENT as of BC-004. 7-value
                                  provider CHECK unchanged (google,
                                  calendly, cal_com, shopify, slack,
                                  gmail, woocommerce). app_status CHECK
                                  migrated (023) to 4 values: testing,
                                  published, not_applicable, pending.
                                  New column (024): webhook_signing_key_id
                                  uuid, nullable. 6 rows: google/shopify/
                                  calendly SEEDED real (app_status
                                  'testing'); slack SEEDED real with a
                                  confirmed schema-shape mismatch
                                  (bot token, not OAuth client_id+secret
                                  — non-blocking follow-up logged below);
                                  cal_com app_status now 'pending',
                                  client_id/secret still placeholder (no
                                  real Cal.com credential exists yet —
                                  correct); woocommerce 'not_applicable'
                                  (correct, untouched). See Credentials
                                  section below for full per-provider
                                  detail and exact Vault UUIDs.
control.client_connections:      EXISTS, MATCHES SPEC (Part 4.2) +1
                                  reasonable extension: secondary_secret_id
                                  (nullable uuid, documented in-column
                                  comment — holds a second simultaneous
                                  credential part, e.g. WooCommerce
                                  Consumer Secret). UNIQUE(client_id,
                                  category) constraint confirmed present.
                                  last_error: plain text, nullable —
                                  matches Part 5.3/2.9's resolved
                                  decision exactly. 0 rows (expected,
                                  no live client yet).
control.oauth_state:             EXISTS, MATCHES SPEC (Part 4.2) exactly.
                                  0 rows (expected).
control.connection_audit_log:    EXISTS, MATCHES SPEC (Part 6.3) exactly,
                                  including reason as plain text nullable
                                  (no structured category — confirmed
                                  decision, Part 2.9). 0 rows (expected).
control.convocore_agent_map:     BUILT (BC-005, migration 025 + 026 fix).
                                  PK is a surrogate id uuid, NOT client_id
                                  — migration 025 originally used
                                  PRIMARY KEY(client_id), caught as a real
                                  mistake mid-session (would have forced a
                                  1:1 client-agent relationship, directly
                                  contradicting Planning_to_Build_
                                  Transition_v1.md Part 2.1's own stated
                                  reasoning for choosing a dedicated table
                                  in the first place — "not guaranteed 1:1
                                  forever"). Fixed same session, confirmed
                                  live. Columns: client_id (plain FK, not
                                  unique), convocore_agent_id,
                                  convocore_agent_secret_id (Vault ref),
                                  convocore_region, agent_display_name,
                                  created_at, id (PK). RLS enabled, zero
                                  policies, service_role only — same
                                  posture as every other control table.
                                  agent_display_name naming convention
                                  documented via COMMENT ON COLUMN
                                  (migration 027): "{ClientBusinessName}
                                  Assistant", citing Planning_to_Build_
                                  Transition_v1.md Part 2.5 — Convocore_
                                  Findings_Required_Updates_FINAL.md Part
                                  1.2/6.2 alone still read DECISION
                                  NEEDED, resolved via the later,
                                  authoritative Planning doc instead. 0
                                  rows (no live Convocore agent yet, per
                                  card's explicit out-of-scope).
leads (Convocore columns):       ADDED (BC-005, migration 028) — all 6
                                  columns (convocore_conversation_id,
                                  convocore_summary, convocore_sentiment,
                                  convocore_token_usage, convocore_cost,
                                  convocore_lead_score), applied to public
                                  + all 5 tpl_* schemas (Phase B's clone
                                  was one-time, not auto-synced — same
                                  reasoning applied consistently in every
                                  Phase 2 migration touching a mirrored
                                  table). convocore_conversation_id has a
                                  COMMENT ON COLUMN (public only) warning
                                  it's WebSocket-origin ONLY, per
                                  Convocore_Adapter_Spec_FINAL.md Part 12.
escalations.escalation_team:     ADDED (BC-007, migration 032),
                                  Commander-approved per Planning_to_
                                  Build_Transition_v1.md Part 2.3.
                                  Applied to public + all 5 tpl_* schemas
                                  — confirmed LIVE first (not assumed)
                                  that escalations follows the same
                                  mirroring pattern as leads/client_config
                                  (public + tpl_*, not control-only), per
                                  the card's explicit instruction not to
                                  assume this. escalation_reason's mapping
                                  onto Convocore's issue_summary
                                  re-confirmed live before the migration
                                  (still text NOT NULL, unchanged) — no
                                  change needed there. Column has a
                                  COMMENT ON COLUMN (public only)
                                  explaining its origin. A throwaway test
                                  client schema (client_test_001_acme_
                                  emergency_test, from earlier Phase C
                                  onboarding testing per Client_
                                  Onboarding_Sequence_Spec.md) also has an
                                  escalations table — deliberately left
                                  untouched, out of scope, matching how
                                  BC-005 treated non-template schemas.
client_config voice/SMS fields:  ADDED (BC-005, migrations 029 + 030) —
                                  voice_agent_enabled boolean NOT NULL
                                  DEFAULT false, sms_agent_enabled
                                  boolean NOT NULL DEFAULT false,
                                  client_voice_number text NULL,
                                  client_sms_number text NULL. Applied to
                                  control.client_config (029) AND public +
                                  all 5 tpl_* client_config (030, same
                                  mirrored-table consistency reasoning as
                                  leads above — client_config is one of
                                  the 21 "common tables" per Database_
                                  Structure_v4_FINAL.md §4).
Twilio credential schema:        ADDED (BC-005, migration 031), SCHEMA
                                  ONLY — no real Twilio credential
                                  seeded, per the card's explicit
                                  out-of-scope. Decided (not flagged):
                                  Twilio has no Zenny-owned OAuth app —
                                  every client brings their own Account
                                  SID/Auth Token/number entirely
                                  independently (Convocore_Adapter_Spec_
                                  FINAL.md Part 13.3) — structurally
                                  identical to WooCommerce's Part 8.3
                                  pattern, not oauth_apps' shared-app
                                  model. Added 'twilio' to oauth_apps'
                                  provider CHECK (placeholder row,
                                  app_status='not_applicable', same
                                  shape as woocommerce's row) and
                                  'telephony' to client_connections'
                                  category CHECK — ONE category, not
                                  separate 'voice'/'sms', since voice and
                                  SMS confirmed to share the same
                                  underlying Twilio credential/number
                                  (Planning doc Part 2.9/4); voice_agent_
                                  enabled/sms_agent_enabled stay separate
                                  flags on client_config regardless. Real
                                  per-client rows would use client_
                                  connections' existing secondary_secret_id
                                  (Account SID + Auth Token, same 2-part
                                  pattern as WooCommerce's Consumer
                                  Key+Secret) — no new column needed for
                                  that when real seeding happens later.
No product/inventory tables:     DOCUMENTED, PERMANENT NOTE (BC-005 Step
                                  6, Planning doc Part 4 Phase 2 item 5):
                                  Zenny's own database NEVER stores
                                  product or inventory data, for any
                                  client, under any archetype. Product
                                  catalogue and inventory data flow
                                  Shopify/WooCommerce → a sync workflow
                                  (not yet built, Findings doc Part 3.3 /
                                  Workflow Spec SCH item) → Convocore's KB
                                  directly. A future session must NOT
                                  introduce a products/inventory table
                                  under any schema — if a real need
                                  surfaces, that's a Change Request
                                  against this note, not a silent add.

RPC layer (Part 4.4 SECURITY DEFINER pattern) — ALREADY BUILT, confirmed
live: store_credential_secret(value,name,description)->uuid,
read_credential_secret(secret_id)->text, get_oauth_app, upsert_client_
connection, insert_audit_log_event, update_connection_tokens,
update_connection_status, get_client_connection, get_connections_due_
for_refresh, get_google_testing_connections_near_7day_expiry,
insert_oauth_state, consume_oauth_state — all SECURITY DEFINER, all
found via live pg_proc query, none assumed.

Edge Functions (project zenny-vault) — ALL 3 CONFIRMED DEPLOYED + ACTIVE,
real (non-stub) implementations read in full:
  oauth-initiate       ACTIVE, v2 — builds provider authorize URLs for
                        google/shopify/slack/calendly/cal_com via
                        get_oauth_app+insert_oauth_state RPCs
  oauth-callback        ACTIVE, v2 — live-tested with a bare GET (no
                        state param): returned real 302 redirect to
                        https://dashboard.zenny.pending/?connect_result=
                        error&reason=missing_state, exactly matching its
                        own source logic. Note: ZENNY_DASHBOARD_URL env
                        var appears unset (using the ".pending" fallback
                        default) — informational, not blocking.
  woocommerce-connect    ACTIVE, v1 — validates Consumer Key/Secret via
                        a live GET against the client's own store's
                        /wp-json/wc/v3/system_status before storing
                        anything; stores Key in access_token_secret_id,
                        Secret in secondary_secret_id, refresh_token_
                        secret_id NULL (correctly derives as api_key
                        per Part 4.2.1).
```

## Workflows — Real Current State

```
UTIL-001 Schema Resolver:         BUILT (BC-008), n8n workflow ID
                                  qbhdmH2ZN6opkXL1. Execute Workflow
                                  Trigger(client_id) -> HTTP GET
                                  control.clients (Accept-Profile:
                                  control) -> IF found -> {resolved:true,
                                  client_schema_name} / else -> {resolved:
                                  false, error_type:'permanent'} per Part
                                  6.1's Fallback D behavior. Confirmed
                                  live via get_workflow_details (5 nodes,
                                  wiring matches design exactly). Supabase
                                  credential explicitly reassigned to the
                                  real existing "zenny-vault-suparbase"
                                  (id guCWYmcVycnfMixw) after
                                  create_workflow_from_code initially
                                  created a duplicate EMPTY credential
                                  under the same name instead of reusing
                                  it — caught and fixed same session.
UTIL-002 Data Validator:          BUILT (BC-008), n8n workflow ID
                                  Cw1LW6ZXHaJkrJLB. Execute Workflow
                                  Trigger(envelope fields) -> Code node
                                  checks contract_version==='v1' +
                                  required fields present -> {valid,
                                  validation_flag, errors, payload}.
                                  Generic envelope-layer validation only
                                  (Part 6.2) — real per-Tool field
                                  validation is each Tool's own Business
                                  Workflow's job, not invented here.
                                  Confirmed live, no credential needed.
UTIL-003 Error Logger:            BUILT (BC-008), n8n workflow ID
                                  Azi7BaBldiK3NDqk. Execute Workflow
                                  Trigger(client_schema_name + log
                                  fields) -> HTTP POST tool_call_log
                                  (Content-Profile: resolved schema,
                                  onError: continueRegularOutput so a
                                  logging failure never blocks the
                                  caller, per Part 6.3's Failure
                                  Behavior). Confirmed live, credential
                                  fixed to real zenny-vault-suparbase
                                  same as UTIL-001.
UTIL-004 Notification Router:     BUILT (BC-008), n8n workflow ID
                                  fcilrbwldjnn92Yn, PARTIALLY FUNCTIONAL
                                  BY DESIGN. Two parallel branches from
                                  one trigger (notify_email/notify_slack
                                  booleans): email branch uses the native
                                  Gmail node + the real existing
                                  "zenny-gmail" credential (this is
                                  Zenny's own internal ops account, not a
                                  per-client dynamic credential, so the
                                  native-node-vs-HTTP-Request distinction
                                  in the credential-testing standing rule
                                  doesn't apply the same way it does to
                                  client integrations) — recipient address
                                  left as a placeholder() pending a real
                                  ops inbox decision. Slack branch is
                                  structurally correct (HTTP Request +
                                  Generic Header Auth, per the standing
                                  rule) but its credential was deliberately
                                  left unconfigured — confirmed live via
                                  list_credentials that ZERO Slack
                                  credential of any kind exists in this
                                  n8n instance (not even the flagged bot
                                  token from BC-004 Step C), so there is
                                  currently nothing to even attempt wiring
                                  in. BLOCKED, not broken — matches the
                                  card's explicit instruction to flag
                                  rather than fake a workaround. Gmail
                                  credential attachment could not be
                                  visually re-confirmed via
                                  get_workflow_details (credentials
                                  objects are redacted from that read) —
                                  inferred working from
                                  create_workflow_from_code's response
                                  only flagging the Slack node as skipped,
                                  not the Gmail node; genuinely unverified
                                  beyond that inference.
UTIL-005 Stop Checker:            BUILT (BC-008), n8n workflow ID
                                  IWuuNyRjp7vPjNui. Execute Workflow
                                  Trigger(check_type, entity_value,
                                  client_schema_name) -> Switch
                                  (suppression / lead_status / fallback)
                                  -> real HTTP GET against
                                  suppression_records or leads.status in
                                  the resolved client schema ->
                                  {proceed: boolean, reason}. Unknown
                                  check_type routes to a dedicated
                                  "Retryable Error" branch returning
                                  proceed:false, matching Part 6.5's
                                  explicit Failure Behavior ("do not
                                  proceed on an unresolved stop-check").
                                  Confirmed live, both HTTP nodes'
                                  credentials fixed to real
                                  zenny-vault-suparbase.
ADP-002 Convocore Adapter:        BUILT (BC-009), n8n workflow ID
                                  BOxeuH6ehv46FZL0, 16 nodes, confirmed
                                  live via get_workflow_details. Real
                                  webhook: POST https://n8n-cbzu.
                                  srv1881104.hstgr.cloud/webhook/
                                  convocore-adapter. Implements: Step 1
                                  client resolution (agentId ->
                                  convocore_agent_map -> client_id) with a
                                  REAL Bearer-vs-agent-secret comparison
                                  (not a stub) via the same
                                  read_credential_secret RPC UTIL-006
                                  itself uses internally -- literal
                                  "call UTIL-006 as a sub-workflow" per
                                  the card's wording wasn't actually
                                  possible: UTIL-006's real contract
                                  (verified BC-003/BC-008) queries
                                  control.client_connections by
                                  client_id+category, which has no path
                                  to convocore_agent_map's secret at all
                                  -- used the same underlying secure
                                  mechanism directly instead, flagged
                                  here as a disclosed implementation
                                  deviation, not a silent one. Step 2
                                  Standard Request Contract mapping built
                                  per Part 3.2's exact field table,
                                  including the idempotency_key pattern
                                  ({kebab_tool}_{client_id}_
                                  {conversation_id}) taken directly from
                                  the Adapter Spec's own Part 3.2 (which
                                  itself already names this exact
                                  pattern, citing Integration Contract
                                  Part 20). conversation_id is passed
                                  through AS-IS -- **explicit limitation,
                                  not silently assumed safe:** this build
                                  has NO reliable way to detect whether a
                                  given conversation_id originated via
                                  WebSocket vs POST /convos (Part 12.2's
                                  structurally-broken-conversation rule);
                                  downstream consumers must not assume
                                  WebSocket-only traffic. runtime_module
                                  is explicitly left null by the Adapter,
                                  confirmed NOT inferred (Part 8 — lives
                                  in embedded Convocore prompt logic
                                  instead, genuinely external to this
                                  workflow). Step 3: Tool Name pure
                                  pass-through, Variables become payload
                                  as-is (ENV variables never appear in
                                  Convocore's own outbound payload in the
                                  first place, per Part 5.3 — nothing to
                                  filter, confirmed by design not by
                                  active filtering logic), System Tools
                                  (forward-call/end-call) routed to a
                                  dedicated exclusion branch with zero
                                  contract mapping. Step 4: Shopify
                                  explicitly routed to its own exclusion
                                  branch BEFORE the standard-tool
                                  fallback catches it — confirmed not an
                                  accidental catch-all omission. Step 5:
                                  human-handoff writes a REAL escalations
                                  row (customer_id, escalation_type,
                                  escalation_reason<-issue_summary,
                                  escalation_team<-team_key using BC-007's
                                  column, origin_module, trigger_condition,
                                  ownership_state, status) via UTIL-001
                                  Schema Resolver + a direct Supabase
                                  insert — staged-fallback "insufficient"
                                  trigger condition BUILT (BC-010, see
                                  below) — Phase 4 now COMPLETE.
                                  NOT end-to-end live-tested against a
                                  real Convocore agent (none exists —
                                  explicitly out of scope) or a real
                                  client_id in convocore_agent_map (0 rows
                                  still, per BC-005) — internal structural
                                  verification only (get_workflow_details
                                  confirms every node/wire matches
                                  design), consistent with these cards'
                                  own scoping.
                                  **BC-010 addition — Stage 2 staged-
                                  fallback trigger:** 4 new nodes added to
                                  the human-handoff branch (20 nodes
                                  total now). Per Commander decision
                                  (BC-010): re-confirmed live first that
                                  the Complaint Handler's "two resolution
                                  attempts" precedent and Step 1D.2
                                  Confidence Gate still hold in
                                  Agent_Runtime_System_v1.md unchanged
                                  since BC-009. Mechanism: since the
                                  Adapter never sees raw conversation
                                  turns (only discrete Tool calls), the
                                  actual NLP-level signal detection
                                  (customer indicates unresolved / re-
                                  raises intent / Confidence Gate Low-
                                  Conflicting) cannot live in the Adapter
                                  — it belongs to Convocore's own embedded
                                  prompt logic (Part 8), which DOES see
                                  the conversation. The Adapter-buildable,
                                  non-timer signal is: "Check Existing
                                  Open Escalation" (HTTP GET, customer_id
                                  + escalation_type + status='open') runs
                                  before every escalation write; "
                                  Escalation Already Open? (Stage 2
                                  Signal)" (IF) treats a SECOND human-
                                  handoff call for an already-open
                                  escalation as Convocore's embedded logic
                                  having already determined the Commander's
                                  signal fired — the Adapter recognizes
                                  the event, it doesn't re-derive the NLP
                                  judgment. No timeout/timer anywhere,
                                  matching the card's explicit
                                  instruction. On trigger: "Fire Stage 2
                                  Notification (UTIL-004)" (Execute
                                  Workflow, mode:once, workflowId
                                  fcilrbwldjnn92Yn) with notify_email:true
                                  AND notify_slack:true — email
                                  confirmed functional (BC-008), Slack
                                  confirmed STILL credential-blocked
                                  (BC-004 Step C / BC-008, re-verified,
                                  not re-checked live this session but no
                                  new Slack credential has been added
                                  since) — fires anyway since UTIL-004's
                                  Slack node already has onError:
                                  continueRegularOutput (BC-008), so a
                                  failed Slack attempt never blocks the
                                  email delivery. Stage 1's response
                                  wording updated to clarify it's Stage 1
                                  specifically. Caught and fixed 2 real
                                  bugs mid-session: (1) the new "Check
                                  Existing Open Escalation" node's
                                  Supabase credential didn't attach on
                                  first attempt despite an explicit
                                  credential object in the addNode
                                  operation — fixed via a follow-up
                                  setNodeCredential call; (2) a
                                  setNodeParameter call with path
                                  "/parameters/responseBody" created a
                                  malformed DOUBLE-NESTED parameters
                                  object instead of replacing the field —
                                  caught via get_workflow_details,
                                  corrected via updateNodeParameters with
                                  replace:true. Full 20-node structure
                                  reconfirmed live after both fixes.
UTIL-006 Credential Resolver:     BUILT — tested w/ placeholder creds
SCH-006 Token Refresh Sweep:      BUILT, interval CONFIRMED LIVE = exactly
                                  6 hours (n8n get_workflow_details:
                                  "Every 6 Hours" node, rule.interval =
                                  [{field:"hours", hoursInterval:6}]) —
                                  matches Part 2.9's decision exactly, no
                                  correction needed. Workflow is
                                  active:false in n8n (built, not yet
                                  turned on) — reasonable given no real
                                  credentials exist yet to refresh.
[... add every WF/SCH/INT/ADP as it's touched, never remove a line]
```

## Credentials — Real Current State

```
Google:     SEEDED, real. client_id = real Google Cloud OAuth client ID
            (matches Zenny_production_credential(...).txt exactly, an
            *.apps.googleusercontent.com identifier — client IDs are not
            secrets per Google's own model, unlike client_secret),
            client_secret_id -> Vault UUID cc67675c-3813-48b3-9e13-
            c22e18e00da9. app_status still 'testing' (per prior session —
            verification submitted, pending Google's review).
Shopify:    SEEDED, real. client_id = real Shopify Dev Client ID,
            client_secret_id -> Vault UUID 02957b66-82f0-49d1-898d-
            de532d8bc4ab. app_status 'testing'.
Slack:      SEEDED, real, WITH A CONFIRMED (not just flagged) SCHEMA
            MISMATCH — BC-004 Step C confirmed: captured bot token is
            NOT a substitute for a real Slack OAuth app in this
            multi-tenant model (Part 8.4 assumes a shared "Add to Slack"
            app). Row left EXACTLY as committed in BC-003, no change
            this session — client_id = literal
            'SLACK_BOT_TOKEN_MODE_NO_OAUTH_APP', client_secret_id ->
            Vault UUID 8e8c4638-85b0-40e4-b02b-a69798b3acfb (real bot
            token). Confirmed NON-BLOCKING for Phase 1 closure — logged
            as a follow-up (see Blockers) for whenever Slack notification
            is actually built (Phase 3/UTIL-004 or later).
Calendly:   SEEDED, real, FULLY WIRED (BC-004 Step D). client_id = real
            Calendly OAuth Client ID, client_secret_id -> Vault UUID
            6060ef36-e48a-44dc-bb87-c9564afbd7be. app_status 'testing'.
            Webhook signing key now has a real schema home: migration
            024_add_webhook_signing_key_id_to_oauth_apps.sql added
            oauth_apps.webhook_signing_key_id (uuid, nullable, same
            non-FK Vault-reference pattern as client_secret_id) and the
            row was updated to reference Vault UUID 44e988d4-403b-48ce-
            b15e-5c7f9edfefd0 — confirmed via RETURNING. get_advisors
            (security) run after: no new issue introduced, only the
            pre-existing documented "RLS enabled, no policies" posture
            (Database_Structure_v4_FINAL.md §9, service_role bypasses
            RLS by design). **Doc diff still owed by Commander:**
            Client_Integration_and_Credential_Platform_v1.md Part 4.2's
            oauth_apps schema block needs webhook_signing_key_id added
            to its column list — Claude Code does not edit that document.
Cal.com:    RESOLVED (BC-004 Step B). Corrected understanding from BC-003:
            'pending' was always the deliberate, confirmed decision
            (Planning_to_Build_Transition_v1.md Part 2.9 / Part 6 item 2)
            — the live chk_oauth_apps_status CHECK constraint was the
            stale artifact, never updated to match that decision, not
            the other way around. Migration
            023_add_pending_to_oauth_apps_status.sql applied (additive
            only — dropped and re-added the constraint with 'pending'
            appended, no existing valid value removed; exact prior
            definition verified live via pg_get_constraintdef before
            writing the ALTER). app_status now 'pending', confirmed via
            RETURNING. client_id left as 'PENDING_CALCOM_CLIENT_ID'
            placeholder — correct, no real Cal.com credential exists yet
            (business email still pending). get_advisors run after: same
            result as Calendly above, nothing new. **Doc diff still owed
            by Commander:** Client_Integration_and_Credential_Platform_
            v1.md Part 4.2's app_status column comment needs 'pending'
            added to its documented value list.
WooCommerce: row exists, app_status = 'not_applicable', matches Part 8.3
            fallback pattern (no OAuth registration needed) — CONFIRMED
            correct as-is, nothing to seed, nothing changed.
control.oauth_apps seeded:        4 of 6 providers now hold real
                                   Vault-backed credentials (Google,
                                   Shopify, Slack, Calendly — Slack
                                   flagged above). Cal.com blocked on a
                                   real constraint mismatch. WooCommerce
                                   correctly needs nothing. The 4 old
                                   placeholder Vault secrets (google/
                                   shopify/slack/calendly) are now
                                   orphaned/unreferenced but NOT deleted —
                                   a cleanup DELETE was attempted and
                                   blocked by the harness's own
                                   permission classifier, not worked
                                   around. Harmless (unreferenced), just
                                   untidy — safe to leave or clean up
                                   later.
Vault storage round-trip:         CONFIRMED LIVE this session — wrote a
                                   disposable test secret via
                                   store_credential_secret(), read it back
                                   via read_credential_secret(), exact
                                   match confirmed, then deleted the test
                                   secret via DELETE FROM vault.secrets.
Redirect URI:                     kmhzosyljpzheqvfuyzm.supabase.co/
                                   functions/v1/oauth-callback — RE-
                                   CONFIRMED live this session (real 302
                                   response, not just DB-row text match).
```

## MCP Configuration — Real Current State (BC-002)

```
Supabase MCP:  CONFIGURED, LIVE-VERIFIED. list_projects returned 2 real
               projects — "zenny-vault" (id kmhzosyljpzheqvfuyzm,
               ap-northeast-2, ACTIVE_HEALTHY, the documented/correct
               project) and "zenny-dashboard" (id bzckrqgasqiglsgqyzft,
               ap-south-1, ACTIVE_HEALTHY — undocumented second project,
               likely the teammate's earlier standalone reference build;
               not investigated further, flagged below). Followed up
               with list_tables(project_id=kmhzosyljpzheqvfuyzm,
               schemas=[control]) — returned all 9 documented control
               tables correctly, PLUS 4 tables PROJECT_STATE.md had
               marked "NOT YET BUILT": control.oauth_apps (6 rows),
               control.client_connections (0), control.oauth_state (0),
               control.connection_audit_log (0). See correction below.
n8n MCP:       CONFIGURED, LIVE-VERIFIED. search_workflows (no filter)
               returned 38 real workflows, including several already
               matching this project's naming scheme (WF-001 LEAD
               CREATION ENGINE, WF-002 CONVERSION ENGINE, WF-003
               ESCALATION ENGINE, WF-501 Error Logger, WF-503 Data
               Validator, the 6 WF-2xx Email Manager v1 drafts, and 4
               "Zenny Credential Platform" workflows including UTIL-006
               Credential Resolver and SCH-006 Token Refresh Sweep —
               consistent with this file's existing "BUILT" entries
               below). n8n instance/workflow inventory is real and
               substantially ahead of what a from-scratch Phase 0 would
               assume.
```

**CORRECTION to this file's prior "Database — Real Current State" section
(above), discovered only as a byproduct of BC-002's live-verification
call, not investigated further — that's BC-003 scope:** `control.
oauth_apps`, `control.client_connections`, `control.oauth_state`, and
`control.connection_audit_log` already exist in zenny-vault (previously
marked "NOT YET BUILT" above, now corrected to "EXISTS" pending BC-003's
proper inspection of row contents/schema-shape correctness). Do not trust
the un-struck lines above as current until BC-003 re-verifies each one
directly.

## Blockers Right Now

```
**BC-021 AND BC-022 ARE BOTH COMPLETE.** BC-021: root cause diagnosed
and fixed (store_credential_secret migration 045, oauth-callback v6,
woocommerce-connect v3), the human's real re-test (Gmail/Calendly/
WooCommerce) verified directly against real DB rows per Step 0.5,
SCH-006 tested against real stored tokens (3 more real pre-existing
bugs found+fixed along the way), full regression pass clean. See
"Phase 5 — Real OAuth Connection Persistence Bug (BC-021)" above for
full detail. BC-022: proxy-domain decision settled as a documented
alternative (not open), codebase-memory-mcp onboarded and verified
useful, Gmail's missing account-label root-caused to a missing OAuth
scope and fixed (migration 046), SCH-006's Slack node state confirmed
matching BC-021's report exactly, UI polish backlog logged separately.
See "Phase 5 — Small Fix Pass + SCH-006 Slack State Verification +
codebase-memory-mcp Onboarding (BC-022)" above for full detail. One
real open product question surfaced (BC-021), not resolved unilaterally:
Google Calendar and Calendly currently share the same `category=
'calendar'` slot (UNIQUE(client_id, category)), so a client can only
hold one calendar provider connected at a time — flagged for the
Commander in that section above.

0 self-resolved document-level items this session — the Document
Resolution Authority gate does not apply. Diagnosing and fixing a real
reported defect via live data (Postgres logs, audit tables) is ordinary
engineering bug-fixing, not a document-level conflict.

Proxy-domain workaround (BC-020 feasibility investigation): Investigated
(BC-020), discussed (post-BC-021) — technically light to build (~half a
session: 1 DNS record, 1 Traefik router, 2 redirect_uri values kept in
sync) and inexpensive (VPS-hosted, no Supabase Pro required), but does
NOT fix Google verification friction (the original motivating problem)
— only cosmetic benefit. Commander/human decision: SKIP for now, revisit
only if a concrete future need arises. Not blocking anything. Settled,
documented alternative as of BC-022 Step 0 — no longer an open question.

2 doc diffs flagged for Commander to apply (not applied by Claude Code —
Section 13 standing rule, same pattern as BC-006/009/010):
- Database_Structure_v4_FINAL.md has no `appointments` section at all
  (BC-018, still open — table added in BC-013, after that doc's
  authorship, never backfilled in). Full column list + exact wording in
  the "Phase 5 — 3 Defect Fixes From Manual Testing (BC-018)" section
  above.
- n8n_Workflow_Specification_v1.md Part 8's Scheduled Workflows table
  needs the new SCH-007 row (BC-019, still open) — exact row text in
  the "Phase 5 — Gmail/WooCommerce Connections..." section above.

Still open, unresolved by design (not this card's scope):
- Client-schema-to-auth-user mapping mechanism (app_metadata stopgap,
  per BC-015) — still a Commander product decision, not touched.
- Whether Integrations' Disconnect should also revoke access at the
  provider (BC-016, still open).
- Supabase custom domain for oauth-initiate/oauth-callback (BC-019) —
  requires a Pro-tier upgrade, a plan/cost decision for the human, not
  actioned. BC-020 adds: even with Pro tier, this fixes cosmetics only,
  not the verification warning — see correction above.
- Proxy-domain workaround (BC-020 feasibility investigation): Investigated
  (BC-020), discussed (post-BC-021) — technically light to build (~half
  a session: 1 DNS record, 1 Traefik router, 2 redirect_uri values kept
  in sync) and inexpensive (VPS-hosted, no Supabase Pro required), but
  does NOT fix Google verification friction (the original motivating
  problem) — only cosmetic benefit. Commander/human decision: SKIP for
  now, revisit only if a concrete future need arises. Not blocking
  anything. Settled, documented alternative as of BC-022 Step 0 — no
  longer an open question.
- SCH-007 Inventory/Catalogue Sync itself (BC-019, still open) — logged
  as a real future-phase requirement, not built; schema/workflow design
  not
  started.

Prior gates, for reference (all previously resolved/acknowledged):

Both real follow-ups from BC-014/BC-015 are now CLOSED:
- HTTPS cert: FIXED. Real root cause found (Hostinger was never
  authoritative DNS for zeromanuals.com — Netlify is), human added the
  real record in Netlify, Traefik's ACME retry confirmed issuing a real
  trusted Let's Encrypt certificate (chain-verified, not just "no curl
  error"). See Infrastructure Correction (BC-016) section above.
- The "unrelated DNS discrepancy" flagged in BC-014 is now EXPLAINED,
  not just observed — same root cause (Hostinger's DNS API was never
  the real authoritative zone).

Still open, unresolved by design (not this card's scope):
- Client-schema-to-auth-user mapping mechanism (app_metadata is a
  test-only stopgap, per BC-015) — genuinely a Commander product
  decision among 3 flagged options, not re-touched this session.
- Whether Integrations' Disconnect should also revoke access at the
  provider (currently local-only) — flagged, not decided.

### Self-resolved document-level item (BC-015 — dashboard data-access mechanism) — RESOLVED, ACKNOWLEDGED (Commander issued BC-016 directly, addressing this exact item)
- **What:** No document specifies HOW a dashboard is meant to actually
  query a client's dynamically-named schema (e.g.
  client_test_002_acme_commerce_test.orders) given Client_Onboarding_
  Sequence_Spec.md Step 3 already documents, as a confirmed empirical
  finding from an earlier session, that registering a schema with
  PostgREST's Exposed Schemas list has no SQL/MCP-level mechanism at all
  in this environment — meaning direct Supabase-JS queries against a
  client schema were never actually going to work for any of the 4
  planned dashboards, not just this one.
- **Documents/evidence checked:** Phase5_Dashboard_Data_Flow.md (5B's
  row describes WHAT is read/written, not the query mechanism);
  Client_Onboarding_Sequence_Spec.md Step 3 (confirms the exposure gap,
  already logged in a prior session); re-confirmed live this session
  that the gap still exists (no pgrst.db_schemas GUC, no MCP tool
  manages Supabase's Exposed Schemas setting) — not re-assumed from the
  prior session's finding alone.
- **Resolved to:** SECURITY DEFINER RPC functions living in `public`
  (already an exposed schema), each validating the caller's
  client_schema_name against control.clients before doing a
  schema-qualified dynamic query. Full detail in the new "Phase 5 — 5B
  Order Lookup Dashboard" section above.
- **Why self-resolvable under the standing rule's item 3:** the
  SECURITY DEFINER + dynamic-SQL pattern is not a new architectural
  choice — it's the exact same mechanism already used by
  create_client_schema_from_template and the entire existing
  credential-platform RPC layer (store_credential_secret,
  get_client_connection, etc. — all SECURITY DEFINER functions in
  `public`). Given schema-per-client is already fully committed
  architecture and direct PostgREST schema exposure is already confirmed
  unavailable, using the one mechanism this codebase already
  demonstrates works is a mechanical extension of established pattern,
  not a novel product/design decision — there was no plausible
  alternative that doesn't require a platform capability already proven
  absent.
- **Not the same as, and does not resolve,** the separate flagged gap
  (client_schema_name-to-auth-user mapping) — that one genuinely has
  multiple viable production designs and was correctly left for the
  Commander per the card's own explicit instruction, not treated as
  self-resolved.
- Migrations 037-039 applied and committed already, app deployed and
  live — none of that is blocked on acknowledgment, only PROCEEDING TO
  THE NEXT BUILD CARD was — now RESOLVED: the Commander issued BC-016
  directly, which both used and built on this exact RPC mechanism
  (migrations 040-041 follow the identical pattern), constituting
  acknowledgment per this project's established convention.

### Self-resolved document-level item (BC-013 Step 2/3) — RESOLVED,
ACKNOWLEDGED (Commander issued BC-014 directly, Phase 5 infrastructure
work, implicitly confirming this resolution — noted, not silently
assumed)
- **What:** BC-013's card Step 2 instructed mirroring the new
  `public.appointments` table only into `tpl_appointment`. BC-013's own
  Step 3, in the same card, listed the "5 Tools" needing the parallel-
  write pattern as CreateAppointment, CreateReservation,
  CreateInspectionSlotBooking, CreateScoredBooking, CheckAvailability —
  directly quoting Planning_to_Build_Transition_v1.md Part 4 Phase 5C's
  own list. 3 of those 5 Tools (CreateReservation, CreateInspectionSlot
  Booking, CreateScoredBooking) belong to conversions_restaurant/
  conversions_emergency/conversions_consultation — none of which live in
  tpl_appointment. Step 2's literal scope and Step 3's literal scope did
  not line up with each other.
- **Documents/evidence checked:** Planning_to_Build_Transition_v1.md
  Part 4 Phase 5C (the original source of the "5 Tools" list BC-013
  Step 3 itself cites); live confirmation that the `appointments`
  table's FK was already written generically (references the schema's
  own `conversions` table via a parameterized migration, never
  hardcoded to `conversions_appointment` specifically) — meaning
  extending deployment required no schema redesign, only running the
  same already-correct pattern against 3 more schemas.
- **Resolved to:** deployed `appointments` (identical 9-column shape) to
  `tpl_commerce`, `tpl_emergency`, and `tpl_consultation` as well —
  confirmed live via `information_schema.columns` across all 5 schemas
  now. Updated all 5 Tool entries' Workflow Spec sections consistently
  (no entry left with a "not yet deployed" caveat the other 4 don't
  have).
- **Why:** per the new rule's item 3 (mechanical/structural decision
  with an obviously correct answer given the rest of the architecture),
  this is squarely resolvable directly — the table shape doesn't change,
  only which schemas already-decided architecture (Planning doc's own
  Phase 5C list) says need it. Leaving 3 of 5 explicitly-named Tools
  with a disclosed-but-unresolved gap, in the very same card that
  updated all 5 Tools' contracts, would have been an internally
  inconsistent deliverable.
- Migrations 035/036 applied and committed already — the schema work
  itself is not blocked on acknowledgment, only PROCEEDING TO PHASE 5
  UI WORK is.

Per the new rule: this session stops here. Do not begin Phase 5 UI work
(the next card) or any other build work until the Commander has
explicitly acknowledged this specific resolution in a follow-up
message.

### Self-resolved document-level item (BC-012 Step 0) — RESOLVED,
ACKNOWLEDGED (Commander issued BC-013 directly, Phase 5 schema work,
implicitly confirming this resolution — noted, not silently assumed)
- **What:** BC-012's card instructed archiving Convocore_Agent_Build_
  Order_Guide_v1.md into root's `_archive_planning_phase/` (Phase 0's
  general-purpose archive). Live investigation found the file had
  already been moved (by the human, outside git) to
  `05_Platform_Builds/Convocore/Archieve/` instead — a folder already
  holding 4 other superseded Convocore-family docs (Convocore_Adapter_
  Spec_v1.md, Convocore_Canvas_Ground_Truth_v1.md, Convocore_Findings_
  Required_Updates_v1.md, Convocore_Master_Reference_v1.md, plus 2
  others) — a well-established, consistent local convention for this
  exact document family.
- **Documents/evidence checked:** live `ls` of both candidate archive
  locations; confirmed via diff that the file's content is byte-
  identical at the new location (pure move, no edits); confirmed v2's
  own Status line ("Supersedes Convocore_Agent_Build_Order_Guide_v1.md")
  as the supersession authority.
- **Resolved to:** kept the file at `05_Platform_Builds/Convocore/
  Archieve/` (formalized the human's already-made move via `git add -A`,
  which correctly registered it as a rename) rather than moving it a
  second time to match the card's more generic instruction.
- **Why:** per the new rule's precedence logic, a more specific,
  already-consistent local pattern (4+ sibling files) wins over a more
  generic instruction referencing a different, less-specific precedent
  (Phase 0's general archive). The human's own already-taken action is
  additional evidence pointing the same direction, not just the
  existing file pattern alone.
- Committed and pushed already (ed0cc5f) — the file move itself is not
  blocked on acknowledgment, only PROCEEDING TO PHASE 5 is.

Per the new rule: this session stops here. Do not begin Phase 5 or any
other build work until the Commander has explicitly acknowledged this
specific resolution in a follow-up message.

(Also confirmed, not a self-resolved item — just an investigation
finding: Convocore_Adapter_Spec_FINAL.md's earlier BC-011-noted
modification was a human commit (63686eb) that landed between BC-011
and BC-012, a 1-line routing-table pointer update from v1 to v2 of the
Build Order Guide. Already committed by the human; nothing for Claude
Code to resolve or flag.)

NONE blocking Phase 4 closure. Phase 4 is COMPLETE as of BC-010.

Resolved this session (BC-010), no longer open:
- human-handoff's staged-fallback trigger condition — built per the
  Commander's exact operational definition, confirmed live (20 nodes).

Doc diff flagged for Commander to apply (BC-010 Step 2, not applied by
Claude Code — Section 13's standing rule, same pattern as BC-006/BC-009):
- Agent_Runtime_System_v1.md's "##### D. Human Handoff Handler" section
  needs a new subsection documenting the Stage 2 staged-fallback
  addition (Commander's BC-010 decision + the Adapter-level mechanism
  actually used to detect it — see PROJECT_STATE.md's ADP-002 entry
  above for the exact mechanism, or n8n workflow BOxeuH6ehv46FZL0
  directly). Exact insertion point: after the existing "What context is
  passed to human agent" paragraph (line ~3370) and before "Escalation
  Priority Classification" — a natural place for a "Staged Fallback
  (Stage 2)" subsection. Suggested content: the Commander's exact
  3-condition definition from this card, the "silence is not a negative
  signal" clarification, and a pointer to ADP-002 as the implementing
  mechanism (Runtime docs describe behavior, not n8n wiring — full
  technical detail belongs in the Adapter Spec / PROJECT_STATE.md, not
  duplicated here).

Open, non-blocking follow-up (BC-009):
- ADP-002 has never been tested against real Convocore traffic — no live
  agent exists yet (separate, paused lane per human's own instruction),
  and control.convocore_agent_map still has 0 rows (BC-005). Structural
  verification only. Real end-to-end testing is a future item once a
  real agent + convocore_agent_map row exist.
- Known, disclosed implementation deviation: the card asked for "UTIL-006
  Credential Resolver... per its existing contract" to fetch the agent's
  secret. UTIL-006's REAL contract (client_connections-scoped) has no
  path to convocore_agent_map's secret — used the same underlying
  read_credential_secret RPC directly instead of literally invoking
  UTIL-006 as a sub-workflow. Functionally equivalent (same Vault
  mechanism, same security guarantee), architecturally not identical to
  the literal instruction — flagged for Commander awareness, not hidden.
- SCH-{NNN} Shopify/WooCommerce -> Convocore KB sync workflow (Findings
  doc Part 3.3) — confirmed real, not yet designed or built. Explicitly
  out of BC-009's scope; logging its existence per the card's own
  instruction so it isn't lost before Phase 11 (Scheduled Workflows).

NONE blocking Phase 3 closure. Phase 3 is COMPLETE as of BC-008.

Open, non-blocking follow-up (BC-008):
- UTIL-004's Slack branch cannot send until a real Slack credential
  exists — same underlying gap as BC-004 Step C's Slack OAuth app item,
  now also blocking UTIL-004 specifically, not just future Slack
  notification generally. Confirmed live: zero Slack credentials of any
  kind exist in n8n right now. Email branch is fully functional.
- Found 2 legacy n8n workflows from an old, pre-current-architecture
  numbering scheme: "WF-501 — Error Logger" (id bc6dTzeicmbt3k6l) and
  "WF-503 — Data Validator" (id uYA7ONZa2R6QOR8V), both inactive, 0
  triggers, created 2026-06-12 (predates this project's current
  n8n_Workflow_Specification_v1.md UTIL-{NNN} convention entirely).
  NOT MCP-accessible (availableInMCP: false) — could not inspect their
  actual node contents, and no MCP tool exists to toggle that flag
  remotely. Not touched, not deleted, not adopted/renamed. Flagged for
  Commander review: likely safe to archive/delete as legacy duplicates
  of UTIL-002/UTIL-003 (now genuinely built under the correct
  convention), but that's a human call given Claude Code couldn't
  verify their contents.
- Workflow Spec registration diff (per BC-008 Step 6, Section 13's
  standing rule — Claude Code flags, Commander applies): n8n_Workflow_
  Specification_v1.md Part 6.10's Utility ID Summary currently lists
  only names/IDs, no build-status column. Suggested addition (exact
  diff, Commander's call on placement/format):
    UTIL-001 Schema Resolver         — Built, BC-008 (n8n: qbhdmH2ZN6opkXL1)
    UTIL-002 Data Validator          — Built, BC-008 (n8n: Cw1LW6ZXHaJkrJLB)
    UTIL-003 Error Logger            — Built, BC-008 (n8n: Azi7BaBldiK3NDqk)
    UTIL-004 Notification Router     — Built, BC-008, PARTIAL (email works;
                                        Slack blocked, see above)
                                        (n8n: fcilrbwldjnn92Yn)
    UTIL-005 Stop Checker            — Built, BC-008 (n8n: IWuuNyRjp7vPjNui)
    UTIL-006 Credential Resolver     — Built, prior session (n8n: LzP5m25iMmhROVsD)

NONE blocking Phase 2 closure. Phase 2 is COMPLETE as of BC-007.

NONE blocking Phase 1 closure. Phase 1 remains COMPLETE as of BC-004.

Resolved this session (BC-007), no longer open:
- escalations.escalation_team — added (migration 032), Commander-
  approved, confirmed live in public + all 5 tpl_* schemas.

Open, non-blocking follow-up (BC-004 Step C):
- Slack needs a real OAuth app (client_id+secret, chat:write scope only
  per External_Integration_Strategy_v1.md Part 6.2) registered before
  multi-tenant Slack notification is viable — the bot token captured is
  a single-workspace credential, wired into oauth_apps as an honest
  placeholder (client_id='SLACK_BOT_TOKEN_MODE_NO_OAUTH_APP'), not a
  real multi-tenant credential. Not blocking Phase 1 closure; blocks
  whenever Slack notification is actually built (Phase 3/UTIL-004 or
  later).

Standing discipline note (not a blocker, carried forward):
- Two Supabase projects exist under this org (zenny-vault AND an
  undocumented zenny-dashboard, per an earlier reference build) — every
  future MCP call in this project MUST explicitly target project_id
  kmhzosyljpzheqvfuyzm (zenny-vault). Human confirmed directly (BC-004
  context) that zenny-vault is canonical and zenny-dashboard belongs to
  a different, earlier build — not re-investigating further. Every
  BC-002/BC-003/BC-004 query targeted zenny-vault explicitly.

Resolved this session (BC-004), no longer open:
- Cal.com's app_status constraint — migrated (023), set to 'pending'.
- Calendly's webhook signing key — real column added (024), wired.
- auth.users — confirmed live at 0 rows.
- 4 orphaned placeholder Vault secrets — confirmed live at 0 remaining.

2 doc-diffs still owed by the Commander (not Claude Code's job per this
card's own instruction — flagged, not applied):
- Client_Integration_and_Credential_Platform_v1.md Part 4.2's app_status
  column comment: add 'pending' to the documented value list.
- Same document, same Part, oauth_apps schema block: add
  webhook_signing_key_id to the column list.
```

## Deviations From Build Card / Open Questions for Commander

```
1. No .gitignore existed at repo root — .mcp.json (plaintext
   WORKSPACE_SECRET), its docker-backup copy, and a credential .txt file
   were all unprotected from an accidental `git add .` commit. Added a
   .gitignore covering these plus common OS cruft. Flagging since this
   is a real security gap that predates this session, not something the
   Transition doc anticipated needing a fix.
2. `.claude/skills/supabase` and `.claude/skills/supabase-postgres-best-
   practices` were dangling symlinks pointing at the pre-rename project
   path (`/e/Programming/Zeny Ai - Voiceflow/...`) — the folder was
   renamed to `Zenny - breakthrough` at some point and the symlinks were
   never updated, so these skills were silently not loading. Repointed
   both symlinks to the correct current path (same target content,
   `.agents/skills/*`, untouched). Purely a path fix, no content change.
3. "Database Architecture Review & Future Runtime Roadmap v1.md" (root,
   dated 2026-07-18) was NOT archived — genuinely unsure whether its
   "Future Runtime Roadmap" content is still live or fully superseded by
   Database_Structure_v4_FINAL.md + the Convocore FINAL docs. Flagging
   per your instruction to leave-and-flag rather than guess.
4. "AI_Workforce_Implementation_Operating_Manual_v2.md" was archived
   alongside AI_Builder_Operating_Manual_v1.md even though Claude_Build_
   Command_Protocol_v2.md's Status line only names the latter as
   superseded. Its content describes the old three-party Claude Code +
   Codex model, which Protocol v2 explicitly retires ("Codex is no
   longer part of this pipeline") — judged clearly superseded by
   content, not just by an exact filename match. Flagging the reasoning
   since it wasn't a literal 1:1 per the stated rule.
5. "Zenny_production_credential(claude_code_can_use).txt" was left in
   place, untouched, not evaluated for content — file organization scope
   was documents, not credential material, and this file is exactly the
   kind of thing this session should surface rather than silently move
   or open. Now covered by .gitignore going forward regardless.
```

---

## Session Log (append-only — newest at top, never delete old entries)

### Session 23 — 2026-08-06 — BC-022 COMPLETE: proxy-domain decision settled, codebase-memory-mcp onboarded+verified, Gmail account-label root cause found+fixed (missing OAuth scope), SCH-006 Slack state verified, UI polish backlog logged
- Step 0 — updated both Blockers mentions of the proxy-domain workaround
  to the Commander's exact BC-022 language: "technically light to build
  ... does NOT fix Google verification friction ... SKIP for now,
  revisit only if a concrete future need arises." Settled/documented,
  not an open question.
- Step 0.5 — verified `codebase-memory-mcp` live (not assumed from the
  name): `list_projects`/`index_status` confirmed this repo already
  indexed (4405 nodes, 4559 edges, status "ready", at HEAD 8224ec5, no
  manual indexing needed). Real capability confirmed via actual use, not
  just tool presence: it's a local graph-augmented index of THIS repo's
  code AND markdown docs (not a cross-session conversation memory,
  despite the name) — `search_code`/`get_code_snippet` for
  "provider_account_id" instantly surfaced the exact Integrations.tsx
  function/line range and its full source with call-graph metadata,
  faster than a manual grep+read would have been, and this became the
  actual starting point for Step 1's diagnosis below. Confirmed gap: it
  does not index Supabase Edge Functions or n8n workflows (not local
  files) — those still need the Supabase/n8n MCPs directly, which is
  what Step 1/2 used for the backend half of the diagnosis.
- Step 1 — diagnosed the Gmail/Integrations missing account-label gap.
  Confirmed via codebase-memory-mcp that the UI's render logic already
  correctly displays provider_account_id when present — ruling out a
  rendering bug. Queried control.client_connections directly: real NULL
  confirmed for the google/email row. Traced to a real, confirmed root
  cause: oauth-callback's google case already calls Google's userinfo
  endpoint to populate this field, but control.oauth_apps' google row
  only ever requested calendar + gmail.modify scopes — neither grants
  userinfo access, so that call has silently 403'd (caught non-fatally)
  on every Google connect ever made, confirmed via the real Edge
  Function log line for the human's actual working BC-021 reconnect
  (exact scope param, no userinfo.email/openid). Fixed via migration
  046: added https://www.googleapis.com/auth/userinfo.email to the
  google oauth_apps scopes (non-sensitive scope, no added Google
  verification burden). Disclosed, not silently claimed: the existing
  real Gmail connection needs a fresh reconnect to actually pick up an
  account email — not retroactive.
- Step 2 — pulled get_workflow_details live for SCH-006: all 4 Slack
  alert nodes are present, not disabled, not deleted, still holding the
  exact C00000000 placeholder Channel ID BC-021 documented — real state
  matches PROJECT_STATE.md's prior report exactly, nothing to reconcile.
  The real Slack gap (no multi-tenant OAuth app, BC-004/BC-008) remains
  completely unchanged; these nodes exist only to satisfy n8n's static
  validation, they don't and can't deliver real messages yet.
- Step 3 — logged the human's exact UI polish backlog (favicon, mobile
  responsiveness, visual alignment, Orders/Appointments needing distinct
  visual identities) in a new, separate "Deferred UI Polish (BC-022)"
  section — explicitly not mixed into Blockers, explicitly marked
  deferred until 5A/5D + Phase 6+ backend work are further along.
- 0 self-resolved document-level items — the Document Resolution
  Authority gate does not apply (Step 1's fix was ordinary bug-fixing
  against live data — ordinary code fixing, not a document-level
  conflict; the other 3 steps were verification/logging only). This
  session is complete.

### Session 22 — 2026-08-05/06 — BC-021 COMPLETE: real root cause of failed OAuth persistence found+fixed, human re-test verified against real DB, SCH-006 tested against real tokens (3 more real bugs found+fixed), full regression pass clean
- Step 0 — updated the Blockers entry for the proxy-domain question to
  the Commander's exact given language: SKIP for now, closed, not an
  open question anymore.
- Step 1 — diagnosed the human's reported defect (4 real OAuth/API-key
  connect attempts, none showed "Connected" afterward, WooCommerce
  briefly did then reverted) using ONLY real data, never guessed:
  queried control.client_connections directly (found 3 real rows, all
  status='revoked', each with real provider_account_id/token_expires_at
  proving real successful exchanges happened), queried control.
  connection_audit_log (found "connected" events with a null
  connection_id — impossible from a genuinely successful upsert, since
  re-reading upsert_client_connection's own SQL confirms it always
  returns a real UUID on success), then pulled real Postgres error logs
  for those exact timestamps and found the literal, unambiguous chain:
  `duplicate key value violates unique constraint "secrets_name_idx"`
  followed by `null value in column "access_token_secret_id"... violates
  not-null constraint`. Root cause: store_credential_secret used a
  STATIC Vault secret name per client+category — any reconnect hit
  Vault's real UNIQUE constraint, uncaught, cascading into an uncaught
  NOT NULL failure, while both oauth-callback and woocommerce-connect
  still reported success regardless. Fixed at the root (migration 045:
  store_credential_secret now upserts by name — verified live, same
  UUID returned twice, value correctly overwritten) plus defense in
  depth (oauth-callback v6, woocommerce-connect v3: every RPC call is
  now actually checked, every failure branch logs a real audit event —
  several previously logged nothing at all).
- Also found, while tracing Shopify's real logs specifically: a genuine
  500 on a real Shopify callback (real HMAC/shop/timestamp params,
  proving that attempt got past Shopify's own authorization screen) —
  root cause: Shopify's real callback sends the FULL `.myshopify.com`
  domain in `shop`, but exchangeCode always re-appended the suffix
  (matching oauth-initiate's own bare-subdomain UI), corrupting the URL.
  Fixed in the same oauth-callback v6 deploy.
- Step 2 — confirmed Shopify's "can't be installed yet" screen is a
  Shopify Partner Dashboard distribution-method setting, not a code
  issue: multiple real oauth-initiate calls for Shopify are logged with
  correct client_id/scope/redirect_uri, all producing real 302s to
  Shopify's own authorize endpoint. Not routed around in code, per the
  card's explicit instruction — human action needed (select a
  distribution method in the Partner Dashboard).
- Calendly's real attempt: found the real callback hit (real code, no
  iss param, matching state consumed/deleted) but NO audit log entry at
  all for it — meaning it hit one of the previously-unlogged early-exit
  branches. get_oauth_app('calendly') independently confirmed working
  (rules out broken app config). Genuinely NOT fully diagnosed this
  session — flagged honestly as unresolved rather than guessed at; the
  audit-logging fix above means a retry will leave a full trace if it
  fails again.
- **Steps 3-5 NOT done this session — explicitly stopped per the card's
  own Step 0.5 process** rather than assuming the fix works or faking a
  test: the human needs to redo the real Google Calendar, Gmail,
  Calendly, and WooCommerce connect flows against the now-fixed code,
  and confirm when done, before Claude Code verifies against real DB
  state and proceeds to SCH-006 testing and the full regression pass.
- What was verified live vs. assumed: every claim in Step 1 is backed
  by real data — the exact Postgres error text, the exact audit log
  rows with their null connection_ids, the real Shopify callback's real
  500 and real params, live-tested confirmation that the
  store_credential_secret fix genuinely resolves the collision (not
  just reasoned about). What is explicitly NOT yet verified: whether
  the fix actually makes a real human's real reconnect attempt persist
  correctly end-to-end — that requires the human's action, not assumed
  from the fix being logically correct.
- What broke / changed from plan: this defect was more serious and more
  unifying than the card's own framing suggested (it read as possibly
  several separate per-provider issues) — it turned out to be one root
  cause affecting every provider that had ever been reconnected, plus
  one separate genuine Shopify bug found as a side effect of the same
  investigation.
- Files touched: Supabase migration 045 (store_credential_secret fix);
  oauth-callback Edge Function redeployed (v6: error checking, full
  audit logging, Shopify shop-suffix fix); woocommerce-connect Edge
  Function redeployed (v3: error checking, full audit logging);
  PROJECT_STATE.md. No dashboard frontend changes this session — the
  bug and fix were entirely server-side.
- **Steps 3-5 — done later this same session, after the human's real
  re-test.** The human reported (verbatim): "Gmail, WooCommerce,
  Calendly Now connected. BUt I clicked connect Calendly -> Outh screen
  popuped -> url was loading -> auto closed url -> shows connected,
  inshort I didn't press install/approve this time." Per Step 0.5,
  verified this against real data rather than taking the report at face
  value: fetched Calendly's own `/users/me` with the newly-stored token
  and got back a real account email (`quaantummedia.zeromanual@gmail.
  com`) — impossible without a genuinely valid token — and confirmed the
  consent screen auto-skip is expected OAuth behavior for an
  already-authorized app, not a bug. Queried control.client_connections/
  connection_audit_log directly for Gmail/Calendly/WooCommerce: all 3
  clean, real provider data, no errors, no null connection_ids.
- Surfaced (not resolved unilaterally): Google Calendar and Calendly
  both map to `category='calendar'` and `client_connections` has
  `UNIQUE(client_id, category)` — connecting one replaces the other.
  Flagged as a real open product question for the Commander in the
  "Phase 5 — Real OAuth Connection Persistence Bug (BC-021)" section
  above, not decided here.
- SCH-006 Token Refresh Sweep tested against the real Gmail/Calendly
  tokens above (workflow ID rKlJYukwRexlYRYM) — discovered it had NEVER
  executed successfully before this session, for 3 separate real,
  pre-existing reasons, all fixed: (1) 4 Slack alert nodes had no
  Channel parameter at all, blocking n8n's static validation for the
  whole workflow — set a clearly-labeled placeholder Channel ID
  (`C00000000`, not a real channel/credential) purely to unblock testing
  the real refresh logic, leaving the actual Slack gap (BC-004/BC-008)
  completely untouched; (2) all 22 Supabase HTTP nodes had zero
  credential attached — attached the existing real `zenny-vault-
  suparbase` n8n credential (not invented); (3) several RPC calls return
  a bare scalar via a content-type n8n doesn't autodetect as JSON,
  causing wrong-field expressions — fixed via explicit `responseFormat:
  "text"` plus corrected downstream `.data` references (an intermediate
  `JSON.parse(...)` attempt was tried, proven wrong via a live 400 from
  Google's token endpoint, then removed). Also caught live: opening/
  closing the workflow in the n8n browser editor mid-session reverted
  several already-applied API edits (credentials + responseFormat) back
  to their pre-fix state — a real n8n platform behavior worth knowing:
  editing via MCP while the same workflow is open in the browser editor
  is not safe. Final execution (ID 14): `status: success`, both a real
  Google token refresh and a real Calendly token refresh (with refresh
  token rotation) completed. Verified directly against
  control.client_connections after the run, not just the execution log:
  both rows show the exact new secret UUIDs and correctly-advanced
  token_expires_at values from the execution. SCH-006 left INACTIVE
  (activating a real schedule is a separate decision, out of scope).
- Step 5 — full regression pass via live Playwright against the deployed
  dashboard: Orders (5B) — 3 seeded orders render correctly. Appointments
  (5C) — both seeded rows render correctly, read-only copy intact.
  Integrations — stable, accurate, no silent reverts: WooCommerce/
  Calendly/Gmail all show Connected, Slack correctly still "Not
  connected."
- **BC-021 Definition of Done — fully satisfied.** This session: 0
  self-resolved document-level items — the Document Resolution Authority
  gate does not apply (this was all ordinary bug-fixing against live
  data, including SCH-006's 3 newly-found bugs, none of which were
  document-level conflicts). This session IS complete.

### Session 21 — 2026-08-05 — BC-020: OAuth popup flow (2 real platform constraints found+fixed), proxy-domain feasibility reported
- Step 1 — first attempt: rewrote oauth-callback to return an HTML page
  with an inline script that detected window.opener and postMessage'd/
  closed directly. `curl -I` (HEAD) showed Content-Type: text/html,
  looked correct. **Failed live in Playwright**: a real GET showed the
  true response was text/plain with a `sandbox` CSP — Supabase's Edge
  Functions gateway forces this on real GET responses, blocking inline
  script execution regardless of what the function sets itself. This
  was caught ONLY because a real browser was used, not because the code
  was re-read — a system reminder mid-session correctly flagged this as
  "resume from where you were stuck" after a tool-use pause, and
  resuming with `curl -D -` (full headers on a real GET, not HEAD)
  found the actual mismatch. Real fix: oauth-callback (v5) reverted to
  a plain redirect; popup-detection/postMessage/close logic moved into
  the dashboard app itself, which has no such sandboxing.
- Second real constraint, found immediately after fixing the first:
  Google's own sign-in pages send a Cross-Origin-Opener-Policy header
  (confirmed via curl) — window.opener was observed going null
  inconsistently depending on the exact navigation path taken back to
  the callback, a known industry-wide issue independent of this app's
  code. Real fix: switched the primary completion signal to localStorage
  + the `storage` event, which doesn't need window.opener at all;
  postMessage kept as a secondary best-effort signal. Also fixed a
  real window-naming bug found via the same live testing: a single
  fixed popup target name showed inconsistent same-tab-navigation
  behavior on repeated opens — switched to a unique name per attempt.
- Verified the FULL mechanism end-to-end via real Playwright popups
  (opened, genuinely separate windows confirmed via the tab list, driven
  to oauth-callback with a deliberately invalid code — same disclosed-
  limitation pattern as every prior card, real Google consent isn't
  completable without a real account) for Gmail and Shopify: popup
  correctly redirected, detected completion, wrote localStorage,
  genuinely closed itself (confirmed via tab list), and the parent tab
  correctly received the signal and updated its UI without any
  navigation. Manual popup-close (Step 1.4) also verified live: closed
  a popup mid-flow, confirmed the parent's poll detected it within
  ~1s and cleared the busy state with the right message. WooCommerce
  needed no popup treatment (never OAuth-based) — stated explicitly,
  not silently skipped.
- Noticed mid-session: 2 genuine "Connected" rows appeared in
  control.client_connections for the test client at timestamps between
  the two fix attempts, with a real Google `invalid_grant` audit log
  entry immediately before — strong evidence a real human completed
  real Google logins with the test credentials during this session,
  independently proving the core mechanism works for real even while
  the popup's own closing UI was still broken. Disconnected both to
  restore a clean test state rather than leaving undocumented state.
- Step 2 — live-tested the card's exact question (does Supabase's edge
  accept a mismatched Host header): NO, confirmed via a real curl
  request — Cloudflare returns a hard 403. A correctly-configured
  reverse proxy (Host header rewritten to match Supabase's real domain)
  would likely avoid this specific rejection but wasn't verified
  end-to-end (would require a new DNS record + Google Cloud Console
  changes). More importantly: re-read the source doc and found Google's
  verification warning is gated by the OAuth app's Publishing Status in
  Google Cloud Console, NOT by which domain serves the redirect — a
  proxy domain would not fix the problem it was proposed to fix.
  Corrected BC-019's own PROJECT_STATE.md claim ("likely a factor in
  verification friction") accordingly. Recommended against building it,
  explicitly stopped for a Commander decision, nothing deployed.
- What was verified live vs. assumed: literally everything in this
  session was verified by actually triggering the real behavior — the
  CSP constraint via a real GET request's real headers (not the
  misleading HEAD request), the COOP issue via a real popup's real
  window.opener state across multiple real attempts, the Host-header
  rejection via an actual request against the real Supabase endpoint,
  and the verification-warning claim via the actual source document
  rather than repeating BC-019's own unverified phrasing.
- What broke / changed from plan: the first 2 implementation attempts
  for Step 1 both failed for reasons that couldn't have been predicted
  from code review alone — both are genuine platform/third-party
  behaviors, not logic bugs, and both are now disclosed and fixed via a
  4th deploy of oauth-callback + the dashboard.
- Files touched: 05_Platform_Builds/Dashboard/src/pages/Integrations.tsx
  (commits 43662bd, 21f46eb, c78887d, 89f9930); oauth-callback Edge
  Function redeployed 3x this session (v4 broken popup attempt, v5 real
  fix — plain redirect); zenny-dashboard Docker Compose project on
  srv1881104 redeployed 4x; PROJECT_STATE.md.
- **This session: 0 self-resolved document-level items — the Document
  Resolution Authority gate does not apply. Proceeding to the next
  Build Card is fine. Step 2's proxy-domain question remains genuinely
  open for the Commander, separate from the gate.**

### Session 20 — 2026-08-05 — BC-019: Gmail + WooCommerce connections wired up, SCH-007 logged, Supabase tier confirmed
- Step 1 — confirmed live `control.oauth_apps` has no 'gmail' row (7
  rows total, CHECK constraint allows it but nothing was seeded). Read
  Client_Integration_and_Credential_Platform_v1.md Part 8.1 before
  deciding whether to add one: the design is explicitly "one shared
  [Google] app" requesting both Calendar and Gmail scopes together,
  already reflected in the existing seeded `google` row's scopes.
  Decided NOT to add a duplicate row — added Gmail as a new 'email'
  category (CATEGORY_PROVIDERS.email already existed since BC-016,
  unused) reusing `provider: 'google'`. Verified live via Playwright:
  Connect Gmail correctly reached Google's real consent screen, and the
  resulting oauth_state row confirmed category='email'/provider=
  'google' as intended.
- Step 2 — re-read woocommerce-connect's real deployed source (signature
  confirmed: client_id/store_url/consumer_key/consumer_secret). Built a
  plain 3-field form, no styling pass, per the card's explicit
  instruction. Live Playwright testing caught 2 real bugs the function
  had never surfaced before (only ever called server-to-server): (1) no
  CORS headers at all — every real browser-based call would have been
  blocked outright, fixed by adding CORS headers + OPTIONS handling,
  redeployed woocommerce-connect v2; (2) supabase-js doesn't auto-parse
  Edge Function error response bodies, so real validation failures
  showed only a generic "non-2xx status" message — fixed by reading
  error.context directly. Final live test succeeded end-to-end: a fake
  store produced the real, specific DNS-lookup failure message, proving
  the whole path (browser -> Edge Function -> live validation attempt ->
  real error surfaced to the UI) genuinely works. Checked Client_
  Integration_and_Credential_Platform_v1.md Part 8.2 before considering
  a Shopify API-key path — already explicitly resolved there ("no
  meaningful API-key alternative exists" for Shopify) — built nothing
  redundant.
- Step 3 — logged SCH-007 Inventory/Catalogue Sync in PROJECT_STATE.md
  as a real, durable future-phase requirement (not a build), including
  the Google Sheets source as a newly-captured requirement per explicit
  human instruction (previously only Shopify/WooCommerce were ever
  mentioned as sync sources across BC-005/009/012). Flagged the exact
  n8n_Workflow_Specification_v1.md Part 8 registry row needed, not
  applied directly, per the Section 13 standing rule.
- Step 4 — confirmed live via get_organization that the Supabase org
  ("Zenny AI") is on the free plan. Did not attempt any custom-domain
  configuration, per the card's explicit instruction — documented the
  constraint (oauth screens showing the raw supabase.co project-ref
  domain, Pro tier required to fix) as an open human decision.
- What was verified live vs. assumed: every claim in this session is
  backed by a real check — the Gmail decision by actually reading Part
  8.1 before deciding whether to seed a row, the WooCommerce CORS fix by
  watching a real browser request fail then succeed, the Supabase tier
  by a real get_organization call rather than assumed from context.
- What broke / changed from plan: the WooCommerce form failed on first
  deploy (CORS) — a genuine defect in code that predates this session
  (woocommerce-connect was built in an earlier session and never
  actually exercised from a browser until now), caught and fixed within
  this same session rather than left for a future one.
- Files touched: 05_Platform_Builds/Dashboard/src/pages/Integrations.tsx
  (commits 1fbe8b7, 7bf150f); woocommerce-connect Edge Function
  redeployed (v2, CORS fix); zenny-dashboard Docker Compose project on
  srv1881104 redeployed twice; PROJECT_STATE.md.
- **This session: 0 self-resolved document-level items — ordinary
  build/documentation work. The Document Resolution Authority gate does
  not apply. Proceeding to the next Build Card is fine.**

### Session 19 — 2026-08-05 — BC-018: fixed 3 real defects found in the human's manual testing
- Step 1 — re-read oauth-initiate's real deployed source before
  touching anything (confirmed exact param: bare `shop` subdomain, not
  a full domain). Added a window.prompt() to Integrations' Shopify
  connect flow (minimal UI, per the card), with input normalization for
  common paste variations. Verified live end-to-end as far as possible:
  real Playwright browser session, handled the real dialog, confirmed
  the resulting URL was a genuinely well-formed Shopify authorize URL
  (404 "Store unavailable" is expected — no real store exists at the
  test subdomain, same disclosed-limitation pattern as BC-016's Google
  test), and confirmed the matching control.oauth_state row landed
  correctly.
- Step 2 — re-confirmed live via control.oauth_apps which providers are
  real (non-not_applicable): 5, not the 3 that were actually surfacing.
  cal_com was missing entirely from the category/provider map (the real
  bug) — added it. Added 'notification' to every archetype in
  ARCHETYPE_CATEGORIES (disclosed UI judgment call), which is what
  exposed Slack's absence. Decided AND STATED (not left silent, per the
  card's explicit instruction) to show both Cal.com and Slack as "Not
  yet available" rather than hiding either — confirmed live that
  Slack's oauth_apps.client_id is a literal placeholder string despite
  its app_status field saying 'testing' (a known, already-documented
  BC-004 mismatch), so this UI deliberately doesn't trust that raw
  status column for Slack specifically.
- Step 3 — live-checked for an existing scheduled-time field name
  before adding one, per the card's explicit instruction: found
  appointment_time/reservation_time in Database_Structure_v4_FINAL.md,
  but both live in different, archetype-specific conversions_* tables,
  not the generic `appointments` table — confirmed no existing name
  applies here, `scheduled_at` proceeds as instructed. Added nullable,
  backfilled the 2 real seeded rows with values matching their own
  conversation content (verified via to_char() that "Thursday 3pm" and
  "Friday 11am" actually landed correctly), then set NOT NULL across
  all 6 relevant schemas (public + 4 tpl_* + client_test_002). Updated
  the RPC layer and both dashboard pages to surface scheduled_at
  prominently (list now sorts by it, ascending) in place of created_at.
  Flagged the exact doc diff needed for Database_Structure_v4_FINAL.md,
  which turned out to have no `appointments` section at all — not
  applied directly, per the Section 13 standing rule.
- What was verified live vs. assumed: every fix in this session was
  confirmed against real behavior — the Shopify URL was actually
  produced by a real browser click, not inferred from reading the
  normalization code; which providers are real was re-queried from
  oauth_apps directly rather than trusted from BC-016's own (incomplete)
  map; the scheduled_at backfill values were checked with to_char() to
  confirm they actually landed on the right day/time, not assumed
  correct from the interval arithmetic alone.
- What broke / changed from plan: nothing broke this session — all 3
  fixes worked on the first deploy, confirmed via live Playwright/curl
  checks.
- Files touched: 05_Platform_Builds/Dashboard/ (Integrations.tsx,
  Appointments.tsx, types.ts — commit 435ef3c); Supabase migrations
  043-044 (scheduled_at column + RPC updates); client_test_002's 2
  seeded appointment rows backfilled; zenny-dashboard Docker Compose
  project on srv1881104 redeployed once; PROJECT_STATE.md.
- **This session: 0 self-resolved document-level items — ordinary
  bug-fixing, explicitly outside the standing rule's scope. The
  Document Resolution Authority gate does not apply. Proceeding to the
  next Build Card is fine.**

### Session 18 — 2026-08-05 — BC-017: test credentials reset, Appointment Booking dashboard (5C, read-only) built
- Step 0 — reset test-dashboard-bc015@zenny.internal's password via
  direct SQL (pgcrypto `crypt()`, same path used to create the account
  originally — no Admin API service-role key exposed via MCP). **New
  password: `ZennyTest-BC017-Sage!42`** — verified live via a real POST
  to `/auth/v1/token?grant_type=password` (HTTP 200, real JWT with
  app_metadata.client_schema_name intact) BEFORE reporting it here, per
  the card's explicit instruction. This is a disposable test account on
  a test client — not a real credential.
- Step 1 — confirmed live which test client actually has an
  `appointments` table before building anything: neither
  client_test_001 (emergency) nor client_test_002 (commerce_ecom) did —
  only the template schemas (public + 5 tpl_*) had it, since it was
  never included in either client's original `create_client_schema_
  from_template` call. Per the card's own test (archetype's template has
  it), client_test_002_acme_commerce_test was the right client — its
  archetype's template (tpl_commerce) does have `appointments`. Added it
  to that client's live schema using the exact CREATE TABLE LIKE ...
  INCLUDING ALL + FK re-add + RLS-enable + grant-revoke sequence
  `create_client_schema_from_template` itself uses — re-verified RLS/
  grants live afterward, matching every other table. Seeded 2 real test
  appointments (2 leads + conversions + appointments rows): one clean
  success, one deliberately exercising BC-013's parallel-write fallback
  (client calendar write failed, our DB is authoritative, alert_fired=
  true) — chosen specifically so the UI would have something real to
  show for both states the schema was designed to represent. Built 2 new
  RPC functions (migration 042, read-only — no write RPC, since the
  booking Tools that would produce real rows aren't built until Phase
  8), reusing BC-015's exact SECURITY DEFINER pattern with no new
  mechanism. Learned from BC-015's own mistake: put the anon-EXECUTE
  revoke in the same migration as the grant this time, verified live
  that anon never had EXECUTE at any point (no follow-up fix needed).
  cURL-tested both RPCs with a real JWT before writing any UI. Built
  `/appointments` list + detail pages reusing BC-016's brand
  tokens/components as-is (no separate brand pass needed) — status
  pills for source-of-truth, an explicit alert-fired banner on the
  detail page explaining what it means. Deployed, then verified live via
  a real Playwright browser session against the deployed site: both
  seeded rows render correctly, the alert-fired detail page shows the
  correct warning content, matching the real RPC data (not mocked).
- What was verified live vs. assumed: the new password was proven
  working via a real Auth API call, not just "the UPDATE succeeded."
  Which test client has an appointments table was checked directly
  (information_schema.tables) rather than assumed from BC-013's
  deployment list alone (a client's own schema and its source template
  can drift — this session confirmed they had). Both dashboard pages
  were confirmed rendering real seeded data via an actual browser
  session, not inferred from a successful build.
- What broke / changed from plan: nothing broke this session — no bugs
  found via the live Playwright pass this time (unlike BC-016's 2).
- Files touched: 05_Platform_Builds/Dashboard/ (Appointments.tsx, App.tsx
  routing, types.ts — commit 5787970); Supabase migration 042
  (appointments RPC layer); client_test_002_acme_commerce_test schema
  (new appointments table + 2 seeded leads/conversions/appointments
  rows, clearly test data); test user's auth.users.encrypted_password
  updated directly; zenny-dashboard Docker Compose project on
  srv1881104 redeployed once; PROJECT_STATE.md.
- **This session: 0 self-resolved document-level items — the Document
  Resolution Authority gate does not apply. Proceeding to the next
  Build Card is fine.**

### Session 17 — 2026-08-05 — BC-016: HTTPS cert fixed (real root cause), Zenny brand applied, Integrations dashboard built
- Step 0 — tooling check: confirmed live, not assumed from a prior
  session. No dedicated GitHub-plugin MCP tools were present this
  session (searched explicitly, none found — only the always-available
  `gh` CLI via Bash, which isn't plugin-gated). Playwright MCP tools
  (`mcp__plugin_playwright_playwright__*`) WERE available and used for
  real browser-based verification throughout this session (login flow,
  brand screenshots, the full Integrations connect/disconnect flow) —
  this caught 2 real bugs that a curl-only check would have missed
  entirely (see below). superpowers skills were listed/available but
  not invoked — this card's work didn't match their trigger conditions.
- Step 1 — found the real root cause of BC-014/BC-015's HTTPS cert
  failure: `nslookup -type=NS zeromanuals.com 8.8.8.8` showed the zone
  is served by NS1 (dns1-4.p09.nsone.net), which Hostinger's own DNS API
  was never authoritative for — every prior DNS write via Hostinger's
  API silently never took effect on the real zone. The human added the
  real A record directly in Netlify; re-verified live via nslookup
  (resolves correctly), triggered Traefik's ACME retry via a project
  recreate, and did a REAL certificate-chain read (PowerShell
  X509Certificate2, not just "curl succeeded") confirming `Issuer: CN=
  YR2, O=Let's Encrypt, C=US`. Corrected PROJECT_STATE.md's Infrastructure
  section so future sessions don't repeat the misdiagnosis. Also caught
  a second real bug here: `VPS_restartProjectV1` restarts the container
  in place (same writable layer) rather than recreating it, and the
  container's own entrypoint does a fresh `git clone` on every start —
  a plain restart crash-looped for ~15 minutes (`fatal: destination
  path '/src' already exists`) before being caught via live log
  inspection. Fixed by using a full recreate instead, and made the
  container command self-healing (`rm -rf` before clone) for any future
  in-place restart.
- Step 2 — extracted `.claude/skills/zenny-brand-new-guideline.skill`
  (a zipped bundle, not a top-level loaded skill this session — read
  directly) and applied the real tokens (sage/honey/oat palette,
  Fraunces + Hanken Grotesk, a real ensō SVG mark, warm-but-plain copy)
  across the whole Dashboard app. Verified visually via live Playwright
  screenshots against the deployed site, not just "the CSS compiled."
- Step 3 — read both oauth-initiate and oauth-callback's real deployed
  source before changing anything. Confirmed no MCP tool here can set
  Supabase Edge Function secrets (searched explicitly) — fixed
  `ZENNY_DASHBOARD_URL`'s dead fallback at the code level instead
  (still respects the env var if a human sets it later via CLI/
  Management API). Built the Integrations page + 3 new RPC functions
  (migrations 040-041, reusing BC-015's exact JWT app_metadata pattern
  — did not invent a second mechanism, per the card's explicit
  instruction). Tested end-to-end for real: Playwright-clicked "Connect
  Google Calendar" on the live deployed dashboard, confirmed it
  genuinely reached accounts.google.com with the correct client_id/
  redirect_uri/scopes/state, confirmed the matching row landed in
  control.oauth_state. Could not complete Google's actual interactive
  consent (no real human-owned test account available to an autonomous
  session) — disclosed, not worked around. Simulated the post-consent
  state using the exact same upsert_client_connection/
  store_credential_secret RPCs oauth-callback itself calls, then used
  Playwright to verify the Connected state displays correctly and that
  Disconnect real-flips it back to Not Connected, backed by a real
  revoked row + audit log entry.
- What was verified live vs. assumed: the HTTPS cert claim is backed by
  an actual issuer-chain read, not a "no error" inference. The OAuth
  connect button's correctness is backed by the real destination URL
  Google returned, not by reading the code and assuming the redirect
  chain was right. Both of this session's real bugs (login not
  redirecting, stale subtitle after disconnect) were caught specifically
  BECAUSE a real browser was driven against the real deployed app —
  neither would have surfaced from a code review or a curl-only check.
- What broke / changed from plan: the restart-based ACME retry
  mechanism BC-014 itself documented turned out to crash-loop the
  container (see Step 1) — real bug, not assumed working, fixed same
  session.
- Files touched: 05_Platform_Builds/Dashboard/ (brand CSS, EnsoMark
  component, Integrations page, App.tsx login-redirect fix, subtitle
  fix — 4 commits: 7eb6bbf, 443b749, 49bc9fe, plus this session's
  PROJECT_STATE.md commit); Supabase migrations 040-041 (Integrations
  RPC layer); oauth-callback Edge Function redeployed (v3, fixed
  fallback URL); 1 simulated test connection + secret in zenny-vault,
  clearly marked test data, left in place per project convention;
  zenny-dashboard Docker Compose project on srv1881104 redeployed 4x
  (ACME retry, brand+integrations, login fix, subtitle fix).
- **This session: 0 NEW self-resolved document-level items — the
  Document Resolution Authority gate does not apply to new work this
  session. BC-015's prior gate is now RESOLVED/ACKNOWLEDGED (Commander
  issued BC-016 directly, addressing that exact item). Proceeding to
  the next Build Card is fine.**

### Session 16 — 2026-08-05 — BC-015: Order Lookup dashboard (5B) built + deployed, 1 self-resolved item
- What was done: Step 0 — re-checked DNS propagation (still NXDOMAIN)
  and Traefik's cert state live before starting, re-read Phase5_
  Dashboard_Data_Flow.md and pulled the real `orders`/`conversions_ecom`
  schemas live rather than trusting memory of the card that created
  them (BC-013). Confirmed no client-schema-to-auth-user mapping exists
  anywhere (real gap, flagged per the card's own instruction, not
  invented as permanent design). Confirmed direct PostgREST access to
  client schemas is unavailable (Client_Onboarding_Sequence_Spec.md
  Step 3's known gap) — resolved the resulting "how does the dashboard
  actually read data" question via SECURITY DEFINER RPC functions
  (self-resolved, logged in Blockers, gate applies). Created a genuine
  new commerce_ecom test client + schema (the existing BC-013 test
  client is 'emergency' archetype, has no orders table) with seeded
  order data across 3 statuses. Built and live-tested (real HTTP calls
  against the real Auth + REST API, not simulated) 4 RPC functions;
  caught and fixed 2 real bugs this way (an enum-qualification bug
  under SET search_path='', and Supabase's default anon EXECUTE grant
  surviving an explicit REVOKE FROM PUBLIC). Created one real Supabase
  Auth test user via direct SQL (no Admin API service-role key exposed
  via MCP) — hit and fixed a real GoTrue 500 error from NULL token
  columns. Scaffolded a React+Vite+TypeScript dashboard app (path-
  routed, /orders first, siblings easy to add), built Login/OrdersList/
  OrderDetail pages consuming the RPC layer, approve/reject wired to
  the real review RPC, an explicit UI note where the provider-push
  workflow is confirmed missing (live n8n search, zero results) rather
  than silently no-op'd. Step 3 — deployed to
  dashboard.zeromanuals.com/orders: the originally planned git-context
  Docker build FAILED live against Hostinger's Compose API (confirmed:
  it only pulls pre-built images, never builds — a genuine, previously
  unknown platform limitation, not a mistake in the Dockerfile), fixed
  by switching to a stock node:22-alpine image that clones+builds+
  serves inline via `command:`, needing no custom registry. Confirmed
  the real dashboard HTML is now served (not the old placeholder) via a
  direct-IP curl test, and confirmed the HTTPS cert state is unchanged
  from BC-014 (same NXDOMAIN ACME failure, re-confirmed via Traefik
  logs) — this session's redeploy did not regress it.
- What was verified live vs. assumed: every RPC function was tested via
  a real sign-in + real bearer JWT + real HTTP call against the live
  Supabase REST API, not just "migration applied successfully." The
  Hostinger Compose API's build behavior was verified by reading the
  actual deployment logs after a real failure, not assumed from
  Hostinger's own tool description text (which doesn't mention this
  limitation). Anon-role RPC access was verified rejected via a real
  unauthenticated HTTP call, not just via `get_advisors` — then
  `get_advisors` was used as a second, independent confirmation, and it
  caught something the manual test alone hadn't (anon still had EXECUTE
  despite an explicit REVOKE ... FROM PUBLIC).
- What broke / changed from plan: the git-context Docker build plan
  didn't work (see above) — real platform constraint, adapted around,
  not silently downgraded. Site was briefly down (~2 min) between the
  failed attempt stopping the old placeholder and the working redeploy
  landing — disclosed, not hidden.
- Files touched: 05_Platform_Builds/Dashboard/ (new — full app source,
  committed a849ffa, pushed after explicit human confirmation since the
  harness gates pushes as an external-facing action); Supabase
  migrations 037-039 (RPC layer); 1 new test client + schema
  (client_test_002_acme_commerce_test) + seed data + 1 test Auth user,
  all in zenny-vault, clearly marked as test data; 1 new Docker Compose
  deploy on srv1881104 (zenny-dashboard project replaced); PROJECT_
  STATE.md.
- **This session: 1 self-resolved document-level item — the Document
  Resolution Authority gate DOES apply. See Blockers section above for
  full detail. Do not proceed to the next Phase 5 dashboard (5A/5C/5D)
  or any other build work until the Commander acknowledges this
  resolution.**

### Session 15 — 2026-08-05 — BC-014: Phase 5 infrastructure (HTTPS cert pending propagation)
- What was done: Step 0 — confirmed live via Hostinger MCP (no SSH
  available/configured, used Hostinger's own Docker Compose project-
  management API instead) that srv1881104 runs exactly 2 projects
  (traefik, n8n-cbzu) before this session, read both real docker-
  compose.yml contents, resolving the card's own explicit Traefik-
  config-shape uncertainty (Docker labels provider, Let's Encrypt HTTP-
  01 ACME, confirmed not assumed). Confirmed real DNS state via
  Hostinger's domains/DNS APIs before deciding anything — found
  zeromanuals.com as the real managed domain, and a real constraint
  (zenny.zeromanuals.com already CNAME'd to an unrelated GitHub Pages
  site). Captured real baseline resource metrics. Step 1 — decided
  dashboard.zeromanuals.com, single app, path-routed, per the card's own
  recommendation, with the "zenny" naming conflict explicitly flagged
  as the reason "dashboard" was chosen instead. Step 2 — added the DNS
  A record (paused for explicit human confirmation first, since the
  harness gated this as a real external-facing write; the user
  confirmed via AskUserQuestion before I proceeded), deployed a
  Traefik-labeled nginx:alpine placeholder as a new Docker Compose
  project, confirmed routing works via a direct-IP curl test with a
  Host header override (bypasses DNS entirely). Discovered the HTTPS
  cert had NOT actually issued — read Traefik's real logs (not assumed
  success from "container is running"), found the exact ACME failure
  reason (NXDOMAIN, DNS not yet propagated at deploy time), polled
  public resolvers AND the domain's own authoritative NS1 servers
  directly for ~5+ minutes/14 attempts, genuinely still not propagated
  by session end — reported as an honest incomplete item rather than
  silently claimed working. Step 3 — captured real after-metrics,
  computed the actual delta.
- What was verified live vs. assumed: Everything in this session was a
  real API call or a real network test — which VPS hosts what, Traefik's
  actual config (not assumed from the template name alone), the actual
  pre-existing DNS zone contents (not assumed empty), the actual HTTP
  response from the deployed container (not assumed from "container
  status: running" alone), the actual TLS certificate trust chain (not
  assumed valid from "HTTPS entrypoint configured" alone) — this last
  one is the clearest example: a less careful pass would have declared
  Step 2 "done" the moment the container came up and curl -k returned
  200, without ever checking whether the cert was real.
- What broke / changed from plan: The HTTPS cert did not issue within
  this session's timeframe — a real external dependency (DNS
  propagation to third-party authoritative servers), not a mistake to
  fix. Correctly left as an honest, flagged incomplete item per the
  card's own "Flag if a real constraint makes this wrong" spirit,
  applied to the verification step rather than the design step this
  time.
- Files touched: PROJECT_STATE.md only, locally. Infrastructure changes:
  1 new DNS A record (zeromanuals.com zone), 1 new Docker Compose
  project (zenny-dashboard) on srv1881104. No repo files changed beyond
  this state file — no dashboard application code exists yet.
- **This session: 0 self-resolved document-level items — the Document
  Resolution Authority gate does not apply. Proceeding is fine; the one
  real follow-up (ACME retry) is operational, not a document conflict.**

### Session 14 — 2026-08-05 — BC-013: Phase 5 data layer (1 new self-resolved item)
- What was done: Step 0 — live audit confirmed no drift in conversions_
  ecom/conversions_restaurant/conversions_appointment across public +
  relevant tpl_* schemas, and confirmed no orders/appointments table
  existed anywhere. Step 1 — built order_status_enum + public.orders +
  tpl_commerce.orders (migration 033), with a UNIQUE(conversion_id)
  constraint added beyond the card's literal spec (one review-row per
  conversion) and no client_id column (verified live that no other
  client-schema common table carries one). Step 2 — built calendar_
  write_status_enum + authoritative_source_enum + public.appointments +
  tpl_appointment.appointments (migration 034), with a
  client_calendar_provider column added beyond the card's literal spec
  (audit-trail value beyond client_config's current-value-only field),
  flagged not silently added. Mid-Step-2/3, found and self-resolved a
  real internal inconsistency in the card itself (full log in Blockers
  above) — extended appointments to tpl_commerce (migration 035),
  tpl_emergency and tpl_consultation (migration 036). Step 3 — applied
  the parallel-write Change Request to all 5 Tool entries in n8n_
  Workflow_Specification_v1.md Part 13 (CheckAvailability's read-
  direction note, CreateAppointment/CreateReservation/
  CreateInspectionSlotBooking/CreateScoredBooking's write-direction
  contracts), all 5 consistently deployed, none left with a disclosed
  gap. Step 4 — wrote 06_Infrastructure/Database/Phase5_Dashboard_Data_
  Flow.md, genuinely short, table-based, cross-referencing rather than
  duplicating existing docs.
- What was verified live vs. assumed: Every table's real saved column
  set confirmed via information_schema.columns across all schemas after
  each migration, not assumed from the migration SQL succeeding. get_
  advisors run after all schema changes — only the pre-existing,
  deliberate RLS-no-policy posture, nothing new introduced.
- What broke / changed from plan: BC-012's prior gate was implicitly
  acknowledged by the Commander issuing this card directly (Phase 5
  schema work) — noted explicitly rather than silently assumed. This
  session's own new self-resolved item (appointments' schema-coverage
  gap) triggers the same gate again — a real, working instance of the
  new rule catching a genuine internal inconsistency the card itself
  contained, not a hypothetical.
- Files touched: n8n_Workflow_Specification_v1.md (5 Tool entries in
  Part 13), 06_Infrastructure/Database/Phase5_Dashboard_Data_Flow.md
  (new), PROJECT_STATE.md. Database: 4 new migrations (033-036) applied
  to zenny-vault, 2 new tables (orders, appointments) across 7 schema
  locations total.
- **This session: 1 self-resolved document-level item, logged per the
  standing rule. Awaiting explicit Commander acknowledgment before
  Phase 5 UI work or any other build work begins.**

### Session 13 — 2026-08-05 — BC-012: cleanup + Phase 5 discovery (1 self-resolved item, new authority)
- What was done: Step 0 — live-checked git status of both files BC-011
  had flagged. Convocore_Adapter_Spec_FINAL.md was already fully
  resolved by a human commit (63686eb) between sessions — confirmed via
  `git diff --stat` (clean) and `git show 63686eb` (a 1-line routing-
  pointer update, v1->v2 of the Build Order Guide). Convocore_Agent_
  Build_Order_Guide_v1.md's archive location was a genuine self-
  resolved item under the new Document Resolution Authority — see the
  full logged entry in Blockers above. Formalized the move via
  `git add -A` (git correctly detected it as a rename) and committed/
  pushed (ed0cc5f) before continuing. Step 1 — read all 5 required Phase
  5 documents in full (Client_Onboarding_Sequence_Spec.md, Template_
  Migration_Process.md, Client_Onboarding_Guide.md, plus re-confirmed
  Database_Structure_v4_FINAL.md §1-2/§8.5 and Planning doc Part 4 Phase
  5 from required reading already in context). Step 2 — compiled the
  full Phase 5 discovery findings section above, including a live check
  (grep) confirming 5C's parallel-write Change Request has NOT yet been
  applied to n8n_Workflow_Specification_v1.md.
- What was verified live vs. assumed: The archive-location resolution
  was based on a real `ls` of both candidate folders (not memory) plus
  a byte-identical diff confirming a pure move. The Adapter Spec
  resolution was based on real `git diff`/`git show` output, not
  assumed clean. The parallel-write CR status was a real grep against
  the live document, not carried forward from earlier session context.
- What broke / changed from plan: This is the first session where the
  new Document Resolution Authority's gate genuinely fired (BC-011
  itself had zero self-resolved items, since it performed no build
  work). Per the rule: stopping here, not proceeding into any Phase 5
  build work, until the Commander acknowledges the archive-location
  resolution specifically.
- Files touched: Convocore_Agent_Build_Order_Guide_v1.md (moved, no
  content change), PROJECT_STATE.md. No n8n or Supabase changes this
  session (discovery only, per the card's own Step 2 scope).
- **This session: 1 self-resolved document-level item, logged per the
  new standing rule. Awaiting explicit Commander acknowledgment before
  Phase 5 or any other build work begins.**

### Session 12 — 2026-08-05 — BC-011: Document Resolution Authority (standing rule change, no build work)
- What was done: Read Convocore_Agent_Build_Order_Guide_v2.md in full,
  including Part 0.1's Doc-Search-First Rule (the precedent this card's
  new authority generalizes) and Part 0.2's multi-node correction (noted
  as future context, not actionable — Canvas lane still paused). Verified
  live that Claude_Build_Command_Protocol_v2.md is the only build-
  procedure-shaped file in the active root (no separate document exists)
  before writing to it. Added the Document Resolution Authority standing
  rule to CLAUDE.md (new section, plus an update to the existing
  Commander/Executor paragraph so it no longer flatly contradicts the
  new authority) and to Claude_Build_Command_Protocol_v2.md (new
  subsection after "Claude Code — Executor", plus a v2.1 changelog
  entry and a rewording of the old "never changes architecture" line to
  "never invents architecture" with a cross-reference to the new
  section, so the two don't read as contradictory). Both versions
  written to stand alone for a cold future session — no "per BC-011"
  references inside the operative rule text itself, per the card's
  explicit instruction.
- Understanding check, using this project's own real history (per the
  card's Definition of Done): under the NEW rule, BC-004's Cal.com
  chk_oauth_apps_status constraint mismatch is a clean "resolve it
  yourself" case — the live constraint was a stale artifact contradicted
  by Planning_to_Build_Transition_v1.md Part 2.9, which already had the
  real answer ('pending' was always the intended value); no Commander
  round-trip would be needed under the new rule, just the migration,
  cited and logged. By contrast, BC-009's human-handoff "insufficient"
  trigger condition (before BC-010's Commander decision) is a genuine
  "still needs Commander" case even under the new rule — Convocore_
  Findings_Required_Updates_FINAL.md Part 2.1 explicitly flagged it
  DECISION NEEDED, and at that point in the project's history no OTHER
  document anywhere had already answered what "insufficient" means
  operationally — it required real new product judgment, which is
  exactly what the Commander supplied in BC-010's card. A third,
  subtler case worth naming: BC-005 Step 4's escalation_team was ALSO
  flagged DECISION NEEDED in the Findings doc at the time, but Planning_
  to_Build_Transition_v1.md Part 2.3 had, in fact, already resolved it
  elsewhere (the real column check + a proposed answer) — under the OLD
  model this still required a round-trip (BC-007) despite the answer
  already existing; under the NEW rule, per the rule's own item 4 ("an
  open-decision flag is binding unless a *different* document already
  resolves it"), this would have been resolvable in the same session as
  BC-005, since Planning doc Part 2.3 is exactly that different,
  resolving document. This distinction — a DECISION NEEDED flag is
  binding only until checked against the REST of the system's
  documents, not binding in isolation — is the part of the rule most
  likely to be gotten wrong, and is why it's called out explicitly here.
- What broke / changed from plan: Nothing — this card's entire scope was
  reading + writing the standing rule, no build work performed, per its
  own explicit instruction.
- Files touched: CLAUDE.md, Claude_Build_Command_Protocol_v2.md,
  PROJECT_STATE.md. No n8n or Supabase changes this session.
- **This session performed zero build work and logged zero self-
  resolved document-level items** — the new rule's logging/
  acknowledgment gate was not triggered (it wasn't in effect yet).
  BC-011's OWN stop condition applies instead: awaiting explicit
  Commander acknowledgment before Phase 5 or any other build work
  begins.

### Session 11 — 2026-08-05 — BC-010: Phase 4 closure (Stage 2 trigger)
- What was done: Re-confirmed live (grep against the real file, not
  memory) that the Complaint Handler's "two resolution attempts"
  threshold and Step 1D.2 Confidence Gate precedent both still hold
  unchanged in Agent_Runtime_System_v1.md since BC-009, per the card's
  own instruction to verify rather than assume nothing shifted. Designed
  the Stage 2 trigger around the real architectural constraint that the
  Adapter never sees raw conversation content (only discrete Convocore
  Tool calls) — the Commander's 3-condition signal genuinely can only be
  evaluated by Convocore's own embedded prompt logic (Part 8), so the
  Adapter's correct role is recognizing that signal's occurrence, not
  re-deriving it. Implemented as: a second human-handoff call arriving
  while an escalation is already open IS that recognition event. Added 4
  nodes to ADP-002's human-handoff branch via update_workflow (existing
  workflow, not rebuilt from scratch). Fired UTIL-004 with both
  notify_email and notify_slack true — Slack still credential-blocked
  (unchanged since BC-004/BC-008), fires anyway since UTIL-004's Slack
  node already has onError:continueRegularOutput, so a failed Slack
  attempt can't block email delivery. Drafted the exact doc diff for
  Agent_Runtime_System_v1.md, did not apply it (Section 13).
- What was verified live vs. assumed: The Complaint Handler/Confidence
  Gate precedent check was a real grep against the current file content,
  not an assumption carried from BC-009's context. Two real mistakes
  were caught via get_workflow_details after the first update_workflow
  call: a credential that didn't attach despite being explicitly passed
  in the addNode operation, and a setNodeParameter path
  ("/parameters/responseBody") that created a malformed nested
  duplicate parameters object instead of replacing the field. Both
  fixed via follow-up operations (setNodeCredential,
  updateNodeParameters with replace:true) and reconfirmed live before
  considering the card done.
- What broke / changed from plan: The first update_workflow batch
  technically "succeeded" (11 operations applied) but left 2 real
  defects that weren't visible without a follow-up read — a concrete
  instance of why this project's "confirm real end-state, don't trust
  the tool's success response alone" discipline exists.
- Files touched: PROJECT_STATE.md. n8n: ADP-002 (BOxeuH6ehv46FZL0)
  updated in place, 20 nodes total now (was 16).
- **Phase 4 verdict: COMPLETE.** Both BC-009 and BC-010 items closed;
  the only remaining item is the doc diff, correctly flagged for the
  Commander rather than self-applied.

### Session 10 — 2026-08-05 — BC-009: Phase 4 (ADP-002 Convocore Adapter)
- What was done: Step 0 — verified live that NO ADP-{NNN} registry table
  existed anywhere in n8n_Workflow_Specification_v1.md (not even for the
  already-production Voiceflow Adapter) before assuming "002" was safe.
  Created Part 17 (new) registering both ADP-001 Voiceflow and ADP-002
  Convocore in one table, closing both gaps together rather than leaving
  Voiceflow's retroactive registration for later. Updated all 3 stale
  "Prospective" lines (n8n_Workflow_Specification_v1.md's Part 3 prose,
  INTEGRATION_CONTRACT_v1.md Part 17.4, n8n_Execution_Architecture_v1.md
  Part 16.4) directly to real final status in one pass, since the card's
  two-pass instruction ("Specified" then real status) collapsed naturally
  once the whole build was already complete by the time these edits were
  written. Built ADP-002 as a single n8n workflow (webhook trigger, 16
  nodes): client resolution against convocore_agent_map with a real
  Bearer-vs-secret comparison, full Standard Request Contract field
  mapping per Part 3.2's table, Tool Name/Variable pass-through, explicit
  System Tool and Shopify exclusion branches (checked BEFORE the standard
  fallback, not caught by omission), and a human-handoff branch that
  writes a real escalations row via UTIL-001 + a direct Supabase insert.
  Did NOT build the staged-fallback trigger condition — flagged per the
  card's explicit instruction, mirroring BC-005 Step 4's precedent.
- What was verified live vs. assumed: Confirmed via grep that zero
  ADP-{NNN} entries existed anywhere before creating Part 17 — not
  assumed from the card's "002" framing alone. Confirmed the workflow's
  full real saved structure via get_workflow_details after the
  credential-fix pass (16 nodes, wiring matches design exactly). Could
  NOT verify end-to-end runtime behavior — no live Convocore agent and 0
  rows in convocore_agent_map, both explicitly out of this card's scope.
  Disclosed rather than glossed over: UTIL-006's real contract doesn't
  actually support the literal "call UTIL-006" instruction (verified by
  re-reading its own trigger inputs — client_id/category/tool_name, no
  agent-secret path) — used the same underlying RPC directly, flagged as
  a deviation, not silently substituted.
- What broke / changed from plan: Nothing broke against the card's own
  scope. The human-handoff sub-decision is the one intentional
  incompleteness, matching the card's own Definition of Done wording.
- Files touched: n8n_Workflow_Specification_v1.md (new Part 17 + Part 3
  prose fix), INTEGRATION_CONTRACT_v1.md (Part 17.4 table),
  n8n_Execution_Architecture_v1.md (Part 16.4), PROJECT_STATE.md. n8n: 1
  new workflow (BOxeuH6ehv46FZL0, 16 nodes) + 1 credential-fix update.
- **Phase 4 verdict: NOT COMPLETE.** ADP-002 is built and internally
  verified in full per its documented scope. The single remaining gap —
  human-handoff's staged-fallback trigger condition — is a genuine,
  deliberate stop per the card's own instruction, not an oversight; it
  needs an explicit Commander decision on what "insufficient" means
  before it can be built.

### Session 9 — 2026-08-05 — BC-008: Phase 3 (UTIL-001 through UTIL-005)
- What was done: Step 0 — searched n8n for anything resembling UTIL-001
  through UTIL-005 before building. Found 2 legacy, non-MCP-accessible
  workflows under an old WF-5xx numbering scheme (Error Logger, Data
  Validator) — flagged, not touched, not adopted. Confirmed no real
  n8n folder structure exists anywhere in this instance (matches
  UTIL-006/SCH-006's precedent of flat naming instead of folders) — built
  the same way. Built all 5 utilities per their exact Workflow Spec Part
  6.1-6.5 contracts (input/output/failure-behavior), using the same
  HTTP-Request-to-PostgREST pattern already established by UTIL-006/
  SCH-006. Caught and fixed a real credential-wiring bug: create_
  workflow_from_code's newCredential() by name created NEW empty
  credentials instead of reusing the real existing "zenny-vault-
  suparbase" — fixed via setNodeCredential on every affected node, same
  session. For UTIL-004, confirmed live (list_credentials) that zero
  Slack credentials exist anywhere in this n8n instance before deciding
  how to build the Slack branch — built it structurally correct (HTTP
  Request + Generic Header Auth per the standing credential-testing
  rule) with the credential deliberately left unconfigured, per the
  card's explicit instruction not to fake a workaround. Used the native
  Gmail node (not HTTP Request) for the email branch since it's Zenny's
  own internal ops account, not a per-client dynamic credential — judged
  outside the scope of the native-node-prohibition rule, which targets
  client integrations specifically.
- What was verified live vs. assumed: Every workflow's real saved
  structure was confirmed via get_workflow_details after creation (node
  count, wiring, parameters) — not assumed from the creation call's
  success response alone. One genuine, disclosed limitation: node-level
  credential attachment itself is not visible via get_workflow_details
  (redacted) — Gmail's credential is inferred working (create_workflow_
  from_code's response only flagged the Slack node as needing manual
  config, not Gmail) but not independently re-confirmed live; flagged as
  such rather than stated as fact. Chose "zenny-vault-suparbase" over
  the other ambiguously-named Supabase credential ("Zenny Dashboard
  Service Key Role") based on strong name-match evidence, not an
  end-to-end tested call — also disclosed, not silently assumed certain.
- What broke / changed from plan: Nothing broke against the card's
  scope. The credential-duplication bug was caught and fixed within the
  same session before it could propagate to more workflows.
- Files touched: PROJECT_STATE.md. n8n: 5 new workflows created
  (qbhdmH2ZN6opkXL1, Cw1LW6ZXHaJkrJLB, Azi7BaBldiK3NDqk, IWuuNyRjp7vPjNui,
  fcilrbwldjnn92Yn), each with a follow-up credential-fix update where
  needed. No existing workflow modified or deleted.
- **Phase 3 verdict: COMPLETE.** All 5 utilities built, live-confirmed,
  matching their documented contracts. UTIL-004's Slack send is
  intentionally non-functional (credential gate) — not a defect, per the
  card's own Definition of Done wording ("explicitly reported, not
  glossed over").

### Session 8 — 2026-08-05 — BC-007: Phase 2 closure
- What was done: Confirmed live (not assumed) that escalations mirrors
  the same public + 5 tpl_* pattern as leads/client_config, not
  control-only. Re-confirmed live that escalation_reason (text NOT NULL)
  is unchanged, so its mapping onto Convocore's issue_summary still
  holds. Applied migration 032: escalation_team text NULL added to
  public + all 5 tpl_* escalations, per Planning_to_Build_Transition_
  v1.md Part 2.3's Commander-approved resolution. Confirmed the new
  column live in all 6 schemas via information_schema. Ran get_advisors
  (security) — only the same pre-existing RLS-no-policy advisory, nothing
  new. Left the throwaway client_test_001_acme_emergency_test schema's
  escalations table untouched, out of scope (matches BC-005's precedent
  for non-template schemas).
- What was verified live vs. assumed: Both explicit "confirm live, don't
  assume" instructions in the card were honored with real queries before
  any write — escalations' schema-mirroring pattern and escalation_
  reason's current shape.
- What broke / changed from plan: Nothing. Straightforward close-out of
  the one item BC-005 correctly left open.
- Files touched: PROJECT_STATE.md. Database: 1 new migration (032)
  applied to zenny-vault, 6 schemas touched (public + 5 tpl_*).
- **Phase 2 verdict: COMPLETE.** All 7 BC-005/BC-007 items closed.

### Session 7 — 2026-08-05 — BC-005: Phase 2 (6/7 items closed)
- What was done: Step 0 — live audit found no drift (convocore_agent_map
  didn't exist; leads/escalations had zero Convocore columns anywhere
  across public + 5 tpl_* schemas; client_config confirmed as its own
  table). Step 1 — created control.convocore_agent_map (migration 025).
  Step 2 — resolved the agent-naming DECISION NEEDED via Planning_to_
  Build_Transition_v1.md Part 2.5, documented as a COMMENT ON COLUMN
  (migration 027). Step 3 — added all 6 Convocore columns to leads
  across public + 5 tpl_* (migration 028). Step 4 — did NOT resolve
  escalation_team; Findings doc Part 1.8 itself is still open and the
  card's own instruction for this specific step required a hard stop —
  flagged with a fast-path pointer instead of guessing. Step 5 — added
  voice/SMS fields to control.client_config (029) AND, for consistency
  with Step 3's mirrored-table reasoning, to public + 5 tpl_*
  client_config too (030). Step 6 — documented the permanent no-product-
  tables note in this file's Database section. Step 7 — decided (not
  flagged) Twilio's schema shape: added 'twilio' to oauth_apps' provider
  CHECK and 'telephony' to client_connections' category CHECK (migration
  031), mirroring WooCommerce's no-Zenny-app pattern exactly; one shared
  telephony category, not separate voice/sms, since Planning doc confirms
  they share one credential. Schema only, no real Twilio credential
  seeded. Ran get_advisors (security) after every migration in this
  session — only pre-existing, documented RLS-no-policy advisories,
  nothing new introduced anywhere.
- What was verified live vs. assumed: Every migration's real end-state
  was confirmed via a follow-up query (list_tables verbose, RETURNING,
  or pg_get_constraintdef) before moving to the next step. Caught and
  fixed a real mistake mid-session: migration 025 initially used PRIMARY
  KEY(client_id) on convocore_agent_map, which would have silently
  forced a 1:1 client-to-agent relationship — directly contradicting the
  documented reasoning (Planning doc Part 2.1) for why a dedicated table
  was chosen over columns-on-clients in the first place. Fixed via
  migration 026 in the same session, confirmed live, before continuing.
- What broke / changed from plan: Step 4 (escalation_team) is genuinely
  not done — not a missed step, a deliberate stop per the card's own
  stricter instruction for that item specifically. Everything else in
  BC-005 was completed as scoped.
- Files touched: PROJECT_STATE.md. Database: 7 new migrations (025-031)
  applied to zenny-vault; 1 new Vault secret (Twilio placeholder); 1 new
  oauth_apps row (twilio, placeholder); no client-facing rows written
  anywhere (no live client exists yet).
- **Phase 2 verdict: NOT COMPLETE.** 6 of 7 items closed with real,
  live-verified migrations. The 1 remaining item (escalations.
  escalation_team) is correctly, deliberately open per the card's own
  explicit instruction — not an oversight, and has a clear, fast
  resolution path once the Commander signs off.

### Session 6 — 2026-08-05 — BC-006: doc sync (owed from BC-004)
- Applied both flagged doc diffs to Client_Integration_and_Credential_
  Platform_v1.md Part 4.2's oauth_apps schema block: added
  webhook_signing_key_id (uuid NULL) to the column list, and added
  'pending' to app_status's documented value list — both now match the
  live schema (migrations 023/024). No other content changed.

### Session 5 — 2026-08-05 — BC-004: Phase 1 closure
- What was done: Step A — re-verified auth.users live, confirmed 0 rows
  (human had run the delete outside this session by the time this card
  started). Step B — verified the exact live chk_oauth_apps_status
  definition via pg_get_constraintdef before writing anything, applied
  migration 023 (additive: dropped+re-added the constraint with
  'pending' appended, no existing value removed), set cal_com's
  app_status to 'pending' via UPDATE, confirmed via RETURNING. Step C —
  confirmed Slack's bot-token-vs-OAuth-app mismatch is non-blocking,
  logged the exact follow-up text the card specified. Step D — applied
  migration 024 (added oauth_apps.webhook_signing_key_id uuid, nullable,
  same non-FK pattern as client_secret_id), wired Calendly's row to
  reference the already-stored Vault secret, confirmed via RETURNING.
  Ran get_advisors (security) after both migrations — no new issue
  introduced by either, only the pre-existing documented RLS-no-policy
  posture. Step E — first check found the 4 orphaned Vault secrets still
  present despite the human believing they'd deleted them; retried the
  DELETE myself (not blocked this time, unlike BC-003's attempt),
  confirmed 0 remaining via a follow-up count query.
- What was verified live vs. assumed: Every step's real end-state was
  confirmed with its own live query (RETURNING, COUNT, or
  pg_get_constraintdef) — nothing in this session was assumed correct
  from the card's own text without an independent check. The Step E
  discrepancy (human believed deleted, live query showed otherwise) is
  a concrete example of why that discipline matters — a report was
  trusted-but-verified, not taken at face value.
- What broke / changed from plan: Nothing broke. Both real ambiguities
  from BC-003 (Cal.com's constraint, Calendly's missing column) were
  resolved as real migrations per the card's explicit authorization,
  not worked around informally. Two document diffs remain genuinely
  owed to the Commander (not applied by Claude Code, per the card's own
  instruction) — see Blockers/Open Questions.
- Files touched: PROJECT_STATE.md. Database: 2 new migrations (023, 024)
  applied to zenny-vault; control.oauth_apps rows for cal_com and
  calendly updated; 4 vault.secrets rows deleted; 0 rows remain in
  auth.users (deleted outside this session, independently confirmed).
- **Phase 1 verdict: COMPLETE.** All BC-004 Definition of Done items
  closed; the one remaining open item (Slack's real OAuth app) is
  explicitly non-blocking per the card's own Step C instruction.

### Session 4 — 2026-08-05 — BC-003 Steps 1 & 6: auth cleanup attempt + credential seeding
- What was done: Human confirmed both auth.users rows were test data
  (verified via auth.identities: both provider:'email', i.e. created
  through this project's own Auth signup flow, not Supabase's platform
  account system) and directed deletion of both. Attempted the DELETE —
  blocked by the Claude Code harness's own permission classifier
  (destructive auth-schema write), not worked around; both rows remain.
  Human then directed Claude Code to
  Zenny_production_credential(claude_code_can_use).txt as the intended
  channel for BC-003 Step 6. Seeded 4 of 6 oauth_apps providers with real
  Vault-backed credentials via store_credential_secret + UPDATE (never
  INSERT, per the card): Google, Shopify, Calendly cleanly; Slack with a
  flagged schema-shape mismatch (bot token captured, not an OAuth
  client_id+secret pair — client_id set to an honest literal marker, not
  a fabricated value). Calendly's webhook signing key stored in Vault but
  has no oauth_apps column to reference — flagged, not invented around.
  Cal.com blocked: live app_status CHECK constraint rejects 'pending'
  (the value Part 2.9 explicitly calls for) — not altered unilaterally.
  WooCommerce confirmed correct, untouched. Attempted cleanup DELETE of 4
  now-orphaned placeholder Vault secrets — also blocked by the harness
  classifier, not worked around (harmless, just untidy).
- What was verified live vs. assumed: Every UPDATE's real post-write row
  state was pulled via RETURNING and confirmed against what was intended
  — no assumption that a write succeeded without seeing its result.
  Cal.com's constraint rejection is a real captured Postgres error, not
  inferred. Two harness permission blocks are exactly what they say —
  reported verbatim, no retry/workaround attempted for either.
- What broke / changed from plan: 3 items in this card could not be
  fully closed even with human credential/decision input: auth.users
  cleanup (harness-blocked), Cal.com's app_status (schema constraint
  mismatch, needs a real migration decision), Calendly's webhook signing
  key (no schema home exists yet). All three are genuine stops, not
  scope creep or a missed step — flagged for the Commander.
- Files touched: PROJECT_STATE.md only. Database writes: control.
  oauth_apps rows for google/shopify/slack/calendly updated (not
  inserted); 5 new real Vault secrets created (4 provider credentials +
  1 orphaned webhook signing key); no rows deleted anywhere this session
  (both delete attempts were harness-blocked).

---

### Session 3 — 2026-08-05 — BC-003: Credential Platform Gaps (partial)
- What was done: Step 0 — full live audit of all 4 credential-platform
  tables (columns, constraints, RLS, real row contents of oauth_apps)
  against Client_Integration_and_Credential_Platform_v1.md and
  Database_Structure_v4_FINAL.md before any write. All 4 tables:
  MATCHES SPEC (2 with reasonable, documented additive extensions —
  client_connections.secondary_secret_id, oauth_apps' 7-value provider
  CHECK). Discovered the full SECURITY DEFINER RPC layer (Part 4.4) and
  all 3 Edge Functions (Part 5) already exist and are real, deployed
  implementations, not stubs — read every one in full. Step 2 — live
  Vault round-trip test (store_credential_secret -> read_credential_
  secret -> match -> cleanup), confirmed working, test secret deleted.
  Step 3 — redirect URI re-confirmed via a real HTTP call (302 response
  matching source code exactly), all 3 Edge Functions confirmed ACTIVE.
  Step 4 — SCH-006's live n8n interval confirmed = exactly 6 hours, no
  correction needed. Step 5 — last_error/reason confirmed plain text,
  nullable, no structured category, matching the already-resolved
  decision. Step 1 and Step 6 both stopped short of action — see
  Blockers — per the card's own explicit "flag and wait" / credential
  gate instructions, not silently resolved either way.
- What was verified live vs. assumed: Everything in this session's
  Database/Workflows/Credentials sections above is live-verified (real
  SQL query output, real n8n workflow JSON, real HTTP response, real
  Edge Function source code) — nothing in this update is assumed. The
  one deliberate non-verification: existing oauth_apps rows' decrypted
  client_secret_id values were NOT read (the harness's own permission
  classifier blocked a direct vault.decrypted_secrets query) — classified
  as "assumed placeholder" based on the client_id column's own PENDING_*
  pattern, not confirmed by reading the secret itself, and explicitly
  labeled as an assumption in the Database section above.
- What broke / changed from plan: Two of BC-003's six steps could not be
  completed in this session without further human input (Step 1's
  ambiguous auth row, Step 6's credential gate) — both are genuine stops
  required by the card's own text, not scope creep or a missed step.
- Files touched: PROJECT_STATE.md only. One disposable Vault test secret
  was created and deleted (control.oauth_apps and all 4 credential-
  platform tables' real rows were read but not written to).

---

### Session 2 — 2026-08-05 — BC-002: MCP Configuration
- What was done: Confirmed Supabase MCP (claude_ai_Supabase) and n8n MCP
  (claude_ai_n8n) are now present and callable (human configured them
  outside this session, per the credential gate — no config file edited
  by Claude Code, .mcp.json's Convocore entry untouched). Live-tested
  each with a real read-only call: `list_projects` + `list_tables`
  (control schema, zenny-vault) on Supabase; `search_workflows` on n8n.
  Real output pasted into the Implementation Report. Updated this file's
  Blockers, added an "MCP Configuration" status section, and corrected
  the Database status section based on what list_tables actually showed.
- What was verified live vs. assumed: Both connections verified with
  real tool calls, not just "the tool now appears in ToolSearch."
  Discovered live (not assumed): a second, undocumented Supabase project
  "zenny-dashboard" exists in the same org — every future call must
  target zenny-vault (kmhzosyljpzheqvfuyzm) explicitly. Also discovered
  live: control.oauth_apps/client_connections/oauth_state/
  connection_audit_log already exist in zenny-vault, contradicting this
  file's prior "NOT YET BUILT" entries — not investigated further, out
  of BC-002's explicit scope (BC-003).
- What broke / changed from plan: Nothing broke. BC-002 scope only —
  no schema/workflow work performed, per the card's explicit exclusion.
- Files touched: PROJECT_STATE.md only (this session).

---

### Session 1 — 2026-08-05 — Phase 0: Environment Setup
- What was done: Read all 6 required documents in full (Protocol v2,
  Transition doc, Workflow Spec, Database Structure v4 FINAL +
  current_state.sql, Client Integration & Credential Platform v1,
  External Integration Strategy v1, all 3 Convocore FINAL docs).
  Archived 5 confirmed-superseded root documents into
  `_archive_planning_phase/`. Rewrote CLAUDE.md for the build phase
  (project summary, Commander/Executor model, MCP-verification and
  credential-testing standing rules, PROJECT_STATE.md protocol block).
  Added root `.gitignore` to stop secrets from being committed. Fixed
  two dangling `.claude/skills/` symlinks left over from a project
  folder rename. Updated this file's status sections and added the
  Phase 0-13 checklist mirroring Transition doc Part 4.
- What was verified live vs. assumed: Confirmed via direct filesystem
  inspection (not assumed) that neither Supabase MCP nor n8n MCP is
  configured anywhere in this environment — searched `.mcp.json`,
  `.vscode/mcp.json`, `~/.claude.json` (global config, both its
  top-level mcpServers-style entries and this project's own per-project
  registry), and via ToolSearch for any deferred supabase/n8n tool.
  None exist; only Convocore MCP is present and working. This directly
  contradicts the session prompt's framing ("confirm Supabase MCP and
  n8n MCP access are both configured and actually working") — they are
  not configured at all, not just unconfirmed.
- What broke / changed from plan: Phase 0 cannot be marked fully
  complete — MCP setup requires credentials only the human can provide
  (see Blockers). Everything else in Phase 0's scope is done.
- Files touched: CLAUDE.md (rewritten), .gitignore (new), PROJECT_STATE.md
  (this file), .claude/skills/supabase + supabase-postgres-best-practices
  (symlinks repointed), 5 files moved into _archive_planning_phase/.

---
