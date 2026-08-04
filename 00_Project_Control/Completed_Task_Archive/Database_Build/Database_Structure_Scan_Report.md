# Database Structure — Scan Report
### Phase 1 of 2: Findings & Proposed Structure (not yet the final column-by-column schema)

```
Purpose: Cross-check Agent_Runtime_System_v1.md (primary source) against the
old n8n/Airtable docs (reference only) and produce the entity/table
inventory, organized by module, before drafting actual columns.
Status: Scan complete. Awaiting your review before Phase 2 (full
column-by-column plaintext draft).
```

---

## Headline Finding: The Old Docs Are Structurally Incompatible, Not Just Incomplete

This isn't a "few fields missing" situation. The old n8n/Airtable docs were built for a **4-hardcoded-business Sprint-01 demo** (Ember, GlowWell, Precision, GrowthPath — literal business names baked into records and even into workflow logic like "if Ember → 3-step cadence"). Confirmed patterns that must NOT carry forward:

- **One shared Airtable base, `Business` as a Single Select field** — not real multi-tenancy, just a filter column. Your Vault/Client split replaces this entirely.
- **Recovery cadences hardcoded per literal business name** in n8n workflow logic (WF-101–104), not read from config — directly contradicts your "everything pulled from database" requirement.
- **No prompt/template storage anywhere** — Voiceflow held all conversational content directly; n8n's email templates were inline Set Nodes. This concept doesn't exist in the old docs at all. It's new, not a migration.
- **Score tiers, recovery profiles, email levels — all Single Select fields with fixed options**, not config-driven per client.

The old docs are useful for one thing: **confirming which fields were already known to be needed** (e.g., `Gmail Thread ID`, `KB Email File ID`, the 4-tier score system) — cross-referenced below per module. Everything structural is superseded.

---

## Proposed Vault vs. Client Split (high level — table names, not columns yet)

### VAULT (Central Control DB — ZeroManual-owned, one row per client)

| Table | Purpose | Confirms/New vs. old docs |
|---|---|---|
| `clients` | Master client registry — identity, status, billing tier | New structure; old docs had no client-registry concept at all |
| `client_config` | The full Runtime Configuration Resolver payload per client (Step 1C.0) — one row per client, synced to each Client DB's local copy | Old docs' "Business Config" table is the closest ancestor, but that had 7 fields; this needs ~30+ (see Module inventory below) |
| `client_prompt_templates` | Master copy of all prompt/message templates per client (greetings, escalation language, recovery messages, KB content pointers) — **new requirement, no old-doc equivalent** | Entirely new |
| `sync_log` | Records every push from Vault → Client DB, for audit/troubleshooting | New — needed because you specifically want the Vault to be safely, manually editable without breaking live systems |

### CLIENT DB (one instance per client, copied from template)

Every module's operational tables live here — inventory below, organized by module. This is where the bulk of the actual schema work is.

---

## Per-Module Entity Inventory

For each module: what the runtime doc requires, what the old docs already anticipated (confirms), and what's genuinely new/changed.

---

### Universal Runtime Layer (cross-cutting — not module-specific, but every module reads/writes these)

| Entity | Runtime doc source | Old docs status | Verdict |
|---|---|---|---|
| Session state (New/Returning/Existing/Dormant) | Step 1A | Old docs had `Status` (New/Active/Qualified/Booked/Closed/Escalated) on Leads — different, transaction-stage not session-identity | **New table needed**: `sessions` or session-adjacent fields on a customer/contact table |
| Concurrent session dedup | Step 1A addition | Not present | New |
| Local config copy (synced from Vault) | Step 1C.0 | Old docs' Business Config (7 fields) is the ancestor | **Major expansion** — see Vault `client_config` above; local copy mirrors it |
| Customer Memory (Level 2) | Step 0C | Leads table's `AI Summary` (Long Text) is the closest ancestor — but that's unstructured text, not the structured `customer_preferences` field Batch 3 flagged as needed | **New structured table needed** — `customer_preferences` was explicitly flagged in Appendix A as never having a real field, only living in free text |
| Memory freshness / staleness | Step 0C §3.1 | Not present | Logic-only (computed from timestamps), no new column beyond existing date fields |
| Escalation record | Module 1D | Old docs' `Escalations` table existed but with fewer fields | **Expand**: add `escalation_type`, `escalation_reason`, `escalation_priority`, `origin_module`, `trigger_condition` (all explicitly named in Appendix A, confirmed never actually built) |
| Tool call execution log | Step 1D.3 (Batch 3) | Not present — old docs had no generic tool-call tracking, only per-workflow error logging (WF-501) | **New table**: `tool_call_log` — generalizes WF-501's error logger to the full REQUESTED→WAITING→SUCCESS/FAILED/TIMEOUT lifecycle |
| Validation state per field | Step 0B §7.4 | Old docs' WF-503 Data Validator checked format but had no persistent `validation_flag`/`validation_notes` storage — validated inline, then discarded | **New fields needed on every record type that collects customer data** |
| Language config | Step 1C, Language Config Fix | Not present anywhere in old docs | New — `language_mode`, `language_list` per client |

