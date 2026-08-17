# Slack — Deprecated

**Status:** current as of 2026-08-06 (BC-025)

## What's true now

Slack is **fully removed** as a client-facing integration and formally
marked deprecated. `control.oauth_apps`' `slack` row carries a real
`app_status = 'deprecated'` value (migrations 051-052, additive to the
existing CHECK constraint) — a directly-queryable, closed-decision
signal, not just a comment or a placeholder anymore.

- Removed entirely from the dashboard: `Integrations.tsx`'s
  `notification` category, its Slack `ProviderOption` entry, and its
  `CATEGORY_LABELS` entry are all gone (not hidden, not disabled).
  `ARCHETYPE_CATEGORIES` no longer lists `'notification'` for any
  archetype. No dashboard file references Slack as something a client
  configures.
- Removed entirely from workflows: SCH-006's 4 Slack alert nodes and
  Tool Execution Fallback's Slack node were both deleted (not
  disabled-in-place) and replaced with a real Gmail-based notification
  chain through UTIL-004. See [[vault-storage-pattern]] for the general
  credential pattern and the current notification mechanism below.
- The original captured Slack bot token (Vault UUID
  `8e8c4638-85b0-40e4-b02b-a69798b3acfb`, `client_id` literal placeholder
  `'SLACK_BOT_TOKEN_MODE_NO_OAUTH_APP'`) still exists as an orphaned row
  from early sessions — harmless, unreferenced, not cleaned up.

**Current notification mechanism (replaces Slack entirely):** UTIL-004,
using a real `zenny-notification-sender` n8n Gmail credential, with two
genuinely distinct paths — internal ops alerts (to
`zenny.zeromanual@gmail.com`) and client-facing alerts (to that client's
own contact email via `get_client_contact_email`, a new public RPC).
Both paths are verified with real Gmail message IDs (not just "no
error").

## Why (if a non-obvious decision)

A real, working multi-tenant Slack OAuth app was never built — only a
single captured bot token, which is not a substitute for a real
per-client Slack OAuth app in this multi-tenant model
(`Client_Integration_and_Credential_Platform_v1.md` Part 8.4 always
described Slack as ONE Zenny-owned INTERNAL app — `chat:write` only —
never a per-client integration). Slack should never have been exposed as
a client-facing "Connect" option on the dashboard in the first place;
its earlier appearance there was a design mismatch, not a feature
regression when removed.

## Gotchas

- If Slack notifications are ever revisited, this is a genuinely new
  build (a real multi-tenant "Add to Slack" OAuth app), not a matter of
  un-deprecating the existing placeholder row — the placeholder was
  never a working mechanism to begin with.
- A real, independent bug was found while proving the Gmail replacement
  worked: SCH-006's 3 `Refresh *** Token` nodes use
  `onError: continueErrorOutput`, which routes failures to a SEPARATE
  output pin (index 1) — but the workflow's connections graph only ever
  wired output 0 (success) downstream, so real refresh failures had been
  silently dead-ending since the workflow was built. Both this and a
  related strict-type-validation crash on real error objects were fixed
  in the same session Slack was removed — worth remembering that
  "this workflow passed its tests" can still mean the failure branch was
  never actually exercised.

## Source

- `Phase 5 — Slack Removal + Gmail-Based Notifications + Scope-Request Verification (BC-025)` (2026-08-06)
- `Credentials — Real Current State` (2026-08-05, BC-004-era content, pre-deprecation)
- `Phase 5 — 3 Defect Fixes From Manual Testing (BC-018)` (2026-08-05)
