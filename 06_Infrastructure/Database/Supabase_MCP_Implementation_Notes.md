# Supabase MCP & Implementation Learnings

```
Status:   Reference document. Genuinely new artifact — operational
          knowledge gained across Phase A (schema/table build) and
          Phase B (template assembly), organized by topic for future
          reference, not a chronological account of what happened.
Scope:    Applies to this project's Supabase MCP-driven workflow
          specifically, but most sections generalize to any Supabase +
          MCP + Postgres project.
```

---

## 1. MCP Tool Behavior

### `execute_sql` vs `apply_migration` — when to use which

- **`execute_sql`**: iteration and dry-runs. Runs SQL directly, no migration-history entry. Use it while building/testing DDL, for all read-only verification queries (`information_schema`, `pg_catalog`), and for one-off fixes you're still validating.
- **`apply_migration`**: finalizing. Writes a real entry to Supabase's migration history (visible via `list_migrations`). Use it once SQL is tested and correct.

**The tool-guidance conflict encountered**: the `execute_sql` tool's own description says *"Use `apply_migration` instead for DDL operations"* — i.e., prefer `apply_migration` for DDL, generally. Separately, a task's own instructions said the opposite: *"Iterate using `execute_sql`, not `apply_migration` — `apply_migration` writes a migration history entry on every call, which prevents iteration."* These are genuinely in tension for DDL work.

**Resolution used throughout this project**: `execute_sql` for the dry-run/test/verify pass (satisfying the "iterate freely" intent), then `apply_migration` for the final, already-verified DDL (satisfying the tool's own "use apply_migration for DDL" guidance, and producing real migration history instead of leaving changes as ad hoc `execute_sql` calls). This works well when the DDL is already drafted and reviewed (not exploratory) — the "iteration" is really a verification pass, not open-ended trial and error. Flag this kind of conflict explicitly rather than silently picking a side; it's a real inconsistency between the tool's self-description and generic task instructions, and reasonable people could resolve it either way depending on how exploratory the SQL actually is.

### `get_advisors` as a mandatory pre-completion step, not optional

Run both `security` and `performance` advisor types after every batch of DDL changes, before declaring anything complete — not just once at the very end. In practice, across Phase A and Phase B, `get_advisors` caught things that would otherwise have shipped silently:

- **`function_search_path_mutable`** (security, WARN) — flagged on `create_archetype_template` immediately after Phase B's assembly function was created. Fixed with `ALTER FUNCTION ... SET search_path = ''`. This is a real hijacking-risk class of bug (an unpinned `search_path` in a function using dynamic SQL can be manipulated by a caller who controls schema search order), not a stylistic nitpick.
- **`unindexed_foreign_keys`** (performance, INFO) — flagged 4 FK columns in `control` (`email_categories.client_id`, `recovery_cadence_profiles.client_id`, `sync_log.client_id`, `templates.client_id`) that had been correctly scoped out of the original indexing migration file (which only covered the schema-agnostic common/archetype tables) but never given their own control-specific index pass. Fixed by adding 4 targeted indexes.

Both were real, fixable gaps that manual review of the DDL had missed. `get_advisors` is cheap to run and catches a different failure class than `information_schema` verification queries (which confirm structure exists as intended, not that the intended structure is itself sound).

### Output size limits

`get_advisors` results can exceed the tool's token limit once a project has more than a couple dozen tables (this project hit it at ~136-147 lint results across 7 schemas). When that happens, the raw JSON is saved to a file instead of returned inline. Read it with a script (Python/`jq`) that filters to non-`INFO` levels rather than trying to read the whole file — the useful signal is almost always a small number of WARN/ERROR entries buried in a much larger set of expected `INFO`-level findings (e.g., `rls_enabled_no_policy` on every table when using default-deny RLS by design, or `unused_index` on every index in a database with no query history yet).

---

## 2. Postgres/Supabase-Specific Gotchas Discovered

### `LIKE ... INCLUDING ALL` does NOT copy foreign keys

Confirmed **empirically**, not assumed from documentation or a task-instructions file's stated understanding (which, in this project, was wrong on this exact point). Test performed: created a throwaway schema, copied `customers` and `leads` (where `leads.customer_id` FKs to `customers.customer_id` in the source) via `CREATE TABLE x.leads (LIKE public.leads INCLUDING ALL)`, then queried `pg_constraint` for the new table. Result: a `CHECK` constraint and a `PRIMARY KEY` were both copied; **zero foreign keys**.

This matches Postgres's actual documented behavior once you check closely: `INCLUDING INDEXES` copies indexes *and* `PRIMARY KEY`/`UNIQUE` constraints (since those are implemented as indexes), and `INCLUDING CONSTRAINTS` copies `CHECK` constraints and always copies `NOT NULL` — but foreign keys are excluded from every `LIKE` option, unconditionally. `INCLUDING ALL` is the union of every other `INCLUDING` option, so it inherits this same gap.

**Practical implication**: any schema-copy pattern built on `LIKE ... INCLUDING ALL` must explicitly re-add every foreign key afterward, pointed at the *new* schema's own copies of the referenced tables (not the source schema) — this is exactly the kind of error that fails silently (the copy succeeds, the table looks structurally complete, and nothing breaks until you try to violate referential integrity and it's silently *not* enforced). `public.create_archetype_template()` handles this via an explicit post-copy FK-recreation pass, guarded to be safely re-runnable.

