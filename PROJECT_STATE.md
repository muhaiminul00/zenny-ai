# PROJECT_STATE.md — Current State Dashboard

Purpose: what's true RIGHT NOW. Not history (see Wiki/log.md), not
durable facts/decisions (see Wiki/*.md). Overwritten each session,
never appended to.

Read this first, every session. Then Wiki/index.md for anything this
file points to but doesn't explain.

---

## Last Updated
2026-08-13 — by /execute — BC-048 complete: Email Manager chain is now
genuinely live-wired end to end. INT-009 → INT-010 → INT-011 fan out for
real (Execute Workflow, `mode: 'each'`); Pinecone credential fixed
(native `pineconeApi` type, not `httpHeaderAuth` as BC-047 assumed) and
live-verified working. Found+fixed a real pre-existing BC-045 bug in
INT-010: `list_client_email_categories`'s HTTP response gets split into
N separate n8n items, but the prompt-builder code only read the first
one, so the LLM's category prompt was silently empty on every real run
and it hallucinated categories instead (reproduced live 3x, now fixed).
After the fix, a full live round trip (categorize → DB write → draft →
Pinecone query → fallback grounding → draft written) was proven genuinely
live for the first time. One Credential Gate remains: `zenny-notion-api`'s
stored secret does not match the token that was supplied (confirmed via
direct Notion REST call) — blocks only INT-012's Notion leg. Full
narrative: `Wiki/log.md`.

2026-08-13 (same day, prior) — BC-047 complete: INT-011 Draft Email + INT-012
Sync Notion KB built, published (Phase 10, Email Manager). KB source
pivoted from Convocore (hit a real, confirmed account-plan billing gate)
to Notion (doc storage) + Pinecone (vector search, `namespace =
client_id`) — Convocore path stays wired-dormant, not deleted. INT-011 is
Level 2 only (draft + human-approval); Complaint/Refund always escalate
to WF-017. `reply_style` resolved to `'generative'` always. Full
narrative: `Wiki/log.md`.

2026-08-12 (prior session) — BC-045 complete: INT-010 Categorize Email
built and published, closing INT-009's disclosed gap — first n8n-direct
AI judgment call in this project (`chainLlm`+OpenRouter classification).
`reply_style` defaulted to `'scripted'` as a placeholder (now resolved by
BC-047, see above). Full narrative: `Wiki/log.md`.

Older entries (BC-044, BC-043, BC-042, BC-041 and earlier): see `Wiki/log.md`.

## Current Phase
Phase 8 — Conversion Engine (11 Tools) — COMPLETE (11/11 built and
live-tested)
Phase 9 — Recovery Engine — IN PROGRESS (WF-018 SendRecoveryMessage +
INT-006/SCH-001 Process Recovery Queue built, published, live-verified;
cadence now fires automatically, email channel only per explicit scope
cut; INT-007/008 stop/resume not started, still deferred pending
Phase 10's reply-trigger surface)
Phase 10 — Email Manager — IN PROGRESS (WF-019, INT-009, INT-010, INT-011,
INT-012 all built/published/verified (BC-043/044/045/047/048). KB source
is Notion+Pinecone, not Convocore (dormant). INT-009→010→011 now
genuinely chained and live-verified end to end (Pinecone leg). SCH-003
(inbox cadence), SCH-004 (KB sync cadence) not started. One Credential
Gate open: `zenny-notion-api`'s stored secret needs re-pasting — blocks
only INT-012's Notion leg, see Active Blockers)

## Standing Gate
None open.

## Phase Checklist
```
Phase 0  — Environment Setup .................... COMPLETE
Phase 1  — Close Credential Platform Gaps ........ COMPLETE
Phase 2  — Convocore Database Changes ............ COMPLETE
Phase 3  — Remaining Shared Utilities ............ COMPLETE
Phase 4  — Convocore Adapter (ADP-002) ........... COMPLETE
Phase 5  — 4 New Dashboard Systems ............... IN PROGRESS (5B, 5C-read-only, Integrations done; 5A Inventory + 5D Onboarding not started)
Phase 6  — Core Agent ............................ COMPLETE
Phase 7  — Growth Agent .......................... COMPLETE
Phase 8  — Conversion Engine (11 Tools) .......... COMPLETE
Phase 9  — Recovery Engine ....................... IN PROGRESS (WF-018 done; INT-006/007/008, SCH-001 not started)
Phase 10 — Email Manager ......................... IN PROGRESS (WF-019, INT-009, INT-010, INT-011, INT-012 live; SCH-003/SCH-004 not started)
Phase 11 — Scheduled Workflows ................... IN PROGRESS (SCH-006 live; SCH-007 logged, not built)
Phase 12 — Node-by-Node Outlines ................. NOT STARTED (cross-cutting)
Phase 13 — Template Dashboard .................... DEFERRED
```

## Module Status
```
Core Agent ............ ✅ working — Wiki: (none needed, stable)
Growth Agent ........... ✅ working
Conversion Engine ...... ✅ working — all 11/11 Tools built and live-tested (BC-034)
Dashboard (5B/5C/Int) .. ✅ working — Wiki/infra/ for deployment
Recovery Engine ........ 🟡 partial — WF-018 SendRecoveryMessage +
                          INT-006/SCH-001 Process Recovery Queue live-
                          tested, cadence fires automatically (email
                          only), per-client active-hours window
                          (BC-041); stop/resume (INT-007/008) not built
Email Manager .......... 🟡 partial — WF-019, INT-009, INT-010, INT-011
                          (draft), INT-012 (Notion KB sync) all live-
                          tested (BC-043/044/045/047/048); KB source is
                          Notion+Pinecone, Convocore path wired-dormant;
                          INT-009→010→011 now genuinely chained and live-
                          verified end to end for the Pinecone leg;
                          SCH-003/SCH-004 cadences not built yet; INT-012's
                          Notion leg blocked on a credential-secret
                          mismatch (see Active Blockers)
Credentials Platform ... ✅ working — Wiki/credentials/
Infra (VPS/DNS/Proxy) .. ✅ working — Wiki/infra/
```

## Active Blockers
- **Credential Gate (BC-048):** the `zenny-notion-api` n8n credential's
  stored secret does not match the token that was supplied in chat — live
  `List Child Pages` calls in INT-012 404 on a page that a direct `curl`
  using the supplied token (confirmed to be the same "n8n" bot
  integration) can see fine. The MCP cannot read or fix a stored
  credential secret. Human action: open the `zenny-notion-api` credential
  in the n8n UI and re-paste the exact Internal Integration Secret token.
  This blocks only INT-012's Notion leg — the Pinecone leg (INT-011 +
  INT-012's upsert) is fixed and live-verified working (BC-048 found the
  Pinecone credential was created as native `pineconeApi` type, not
  `httpHeaderAuth` as BC-047 assumed, and corrected both nodes).
- **External, Convocore-KB path blocked:** Convocore's REST API now
  returns 403 "requires Business plan or higher" workspace-wide (`Zenny-
  UI` workspace, same secret/agent that worked live on 2026-08-02/04) —
  confirmed independent of MCP. `control.convocore_agent_map` stays in
  place, dormant. Not investigated further — human's call whether to
  upgrade the Convocore plan or stay on Notion+Pinecone permanently.
- External: no roster client has a real, working Google Calendar or
  ecommerce connection to fully live-test Conversion Engine success
  paths (Calendly `status='error'`; WooCommerce test store
  non-functional). Now also true for the 2 new BC-034 roster clients
  (consultation, engagement) — same class of external limitation, not
  a workflow gap. Wiki/credentials/calendly.md, Wiki/credentials/woocommerce.md.
- **DEFERRED (to-do, not blocking):** `Database_Structure_v4_FINAL.md`
  missing an `appointments` section — real deployed table (BC-013),
  used by 5 of 11 Conversion Engine Tools, still undocumented. Not
  blocking (BC-034 already found and fixed the one real bug this gap
  caused, in `create_client_schema_from_template`), but the doc debt
  itself is still open — owed by Commander, not applied by Claude Code
  per Section 13's standing rule. Deferred rather than scheduled;
  revisit next time this doc is touched for any other reason, or
  proactively if it starts causing a second incident.
- Doc diff owed by Commander: `n8n_Workflow_Specification_v1.md`
  missing the SCH-007 row.
- ADP-001 (Voiceflow Adapter) documented as "Production" but no
  matching live n8n workflow found — doc/reality mismatch, not
  investigated.
- UTIL-002 (Data Validator) has no real caller anywhere — not urgent,
  no live risk.
- 4 open product/design decisions, none blocking current work directly
  — see Wiki/decisions/ (calendar-category-sharing,
  disconnect-provider-revocation, dashboard-auth-mapping,
  verification-tier-redesign).
## Test-Client Roster
```
Client A: baa673b5-c51a-4a7b-91f5-a37027f8dca4 — commerce_ecom — client_test_002_acme_commerce_test
Client B: 7e2dffbf-97a2-46d8-b60f-6782379f02b6 — emergency — client_test_001_acme_emergency_test
Client C: 2d0fafb6-72c8-4751-a7c0-cc77cf743807 — appointment — client_test_003_acme_appointment_test
Client D: e5f6a7b8-0001-4c1d-9e2a-000000000004 — consultation — client_test_004_acme_consultation_test (new, BC-034)
Client E: e5f6a7b8-0001-4c1d-9e2a-000000000005 — engagement — client_test_005_acme_engagement_test (new, BC-034)
```

## Next Build Card
BC-039/043/044/045 (Phase 9/10 build history through 2026-08-12): see
`Wiki/log.md` — reply-trigger split, WF-019, INT-009, INT-010.

**BC-046 stopped (2026-08-13, no Build Card completion): Convocore-KB path
hit a real account-plan/billing gate mid-verification, before any live
n8n/Supabase state was touched.** Not resumed — superseded by BC-047.

**BC-047 complete (2026-08-13): INT-011 Draft Email + INT-012 Sync Notion
KB built, published.** Pivoted the KB source from Convocore to
Notion+Pinecone per human decision.

**BC-048 complete (2026-08-13): Email Manager chain genuinely live-wired.**
INT-009 → INT-010 → INT-011 now fan out for real; fixed the Pinecone
credential-type mismatch (native `pineconeApi`, not `httpHeaderAuth`) and
proved it live; found and fixed a real pre-existing BC-045 bug in INT-010
(`list_client_email_categories`'s n8n item-splitting silently emptied the
LLM's category prompt on every real run); full live round trip proven
(categorize → DB write → draft → Pinecone query → fallback → draft
written). One Credential Gate remains open (`zenny-notion-api` secret
mismatch — see Active Blockers), blocking only INT-012's Notion leg. Per
the bounded auto-handoff rule, the loop stops here (this card wrote to
live n8n/Supabase/credentials, and hit a Credential Gate) for a human
pulse-check before continuing Phase 10.

No Build Card currently issued and un-actioned. Candidates for the next
session, in dependency order for Phase 10: (1) fix the `zenny-notion-api`
credential secret (human action, unblocks full live verification of
INT-012's Notion leg), (2) SCH-003 (inbox sync cadence) + SCH-004 (KB sync
cadence, new). Other candidates: Phase 5A (Inventory dashboard) / 5D
(Onboarding dashboard), SCH-007, ADP-001 doc/reality investigation.
(`appointments` doc diff intentionally NOT in this list — see Active
Blockers, deferred.)

## Handoff Note (for next session)

**Where things stand:** Phase 8 (Conversion Engine, all 11 Tools) done.
Phase 9 (Recovery Engine) has 3/4 internal workflows live; INT-007/008
(reply-based stop/resume) deliberately deferred. Phase 10 (Email Manager)
has 5 workflows live: WF-019 SendEmailReply, INT-009 Sync Inbox, INT-010
Categorize Email, INT-011 Draft Email, INT-012 Sync Notion KB — now
genuinely chained (INT-009→010→011) and live-verified end to end for the
Pinecone leg. KB source is Notion+Pinecone; Convocore stays wired-dormant.
Nothing is mid-flight; the next session starts clean. Full narrative:
`Wiki/log.md` (search by BC number).

**What's genuinely open, in priority order:**
1. Fix the `zenny-notion-api` credential's stored secret — see Active
   Blockers. Blocks only INT-012's Notion leg.
2. No roster client (old or new) has a real connected calendar/
   ecommerce store. (Email/Gmail is the one exception, Client A only.)
3. `appointments` doc diff — deferred, see Active Blockers.
4. Phase 10 continuation: SCH-003 (inbox cadence) + SCH-004 (KB sync
   cadence).
5. Everything else is a genuine next-phase choice — see Next Build Card
   candidates above.

Nothing requires human acknowledgment before proceeding — all
self-resolved document-level items from recent sessions are logged in
Wiki/log.md and their relevant Wiki/platform-quirks/ pages.
