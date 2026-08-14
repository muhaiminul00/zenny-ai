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

- [infra/vps-and-docker.md](infra/vps-and-docker.md) — the single VPS (srv1881104), its Docker Compose projects, Traefik's base config, and the dashboard's self-healing container pattern.
- [infra/dns-ownership.md](infra/dns-ownership.md) — Netlify (not Hostinger) is zeromanuals.com's real authoritative DNS control plane — the standing correction to a real early misdiagnosis.
- [infra/traefik-proxies.md](infra/traefik-proxies.md) — the dashboard.zeromanuals.com and auth.zeromanuals.com Traefik routers and the real Host-header-rewrite mechanism that makes the OAuth proxy work.
- [infra/supabase-tier-limits.md](infra/supabase-tier-limits.md) — the Supabase org is still on the free tier; the branded-domain need was solved by a VPS-side proxy instead of a Pro upgrade.
- [infra/platform-limitations.md](infra/platform-limitations.md) — Hostinger's Compose API has no `build:` key support, and the restart-vs-recreate container trap it leads to.
- [infra/dashboard-auth-mapping.md](infra/dashboard-auth-mapping.md) — `control.dashboard_users`, the real mapping table (BC-051) that replaced the `app_metadata` stopgap; the new `dashboard_provision_user` RPC for creating dashboard users going forward.
- [infra/connection-lifecycle-actions.md](infra/connection-lifecycle-actions.md) — the `connection-lifecycle` Edge Function (BC-052): real per-provider Revoke (Google/Calendly) + honest local-only disclosure (Shopify/WooCommerce), plus Reconnect/Refresh dashboard actions.
- [infra/verification-approval-queue.md](infra/verification-approval-queue.md) — the opt-in third verification tier (BC-053): `pending_verifications` queue, WF-013/WF-016's new branch, the `resolve-pending-verification` Edge Function; BC-055 closed the calendar-delete gap (real, live-proven Google delete + Calendly cancellation).
- [infra/int008-ownership-release.md](infra/int008-ownership-release.md) — INT-008's real caller (BC-056): the dedicated dashboard `/paused-leads` action, the `dashboard_release_lead_ownership` RPC, INT-008's new real webhook, and the `release-lead-ownership` Edge Function's deliberate `verify_jwt: true` deviation.

## Platform Quirks

- [platform-quirks/n8n-node-behaviors.md](platform-quirks/n8n-node-behaviors.md) — n8n's responseFormat/scalar-unwrap behavior, output-pin wiring gotchas, IF-node validation quirks, and editor/MCP-edit clobbering — the single most recurring bug class in this project.
- [platform-quirks/postgrest-schema-exposure.md](platform-quirks/postgrest-schema-exposure.md) — client schemas are never exposed to PostgREST directly (PGRST106), the SECURITY DEFINER RPC-wrapper fix pattern, the `control` schema USAGE-grant gap (and the same gap recurring at table level for a new table, BC-049), and the PGRST203 overload-ambiguity trap.
- [platform-quirks/security-definer-rls.md](platform-quirks/security-definer-rls.md) — a SECURITY DEFINER view without `security_invoker` set silently bypasses the underlying table's RLS — a real cross-tenant exposure this project hit once already.
- [platform-quirks/supabase-auth-quirks.md](platform-quirks/supabase-auth-quirks.md) — GoTrue's NULL-vs-empty-string expectations on direct `auth.users` inserts, and why direct auth.users writes are correctly permission-blocked.
- [platform-quirks/recovery-queue-sweep-design.md](platform-quirks/recovery-queue-sweep-design.md) — why INT-006's client sweep doesn't filter on `control.clients.status` (unused as a gate anywhere else), the `human_ownership_flag` check WF-018 itself never covers, BC-041's per-client active-hours window, INT-007's reply-triggered stop vs. why INT-008's resume is NOT reply-triggered (BC-050), and the max-recovery-steps-not-enforced-anywhere gap it surfaced.
- [platform-quirks/mode-self-invocation-limits.md](platform-quirks/mode-self-invocation-limits.md) — `/commander`/`/execute`/`/advisor` are real self-invocable Skills (they write `mode.json` for real); `/clear`/`/compact` are not — no tool exists for either, so they're recommended to the human, never self-triggered.
- [platform-quirks/n8n-openrouter-direct-llm-pattern.md](platform-quirks/n8n-openrouter-direct-llm-pattern.md) — the `chainLlm`+`lmChatOpenRouter`+structured-output pattern for the first direct AI judgment call made from n8n itself (INT-010), and why it was a human decision, not self-resolved.
- [platform-quirks/notion-pinecone-kb-pattern.md](platform-quirks/notion-pinecone-kb-pattern.md) — Email Manager's Notion+Pinecone multi-tenant KB design (INT-011/INT-012), why Convocore's KB API was dropped, and both credential gates now closed (Pinecone credential-type fix BC-048; Notion's real root cause was a missing page-level Connections grant, not a secret mismatch — corrected BC-049).
- [platform-quirks/anon-grant-exposure-bc052.md](platform-quirks/anon-grant-exposure-bc052.md) — CRITICAL, fixed: ~40 internal RPCs (read_credential_secret, etc.) were live-exploitable via the public anon key, found + fixed during BC-052. A smaller residual gap (Edge Functions trust client_id from body) is disclosed and still open.

## Reference

- [reference/convocore-doc-status.md](reference/convocore-doc-status.md) — which `05_Platform_Builds/Convocore/` docs are primary/backing/background/optional/superseded, and the BC-057b (2026-08-14) live recheck confirming the REST+MCP billing block is still active on both paths — manual Canvas UI is the fallback build method.

## Open Decisions

- [decisions/calendar-category-sharing.md](decisions/calendar-category-sharing.md) — DECIDED 2026-08-14: one calendar provider at a time, no schema change. Closed.
- [decisions/disconnect-provider-revocation.md](decisions/disconnect-provider-revocation.md) — DECIDED + BUILT (BC-052): real per-provider revoke (Google/Calendly) + honest local-only disclosure (Shopify/WooCommerce) + Reconnect/Refresh. See [[infra/connection-lifecycle-actions]]. Closed.
- [decisions/dashboard-auth-mapping.md](decisions/dashboard-auth-mapping.md) — DECIDED + BUILT (BC-051): `control.dashboard_users` mapping table live. See [[infra/dashboard-auth-mapping]]. Closed.
- [decisions/verification-tier-redesign.md](decisions/verification-tier-redesign.md) — DECIDED + BUILT (BC-053): opt-in third verification tier, default off. See [[infra/verification-approval-queue]]. Closed.
- [decisions/int-008-ownership-release-caller.md](decisions/int-008-ownership-release-caller.md) — DECIDED + BUILT (BC-056): dedicated dashboard action. See [[infra/int008-ownership-release]]. Closed.
