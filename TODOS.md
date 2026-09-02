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

## Product

### Real image-based product search + recommendation carousel

**What:** Let a customer upload a photo and have the agent find visually
matching products (plus a recommendation carousel), backed by real
vision embeddings — not text matching against an image's URL/alt-text.

**Why:** Requested by the human during BC-076-Card2b. Correctly scoped
OUT of Card2b at the time (it needs its own vision-embedding/index
design, distinct from the text-ingestion pipeline Card2b shipped) but
never actually written down as a tracked item — it only existed as a
sentence in `PROJECT_STATE.md`'s BC-076-Card2b history entry, at real
risk of being lost whenever that file's own overdue prune/archive pass
happens. Recorded here so it survives that.

**Context:** What Card2b shipped instead is genuinely different and
insufficient for this ask: product image URLs/alt-text are ingested as
plain searchable *text*, so a text query like "red hoodie" can match —
but an uploaded photo has no text to match against, so this doesn't
serve the actual request. Needs its own `/plan-eng-review` pass before
a Build Card: at minimum, a vision-embedding model choice, a
Pinecone index/namespace design compatible with `zenny-business-kb`'s
existing schema (or a separate index), and an ingestion path for
product photos distinct from Card2b's text-chunking pipeline.

**Effort:** M-L (new embedding pipeline + index design + agent-side
photo upload handling)
**Priority:** P3 (no client has asked for this in production yet;
tracked so it's not forgotten, not because it's urgent)
**Depends on:** None technically, but sequencing-wise makes more sense
after BC-076's remaining ingestion legs (Cards 3/4) land, since it's
new scope on top of the same KB tool those cards are still building out.

## Documentation debt

Carried forward from `PROJECT_STATE.md`'s Active Blockers list during
BC-079's prune pass (2026-09-02) — both pre-date the pivot but reference
tables/workflows still live in the current track, so not safe to drop
as pure pre-pivot history.

### `appointments` table undocumented in `Database_Structure_v4_FINAL.md`

**What:** The real, deployed `appointments` table (BC-013) has no
section in the master schema doc.
**Why still relevant:** Used by 5 of 11 Conversion Engine Tools
originally, and now also by the current-track appointment archetype
(BC-074). Not just old-Convocore-era debt.
**Effort:** S **Priority:** P3 **Depends on:** None.

### `n8n_Workflow_Specification_v1.md` missing SCH-007's row

**What:** SCH-007 (a scheduled workflow, Phase 11) was built but never
added to the workflow spec doc.
**Effort:** S **Priority:** P3 **Depends on:** None.

## Infrastructure (continued)

### `control.clients.status` lifecycle is broken

**What:** Nothing in the system has ever transitioned a client's `status`
away from `'onboarding'` — all 6 existing clients (5 test clients + the
real demo client, Carmelli Bakery) sit at `status='onboarding'`
regardless of whether they're fully working. `'active'` and `'paused'`
exist in the enum but have no defined trigger anywhere.

**Why:** Surfaced during the admin-provisioning-redesign
`/plan-eng-review` (2026-09-02) by both the interactive review and
Codex's outside-voice pass, independently. That card adds a 4th value
(`'unprovisioned'`, for shell clients with no schema yet) on top of an
already-overloaded 2-meaning `'onboarding'` — a real, growing problem,
not fixed by that addition. Codex's framing: "`onboarding` already
means both 'not fully provisioned' and 'normal existing usable demo
client'. That ambiguity will leak into filters, list UI, and admin
judgment."

**Context:** Needs an actual state machine: what event moves a client
from `unprovisioned` → `onboarding` (real schema exists) → `active`
(fully connected, live)? Candidates: schema provisioning completing,
first real integration connected, an admin manually flipping it. Until
this is designed, admin-facing client lists cannot reliably show which
clients are actually working.

**Effort:** M (needs its own small design pass, not just a migration)
**Priority:** P2 (affects real, growing operational visibility)
**Depends on:** None technically; conceptually related to whatever
provisions real client schemas going forward (see the next TODO).

### `create_client_schema_from_template()` is untested, unverified infrastructure

**What:** A live Postgres function,
`public.create_client_schema_from_template(p_archetype, p_specific_tables,
p_client_schema)`, already exists — it clones a `tpl_<archetype>`
template schema into a new client schema (tables, FKs, RLS, grants).
It has **zero callers anywhere in the database** and has never been run
against a real client; none of the 6 existing clients were provisioned
through it. It is also not `SECURITY DEFINER`, meaning it needs a
privileged caller (service_role) to run at all.

**Why:** Surfaced during the admin-provisioning-redesign
`/plan-eng-review` (2026-09-02) — the original design doc assumed
schema-cloning automation "doesn't exist anywhere in this repo"; that
assumption was false, but the function's existence doesn't make it
trustworthy. Codex's framing: "treat as untrusted legacy infrastructure
until exercised. Its existence reduces discovery risk, not
implementation risk."

**Context:** Before any future card builds real client provisioning
(self-serve onboarding, or an admin-triggered "provision now" action)
on top of this function, it needs to actually be run against a
disposable test schema and verified end-to-end — including whether
`p_specific_tables` (archetype-specific extra tables) has a real,
current mapping anywhere, since the function itself doesn't derive
that list.

**Effort:** S (a single live test run + verification, ~30min)
**Priority:** P2 (blocks trusting this function for any real
provisioning work, but nothing currently depends on it)
**Depends on:** None.

## Security

### Admin-minting has no extra gate

**What:** `admin-provision-dashboard-user` lets any `role='admin'` account
create another admin — `role` is just a dropdown option in the UI, with
no separate "who can create admins" check.

**Why:** Codex's adversarial review (BC-076-Card2a) flagged this as
privilege sprawl. Explicitly reviewed and accepted as-is by the human —
at this project's current single-operator scale, a stricter gate (e.g. a
`super_admin`/`can_manage_admins` tier) is speculative complexity for a
threat that doesn't exist yet.

**Context:** Revisit if/when a second admin with a genuinely different
trust level is ever needed — e.g. an ops hire who should provision
client logins but never create other admins. Until then, the smallest
correct thing is the one gate that already exists (`role='admin'`
required to call the function at all).

**Effort:** S (once actually needed) **Priority:** P3
**Depends on:** A real second-admin use case existing.

## Completed
