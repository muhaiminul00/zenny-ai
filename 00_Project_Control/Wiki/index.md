# Wiki Index — Durable Facts & Decisions

```
Purpose:   Catalog of durable, still-current facts and decisions —
           HOW something works or WHAT was decided, not the story of
           debugging it. Read this index every session; drill into
           specific pages only as needed for the task at hand.
Not this:  Wiki/log.md (append-only historical/audit record — when or
           why something was decided, consulted only on demand) or
           PROJECT_STATE.md (current-state dashboard: phase, active
           blockers — read that in full every session too).
```

## Credentials

- [credentials/google-oauth.md](credentials/google-oauth.md) — Google's shared OAuth app (Calendar + Gmail), current scopes/redirect_uri, the still-open category-sharing question with Calendly/Cal.com, and which test client (Client A) has a real connected Gmail for live-send testing.
- [credentials/shopify.md](credentials/shopify.md) — Shopify's two live connection mechanisms (OAuth + Client Credentials Grant) and why static Custom App tokens are permanently dead.
- [credentials/vault-storage-pattern.md](credentials/vault-storage-pattern.md) — the `store_credential_secret` upsert-by-name pattern, why it exists, and the recurring n8n response-format gotchas around reading Vault-backed RPCs.
- [credentials/calendly.md](credentials/calendly.md) — Calendly's OAuth setup, its shared `calendar`-category slot with Google/Cal.com, and current refresh coverage.
- [credentials/woocommerce.md](credentials/woocommerce.md) — WooCommerce's manual-key (non-OAuth) connection pattern and its live-validate-then-store Edge Function.
- [credentials/slack-status.md](credentials/slack-status.md) — Slack is fully removed/deprecated; what replaced it (Gmail-based notifications via UTIL-004) and why.
- [credentials/twilio.md](credentials/twilio.md) — Twilio's schema-only, no-OAuth-app, bring-your-own-credential design (never seeded with a real credential).
- [credentials/oauth-redirect-and-proxy-domain.md](credentials/oauth-redirect-and-proxy-domain.md) — the `auth.zeromanuals.com` Traefik proxy, the real Host-header-rewrite mechanism, and which providers' redirect_uri actually moved to it (Google only).
- [credentials/token-refresh-pipeline.md](credentials/token-refresh-pipeline.md) — how SCH-006 (scheduled) and UTIL-006/UTIL-007 (synchronous per-call) refresh tokens, and which providers each one actually covers.

## Infrastructure