---

### Module 1 — Core Agent

| Entity | Runtime doc source | Old docs status | Verdict |
|---|---|---|---|
| Customer verification tier (Zero/Low/High-risk) | Module 1 §B | Not present | New — likely a computed/logic field, not stored, but worth a flag on sensitive-action records |
| Complaint/de-escalation record | Module 1 §C | No dedicated complaint table — folded into general Leads/Status | Consider whether complaints need their own table or a `record_type` on a general interaction log |
| Human handoff — ownership state (AI/Human/Collaborative) | Module 1 §D, §2.4 (Module 5, reused) | Old docs' Escalations table had no ownership-state field | **New field**: `ownership_state` on escalation records |
| Off-topic redirect counter | Module 1 §E | Not present | Likely session-scoped, not persisted — logic only |

---

### Module 2 — Growth Agent *(renamed from Revenue Agent — confirming this applies to all field names below)*

| Entity | Runtime doc source | Old docs status | Verdict |
|---|---|---|---|
| Lead core record | Module 2 general | Old docs' `Leads` table is a strong ancestor — Lead ID, Business, Archetype, Name, Phone, Email, Source Channel, Intent, Lead Score, AI Summary, Last Interaction, Status, Recovery Profile, Created Date | **Keep as base, heavily extend** — see event tracking below |
| Buying stage (Explorer/Evaluator/Ready) | Module 2 §A.0 | Not present | New field, likely on the lead/session record |
| Growth Event Tracking (was "Revenue Event Tracking") | Module 2 §4 | Not present in old docs at all — old `Leads` table had no discovery/objection/upsell tracking | **New table or extended Leads columns**: `growth_buying_stage`, `recommended_solution`, `recommendation_reason`, `objection_type`, `objection_resolved`, `upsell_offered`, `upsell_accepted`, `growth_exit_type` |
| Handoff payload to Conversion Engine | Module 2 §3 | Not present as a structured payload — old n8n passed loose webhook fields | **New structured object**: `intent`, `selected_solution`, `customer_preferences`, `resolved_objections`, `pending_questions`, `captured_contact_fields`, `source_module` |

---

### Module 3 — Conversion Engine

| Entity | Runtime doc source | Old docs status | Verdict |
|---|---|---|---|
| Conversions table (core) | Module 3 general | Old docs' `Conversions` table exists, with "archetype-specific fields" mentioned but not fully enumerated in what I've pulled so far | **Keep as base, needs full archetype-specific column audit** (Phase 2 work) |
| Conversion State Machine | Module 3 §1.1 | Old docs had no state machine — a Conversion record was just created once, no lifecycle | **New field**: `conversion_state` (INTENT_CONFIRMED/DATA_COLLECTION/ACTION_PENDING/CONFIRMED/FAILED_RECOVERABLE/FAILED_ESCALATION/CANCELLED) |
| Duplicate Action Protection | Module 3 §1.2 | Not present | Logic-only, but requires an indexed lookup (customer + type + item/time) — schema should support this query efficiently |
| Consultation Score Gate | Module 3, Consultation | Old docs had this — `WF-002` explicitly enforces "Score Gate: <50 = reject" | **Confirms** — keep, already validated |
| Conversion Event Tracking | Module 3 §5.2 | Not present | **New fields**: `conversion_type`, `conversion_mode`, `source_module`, `required_fields_status`, `external_action_status`, `failure_reason`, `final_state`, `recovery_eligible` |
| Archetype-specific config flags | Module 3, Batch 3 additions | Not present | **New**: `cart_value_escalation_threshold`, `backorder_notification_enabled`, `waitlist_enabled`, `appointment_selfservice_link_enabled`, `consultation_scoring_enabled`, `realtime_high_intent_alert_enabled`, `program_reactivation_notification_enabled` — these belong in `client_config` (Vault), not per-record |
| Google Calendar event linkage | Old docs (WF-002) | Present — confirmed real integration need | **Confirms** — keep a calendar_event_id field |

---

### Module 4 — Recovery Engine

| Entity | Runtime doc source | Old docs status | Verdict |
|---|---|---|---|
| Recovery Queue (core) | Module 4 general | Old docs' `Recovery Queue` table exists — Next Follow-Up, Attempt Count, Recovery Status, Recovery Profile | **Keep as base, but cadences must move from hardcoded-per-business-name to config-driven** (critical fix per your instruction) |
| Recovery Status values | Module 4 §6 | Old docs use `Active/Stopped/Failed` — **but the runtime doc explicitly corrected this**: "Failed" was rejected, replaced with `Active/Paused/Completed/Stopped` | **Direct conflict — runtime doc wins.** Old docs' "Failed" status must NOT be used. |
| Cadence definition | Module 4 §3 | Old docs hardcode cadences per business name in workflow logic (WF-101 = Emergency = 15min→6hr→24hr, etc.) | **Must become data**, not workflow logic — new table: `recovery_cadence_profiles`, config-driven per archetype, referenced by `client_config` |
| Time-of-Day Suppression | Module 4 §3.1 | Not present | New — `send_window_start`, `send_window_end` (Vault, per-client config) |
| Suppression / opt-out | Module 4 §5 | Not present | New table: `suppression_records` — includes the pre-record `suppression_only_record` pattern (contact_method + opt_out_timestamp, independent of any Lead existing yet) |
| Human ownership flag | Module 4 §7.1 | Not present | New field: `human_ownership_flag` |
| Enterprise Sources A-I | Module 4 §8 | Not present — old docs only had conversation-origin recovery | New: `recovery_source` field (A-I), plus this is the piece requiring actual webhook intake infrastructure, not just schema |
| Score-aware messaging (Consultation) | Module 4 §4 | Old docs confirm this exists — WF-103 "Score-Aware: if Lead Score ≥ 70 → re-triggers WF-302" | **Confirms**, keep the pattern, but message content itself must move to the new prompt-template system, not hardcoded |

