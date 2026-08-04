# Client Onboarding Sequence — Concrete Spec

```
Status:    Phase C, Part 2. This is the real n8n workflow design basis
           — not prose, a concrete, testable spec. Tested end-to-end
           against one throwaway test client; results in §9.
Source:    Database_Structure_v4_FINAL.md §1-§2, Client_Onboarding_Guide.md
           (business-side archetype/module/UAT process — this document
           covers only the database/schema provisioning steps that sit
           underneath that process), Fallback_Pattern_Catalog.md.
```

---

## A Note on Failure Handling

`Fallback_Pattern_Catalog.md`'s A/B/C/D patterns (Input Retry, Silent Retry, Graceful Redirect, Warm Handoff) are conversational constructs — they describe what an AI agent does *mid-conversation* with a customer when a tool call or input fails. Client onboarding is a backend provisioning process, not a live customer conversation, so those four patterns don't map cleanly onto it (there's no "customer experience" for a `CREATE SCHEMA` failure). Referencing the catalog per the task instructions rather than silently ignoring it: **onboarding failure handling follows a simpler operational convention that this document introduces explicitly** — every step either succeeds and the sequence proceeds, or fails and the sequence **halts with an operator alert** (onboarding is human-supervised, one-time-per-client, not live traffic; there is no fallback chain to degrade through, only a stop-and-fix). Where a step's failure mode does resemble one of the catalog's patterns (e.g., a transient tool-call timeout during Step 8's n8n connection), that step notes the mapping explicitly.

---

## STEP 1 — Determine Archetype

- **Trigger:** New client engagement begins; business-side process, per `Client_Onboarding_Guide.md` §1 (Archetype identification) and §2 (Module selection).
- **Inputs required:** Business type/description, sufficient to answer the archetype identification questionnaire. Multi-archetype detection (e.g., a restaurant running both dine-in reservations and delivery) per the Guide's explicit note not to assume one archetype per client.
- **Operations:** None database-side — this is a human/sales-process decision, output feeds Step 2.
- **Output:** Confirmed primary archetype (one of `emergency`, `commerce_ecom`, `commerce_restaurant`, `appointment`, `consultation`, `engagement`) + secondary archetypes if applicable.
- **Success criteria:** A single confirmed primary archetype, matching one of `archetype_enum`'s 6 values.
- **Failure handling:** Not a system failure mode — an unclear archetype fit is a sales/discovery gap, resolved by more discovery conversation, not a technical retry.

---

## STEP 2 — Copy Template Schema

