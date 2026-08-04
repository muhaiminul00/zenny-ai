# Database Structure — v3 (Delta from v2)

```
Status: Delta document. All 31 unchanged tables from
Database_Structure_v2_Schema_Based.md carry forward exactly as-is —
not re-transcribed here to avoid copy-error risk. This document contains
ONLY what changed or was added.

When building: use v2 as the base, apply every change below on top of it.
```

---

## CHANGE 1 — `client_config` Restructured (resolves freedom_level_override + conversion_mode_selection)

### `vault.client_config` — NEW VERSION (replaces v2's version entirely)

```
client_id                          | uuid (FK → clients, PK)
                                       — TRULY GLOBAL fields (one value per client, no archetype variance):
language_mode                          | enum (fixed/adaptive)
language_list                             | array of text
default_country_code                         | text
max_booking_horizon                             | number (days)
send_window_start                                  | time
send_window_end                                       | time
after_hours_emergency_contact                            | text, nullable
reactivation_threshold_override                              | number, nullable
email_address                                                    | text
kb_email_file_id                                                    | text, nullable
                                       — PER-ARCHETYPE settings (structured JSONB, keyed by variant):
archetype_settings                                                     | jsonb
```

**`archetype_settings` shape** (one key per archetype/sub-variant the client actually runs):
```json
{
  "commerce_ecom": {
    "freedom_level_override": 5,
    "conversion_mode": "A",
    "cart_value_escalation_threshold": 500,
    "backorder_notification_enabled": true
  },
  "commerce_restaurant": {
    "freedom_level_override": null,
    "conversion_mode": "A",
    "waitlist_enabled": true
  },
  "appointment": {
    "freedom_level_override": null,
    "conversion_mode": "B",
    "appointment_selfservice_link_enabled": true
  },
  "consultation": {
    "freedom_level_override": null,
    "conversion_mode": "A",
    "consultation_scoring_enabled": true,
    "realtime_high_intent_alert_enabled": true
  },
  "engagement": {
    "freedom_level_override": null,
    "conversion_mode": "A",
    "program_reactivation_notification_enabled": false
  },
  "emergency": {
    "freedom_level_override": null,
    "conversion_mode": "A"
  }
}
```

**Why this shape:** A single-archetype client just has one key in `archetype_settings`. A multi-archetype client (Commerce Ecom + Restaurant) has two keys, each independently configurable — solves the exact gap that motivated this change, without a second table. `null` in any sub-field means "use the archetype default," same semantics as the flat nullable columns had in v2.

**Tradeoff, stated honestly:** JSONB is less strictly typed than dedicated columns — a typo in a key name won't be caught by the database the way a wrong column name would be. Mitigate this at the n8n/application layer (validate the JSON shape before writing), not the database layer — consistent with how Step 0B's smarter validation already lives outside the database.

### `{schema}.client_config` — mirrors the same restructure (local synced copy, same shape)

---

## CHANGE 2 — New Table: `vault.agent_prompts` (Vault-only, never synced)

**This is the fix for the actual gap you found.** Message *templates* (customer-facing text) and behavior *prompts* (the LLM instructions governing how the agent thinks) are different in kind, not degree — conflating them into one `templates` table was the mistake.

```
prompt_id                | uuid (PK)
prompt_key                   | text        | e.g. "email_categorization_logic",
                                              "5_condition_gate_evaluation",
                                              "growth_agent_discovery_spin",
                                              "complaint_deescalation_reasoning"
module                          | enum (core_agent/growth_agent/conversion_engine/recovery_engine/email_manager)
archetype                          | enum, nullable    | null = applies across all archetypes
content                               | text             | the actual instruction text
version                                  | number
status                                      | enum (stable/beta)   | per the extracted Version_Control_and_KPI_Framework.md discipline
created_date                                   | date
promoted_to_stable_date                           | date, nullable
```

**Deliberately NOT synced to client schemas, unlike `templates`.** Two reasons converge:

1. **IP protection.** This is the actual encoded intelligence from the whole `Agent_Runtime_System_v1.md` build — keeping it in exactly one place (Vault), never duplicated into N client schemas, is strictly safer than distributing copies.
2. **Solves template-propagation for free, for this category.** v2 flagged "template update propagation isn't automatic" as an open risk for synced content. Because `agent_prompts` is never copied out, that risk doesn't exist here — n8n reads it live from Vault (with a caching layer for performance, refreshed on interval or on-demand trigger), so every client always gets the current version with zero migration/propagation step needed.

