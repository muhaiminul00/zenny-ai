# Concurrency Race Patterns — Multi-Tenant/Multi-User Hardening (BC-2026-08-31)

## Why this page exists

BC-072 (Shared Runtime Foundation) and BC-073 (Commerce-Ecom Node) were
built and verified against **one client, one conversation, one message
at a time.** The tenant-isolation model (schema-per-client) is sound and
was verified correctly — but "the isolation model is right" and "this
withstands concurrent load from many clients and many simultaneous
users" are different claims, and only the first one had real evidence
behind it. A human review of the live build found this gap directly; a
follow-up audit found 4 real, verified issues, all fixed same session.
**Every future archetype node (BC-074/075 and beyond) must be designed
and verified against multi-client + multi-concurrent-user load from the
start, not just single-client/single-session correctness** — this is
now a standing expectation, not a one-off cleanup.

## The pattern to watch for: check-then-act without a database guarantee

All 3 of the SQL-level findings below share one root shape: application
code reads some state, decides what to do based on it, then writes —
with nothing preventing a second concurrent caller from reading the
same "before" state and making the same decision. The fix is never
"add a lock in n8n" — n8n has no cross-execution locking primitive
worth trusting for this. The fix is always a real Postgres guarantee:
a partial unique index (for "don't create a duplicate"), or an atomic
conditional `UPDATE ... WHERE <precondition> RETURNING` (for "only one
caller gets to act on this row"). Postgres's MVCC makes both of these
provably race-safe regardless of timing — verify the fix by checking a
unique index/atomic update exists, not by trying to win a timing race
from the client side (which this project's tooling can't reliably force
anyway; two "concurrent" MCP tool calls are not a rigorous timing proof
— the structural guarantee is the actual proof).

## Finding 1 — duplicate conversation rows

`find_or_create_conversation` was SELECT-then-INSERT with no unique
constraint. Two near-simultaneous messages from the same customer could
both pass the SELECT before either INSERT committed, creating two
`conversations` rows (and two `conversation_sessions` rows), splitting
that customer's history and `turn_count`.

**Fix:** `CREATE UNIQUE INDEX conversations_open_channel_external_uidx
ON <schema>.conversations (channel, external_id) WHERE status <>
'closed'` (all 5 `tpl_*` + all 6 client schemas), plus a real unique
constraint on `conversation_sessions(conversation_id)` (the "one session
per conversation" design intent was never enforced before). Function
rewritten to `INSERT ... ON CONFLICT (channel, external_id) WHERE
status <> 'closed' DO UPDATE ... RETURNING` instead of check-then-insert.

## Finding 2 — double-fulfillment on verification approval

`resolve-pending-verification`'s approve path checked
`status !== 'pending'` in application code between a SELECT and a later
UPDATE, no lock in between. Two concurrent approvals on the same
`pending_verification_id` could both execute (`insert_client_cart`,
`cancel_client_appointment`, a calendar-delete) — a real double-order/
double-cancel bug, not cosmetic. See
`Wiki/infra/verification-approval-queue.md` for the full writeup.

**Fix:** new `claim_pending_verification` RPC, an atomic
`UPDATE ... SET status = 'processing' WHERE status = 'pending' RETURNING
*`, called before any execution branch. `unclaim_pending_verification`
reverts a claimed-but-failed row back to `'pending'` so a failure stays
retryable, never silently lost.

## Finding 3 — no idempotency on the verification queue

`queue_pending_verification` was a bare INSERT. An Agent tool-call retry
(LLM retry, timeout retry — both normal under real load) could queue two
separate rows for the same `(customer_id, tool_name, target_id)`.

**Fix:** `CREATE UNIQUE INDEX pending_verifications_open_uidx ON
<schema>.pending_verifications (customer_id, tool_name, target_id)
WHERE status = 'pending'`, function rewritten to `INSERT ... ON CONFLICT
... DO NOTHING`, re-selecting and returning the already-queued row's id
on conflict.

## Finding 4 — conversation memory is n8n-process-local, not durable

The Commerce-Ecom Agent's real cross-turn memory is
`@n8n/n8n-nodes-langchain.memoryBufferWindow`, keyed correctly per
`conversation_id` (no cross-tenant leakage — that part was never the
problem) but living only in the single running `n8n-cbzu` container's
RAM (confirmed single instance, no worker pool, per
`Wiki/infra/vps-and-docker.md`). It was never rehydrated from BC-072's
own Postgres `messages` table — `append_message` writes there were a
pure audit log, disconnected from what the Agent actually reasoned
over. A container restart/deploy/crash silently wiped every active
conversation's context while Postgres showed the conversation
continuing normally.

**Decision (human call, not the largest available fix):** rehydrate the
native memory buffer from Postgres on a cold hit, rather than replacing
`memoryBufferWindow` with a custom Postgres-backed memory
implementation — Zenny is pre-launch/single-instance right now, and a
full custom memory class would be solving a scale problem the product
doesn't have yet. Revisit if/when n8n moves to a multi-worker setup.

**Fix, implemented in `Zenny Runtime - Commerce-Ecom Node`:**
`Load Current Memory` (Chat Memory Manager, `mode=load`,
`groupMessages:true`, `alwaysOutputData:true`) → `Memory Cold?` (IF:
`is_new === false && messagesCount === 0`) → on cold, `Get Recent
History (RPC)` (new `get_recent_messages` RPC) → `Rehydrate Memory`
(Chat Memory Manager, `mode=insert`, one message per n8n item — the
RPC's raw JSON array response auto-splits into one item per message,
and the memory-insert node then runs once per item).

**2 real n8n-specific bugs hit building this, worth knowing before
BC-074/075 repeat them:**
- **n8n does not run downstream nodes on a zero-item input.** The first
  version used `groupMessages:false` (one output item per message), so
  zero historical messages meant zero output items, which meant the
  `Memory Cold?` IF node never ran at all — dead on arrival in exactly
  the cold-buffer case it exists to detect. Fixed by switching to
  `groupMessages:true` (always exactly one grouped item, with a real
  `messagesCount` field) plus `alwaysOutputData:true` as a safety net.
  **Lesson: any IF/branch node fed directly by a node whose item count
  can legitimately be zero needs `alwaysOutputData` upstream, or a
  guaranteed-non-empty item feeding it instead.**
- **New HTTP Request nodes don't auto-inherit sibling credentials.**
  `update_workflow`'s own response flagged "credentials must be
  configured manually" for the new node — easy to miss in a long
  operations list. The failure only surfaced at live-test time
  ("Credentials not found"), not at build time. **Lesson: read the
  `autoAssignedCredentials`/warnings in every `update_workflow` response
  before considering a build step done — don't just check for the
  absence of a hard error.**

**Structural limitation, not fixed, flagged for BC-074/075:** the memory
node lives inside each archetype's own workflow (AI memory connections
aren't shareable across an `executeWorkflow` boundary), so this
4-node rehydration pattern must be replicated in every future archetype
node — it cannot be centralized into BC-072's shared sub-workflow. Copy
the pattern, don't rebuild it from scratch.

## Testing note: executeWorkflowTrigger workflows can't be executed directly

`execute_workflow`'s MCP tool only starts Schedule/Webhook/Form/Chat/
Manual triggers — every BC-072/073 workflow is `Execute Workflow
Trigger`-based (library sub-workflows, no production entry point yet).
To live-test one directly, add a temporary `Manual Trigger` → `Set`
(hardcoded test inputs) pair wired to the same downstream target the
real trigger feeds, run it, then remove both temp nodes — this is the
established pattern (used for BC-072/073's original verification too,
and again here). Don't use `test_workflow` for this — it auto-pins
credentialed/HTTP nodes, which proves the wiring but not the real
external call.

## See also

- `Wiki/infra/verification-approval-queue.md` — Finding 2's full context.
- `06_Infrastructure/n8n/Workflow_Registry.md` — Findings 1, 3, 4 in the
  relevant workflow entries.
- `Wiki/platform-quirks/n8n-node-behaviors.md` — this project's other
  recurring n8n node-behavior gotchas.
