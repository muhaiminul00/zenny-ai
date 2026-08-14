# Convocore Agent Intake Checklist (v1)

```
Status:     v1. Built BC-058 (2026-08-14).
Purpose:    The single input document for building one real Convocore
            agent + its Zenny backend record, for a demo business built
            by us and shown to that client (not client self-onboarding).
            This is also the seed of onboarding-manual v1 — the same
            document, not a separate draft-then-rebuild pass.
Sources:    Client_Onboarding_Guide.md (archetype diagnostic, workbook
            template — wording reused verbatim where it already works),
            the 3 primary Convocore docs (Agent_Build_Order_Guide_v2,
            Canvas_Ground_Truth_FINAL, Adapter_Spec_FINAL), and a live
            Supabase schema read (2026-08-14) — not the older
            Client_Onboarding_Sequence_Spec.md, flagged stale in
            Wiki/log.md BC-057b entry.
How to use: Give Claude a business website/description. Claude fills
            every AUTO row directly. What's left in the ASK rows is the
            real, short question list to send to the business. Once
            answered, this same filled document is BC-060's build input
            — no second document, no re-derivation.
```

---

## Before you start: what this checklist does NOT cover

The Convocore node **prompt text itself** — the actual embedded module
logic (Core Agent, Growth Agent, Conversion Engine, etc.) written into
each node's Instructions — is **not a checklist answer**. Per
`Convocore_Agent_Build_Order_Guide_v2.md` Part 6.2's Doc-Search-First
rule, that text is authored at build time (BC-060) directly from
`Agent_Runtime_System_v1.md`'s per-module sections, using the module
list from Q8 below to know which sections apply. This document tells
BC-060 *which modules, channels, and settings*; it does not write the
prompts themselves.

**Real finding, flagged here for visibility:** `control.agent_prompts`
(`prompt_key, module, archetype, content, version, status`) already
exists in the live schema — it looks like scaffolding for exactly the
"Template Dashboard" that `Convocore_Adapter_Spec_FINAL.md` Part 8.2
says doesn't exist yet. Whether it's actually wired to anything or a
dormant leftover is unknown — not investigated further in this card
(out of scope), disclosed rather than assumed either way. Worth a
direct look before BC-060 if manual prompt-authoring turns out to
duplicate something this table already half-solves.

---

## A. Business & Archetype Identity

| # | Question | Feeds → | Source | Answer |
|---|---|---|---|---|
| A1 | Business name | `clients.business_name`; Convocore agent display name | AUTO (website) | |
| A2 | What does this business do / primary industry | Archetype diagnostic context | AUTO (website) | |
| A3 | Why does a customer typically contact this business — the actual interaction pattern (urgent problem? known purchase? booking a slot? needs to be advised first? mission-driven?) | Archetype Fit Diagnostic Q1-Q5 (`Client_Onboarding_Guide.md` §1.5) | AUTO-draft from website, confirm if diagnostic result is ambiguous | |
| A4 | Resulting archetype (Emergency / Commerce-Ecom / Commerce-Restaurant / Appointment / Consultation / Engagement) | `clients.archetype` (`archetype_enum`) | AUTO — output of A3's diagnostic run | |
| A5 | Does this business run more than one distinct customer journey (e.g. dine-in + delivery, consulting + a self-serve product)? | `clients.secondary_archetypes` | AUTO-suggest from website, ASK to confirm | |
| A6 | Brand voice / tone description | Convocore Global Prompt identity | AUTO-draft from website copy, ASK to confirm | |
| A7 | Agent name preference | `convocore_agent_map.agent_display_name` | AUTO — default `{business_name} Assistant` (confirmed convention, `Planning_to_Build_Transition_v1.md` §2.5); ASK only if they want something else | |

## B. Convocore Agent Configuration