- [infra/vps-and-docker.md](infra/vps-and-docker.md) — the single VPS (srv1881104), its Docker Compose projects, Traefik's base config, and the dashboard's self-healing container pattern. Real monthly cost live-verified 2026-08-24: $19.49/mo (Hostinger subscription `AzZLVKVRPDrqtJm0`) — a second, identically-named KVM 1 subscription on the account belongs to the already-documented out-of-scope VPS (`1729215`), not Zenny.
- [infra/dns-ownership.md](infra/dns-ownership.md) — Netlify (not Hostinger) is zeromanuals.com's real authoritative DNS control plane — the standing correction to a real early misdiagnosis.
- [infra/traefik-proxies.md](infra/traefik-proxies.md) — the dashboard.zeromanuals.com and auth.zeromanuals.com Traefik routers and the real Host-header-rewrite mechanism that makes the OAuth proxy work.
- [infra/supabase-tier-limits.md](infra/supabase-tier-limits.md) — the Supabase org is still on the free tier; the branded-domain need was solved by a VPS-side proxy instead of a Pro upgrade.
- [infra/platform-limitations.md](infra/platform-limitations.md) — Hostinger's Compose API has no `build:` key support, and the restart-vs-recreate container trap it leads to.
- [infra/dashboard-auth-mapping.md](infra/dashboard-auth-mapping.md) — `control.dashboard_users`, the real mapping table (BC-051) that replaced the `app_metadata` stopgap; the new `dashboard_provision_user` RPC for creating dashboard users going forward.
- [infra/connection-lifecycle-actions.md](infra/connection-lifecycle-actions.md) — the `connection-lifecycle` Edge Function (BC-052): real per-provider Revoke (Google/Calendly) + honest local-only disclosure (Shopify/WooCommerce), plus Reconnect/Refresh dashboard actions.
- [infra/verification-approval-queue.md](infra/verification-approval-queue.md) — the opt-in third verification tier (BC-053): `pending_verifications` queue, WF-013/WF-016's new branch, the `resolve-pending-verification` Edge Function; BC-055 closed the calendar-delete gap (real, live-proven Google delete + Calendly cancellation).
- [infra/int008-ownership-release.md](infra/int008-ownership-release.md) — INT-008's real caller (BC-056): the dedicated dashboard `/paused-leads` action, the `dashboard_release_lead_ownership` RPC, INT-008's new real webhook, and the `release-lead-ownership` Edge Function's deliberate `verify_jwt: true` deviation.
- [infra/convocore-agent-provisioning.md](infra/convocore-agent-provisioning.md) — BC-058/058c: 2 doc/reality gaps resolved (agent naming convention already decided elsewhere; `convocore_agent_map` already built, not "pending" as the Adapter Spec still said — both corrected in the docs). Plus a 3rd finding, unrelated to Convocore: `control.agent_prompts` is Email Manager's (per-client-overridable LLM prompts). BC-062 (2026-08-15, complete): moved to per-client-schema (matching the live `email_categories` precedent) — `agent_prompts` now lives in `public`+`tpl_*`+every client schema, read via `get_client_agent_prompt`; INT-010/INT-011 rewired, live-tested with real LLM calls, published. See [[platform-quirks/n8n-openrouter-direct-llm-pattern]]. BC-060 (2026-08-17, in progress): first real client provisioned (Carmelli Bakery) — 2 real `create_client_schema_from_template` bugs found live (wrong `p_archetype` value, `waitlist_entries`'s missing `conversion_id`), full process recorded in `BC-060_Onboarding_Process_Reference_v1.md`, stopped at 3 human-only gates. BC-071 (2026-08-17, complete, v1.2): gate 2's real Convocore build content (Variables/Tools/Global Prompt+Nodes) written — `05_Platform_Builds/Convocore/BC-071_Carmelli_Build_Package/`. 2 initial findings: Carmelli's real conversion mode is B not A (no cart API), and only 3 of 5 active modules need a Convocore node (Recovery Engine/Email Manager are n8n-only). **Critical live bug found + fixed same day:** the human's own real Convocore test call proved the Adapter's `Normalize Incoming Payload` node (workflow `BOxeuH6ehv46FZL0`) never matched Convocore's real body shape — `agentId` was never present at all, meaning every real Custom Tool call would have 401'd. Fixed live (agent_id/tool key now read from the webhook URL's query string, not the body) and live-tested. A paired doc bug (System Variables can't be renamed on attachment) was also found and fixed. See `Wiki/log.md` session-BC-071-critical-fix and `06_Infrastructure/n8n/Workflow_Registry.md`'s ADP-002 entry. **Follow-up same day:** real agent ID received; live-verifying Carmelli's schema found `client_config` empty platform-wide (4 of 5 test clients, plus Carmelli). **Both then closed same day:** a real webhook signing secret was generated (not a third-party credential — Convocore has no UI path to retrieve its own auto-Bearer value) and `convocore_agent_map`/`client_config` rows landed live for Carmelli; `max_booking_horizon` turned out to already have a documented default (365 days, `Agent_Runtime_System_v1.md` Appendix B) rather than needing a real decision. BC-060 gate 2 moved to IN PROGRESS. See `Wiki/log.md` session-BC-071-secret-and-config-closed. **Critical fix #2, same day:** WF-001 (CreateLead) never had a working customer-resolution path — every real call would 500 on an invalid-UUID error, since no caller anywhere in the system ever has the internal customer UUID before calling create-lead. Assembled the already-built-but-never-wired find-or-create RPCs into a real fix, live-tested both branches against real Carmelli data, published. See `Wiki/log.md` session-BC-071-customer-resolution-fix and `06_Infrastructure/n8n/Workflow_Registry.md`'s WF-001 entry. **Platform-wide fix, same day:** `source_channel`'s DB enum renamed from `website` to Convocore's real `channel` value (`web-chat`, live-confirmed) instead of instructing the agent's LLM to override it — 25 existing test rows migrated automatically, re-tested and published. See `Wiki/log.md` session-BC-071-source-channel-rename. **Same-bug-fixed-everywhere pass, same day:** the customer-resolution bug was fixed system-wide (WF-017, the Adapter's own `human_handoff` branch, WF-016) since WF-017 is the shared Fallback-D destination for every Tool. **Also found and fixed, far more severe and unrelated to the original request: the Adapter's Bearer-token check had been completely disconnected since it was first built — no real Convocore call has ever actually been authenticated.** Reconnected and live-verified both directions (valid token passes, invalid token now genuinely rejected). See `Wiki/log.md` session-BC-071-customer-resolution-everywhere and `06_Infrastructure/n8n/Workflow_Registry.md`'s ADP-002/WF-017/WF-016 entries.

