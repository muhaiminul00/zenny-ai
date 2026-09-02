# TODOS

## Infrastructure

### `zenny-dashboard` has no automated redeploy-on-merge

**What:** The live `zenny-dashboard` VPS container only rebuilds/re-clones
`main` when someone manually restarts it (`VPS_restartProjectV1`). A merge
to `main` sits invisible on the live site until that happens — there is no
CI/CD hook wiring a merge to a redeploy.

**Why:** Surfaced by accident during BC-076-Card2a's OAuth investigation —
the "bug" the human reported turned out to be a 3-week-stale container
still serving pre-BC-052 code, not a real defect. The same silent-staleness
failure mode has since recurred by design at least once more (the Admin
Provisioning Bootstrap card's own disclosed gap: its UI shipped
`tsc`/`oxlint`-clean but wasn't live on the deployed bundle until a manual
restart after merge). Each occurrence costs a manual verification step
(download the live JS bundle, grep for a code marker) that a real
redeploy hook would make unnecessary.

**Context:** Never actually logged here despite being flagged as
"worth a TODOS.md entry, not silently absorbed into scope" during the
Card2a investigation — a real gap in that session's own wrap-up, closed
now. Needs a decision on mechanism (a GitHub Actions step that calls
`VPS_restartProjectV1`/hits a webhook on merge to `main`, vs. something
Hostinger-native) — not designed here, just tracked so a future
`/plan-eng-review` pass has a starting point.

**Effort:** S-M (mechanism TBD — likely a GitHub Actions workflow on
`push: main` calling into the Hostinger VPS API)
**Priority:** P2 (has already caused 2 real "is this actually broken"
investigations that were really just staleness)
**Depends on:** None.

### Migrate Sheets KB Ingestion to call the shared Generic Ingestion Core

**What:** `KR0kHvk3kJRThrX5` (Sheets KB Ingestion) still contains its own copy of
the chunk/embed/upsert/orphan-cleanup logic — the exact logic BC-076-Card3's
`Zenny Runtime - Generic KB Ingestion Core` (D25) extracted FROM it, for
Shopify/WooCommerce to reuse. Sheets itself was deliberately NOT migrated to
call the new shared core, a disclosed scope trim, not an oversight.

**Why:** Two copies of the same hardening logic (D19/D20/D24-D32) is exactly
the drift risk this project already lived through once — the Notion leg
(BC-047-era INT-012) silently fell behind the same pattern and had to be
rediscovered as broken. Migrating Sheets closes that gap for real, leaving
one canonical implementation instead of two that can drift apart.