- **Trigger:** n8n-initiated, immediately after Step 1's archetype is confirmed and a client record slug is assigned.
- **Inputs required:** Confirmed archetype, a `client_schema_name` following the `client_{client_id}_{business_slug}` convention, the archetype's specific table list (e.g., `['conversions_emergency']`, or `['conversions_ecom', 'conversions_restaurant']` for Commerce).

  **Hybrid / multi-archetype client note:** If Step 1 confirmed a `secondary_archetypes` value (per `Client_Onboarding_Guide.md` §1.5's Hybrid Case), this step's specific-table-list spans **more than one** template lineage — e.g., a client with `archetype = 'appointment'` and `secondary_archetypes = ['commerce_ecom']` needs both `conversions_appointment` AND `conversions_ecom` copied into the same client schema, not two separate schemas. The `p_specific_tables` array passed to `create_client_schema_from_template` should include every archetype-specific table across all of the client's active archetypes in one call — the function already accepts an array and does not need modification for this case; only this step's documented usage pattern needed clarifying, since the original wording implied a single archetype's table list only.

  Runtime behavior for hybrid clients is handled entirely by existing Step 1B (Intent Classification) and Step 1E (Intent Switching) — no database or n8n change is needed for the conversation to correctly route between the two active archetypes within one session.
- **Operation:**
  ```sql
  SELECT public.create_client_schema_from_template(
    '{archetype}', ARRAY['{specific_table(s)}'], '{client_schema_name}'
  );
  ```
  **This is NOT a reuse of `public.create_archetype_template`** (Phase B's function) — confirmed by reading its deployed definition directly (`pg_get_functiondef`), not assumed. That function hardcodes the copy source as the literal string `'public'` and derives its target schema name as `'tpl_' || p_archetype` — neither fits this step, which needs an arbitrary source (`tpl_{archetype}`) and an arbitrary target (`client_{id}_{slug}`, not a prefix-derived name). A new function, `public.create_client_schema_from_template(p_archetype, p_specific_tables, p_client_schema)`, was built for this step (`013_create_client_schema_from_template_function.sql`) — same internal logic as Phase B's function (copy via `LIKE ... INCLUDING ALL`, re-add FKs explicitly since `LIKE` never copies them, enable RLS explicitly since `LIKE` never carries that either, revoke `anon`/`authenticated` grants), generalized to take both schema names as parameters instead of hardcoding one and deriving the other.
- **Success criteria:** New schema's table count matches the template's (22 for single-extension archetypes, 23 for Commerce). Additionally (learned from Phase B, re-verified here rather than assumed): every archetype-specific table's FK resolves *within the new client schema itself*, not back to the `tpl_*` source.
- **Failure handling:** Halt, alert operator. Most likely causes: schema name collision (duplicate `client_schema_name`), source template schema doesn't exist (function raises an explicit exception if so — checked via `pg_namespace` before any copy work begins, so this fails fast and cleanly rather than partially copying).

---

## STEP 3 — Register Exposed Schemas

- **Trigger:** Immediately after Step 2 succeeds.
- **CRITICAL — flagged repeatedly across this project's own research as the most commonly forgotten step in schema-per-tenant Postgres setups** (per `Database_Structure_v3.md` §6, Item 5). Must be an explicit, verified, non-skippable operation.
- **Inputs required:** `client_schema_name`.
- **Operation:** Add the new schema to Supabase's Exposed Schemas list — via the Supabase Management API (`PATCH /v1/projects/{ref}/postgrest`, updating the `db_schema` field to include the new schema) or the Dashboard (Project Settings → API → Exposed schemas).
- **⚠️ Confirmed limitation of this environment**: this step **could not be executed** as part of this phase's end-to-end test. Checked empirically (not assumed): queried `pg_roles`/`pg_catalog` for a `pgrst.db_schemas` GUC on the `authenticator` role (the mechanism some self-hosted PostgREST setups use) — none exists in this managed Supabase project, confirming schema exposure is controlled entirely through Supabase's platform-level project settings, not a Postgres-level setting reachable via SQL. None of the Supabase MCP tools available in this environment (`execute_sql`, `apply_migration`, `get_advisors`, `list_migrations`, `list_projects`, `get_project`, etc.) expose or manage this setting. **This step must be performed manually via the Supabase Dashboard, or automated later via the Management API from within an n8n workflow (Step 8) using a service account with project-admin scope** — it is out of reach of the SQL/MCP toolset this phase was built with.
- **Success criteria:** New schema appears in the project's exposed-schema list (verify via Dashboard or `GET /v1/projects/{ref}/postgrest`).
- **Failure handling:** Halt, alert operator. Do not proceed to connecting n8n workflows (Step 8) against a schema that isn't exposed — the Data API calls would simply fail.

---

## STEP 4 — Insert `control.clients` + `control.client_config` Rows

- **Trigger:** Immediately after Step 3 is confirmed complete.
- **Inputs required:** Business name, billing tier, confirmed archetype, `client_schema_name`, and the full `Client_Onboarding_Workbook` (`Client_Onboarding_Guide.md`) contents needed for `client_config` (language mode/list, country code, booking horizon, send window, after-hours contact if Emergency, email address, `archetype_settings` JSON per the confirmed archetype/sub-variants).
- **Operations:**
  ```sql
  INSERT INTO control.clients
    (business_name, status, billing_tier, archetype, client_schema_name,
     created_date, template_version, template_archetype_at_onboarding)
  VALUES (..., 'onboarding', ..., '{archetype}', '{client_schema_name}',
    current_date, {current template_versions.version for this archetype}, '{archetype}')
  RETURNING client_id;

  INSERT INTO control.client_config (client_id, language_mode, language_list, ...)
  VALUES ('{client_id}', ...);
  ```
  `template_version` is read from `control.template_versions` (current max `version` for this archetype) at insertion time, not hardcoded to `1` — a client onboarded after a template rebuild should start on the current version, not always version 1. `template_archetype_at_onboarding` is set once, here, and never updated afterward — it's the historical record of what the client was actually built from (per Part 1's design intent), independent of whether `clients.archetype` is later changed.
- **Success criteria:** One `control.clients` row and one `control.client_config` row exist for this client, with `client_id` matching between them (client_config's PK is a FK to clients).
- **Failure handling:** Halt, alert operator. A `client_config` insert failing after a successful `clients` insert leaves an inconsistent state — the operator alert must include the created `client_id` so cleanup or retry can target it precisely.

---

## STEP 5 — Initial Sync (`control` → new client schema)

- **Trigger:** Immediately after Step 4.
- **Populates:** `client_config`, `templates`, `email_categories`, `recovery_cadence_profiles` in the new client schema, from `control`.
- **`client_config`** — straight copy of this client's own row (not a default/override merge — `control.client_config.client_id` is the table's PK, one row per client, no merge concept applies here):
  ```sql
  INSERT INTO {client_schema}.client_config (client_id, language_mode, ...)
  SELECT client_id, language_mode, ...
  FROM control.client_config WHERE client_id = '{client_id}';
  ```
- **`templates`** and **`email_categories`** — merge universal/archetype defaults (`client_id IS NULL`) with this client's overrides (`client_id = {client_id}`), override wins when both exist for the same natural key (`template_key`+`language` for templates; `category_name` for email_categories — `email_categories` has no `archetype` column, confirmed via live schema, so it's not part of that merge key):
  ```sql
  INSERT INTO {client_schema}.templates (client_id, template_key, template_type, archetype, language, content, version, active, created_date)
  SELECT client_id, template_key, template_type, archetype, language, content, version, active, created_date
  FROM (
    SELECT DISTINCT ON (template_key, language) *
    FROM control.templates
    WHERE (archetype = '{archetype}' OR archetype IS NULL)
      AND (client_id = '{client_id}' OR client_id IS NULL)
      AND active = true
    ORDER BY template_key, language, client_id NULLS LAST
  ) resolved;
  ```
  (`email_categories` follows the identical `DISTINCT ON (category_name) ... ORDER BY category_name, client_id NULLS LAST` shape.)