### `LIKE ... INCLUDING ALL` does NOT carry RLS enablement state

RLS-enabled is a `pg_class.relrowsecurity` flag, not a table property `LIKE` touches at all (it's not covered by any `INCLUDING` option, unlike indexes/constraints/defaults). A table copied via `LIKE` starts with RLS **disabled**, regardless of the source table's RLS state. Must be enabled explicitly, per copied table, every time. `create_archetype_template()` does this as its own explicit step after all tables are created.

### Supabase's default `anon`/`authenticated` grants are `public`/`graphql_public`-specific, not role-wide

Initially assumed (reasonably, but incorrectly) that Supabase's well-known behavior of auto-granting `anon`/`authenticated` full CRUD on new tables was a `postgres`-role-wide default that would apply to any schema. **Empirically tested and found wrong**: querying `pg_default_acl` showed the auto-grant entries are namespace-scoped specifically to `public` (and `graphql_public`), pre-configured by Supabase at project provisioning — not a database-wide or role-wide default. Creating a brand-new schema (e.g., `tpl_emergency`) and a table inside it, then immediately checking `information_schema.role_table_grants` and `pg_default_acl` for that schema, showed **zero** grants and **zero** default-ACL entries — new schemas start clean.

**Practical implication**: the fix applied to `public` (`ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated`) does not need to be — and structurally cannot be, since `ALTER DEFAULT PRIVILEGES` is namespace-scoped — reapplied to new schemas for them to be safe by default. It's still applied per-schema in `create_archetype_template()` anyway, but as defense-in-depth/posture consistency, not because testing showed it was required. **Always test this kind of platform-specific default behavior empirically before generalizing from it**, even when the generalization seems obviously correct.

### `SECURITY DEFINER` functions in `public` are effectively public API endpoints

Not encountered as an actual bug in this project (`create_archetype_template` is `SECURITY INVOKER`, confirmed via `pg_proc.prosecdef = false`) but worth recording as the check that was run: Postgres grants `EXECUTE` on every new function to `PUBLIC` by default, and `anon`/`authenticated` inherit from `PUBLIC` — so a `SECURITY DEFINER` function in an exposed schema is callable by unauthenticated/low-privilege roles unless `EXECUTE` is explicitly revoked, *regardless of what the function does*. `SECURITY DEFINER` runs with the function creator's privileges (typically an elevated role), so this combination can silently create an unauthenticated privilege-escalation path. `SECURITY INVOKER` (the default, and what this project uses) doesn't have this problem — the function runs with the *caller's* privileges, so an unprivileged caller invoking a function that requires elevated privilege (like creating schemas) simply fails at that step, rather than succeeding with someone else's permissions.

### Partial unique indexes for "at most one default row, many override rows"

The pattern needed: exactly one archetype-level default row per `(archetype, step_number)`, plus any number of per-client override rows for that same `(archetype, step_number)` pair. The naive approach — a composite `PRIMARY KEY (archetype, step_number)` — fails outright, because it permits only *one row total* per pair across the entire table (no default + override coexistence, no two different clients overriding the same step).

The correct pattern: a surrogate primary key, a `UNIQUE (archetype, step_number, client_id)` constraint (bounds each client to at most one override per step), plus a **partial unique index**: `CREATE UNIQUE INDEX ... ON table (archetype, step_number) WHERE client_id IS NULL`. A plain `UNIQUE (archetype, step_number)` constraint would *not* achieve "at most one default row," because Postgres treats every `NULL` as distinct for uniqueness purposes — multiple rows with `client_id IS NULL` would all be considered non-duplicate under an ordinary unique constraint. The `WHERE` clause restricts the uniqueness check to only the rows that matter (the defaults), which is exactly what a partial index is for.

---

## 3. Skill System Behavior

**Skills installed mid-session are not discoverable until the Claude Code process is fully restarted — not just a new task/prompt within the same running session.**

Concretely: `npx skills add supabase/agent-skills` was run mid-session, correctly installed both skills to `.agents/skills/` and symlinked them into `.claude/skills/` (verified on disk, content confirmed correct and complete). But calling the `Skill` tool for either skill continued to fail with "Unknown skill" for the *entire remainder of that session* — including in a subsequent task explicitly described as "a fresh session" by the task instructions, which was not actually a new underlying process, just a new user message within the same running conversation.

The skill list is evidently fixed at process/session start and does not hot-reload when new skill directories appear on disk mid-session. It only became discoverable in a session that started *after* the install had already happened — i.e., a genuinely new Claude Code process, not merely a new prompt.

**Practical implication**: if you need a skill for the current task and it isn't installed, install it, but don't expect to use it via the `Skill` tool in that same session — read the skill's `SKILL.md`/reference files directly instead (they're plain markdown, fully usable as reference material without the tool). Set the expectation with whoever is directing the work that "skill discoverability" as a checkable condition can only be confirmed in a subsequent, genuinely new session — cost real time in this project to diagnose, since it wasn't obvious from any error message that the cause was process-lifetime-scoped rather than something wrong with the installation itself.

