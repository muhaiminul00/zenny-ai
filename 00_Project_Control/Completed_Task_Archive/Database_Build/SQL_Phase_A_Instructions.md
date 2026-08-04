# SQL Migration — Phase A: Schema & Table Creation

```
Task:      Translate Database_Structure_v3.md into real Postgres/Supabase
           SQL migration files.
Status:    Approved. First of 3 phases (A: tables, B: template assembly,
           C: onboarding automation spec).
Source:    06_Infrastructure/Database/Database_Structure_v3.md — read in
           full before starting. This is the complete spec; do not
           improvise structure beyond what it defines.
```

---

## Scope of This Phase

Produce migration files that create:
1. The `control` schema and its 8 tables
2. All 21 common tables (as a reusable definition — these get created once per template schema in Phase B, but the column definitions are written once here)
3. All 6 archetype-specific extension tables

**This phase does NOT create the 5 `tpl_*` schemas themselves or copy tables into them** — that's Phase B, which references this phase's output.

---

## File Structure

```
06_Infrastructure/Database/migrations/
  001_create_control_schema.sql
  002_create_control_tables.sql
  003_create_enum_types.sql
  004_create_common_tables_template.sql
  005_create_archetype_specific_tables_template.sql
  006_create_indexes.sql
  007_enable_rls.sql
```

Use sequential numbering — this is standard Postgres migration convention and makes execution order unambiguous.

---

## Requirements Per File

### `001_create_control_schema.sql`
`CREATE SCHEMA IF NOT EXISTS control;`

### `002_create_control_tables.sql`
All 8 Control schema tables from Database_Structure_v3.md §3, translated to real Postgres DDL:
- `control.clients`
- `control.client_active_modules`
- `control.client_config` (including the `archetype_settings JSONB` column — use `jsonb`, not `json`, per Postgres best practice for indexed/queryable JSON)
- `control.templates`
- `control.email_categories`
- `control.recovery_cadence_profiles`
- `control.agent_prompts`
- `control.sync_log`

Use `uuid` type with `DEFAULT gen_random_uuid()` for all PK columns (Supabase has `pgcrypto` enabled by default, supporting this). Use `timestamptz` for all timestamp columns (not bare `timestamp`) — timezone-aware is the correct default for a system with multi-region clients per the language-config work already done. Use `date` for date-only columns as specified.

### `003_create_enum_types.sql`
Create every ENUM type referenced across the whole document as a named Postgres type, so they can be reused across schemas without redefinition. Per §6's "ENUM vs TABLE" resolution — ENUMs only for structurally-fixed values, everything else (`email_categories`, `templates`) is already a reference table, not an enum.

List every enum needed (cross-reference the full document carefully — do not miss any):
```
client_status_enum, module_name_enum, language_mode_enum,
template_type_enum, category_scope_enum, delay_unit_enum,
prompt_module_enum, prompt_status_enum, sync_status_enum,
sync_trigger_enum, session_state_enum, channel_type_enum,
match_confidence_enum, issue_owner_enum, issue_reference_type_enum,
lead_status_enum, objection_type_enum, buying_stage_enum,
growth_exit_type_enum, conversion_mode_enum, conversion_state_enum,
source_module_enum, required_fields_status_enum,
external_action_status_enum, recovery_source_enum, recovery_status_enum,
email_status_enum, thread_lifecycle_enum, reply_style_enum,
bounce_status_enum, attachment_type_enum, edit_category_enum,
escalation_priority_enum, ownership_state_enum, escalation_status_enum,
tool_call_state_enum, archetype_enum, source_channel_enum
```
(This list is a starting point from a careful read — verify against the actual document and add/correct as needed. Report any enum you add beyond this list, and any you determine is unnecessary/redundant with another.)

