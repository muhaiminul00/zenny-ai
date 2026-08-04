# SQL Migration — Phase C: Client Onboarding Automation

```
Task:      Build the real client onboarding process (n8n workflow spec +
           supporting SQL), including schema_version tracking, and
           document the manual template-migration process for future use.
Status:    Approved. Final phase of the database build (A: tables,
           B: templates, C: this).
```

---

## Scope of This Phase

Three parts:
1. **`schema_version` tracking** — small schema addition, built now
2. **The actual onboarding sequence** — turning the 8-step process already described in `Database_Structure_v4_FINAL.md` into a real, runnable spec
3. **Manual template-migration process documentation** — the deliberate, reviewed process for propagating template changes to existing clients (Option B, per architect decision), NOT built as automated infrastructure — documented as a repeatable manual procedure using tools this project already has (SQL migrations, the `sync_log` pattern, `information_schema.schemata` to enumerate clients)

---

## Part 1 — `schema_version` Tracking

**Add to `control.clients`:**
```sql
ALTER TABLE control.clients
  ADD COLUMN template_version int NOT NULL DEFAULT 1,
  ADD COLUMN template_archetype_at_onboarding archetype_enum;
```

- `template_version`: which version of the `tpl_{archetype}` template this client's schema was copied from. Starts at 1 for every client onboarded under the current template structure.
- `template_archetype_at_onboarding`: redundant with `clients.archetype` today, but kept explicit in case a client's archetype assignment ever changes after onboarding (their schema wouldn't retroactively change, so this records what they were actually built from).

**Add a version tracker for the templates themselves — `control.template_versions`:**
```sql
CREATE TABLE control.template_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  archetype archetype_enum NOT NULL,
  version int NOT NULL,
  change_description text NOT NULL,
  applied_to_public boolean NOT NULL DEFAULT true,
  created_date date NOT NULL DEFAULT current_date,
  CONSTRAINT template_versions_unique UNIQUE (archetype, version)
);
```
Seed with `version = 1` for all 5 archetypes now (current state, description: "Initial Phase A/B build").

**How this is used going forward:** when `public`'s reference structure changes and the 5 templates are rebuilt (rerunning `create_archetype_template`), insert a new row here with the incremented version and a real description of what changed. `control.clients.template_version` tells you, per client, whether they're on the current version or need the manual migration process (Part 3) applied.

---

## Part 2 — The Onboarding Sequence

Convert the 8-step process (already described in `Database_Structure_v4_FINAL.md`) into a concrete, testable spec — this becomes the actual n8n workflow design, not just prose.

For each step, define: trigger, inputs required, SQL/MCP operations performed, success criteria, and failure handling (per this project's existing Fallback Pattern Catalog — reference it, don't reinvent).

```
STEP 1 — Determine archetype
  Input: business type, from Client_Onboarding_Guide.md's archetype
  identification questionnaire
  Output: confirmed archetype (+ secondary archetypes if applicable,
  e.g. Commerce Ecom+Restaurant)

STEP 2 — Copy template schema
  Trigger: manual/n8n-initiated, post-archetype-confirmation
  Operation: CREATE SCHEMA client_{id}_{slug}; then copy all tables
  from the matching tpl_{archetype} (reuse create_archetype_template's
  logic, or a close variant — confirm whether the existing function
  can be reused directly for "copy FROM a tpl_* schema" or needs a
  small parameterization change, since it was built for "copy FROM
  public")
  Success criteria: table count matches the template's (22 or 23)

STEP 3 — Register Exposed Schemas
  CRITICAL — this is the step flagged repeatedly across this project's
  own research as most commonly forgotten. Must be an explicit,
  verified, non-skippable operation, not assumed to happen implicitly.
  Success criteria: schema appears in Supabase's exposed-schema config

STEP 4 — Insert control.clients + control.client_config rows
  Include template_version (from Part 1) and template_archetype_at_onboarding
  set at this step.

STEP 5 — Initial sync (control → new client schema)
  Populates: client_config, templates, email_categories,
  recovery_cadence_profiles with real starting values.
  For recovery_cadence_profiles specifically: apply the default+override
  MERGE logic here — resolve control's (archetype default rows +
  this client's override rows, if any) into ONE final row per
  archetype+step_number in the local copy (per the earlier PK-fix
  design, the local copy has no client_id column, so this merge must
  happen at sync time, not be deferred).

STEP 6 — Apply RLS
  Should already be correct if copied from a properly-configured
  template (Phase B already verified RLS state per template) — but
  re-verify explicitly for the new client schema, don't assume it
  carried over correctly. Same discipline as Phase B's verification.

STEP 7 — Data API exposure re-check
  Same empirical check Phase B did per new schema — confirm no
  anon/authenticated grants leaked onto this specific new client schema.

STEP 8 — Connect n8n workflows
  Not a SQL/MCP task — flag this as the handoff point to n8n workflow
  configuration (parameterized by schema name, per the earlier
  Accept-Profile/Content-Profile header pattern already documented in
  Supabase_MCP_Implementation_Notes.md). Document the handoff clearly;
  do not attempt to build actual n8n workflows in this SQL-focused task.
```

