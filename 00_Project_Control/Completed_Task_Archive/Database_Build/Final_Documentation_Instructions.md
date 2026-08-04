# Final Database Documentation — Task Instructions

```
Task:      Produce 3 final, clean deliverables reconciling everything
           Phase A + Phase B actually built, plus one verification check.
Status:    Approved. This closes out the design/build phase before
           Phase C (client onboarding automation).
```

---

## Verification First — `create_archetype_template`'s Security Mode

Before writing documentation, check one thing the skill's guidance surfaced as a gap: is `create_archetype_template` (in `public`) `SECURITY DEFINER` or `SECURITY INVOKER`?

- If `SECURITY DEFINER`: per the skill, this makes it an effectively-public API endpoint — Postgres grants `EXECUTE` to `PUBLIC` by default, meaning `anon`/`authenticated` could potentially invoke it (create/alter schemas) even though they can't read table data. Check whether `EXECUTE` was explicitly revoked from `anon`/`authenticated` on this function. If not, revoke it now (`REVOKE EXECUTE ON FUNCTION public.create_archetype_template FROM anon, authenticated, PUBLIC;`), since this function should only ever be called by `service_role`/an administrator, never by application-level roles.
- If `SECURITY INVOKER`: confirm this is sufficient for the function's actual needs (it creates schemas/tables, which likely requires elevated privilege the calling role may not have — if it's `INVOKER` and still works when called via `service_role`, that's fine and expected, since `service_role` already has broad privilege).

Report which mode it is, and the remediation applied if `DEFINER` needed the `EXECUTE` revoke.

---

## Deliverable 1 — Final Schema Reference Document

**Create:** `06_Infrastructure/Database/Database_Structure_v4_FINAL.md`

This reconciles the original design (`Database_Structure_v3.md`) with everything actually built and corrected across Phase A and Phase B. It should be a clean, complete, standalone document — not a delta, not requiring the reader to cross-reference prior versions or task reports.

**Must include, updated to match reality:**
- The full schema tree (Control + `public` reference scaffolding + 5 `tpl_*` schemas), with `public`'s permanent reference-only role explicitly stated
- Every table, every column, exactly as it exists in the live database right now — including:
  - The corrected `recovery_cadence_profiles` structure (surrogate PK + partial unique index, and the simplified local-copy version without `client_id`)
  - The 2 added FKs (`email_categories.client_id`, `recovery_cadence_profiles.client_id`)
  - Correct enum count (42, not the original 37 estimate) and the actual list
  - All 26 indexes, not just the originally-planned set
- A note on `create_archetype_template`'s security mode (from the verification above)
- Table counts confirmed accurate: `public`=27, `control`=8, `tpl_emergency`=22, `tpl_commerce`=23, `tpl_appointment`=22, `tpl_consultation`=22, `tpl_engagement`=22