---

### Module 5 — Email Manager

| Entity | Runtime doc source | Old docs status | Verdict |
|---|---|---|---|
| Emails table (core) | Module 5 general | Old docs' `Emails` table exists — Gmail Thread ID, Gmail Message ID, Draft Content | **Keep as base — these 2 Gmail fields are real integration necessities, confirmed useful** |
| Email categories | Module 5 §2.1, §5 | Old docs have a **fixed** category list (Single Select) | **Direct conflict with your requirement** — categories must become a config-driven, per-client-extensible table (`email_categories`), not a fixed enum, per your explicit instruction and Batch 3's own "category extensibility" addition |
| Autonomy level + reply style | Module 5 §3, §3.2 | Old docs have `Email Level` (1/2/3) per business, fixed | **Expand**: keep the level concept but add `reply_style` (scripted/generative) per category, per Batch 3 |
| Thread Lifecycle vs Email Status | Module 5 §2.3 (Batch 3) | Old docs only had Email Status equivalent (implied: New/Draft/Sent/Escalated) | **New field required**: `thread_lifecycle`, kept separate from a technical status field, per Batch 3's explicit resolution |
| Attachment handling | Module 5 §2.6 (Batch 3) | Not present | New: `attachments` table or field, with type classification |
| Channel Identity Resolution | Module 5 §2.7 (Batch 3) | Not present | New: `channel_identity_links` table — email/phone/chat/WhatsApp IDs → one customer |
| Global Active Issue Lock | Module 5 §2.9 / Step 1.H | Not present | New field: `active_issue_owner`, likely on the core customer/session record, referenced by every module |
| Bounce/spam-complaint | Comprehensive scan addition | Not present | New: `email_bounce_status` |
| Learning Loop capture | Module 5 §3.2 (was §3.1) | Not present | New table: `draft_edit_log` — AI draft vs. human-approved version, edit category |

---

## New Cross-Cutting Requirement: Prompt/Template System

This didn't exist in any old doc and needs real design attention in Phase 2 — flagging now so you can weigh in on scope before I draft it.

**What it needs to support** (per your "fully database-based" instruction):
- Per-archetype message templates (greetings, recovery cadence messages per step, escalation handoff language)
- Per-client personalization (business name, tone, specific policy language) layered on top of archetype-level defaults
- Per-language variants (ties directly to `language_mode`/`language_list`)
- Versioning (so a template change doesn't silently break something live — echoes the Version Control framework already extracted from Modular)

**Open design question for Phase 2:** should this be one flexible `templates` table (template_key, archetype, client_id, language, content, version) or several purpose-specific tables (greeting_templates, recovery_message_templates, escalation_templates)? I lean toward one flexible table with a `template_type` column — easier to extend without schema migrations every time a new message type appears — but this is a real design choice worth your input.

---

## Summary of Major Deltas From Old Docs

1. **Multi-tenancy**: single shared base → Vault + per-client DB copies
2. **Recovery cadences**: hardcoded per business name in workflow logic → data-driven config table
3. **Email categories**: fixed Single Select → extensible, config-driven table
4. **Prompts/messages**: hardcoded in Voiceflow/n8n → new database-driven template system (entirely new concept)
5. **Recovery Status "Failed"**: old docs use it, runtime doc explicitly rejected it → runtime doc wins, must not carry forward
6. **~25 new fields** across Escalation, Conversion, Growth, Recovery, Email records that Appendix A already named but were never actually implemented in any prior build
7. **Renamed fields**: any old-doc field named around "Revenue" should become "Growth" per your rename decision

---

## Before Phase 2 (full column-by-column draft) — Questions for You

1. **Prompt/template table structure** — one flexible table vs. several purpose-specific tables (see above)? **Ans:** One flexible table is better.
2. **Complaint records** — own table, or folded into a general interaction/escalation log with a `record_type` field? **Ans:** Own table.
3. **Should the Conversions table stay one wide table with many nullable archetype-specific columns** (matching the old docs' apparent approach), **or split into a core table + archetype-specific extension tables** (cleaner, avoids a Conversions table with 40+ mostly-null columns)? This is a real schema-design decision worth deciding before drafting. **Ans:** Core + extension tables.