- **`recovery_cadence_profiles` — the genuinely non-trivial one (per Rule 4).** The local copy has **no `client_id` column at all** (per the Phase A PK-fix design — see `Database_Structure_v4_FINAL.md` §3/§4) — it holds exactly one resolved row per `(archetype, step_number)`. The default-vs-override resolution **must fully happen at sync time**, not be deferred:
  ```sql
  INSERT INTO {client_schema}.recovery_cadence_profiles (archetype, step_number, delay_from_previous_step, delay_unit)
  SELECT archetype, step_number, delay_from_previous_step, delay_unit
  FROM (
    SELECT DISTINCT ON (archetype, step_number) archetype, step_number, delay_from_previous_step, delay_unit
    FROM control.recovery_cadence_profiles
    WHERE archetype = '{archetype}'
      AND (client_id = '{client_id}' OR client_id IS NULL)
    ORDER BY archetype, step_number, client_id NULLS LAST
  ) resolved;
  ```
  `client_id NULLS LAST` in the `ORDER BY` is what makes this work: non-`NULL` (a real client override) sorts before `NULL` (the archetype default), so `DISTINCT ON (archetype, step_number)` picks the override row when one exists for that step, and falls through to the default row when it doesn't.
- **Success criteria:** Row counts in the client schema's `client_config` (1), `templates`/`email_categories` (≥ number of applicable default+override rows, deduplicated), and `recovery_cadence_profiles` (exactly one row per distinct `(archetype, step_number)` that existed in `control` for this archetype) all match expectations. Verify at least one overridden step resolves to the *override* value, not the default, if a client-specific override exists.
- **`control.agent_prompts` is deliberately never synced** — see `Database_Structure_v4_FINAL.md` §3, unchanged from the original design.
- **Failure handling:** Halt, alert operator, with the specific sub-step (which of the 4 tables) that failed — a partial sync (e.g., `client_config` populated but `recovery_cadence_profiles` not) must not be silently treated as complete.