**Important naming collision to check:** `archetype_enum` values include `commerce` — but `conversions_ecom`/`conversions_restaurant` split Commerce into two extension tables. Confirm whether `leads.archetype` needs values `commerce_ecom`/`commerce_restaurant` as distinct enum values (matching `archetype_settings`' JSON keys) or just `commerce` (with the sub-variant distinguished by which extension table has a matching row). Pick one and apply it consistently — flag your choice in your completion report since the source document doesn't fully disambiguate this.

### `004_create_common_tables_template.sql`
All 21 common tables, written as a single reusable SQL file — **written generically, without a schema prefix** (relying on whatever schema is set as the active `search_path` at execution time). This file gets executed once per template schema in Phase B; do not hardcode `tpl_emergency.` or any specific schema name into it.

Tables (per §4): `client_config`, `templates`, `email_categories`, `recovery_cadence_profiles`, `kb_entries`, `customers`, `channel_identity_links`, `customer_preferences`, `active_issues`, `leads`, `complaints`, `growth_events`, `growth_handoff_payload`, `conversions`, `recovery_queue`, `suppression_records`, `emails`, `attachments`, `draft_edit_log`, `escalations`, `tool_call_log`.

Note: the local `client_config`, `templates`, `email_categories`, `recovery_cadence_profiles` tables mirror their Control counterparts' structure exactly — do not redefine the structure differently, copy the column definitions faithfully.

### `005_create_archetype_specific_tables_template.sql`
All 6 archetype-specific extension tables, same schema-agnostic approach as file 004: `conversions_emergency`, `conversions_ecom`, `conversions_restaurant`, `conversions_appointment`, `conversions_consultation`, `conversions_engagement`.

**Each of these has a FK to `conversions(conversion_id)`** — since this file is schema-agnostic and gets applied within whichever `tpl_*` schema is active, this FK resolves correctly as long as file 004 (which creates `conversions`) has already run in that same schema first. Note this dependency clearly in the file's header comment.

### `006_create_indexes.sql`
Per §6/§7's resolved indexing requirements: every FK column, plus `leads.status`, `leads.created_date`, `recovery_queue.next_follow_up`, `emails.thread_lifecycle`, `customers.primary_contact_method`. Written schema-agnostically like files 004/005 — applies within whichever schema is active.

### `007_enable_rls.sql`
Per §6's resolved RLS approach: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` on every table (Control schema tables in this file's Control-specific section, common/archetype tables in a schema-agnostic section), with **no permissive policies created** for `anon`/`authenticated` — default-deny is achieved by RLS being enabled with zero matching policies. Confirm `service_role` bypasses RLS by default in Supabase (it does, by Supabase's own design) — do not create an explicit policy for `service_role`, since none is needed.

---

## Constraints

1. **Follow Database_Structure_v3.md exactly.** Do not add columns, tables, or constraints beyond what it specifies. If something is genuinely ambiguous (like the `archetype_enum` question above), make a reasoned choice and flag it — don't silently invent structure.
2. **No cross-schema foreign keys** — per §6, Item 2. Every FK in files 004/005/006 stays within the schema it will be applied to.
3. **JSONB shape validation is NOT enforced at the database level** — per the design doc's explicit tradeoff acceptance (§3, `client_config`). Do not add a CHECK constraint attempting to validate `archetype_settings`' internal JSON shape; that's explicitly an application-layer responsibility.
4. **Do add the lightweight CHECK constraints** specified in §6 (email format regex, non-negative numeric fields) — these are explicitly approved for database-level enforcement, unlike the JSONB shape.
5. Do not touch anything outside `06_Infrastructure/Database/migrations/`.

---

## Deliverable

1. All 7 migration files created, in `06_Infrastructure/Database/migrations/`.
2. A summary report listing every enum type created (confirming/correcting the starting list above).
3. Your resolution of the `archetype_enum` Commerce sub-variant question, with reasoning.
4. Confirmation that files 004/005/006/007's schema-agnostic sections contain no hardcoded schema name.
5. List of every CHECK constraint added, with what it validates.

STOP after Phase A. Do not begin Phase B (template assembly script) or Phase C (onboarding automation spec) without a separate prompt — those depend on Phase A's actual output (exact enum names, exact table structure) being confirmed first.
