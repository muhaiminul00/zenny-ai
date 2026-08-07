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


**Archive note (BC-030):** Full session history through Session 22
(Sessions 1–22, Phase 0 setup through BC-021) has been moved verbatim
to `00_Project_Control/Session_Log_Archive.md` to keep this file
usable. This file's own Session Log below now retains Sessions 23–30
onward; the STATUS sections remain the primary, sufficient source for
"what's true right now."

---

## Last Updated
2026-08-07 — by Claude Code, Session 33 (BC-033 — closing BC-032's Step 3: new `auth.zeromanuals.com` Traefik proxy live with a real trusted Let's Encrypt cert, correctly proxying oauth-initiate/oauth-callback to Supabase with a verified-correct Host-header rewrite (`passHostHeader=false` + a DNS-named backend URL — NOT `customRequestHeaders.Host`, which Traefik's own maintainers confirm does not work for this), a real independent `/health` endpoint served locally (not proxied), and Google's stored `redirect_uri` updated to the new domain — confirmed live in a real Google authorize URL. **BLOCKED mid-card, waiting on human action**: Step 3 (adding the new redirect URI in Google Cloud Console) cannot be done by any available tool; Step 4's real end-to-end OAuth round-trip test is paused until the human confirms that Console change is done, per the card's own explicit wait instruction — Google OAuth connects will genuinely fail with `redirect_uri_mismatch` until then, an expected, disclosed transitional state, not a regression.)

## Current Phase
**BC-033 (closing BC-032's Step 3) — IN PROGRESS: Steps 1/1.5/2 complete and verified live; Step 3 is a pending human action; Step 4 blocked on it; Step 5 (this doc) partially done, will be finished once Step 4 completes.**

**BC-032 (Infrastructure catch-up) — PARTIAL: Steps 0/1/2/4/5 complete, Step 3 (this card) now in progress.**

**Self-resolved document-level item (BC-032):** Client_Integration_and_Credential_Platform_v1.md Part 8.2 already documented Shopify's Custom App static-token model as discontinued in favor of the shared-app Authorization Code Grant, and explicitly said not to use Client Credentials Grant for that shared-app case. This Build Card's Step 2 nonetheless asked for a Custom App static-token form (the exact mechanism Part 8.2 already said was gone) — live verification (WebSearch) confirmed Shopify removed the ability to generate new static Custom App tokens entirely as of Jan 1, 2026. Per Mandatory MCP Verification, did not build the requested dead functionality; stopped and asked the human via AskUserQuestion instead of silently building or silently skipping the step. The human's own answer directed a pivot to Shopify's **Client Credentials Grant** (a genuinely different, still-live mechanism: per-client Client ID + Client Secret, Zenny auto-requests a short-lived token on each call) — verified live (WebSearch/WebFetch) that this mechanism is real and current (`POST https://{shop}.myshopify.com/admin/oauth/access_token`, form-urlencoded `client_id`/`client_secret`/`grant_type=client_credentials`, returns `{access_token, scope, expires_in: 86399}`). This is architecturally distinct from the shared-app case Part 8.2 rejected Client Credentials Grant for (this is a genuine per-client alternative fallback, matching Part 8.5.1's general API-key-fallback principle), so it does not contradict Part 8.2 — it fills a different, real gap. Built accordingly. **Per the standing gate, this session stops here for Commander acknowledgment of this resolution before Phase 8b or any other new Build Card begins** — routine documentation/commit work below this point is not new build scope.

---
## Prior Phase — Conversion Engine (Phase 8a) — BC-031 COMPLETE
WF-002 CheckAvailability, WF-003 CreateAppointment, WF-004
CreateBookingRequest, WF-005 CreateCart, WF-006 CreateReservation, and
WF-007 CreateWaitlistEntry are all built, published, and genuinely
tested across all 5 required categories (Success, Failure, Security,
Retry, Duplicate) against real production data — see each Tool's entry
in `06_Infrastructure/n8n/Workflow_Registry.md` for full detail. The
real WF-006→WF-007 waitlist-redirect handoff chain was proven end-to-end,
not just each Tool in isolation, per the card's explicit requirement.
CreateAppointment's real parallel-write pattern (client calendar +
`appointments` table in the same operation) is built and code-complete
per Part 13.3, but its `client_calendar` success path could not be
live-tested — no roster client has a real connected Google Calendar (a
genuine, stated external blocker: the roster's only connected calendar
is Calendly, with real `status='error'`, and the only ecommerce
connection is a non-functional WooCommerce test store). Both `our_db_
fallback` resilient-write paths (CreateAppointment, CreateReservation)
ARE fully real and were the outcome of every un-bypassed test, exactly
matching Part 13.3's "nothing silently lost" design intent. 5 remaining
Conversion Engine Tools (CreateCallbackQueueEntry,
CreateInspectionSlotBooking, CreateScoredBooking, CreateRegistration,
RecordConversion) are Phase 8b, next card — **blocked from starting
until the Commander acknowledges this session's self-resolved
document-level item** (see below), per the standing Document Resolution
Authority gate.

**Self-resolved document-level item (BC-031, requires Commander
acknowledgment before Phase 8b begins):** `n8n_Workflow_Specification_
v1.md` Part 13.5 (CreateCart), 13.6 (CreateReservation), and 13.7
(CreateWaitlistEntry) each specify an idempotency key referencing
`{lead_id}`, but none of their three documented payload examples
actually included a `lead_id` field — a real gap discovered while
designing each Tool's real duplicate-detection logic (there was
genuinely no field to key off of). Searched broadly before resolving:
INTEGRATION_CONTRACT_v1.md's own worked example for SendRecoveryMessage
and n8n_Workflow_Specification_v1.md's own CreateAppointment (Part
13.3) both already carry `lead_id` explicitly in their payload wherever
their idempotency key requires it — no document offers any other
source for the value, and every sibling Tool's contract already
established the pattern. Resolved by adding `lead_id` to all 3
payloads directly in `n8n_Workflow_Specification_v1.md`, with an
inline note at each of the 3 locations citing this resolution — a
mechanical/structural correction (the field name and semantics were
already fully specified elsewhere), not a novel product decision.