**Context:** Not done in Card3 because it means refactoring a shipped,
working production workflow with real regression risk — Codex's own
recommendation for exactly this refactor: freeze/export the current Sheets
workflow before changing it (n8n's built-in version history already covers
this, per Card3's own T1), then dual-run the new call-the-core version
against the same real sheet and diff vector IDs/chunk counts/metadata before
trusting it, not just "looks the same."

**Effort:** S-M (the logic already exists and is proven; this is a rewiring
+ regression-verification task, not new design)
**Priority:** P2 (closes a real, already-once-materialized drift risk)
**Depends on:** None technically; BC-076-Card3 (this TODO's origin) already shipped.

### Get a real, working WooCommerce test store

**What:** Client A's only WooCommerce connection (`zenny-woocom.free.je`) is
a known-flaky free-tier host that returns non-JSON responses to real API
calls — confirmed again, live, during BC-076-Card3's first end-to-end test
of the new WooCommerce KB ingestion leg (a real `Fetch WooCommerce Products`
call got back "Response body is not valid JSON").

**Why:** The WooCommerce ingestion *mechanism* (fetch, normalize, shared-core
ingest) is built and verified to fail safely against this broken store — but
a genuine SUCCESSFUL WooCommerce sync has never been proven end-to-end,
because no working test store exists. This is the same gap
`Wiki/credentials/woocommerce.md` already disclosed before Card3 started;
Card3 just re-confirmed it's still true.

**Context:** Needs either a real client's actual WooCommerce store connected
(once one exists) or a genuinely working free/sandbox WooCommerce install
provisioned deliberately for testing — not something to build around with
more defensive code, since the code already degrades safely; what's missing
is a real target to point it at.

**Effort:** S (once a working store exists) — the ingestion code doesn't
need to change, only be pointed at something real
**Priority:** P2 (blocks ever confirming the WooCommerce leg actually works,
not just that it fails safely)
**Depends on:** A real or sandbox WooCommerce store becoming available.

### Periodic cross-source Pinecone orphan audit

**What:** A scheduled job that lists every `client_kb_source`'s vectors in
Pinecone and diffs them against a fresh read of that source's actual data
(Sheet, etc.), independent of whether the source has synced recently.

**Why:** BC-076-Card2c's D20 rename-safety fix (D24, `06_Infrastructure/n8n/
Workflow_Registry.md`'s Sheets Ingestion entry) only cleans up orphaned
vectors on an actual sync run. A source that goes dormant (client stops
updating their sheet, or the source is abandoned) keeps any orphaned
vectors forever — the ordinary-sync-path design can't reach it.

**Context:** Surfaced by gstack's outside-voice (Codex) during Card2c's
`/plan-eng-review` pass, which correctly pushed back on an earlier draft's
overclaim that "no separate audit is needed." Not urgent at this project's
current stage (2-3 test clients, D22) but worth tracking before client
count grows. Start from D24's shared vector-ID builder/parser (D28) — the
audit's diff logic is the same shape as the per-sync orphan detection,
just triggered on a schedule instead of per-source-sync.

**Effort:** M
**Priority:** P3
**Depends on:** None (Card2c already shipped).

### Wire sync_status failures to real alerting

**What:** Wire orphan-cleanup failure signals (`orphan_step_skipped`,
`orphan_delete_failed_keys`, and a `consecutive_orphan_step_failures`
counter — the counter itself deferred, see below) into a real alert
channel once one exists for this project, ideally `sync_status` failures
generally, not just this one leg.

**Why:** Card2c's D27 gives per-run visibility into list/delete failures,
but a field nobody looks at provides false confidence that repeated
degradation would be noticed. The "degrade, don't block" failure posture
only stays safe if someone eventually sees the degradation.

**Context:** Surfaced by gstack's outside-voice (Codex) during Card2c's
review. The plan originally called for a `consecutive_orphan_step_failures`
cross-run counter to be built in Card2c itself; that was trimmed during
build (it would need a new Supabase read of the prior `sync_status` for
marginal value over the per-run fields already shipped) — build the
counter as part of this item, not as a separate follow-up. Also depends on
this project having any `sync_status` alerting infrastructure at all — if
none exists yet, picking this up will likely reveal that as the real first
step.

**Effort:** S (once alerting infra exists) / M (if it needs to be built,
including the deferred counter)
**Priority:** P3
**Depends on:** Whatever alerting infrastructure this project has (or
builds) for `sync_status`.

## Product

### Real image-based product search + recommendation carousel

**What:** Let a customer upload a photo and have the agent find visually
matching products (plus a recommendation carousel), backed by real
vision embeddings — not text matching against an image's URL/alt-text.

**Why:** Requested by the human during BC-076-Card2b. Correctly scoped
OUT of Card2b at the time (it needs its own vision-embedding/index
design, distinct from the text-ingestion pipeline Card2b shipped) but
never actually written down as a tracked item — it only existed as a
sentence in `PROJECT_STATE.md`'s BC-076-Card2b history entry, at real
risk of being lost whenever that file's own overdue prune/archive pass
happens. Recorded here so it survives that.

**Context:** What Card2b shipped instead is genuinely different and
insufficient for this ask: product image URLs/alt-text are ingested as
plain searchable *text*, so a text query like "red hoodie" can match —
but an uploaded photo has no text to match against, so this doesn't
serve the actual request. Needs its own `/plan-eng-review` pass before
a Build Card: at minimum, a vision-embedding model choice, a
Pinecone index/namespace design compatible with `zenny-business-kb`'s
existing schema (or a separate index), and an ingestion path for
product photos distinct from Card2b's text-chunking pipeline.

**Effort:** M-L (new embedding pipeline + index design + agent-side
photo upload handling)
**Priority:** P3 (no client has asked for this in production yet;
tracked so it's not forgotten, not because it's urgent)
**Depends on:** None technically, but sequencing-wise makes more sense
after BC-076's remaining ingestion legs (Cards 3/4) land, since it's
new scope on top of the same KB tool those cards are still building out.

## Documentation debt

Carried forward from `PROJECT_STATE.md`'s Active Blockers list during
BC-079's prune pass (2026-09-02) — both pre-date the pivot but reference
tables/workflows still live in the current track, so not safe to drop
as pure pre-pivot history.

### `appointments` table undocumented in `Database_Structure_v4_FINAL.md`

**What:** The real, deployed `appointments` table (BC-013) has no
section in the master schema doc.
**Why still relevant:** Used by 5 of 11 Conversion Engine Tools
originally, and now also by the current-track appointment archetype
(BC-074). Not just old-Convocore-era debt.
**Effort:** S **Priority:** P3 **Depends on:** None.

### `n8n_Workflow_Specification_v1.md` missing SCH-007's row

**What:** SCH-007 (a scheduled workflow, Phase 11) was built but never
added to the workflow spec doc.
**Effort:** S **Priority:** P3 **Depends on:** None.

## Infrastructure (continued)

### `control.clients.status` lifecycle is broken

**What:** Nothing in the system has ever transitioned a client's `status`
away from `'onboarding'` — all 6 existing clients (5 test clients + the
real demo client, Carmelli Bakery) sit at `status='onboarding'`
regardless of whether they're fully working. `'active'` and `'paused'`
exist in the enum but have no defined trigger anywhere.

**Why:** Surfaced during the admin-provisioning-redesign
`/plan-eng-review` (2026-09-02) by both the interactive review and
Codex's outside-voice pass, independently. That card adds a 4th value
(`'unprovisioned'`, for shell clients with no schema yet) on top of an
already-overloaded 2-meaning `'onboarding'` — a real, growing problem,
not fixed by that addition. Codex's framing: "`onboarding` already
means both 'not fully provisioned' and 'normal existing usable demo
client'. That ambiguity will leak into filters, list UI, and admin
judgment."

**Context:** Needs an actual state machine: what event moves a client
from `unprovisioned` → `onboarding` (real schema exists) → `active`
(fully connected, live)? Candidates: schema provisioning completing,
first real integration connected, an admin manually flipping it. Until
this is designed, admin-facing client lists cannot reliably show which
clients are actually working.

**Effort:** M (needs its own small design pass, not just a migration)
**Priority:** P2 (affects real, growing operational visibility)
**Depends on:** None technically; conceptually related to whatever
provisions real client schemas going forward (see the next TODO).

### `create_client_schema_from_template()` is untested, unverified infrastructure

**What:** A live Postgres function,
`public.create_client_schema_from_template(p_archetype, p_specific_tables,
p_client_schema)`, already exists — it clones a `tpl_<archetype>`
template schema into a new client schema (tables, FKs, RLS, grants).
It has **zero callers anywhere in the database** and has never been run
against a real client; none of the 6 existing clients were provisioned
through it. It is also not `SECURITY DEFINER`, meaning it needs a
privileged caller (service_role) to run at all.

**Why:** Surfaced during the admin-provisioning-redesign
`/plan-eng-review` (2026-09-02) — the original design doc assumed
schema-cloning automation "doesn't exist anywhere in this repo"; that
assumption was false, but the function's existence doesn't make it
trustworthy. Codex's framing: "treat as untrusted legacy infrastructure
until exercised. Its existence reduces discovery risk, not
implementation risk."

**Context:** Before any future card builds real client provisioning
(self-serve onboarding, or an admin-triggered "provision now" action)
on top of this function, it needs to actually be run against a
disposable test schema and verified end-to-end — including whether
`p_specific_tables` (archetype-specific extra tables) has a real,
current mapping anywhere, since the function itself doesn't derive
that list.

**Effort:** S (a single live test run + verification, ~30min)
**Priority:** P2 (blocks trusting this function for any real
provisioning work, but nothing currently depends on it)
**Depends on:** None.

### Webhook-driven incremental product sync (Shopify/WooCommerce)

**What:** Replace (or supplement) the daily full-catalog cron sync for the
Shopify/WooCommerce KB ingestion legs with real-time product webhooks
(both providers support product create/update/delete topics), so catalog
changes reach `Search_business_kb` faster than once a day.

**Why:** Surfaced by Codex's outside-voice review during BC-076-Card3's
`/plan-eng-review` (2026-09-02). Scheduled full sync is standard and
sufficient at this project's current client count/catalog size, but a
webhook path is real technical debt once a client's catalog changes
intraday — not urgent, but worth tracking so it isn't lost.

**Context:** Webhooks should supplement, not replace, the scheduled full
sync — Codex's own framing: "not a replacement for full reconciliation,"
since a missed/failed webhook delivery (WooCommerce webhooks can be
auto-paused after repeated failures) needs a fallback that still
eventually corrects state. Depends on Card 3 shipping first (the
scheduled sync + shared ingestion core it introduces).

**Effort:** M **Priority:** P3
**Depends on:** BC-076-Card3 (Shopify/WooCommerce ingestion) shipping first.

### A freshly created "unprovisioned" client hits raw RPC errors on first login

**What:** The Admin Provisioning Bootstrap's Add Client flow creates a
real dashboard login in the same call as the client shell row (status
`'unprovisioned'`, `archetype`/`client_schema_name` both NULL). That
client CAN log in immediately, but every client-facing page
(Orders/Appointments/Integrations) calls `dashboard_get_my_client_schema()`
first, which cleanly `RAISE EXCEPTION`s ("No dashboard_users mapping for
this account, or client is offboarded") when the schema is NULL — a
correct, non-crashing error, but a confusing message for a legitimately
provisioned-but-not-yet-onboarded client.

**Why:** Found live during the Admin Provisioning Bootstrap's T3 audit
(checking every consumer of `client_schema_name`/`archetype` for
NULL-safety before loosening their NOT NULL constraints). Not a crash or
data-integrity risk — every consumer already guards NULL cleanly — but a
real UX gap the design doc's own "self-serve half isn't real" disclosure
didn't fully spell out.

**Context:** Not fixed in that card — its Implementation Tasks (T1-T9)
never scoped a "setup pending" screen, and adding one would have been
scope creep beyond the approved spec. The real fix is probably a small,
friendly interstitial ("your account is being set up") gated on
`status = 'unprovisioned'`, checked at the same route-guard level as the
forced-password-reset flow (T8) — natural to build together with
whatever eventually drives the `unprovisioned` → `onboarding` → `active`
state machine (see `control.clients.status` lifecycle TODO above).

**Effort:** S (a route-guard check + one interstitial page)
**Priority:** P3 (no real client has hit this yet — only test/demo
accounts exist)
**Depends on:** Loosely related to the `control.clients.status`
lifecycle TODO above; not blocking, could ship independently.

### Admin Provisioning UI: "Add Admin" shouldn't require picking a client

**What:** `AdminProvision.tsx`'s Add Admin tab requires selecting a
"nominal home client" from a dropdown before it'll create an
admin/super_admin account, even though that client has zero functional
relationship to the admin being created.

**Why:** `control.dashboard_users.client_id` is `NOT NULL` — the table
was designed for one row per login mapping a login to the client it
belongs to. Admin accounts don't belong to any client, so Bootstrap's
`create_admin` action worked around the constraint by requiring an
arbitrary existing client row just to satisfy the FK, rather than giving
admin rows a real "no client" path. Human feedback (2026-09-02, live
testing the shipped feature): the flow should just be email + temp
password + tier — no client picker at all. Agreed, this is a schema
wart, not intentional design.

**Context:** Real fix: make `dashboard_users.client_id` nullable, add a
CHECK constraint requiring it non-null only when `role='client_user'`,
then drop the "nominal home client" picker from `AddAdminTab` and the
`admin_client_id` requirement from the Edge Function's `create_admin`
action. Touches a migration + Edge Function + UI — dedicated work, not
a quick UI tweak; human explicitly deferred rather than asking for it
inline. Separately, the same session's feedback flagged the three tabs
(Add Client / Add Login / Add Admin) as visually reading like equivalent
options when they're conceptually different (new business vs. second
login on an existing business vs. an internal admin account) — worth
a labeling/layout pass in the same dedicated session, not a second card.

**Effort:** S-M (one migration + one Edge Function branch removed + one
form simplified)
**Priority:** P3 (cosmetic/UX correctness, not a security or data-
integrity issue — the current workaround is harmless, just confusing)
**Depends on:** None.

### Client-only RPCs reject admin callers only incidentally, not explicitly

**What:** `dashboard_get_my_client()`, `dashboard_get_my_client_schema()`,
`dashboard_list_paused_recovery_leads()`, and `dashboard_release_lead_ownership()`
all reject an admin-tier caller (NULL `client_id`) only as a side effect of
their `INNER JOIN` finding no row — the resulting error
("No dashboard_users mapping for this account, or client is offboarded")
is misleading for an admin account, which does have a mapping, it just
has no client. No explicit `IF v_role IN ('admin','super_admin') THEN
RAISE EXCEPTION` guard exists in any of the four.

**Why:** Surfaced by Codex's outside-voice review during the Admin
Provisioning UI client-picker fix's `/plan-eng-review` (2026-09-02):
"this is not a database safety argument — direct URL access, stale
clients, or future UI changes can still call these RPCs." Security
posture is already correct today (access is denied either way, and all
four are `SECURITY DEFINER` with zero RLS exposure beyond `auth.uid()`)
— this is about defense-in-depth and clearer error messages, not a live
hole.

**Context:** Fix is a small, mechanical addition to each function: look
up the caller's role once, `RAISE EXCEPTION 'Admin accounts have no
client to view'` (or similar) before the existing client-lookup query,
same pattern `dashboard_admin_list_clients()` already uses for its own
admin-required gate. Not fixed inline during the client-picker card
because it touches 4 functions beyond that card's already-decided scope
for a robustness improvement with no live bug behind it.

**Effort:** S (mechanical, same guard pattern repeated 4x)
**Priority:** P3 (correct behavior today, this is clarity/defense-in-depth)
**Depends on:** None.

### `dashboard_admin_list_clients()`'s "oldest client_user wins" policy is undefined for multi-login clients

**What:** The Clients list view's login-email column picks whichever
`client_user` row for that client has the earliest `created_at` — if a
client ever has 2+ real logins (e.g. two staff accounts), only the
oldest one's email shows; the rest are invisible in this view.

**Why:** Surfaced by Codex's outside-voice review during the Admin
Provisioning UI client-picker fix's `/plan-eng-review` (2026-09-02) —
pre-existing ambiguity in the query's policy, unrelated to the
client-picker fix itself but sitting in the same lateral join that fix
touched (adding a `du.role = 'client_user'` filter). No real client has
2+ logins today (confirmed live, 2026-09-02: exactly one `dashboard_users`
row per client across all 6 real clients) — not urgent, but worth
deciding before it silently hides a second login from an admin.

**Context:** Real fix needs a small design decision: show all logins
(comma-separated or expandable), a designated "primary" contact flag on
`dashboard_users`, or accept "oldest wins" as the permanent policy and
document it as intentional rather than incidental. Not decided here —
tracked so the decision isn't made by accident the day a second login
actually gets created.

**Effort:** S (once the display policy is decided)
**Priority:** P3 (no client has hit this yet)
**Depends on:** None.

### Extract a shared `useProvisionForm` hook for AdminProvision.tsx's 3 tabs

**What:** `AddClientTab`, `AddLoginTab`, and `AddAdminTab` each hand-roll
an identical ~40-line submit/remap/`needsRemapConfirm` state machine
(the duplicate-email confirmation flow, error extraction, success
banner). DRY violation, not introduced by any single card — it grew as
each tab was added on top of the last.

**Why:** Real repetition across 3 files doing the exact same thing.
Originally scoped to be done as part of the Add-Admin client-picker fix
(2026-09-02) — reconsidered after Codex's outside-voice review flagged
it as scope creep: extracting the hook now would touch AddClientTab's
and AddLoginTab's already-working code with zero automated test
coverage as a safety net, for a fix whose actual bug was schema-level.
Deferred to its own PR instead, where it can be reviewed and
regression-tested on its own terms.

**Context:** The extraction itself is straightforward (one
`useProvisionForm({ action, extraFields })`-shaped hook covering
`submitting`/`formError`/`needsRemapConfirm`/`success` state + the
`extractFunctionError` call), but it must be tested against ALL 3 tabs'
existing happy paths post-extraction (Add Client, Add Login, Add Admin
all still work identically), not just the tab motivating the change —
same Iron Rule regression discipline as any refactor of shipped code in
a repo with no test framework.

**Effort:** S (mechanical extraction, ~30min)
**Priority:** P3 (real DRY debt, not urgent — 3 working tabs today)
**Depends on:** None; cleanest done once the client-picker fix (above)
has landed, so this refactor isn't racing a simultaneous behavior change
in the same file.

## Security

### `AddAdminTab`'s remap-confirm shows no context about the account being reassigned

**What:** When `create_admin` returns `USER_EXISTS` (an account with that
email already exists), the confirm-remap UI shows only the generic
duplicate-email message — never the target account's current role or
client. The operator clicks "Confirm — reassign this existing account"
with no visibility into what they're actually about to change.

**Why:** Surfaced by Claude's adversarial review during the Add-Admin
client-picker fix's `/review` pass (2026-09-02). Combined with that
fix's own simplification (Add Admin is now just email + tier, nothing
else to double-check), a typo'd email is easier to remap by accident
than before. The Edge Function already fetches the target's
`auth_user_id` on the 409 — a small addition (also return current
role/client) lets the UI show "you are about to reassign
`carmelli.zennyai@gmail.com` (currently: client_user @ Carmelli
Bakery) to admin" before the irreversible-feeling click.

**Context:** Not a security hole on its own — the server-side
`CANNOT_REMAP_ADMIN_TIER` guard (added same PR) already blocks the
one genuinely dangerous case (demoting an existing admin/super_admin).
This is an operator-safety/UX improvement for the remaining legitimate
case (promoting an existing client_user to admin via `create_admin`).

**Effort:** S (Edge Function: return 2 more fields on the 409; UI: render them)
**Priority:** P3
**Depends on:** None.

### `admin-provision-dashboard-user`'s CORS wildcard + plaintext password in response body

**What:** The Edge Function sets `Access-Control-Allow-Origin: "*"` and
returns `initial_password` in plaintext in its JSON response body on a
successful account creation.

**Why:** Surfaced by Claude's adversarial review during the Add-Admin
client-picker fix's `/review` pass (2026-09-02) — pre-existing since
Card2a, not introduced by that fix, but worth a second look now that
this fix lowers the bar to script `create_admin` calls (fewer required
fields). Exploitability is limited today: a cross-origin page cannot
forge the caller's bearer JWT into the `Authorization` header, so the
wildcard CORS alone doesn't let an attacker's page call this function
as a real admin. Not urgent, but a wildcard CORS on a function that
returns a plaintext credential is worth tightening on general
principle.

**Context:** Real fix is narrowing `Access-Control-Allow-Origin` to the
actual dashboard origin(s) instead of `*` — same pattern this project
would want to eventually apply project-wide if it ever audits all Edge
Functions' CORS configs (none currently restrict origin, confirmed via
Card2a-era `CORS_HEADERS` being copy-pasted across functions).

**Effort:** S (one header value change, verify the real dashboard
origin(s) first)
**Priority:** P3 (limited exploitability today, but cheap to fix)
**Depends on:** None.

## Completed

### Admin-minting has no extra gate — CLOSED (Admin Provisioning Bootstrap, 2026-09-02)

**What it was:** `admin-provision-dashboard-user` let any `role='admin'`
account create another admin — `role` was just a dropdown option in the
UI, with no separate "who can create admins" check.

**How it was closed:** The Admin Provisioning Bootstrap card added a
`super_admin` tier. Minting an admin/super_admin now requires a
dedicated `create_admin` action on the Edge Function, gated server-side
on the CALLER already being `super_admin` — the original `map_existing`
path can no longer assign `role='admin'` at all (restricted to
`client_user` only). Verified live: a plain `admin` caller attempting
`create_admin` gets a clean 403, and a forged `role`/tier value in the
request body is ignored (identity comes from the caller's JWT only, same
doctrine as Card2a's original D4).