## Platform Quirks

- [platform-quirks/n8n-node-behaviors.md](platform-quirks/n8n-node-behaviors.md) — n8n's responseFormat/scalar-unwrap behavior, output-pin wiring gotchas, IF-node validation quirks, and editor/MCP-edit clobbering — the single most recurring bug class in this project. BC-074/075 (2026-08-31) added two more: explicit `responseFormat:'json'` can hard-crash an HTTP node calling this project's own n8n webhooks (found live — had been silently broken in BC-073's shipped `Check_availability` since 2026-08-29, now fixed); renaming a node into a trigger's old name for live-testing doesn't carry connections, needs an explicit `addConnection`.
- [platform-quirks/postgrest-schema-exposure.md](platform-quirks/postgrest-schema-exposure.md) — client schemas are never exposed to PostgREST directly (PGRST106), the SECURITY DEFINER RPC-wrapper fix pattern, the `control` schema USAGE-grant gap (and the same gap recurring at table level for a new table, BC-049), and the PGRST203 overload-ambiguity trap.
- [platform-quirks/security-definer-rls.md](platform-quirks/security-definer-rls.md) — a SECURITY DEFINER view without `security_invoker` set silently bypasses the underlying table's RLS — a real cross-tenant exposure this project hit once already.
- [platform-quirks/supabase-auth-quirks.md](platform-quirks/supabase-auth-quirks.md) — GoTrue's NULL-vs-empty-string expectations on direct `auth.users` inserts, and why direct auth.users writes are correctly permission-blocked.
- [platform-quirks/recovery-queue-sweep-design.md](platform-quirks/recovery-queue-sweep-design.md) — why INT-006's client sweep doesn't filter on `control.clients.status` (unused as a gate anywhere else), the `human_ownership_flag` check WF-018 itself never covers, BC-041's per-client active-hours window, INT-007's reply-triggered stop vs. why INT-008's resume is NOT reply-triggered (BC-050), and the max-recovery-steps-not-enforced-anywhere gap it surfaced.
- [platform-quirks/mode-self-invocation-limits.md](platform-quirks/mode-self-invocation-limits.md) — `/commander`/`/execute`/`/advisor` are real self-invocable Skills (they write `mode.json` for real); `/clear`/`/compact` are not — no tool exists for either, so they're recommended to the human, never self-triggered.
- [platform-quirks/n8n-openrouter-direct-llm-pattern.md](platform-quirks/n8n-openrouter-direct-llm-pattern.md) — the `chainLlm`+`lmChatOpenRouter`+structured-output pattern for the first direct AI judgment call made from n8n itself (INT-010), and why it was a human decision, not self-resolved. BC-062 (2026-08-15, complete): both prompts now live-wired to per-client-schema `agent_prompts` tables via `get_client_agent_prompt`, tested with real LLM calls, published.
- [platform-quirks/notion-pinecone-kb-pattern.md](platform-quirks/notion-pinecone-kb-pattern.md) — Email Manager's Notion+Pinecone multi-tenant KB design (INT-011/INT-012), why Convocore's KB API was dropped, and both credential gates now closed (Pinecone credential-type fix BC-048; Notion's real root cause was a missing page-level Connections grant, not a secret mismatch — corrected BC-049).
- [platform-quirks/anon-grant-exposure-bc052.md](platform-quirks/anon-grant-exposure-bc052.md) — CRITICAL, fixed: ~40 internal RPCs (read_credential_secret, etc.) were live-exploitable via the public anon key, found + fixed during BC-052. BC-064 (2026-08-15) found + fixed the same gap's `authenticated` half (73 more RPCs, never touched by BC-052) via the live Supabase Security Advisor — 117 warnings down to 11 (10 intentional dashboard RPCs + 1 unrelated Auth setting). BC-063 (2026-08-15) closed the Edge Function client_id-trust gap for 4 of 6 functions (derive identity from the caller's real session JWT instead); `oauth-callback`/`oauth-initiate` intentionally left as-is (genuinely no bearer token available in either flow).
- [platform-quirks/n8n-concurrency-race-patterns.md](platform-quirks/n8n-concurrency-race-patterns.md) — BC-2026-08-31: 4 real multi-tenant/multi-concurrent-user gaps found + fixed in BC-072/073 (duplicate conversations, double-fulfillment on approval, duplicate verification-queue rows, non-durable n8n-process-local conversation memory) — the check-then-act-without-a-DB-guarantee pattern to watch for, plus 2 n8n-specific build gotchas (zero-item nodes starve downstream branches; new HTTP Request nodes don't auto-inherit credentials). Standing expectation from this card: every future archetype node designed and verified against concurrent multi-client/multi-user load from the start.

- `05_Platform_Builds/.Future_Custom/Zenny_Own_Conversation_Runtime_Outline_v1.md` — full-product outline for replacing Convocore with an n8n-native (default) or dedicated-runtime conversation layer, plus the customer/admin dashboard spec it feeds. Roadmap only, not v1-mandatory — pre-pivot, paused; queued Build Cards it points to (BC-070, Path A #7; BC-065-069, Path A #6) are archived verbatim in `Wiki/log.md`'s "PROJECT_STATE.md full pre-prune archive" section since BC-079's 2026-09-02 prune (they no longer live in `PROJECT_STATE.md` itself).

## Reference

- [reference/convocore-doc-status.md](reference/convocore-doc-status.md) — which `05_Platform_Builds/Convocore/` docs are primary/backing/background/optional/superseded, and the BC-057b (2026-08-14) live recheck confirming the REST+MCP billing block is still active on both paths — manual Canvas UI is the fallback build method.
- [reference/convocore-pricing-live-facts.md](reference/convocore-pricing-live-facts.md) — live-verified 2026-08-24, corrected same day against our own account's Billing→Plans screenshot (watermark removal actually starts at Business $99/mo, not White Label), then **resolved 2026-08-25 via Convocore's own support AI: there is no $15/mo Client Seat add-on on Pro/Business at all** — multi-client management (separate org + billing per client) is exclusive to White Label/Elite, meaning **White Label ($199/mo) is required from Zenny's first paying client**, not an eventual upgrade. Recommendation to book a call with Moe Ayman (Convocore's founder) before finalizing. WhatsApp/Messenger/Instagram still carry no separate Convocore channel fee.
- `05_Platform_Builds/Convocore/Convocore_Agent_Intake_Checklist_v1.md` — BC-058's master intake checklist (business/archetype ID, agent config, backend provisioning, integration credentials), Type/Source/Why-it-matters columns, doubles as onboarding-manual v1's seed. BC-059 (2026-08-14) ran it for real against carmelli.co.uk — result: Commerce-Ecom, short ASK list ready to send.
- [reference/role-modes-plugin.md](reference/role-modes-plugin.md) — Zenny's original advisor/commander/execute mode system: a standalone, portable Claude Code plugin (`github.com/muhaiminul00/role-modes`), installed for this project BC-TOOL-002 (2026-08-26) through BC-077 (2026-09-02). **Disabled (not uninstalled) 2026-09-02 — superseded by `gstack-pilot`.** Still installed, still switchable back (flip `enabledPlugins` in `.claude/settings.json`) — see the page for the exact switch. Local copies of the pre-plugin commands are archived at `00_Project_Control/Completed_Task_Archive/role-modes-plugin-migration/`.
- [reference/project-memory-plugin.md](reference/project-memory-plugin.md) — a portable, self-scaffolding three-layer memory system (state doc + Wiki + log), extracted the same way as `role-modes` but built as a sibling plugin (`github.com/muhaiminul00/project-memory`), based on Karpathy's LLM-wiki gist. BC-TOOL-003 (2026-08-26): built, `/simplify`-reviewed, live-verified against scratch test projects. Zenny is NOT migrated onto it — Zenny's Memory System stays its own raw Wiki (see `.claude/CLAUDE.md`).
- [reference/gstack-pilot-plugin.md](reference/gstack-pilot-plugin.md) — sibling plugin to `role-modes` (built 2026-08-29 for the new "ZM — Company Brain" project): same 3-mode system, natively chained into gstack (Commander→office-hours/plan-eng-review/autoplan, Execute→review/qa/ship, PR-first no exemption). **Live and public: `github.com/muhaiminul00/gstack-pilot`, v1.6.0. Zenny migrated onto it 2026-09-02 (BC-077)** — see `docs/designs/zenny-gstack-pilot-migration.md`. BC-2026-08-31 (2026-08-31) shipped Execute's pre-flight sync gate + live PR-scope collision check — hook-enforced (`PreToolUse` + `scripts/pre-flight-sync.js`), fail-closed on a corrupt marker, 2 real bugs found+fixed during live verification, merged via PR #1. Follow-up BC-2026-08-31-gh-setup-loud-nudge (same day) added a one-time loud gh-setup nudge (PR #2, v1.2.0) closing the "silent-forever" soft-degrade gap the first card's design doc flagged and accepted. BC-2026-08-31-readme-reposition-and-clear-compact (PR #3, v1.2.1) reframed the README around the actual problem gstack-pilot solves and made `/clear`-vs-`/compact` guidance contextual. BC-2026-08-31-public-repo-hygiene-and-gstack-mandatory (PR #4, v1.3.0) untracked internal build docs from the public repo, added a gstack global-config nudge, and made gstack an explicit prerequisite in the README's Install section. BC-2026-08-31-readme-trim-hygiene-and-role-modes (PR #5, v1.3.1) trimmed v1.3.0's own README additions further per direct human feedback — removed the "Repo hygiene" section entirely, shrank "What's different from role-modes" from a full comparison table to a short paragraph (kept, not removed, since two other sections depend on it introducing role-modes first). BC-2026-08-31-execute-midrun-planning-chain (PR #6, v1.4.0) gave Execute a bounded mid-run gstack-invocation chain — a fork inside the existing decision-needed STOP (never a new STOP category): if a mid-run block is something Execute can research itself (architecture, bug root cause, security), it gets one attempt at the matching gstack skill (`investigate`/`plan-eng-review`/`cso`/`office-hours`, or its own judgment) before resuming; still stuck after that one attempt escalates to the existing STOP, and any resolution implying scope change still trips the existing design-change STOP. BC-2026-08-31-preflight-allow-dirty (PR #7, v1.5.0) added a narrow `--allow-dirty` flag to `pre-flight-sync.js` closing a real live-hit deadlock on `zm-brain` — a commit-the-dirty-tree task had no path through the gate short of routing mutations around it via Bash; the flag is passed by Execute only when a Build Card's Objective explicitly is committing the current working tree, `hooks/pre-tool-use.js` untouched. BC-2026-08-31-install-message-delegation (PR #8, v1.5.1) brought the README's Install section in line with `TEAM_SETUP.md`'s already-proven message-delegation pattern for the gstack global install, added a `claude plugin marketplace add` CLI-equivalent alongside `/plugin`, and made `/gstack-pilot:init`'s must-do status louder at the point it's introduced. **Zenny migrated onto it 2026-09-02 (BC-077)** — `role-modes` disabled, not uninstalled; see `docs/designs/zenny-gstack-pilot-migration.md`. **BC-077's remaining T5/T7 closed same day** — `.claude/CLAUDE.md`'s blank fields filled; the trivial-housekeeping PR-exemption was found NOT actually applied on its one real prior chance (BC-078, PR #8, doc-only) and corrected via this task's own direct-to-`main` wrap-up; Commander's self-chain into `office-hours`/`plan-eng-review` (T7.1) is confirmed present in source but still awaiting a real live trigger — see the page's own new section for detail. **Landing that wrap-up itself surfaced a second real bug**, fixed same session and released as `v1.6.1`: the pre-flight marker outlives its own branch after a direct-to-`main` merge+delete, blocking the mode-handback write meant to exit Execute mode. **Confirmed live 2026-09-02 (same day):** human ran `/plugin update gstack-pilot@gstack-pilot`; `installed_plugins.json` verified this project resolves to `1.6.1` — the fix is in effect.
- [reference/gstack-skill-playbook.md](reference/gstack-skill-playbook.md) — the durable *why* behind `.claude/skills/using-gstack/SKILL.md`'s routing rules for `garrytan/gstack` (machine-global, 55 skills/76 browse commands). Live-verified 2026-08-29 against all 55 skill files — corrects several earlier guesses (real vs. assumed self-chaining, guard's actual mechanics, GBrain's confirmed-low default risk, Dashboard being a subfolder of this repo not a separate one) and retracts a fabricated claim (an invented "Essential Core Path" that doesn't exist in gstack's docs — see the page's own correction note). **Installed, Phase 3 dispatch-rewrite complete, branch/PR workflow adopted** (global — **now team mode as of 2026-08-29**, `~/.gstack/config.yaml` `team_mode: true`/`auto_upgrade: true`, machine-wide; hook-collision re-verified live under team mode this time, still clear; `using-gstack` skill is the live dispatch mechanism). Remote renamed `zenny-sync` → `origin` so gstack's `/review`/`/ship` work — **live-proved end to end via a real PR** (`zenny-producition-sync#1`, merged): `/review`'s base-branch/diff detection found the real diff correctly this time, critical-pass review ran clean (0 findings, docs-only diff). See `CLAUDE.md`'s Standing Rule — Branch/PR Workflow for the ongoing process.

## Roadmap

- `docs/designs/zenny-launch-blueprint.md` — light, part-by-part blueprint
  (2026-08-31, draft) of everything between here and "Zenny live with real
  paying clients": 9 parts (remaining 3 archetypes, business memory,
  capability-breadth verification, channel-gateway parity on the
  own-runtime, onboarding pipeline update, dashboard alignment,
  ops/monitoring, the disclosed credential blocker, pre-launch QA). Part 2
  (business memory) is no longer just an open question — its module
  boundary and catalog-sync mechanism are locked via a real
  `/plan-eng-review` pass, see
  [[../decisions/agent-capability-scope-and-business-memory]]. Part 6
  (dashboard) is likewise no longer just "verify it still works" — a real
  scoped architecture (channels/integrations/chats/business-info/metrics/
  settings) is locked, referencing open-source Chatwoot's UX patterns
  without adopting it as infra; Part 2's catalog sync gained Google
  Sheets + embedded Baserow/Grist legs for non-Shopify/WooCommerce
  clients. **Part 1 re-sequenced (third pass, fourth `/plan-eng-review`):**
  priority reversed — production-hardening the 3 shipped archetypes
  (Commerce-Ecom/Appointment/Consultation) now comes BEFORE the remaining
  3 (moved to Part 1-EXT, deferred). Locks a launch-critical gate scope
  (credential fix, capability/channel/onboarding audits, minimum
  alerting, two launch-critical dashboard pieces, QA pass), reverses
  BC-076 (business memory) from fast-follow to launch-critical per
  explicit human instruction, and locks independent per-archetype
  rollout (no bundling across the 3). **BC-076's build-ready spec is now
  locked too (fifth pass)** — schema, 5-leg ingestion design (Shopify/
  WooCommerce/Notion/Sheets/Baserow), the `Search Business KB` tool's
  wiring into all 3 shipped Agents, and a per-archetype demo-business
  verification plan. **BC-076's first build slice has now shipped**
  (schema + tool + wiring into all 3 Agents; 2 severe pre-existing
  cold-conversation bugs found+fixed along the way) — remaining
  ingestion legs and demo-business verification are a follow-up
  session. **A same-day follow-up pass wired all 3 archetypes' system
  prompts to actually use the tool and spot-checked the cold-path fix
  on Appointment/Consultation (both hold) — but found a new, severe,
  unfixed bug: the tool's `client_id` parameter resolves to `null` on
  every call (a `toolWorkflow`-as-`ai_tool` n8n platform limitation,
  confirmed 6 different ways), meaning it can never retrieve real
  content for any client even once ingestion is built.** This is now
  the actual blocker on BC-076, ahead of the remaining ingestion legs.
  **A real `/plan-eng-review` pass (sixth) then locked the actual
  unblock sequence — 5 pieces of work, not one card: Card 1 (fix the
  bug, build-ready now, tenant-isolation-corrected per an outside-voice
  catch) → Card 2a (dashboard OAuth investigation + test clients) / Card
  2b (Google Sheets via service account, not OAuth — avoids stacking a
  3rd sensitive scope onto an already-unverified Gmail/Calendar OAuth
  app) → Card 3 (remaining ingestion legs) → Card 4 (scheduled canary/
  smoke-test, this session's own undetected-bug history being the
  reason manual-only verification isn't enough).** **Card 1 then
  shipped the same session — the client_id bug is FIXED and
  live-verified (real seeded content, correct-tenant retrieval AND
  cross-tenant non-leakage both proven across 2 archetypes).** **Card 2b's
  build-ready spec locked (seventh pass, 10 decisions D14-D23, 6 of them
  outside-voice-forced corrections to a real ID-collision bug) and its
  build started — the Sheets ingestion workflow + SCH-004's generalized
  dispatcher are both built and structurally validated, but blocked on a
  real Credential Gate (no Google service-account credential exists yet).
  A genuine live incident was found and fixed along the way: SCH-004's
  published version was still querying a column renamed away during the
  first slice, one scheduled run away from breaking the nightly Notion
  sync for every client.** **Card 2b then SHIPPED (2026-09-01): Credential
  Gate cleared (real GCP service account + n8n credential + a real raw
  Shopify export as test data), both workflows published and live-verified
  end to end — 28 real vectors landed in Pinecone, confirmed independently,
  and `Search_business_kb` proven to actually retrieve the seeded content
  through a real query. 4 real bugs were found and fixed via live
  execution alone (none were structural, so `validate_workflow` never
  caught them) — most notably a false "success" status that had actually
  written zero real vectors, caused by an HTTP-node failure silently
  wiping downstream row data.** A live key-column trap was caught before
  shipping: the raw export's `Handle` column isn't row-unique (repeats
  across product variants) — `Variant SKU` used instead, confirmed against
  the sheet's real header row, not guessed. The human's request for real
  image-based product search + a recommendation carousel was correctly
  scoped OUT as new capability needing its own design, not absorbed into
  this card. **Same-day follow-up (2026-09-01): the 403 revoked-access
  proof closed clean, and the final D20/D17 proofs found real issues,
  not papered over.** D17's blank-key status report had a stale-snapshot
  bug (`"success"/failed_count:0` while naming a failed row) — fixed,
  published, re-verified via a direct Supabase read. D20's re-key proof
  FAILED: renaming a row's key orphans its old vectors in Pinecone
  permanently, since the delete-then-reinsert mechanism only ever knows
  a row's *current* key. **Closed same day via BC-076-Card2c:** routed
  through `/plan-eng-review` (per the human's chosen approach — track
  previously-synced keys, diff-delete orphans), including a default-on
  outside-voice pass that caught a real gap (no guard against an
  incomplete Sheets read mass-deleting real content) the interactive
  review missed. Built, published, and live-verified same session — the
  exact `DPB`/`TMB02` orphan vectors left as evidence are now gone,
  independently re-confirmed via a fresh Pinecone list call, zero false
  positives against the 14 valid keys. Formally supersedes D16 (cross-leg
  row deletion) too, since the two cases are indistinguishable from key
  data alone. Two small follow-ups tracked in `TODOS.md`, not built this
  pass (a dormant-source audit, wiring failures to real alerting). See
  [[../decisions/agent-capability-scope-and-business-memory]]. Every
  other part still gets its own `/plan-eng-review` pass when Commander
  schedules it — this doc is a map, not a full spec.

## Open Decisions

- [decisions/zenny-saas-runtime-pivot.md](decisions/zenny-saas-runtime-pivot.md) — DECIDED (architecture locked) 2026-08-29: Zenny replaces Convocore (now fully stopped) with its own runtime, built against `Zenny_MultiNode_Runtime_Architecture_v1.0.md` + `Zenny_Channel_Adapter_Architecture_v2.0.md`. Real demand signal (7-8 leads/day, blocked on price) drove the decision; channel parity (web+WhatsApp+IG) required at launch; Carmelli decoupled from validation (separate Dec delivery); timeline honestly dual-stated (1-1.5mo target vs 2.5-3mo doc estimate); Phase 1 archetypes confirmed (commerce-ecom + appointment + consultation). **BC-072 (Shared Runtime Foundation) built, live-verified, published same day** — real correction found live: tenant isolation is schema-per-client (matching this platform's existing pattern), not the RLS+org_id model the architecture doc assumed. **BC-073 (Commerce-Ecom Node) and BC-2026-08-31 (concurrency hardening) complete.** **BC-074/075 (Appointment + Consultation Nodes) built and published 2026-08-31** — both inherit BC-2026-08-31's memory-rehydration pattern from day one; a cross-cutting `responseFormat` crash bug was found live and fixed platform-wide (including a retroactive fix to BC-073's already-shipped `Check_availability` tool, silently broken since 2026-08-29); a pre-existing external credential blocker (expired `zenny-notification-sender`, already logged) prevented a fully clean success-path test for both cards' calendar-touching tools — structurally verified up to that known point instead. See `06_Infrastructure/n8n/Workflow_Registry.md`'s "Zenny Own Runtime (Phase 14)" section. Full record: `docs/designs/zenny-saas-runtime-pivot.md`.
- [decisions/calendar-category-sharing.md](decisions/calendar-category-sharing.md) — DECIDED 2026-08-14: one calendar provider at a time, no schema change. Closed.
- [decisions/disconnect-provider-revocation.md](decisions/disconnect-provider-revocation.md) — DECIDED + BUILT (BC-052): real per-provider revoke (Google/Calendly) + honest local-only disclosure (Shopify/WooCommerce) + Reconnect/Refresh. See [[infra/connection-lifecycle-actions]]. Closed.
- [decisions/dashboard-auth-mapping.md](decisions/dashboard-auth-mapping.md) — DECIDED + BUILT (BC-051): `control.dashboard_users` mapping table live. See [[infra/dashboard-auth-mapping]]. Closed.
- [decisions/verification-tier-redesign.md](decisions/verification-tier-redesign.md) — DECIDED + BUILT (BC-053): opt-in third verification tier, default off. See [[infra/verification-approval-queue]]. Closed.
- [decisions/int-008-ownership-release-caller.md](decisions/int-008-ownership-release-caller.md) — DECIDED + BUILT (BC-056): dedicated dashboard action. See [[infra/int008-ownership-release]]. Closed.
- [decisions/agent-capability-scope-and-business-memory.md](decisions/agent-capability-scope-and-business-memory.md) — RESOLVED (2026-08-31, via gstack /plan-eng-review for BC-074/075): scoped OUT of BC-074/075 — capability breadth (FAQ, recommendation) is a prompt-content question, not a missing tool. Business memory (a durable per-client store beyond the static `agent_prompts` string) is deferred to a future BC; recommended shape is generalizing the existing Notion+Pinecone KB pattern into a cross-archetype `Search Business KB` tool. Open item for a future card, not this one.