**Must NOT include:** speculative/future content (Phase C hasn't happened yet) — this documents what exists right now, not the plan for what's next.

---

## Deliverable 2 — Final, Clean SQL

**Create:** `06_Infrastructure/Database/migrations/FINAL/` containing the actual current SQL as one clean, ordered set — not scattered across the original 7 files + corrections + Phase B's additions as separate historical artifacts.

**Two acceptable approaches — use your judgment on which fits better, report which you chose:**
- (a) A renumbered, consolidated set of migration files reflecting final state (e.g., regenerate from the live database schema directly, which guarantees accuracy over hand-reconciling files), or
- (b) Keep the original files as the historical migration record (already applied via `apply_migration`, already in Supabase's own migration history — don't rewrite history) and add ONE new "current state" reference dump generated directly from the live database (e.g., via `supabase db pull` or an equivalent schema-dump command) as the authoritative "this is what's actually there" artifact.

**Recommend (b)** — migration history that's already been applied to a real database shouldn't be silently rewritten; the corrections were applied as their own real steps and should stay visible as such. But use your judgment given what's actually practical in this environment.

Whichever approach: the end state must be that anyone reading `06_Infrastructure/Database/migrations/` can tell unambiguously what the *current, correct* schema is, without needing to mentally apply corrections on top of an outdated file.

---

## Deliverable 3 — MCP & Implementation Learnings (New Document)

**Create:** `06_Infrastructure/Database/Supabase_MCP_Implementation_Notes.md`

This is a genuinely new artifact — operational knowledge gained through Phase A/B that would otherwise only exist scattered across task completion reports. Organize it as a real reference document, not a chronological log.

**Required sections:**

### MCP Tool Behavior
- `execute_sql` vs `apply_migration` — when to use which (iterate/dry-run vs. finalize), and the specific tool-guidance conflict encountered (the tool's own description said one thing, task instructions said another — how it was resolved)
- `get_advisors` as a mandatory pre-completion step, not optional — what it caught in practice (the `search_path` mutability warning, the initially-unindexed FK columns)

### Postgres/Supabase-Specific Gotchas Discovered
- `LIKE ... INCLUDING ALL` does NOT copy foreign keys — confirmed empirically, not documented behavior we assumed correctly beforehand. Must re-add FKs explicitly after any `LIKE`-based table copy.
- `LIKE ... INCLUDING ALL` does NOT carry over RLS enablement state — must be enabled explicitly per copied table.
- Supabase's default `anon`/`authenticated` grants are specific to `public` and `graphql_public` schemas at provisioning time — NOT a role-wide default that automatically extends to new schemas (this was empirically tested and corrects an earlier, reasonable-but-wrong assumption made mid-project).
- `SECURITY DEFINER` functions in `public` are effectively public API endpoints (Postgres grants `EXECUTE` to `PUBLIC` by default) — relevant to the verification check at the top of this task.
- Postgres partial unique indexes (`WHERE client_id IS NULL`) as the correct pattern for "at most one default row, many override rows" — versus a naive composite PK, which fails because Postgres treats each NULL as distinct for uniqueness purposes.

### Skill System Behavior
- Skills installed mid-session are not discoverable until the Claude Code process is fully restarted — not just a new task/prompt within the same running session. Document this clearly since it's non-obvious and cost real time to diagnose.

### RLS Reference (from the `supabase` skill, contextualized to this project)
- Full list of RLS gotchas the skill provides (views bypassing RLS, UPDATE needing a SELECT policy, `auth.role()` deprecation, `TO authenticated` not being real authorization alone, UPDATE needing both `USING` and `WITH CHECK`, `SECURITY DEFINER` bypass)
- Explicit note: **none of the ownership-predicate/authorization gotchas currently apply**, since this project uses default-deny RLS with zero policies for any client-facing role — only `service_role` has access. Flag clearly that these gotchas become directly relevant the moment (if ever) a client-facing application using the `authenticated` role is built, and should be revisited in full at that time, not before.

### Recommendations for Phase C and Beyond
- Any process improvements worth carrying forward (e.g., "always test assumptions about Postgres copy/inheritance behavior empirically before building on them, per the FK-copying discovery")

---

## Constraints

1. Do not begin Phase C under this task.
2. Do not modify any live database structure as part of documentation — this task documents and verifies (the one security-mode check), it doesn't build.
3. If the verification check requires a fix (the `EXECUTE` revoke), that's a small, explicitly-scoped exception to Constraint 2 — apply it, document it, nothing else.

---

## Deliverable Summary

1. Security-mode verification of `create_archetype_template`, with fix applied if needed.
2. `Database_Structure_v4_FINAL.md` — complete, accurate, standalone.
3. `06_Infrastructure/Database/migrations/FINAL/` — clean current-state SQL artifact, per whichever approach (a) or (b) fits, with reasoning stated.
4. `Supabase_MCP_Implementation_Notes.md` — the full MCP/implementation learnings document, with a clearly separated RLS-gotchas section.

STOP after all 4 deliverables are complete. Await a separate prompt for Phase C.