**Access pattern:** n8n reads `vault.agent_prompts` directly via `service_role`, caches per-key content for some short TTL (avoids hitting Vault on every single message), invalidates cache on a version bump. This is an n8n-layer implementation detail, not a schema decision — noting it here so it doesn't get lost.

---

## CHANGE 3 — Voiceflow Playbooks: Explicitly NOT Stored in the Database

**Decision: playbook structure stays in Voiceflow, never enters Postgres.**

Reasoning, directly from a principle already established (Batch 3's Implementation Independence): *runtime defines WHAT happens, implementation decides HOW — Voiceflow/n8n/Airtable are replaceable execution layers.* A Voiceflow playbook is Voiceflow's own proprietary canvas/flow format (blocks, conditions, wiring) — it's not portable content, and storing it in the database would create *false* portability: it would look migrated when the SaaS/LangGraph rebuild happens, but it would actually still need to be rebuilt from scratch, since LangGraph doesn't read `.vf` files.

**What actually needs to be platform-independent and DB-stored:** the *content* — which is exactly what `vault.agent_prompts` and `templates` now hold. That content is what a future LangGraph implementation reads and uses; the Voiceflow playbook is just today's specific wiring of it.

**What to do with the `.vf` files themselves:** you already have a practice of keeping Voiceflow backups (confirmed present from the earlier project reorganization). Recommend upgrading this from a backup folder to **actual version control** (a git repo, even a simple one) — gets you real diff/rollback history, which a folder of dated `.vf` exports doesn't give you. This is a build-process improvement, not a database change.

---

## CHANGE 4 — Resolved Items (concise, from the previous 8-gap sweep)

```
RLS:            Default-deny for `anon`/`authenticated` on every table, in
                every schema (Vault + all client schemas). n8n's
                `service_role` key bypasses RLS by design — that's the
                actual security boundary right now, since no client-facing
                dashboard exists yet. Granular per-role RLS policies only
                become necessary if/when a client-facing app is built
                later using the `authenticated` key.

INDEXING:       Index every FK column, plus: leads.status,
                leads.created_date, recovery_queue.next_follow_up,
                emails.thread_lifecycle, customers.primary_contact_method.

N8N AUTH:       service_role key, via transaction-mode pooler connection,
                stored as an n8n credential (not hardcoded per workflow).

BACKUPS:        Correction from v2 — this applies to the WHOLE project
                (Vault + every client schema), not just Vault. Free tier
                has zero automated backups; use the documented
                GitHub-Actions + Cloudflare-R2 scheduled pg_dump pattern
                across the whole database.

DB VALIDATION:  Lightweight Postgres CHECK constraints for cheap,
                high-value invariants only (email format regex,
                non-negative numeric fields). Step 0B's smarter
                validation (typo suggestions, country-aware phone rules)
                stays at the n8n/application layer — too complex for a
                CHECK constraint.

ENUM vs TABLE:  True Postgres ENUM for anything structurally fixed by the
                runtime architecture: conversion_state, escalation_priority,
                session_state, recovery_queue.status, email_status,
                thread_lifecycle, match_confidence, ownership_state.
                Reference table (FK) for anything client-extensible:
                email_categories, templates — already correctly designed
                this way in v2, no change needed there.
```

---

## Updated Summary Table Count

```
VAULT:                       8 tables   (7 from v2 + agent_prompts)
EACH ARCHETYPE TEMPLATE:
  Common tables:              20  (unchanged from v2, client_config's
                                    internal structure changed but table
                                    count is the same)
  Archetype-specific:          1  (Emergency/Appointment/Consultation/Engagement)
                                2  (Commerce — Ecom + Restaurant)

TOTAL DISTINCT TABLE STRUCTURES: 8 + 20 + 6 = 34
```

---

## Remaining Open Items (carried forward, none blocking)

Nothing outstanding from the 8-gap sweep — all resolved above. The only genuinely open items now:

1. Template Update Propagation for *synced* content (`templates`, `email_categories`, `recovery_cadence_profiles`) — still no defined migration process for "client schema already copied, template improves later." (`agent_prompts` solved this for prompts specifically by not syncing at all — the same *pattern* could be reconsidered for these three tables too, if propagation turns out to be a recurring pain point. Worth revisiting once real clients exist, not now.)
2. Voiceflow `.vf` backup folder → real git version control — a process improvement, not a schema task, whenever convenient.

This schema is now ready to move to actual SQL migrations.