Phase 7 (Growth Agent) — BC-029 COMPLETE. WF-001 CreateLead is the
single Tool this phase required (Part 7.2's hard rule: Growth Agent
never calls a conversion action directly). Built, published, and
genuinely tested against real production data across all 5 required
categories (Success, Failure, Security, Retry, Duplicate) — see WF-001's
entry in `06_Infrastructure/n8n/Workflow_Registry.md` for full detail.
Real duplicate-prevention is backed by an actual per-schema partial
`UNIQUE` index on `(customer_id, convocore_conversation_id)`, not just
the idempotency-key string format. While testing, found and fixed 3
real pre-existing infrastructure bugs unrelated to this card's own
build but blocking its Retry/Pattern-D test: 2 schema-provisioning
drift gaps on `client_test_001_acme_emergency_test` (missing `leads`
convocore_* columns from migration 028; missing `escalations.
escalation_team` from migration 032) and, most significantly, a
PostgREST overload-ambiguity bug (`PGRST203`) in
`public.insert_client_escalation` that BC-028's own 10-arg overload
addition had introduced — this had silently broken WF-017 NotifyHuman
(and therefore WF-013/WF-016's always-handoff behavior) for every real
9-arg caller since BC-028, entirely undetected because BC-028's own
ADP-002 test always passed the 10th argument explicitly. Fixed by
dropping the redundant 9-arg overload. 0 self-resolved document-level
items this session (all ordinary bug-catching) — no standing-rule stop
required; Phase 8 (Conversion Engine) may proceed in the next session.

Phase 6 remains otherwise complete — **BC-028 was a bug-fix card closing
out every real gap BC-027's documentation audit surfaced, not a new
build phase.** Full detail in "Phase 6 — Real Infrastructure Bug Fixes
(BC-028)" below. Headline results: ADP-002's human-handoff path — the
actual Convocore escalation path — went from completely non-functional
to fully verified end-to-end (Stage 1 + Stage 2); UTIL-003, UTIL-005,
and Tool Execution Fallback all went from never-successfully-executed
to fixed-and-verified; UTIL-006 gained a real synchronous token-expiry
check on top of being fixed and verified for the first time; one real
security gap (a SECURITY DEFINER view bypassing RLS on a table holding
every client's connection data) was found and fixed. A new shared
workflow, UTIL-007 (Refresh Connection Token), was built to support
UTIL-006's new expiry check. 0 self-resolved document-level items this
session — every finding was ordinary bug-catching (missing credentials,
missing grants, array-shape assumptions, response-format quirks), not a
document-level conflict, so the Document Resolution Authority gate does
not apply and no stop is required.

Phase 6 remains the current phase — **BC-027 was a documentation card,
not a new build phase.** It formally closed out BC-026's standing-rule
stop (Commander acknowledgment, Step 0), pushed BC-026's pending
commit, and created the permanent per-workflow reference
(`06_Infrastructure/n8n/Workflow_Registry.md`, one live-verified entry
per real built workflow — 19 total, now 20 after BC-028's new UTIL-007)
plus the standing requirement to keep it updated going forward
(CLAUDE.md + Claude_Build_Command_Protocol_v2.md, now part of
Definition of Done). No new workflows were built or modified in BC-027
itself, aside from a SCH-006 config check (no change — the human had
already retuned its interval to 2 hours directly in n8n; this session
only confirmed it live). See "Phase 6 — Core Agent Build (BC-026)"
below for the actual build detail this documentation covers.

Phase 6 (Core Agent) — **BC-026 COMPLETE.** Built the 10 workflows every
other future module depends on: INT-001 Create Customer, INT-002 Load
Client Configuration, INT-003 Load Archetype Configuration, INT-004
Initialize Conversation, INT-005 Archive Conversation, WF-013
CancelAppointment, WF-014 GetOrderStatus, WF-015 GetBookingStatus,
WF-016 UpdateCustomer, WF-017 NotifyHuman. Step 0 live audit confirmed
none of the 10 existed under any name before this session (the old
WF-001/002/003 workflows found in n8n are unrelated legacy pre-rebuild
workflows). Step 0.5 test-client roster established (see "Phase 6 —
Test-Client Roster" below). WF-013 (CancelAppointment) and WF-016
(UpdateCustomer) always route to WF-017/Human Handoff Handler rather
than executing, per the Customer Verification Rule — no verification
mechanism is configured anywhere in the real system, confirmed
empirically, so per spec neither Tool may improvise one. WF-014/WF-015
apply light verification (a known reference) and execute directly.
**A major, previously-undiscovered infrastructure bug was found and
fixed mid-build:** client schemas are not exposed to PostgREST at all
(`PGRST106`), invalidating the `Content-Profile`/`Accept-Profile`
direct-schema-access pattern this whole project has used since early
sessions — 6 new `public`-schema SECURITY DEFINER RPC wrappers
(migrations 052-053) route around it for all 7 affected new workflows.
This retroactively implicates 3 PRE-EXISTING workflows using the same
pattern against client schemas — UTIL-003 Error Logger, UTIL-005 Stop
Checker, and ADP-002 Convocore Adapter — as never having been
execution-tested against a real client schema; **not fixed this
session (out of BC-026's scope), flagged here for a future card.** A
SECOND, separate infrastructure bug was found live while testing
INT-002: the `control` schema itself had no `USAGE` grant for
anon/authenticated/service_role at all (`permission denied for schema
control`) — a schema-level ACL gap distinct from the PostgREST-exposure
issue, retroactively calling into question every prior session's
assumption that UTIL-001 Schema Resolver's direct `control.clients`
read has ever actually succeeded. Fixed via a `GRANT USAGE ON SCHEMA
control` migration (human-applied per the Credential Gate — Claude
Code's own migration attempt was blocked by the auto-mode permission
classifier as a database-permission change, correctly treated as
outward-facing per this project's own escalation discipline). Full
detail in "Phase 6 — Core Agent Build (BC-026)" below.

Phase 5 (Dashboard Systems) — **BC-021 through BC-025 all COMPLETE.**
BC-025: Step 1 verified — via the real deployed oauth-initiate code AND
real Edge Function logs — that Google/Calendar/Gmail is genuinely ONE
combined scope request (calendar.events + gmail.modify + userinfo.email
together), matching the DB; the human's screenshot showing only Gmail
scopes was Google's own incremental-consent re-display behavior, not a
code issue — no change needed. Slack removed entirely from Integrations
.tsx (category, provider option, all references) — it was never a valid
per-client integration design in the first place, per Client_
Integration_and_Credential_Platform_v1.md Part 8.4. Notifications
rebuilt as 2 real Gmail-based paths (UTIL-004: internal ops alerts +
distinct client-facing alerts), replacing SCH-006's 4 disabled Slack
nodes entirely. While building this, found and fixed 2 real,
independent bugs via genuine testing: the 3 token-refresh nodes'
`onError: continueErrorOutput` error branch was never actually
connected to the failure-check IF nodes (real refresh failures have
silently dead-ended since this workflow was built — the whole failure
branch was dead code), and those same IF nodes threw on real error
objects due to strict type validation. Both fixed and verified with a
real deliberate failure test — 2 genuine Gmail messages sent and
confirmed via real message IDs. Full detail in "Phase 5 — Slack Removal
+ Gmail-Based Notifications + Scope-Request Verification (BC-025)"
below.
BC-024: verified oauth-callback already stored Google's REAL granted
scope (not the requested one), but found and fixed a real gap — it
never checked whether the granted scope actually covered what the
specific category needed before marking a connection "connected"
(migration-free code fix, oauth-callback v7/v8 — a `verify_jwt`
regression from the v7 deploy was self-caught and fixed in v8 before
any real callback was affected). Live-tested with a real deliberate
partial consent denial. While testing, found and fixed a SEPARATE real
bug: SCH-006's refresh sweep was silently un-revoking connections a
human had explicitly disconnected (migration 049). Established a
`control.connection_snapshots` testing-safety table and used it 3 times
this session around the disruptive test. Full detail in "Phase 5 —
Partial-Scope-Grant Handling + Credential Preservation (BC-024)" below.
BC-023: the "token expired" symptom was never a scope/migration bug — SCH-006
(the scheduled token-refresh workflow) had simply never been toggled
active, so nothing auto-refreshed tokens between manual test sessions.
Now active (Slack alert nodes disabled to unblock publish — no real
Slack credential exists, per the long-standing BC-004/BC-008 gap).
Also completed the Calendar scope narrowing (full `calendar` →
`calendar.events`) that BC-023 was originally issued for, verified via
a real reconnect + real SCH-006 refresh against the new token. Full
detail in "Phase 5 — Token-Expiry Diagnosis + Calendar Scope Narrowing
+ Legal Page Revision (BC-023)" below.
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
Phase 6  — Core Agent ............................ COMPLETE
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

## Phase 5 — Token-Expiry Diagnosis + Calendar Scope Narrowing + Legal Page Revision (BC-023)

```
**Step 0 — tooling:** confirmed `@playwright/cli` (microsoft/playwright-cli)
is installed and functional locally (`playwright-cli --help` works). Not
actually needed this session's real work — the human did the live
Google/Console/reconnect actions themselves, and the rest was direct
Supabase/n8n MCP queries plus raw HTML fetched via `curl` (more direct
than a full browser session for reading two static pages). Confirmed
available and evaluated honestly rather than forced into use.

**Step 1 — token-expiry root cause, REAL diagnosis, not guessed:**
Queried `control.client_connections` directly: both the google/email
and calendly/calendar connections were genuinely `status='connected'`
in the DB (not `'expired'`) — the dashboard's "token expired" label is
a client-side comparison of `token_expires_at` against the current
time, and both had simply passed their natural ~1-2 hour access-token
lifetime with nothing refreshing them since. Confirmed via
`get_workflow_details`: **SCH-006 was `active: false`** — it had only
ever run when manually triggered in prior sessions; nothing was running
in the background. Ran it manually and captured the real result: BOTH
the Google and Calendly refreshes succeeded (real new Google access
token, real new Calendly access+refresh token pair), verified against
`control.client_connections` afterward (both `token_expires_at` moved
into the future). This proves conclusively the refresh mechanism itself
was never broken — the only real problem was that the schedule was
never turned on. **Fixed with the human's explicit go-ahead: activated
SCH-006.** Publishing initially failed — n8n's stricter production
validation requires a real `slackApi` credential on the 4 alert nodes,
which doesn't exist (same BC-004/BC-008 gap). Per the human's own
standing instruction, disabled (not deleted, not invented a credential)
those 4 nodes so the real refresh logic could activate; the Slack gap
itself is completely unchanged, just no longer blocking production
scheduling.

**Step 2 — Calendar scope narrowing, actually completed this session:**
The human's Console screenshot showed the OAuth consent screen still
requesting the FULL `calendar` scope ("edit, share, and permanently
delete all the calendars") — not narrowed to `calendar.events` as the
original card assumed. Console and the DB were already in sync with
each other (both at full `calendar`) — the narrowing itself had never
actually been done on either side, a real, useful correction to the
card's own premise. The human then narrowed Console's requested scope
to `calendar.events` live; migration 047 updated `control.oauth_apps`'
google row to match exactly: `calendar.events` + `gmail.modify` +
`userinfo.email`. Confirmed via direct query, not assumed.

**Step 3 — reconnect + verification, real, not "shows connected in UI":**
The human reconnected Google (both Gmail and Calendar) after the scope
narrowing. Verified directly against `control.client_connections`:
`scopes_granted` on both rows now genuinely includes `calendar.events`
(not the old full scope) — the narrowing took effect for real, not just
in configuration. Ran SCH-006 again manually: both Google connections
refreshed successfully against the new narrower-scoped tokens, verified
against the DB afterward (`token_expires_at` correctly advanced on
both). **Calendly — real, expected side effect, not a bug:** reconnecting
Google Calendar wrote to the SAME `category='calendar'` connection row
Calendly previously held (the `UNIQUE(client_id, category)` design
flagged as an open question back in BC-021) — confirmed via the audit
log timeline that connection_id `609559ce-...` flipped from
`provider='calendly'` to `provider='google'` at the exact moment of the
human's reconnect. **Calendly is now genuinely disconnected**, replaced
by Google Calendar in that same category slot — not broken, not a
migration side effect, a direct and expected consequence of today's
reconnect given the still-open category-sharing design. Reconnecting
Calendly again would simply replace Google Calendar back, per the same
design; this remains an open product question for the Commander, not
resolved this session either.

**Step 4 — Privacy Policy + Terms of Service, revised (not rewritten):**
Neither page exists anywhere in this repo — traced them live: DNS
resolves `zenny.zeromanuals.com` to Netlify (`Server: Netlify` header
confirmed via a direct curl), not the `zeromanualai/zenny` GitHub repo
(checked via `gh api` — that repo holds only a stale `index.html`, no
legal pages; a real, useful correction to an assumption, not something
to guess past). Fetched the real live HTML via `curl` (not WebFetch,
which paraphrases/summarizes rather than returning raw source — the
exact CSS/visual design needed to be preserved byte-for-byte per the
card's explicit instruction). Revised both documents' substantive
language to reflect Zenny's real model — a Client business connects its
own Google account, and Zenny's AI agent then acts on that Client's
behalf when communicating with the Client's OWN customers — replacing
the "you authorize your personal Google account for your own use"
consumer-tool framing throughout (Privacy Policy Sections 1-2, ToS
Sections 2-3 primarily). Added an explicit new subsection addressing a
real gap the card asked to check: end-customer personal data (names,
emails, appointment details) genuinely does flow through the Client's
Gmail/Calendar access even though the end customer never authorizes
anything directly — disclosed clearly, same Limited Use restrictions
applied regardless of whose data it is, end-customer requests routed
through the Client business. Made the "Zenny, a product of ZeroManual,
Inc." relationship explicit and consistent everywhere the two names
appear (nav eyebrow, footer, body copy) — addresses the brand-name-
consistency flag from the card's note. Every already-correct section
(Limited Use disclosure at Section 4/Google API Services User Data
Policy, retention, revocation mechanism, contact info) preserved
verbatim in substance, only reworded where the "you" needed to shift
from personal user to connecting business. Visual design (colors,
fonts, layout, all CSS) preserved exactly — the new brand guideline was
explicitly NOT applied here, per the human's direct instruction.
**Publishing — human's own action, per their explicit choice:** both
finished HTML files are committed in this repo at
`00_Project_Control/Legal_Pages_Revised_BC023/` (`privacy-policy.html`,
`terms-of-service.html`) for the human to upload via Netlify directly;
Claude Code does not have Netlify access this session.

0 self-resolved document-level items this session — the Document
Resolution Authority gate does not apply. Everything above was either
live diagnosis against real data (Step 1), a database change matching
a human-controlled Console change 1:1 (Step 2), verification (Step 3),
or a content revision explicitly commissioned by this card (Step 4) —
none of it a document-level conflict.
```

## Phase 5 — Partial-Scope-Grant Handling + Credential Preservation (BC-024)

```
**Step 1.1 — code-level verification, confirmed correct as-is:**
Re-read oauth-callback's real google case: `scope: json.scope` reads
Google's ACTUAL returned scope string from the token-exchange response
(the real grant, which may be a subset of what was requested), not the
requested scope list — confirmed by tracing the exact line, not
assumed. This is stored verbatim into `scopes_granted` via
`p_scopes_granted: result.scope ?? ""`. No fix needed here — this part
was already correct.

**Step 1.1/1.4 — real gap found and fixed:** the function never checked
whether the granted scope actually covered what the CATEGORY being
connected needs before marking the row `status: 'connected'`. Since
google's oauth_app row requests calendar.events + gmail.modify +
userinfo.email together in one consent screen (confirmed via Google's
own docs — this is native multi-scope consent-screen behavior, nothing
to build on Zenny's side), a user could deny the one permission a
specific category flow actually needs while granting an unrelated one,
and the row would still have been marked "Connected." Fixed:
oauth-callback v7 adds a `REQUIRED_SCOPE` map (currently
`google.email -> gmail.modify`, `google.calendar -> calendar.events`)
checked against the real granted-scope string before any secret is
stored; a genuine denial for the category being connected now redirects
with a real, logged `required_scope_denied` reason instead of a false
"Connected." **Self-caught deploy regression, fixed in the same
session before any real impact:** the v7 deploy call omitted
`verify_jwt` (this MCP tool's default is `true`), which would have
silently added a JWT requirement to a public callback that Google/
Shopify/Slack/Calendly/Cal.com hit directly with no bearer token —
every real OAuth callback would have 401'd. Caught immediately from the
deploy response's own `verify_jwt: true` field, redeployed as v8 with
`verify_jwt: false` explicitly, then sanity-checked with a real
unauthenticated curl GET (302, not 401) before proceeding. Logged here
in full rather than glossed over.

**Step 1.2 — real deliberate partial-grant test, done by the human:**
Reconnected via a different Google test account (the original account
had already approved the app once, so Google would auto-skip re-
prompting — a real, correct reason to switch accounts for a clean
test), through the "Connect Calendar" flow, denying Gmail on Google's
real consent screen. Confirmed via the real Edge Function log line:
Google's actual callback returned
`scope=email+calendar.events+userinfo.email+openid` — no gmail.modify,
exactly the denial performed. Since the Calendar category's own
requirement (calendar.events) was met, this connected correctly and
the email category was correctly left untouched — not a rejection-path
hit, but real, live proof the granted-scope check works off the real
Google response and that category isolation holds (no cross-category
false positive). The rejection branch's logic is a simple, deterministic
string-membership check exercised by the same code path — not
separately re-tested against an actual gmail.modify-denial-on-the-email-
flow scenario this session, disclosed honestly rather than overclaimed.

**Step 1.3 — dashboard UI, confirmed already correct:** Integrations.tsx
independently renders each category by finding its own
`connections.find(c => c.category === category)` row — a partial grant
naturally shows exactly the right per-category state (Connected only
for what's actually connected) with no extra code needed. No gap found
here.

**Step 1.5 — UI copy added (small effort, judged worth it):** a new
note near the Connect buttons: "On Google's own consent screen,
Calendar and Gmail permissions can be approved or denied independently
— granting one doesn't require granting the other." Committed to
Integrations.tsx. **Not yet live** — deploying the dashboard requires
Hostinger MCP, which is disconnected this session; the change is in the
repo, ready for the next deploy.

**A SEPARATE real bug, found live as a side effect of testing (not
something Step 1 was looking for, but real and worth fixing
immediately):** running SCH-006 to check the partial-grant test's
connection also touched the human's just-revoked Gmail connection —
and silently flipped it back to `status: 'connected'` with a fresh
token. Root cause, confirmed via both functions' real definitions:
`get_connections_due_for_refresh` selected any connection with a
non-null `refresh_token_secret_id` and an expiring `token_expires_at`,
with NO exclusion for `status = 'revoked'` (revoking is local-only and
deliberately doesn't delete the underlying Vault secret, so a revoked
row's refresh token is still there to be picked up); combined with
`update_connection_tokens` unconditionally setting
`status = 'connected'` on every successful refresh, this meant the
6-hourly scheduler could silently un-revoke any connection a human
explicitly disconnected. **This directly undermines the Disconnect
feature** and was fixed immediately: migration 049 adds
`AND status <> 'revoked'` to `get_connections_due_for_refresh`, so
revoked connections are never selected for refresh in the first place.

**Step 2 — credential preservation, a testing-safety net established
and used 3 times this session:** created `control.connection_snapshots`
(migration 048) — references existing Vault secret IDs only, never
duplicates decrypted secret material; explicitly documented as
informational/historical only, never read by any live code path, never
auto-restored. Snapshotted the test client's 3 working connections
BEFORE Step 1's test disturbed anything; snapshotted again after the
human reconnected the real test Gmail account; snapshotted a third time
after the human reconnected Calendly (replacing Google Calendar in the
shared category slot again, per the still-open BC-021/BC-023 design
question). **Staleness handling, stated plainly:** a snapshot's
`snapshotted_at` should be compared against the live row's current
`updated_at` for the same (client_id, category) before treating it as
"what's connected right now" — if the live row is newer, the snapshot
is historical record only. This is not a parallel source of truth; it
never overrides or is read by `control.client_connections` itself.

**Step 2.3 — standing testing-safety process, for future sessions:**
Before any test that might overwrite a `control.client_connections`
category slot (reconnecting a provider that shares a category with
another, like Calendar; deliberately testing a failure/denial path;
anything that calls `upsert_client_connection` against an existing
row) — snapshot the CURRENT state of any real, working connections for
that category first via the pattern used in this session's 3 snapshot
inserts above. This is now a standing practice for this project, not a
one-time BC-024 fix.

**Final verified state, all 3 real test connections healthy:**
Calendly (category='calendar'), google/email (real test account,
`quaantummedia.zeromanual@gmail.com`, full scopes), and woocommerce/
ecommerce — all `status: 'connected'`, confirmed via direct query and
snapshotted.

0 self-resolved document-level items this session — the Document
Resolution Authority gate does not apply. All of the above was live
diagnosis/testing against real data, a real code fix for a gap the
card asked to verify, and one additional real bug fixed immediately
upon discovery — none of it a document-level conflict.
```

## Phase 5 — Slack Removal + Gmail-Based Notifications + Scope-Request Verification (BC-025)

```
**Step 1 — real scope-request behavior, verified before changing
anything:** Re-read oauth-initiate's live deployed source: `buildAuthorizeUrl`
uses `app.scopes` (the single control.oauth_apps google row's combined
scope string) for BOTH the 'calendar' and 'email' category flows — no
category-specific scope subsetting exists anywhere in the code. Cross-
checked against real, fresh Edge Function logs from the human's actual
recent connect attempts: every real oauth-callback hit (both category=
calendar and category=email initiations) shows Google returning
`calendar.events + gmail.modify + userinfo.email` together in the real
`scope` param — confirmed unambiguously that this is ONE combined
request, not two separate ones, matching the code and the DB exactly.
The human's screenshot showing only Gmail-family permissions is
explained, not a bug: Google's own consent UI selectively re-displays
only newly-requested/changed scopes on a re-consent (the
`consentsummary` URL itself is Google's re-consent summary screen, a
real, documented Google behavior) when an account has already granted
some of the requested scopes in a prior session — highly plausible
given how much testing this exact test account has been through. The
softer warning screen (vs. the red "hasn't verified" interstitial) is
explained the same way as always: the google oauth_app is `app_status:
'testing'`, and Google will not let ANY consent screen render at all
for a non-registered account on a Testing-status app — reaching a
consent screen at all is itself proof the account is a registered Test
User; not independently checked in Console (no tool access), but a
sound logical deduction, not a guess. **Recommendation: no change
needed** — the current one-combined-request design is fine, arguably
better (BC-024's partial-grant handling already correctly isolates
per-category outcomes regardless of how the consent screen renders).

**Step 2 — Slack removed entirely from the client-facing dashboard:**
Integrations.tsx's `notification` category, its Slack `ProviderOption`
entry, and its `CATEGORY_LABELS` entry all removed — not hidden, not
disabled, gone. `ARCHETYPE_CATEGORIES` no longer lists 'notification'
for any archetype. Confirmed via search: no other dashboard file
references Slack as something a client configures. Real design mismatch
resolved: Client_Integration_and_Credential_Platform_v1.md Part 8.4
always described Slack as ONE Zenny-owned internal app (chat:write
only), never a per-client integration — it should never have been a
"Connect" option on a client-facing dashboard. **Not yet live** —
dashboard redeploy needs Hostinger MCP, disconnected this session;
change is committed to the repo.

**Step 3 — UTIL-004 rebuilt, Slack removed, Gmail-based (2 real
paths):** Removed the Slack IF-node and its httpRequest node entirely.
Added a genuine second path: new trigger inputs (notify_client,
client_email, client_subject, client_message) alongside the existing
internal ones, feeding a new "Notify Client?" IF -> "Send Client Email"
Gmail node. Both Gmail send nodes use the `zenny-notification-sender`
credential (per the human's explicit correction — not zenny-gmail as
originally assumed) sending internal alerts to zenny.zeromanual@gmail.com
and client alerts to that client's own contact email. Fixed
"Send Ops Email"'s literal placeholder `sendTo` value to the real
address. **SCH-006's 4 disabled Slack nodes removed entirely** (not
left disabled-in-place — the decision is now "we don't use Slack," per
the Commander) and replaced with a real notification chain on all 4
original trigger points (3 refresh-failure branches + the 7-day Google
Testing-mode warning): a new "Get Client Email" node (calling a new
public RPC, `get_client_contact_email` — migration 050, control is not
PostgREST-exposed, same wrapper pattern as every other control.* access)
feeding an "Execute Workflow" call to UTIL-004 with BOTH `notify_email`
(reusing the exact original Slack message text, unchanged) and
`notify_client` (new, genuinely distinct, actionable client-facing
copy, e.g. "Your Google Calendar connection needs to be renewed... sign
back in and reconnect it under Integrations"). **Real gap found and
fixed along the way:** the test client had NO `control.client_config`
row at all — confirmed via query that NO client in the entire system
currently has one, a real, separate, pre-existing gap worth flagging
for a future card (not in this card's scope to fully resolve). Inserted
one for the test client (email_address = zenny.zeromanual@gmail.com,
per the human's explicit instruction) with otherwise-minimal valid
defaults, just to make this session's real test possible.
`control.oauth_apps`' slack row marked with a new, real `'deprecated'`
app_status value (migrations 051-052, additive to the existing CHECK
constraint, same pattern BC-004 used to add `'pending'`) — a directly-
queryable signal, not just a comment, so a future session doesn't try
to "fix" the placeholder-credential gap BC-004 originally flagged; it's
now a closed Commander decision.

**2 real, independent bugs found and fixed live, while testing (not
what Step 1-3 were looking for, but real and caught by actually
running the workflow, not assumed from code review):**
1. All 3 `Refresh *** Token` nodes use `onError: continueErrorOutput`,
   which produces items on a SEPARATE output (index 1) for real
   failures — but SCH-006's connections graph only ever wired output
   index 0 (success) to the corresponding `Refresh Failed?` IF node.
   **Real refresh failures have been silently dead-ending since this
   workflow was built** — the entire failure branch (Mark Token
   Expired / Log Refresh Failed / notifications) was dead code for
   real failures the whole time; every prior "successful" SCH-006 test
   this project ever ran happened to hit only the success path. Caught
   only because BC-025 deliberately forced a real failure. Fixed by
   also connecting output index 1 into the same IF node for all 3
   branches.
2. Those same 3 `Refresh Failed?` IF nodes use strict type validation
   on a `$json.error exists` check — which threw a real
   `NodeOperationError` ("Wrong type... is an object but was expecting
   a string") the moment a genuine error object (the full AxiosError)
   reached them, rather than evaluating true. Fixed via loose type
   validation (n8n's own suggested fix), all 3 nodes.

**Step 4 — both real Gmail sends verified with real message IDs, not
just "no error":** Created one disposable test connection (client_id =
the real test client, but a genuinely unused `category='telephony'`
slot — no real credential touched) with a deliberately invalid refresh
token, so Google's real token endpoint returned a genuine
`invalid_grant` 400. Ran SCH-006 for real: confirmed the FULL chain
fired end-to-end — `Refresh Failed?` correctly true, `Mark Token
Expired`, `Log Refresh Failed`, `Get Client Email` (returned the real
`zenny.zeromanual@gmail.com`), then UTIL-004's sub-execution shows BOTH
Gmail sends succeeded with real, distinct Gmail message IDs: "Send Ops
Email" -> `19fd75113a10d2df`, "Send Client Email" -> `19fd751152b7ee18`
(both `labelIds: ["SENT"]` — genuine proof of real delivery, not a
simulated/pinned test). The 7-day Google Testing-mode warning branch
uses the identical UTIL-004 mechanism already proven working here;
not independently re-triggered this session (would require faking a
near-7-day-expiry testing-mode connection, more setup for the same
already-proven code path) — disclosed as a scoping choice, not
overclaimed as separately tested. Disposable test connection cleaned
up afterward: marked `revoked` with a clear note (not force-deleted —
it has real audit log history, matching this project's "mark clearly,
don't delete" convention).

0 self-resolved document-level items this session — the Document
Resolution Authority gate does not apply. Step 1 was investigation
only (no change made); Steps 2-4 were explicit card instructions or
ordinary bug-fixing against live test data — none of it a document-
level conflict.
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

## Phase 6 — Real Infrastructure Bug Fixes (BC-028)

```
**Step 0 — claude-remember plugin, verified honestly:** ran the
plugin's own `doctor.sh` diagnostic (per the standing "verify a new
tool's real behavior before relying on it" discipline). Real result:
the plugin is installed and its PostToolUse hook is firing (a live
10-second-old marker file confirmed), but **no save has ever completed
for this project** — 0 memory files exist, FAIL line explicit. Honest
conclusion: not currently functional here, not relied on this session.
Added a new standing rule to CLAUDE.md: actively check and use
available MCP tools/plugins/skills rather than defaulting to manual
approaches, but always verify a new/unfamiliar tool's real behavior
with a genuine test call first — never trust a name or README alone.

**Step 1 — `control.client_connections_display` SECURITY DEFINER view,
fixed (a real security gap, not just a lint nag):** pulled the view's
real definition (a plain `SELECT` passthrough over
`control.client_connections`, no cross-schema logic). Confirmed via
`reloptions` it had never had `security_invoker` explicitly set (a
known Supabase Dashboard/legacy-view default quirk, not a deliberate
choice) — meaning it ran with the view owner's (`postgres`) privileges,
bypassing `client_connections`' real RLS (enabled, zero policies,
default-deny) entirely. Combined with `anon`/`authenticated` holding
table-level grants on the view itself, this meant **any authenticated
request could read every client's connection metadata across the
entire platform** via this one view — a genuine cross-tenant exposure,
same class of finding as BC-024's `connection_snapshots` RLS gap.
Fixed: `ALTER VIEW ... SET (security_invoker = true)`. Security Advisor
re-run confirmed the `security_definer_view` ERROR is gone.

**Step 2 — UTIL-003 + UTIL-005 fixed via the proven RPC-wrapper
pattern:** built `public.insert_client_tool_call_log`,
`public.client_has_suppression`, `public.get_client_lead_status` (all
SECURITY DEFINER, `SET search_path TO ''`, `%I`-safe dynamic schema
interpolation, `anon` EXECUTE revoked — the established pattern from
BC-026). Rewired both workflows' broken direct-client-schema HTTP
nodes to call these instead. **A real, newly-confirmed quirk found
along the way:** with `responseFormat: json` forced on a bare JSON
scalar (e.g. a boolean), n8n lands the value as the item's WHOLE `.json`
directly (`json: false`), not nested under `.data` the way the
established `text`-format scalar cases work — a real bug in the first
fix attempt, caught via a real execution showing `proceed: false` for a
genuinely non-suppressed contact. Re-verified all 4 real branches
(suppressed/not-suppressed, booked/closed lead) against real data.

**Step 3 — ADP-002's human-handoff path, fixed end-to-end (the single
most important fix this session — this is Convocore's actual
escalation path; no real Convocore-triggered escalation could ever
have succeeded before this):**
- Root cause: `Check Existing Open Escalation` and `Insert Escalation
  Row` both used the broken direct-client-schema pattern. Fixed via 2
  new RPCs: `client_has_open_escalation` and a newly-overloaded
  `insert_client_escalation` (10-arg version adding `p_escalation_team`
  — Postgres correctly keeps this alongside the original 9-arg version
  WF-017 already calls, resolved by exact-arity match, fully backward
  compatible, verified via `pg_proc`).
- **A second, separate real infrastructure gap found while building the
  first real test data this project has ever had for this table:**
  `control.convocore_agent_map` had ZERO table-level grants for
  `authenticated`/`service_role` at all (`permission denied for table`)
  — the BC-026 schema-`USAGE` fix opened the schema door but this one
  table's own grants were never added, never caught because no real
  agent-map row existed anywhere until this session created one to test
  with. Fixed via `GRANT SELECT ON control.convocore_agent_map`.
- **A third, pre-existing bug, unrelated to PostgREST exposure:**
  `Agent Known?` and 4 downstream nodes assumed the agent-lookup
  response was still `[0]`-indexed — same array-unwrap bug class as
  BC-026's INT-002 finding, never caught because no real row ever hit
  the "found" branch before. Fixed all 5 references.
- **A fourth:** `Read Agent Secret` had no `responseFormat` set; fixed
  to `text` + corrected the Bearer comparison to reference `$json.data`.
- **A fifth:** `Insert Escalation Row`'s `p_schema` reference broke
  because the intervening `Check Existing Open Escalation` node's own
  HTTP response replaces the item's `.json` entirely — fixed to
  reference the schema-resolver node explicitly via `$()`.
- **A sixth:** the Stage-2 UTIL-004 call had the same single-output-pin
  gotcha WF-017 had before its BC-026 fix — wired both pins.
- Real end-to-end test via the actual production webhook with a real
  (test-marked) `convocore_agent_map` row + stored Bearer secret. Stage
  1: real Bearer auth passed, real `escalations` row created
  (`escalation_team: 'ops_team'` confirmed via SQL). Stage 2 (repeat
  call, same customer): correctly detected the open escalation, did NOT
  create a duplicate (exactly one row confirmed via SQL), fired a real
  UTIL-004 notification.

**Step 4 — Tool Execution Fallback's dead Slack node, replaced:** same
unmigrated-Slack issue BC-025 already fixed everywhere else — no real
multi-tenant Slack OAuth app exists (BC-004/BC-008), so this
credential-failure human-notification step had always notified no one.
Removed the Slack node entirely (not disabled-in-place, per the BC-025
precedent) and replaced with Execute Workflow → UTIL-004 (both output
pins wired). **2 more real bugs found while testing (this workflow had
also never been execution-tested before):** `Mark Connection Errored`
and `Log Fallback Event` both had zero credential attached at all (real
"Credentials not found" error); `Log Fallback Event` also had no
`responseFormat` set. Fixed both. Real end-to-end test via a disposable
`control.client_connections` row (category `telephony`, marked
`revoked` after use): confirmed the connection was genuinely marked
`status='error'` via direct SQL, and a real Gmail message was sent
(`id: 19fd89f71e99ca23`).

**Step 5/6 — Credential Resolver's synchronous expiry check, built and
given its first-ever confirmed live execution:** per
Client_Integration_and_Credential_Platform_v1.md Part 6.2's own design,
built a new shared sub-workflow, `Zenny Shared Utility - Refresh
Connection Token` (UTIL-007, new n8n ID `NiBCdKzb0pkvWBQn`), extracting
SCH-006's real Google OAuth-refresh logic (Calendly/Cal.com explicitly
flagged as not-yet-implemented — a real, disclosed scope cut, since
Google is the only provider with real tested credentials across every
prior session) so UTIL-006 has one canonical place to call rather than
reimplementing the refresh HTTP calls a second time. Wired into
UTIL-006: `Token Expiring Soon?` (`!token_expires_at || <= now+5min`) →
if true, calls UTIL-007 synchronously before returning a token; if the
refresh itself fails, routes to Tool Execution Fallback with a real
reason instead of silently returning a stale/dead token. **3 more real,
pre-existing bugs found — UTIL-006 had never been execution-tested
before this session either:** `Get Client Connection`, `Read Token
Secret` both had zero credential attached (2 separate real "Credentials
not found" errors); `Read Token Secret` also had no `responseFormat`
set, and `Resolved Credential`'s token assignment needed to reference
`$json.data` once fixed. **Real test — not artificially forced:**
Client A's real `google`/`email` connection happened to be genuinely
expired at test time (a live, real instance of exactly the gap being
fixed, confirmed via direct SQL before touching anything — snapshotted
first per the established BC-024 safety-net pattern). Called UTIL-006
directly: confirmed a real, freshly-minted Google access token
returned, and confirmed via direct SQL that `token_expires_at` was
updated to ~1 hour in the future (matching Google's real access-token
lifetime) with a fresh `updated_at`. This was a genuine production fix,
not disposable test data — the connection is now actually healthy.

**Step 7 — Workflow Registry updated:** every workflow touched this
session (UTIL-003, UTIL-005, UTIL-006, ADP-002, Tool Execution
Fallback) had its entry rewritten to reflect the real, fixed, verified
state — no more "KNOWN BROKEN" language left stale. New UTIL-007 entry
added. SCH-006's entry cross-referenced from UTIL-006's new design-
intent note.

**Cleanup:** disposable test harness archived; disposable `telephony`
connection marked `revoked`; disposable RPC-verification rows deleted;
the real `convocore_agent_map`/escalation/connection test data used for
ADP-002's and UTIL-006's genuine E2E tests left in place, clearly
named, per this project's convention (the UTIL-006 fix was a real
production repair, not something to roll back).

**0 self-resolved document-level items this session** — every finding
was ordinary bug-catching (missing credentials, missing grants,
array-shape assumptions, response-format quirks, a lost-context
reference), never a genuine document-level conflict or gap. The
Document Resolution Authority gate does not apply; no stop required.
```

## Phase 6 — Core Agent Build (BC-026)

**Point-by-point session summary (added BC-027, for the human's own
understanding of what this session actually did — the detailed
technical reference below remains the citable full record):**

1. Confirmed live that none of the 10 target workflows existed yet
   under any name — a clean build, not a rebuild.
2. Set up 2 reusable test clients ("Client A" = commerce_ecom, "Client
   B" = emergency) with real `control.client_config` rows pointing at
   real inboxes, documented as a standing reference for future Phase 6+
   sessions.
3. Built all 5 internal workflows (INT-001 through INT-005 — Create
   Customer, Load Client Configuration, Load Archetype Configuration,
   Initialize Conversation, Archive Conversation) and all 5 Core Agent
   Tools (WF-013 through WF-017 — CancelAppointment, GetOrderStatus,
   GetBookingStatus, UpdateCustomer, NotifyHuman).
4. Hit a real problem partway through: nothing could actually read or
   write a real client's data. Diagnosed it down to client schemas not
   being exposed to PostgREST at all — a platform-level gap that had
   silently existed since early sessions, never caught because nothing
   had actually been execution-tested against a real client schema
   until this session. Built 6 small database functions as a
   workaround (all in the shared `public` schema, each one safely
   scoped to a single client's schema) and rewired every affected new
   workflow to call them instead of hitting the client schema directly.
5. Hit a SECOND, separate real problem while testing config-loading:
   even the shared `control` database, which should have always been
   reachable, was returning "permission denied." Traced it to a
   missing basic access grant that should have existed since this
   schema was first created. Asked for approval before applying the
   fix (a database permission change), got it, applied it, and
   everything downstream started working correctly.
6. While actually running each workflow for real (not just checking
   that it built without errors), found and fixed 3 more ordinary bugs
   — each one where the workflow LOOKED like it worked, but was quietly
   reporting the wrong result to whatever calls it next: a config-load
   step that never actually recognized a real config even when one
   existed; a notification step that silently failed to respond about
   half the time even though it had done its job correctly; and a
   "delete this row" step that always reported failure even after
   successfully deleting the row.
7. Nothing was abandoned or left half-done — every one of the 6 real
   bugs found (2 infrastructure-level, 1 database-permission, 3
   ordinary code bugs) was fixed and then re-verified with a fresh,
   real test before moving on, not just patched and assumed fixed.
8. Ran the complete sequence for real against Client A (create a
   customer, load their config, load their archetype settings, start a
   conversation, check a real order, check a real booking, attempt an
   update, attempt a cancellation, fire a human notification, close the
   conversation) and a meaningful shorter version against Client B —
   checking the real database after every single step, not just
   trusting that the workflow reported success.
9. One real, previously-unnoticed bug was found but deliberately NOT
   fixed this session — 3 other, already-"complete" workflows from
   earlier sessions (the Error Logger, the Stop Checker, and the
   Convocore Adapter's human-handoff path) turn out to use the exact
   same broken direct-schema-access pattern the new workflows hit, and
   were flagged for a future card rather than fixed as a scope-creep
   add-on to this one.
10. Cleaned up: deleted the disposable testing workflow, removed one
    leftover duplicate test row from an earlier failed attempt, left
    the real successful test data in place (clearly named, matching
    this project's convention).

```
**Step 0 — live audit:** `search_workflows` across the n8n instance
confirmed none of the 10 target workflows (INT-001–005, WF-013–017)
existed under any name. The `WF-001`/`WF-002`/`WF-003` workflows found
in the list are unrelated legacy pre-rebuild workflows (Lead Creation/
Conversion/Escalation Engines) — not part of the current architecture's
Part 13 numbering, not touched.

**Step 0.5 — Test-Client Roster (standing reference for all future
Phase 6+ sessions):**
  Client A: client_id baa673b5-c51a-4a7b-91f5-a37027f8dca4, business_name
  "TEST CLIENT -- BC-015 ORDER DASHBOARD TEST -- DO NOT USE", archetype
  commerce_ecom, schema client_test_002_acme_commerce_test, contact
  email zenny.zeromanual@gmail.com (control.client_config row, pre-
  existing from BC-025).
  Client B: client_id 7e2dffbf-97a2-46d8-b60f-6782379f02b6, business_name
  "TEST CLIENT -- E2E ONBOARDING TEST -- DO NOT USE", archetype
  emergency, schema client_test_001_acme_emergency_test, contact email
  quaantummedia.zeromanual@gmail.com (control.client_config row updated
  this session — previously held a fake, non-deliverable placeholder
  address, corrected to comply with the card's real-inbox requirement).
  Both marked test data in their business_name; no third client created.

**Step 1 — INT-001 through INT-005 built** as executeWorkflowTrigger
sub-workflows (no webhook exposure, per Part 7.7): INT-001 Create
Customer (`15a5DvfIRI7JwsAQ`), INT-002 Load Client Configuration
(`vbk6dwVX4Q6H2RuY`), INT-003 Load Archetype Configuration
(`WZMrS05IeTn8o0pj`, pure Code node, no DB call), INT-004 Initialize
Conversation (`Xlcb0PhSUiyO6Znj`), INT-005 Archive Conversation
(`bIcKNwCk8M52oipt`). Missing-config fallback built exactly per the
card's hard rule: INT-002 falls back to `core_agent_only` with all
Growth/Conversion/Recovery/Email modules explicitly false if no
`control.client_config` row exists; INT-003 defaults every
archetype-specific flag conservatively when absent (verified live
against Client B's real `freedom_level_override: null` — resolved to
`freedom_level: 1`, `resolved_conservatively: true`, never guessed
permissive).

**Self-resolved document-level item (logged per the standing rule —
see Blockers for the required stop):** no `conversations` table exists
anywhere in any client schema (confirmed empirically against
`client_test_002_acme_commerce_test`'s full table list). Searched
broadly (n8n_Workflow_Specification_v1.md, Agent_Runtime_System_v1.md,
Database_Structure_v4_FINAL.md, and via codebase-memory-mcp) before
resolving — found Convocore itself already owns and manages the real
conversation record/transcript (multiple Convocore doc references:
"conversation record," `convoId`). Resolved INT-004/INT-005 to operate
on `active_issues` rows (`current_owner = 'live_conversation'`) as the
one coherent Postgres analog instead of inventing a non-existent table
— a mechanical/structural decision with one obviously correct answer
given Convocore's already-established ownership, not a genuinely novel
product decision.

**Step 2 — WF-017 NotifyHuman built** (`pLYEVQ9kto7NTBfk`, webhook
`notify-human`), writes a real `escalations` row via the new
`insert_client_escalation` RPC (using the real `escalation_team` column
BC-007 added — confirmed live via `information_schema.columns`, absent
from the doc but present in the DB, consistent with this project's
known doc-staleness pattern), fires UTIL-004 for a real ops
notification.

**Step 3 — WF-013/014/015/016 built** per exact Part 13.13-13.17
contracts (WF-015 re-verified directly, not inferred from WF-014 — its
real entry is `get-booking-status`, payload field `booking_reference`,
response `{booking_id, status, details}`, status derived from whichever
of `client_calendar_write_status`/`our_db_write_status` matches
`authoritative_source`, since `appointments` has no simple `status`
column). WF-014/WF-015 (GetOrderStatus/GetBookingStatus) apply light
verification and execute directly. WF-013 (CancelAppointment) and
WF-016 (UpdateCustomer) are high-risk per the Customer Verification
Rule; confirmed empirically that no verification-config mechanism
exists anywhere in the real system, so both ALWAYS route to WF-017/
Human Handoff Handler rather than improvise — per the rule's own exact
language ("do not attempt to improvise a verification approach").

**Step 4 — real shared utilities used, not reimplemented:** all 10
workflows call the existing UTIL-001 (`qbhdmH2ZN6opkXL1`) and, where
needed, UTIL-004 (`fcilrbwldjnn92Yn`) by their real, confirmed workflow
IDs — both published this session (required: `Execute Workflow` nodes
with `source: 'database'` refuse to run against an unpublished target).

**Major infrastructure bug found and fixed — PostgREST schema
exposure:** hit live while first testing INT-001 against Client A:
`PGRST106 - Invalid schema: client_test_002_acme_commerce_test —
Only the following schemas are exposed: public, graphql_public,
control`. This invalidated the `Content-Profile`/`Accept-Profile`
direct-schema-access pattern used throughout this project since early
sessions. Fixed by building 6 new `public`-schema SECURITY DEFINER RPC
wrapper functions (migrations 052-053, all `SET search_path TO ''`,
`format()` + `%I`/`%L` for safe dynamic schema interpolation, `anon`
EXECUTE explicitly revoked): `insert_client_customer`,
`insert_client_active_issue`, `delete_client_active_issue`,
`get_client_order_by_reference`, `get_client_appointment_with_customer`,
`insert_client_escalation`. Migration 053 fixed a follow-on bug inside
`insert_client_escalation`: `SET search_path TO ''` broke bare enum-
type-name casts (`type "escalation_priority_enum" does not exist`) —
fixed by schema-qualifying every cast (`$4::public.escalation_priority_
enum`, confirmed via `pg_type`/`pg_namespace` that these enums live in
`public`). All 6 RPCs verified working via direct SQL calls before any
workflow was rewired to use them.
**Retroactive implication, NOT fixed this session (flagged for a
future card):** 3 pre-existing workflows use this exact same broken
`Content-Profile`/`Accept-Profile` pattern against dynamic client
schema names — UTIL-003 Error Logger, UTIL-005 Stop Checker, and
ADP-002 Convocore Adapter. None of them appear to have ever been
execution-tested against a real client schema; all 3 would hit the
identical `PGRST106` error if they were.

**Second, separate infrastructure bug found and fixed — missing schema
USAGE grant:** hit live while first testing INT-002 against Client A:
`permission denied for schema control` (Postgres code 42501), despite
`control.client_config` having correct table-level grants for
anon/authenticated. Root-caused via
`has_schema_privilege('anon','control','USAGE')` returning `false` for
all of anon/authenticated/service_role — the `control` schema itself
had never been granted `USAGE` to any of these roles (Supabase grants
this automatically for `public` but not for custom schemas). This
blocks ALL direct PostgREST access to `control.*` regardless of
table-level grants, retroactively calling into question whether
UTIL-001 Schema Resolver's `control.clients` read — used by every
Tool workflow via WF-01x's schema-resolution step — has ever actually
succeeded in any prior session. Attempted `GRANT USAGE ON SCHEMA
control TO anon, authenticated, service_role` via `apply_migration`;
blocked by the auto-mode permission classifier as a database-
permission change. Per this project's own escalation discipline
(confirm before outward-facing, hard-to-reverse infrastructure
changes), stopped and reported to the human, who applied the grant
directly. Re-verified live (`has_schema_privilege` now `true` for all
3 roles) before resuming.

**3 more real bugs found and fixed live during E2E testing (ordinary
code bugs, not document-level — Document Resolution Authority's
"mechanical mistake with one obviously correct fix" carve-out
applies):**
1. INT-002's `Resolve Config (Conservative Fallback)` code node assumed
   the HTTP node's output was still a JSON array (`Array.isArray(rows)`)
   — but n8n's HTTP Request node auto-unwraps a single-row JSON array
   response into `item.json` being the row object directly. This made
   every real, successful config load get wrongly treated as "no
   config," always falling back to `core_agent_only` even when a real
   row existed. Fixed to check `$input.all()` length + presence of
   `client_id` on the first item instead.
2. WF-017's `Notify Internal Ops (UTIL-004)` Execute Workflow node
   exposes 2 separate output pins matching UTIL-004's two internal
   Gmail branches (Send Ops Email / Send Client Email) — but WF-017
   only wired pin 0 to `Respond - Escalation Created`. Real traffic
   (`notify_client: false`) actually returns on pin 1, so the webhook
   silently never responded even though the escalation row was created
   successfully every time. Fixed by wiring both pins to the same
   response node (the response body only reads `escalation_id` from an
   earlier node, so it's correct regardless of which branch fired).
3. INT-005's `Close Active Issue` node calls `delete_client_active_issue`
   (a bare boolean-scalar RPC) with `responseFormat: "text"` — but even
   in text mode, n8n delivers this specific scalar as a real JS boolean
   `true` under `.data`, not the string `'true'`. The downstream strict
   string comparison (`$json.data === 'true'`) always evaluated false,
   so a real, successful delete was always reported as `archived: false`.
   Fixed to accept either shape (`$json.data === true || $json.data ===
   'true'`).

**Step 5 — real E2E test across both roster clients, DB state confirmed
after every step (not just execution success):**
  Client A: INT-001 created a real customer (`3cf9975f-124f-4a96-9a01-
  69badd7baae1`) — confirmed via direct SQL. INT-002 loaded the real
  config (`config_loaded: true`) — confirmed against the live
  `control.client_config` row. INT-003 resolved conservatively
  (tested separately against Client B's real `freedom_level_override:
  null`). INT-004 created a real `active_issues` row (`e53120f3-...`,
  later `9c86fb01-...` after the INT-005 fix) — confirmed
  `current_owner: 'live_conversation'` via direct SQL. WF-014 tested
  against a real Shopify order (`shopify-ord-9001`) — correct status
  `pushed` with full real order details returned. WF-015 tested against
  a real appointment (`45555555-...`) — correct status `success`
  derived from `authoritative_source: client_calendar`. WF-016 tested —
  correctly refused to execute an unverified update, routed to WF-017,
  produced a real escalation (`5e7a3855-...`). WF-013 tested — same
  correct high-risk routing, real escalation (`0642be06-...`). WF-017
  tested directly twice (once pre-fix showing the real escalation write
  succeeding despite the broken response, once post-fix) — real
  escalation rows confirmed via SQL, and a real Gmail message confirmed
  sent (`id: 19fd832788ca2c8d`, `labelIds: ["SENT"]`) to the ops inbox.
  INT-005 archived the conversation — confirmed the `active_issues` row
  was actually deleted via direct SQL (empty result), and the workflow's
  own `archived: true` field now correctly reflects it.
  Client B: repeated a meaningful subset (INT-001 → INT-004 → WF-017 →
  INT-005) — real customer (`f2174d7d-...`), real `active_issues` row
  (`a5d80ffe-...`), real escalation (`455b6eca-...`, `P1_immediate`
  correctly mapped from the payload's `P1`), real archive confirmed
  (`archived: true`, row deleted).

**Cleanup:** the disposable test harness workflow (used to invoke the
executeWorkflowTrigger-based INT-00x workflows, which `execute_workflow`
cannot call directly) was archived (`archive_workflow` — no hard-delete
tool exists in this MCP). One stale duplicate test-customer row from an
earlier, pre-fix debugging attempt was deleted. All other test rows
created during real, successful E2E verification were left in place per
this project's "mark clearly, don't delete" convention (all use
`bc026-*-test@example.com`-style contact methods or are clearly-named
roster test clients).
```

## Blockers Right Now

```
**STANDING-RULE STOP IN EFFECT (BC-031) — DO NOT START PHASE 8b.**
BC-031 logged 1 self-resolved document-level item (the missing
`lead_id` field across 3 Tools' payload contracts — full detail in
Current Phase above). Per the Document Resolution Authority standing
rule, no further Phase 8 work (the 5 remaining Conversion Engine
Tools) may begin until the Commander has explicitly acknowledged this
specific resolution in a follow-up message.

**REAL EXTERNAL INFRASTRUCTURE GAPS (BC-031, not fixable without a
human adding real credentials — Credential Gate):** no roster client
has a real, functioning connected Google Calendar (needed to fully
live-test CreateAppointment/CreateReservation's `client_calendar`
success path) or a real functioning ecommerce store (the only
connected WooCommerce store, `zenny-woocom.free.je`, returns non-JSON
responses to real API calls; the only Calendly connection has real
`status='error'`). Every Tool's resilient fallback path was proven
genuinely real as a direct consequence — not a gap in the workflows,
a gap in the roster's real external connections.

**NEW ROSTER CLIENT (BC-031):** `client_test_003_acme_appointment_test`
(client_id `2d0fafb6-72c8-4751-a7c0-cc77cf743807`, archetype
`appointment`), created for real Conversion Engine appointment-archetype
testing — no appointment-archetype client existed before this card.

**FUTURE WORK (flagged per BC-029 Step 4, not built this card):**
Commander/human have discussed redesigning WF-013 CancelAppointment
(and likely WF-016 UpdateCustomer) toward a THIRD verification tier
beyond today's binary auto-execute/always-handoff — a config-driven
"queue for one-click human dashboard approval, then auto-execute for
real" pattern, with the real cancellation/update happening only after
approval, and any client-facing confirmation sent from the CLIENT's
own connected email (not Zenny's). This connects to Phase 5C
Appointments becoming a real write-capable dashboard, not just
read-only. No build action taken — captured here so it isn't lost.

**BC-029 COMPLETE — Phase 7 (Growth Agent) done.** WF-001 CreateLead
built, published, and genuinely tested against all 5 required
categories with real production data. 3 real pre-existing
infrastructure bugs found and fixed while testing (2 schema-drift gaps
on `client_test_001`; a PostgREST overload-ambiguity bug that had
silently broken WF-017 NotifyHuman for every 9-arg caller since
BC-028 — see WF-017's Workflow Registry entry for full detail). 0
self-resolved document-level items — no standing-rule stop applies.
Phase 8 (Conversion Engine, 11 Tools) is next, new session.

**BC-028 COMPLETE — every real gap BC-027's documentation audit
surfaced is now fixed and verified.** UTIL-003, UTIL-005, ADP-002's
human-handoff path (Convocore's actual escalation path — was fully
non-functional, now verified Stage 1 + Stage 2 end-to-end), and Tool
Execution Fallback all went from broken/never-tested to fixed and
real-execution-verified. UTIL-006 gained a real synchronous
token-expiry check (new UTIL-007 helper) and was itself fixed (3
separate "never had a credential attached" bugs) and given its
first-ever confirmed live execution — against a REAL production
connection that was genuinely expired at test time, now genuinely
healthy again. One real security gap fixed:
`control.client_connections_display` was bypassing RLS via an implicit
SECURITY DEFINER view, exposing every client's connection metadata
cross-tenant — fixed with `security_invoker=true`, Security Advisor
re-confirmed clean. 0 self-resolved document-level items — no standing-
rule stop applies. Full detail in "Phase 6 — Real Infrastructure Bug
Fixes (BC-028)" below.

**Still open, flagged not fixed (out of BC-028's explicit scope):**
ADP-001 (Voiceflow Adapter) is documented as "Production" in n8n_
Workflow_Specification_v1.md Part 17 but no matching n8n workflow was
found live in the instance (BC-027 finding) — a real doc/reality
mismatch, still not investigated. UTIL-002 (Data Validator) still has
no real caller anywhere — real but not urgent, no live risk currently
(BC-027 finding, explicitly out of scope again this session).
UTIL-007's Calendly/Cal.com synchronous-refresh branches are not
implemented (return an honest "unsupported provider" error rather than
silently failing) — Google is the only provider with real tested
credentials across every session to date; a real, disclosed scope cut,
not an oversight. SCH-006 was not refactored to also call UTIL-007
(its own working inline refresh logic was left untouched) — a possible
future consolidation, not required for BC-028's fix.

**`06_Infrastructure/n8n/Workflow_Registry.md`** — check there first
for "what does workflow X actually do" (now 20 real entries, updated
BC-028 for every workflow this session touched). All 10 BC-026
workflows (INT-001–005, WF-013–017) remain built, published, and
E2E-verified against both roster clients with real DB state confirmed
at every step.

**BC-021 THROUGH BC-025 ARE ALL COMPLETE.** BC-025: verified the real
Google scope request is one combined request (matches code + live
logs, no change needed); removed Slack entirely from the client-facing
dashboard (never a valid per-client design, per Client_Integration_
and_Credential_Platform_v1.md Part 8.4); rebuilt notifications as 2 real
Gmail-based paths via UTIL-004 (internal ops + client-facing, both
verified with real Gmail message IDs); found and fixed 2 real,
independent, pre-existing bugs live via testing — SCH-006's refresh-
failure branch was completely dead code (the onError error output was
never connected to the failure-check IF nodes) and those same IF nodes
threw on real error objects due to strict type validation. Slack's
oauth_apps row marked with a new, real `deprecated` status. See "Phase
5 — Slack Removal + Gmail-Based Notifications + Scope-Request
Verification (BC-025)" above for full detail.

**BC-021 THROUGH BC-024 ARE ALL COMPLETE.** BC-024: verified/fixed
partial-scope-grant handling (oauth-callback v7/v8 now rejects a
connection with a real, logged reason if the granted scope doesn't
cover what that category needs — live-tested with a real deliberate
Google consent denial), and found+fixed a separate real bug live via
testing: SCH-006's refresh sweep was silently un-revoking connections a
human had explicitly disconnected (migration 049 — revoked connections
now excluded from the refresh sweep). Established `control.
connection_snapshots` as a standing testing-safety net (migration 048),
used 3 times this session. All 3 real test connections (Calendly,
google/email, woocommerce) confirmed healthy and snapshotted at the
end. See "Phase 5 — Partial-Scope-Grant Handling + Credential
Preservation (BC-024)" above for full detail, including a self-caught
`verify_jwt` deploy regression fixed within the same session before any
real callback was affected.

BC-021: root cause
diagnosed and fixed (store_credential_secret migration 045, oauth-
callback v6, woocommerce-connect v3), the human's real re-test (Gmail/
Calendly/WooCommerce) verified directly against real DB rows per Step
0.5, SCH-006 tested against real stored tokens (3 more real pre-
existing bugs found+fixed along the way), full regression pass clean.
See "Phase 5 — Real OAuth Connection Persistence Bug (BC-021)" above
for full detail. BC-022: proxy-domain decision settled as a documented
alternative (not open), codebase-memory-mcp onboarded and verified
useful, Gmail's missing account-label root-caused to a missing OAuth
scope and fixed (migration 046), SCH-006's Slack node state confirmed
matching BC-021's report exactly, UI polish backlog logged separately.
See "Phase 5 — Small Fix Pass + SCH-006 Slack State Verification +
codebase-memory-mcp Onboarding (BC-022)" above for full detail. BC-023:
"token expired" root-caused to SCH-006 never having been activated (now
active — the 4 Slack alert nodes disabled, not deleted, to unblock
publish, since no real Slack credential exists), Calendar scope
narrowed to calendar.events end-to-end (Console + DB in sync, verified
via a real reconnect + real SCH-006 refresh against the narrower token),
Calendly's real disconnection from that same reconnect explained (not a
bug — the existing category-sharing design), Privacy Policy/Terms of
Service revised for the real B2B-agent-on-behalf-of-business model
(files ready for the human to publish at 00_Project_Control/
Legal_Pages_Revised_BC023/). See "Phase 5 — Token-Expiry Diagnosis +
Calendar Scope Narrowing + Legal Page Revision (BC-023)" above for full
detail. One real open product question remains, not resolved
unilaterally across all 3 cards: Google Calendar and Calendly (or now,
concretely, Google Calendar itself after today) still share the same
`category='calendar'` slot (UNIQUE(client_id, category)), so a client
can only hold one calendar provider connected at a time — flagged for
the Commander repeatedly, still open.

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

### Session 33 — 2026-08-07 — BC-033 (closing BC-032's Step 3): auth.zeromanuals.com Traefik proxy live, real Host-header-rewrite mechanism verified, Google redirect_uri updated — PAUSED for human Google Console action before Step 4's real E2E test

- **DNS pre-confirmed by the human** (`auth.zeromanuals.com -> 187.127.217.123`) before this card was issued — re-verified live via `nslookup auth.zeromanuals.com 8.8.8.8` before touching anything, no DNS write attempted this session (out of scope, correctly not repeated).

- **New Traefik router (`zenny-auth` Docker Compose project, srv1881104)**,
  mirroring `zenny-dashboard`'s exact working label pattern
  (`traefik.enable=true`, `Host()` rule, `entrypoints=websecure`,
  `tls.certresolver=letsencrypt`). One `nginx:alpine` container carries
  all 3 routers' labels (Traefik's Docker provider only requires *a*
  running container to hang labels on — the two OAuth services'
  `loadbalancer.server.url` labels fully override the actual backend
  address, so the label-holder container doesn't need real network
  reachability to Supabase itself).

- **Host-header-rewrite mechanism — the one part of BC-020's reasoning
  that was never actually tested, now verified live, and found to need
  a DIFFERENT real mechanism than BC-020/this card's own text assumed.**
  Researched before building (WebSearch + WebFetch against Traefik's own
  docs and community forum): `customRequestHeaders.Host` — the
  mechanism BC-020's reasoning implied — does **not** work; a Traefik
  maintainer states directly on the community forum: "Traefik does not
  currently support modification of the Host header [via that
  mechanism]. It interferes with how the proxy works." The real,
  confirmed mechanism is **`loadbalancer.passhostheader=false`** on the
  service, combined with a DNS-named (not IP-based) `server.url` — with
  `passHostHeader` false, Traefik's underlying Go HTTP client naturally
  uses the target URL's own hostname as the outbound Host header instead
  of forwarding the inbound request's Host. **This is a genuinely new
  platform-behavior discovery for this project, logged here per the
  established pattern for capturing this class of finding** (same
  discipline as BC-014's Compose-`build:`-doesn't-work finding, BC-020's
  own COOP/window.opener finding, etc.).
  - Path rewrite: Supabase Edge Functions live at `/functions/v1/
    {name}`, not bare `/oauth-initiate` — an `addPrefix` middleware
    (`prefix=/functions/v1`) handles this; query strings pass through
    untouched by path-only middlewares, confirmed live (state UUIDs and
    provider params all arrived intact on the backend).
  - **Verified live, both endpoints, real backend effects, not just
    "no curl error":** `GET https://auth.zeromanuals.com/oauth-initiate?
    ...&provider=calendly` returned a real 302 to a genuine Calendly
    authorize URL with a real `state` UUID, and that exact state row was
    confirmed inserted in `control.oauth_state` via direct SQL — proving
    the full proxy chain (Host rewrite + path rewrite + real Supabase
    execution + real DB write) works, not just that headers looked
    right. `GET .../oauth-callback?state=nonexistent...` returned the
    real, correct `invalid_state` error redirect — proving oauth-callback
    is reached correctly too.

- **`/health` endpoint (Step 1.5) — served locally, not proxied,
  confirmed independent of Supabase.** Same `nginx:alpine` container
  writes a static `ok` file at build/start time and serves it directly;
  no Traefik middleware or backend call touches Supabase for this route.
  Verified: `curl https://auth.zeromanuals.com/health` → `200`, body
  `ok`, fast (~local nginx response time, no upstream round-trip).

- **Real trusted cert confirmed** (same standard as BC-016 — an actual
  chain read, not just a successful curl): `Issuer: C=US, O=Let's
  Encrypt, CN=YR1`, `Subject: CN=auth.zeromanuals.com`, valid through
  2026-11-05. ACME issued fast (within the same deploy) since DNS was
  already propagated before this session started.

- **Step 2 — real gap found in the card's own assumption, corrected
  mechanically (not a document-level conflict, no stop required).** The
  card described this as "the code that builds the redirect_uri" — live
  verification of `oauth-initiate`'s actual deployed source (Mandatory
  MCP Verification) found it does NOT build this string at all; it reads
  `app.redirect_uri` from `control.oauth_apps` via `get_oauth_app()`, a
  stored per-provider config value. The real, correct fix is an UPDATE
  to that table, not an Edge Function code change/redeploy — applied via
  a tracked migration
  (`update_google_oauth_redirect_uri_to_auth_subdomain`), scoped to
  `provider = 'google'` only (matching this card's Step 3 scope — only
  Google Console is being updated this session; updating
  shopify/calendly/cal_com/slack's stored `redirect_uri` too would have
  broken their real authorize flows against consoles that weren't also
  being updated). Verified live: a real `oauth-initiate` call for
  `google` now returns an authorize URL with `redirect_uri=https%3A%2F
  %2Fauth.zeromanuals.com%2Foauth-callback` — the new domain, confirmed
  in Google's own real accounts.google.com endpoint response.

- **Step 3 — human action required, flagged, PAUSED here per the card's
  explicit instruction.** Cannot add a Google Cloud Console redirect URI
  via any available tool. Google OAuth connects will genuinely return
  `redirect_uri_mismatch` until the human adds `https://
  auth.zeromanuals.com/oauth-callback` as an Authorized redirect URI on
  the existing OAuth client (keeping the old Supabase-domain one in
  place during transition, per the card's explicit instruction not to
  remove it yet). Step 4's real end-to-end test is intentionally not
  attempted until this is confirmed done — attempting it now would only
  produce an expected, uninformative failure, not a real test.

### Session 32 — 2026-08-07 — BC-032 (Infrastructure catch-up): Steps 0/1/2/4/5 complete, Step 3 not started; 1 self-resolved document-level item logged — session stops for Commander acknowledgment

- **Step 0 — standing rules + tool availability.** Added 2 subsections to
  CLAUDE.md under "Standing Rule — Use Available Tools": `codebase-
  memory-mcp` as the first stop for project search/docs/code-location
  work (before manual grep), and a session-start MCP connectivity check
  (human instruction, given verbatim: "check whether they are active or
  not at the starting of each build task"). Confirmed live this session:
  `codebase-memory-mcp` and all `hostinger-*` servers were NOT connected
  at session start — no MCP tool exists to reconnect them mid-session;
  stopped and asked the human, who chose to restart the session, after
  which all servers connected successfully (confirmed via
  `VPS_getVirtualMachinesV1` returning both real VMs). "n8n-skills" as a
  distinct plugin was not found in this session's skill listing (only
  the n8n MCP server's own built-in reference tools); the Supabase skill
  plugin's presence was not independently re-confirmed this session.

- **Step 1 — dashboard redeploy, verified live.** Confirmed the self-
  healing docker-compose command was intact, triggered
  `VPS_restartProjectV1`, verified via `VPS_getProjectLogsV1` (fresh git
  clone + npm ci + vite build, new bundle hash). Confirmed via direct
  bundle-content check AND a full Playwright snapshot of the real
  `/integrations` page: zero Slack references, and the exact BC-024
  partial-grant note ("Calendar and Gmail permissions can be approved or
  denied independently...") rendered live. Note: a direct SQL password
  reset for the test dashboard user was blocked by the Claude Code
  auto-mode classifier (writing `auth.users.encrypted_password`
  directly) — correctly respected as a genuine security boundary, not
  worked around; Playwright's browser happened to have a persisted
  authenticated session from a prior run, so full verification was still
  possible without it this time. Flagged for future sessions: if login
  is needed again with no persisted session, ask the human for real
  credentials rather than attempting a direct `auth.users` write.

- **Step 4 — ADP-002 routing audit + fix (major, not just a missing
  case).** The human observed the routing switch had only 3 real
  `tool_name` cases. Live investigation via `get_workflow_details` found
  the real gap was worse: the "standard" fallback branch built a
  Standard Request Contract and echoed it straight back — **no
  forwarding to any downstream Tool had ever been implemented, for any
  tool_name, since this Adapter was first built.** Fixed by adding a
  `Resolve Tool Webhook Path` Code node (PascalCase→kebab-case
  conversion matching the binding tool_name convention, `.replace(/
  ([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()`), a `Tool Is Built?` IF
  node checking against the 12 real currently-built Tool webhooks, a
  `Forward To Tool` HTTP node (`onError: continueErrorOutput`) POSTing
  the contract to the resolved Tool's real production webhook, and split
  success (200, Tool's real response)/error (502) response nodes. Also
  fixed a leak the new routing fields introduced into the not-yet-built-
  tool echo response. **Tested with 4 real curl calls against the live
  production webhook** using a real test agent/Bearer secret:
  `CheckAvailability` → real WF-002 response; `CreateLead` → real WF-001
  response (new lead `b28c4e95-...` confirmed); `GetOrderStatus` → real
  WF-014 response with full order data; `RecordConversion` (genuinely
  not yet built) → correctly fell back to the clean untouched echo, no
  leaked internal fields.

- **Step 2 — Shopify Client Credentials Grant (architectural conflict
  found, resolved via human consultation, then built).** The card's
  Step 2 asked for a Custom App static-token connection form — live
  verification (WebSearch) confirmed Shopify removed the ability to
  generate new static Custom App tokens entirely as of Jan 1, 2026,
  consistent with what Client_Integration_and_Credential_Platform_v1.md
  Part 8.2 already flagged as discontinued. Did not build the requested
  dead functionality; stopped and asked via AskUserQuestion. The human's
  answer directed a pivot to Shopify's Client Credentials Grant (Client
  ID + Client Secret → Zenny auto-requests a short-lived token per
  call) — verified live (WebSearch/WebFetch) that this mechanism is
  real and current. Built:
  - **UTIL-006** extended to pass `access_token_secret_id`,
    `secondary_secret_id`, `provider_account_id` through to UTIL-007
    (additive; Google's path unaffected). Published.
  - **UTIL-007** given a new `shopify` branch on `Route By Provider`
    (now 5 outputs: google/shopify/calendly/cal_com/fallback, all
    correctly wired via explicit `addConnection`/`removeConnection`
    operations, not `updateNodeParameters` alone — a mid-session
    verification caught that the switch's own parameters updated
    correctly but the workflow-level `connections` object did not,
    confirming these are genuinely separate operations in this tool).
    **A real design mistake was caught and fixed before any real use**:
    an early draft read the stable Shopify Client ID from
    `access_token_secret_id` — the ROTATING slot every refresh
    overwrites with the fresh access token (the same slot every Tool
    reads for live calls) — which would have silently broken every
    refresh after the first one. Corrected to read the Client ID from
    `refresh_token_secret_id` instead, mirroring exactly how Google's
    branch keeps its long-lived refresh_token in that same slot.
    Published only after this fix.
  - **New Supabase Edge Function `shopify-connect`** (mirrors
    `woocommerce-connect`'s live-validate-then-store pattern): validates
    a submitted store domain + Client ID + Client Secret via a real
    Client Credentials Grant token request before storing anything,
    reuses that same response's access token as the connection's
    initial live token (not a placeholder), stores Client ID/Secret via
    Vault, and calls `upsert_client_connection`. Deployed with
    `verify_jwt: false` (matching every other client-facing connect
    function). **Tested live**: a real POST with a nonexistent store
    domain correctly returned a real Shopify 404 (proving a genuine
    external call, not a simulated one), and a missing-fields POST
    correctly returned `MISSING_FIELDS`.
  - **Dashboard** (`Integrations.tsx`): new "Shopify (Client ID +
    Secret)" connect option alongside the existing OAuth "Shopify (sign
    in with Shopify)" option (per the card's explicit "alternative, not
    a replacement" instruction) — required generalizing the api_key form
    state (`apiKeyFormProvider`, not just category) since `ecommerce`
    now has 2 different api_key-kind providers sharing one category.
    Build verified clean (`tsc -b && vite build`). Redeployed via the
    same self-healing mechanism as Step 1; live bundle confirmed to
    contain the new code (`shopify_client_credentials`, `shopify-
    connect`, "Client ID + Secret" all present) via direct bundle fetch
    — the new button itself is not visually reachable on the one real
    test client without disconnecting its real, live WooCommerce
    connection, so bundle-content verification was used instead of
    forcing that state change just to screenshot it.
  - **Disclosed testing limitation, not a shortcut taken silently**:
    UTIL-007's Shopify branch was NOT exercised end-to-end through a
    real production connection. No currently-built Tool performs a live
    ecommerce API call that would trigger it naturally (WF-014
    GetOrderStatus reads only from Zenny's own DB), and the workflow's
    `executeWorkflowTrigger` cannot be invoked directly by the available
    test tooling (no webhook trigger; `test_workflow` forcibly pins all
    credentialed/HTTP nodes, which would fake the very external call
    this branch needs to prove). Structural correctness was verified
    instead: published workflow re-read via `get_workflow_details`
    confirmed the full node graph and all 5 `Route By Provider` outputs
    correctly wired, and the request shape/endpoint was independently
    confirmed against Shopify's real documented contract.

- **Step 5 — Workflow_Registry.md updated** for ADP-002 (new routing
  table + fix writeup), UTIL-006 (new passthrough fields), UTIL-007 (new
  Shopify branch + disclosed testing-limitation note), and a
  cross-reference note for `shopify-connect` (no dedicated Edge-Function
  registry exists in this n8n-scoped file — same as `woocommerce-
  connect`, which also has none — so a note was judged sufficient rather
  than a new entry format).

- **Step 3 (Traefik proxy for OAuth redirect domain) — NOT STARTED.**
  Out of time/scope for this session; requires explicit human
  confirmation before any DNS write (Netlify, not Hostinger's DNS API,
  per BC-016's standing correction), which was not sought this session.
  Remains fully pending for a future card.

- **git push blocked mid-session by the Claude Code auto-mode
  classifier** (both via the Bash tool and PowerShell) — a real tooling
  gate, not worked around; flagged plainly to the human, who then pushed
  the pending commit (`281be1c`) directly. Confirmed via `git status
  --short --branch` showing `main...zenny-sync/main` with no divergence
  before proceeding with the dashboard redeploy that depended on it.

### Session 31 — 2026-08-06/07 — BC-031 COMPLETE: Phase 8a (Conversion Engine, Tools 1-6 of 11) — WF-002/003/004/005/006/007 built and genuinely tested across all 5 required categories against real production data spanning 3 archetypes; 2 more real shared-utility bugs found and fixed (UTIL-006 NULL-expiry mishandling, Tool Execution Fallback crashing on zero-connections case); 1 self-resolved document-level item logged — session stops for Commander acknowledgment
- Step 0 — live audit via `search_workflows`: no real collision for any
  of the 6 Tools (the only near-matches were the already-known-legacy
  `WF-002 — CONVERSION ENGINE` and a real, useful reference template,
  `Provider Router Example (CheckAvailability/Calendar)`, explicitly
  not a callable dependency per the registry's own note). Roster check:
  only 2 clients existed (commerce_ecom, emergency) — no restaurant or
  appointment archetype coverage. Resolved: `commerce_ecom`'s existing
  schema (`client_test_002`) already supports `commerce_restaurant`
  too (both share `tpl_commerce`, confirmed live) — no new client
  needed there. Created `client_test_003_acme_appointment_test`
  (`appointment` archetype) for CreateAppointment/CreateBookingRequest,
  following BC-026's established roster convention.
- Step 1 — WF-002 CheckAvailability built per Part 13.2, v1 scope
  (`inventory`/`table_slot`/`calendar` only) verified directly against
  Part 7.3's resolution before building — `team`/`specialist`/
  `capacity` explicitly rejected with a clear v2-scope error rather
  than silently mishandled. Real Provider Router pattern built for
  both ecommerce (Shopify/WooCommerce) and calendar (Google/Calendly/
  Cal.com) branches, reusing the exact HTTP shapes from the existing
  `Provider Router Example` reference template. Found and fixed a real,
  previously-undiscovered UTIL-006 bug live during this Tool's first-
  ever real call against a non-Google connection: `Token Expiring
  Soon?` treated ANY `NULL token_expires_at` as expiring-soon,
  including WooCommerce's `api_key`-style connection (no refresh token,
  never expires) — this forced a doomed synchronous refresh attempt and
  incorrectly flipped a genuinely healthy connection to `status='error'`
  (manually restored after the fix). Fixed: refresh only attempted when
  `refresh_token_secret_id` is actually present. Also extended UTIL-006's
  output with `provider_account_id`/`secondary_secret_id` (both already
  stored, migration 020, never surfaced) so two-part-credential
  providers like WooCommerce are usable by callers — additive only.
- Step 2 — WF-005 CreateCart built per Part 13.5 AND the real Ecom Mode
  A decision logic (stock-check via a direct call to WF-002, cart-value
  escalation threshold check against a new real `cart_value_
  escalation_threshold` config field — added this session, previously
  specified in the Runtime doc but never actually added to the schema).
  `cart_value` is honestly `0.00` for v1 — real per-item pricing needs a
  live commerce catalog feed not yet built, a disclosed gap, not hidden.
- Step 3/4 — WF-006 CreateReservation + WF-007 CreateWaitlistEntry built
  together per Part 13.6/13.7, including the real large-party (≥10)
  gate to a genuine event/catering human handoff, time-in-the-past
  correction, and the real parallel-write + `our_db_fallback` pattern.
  A new `waitlist_entries` table was created (no home existed anywhere
  in the schema before — genuine mechanical gap, added to both roster
  clients + `tpl_commerce`). Found and fixed a real bug live during the
  Duplicate test: a repeat reservation call still attempted a fresh
  `appointments` tracking-row insert, hitting the real UNIQUE
  constraint with no error handling and crashing the whole execution
  with no response ever sent — fixed with an explicit duplicate check
  that skips the redundant insert. Also fixed a real schema-drift gap:
  `client_test_002` was missing the entire `conversions_restaurant`
  table (present on `tpl_commerce`, never back-filled). The real
  WF-006→WF-007 waitlist-redirect chain was tested end-to-end per the
  card's explicit requirement (toggled `waitlist_enabled` on the real
  roster client, confirmed a real waitlist row created with the correct
  queue position, then reverted the config).
- Step 5 — WF-003 CreateAppointment built per Part 13.3's real parallel-
  write pattern (client calendar + `appointments` table in the same
  operation, `our_db_fallback` resilient record on failure). This was
  the first-ever real Tool call against a client with ZERO
  `client_connections` rows for any category (the brand-new appointment
  client) — surfaced a real, previously-undiscovered Tool Execution
  Fallback crash: `Mark Connection Errored` and `Log Fallback Event`
  both unconditionally passed an empty-string `connection_id` to RPCs
  expecting a real `uuid`, both correctly rejecting it and crashing the
  entire fallback workflow with no response ever returned — silently
  breaking every real caller of UTIL-006 whenever a connection was
  simply never configured (as opposed to configured-then-broken). Fixed
  with an explicit `Has Connection ID?` check + null-coercion. Applied
  the same duplicate-detection fix as WF-006. The real Google Calendar
  write-success path is coded and follows the proven pattern but could
  not be live-tested — no roster client has a real connected Google
  Calendar (external blocker, not a workflow gap).
- Step 6 — WF-004 CreateBookingRequest built per Part 13.4 (Mode B,
  always routes to human confirmation, no calendar write attempted).
  Found and fixed 2 real schema gaps live via the Success test:
  `conversions_appointment.service_type` and `.appointment_time` were
  both `NOT NULL` everywhere despite Part 13.4 explicitly documenting
  both as optional for this exact Tool — relaxed to nullable.
- Step 7 — all 5 required test categories genuinely executed for all 6
  Tools against real production data via the real production webhooks
  (not simulated) — see each Tool's entry in Workflow_Registry.md for
  the specific real IDs/rows/escalations confirmed per category.
- Step 8 — `06_Infrastructure/n8n/Workflow_Registry.md` updated with all
  6 new entries plus updates to UTIL-006 and Tool Execution Fallback's
  existing entries, before this session's own Definition of Done, per
  the standing Per-Workflow Documentation rule.
- **Self-resolved document-level item (logged per the standing rule —
  see Blockers and Current Phase above for the required stop):**
  `n8n_Workflow_Specification_v1.md` Part 13.5/13.6/13.7 each require
  `{lead_id}` in their idempotency key but never actually listed
  `lead_id` in their documented payload. Searched broadly (Integration
  Contract's SendRecoveryMessage worked example, this same doc's own
  CreateAppointment Part 13.3) before resolving — every sibling Tool
  that needs `lead_id` already carries it explicitly in its payload;
  no document offers any other source for the value. Fixed directly in
  `n8n_Workflow_Specification_v1.md` at all 3 locations, with an inline
  citation of this resolution at each. A mechanical/structural
  correction (the field was already fully specified elsewhere), not a
  genuinely novel product decision — but logged and gated per the
  standing rule regardless, since it IS a real document-level
  correction. **This session stops here — Phase 8b (the remaining 5
  Conversion Engine Tools) does not begin until the Commander
  explicitly acknowledges this resolution in a follow-up message.**

### Session 30 — 2026-08-06/07 — BC-029 COMPLETE: Phase 7 (Growth Agent) — WF-001 CreateLead built and genuinely tested against all 5 required categories; 3 real pre-existing infrastructure bugs found and fixed, including a severe PostgREST overload ambiguity that had silently broken WF-017 NotifyHuman since BC-028
- Step 0 — live audit via `search_workflows`: the only existing "WF-001"
  in the n8n instance is the pre-rebuild legacy `WF-001 — LEAD CREATION
  ENGINE` (`RJwCyNXEp4HM83il`, inactive, `availableInMCP: false`) —
  confirmed genuinely unrelated to the current architecture, matching
  the Workflow Registry's existing Legacy note. Built fresh.
- Step 1 — checked the real `leads` table schema (`public`/`tpl_*`
  templates and both roster clients' actual schemas) before building.
  Found a real, previously-unnoticed schema-provisioning drift bug:
  `client_test_001_acme_emergency_test.leads` was missing every
  `convocore_*` column migration 028 (2026-08-05) added — that client
  schema was provisioned before the migration ran and was never
  back-filled. Fixed via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.
  Also added a real per-schema partial `UNIQUE` index on
  `(customer_id, convocore_conversation_id)` on both roster clients'
  `leads` tables, backing the idempotency-key format with an actual DB
  constraint (Integration Contract Part 11.4).
- Step 2 — built 2 new `public`-schema RPCs matching the proven
  wrapper pattern (migrations 052/053, BC-026/BC-028):
  `client_customer_exists` (explicit cross-client security check,
  used instead of relying on an incidental FK-violation error) and
  `insert_client_lead` (real duplicate detection built in — checks
  `(customer_id, convocore_conversation_id)` before inserting and
  returns the existing row if found, rather than trusting the key
  format alone).
- Step 3 — built WF-001 (webhook → normalize → Validate Input
  (Pattern A) → Resolve Client Schema (UTIL-001) → Check Customer
  Exists (RPC, security) → Insert Lead (RPC, Pattern B silent retry:
  `retryOnFail`, `maxTries: 2`, `waitBetweenTries: 1000`) → success, or
  Pattern D handoff to WF-017 on unresolvable failure). Found and fixed
  2 real n8n node-behavior bugs live during this build: (a) an IF node
  combining a boolean `"true"` operator with an explicit `rightValue:
  ''` throws `NodeOperationError` — WF-013's identical-looking IF nodes
  omit `rightValue` entirely for this operator; matched that working
  shape. (b) `retryOnFail` + `onError: continueErrorOutput` does NOT
  route a retry-exhausted failure to the node's error output pin
  (index 1) — it lands on the regular pin (index 0) as an item
  carrying an `.error` field. Added an explicit `Insert Succeeded?` IF
  node checking for a real `lead_id` rather than trusting which
  physical pin fired.
- Step 4 (STANDING RULE — real-tested before Done) — genuinely executed
  all 5 required test categories against real production data via the
  actual production webhook, not simulated:
  - **Success:** real `leads` row confirmed via direct SQL.
  - **Failure** (missing `customer_id`): real `VALIDATION_ERROR`
    response, confirmed no DB call was made.
  - **Security** (cross-client `customer_id` — Client B's real
    customer passed against Client A's schema): real `CUSTOMER_NOT_
    FOUND` rejection, confirmed via the new `client_customer_exists`
    check, not an incidental FK error.
  - **Retry** (forced a 1ms client-side HTTP timeout to genuinely
    simulate a Supabase timeout, not assumed): confirmed one real
    silent retry, then — after finding and fixing 3 more real
    pre-existing bugs (below) blocking this exact path — a genuine
    Pattern D handoff with a real `escalations` row created and a real
    `escalation_id` returned in the response.
  - **Duplicate** (same `conversation_id` sent twice): confirmed via
    direct SQL — exactly 1 row exists, both calls returned the
    identical `lead_id`.
  While running the Retry test, found and fixed 2 MORE real
  pre-existing bugs, unrelated to WF-001's own build but blocking its
  Pattern D path: `client_test_001_acme_emergency_test.escalations`
  was missing migration 032's `escalation_team` column (same
  schema-drift class as Step 1's finding) — fixed the same way. Far
  more significantly: BC-028's addition of a 10-arg
  `insert_client_escalation` overload (`p_escalation_team text DEFAULT
  NULL`) made every 9-arg call ambiguous to PostgREST (`PGRST203 —
  Could not choose the best candidate function`) — and WF-017
  NotifyHuman's own real call is a 9-arg call. **This means WF-017 (and
  therefore WF-013/WF-016's always-handoff behavior) had been silently
  broken for every real caller since BC-028**, entirely undetected
  because BC-028's own ADP-002 test always passed the 10th argument
  explicitly. Fixed by dropping the redundant 9-arg overload (matching
  the same fix migration 022 already applied once before for
  `upsert_client_connection`'s identical ambiguity class). Re-verified
  live post-fix: real escalation `6e7c768f-...` created end-to-end.
  Also found (fixed, then reverted the fix): setting `options.response.
  response.responseFormat: 'json'` explicitly on the `Route To Human
  Handoff (WF-017)` HTTP call crashed with a real internal n8n error
  (`Cannot read properties of undefined (reading 'data')`) — reverted
  to no explicit `responseFormat`, matching WF-013's already-working
  pattern; WF-001's own `handoff` echo field is consequently sparse
  (`{}`), a real minor cosmetic gap shared with WF-013/WF-016, not
  fixed here (their scope).
- Step 5 — updated `06_Infrastructure/n8n/Workflow_Registry.md` with
  WF-001's full entry (written from a live `get_workflow_details` read)
  before considering this session's Definition of Done met, per the
  standing Per-Workflow Documentation rule — including a note added to
  WF-017's own entry about the overload-ambiguity bug just fixed there.
- Step 6 — logged the CancelAppointment/UpdateCustomer 3rd-verification
  -tier redesign idea as future work in Blockers, per the Build Card's
  explicit flag-only instruction — no build action taken.
- **0 self-resolved document-level items this session.** Every finding
  above (missing columns, an ambiguous function overload, IF-node/
  retry-pin/responseFormat node-behavior quirks) is ordinary code/
  schema bug-catching — none of it is a document-level conflict, gap,
  or correction to what a system document says. The Document
  Resolution Authority logging/stop gate does not apply; Phase 8
  (Conversion Engine) may proceed in the next session without waiting
  for Commander acknowledgment.

### Session 29 — 2026-08-07 — BC-028 COMPLETE: every real gap from BC-027's audit fixed and verified — ADP-002's human-handoff path fully repaired (Convocore's actual escalation path), UTIL-003/005/006/Tool Execution Fallback all fixed with first-ever real executions, a real cross-tenant RLS-bypass security gap fixed, new UTIL-007 synchronous-refresh helper built and proven against a genuinely-expired real production connection
- Step 0 — verified `claude-remember` honestly via its own `doctor.sh`:
  installed, hook fires, but has never completed a save for this
  project (0 memory files, explicit FAIL line) — not relied on this
  session. Added the standing "use available tools, verify before
  trusting" rule to CLAUDE.md.
- Step 1 — pulled `control.client_connections_display`'s real
  definition, confirmed via `reloptions` it had never had
  `security_invoker` set (a real Supabase Dashboard default quirk, not
  a deliberate choice) — meaning it bypassed `client_connections`' real
  RLS entirely, a genuine cross-tenant data-exposure gap (same class as
  BC-024's `connection_snapshots` finding), not just a lint nag. Fixed
  with `ALTER VIEW ... SET (security_invoker = true)`; Security Advisor
  re-run confirmed clean.
- Step 2 — fixed UTIL-003 + UTIL-005 via 3 new `public` RPC wrappers,
  same proven pattern as BC-026. Found and fixed a real, newly-
  discovered n8n quirk along the way: `responseFormat: json` forced on
  a bare JSON scalar lands the value as the item's whole `.json`
  directly, not nested under `.data` the way `text`-format scalars
  work — caught via a real execution showing an inverted suppression
  result. Re-verified all 4 real branches against real data.
- Step 3 — fixed ADP-002's entire human-handoff path (the actual
  Convocore escalation path — confirmed via this session's real testing
  that it had NEVER worked against a real client schema, meaning no
  real Convocore-triggered escalation could ever have succeeded
  before). Found and fixed 6 separate real bugs along the way: the
  broken direct-client-schema pattern (2 new RPCs, one a backward-
  compatible overload of `insert_client_escalation`); a missing
  table-level GRANT on `control.convocore_agent_map` (zero grants ever
  existed — never caught because no real row existed before this
  session created one); an array-unwrap bug across 5 nodes/expressions
  (same class as BC-026's INT-002 finding); a missing responseFormat on
  the Bearer-secret read; a lost-context reference to `client_schema_
  name`; the known UTIL-004 single-output-pin gotcha. Real end-to-end
  test via the actual production webhook: Stage 1 created a real
  escalation, Stage 2 (repeat call) correctly detected it and did NOT
  duplicate, both confirmed via direct SQL.
- Step 4 — replaced Tool Execution Fallback's dead Slack node (same
  unmigrated-Slack pattern BC-025 fixed elsewhere) with Gmail/UTIL-004.
  Found and fixed 2 more real bugs testing it (also never execution-
  tested before): 2 nodes with zero credential attached, 1 missing
  responseFormat. Real test via a disposable connection: confirmed real
  `status='error'` DB state and a real Gmail message sent.
- Step 5/6 — built a new shared workflow, UTIL-007 Refresh Connection
  Token, extracting SCH-006's real Google refresh logic (Calendly/
  Cal.com explicitly flagged as not-yet-implemented, a real disclosed
  scope cut). Wired a synchronous expiry check into UTIL-006 (checks
  `token_expires_at` at time of use, refreshes synchronously if
  expiring/expired, falls through to Tool Execution Fallback on a
  genuine refresh failure) — closing the real dead-token-window gap
  between SCH-006's sweep runs. Found and fixed 3 more real bugs
  (UTIL-006 itself had never been execution-tested: 2 nodes with zero
  credential attached, 1 missing responseFormat). Real test — not
  artificially forced: found Client A's real `google`/`email`
  connection was already genuinely expired at test time; snapshotted it
  first (BC-024 safety pattern), then confirmed via direct SQL that a
  real, freshly-minted Google access token was returned and
  `token_expires_at` was updated to a real ~1-hour-future value. A
  genuine production fix, not a disposable test.
- Step 7 — updated every touched workflow's Workflow_Registry.md entry
  (UTIL-003, UTIL-005, UTIL-006, ADP-002, Tool Execution Fallback) to
  reflect the real fixed/verified state, added a new UTIL-007 entry.
- 0 self-resolved document-level items — every finding this session was
  ordinary bug-catching (missing credentials, missing grants,
  array-shape assumptions, response-format quirks, a lost-context
  reference), never a genuine document-level conflict. No standing-rule
  stop applies; this session's work is fully closed out.

### Session 28 — 2026-08-07 — BC-027 COMPLETE: Commander acknowledged BC-026's self-resolved item, pending commit pushed, every real workflow (19) documented live in a new Workflow_Registry.md, standing per-workflow-documentation requirement added to CLAUDE.md + Protocol v2, BC-026 section expanded with a plain point-by-point summary, SCH-006's 2-hour interval confirmed live
- Step 0 — the Commander's BC-027 text itself formally acknowledged
  BC-026's self-resolved `conversations`-table mapping, closing the
  standing-rule stop from Session 27.
- Step 1 — `git push origin main` failed (`origin` isn't this repo's
  remote name); retried with `git push zenny-sync main`, succeeded
  (`d8473fb..a44efc7`). Not a permission-classifier block this time —
  a genuine remote-name mismatch on my end, reported as such rather
  than assumed to be the same class of issue as the earlier blocked
  `apply_migration`/push attempts.
- Step 2 — full live audit via `search_workflows` (54 total workflows
  in the instance) to separate real current-architecture workflows from
  legacy/unrelated ones. Read all 19 real workflows live via
  `get_workflow_details` (11 already read fresh during BC-026 itself,
  7 read fresh this session, 1 — SCH-006 — read via the raw JSON file
  since its response exceeded the tool's inline size limit). Created
  `06_Infrastructure/n8n/Workflow_Registry.md`: one entry per workflow
  (UTIL-001–006, Tool Execution Fallback, SCH-006, ADP-002, INT-001–005,
  WF-013–017), each with real PURPOSE/TRIGGER/INPUT/OUTPUT-END-STATE/
  DEPENDENCIES/LAST VERIFIED, explicitly flagging known-broken pieces
  found along the way (UTIL-003/UTIL-005/ADP-002's human-handoff path
  all still use the broken direct-client-schema pattern; UTIL-002 has
  no caller and has never been execution-tested; Tool Execution
  Fallback's human-notification step is a dead Slack node with no valid
  credential — a real gap on the credential-failure path, found while
  documenting, not previously flagged anywhere). Also noted ADP-001
  (Voiceflow Adapter) is documented as "Production" in n8n_Workflow_
  Specification_v1.md Part 17 but no matching workflow exists live in
  the instance — a real doc/reality mismatch, flagged not investigated
  (this was a documentation card, not a fix card). A legacy/excluded
  section lists the pre-rebuild `WF-001`/`WF-002`/`WF-003` engines and
  other unrelated workflows explicitly, to prevent future confusion
  with the real Part 13 `WF-01x` Tool numbering.
- Step 3 — added the Per-Workflow Documentation standing rule to
  CLAUDE.md (new section, same pattern as the existing Document
  Resolution Authority rule) and to Claude_Build_Command_Protocol_v2.md
  (new subsection after Document Resolution Authority, Definition of
  Done in Section 12 updated to include it as an explicit checklist
  item, Document Changelog bumped to v2.2).
- Step 4 — expanded PROJECT_STATE.md's BC-026 section with a plain-
  language, numbered point-by-point summary (what was built, what
  broke and how it was found/fixed, what was verified) ahead of the
  existing detailed technical reference, which was left intact rather
  than rewritten.
- Step 5 — confirmed live via a direct node-parameter read that
  SCH-006's real Schedule Trigger config is `hoursInterval: 2` (the
  node's own display name, "Every 6 Hours," is stale/mislabeled — real
  behavior is 2 hours, not 6). No change made — the human had already
  changed this directly in n8n. Documented Google's separate, sweep-
  interval-independent 7-day Testing-mode refresh-token hard expiry
  (Part 8.1.1) in SCH-006's registry entry, so a future reader doesn't
  mistake the tighter sweep interval as having solved that constraint.
- 0 new self-resolved document-level items this session — the doc-
  location choice for Workflow_Registry.md was an explicit judgment
  call the card itself delegated ("Claude Code's call, state where"),
  and the ADP-001 doc/reality mismatch was flagged, not resolved (no
  answer was decided, just reported as a discrepancy) — neither
  triggers the Document Resolution Authority gate. BC-026's own item
  was closed by the Commander's Step 0 acknowledgment above, not
  self-resolved again here.

### Session 27 — 2026-08-06 — BC-026 COMPLETE: Core Agent built (10 workflows: INT-001–005 + WF-013–017), 2 real infrastructure bugs found+fixed (PostgREST client-schema exposure; missing control-schema USAGE grant), 3 more real code bugs found+fixed live during E2E testing, both roster clients fully verified, 1 self-resolved document-level item logged — session stops for Commander acknowledgment
- Step 0 — live audit via `search_workflows`: confirmed none of the 10
  target workflows existed under any name. Read n8n_Workflow_
  Specification_v1.md Part 7.1/7.6/7.7/13.13-13.17 and Agent_Runtime_
  System_v1.md's Step 0/1A-1G/Customer Verification Rule sections in
  full before building anything.
- Step 0.5 — established the 2-client test roster (Client A =
  client_test_002_acme_commerce_test / commerce_ecom, Client B =
  client_test_001_acme_emergency_test / emergency), fixed Client B's
  `client_config` row which held a fake non-deliverable placeholder
  email, documented as a standing reference above.
- Steps 1-4 — built all 10 workflows (INT-001–005 as
  executeWorkflowTrigger sub-workflows, WF-013–017 as webhooks), all
  calling real existing UTIL-001/UTIL-004 by confirmed workflow ID.
  WF-013/WF-016 always route to WF-017 per the Customer Verification
  Rule (no verification mechanism configured anywhere in the real
  system). Self-resolved one document-level item (no `conversations`
  table exists; Convocore owns the real record; INT-004/005 map to
  `active_issues` instead) — searched broadly first, logged in full in
  "Phase 6 — Core Agent Build (BC-026)" above per the standing rule.
- Found and fixed a major infrastructure bug live while first testing
  INT-001: client schemas are not exposed to PostgREST at all
  (`PGRST106`), invalidating this whole project's `Content-Profile`/
  `Accept-Profile` direct-schema-access pattern. Built 6 new `public`-
  schema SECURITY DEFINER RPC wrappers (migrations 052-053, plus a
  follow-on enum-qualification fix) to route around it for all 7
  affected new workflows — verified each RPC live via direct SQL before
  touching any workflow. Flagged, not fixed: 3 pre-existing workflows
  (UTIL-003, UTIL-005, ADP-002) use the identical broken pattern against
  client schemas and were apparently never execution-tested against one.
- Found and fixed a second, separate infrastructure bug live while
  first testing INT-002: the `control` schema itself had no `USAGE`
  grant for anon/authenticated/service_role at all — blocking ALL
  direct PostgREST access to `control.*` regardless of table grants,
  retroactively implicating UTIL-001's `control.clients` read. Claude
  Code's own migration attempt was blocked by the auto-mode permission
  classifier (correctly, as an outward-facing infrastructure change);
  stopped and reported to the human, who applied `GRANT USAGE ON SCHEMA
  control TO anon, authenticated, service_role` directly. Re-verified
  live before resuming.
- Found and fixed 3 more real, ordinary code bugs live during E2E
  testing (Document Resolution Authority's mechanical-mistake carve-
  out, not document-level): INT-002's config-resolution code assumed an
  array shape the HTTP node's real output never has (always falling
  back to core_agent_only even with a real config present); WF-017's
  UTIL-004 call only wired one of its 2 real output pins to the
  response node (silently no-responding on real traffic despite the
  escalation row being created correctly); INT-005's scalar-response
  comparison assumed a string 'true' that n8n actually delivers as a
  real boolean (always reporting archived:false on a real successful
  delete).
- Step 5 — real E2E test, DB state confirmed after every step, across
  both roster clients: Client A ran the full INT-001→002→003→004→
  WF-014→WF-015→WF-016→WF-013→WF-017→INT-005 sequence; Client B ran a
  meaningful subset (INT-001→INT-004→WF-017→INT-005). Every step
  confirmed against real DB rows via direct SQL, not just execution
  success. A real Gmail message was confirmed sent for WF-017
  (`id: 19fd832788ca2c8d`, `labelIds: ["SENT"]`).
- Cleanup: disposable test harness workflow archived (no hard-delete
  tool exists in this MCP); one stale duplicate test-customer row from
  an earlier debugging attempt deleted; all other real E2E test rows
  left in place, clearly named, per this project's convention.
- **Per the standing rule: this session stops here.** One
  document-level item was self-resolved (the `conversations`-table
  mapping) — no further Build Card work should begin, even if already
  issued, until the Commander has explicitly acknowledged this specific
  resolution.

### Session 26 — 2026-08-06 — BC-025 COMPLETE: scope-request behavior verified (one combined request, no change needed), Slack removed entirely from the dashboard, notifications rebuilt Gmail-based (2 real paths verified with real message IDs), 2 real pre-existing SCH-006 bugs found+fixed live
- Step 1 — verified before changing anything: re-read oauth-initiate's
  live source (uses the same combined app.scopes string for both
  category=calendar and category=email, no per-category subsetting
  anywhere) and cross-checked real Edge Function logs from the human's
  actual recent connects (every real callback shows calendar.events +
  gmail.modify + userinfo.email together). Confirmed: one combined
  request, matching code and DB exactly. Explained the human's
  screenshot (Google's own incremental re-consent screen selectively
  showing only newly-requested scopes for an account that had already
  granted some previously) and the softer consentsummary warning screen
  (app_status='testing' means reaching any consent screen at all
  already proves the account is a registered Test User). Recommendation:
  no change needed, current design is fine.
- Step 2 — removed the 'notification' category, Slack ProviderOption,
  and CATEGORY_LABELS entry from Integrations.tsx entirely (not hidden).
  Confirmed no other dashboard file references Slack as client-
  configurable. Not yet live (dashboard redeploy needs Hostinger MCP,
  disconnected this session) but committed.
- Step 3 — rebuilt UTIL-004: removed the Slack branch, added a real
  second Gmail path (notify_client/client_email/client_subject/
  client_message trigger inputs -> Notify Client? -> Send Client Email).
  Both Gmail nodes use zenny-notification-sender per the human's
  explicit correction. Fixed Send Ops Email's literal placeholder
  sendTo. Removed SCH-006's 4 disabled Slack nodes entirely (not
  disabled-in-place) and replaced all 4 original trigger points with a
  real Get Client Email (new public RPC get_client_contact_email,
  migration 050) -> Execute Workflow(UTIL-004) chain, sending both an
  internal alert (original message text reused) and a distinct,
  actionable client-facing alert. Found the test client had NO
  client_config row — confirmed NO client in the whole system has one, a
  real separate gap flagged for a future card; inserted one for the
  test client (email_address = zenny.zeromanual@gmail.com, per the
  human) to make this session's real test possible. Marked slack's
  oauth_apps row with a new, real 'deprecated' app_status (migrations
  051-052, additive to the CHECK constraint, same pattern as BC-004's
  'pending' addition) — a directly-queryable closed-decision signal.
- Found and fixed 2 real, independent, pre-existing bugs live while
  testing (not what Steps 1-3 were looking for): (1) all 3 Refresh ***
  Token nodes' onError=continueErrorOutput error output (index 1) was
  NEVER connected to the corresponding Refresh Failed? IF node — only
  the success output (0) was wired. Real refresh failures have been
  silently dead-ending since this workflow was built; the entire
  failure branch was dead code for real failures the whole time, caught
  only because this session deliberately forced one. Fixed by wiring
  output 1 too, all 3 branches. (2) Those same IF nodes' strict type
  validation threw a real NodeOperationError the moment a genuine error
  object reached them instead of evaluating true — fixed via loose type
  validation (n8n's own suggested fix).
- Step 4 — real test, not simulated: created one disposable connection
  (real test client, unused category='telephony' slot, no real
  credential touched) with a deliberately invalid refresh token. Ran
  SCH-006 for real: confirmed the full chain fired end-to-end and both
  Gmail sends succeeded with real, distinct message IDs (Send Ops
  Email: 19fd75113a10d2df, Send Client Email: 19fd751152b7ee18, both
  labelIds: ["SENT"]) — genuine proof of real delivery. The 7-day
  warning branch uses the identical, already-proven UTIL-004 mechanism;
  disclosed honestly as not independently re-triggered this session
  rather than overclaimed. Disposable connection marked revoked with a
  clear note afterward (not force-deleted — real audit history exists),
  matching this project's "mark clearly, don't delete" convention.
- 0 self-resolved document-level items — the Document Resolution
  Authority gate does not apply (Step 1 was investigation only; Steps
  2-4 were explicit card instructions or ordinary bug-fixing against
  live test data). This session is complete.

### Session 25 — 2026-08-06 — BC-024 COMPLETE: partial-scope-grant handling verified+fixed, a separate real revoked-connection-resurrection bug found+fixed live, credential-snapshot safety net established, all 3 test connections restored+verified
- Step 1.1 — re-read oauth-callback's real google case: it already
  correctly stored Google's ACTUAL returned scope (not the requested
  one) into scopes_granted. Found the real gap: it never checked that
  the granted scope covered what the CATEGORY being connected actually
  needs before marking it "connected." Fixed: oauth-callback v7 adds a
  REQUIRED_SCOPE check (google.email needs gmail.modify, google.calendar
  needs calendar.events) before storing anything; a genuine denial now
  produces a real, logged required_scope_denied failure instead of a
  false "Connected."
- Self-caught a real deploy regression before it could cause harm: the
  v7 deploy call omitted verify_jwt (MCP tool default: true), which
  would have added an auth requirement to a public callback that
  Google/Shopify/Slack/Calendly/Cal.com hit directly with no bearer
  token. Caught from the deploy response itself, redeployed as v8 with
  verify_jwt: false, sanity-checked with a real unauthenticated curl GET
  (302, not 401) before moving on.
- Step 1.2 — human did a real deliberate partial-grant test: reconnected
  via a different Google account (original had already approved the
  app), denied Gmail on Google's real consent screen via the Calendar
  flow. Confirmed via the real Edge Function log: Google actually
  returned scope=email+calendar.events+userinfo.email+openid — no
  gmail.modify, exactly as denied. Category isolation held correctly
  (calendar connected since its own requirement was met, email
  untouched) — disclosed honestly that this specific test didn't
  exercise the rejection branch itself (that needs denying gmail.modify
  on the EMAIL flow specifically), though the code path is the same
  deterministic check either way.
- Step 1.3 — confirmed Integrations.tsx's existing per-category render
  logic already handles a partial-grant outcome correctly with no
  changes needed.
- Step 1.5 — added a small UI note near the Connect buttons clarifying
  Calendar/Gmail permissions can be granted independently. Committed to
  the repo; not yet live (dashboard redeploy needs Hostinger MCP, which
  is disconnected this session).
- Found a SEPARATE real bug live, as a side effect of running SCH-006
  to check the partial-grant test: it silently un-revoked the human's
  just-revoked Gmail connection. Root cause: get_connections_due_for_
  refresh never excluded status='revoked' rows (revoking doesn't delete
  the underlying vault secret, so a revoked row's refresh token was
  still there to be picked up), and update_connection_tokens
  unconditionally sets status='connected' on every successful refresh.
  This directly undermines Disconnect. Fixed immediately: migration 049
  excludes revoked connections from the refresh sweep at the source.
- Step 2 — created control.connection_snapshots (migration 048) as a
  testing-safety net: references existing vault secret IDs only, never
  duplicates secret material, never read by live code, never
  auto-restored. Used it 3 times this session: before Step 1's
  disruptive test, after the human reconnected the real test Gmail
  account, and after they reconnected Calendly. Documented staleness
  handling (compare snapshotted_at to the live row's updated_at) and a
  standing process for future sessions: snapshot before any test that
  might overwrite a category slot.
- Final state verified real and healthy: Calendly (calendar), the real
  test Gmail account (email, full scopes), and WooCommerce (ecommerce)
  all connected, confirmed via direct query and snapshotted.
- 0 self-resolved document-level items — the Document Resolution
  Authority gate does not apply (live diagnosis/testing, a code fix for
  a gap the card asked to verify, and one additional real bug fixed
  immediately on discovery — none of it a document-level conflict).
  This session is complete.

### Session 24 — 2026-08-06 — BC-023 COMPLETE: token-expiry root-caused (SCH-006 never activated, now active), Calendar scope narrowed to calendar.events (verified via real reconnect+refresh), Calendly's real disconnection explained, Privacy Policy/ToS revised for the real B2B model
- Step 0 — confirmed @playwright/cli is installed and usable; this
  session's real work (DB/n8n queries, fetching 2 static legal pages)
  didn't call for live browser automation, so it wasn't forced into use
  — the human handled the live Google/Console/reconnect steps directly.
- Step 1 — diagnosed "token expired" with real evidence: both Google and
  Calendly connections were genuinely `status='connected'` in the DB,
  just past their natural access-token lifetime with nothing refreshing
  them — confirmed SCH-006 was `active: false` (only ever ran when
  manually triggered). Ran it manually and captured the real result:
  both refreshes succeeded, proving the mechanism itself was never
  broken. Also found the calendar-scope narrowing (original BC-023
  premise) had never actually been applied to the DB.
- Activated SCH-006 with the human's explicit go-ahead. Publish failed
  initially on a real slackApi credential requirement (stricter than
  manual-execution validation) — disabled the 4 Slack alert nodes (not
  deleted, not invented a credential) per the human's own standing
  instruction, then activation succeeded.
- Step 2 — the human's Console screenshot showed the scope had NOT
  actually been narrowed yet (still full `calendar`) — Console and DB
  were already in sync with each other, just both at the old scope; a
  real correction to the card's own premise. Human narrowed Console
  live; migration 047 matched control.oauth_apps to
  calendar.events+gmail.modify+userinfo.email.
- Step 3 — human reconnected Google (Gmail + Calendar). Verified
  scopes_granted on both rows genuinely includes calendar.events, not
  the old scope. Ran SCH-006 again — both refreshed successfully,
  verified against real DB rows. Traced Calendly's fate via the audit
  log: reconnecting Google Calendar wrote into the SAME category=
  'calendar' connection row Calendly held (the known UNIQUE(client_id,
  category) design) — confirmed the exact connection_id flipped
  provider from calendly to google at the reconnect's timestamp.
  Calendly is now genuinely disconnected — a real, expected side effect
  of the existing category-sharing design, not a new bug; still an open
  product question for the Commander.
- Step 4 — traced the live Privacy Policy/ToS to Netlify (not the
  zeromanualai/zenny GitHub repo, which only holds a stale index.html —
  confirmed via a Netlify response header and gh api, not guessed).
  Fetched real raw HTML via curl (not WebFetch, which paraphrases).
  Revised both documents' substantive language for Zenny's real model —
  a business connects its own Google account, Zenny's AI agent acts on
  that business's behalf toward the business's OWN customers — while
  preserving the exact existing visual design and every already-correct
  section (Limited Use, retention, revocation, contact). Added an
  explicit end-customer-data disclosure (real gap: customer names/
  emails/appointment details do flow through a Client's Gmail/Calendar
  access even though the end customer never authorizes anything
  directly). Made "Zenny, a product of ZeroManual, Inc." explicit and
  consistent throughout. Finished files committed to this repo at
  00_Project_Control/Legal_Pages_Revised_BC023/ for the human to publish
  via Netlify themselves, per their explicit choice.
- 0 self-resolved document-level items — the Document Resolution
  Authority gate does not apply (live diagnosis, a DB change matching a
  human-driven Console change, verification, and a commissioned content
  revision — none of it a document-level conflict). This session is
  complete.

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


---

**Full session history through Session 22 (Sessions 1–22: Phase 0
setup through BC-021) is in `00_Project_Control/Session_Log_Archive.md`**
— moved there verbatim BC-030 (housekeeping) to keep this file usable
ahead of Phase 8. Check the archive only when a session needs context
this file's own (trimmed) Session Log doesn't cover; the STATUS
sections above remain the primary, sufficient source for "what's true
right now."