---

## STEP 6 — Apply RLS

- **Trigger:** Immediately after Step 5.
- **Should already be correct** — `create_client_schema_from_template()` (Step 2) enables RLS explicitly on every table as part of the copy, the same discipline Phase B's function used. **Re-verify explicitly anyway, don't assume it carried over correctly** — same discipline as Phase B.
- **Operation (verification, not mutation — RLS should already be set):**
  ```sql
  SELECT count(*) AS total_tables,
    count(*) FILTER (WHERE c.relrowsecurity) AS rls_enabled_count,
    sum((SELECT count(*) FROM pg_policies p WHERE p.schemaname = '{client_schema}' AND p.tablename = c.relname)) AS total_policies
  FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = '{client_schema}' AND c.relkind = 'r';
  ```
- **Success criteria:** `total_tables = rls_enabled_count`, `total_policies = 0` (default-deny, matching every other schema in this design).
- **Failure handling:** If RLS is found NOT enabled on some table (shouldn't happen given Step 2's logic, but verify rather than assume) — halt, alert operator, do not proceed to Step 7/8 with an RLS gap on live-bound client data.

---

## STEP 7 — Data API Exposure Re-Check

- **Trigger:** Immediately after Step 6.
- **Same empirical check Phase B did per new template schema** — confirm no `anon`/`authenticated` grants leaked onto this specific new client schema.
  ```sql
  SELECT table_name, grantee, privilege_type FROM information_schema.role_table_grants
  WHERE table_schema = '{client_schema}' AND grantee IN ('anon','authenticated');
  ```
- **Success criteria:** Zero rows returned.
- **Failure handling:** If any grant is found — halt, alert operator, revoke immediately (`REVOKE ALL PRIVILEGES ON TABLE {client_schema}.{table} FROM anon, authenticated;`) before Step 8 connects any live traffic path.

---

## STEP 8 — Connect n8n Workflows

- **Not a SQL/MCP task.** This is the documented handoff point to n8n workflow configuration — explicitly not built in this phase (per Constraint 3).
- **Trigger:** After Steps 1-7 all pass.
- **Inputs required:** `client_schema_name`, confirmed active modules (per `Client_Onboarding_Guide.md` Stage 2).
- **Mechanism (documented, not built):** Every n8n node touching a client schema selects it via `Accept-Profile`/`Content-Profile` HTTP headers, parameterized by `client_schema_name` (read from `control.clients.client_schema_name`) — never a hardcoded connection string or schema name per client, so one workflow definition serves every client. This pattern is already documented in `Supabase_MCP_Implementation_Notes.md` and `Database_Structure_v3.md` §7, Item 2 — referenced here, not repeated in full.
- **Success criteria (for the handoff, not for n8n build completion):** n8n workflow team has `client_schema_name`, confirmed module list, and Step 3's Exposed Schemas confirmation in hand before beginning workflow configuration.
- **Failure handling:** N/A to this phase — a transient tool-call failure once n8n workflows exist would follow `Fallback_Pattern_Catalog.md` Pattern B (Silent Retry) at the tool-call level, but that's a Step 8-and-later concern, out of this phase's scope.

---

