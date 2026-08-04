# Template Migration Process (Manual Procedure)

```
Status:    Architect decision — deliberately MANUAL, not automated.
           Documented here as a repeatable procedure using tools this
           project already has (SQL migrations, the sync_log pattern,
           information_schema.schemata). NO scheduled job, trigger, or
           automated migration runner exists or is built by this
           document — that is intentional, not an oversight.
Rationale: Learn the real operational shape of this process across
           actual template changes before considering any automation.
           A structural change to public/the templates is rare enough,
           and consequential enough across every existing client
           schema, that a human should be in the loop for every
           occurrence until the process itself is well-understood.
```

---

## When This Applies

Any time `public`'s reference table structure changes (new column, new constraint, new table, a corrected FK, etc.) — the same category of change Phase A's two corrections were (`recovery_cadence_profiles`'s PK redesign, the 2 added FKs). Not every such change needs to reach existing clients immediately (see Step 4) — but every one goes through this procedure to decide that, not an ad hoc call made in the moment.

---

## The Procedure

### 1. Apply the structural change to `public` first

Same review discipline as every other schema change in this project: draft the SQL, verify it against `Database_Structure_v4_FINAL.md`'s current documented state, apply via `execute_sql` (iterate/test) then `apply_migration` (finalize, real migration history entry), run `get_advisors` before considering it done. `public` is the canonical reference — see `06_Infrastructure/Database/migrations/FINAL/README.md` for why it's treated this way.

### 2. Rebuild the 5 `tpl_*` templates from the updated `public`

Re-run `public.create_archetype_template()` for the affected archetype(s). **Important caveat, learned during Phase B**: `create_archetype_template()`'s table-creation steps use `CREATE TABLE IF NOT EXISTS` — this makes the function safely re-runnable without erroring, but it also means re-running it does **not** pick up a structural change to an *already-existing* table in a `tpl_*` schema (the `IF NOT EXISTS` guard skips table creation entirely if the table's already there). For an actual structural change to propagate into the templates, the affected table(s) must be dropped from the relevant `tpl_*` schema(s) first (`DROP TABLE tpl_{archetype}.{table}`), then the function re-run so it recreates that table fresh from the now-updated `public`. Verify afterward exactly as Phase B did: table count, FK-resolves-within-schema, RLS enabled/zero policies, zero `anon`/`authenticated` grants — don't assume the rebuild carried the change correctly, check it.

### 3. Insert a new row into `control.template_versions`

```sql
INSERT INTO control.template_versions (archetype, version, change_description)
VALUES ('{archetype}', {new_version}, '{what changed and why}');
```
One row per affected `archetype_enum` value (remember: Commerce is `commerce_ecom` + `commerce_restaurant` as two independent rows sharing one physical `tpl_commerce` schema — see `012_schema_version_tracking.sql`'s note on this). `version` must be the previous version + 1 for that archetype (enforced by `UNIQUE (archetype, version)`, but pick the number deliberately, don't guess).

### 4. Decide scope — does this need to reach EXISTING clients, or only new ones going forward?

**Not every `public` change requires retrofitting existing clients.** Use judgment; document the decision as part of the `change_description` or a note alongside it. Examples of the kind of judgment call this is:

- A new optional column with a sensible default, used only by a new feature not yet live for any client → probably fine to apply only going forward (new onboardings pick it up automatically via Step 2 of onboarding; existing clients get it later if/when they actually need the feature).
- A bug-fix correction to an FK or constraint that was actually wrong (like Phase A's `recovery_cadence_profiles` PK fix) → almost certainly needs to reach every existing client, since the bug exists in their schemas too.
- A new required (`NOT NULL`, no default) column → needs a backfill plan as part of the retrofit migration (step 5a below), not just an `ALTER TABLE ADD COLUMN`.

If the decision is "not retrofitting now" — stop here. The version row from Step 3 still exists as the historical record; nothing else in this procedure needs to run for this change.

### 5. If retrofitting existing clients is needed

**a. Write the specific migration SQL for the change.** E.g., for a new column: `ALTER TABLE {client_schema}.{table} ADD COLUMN {col} {type} [DEFAULT ...];` — written once, schema-agnostic (no client-specific values baked in), parameterized by `{client_schema}` exactly like the Phase A/B migration files were.

**b. Test it against ONE existing client schema first.** Never the first real attempt against every client at once. Pick one (ideally a low-stakes/internal one if available, otherwise the least business-critical real client), apply, verify the result matches intent (`information_schema` check on the new/changed structure), confirm nothing else broke (spot-check a query against the table that would exercise the change).

**c. Enumerate affected clients:**
```sql
SELECT client_id, client_schema_name
FROM control.clients
WHERE template_version < {new_version}
  AND archetype = '{affected_archetype}'
  AND status NOT IN ('offboarded');
```
(The `status NOT IN ('offboarded')` filter is a reasonable addition beyond the instructions' literal query — an offboarded client's schema may not even still exist, and migrating it serves no purpose. Adjust/remove if offboarded schemas are in fact retained and need to stay current for compliance/audit reasons; that's a business-process question this document doesn't resolve.)

**d. Apply the migration to each client schema individually, looping through the list from (c) — NOT a single blind bulk operation.** For each client:
   1. Run the migration SQL from (a), substituting this client's `client_schema_name`.
   2. Verify success (the specific check depends on the change — e.g., for a new column, confirm it exists with the right type/nullability via `information_schema.columns`).
   3. Log the result (see (e)).
   4. Only proceed to the next client after this one is confirmed complete. If one client's migration fails, **stop the loop** and investigate before continuing to the rest — don't let one failure become many by pushing through the remaining list blind.

**e. Log each client's migration result.** Reuse `control.sync_log`'s shape and pattern (it already tracks `client_id`, what was synced, when, status, and what triggered it) rather than building a parallel table — a template migration is conceptually the same kind of event `sync_log` already exists to record (something changed for this client's schema, at this time, successfully or not):
```sql
INSERT INTO control.sync_log (client_id, table_synced, sync_timestamp, status, triggered_by)
VALUES ('{client_id}', '{table_or_change_description}', now(), 'success' | 'failed', 'manual_edit');
```
If the shape genuinely doesn't fit for a specific future change (e.g., a migration that touches multiple tables in one client operation and needs to log them as one unit rather than one `sync_log` row per table), a parallel `control.template_migration_log` table is a reasonable addition at that time — but `sync_log`'s existing shape covers everything this document's examples need, so no new table is created here. Don't build it speculatively; build it when a real migration's shape actually doesn't fit.

**f. Update each successfully-migrated client's `template_version`:**
```sql
UPDATE control.clients SET template_version = {new_version} WHERE client_id = '{client_id}';
```
Only after (d)'s verification confirms that specific client's migration succeeded — never bump the version speculatively.

### 6. This process is manual-first by design

Do **not** build a scheduled job, cron trigger, n8n workflow, or any other automated runner for this procedure. Every step above is a human (or a human-directed AI session) executing SQL deliberately, reviewing the result, and making the Step 4 judgment call explicitly each time. Revisit whether any part of this should become automated only after this process has actually been run a meaningful number of times against real template changes and its real operational shape — frequency, typical blast radius, how often Step 4 says "no, don't retrofit," how often Step 5's per-client loop surfaces failures — is understood from lived experience, not projected in advance.