---

## 4. RLS Reference (from the `supabase` skill, contextualized to this project)

Full list of Supabase-specific RLS/security gotchas the `supabase` skill documents:

- **Views bypass RLS by default.** Postgres 15+: use `CREATE VIEW ... WITH (security_invoker = true)`. Older versions: revoke `anon`/`authenticated` access or keep the view in an unexposed schema.
- **`UPDATE` requires a `SELECT` policy.** An `UPDATE` needs to first `SELECT` the row under RLS — without a matching `SELECT` policy, updates silently affect 0 rows. No error, just silent no-ops.
- **`auth.role()` is deprecated** — use the policy's `TO` clause (`TO authenticated` / `TO anon`) instead. Beyond deprecation, `auth.role() = 'authenticated'` breaks silently once anonymous sign-ins are enabled, since anonymous users also carry the `authenticated` Postgres role.
- **`TO authenticated` alone is authentication without authorization** (a BOLA/IDOR class of bug) — it restricts *who* can query, not *which rows*. Needs an ownership predicate in `USING` (e.g., `(select auth.uid()) = user_id`) to actually restrict row access.
- **`UPDATE` policies need both `USING` and `WITH CHECK`.** Without `WITH CHECK`, a user can pass the `USING` check on their own row, then reassign that row's ownership column to someone else.
- **`SECURITY DEFINER` functions bypass RLS** — they run with the definer's (often elevated) privileges. Never use `SECURITY DEFINER` to work around a permission error; it silently removes the access control rather than fixing its cause. See §2 above for the `public`-schema exposure angle specifically.

**None of the ownership-predicate/authorization gotchas listed above currently apply to this project.** Every table in every schema (`control`, `public`, all 5 `tpl_*`) uses default-deny RLS — enabled, zero policies — for every role except `service_role`, which bypasses RLS entirely by Supabase's own design and is the only role with any practical access today. There is no `authenticated`-role application traffic anywhere in this design yet; no ownership predicates, no `auth.uid()` checks, no per-user row scoping exist because there's no per-user access model to enforce.

**This will change the moment (if ever) a client-facing application using the `authenticated` role is built** — at that point, every gotcha above becomes directly and immediately relevant, and the RLS model for whatever tables that application touches needs to be designed from scratch with real policies (not just "enabled, zero policies"). This should be revisited in full at that time, not before — building out ownership-predicate policies now, with no consuming application to validate them against, would be speculative and likely wrong in ways that wouldn't surface until a real client-facing use case existed.

---

## 5. Recommendations for Phase C and Beyond

- **Test assumptions about Postgres copy/inheritance behavior empirically before building on them.** The FK-copying discovery (§2) is the clearest example: a reasonable-sounding claim ("`INCLUDING ALL` carries over constraints") was wrong in a specific, consequential way that only surfaced by actually querying `pg_constraint` after a test copy. The same discipline paid off again for the default-grant-scoping question. Default to "verify with a throwaway test + a direct `pg_catalog`/`information_schema` query" over "this is documented/well-known behavior, so it must be fine" whenever a design decision depends on exactly how a Postgres feature behaves.
- **Run `get_advisors` (both types) after every batch of DDL, not just at the end of a phase.** It caught two real issues in this project that manual review missed. Cheap, fast, and catches a different class of problem than structural verification does.
- **When a tool's own description conflicts with task instructions, say so explicitly rather than silently picking one.** The `execute_sql`-vs-`apply_migration` conflict (§1) was resolved reasonably, but only because it was surfaced and reasoned through rather than quietly resolved one way with no record of the tension.
- **For any mid-session tool/skill/capability install, expect it to require a fresh session before it's usable**, and plan work accordingly (verify installation on disk immediately, but don't block subsequent work in the same session on the tool becoming callable).
- **Before Phase C (client onboarding automation) writes actual RLS policies for anything `authenticated`-facing**, revisit §4's ownership-predicate gotchas as a checklist — they were explicitly out of scope for Phase A/B's default-deny model but become load-bearing the moment real per-user access exists.
