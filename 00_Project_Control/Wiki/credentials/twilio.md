# Twilio

**Status:** current as of 2026-08-05 (BC-005) — schema-only, unchanged since

## What's true now

Twilio has **no Zenny-owned OAuth app**. Every client brings their own
Account SID / Auth Token / phone number entirely independently —
structurally identical to [[woocommerce]]'s manual-key-entry pattern
(`Client_Integration_and_Credential_Platform_v1.md` Part 8.3), not
`oauth_apps`' shared-app model. This was a deliberate decision, not a
gap: `control.oauth_apps`' `twilio` row is a placeholder marker only
(`app_status='not_applicable'`, same shape as WooCommerce's row).

**Category:** ONE category, `telephony` — not separate `voice`/`sms`
categories — since voice and SMS confirmed to share the same underlying
Twilio credential/number (per `Planning_to_Build_Transition_v1.md` Part
2.9/4). `client_config.voice_agent_enabled` and `.sms_agent_enabled`
remain separate boolean flags regardless, since a client could in theory
enable one channel without the other even while sharing one credential.

**Credential shape when real seeding happens:** Account SID + Auth Token
use the same 2-part pattern as WooCommerce's Consumer Key + Consumer
Secret — real per-client rows would use `client_connections`' existing
`secondary_secret_id` column; no new schema column is needed for that.

**No real Twilio credential has ever been seeded** — schema only
(migration 031), per the card that added it being explicitly out of
scope for real seeding. No later log entry records a real Twilio
connection being created or tested.

## Why (if a non-obvious decision)

The single `telephony` category (vs. splitting voice/SMS) reflects that
they're not independently-connectable integrations from a credentials
standpoint — a client can't hold "voice Twilio" and "SMS Twilio" as two
different provider connections, because it's genuinely the same
credential underneath. Splitting them would have implied a distinction
that doesn't exist at the credential layer.

## Gotchas

- Because no real Twilio credential has ever existed, none of the
  Twilio-touching workflow paths have real execution-test coverage the
  way Google/Calendly/WooCommerce paths do — treat any Twilio-dependent
  Tool as unverified against real data until a real credential is seeded
  and tested.
- Don't confuse this with the telephony `category` value used elsewhere
  in this project as a disposable/unused test slot for unrelated
  connection tests (e.g. BC-025's Gmail-notification test used a
  `category='telephony'` row specifically because it was a genuinely
  unused slot with no real credential to risk touching) — that's a
  coincidental reuse of an available category value for test isolation,
  not evidence of a real Twilio connection.

## Source

- `Database — Real Current State (BC-003 live audit, project zenny-vault ONLY)` (2026-08-05)
- `Session Log Archive — Session 7 — BC-005: Phase 2 (6/7 items closed)` (2026-08-05)