## 9. End-to-End Test Results — `test_client_001` (Emergency archetype)

Run in full against the live `zenny-vault` project. Nothing simulated or assumed — every success criterion below was checked with a live query.

```
Test client:        client_id 7e2dffbf-97a2-46d8-b60f-6782379f02b6
Business name:       "TEST CLIENT -- E2E ONBOARDING TEST -- DO NOT USE"
Archetype:           emergency
Schema:              client_test_001_acme_emergency_test
Status field used:   'onboarding' (see note below -- no literal 'test' value exists)
```

| Step | Result | Notes |
|---|---|---|
| 1. Determine archetype | ✅ PASS | Emergency chosen manually for the test (simplest single-archetype case). |
| 2. Copy template schema | ✅ PASS | `create_client_schema_from_template('emergency', ARRAY['conversions_emergency'], 'client_test_001_acme_emergency_test')` — 22 tables created, verified via `information_schema.tables`. All 20 FK constraints verified to resolve *within the new client schema* (queried `pg_constraint`/`pg_namespace` directly — none point back to `tpl_emergency` or `public`). |
| 3. Register Exposed Schemas | ⚠️ NOT EXECUTABLE in this environment | See Step 3 above — confirmed empirically that no SQL-level mechanism exists in this managed Supabase project, and no available MCP tool manages this setting. Documented as a manual/Dashboard step. This is the one step of the 8 that could not be tested end-to-end as a live operation — everything downstream of it was still tested, since it doesn't block the database-side steps. |
| 4. Insert `control.clients` + `control.client_config` | ✅ PASS | Both rows inserted successfully, `client_id` FK relationship intact. `template_version = 1`, `template_archetype_at_onboarding = 'emergency'` set correctly. |
| 5. Initial sync (with `recovery_cadence_profiles` MERGE) | ✅ PASS | Seeded `control` with 3 archetype-default cadence steps (15 min / 2 hr / 1 day) plus one client-specific override at step 1 (5 min, representing a business decision for faster follow-up). Sync produced exactly 3 rows in the client schema's `recovery_cadence_profiles`: **step 1 = 5 minutes (override — correct, not the 15-minute default)**, step 2 = 2 hours (default, no override existed), step 3 = 1 day (default). This is the exact proof the merge logic works: override wins when present, default applies when it doesn't, one resolved row per step, no `client_id` column in the local table. `client_config`, `templates`, `email_categories` each populated with exactly 1 row as expected. |
| 6. Apply/verify RLS | ✅ PASS | All 22 tables: `relrowsecurity = true`, 0 policies. Not assumed — queried directly. |
| 7. Data API exposure re-check | ✅ PASS | Zero `anon`/`authenticated` grants found on any table in the new client schema. |
| 8. Connect n8n workflows | ➡️ DOCUMENTED HANDOFF ONLY | Per Constraint 3 — not built, not tested, by design. |

**`get_advisors` (both types), run after the full test:** security — 169 `INFO`-level `rls_enabled_no_policy` findings only (expected, intended default-deny design), zero WARN/ERROR. Performance — 156 `INFO`-level `unused_index` findings only (expected — no query history yet on any table, including the new client's), zero unindexed-FK findings.

**Note on `control.clients.status`:** the instructions asked for the test client to be "clearly marked as a test in `control.clients.status`," but `client_status_enum` has no `'test'` value (only `active`, `paused`, `onboarding`, `offboarded`) — inserting one would fail. Used `'onboarding'` (accurate — the client genuinely is mid-onboarding) and marked the test unambiguously via `business_name` instead (`"TEST CLIENT -- E2E ONBOARDING TEST -- DO NOT USE"`). Flagging this rather than silently picking a value, since the literal instruction couldn't be followed as written.

**Disposition:** the test client and its schema are left in place (not deleted), per this project's established "archive/mark clearly, never delete" convention — it stands as a visible, reproducible record that the full sequence passes, not a one-off unverifiable claim.
