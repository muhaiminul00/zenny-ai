# Session_Log_Archive.md — Archived Session Log Entries

```
Purpose:   Full-fidelity archive of PROJECT_STATE.md's Session Log
           entries older than its current retained window. Created
           BC-030 (housekeeping) because PROJECT_STATE.md had grown to
           ~4979 lines / ~309KB and kept compounding every session,
           ahead of Phase 8 (the largest remaining phase, 11 Tools)
           adding significantly more history on top of it.
Contents:  Sessions 1 through 22 (Phase 0 setup through BC-021),
           moved VERBATIM from PROJECT_STATE.md — no summarizing or
           condensing. This is a real historical record (Build Card
           approvals, self-resolved document-level items, real bug
           findings), not something to lose fidelity on.
Convention: Same as PROJECT_STATE.md's own Session Log — append-only,
           chronological, oldest at the bottom. Future archival
           passes append OLDER sessions below Session 1, and the
           newest-archived session goes at the TOP of this file
           (i.e., directly below this header), matching
           PROJECT_STATE.md's own newest-at-top convention for the
           boundary session.
Usage:     PROJECT_STATE.md's own (now-trimmed) Session Log is the
           primary reference for recent history. Check here only when
           a session needs context from BC-021 or earlier that the
           trimmed Session Log doesn't cover. PROJECT_STATE.md's
           current-state sections (Current Phase, Blockers, Database/
           Credentials/Infrastructure state, etc.) remain the primary
           and sufficient source for "what's true right now" — this
           file is history, not current state.
Archived:  2026-08-07, BC-030 (Claude Code). Original line range in
           PROJECT_STATE.md at time of archival: lines 3844–4979
           (Session 22's header through the file's closing line).
```

---

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
