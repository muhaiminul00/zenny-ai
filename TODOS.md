# TODOS

## Infrastructure

### Periodic cross-source Pinecone orphan audit

**What:** A scheduled job that lists every `client_kb_source`'s vectors in
Pinecone and diffs them against a fresh read of that source's actual data
(Sheet, etc.), independent of whether the source has synced recently.

**Why:** BC-076-Card2c's D20 rename-safety fix (D24, `06_Infrastructure/n8n/
Workflow_Registry.md`'s Sheets Ingestion entry) only cleans up orphaned
vectors on an actual sync run. A source that goes dormant (client stops
updating their sheet, or the source is abandoned) keeps any orphaned
vectors forever — the ordinary-sync-path design can't reach it.

**Context:** Surfaced by gstack's outside-voice (Codex) during Card2c's
`/plan-eng-review` pass, which correctly pushed back on an earlier draft's
overclaim that "no separate audit is needed." Not urgent at this project's
current stage (2-3 test clients, D22) but worth tracking before client
count grows. Start from D24's shared vector-ID builder/parser (D28) — the
audit's diff logic is the same shape as the per-sync orphan detection,
just triggered on a schedule instead of per-source-sync.

**Effort:** M
**Priority:** P3
**Depends on:** None (Card2c already shipped).

### Wire sync_status failures to real alerting

**What:** Wire orphan-cleanup failure signals (`orphan_step_skipped`,
`orphan_delete_failed_keys`, and a `consecutive_orphan_step_failures`
counter — the counter itself deferred, see below) into a real alert
channel once one exists for this project, ideally `sync_status` failures
generally, not just this one leg.

**Why:** Card2c's D27 gives per-run visibility into list/delete failures,
but a field nobody looks at provides false confidence that repeated
degradation would be noticed. The "degrade, don't block" failure posture
only stays safe if someone eventually sees the degradation.

**Context:** Surfaced by gstack's outside-voice (Codex) during Card2c's
review. The plan originally called for a `consecutive_orphan_step_failures`
cross-run counter to be built in Card2c itself; that was trimmed during
build (it would need a new Supabase read of the prior `sync_status` for
marginal value over the per-run fields already shipped) — build the
counter as part of this item, not as a separate follow-up. Also depends on
this project having any `sync_status` alerting infrastructure at all — if
none exists yet, picking this up will likely reveal that as the real first
step.

**Effort:** S (once alerting infra exists) / M (if it needs to be built,
including the deferred counter)
**Priority:** P3
**Depends on:** Whatever alerting infrastructure this project has (or
builds) for `sync_status`.