| # | Question | Feeds → | Source | Answer |
|---|---|---|---|---|
| B1 | Which modules are active? (Core always on; Growth Agent / Conversion Engine / Recovery Engine / Email Manager per purchase) | `control.client_active_modules`; Canvas node structure — one node per active module | ASK | |
| B2 | Which channels? (Web, WhatsApp, Instagram, Messenger, Telegram, Voice) | Convocore channel connections; Part 1 build planning | ASK | |
| B3 | Voice needed? | `client_config.voice_agent_enabled`; rules out Google Live if multi-node (near-certain given B1) | ASK | |
| B4 | SMS needed? | `client_config.sms_agent_enabled` — per-client opt-in only, never default | ASK | |
| B5 | Freedom level — archetype default, or an override + business rationale? | `client_config.archetype_settings` (jsonb — exact key shape not yet confirmed live, inspect a real row before BC-060 rather than assume) | ASK only if override wanted | |
| B6 | Conversion mode per archetype (Mode A Agentic / B Assisted / C Human Handoff) | Same `archetype_settings`; Convocore Custom Tool wiring | Derived from Section D's integration answers — fill after D | |
| B7 | Language config — fixed or adaptive, which language(s)? | `client_config.language_mode` / `language_list` | AUTO-guess from website language, ASK to confirm; default adaptive/single | |
| B8 | Operating hours / send-window override | `client_config.send_window_start` / `send_window_end` (default 08:00–20:00 local) | AUTO from published hours, ASK to confirm | |
| B9 | Escalation contact(s) — who receives P1/P2/P3 | Convocore `human-handoff` Tool's `team_key` / notify-emails | ASK | |
| B10 | After-hours emergency contact (Emergency archetype only) | `client_config.after_hours_emergency_contact` | ASK, only if A4 = emergency | |
| B11 | Recovery Engine cadence — archetype default or override? | `clients.max_recovery_steps` / `control.archetype_recovery_defaults` | ASK, only if B1 includes Recovery Engine | |
| B12 | Service/product catalog, pricing, policies, FAQ | Convocore Knowledge Base content | AUTO-draft from website scrape, ASK to fill gaps (pricing/policies are often not fully public) | |
| B13 | Lead Qualification Funnel setup — steps, point weights, notification thresholds | Convocore's own dashboard config (`Convocore_Adapter_Spec_FINAL.md` Part 9 — primary lead-scoring mechanism, real per-client setup required) | ASK — what counts as "qualified" is a business call | |

## C. Backend / Supabase Provisioning

Grounded in a live schema read (2026-08-14), not the older sequence
spec — see the flag at the top of this document.

| # | Question | Feeds → | Source | Answer |
|---|---|---|---|---|
| C1 | `client_id`, `client_schema_name` | System-generated (`client_{client_id}_{business_slug}`), via `create_client_schema_from_template(p_archetype, p_specific_tables, p_client_schema)` | AUTO | |
| C2 | Billing tier — is this a demo/internal build or a real paying tier? | `clients.billing_tier` | ASK (internal decision) | |
| C3 | Client status at build time | `clients.status` (`client_status_enum`) | AUTO = `onboarding` until go-live | |
| C4 | Dashboard user(s) — who logs in, what role | `dashboard_provision_user(p_auth_user_id, p_client_id, p_role)` | ASK | |
| C5 | Default country code, max booking horizon | `client_config.default_country_code` / `max_booking_horizon` | AUTO from business locale, confirm | |
| C6 | Cart-value escalation threshold, waitlist enabled | `client_config.cart_value_escalation_threshold` / `waitlist_enabled` | ASK, only if Commerce/Appointment-relevant | |

## D. Integration Credentials

| # | Question | Feeds → | Source | Answer |
|---|---|---|---|---|
| D1 | Calendar system in use (Google Calendar / Calendly / none) | Our own OAuth platform, **not** Convocore's native calendar tools (`Convocore_Canvas_Ground_Truth_FINAL.md` Part 8 #3) | ASK | |
| D2 | Ecommerce platform (Shopify / WooCommerce / none) | Shopify: confirmed exception, routed through Convocore's native tool via our credential platform (`Convocore_Adapter_Spec_FINAL.md` Part 10). WooCommerce: our own OAuth, no Convocore-native path. | ASK | |
| D3 | Voice: Twilio Account SID + Auth Token + phone number (only if B3 = yes) | `client_config.client_voice_number`; Credential Gate — never invented, human supplies | ASK | |
| D4 | SMS: Twilio SMS-capable number (only if B4 = yes) | `client_config.client_sms_number`; Credential Gate | ASK | |
| D5 | Email connection for Email Manager (only if B1 includes Email Manager) | `client_config.email_address`; Gmail via UTIL-006 | ASK | |

---

## Document Changelog
- **v1** — built BC-058 (2026-08-14). Merges `Client_Onboarding_Guide.md`'s
  archetype diagnostic + workbook fields with the 3 primary Convocore
  docs' genuine business-decision inputs, cross-checked against a live
  Supabase schema read rather than the stale sequence spec.