**Test this entire sequence once, end-to-end, against one throwaway test client** (e.g., "test_client_001", clearly marked as a test in `control.clients.status`) before declaring Phase C complete. This is the first real proof the whole system works together, not just that each phase individually verified clean.

---

## Part 3 — Manual Template-Migration Process (Documentation Only, Not Automation)

**Per architect decision: this is a documented, deliberate, manually-triggered procedure — explicitly NOT built as automated infrastructure in this phase.**

**Create:** `06_Infrastructure/Database/Template_Migration_Process.md`

Document the procedure:
```
1. A structural change is needed in public's reference tables (new
   column, new constraint, etc.) — apply it to public first, same
   review discipline as every other schema change in this project.

2. Rebuild the 5 tpl_* templates from the updated public
   (rerun/adapt create_archetype_template).

3. Insert a new row into control.template_versions recording what
   changed.

4. Decide scope: does this change need to propagate to EXISTING
   clients, or only apply going forward to newly-onboarded ones?
   Not every public change requires retrofitting existing clients —
   use judgment, document the decision per change.

5. If retrofitting existing clients is needed:
   a. Write the specific migration SQL for the change (e.g., the
      ALTER TABLE statement for a new column)
   b. Test it against ONE existing client schema first
   c. Enumerate affected clients: SELECT client_schema_name FROM
      control.clients WHERE template_version < {new_version} AND
      archetype = {affected_archetype}
   d. Apply the migration to each client schema individually, looping
      through the list from (c) — NOT as a single blind bulk operation
      across all schemas at once
   e. Log each client's migration result (success/failure) — reuse
      the sync_log table's pattern, or add a parallel
      template_migration_log table if the shape differs meaningfully
      enough to warrant it (your judgment)
   f. Update each successfully-migrated client's template_version in
      control.clients

6. This process is manual-first by design (architect decision) — do
   NOT build a scheduled or automatic trigger for this. Learn the
   real operational shape of this process across real template
   changes before considering any automation.
```

---

## Constraints

1. Part 3 is documentation only — do not build a scheduled job, trigger, or automated migration runner. This is intentional, not an oversight.
2. Test the full Part 2 sequence against one test client before declaring the phase complete — this is the actual proof of correctness, not optional.
3. Do not build actual n8n workflows in this task — Step 8 of Part 2 is a documented handoff point, not an n8n build task.
4. Follow the same verification discipline as Phase A/B — test assumptions empirically (per the FK/RLS copy-behavior lessons already learned), don't assume anything carried over correctly without checking.

---

## Deliverable

1. `schema_version` tracking built (`control.clients` additions + `control.template_versions` table, seeded).
2. The 8-step onboarding sequence fully specified, with SQL/MCP operations defined per step.
3. End-to-end test against one throwaway test client — full results reported, including any step that failed or needed adjustment.
4. `Template_Migration_Process.md` — the documented manual procedure.
5. Confirmation of whether `create_archetype_template` can be reused directly for template→client copying, or needs a variant.

STOP after Phase C is complete and the end-to-end test passes. This closes the entire database build. The next task after this is n8n workflow implementation, which is a separate track.
