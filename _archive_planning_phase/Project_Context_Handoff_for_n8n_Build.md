# Zenny AI Workforce — Project Context Handoff
### For: New chat, n8n build phase

```
Purpose: Full project trace so a new chat can start the n8n build phase
without re-deriving anything already decided. Read this fully before
starting any work.
```

---

## ⚠️ Required Action Before Starting

**Upload the corrected `n8n_Execution_Architecture_v1.md` into this new chat's project files.** The version currently in project knowledge is the **pre-refinement draft** — it still has the old "Layer 1/Layer 2" terminology and the old status header. The final, frozen v1.0 (with all 5 review corrections applied: Execution Core/Adapter Boundary rename, bold Tool-vs-Workflow rule, Workflow Versioning added, Workflow Registry folded into 17.4, updated status header) exists only as this chat's most recent output file. **Do not proceed against the project-knowledge version — it's stale.**

---

## What This Project Is

**Zenny** — an AI customer-support/sales agent platform, built by **ZeroManual**. Not a single chatbot: a configurable, multi-archetype "AI employee" architecture serving different business types (Emergency services, Commerce/Ecom/Restaurant, Appointment-based, Consultation/agency, Engagement/NGO) through one shared runtime, differentiated entirely by configuration — not by rebuilding per client.

**Long-term direction:** currently Voiceflow (production) with Convocore under evaluation (not yet built/confirmed) as the conversation layer; eventual migration to a custom stack (LangGraph + n8n + Supabase + frontend). Every architectural decision across this entire project has been made to survive that eventual migration — "runtime defines WHAT, implementation decides HOW" is the load-bearing principle repeated throughout.

---

## Full Build History (What's Already Done)

### 1. Agent Runtime System (Complete, Frozen)

`Agent_Runtime_System_v1.md` — the core "AI employee" behavioral specification. ~11,600+ lines. Defines:
- Universal Runtime Layer (session state, intent classification, config loading, module routing, confidence gates, intent switching, multi-intent handling, tool execution contract)
- Freedom Boundary Specification (1-10 behavioral latitude scale per archetype)
- 5 Service Modules: **Core Agent** (always-on support/FAQ/complaint/handoff), **Growth Agent** (renamed from "Revenue Agent" — discovery/recommendation/objection-handling), **Conversion Engine** (transaction completion, per-archetype), **Recovery Engine** (follow-up cadences), **Email Manager** (inbound triage + autonomous reply)
- 5 Archetype Operating Systems: Emergency, Commerce (Ecom + Restaurant sub-variants), Appointment, Consultation, Engagement — each with full conversation journey maps, decision trees, escalation boundaries
- Module Responsibility Contract (OWNS/ALLOWED/DOES NOT OWN/MUST TRANSFER per module — fixes a real cross-contamination bug found during build)
- Batches 1-3 applied: Mermaid bug fixes, research-driven behavioral amendments (customer psychology principles), Enterprise Runtime Hardening (Config Resolver, Tool Execution Contract, Availability Validation Layer, Platform/Data Independence principles)
- Comprehensive consistency scan completed (13 real bugs found/fixed)
- Status: **ARCHITECTURE FREEZE — Ready for Build Phase**

**Companion documents (also in project knowledge):**
- `Stress_Test_Library_v1.md` — 79+ test cases across all archetypes
- `Customer_Psychology_Marketing_Research_v1.md` (Phase 1 research), `customer_psychology_principles_v1.md` (Phase 2, 47 compressed principles), `Architecture_Diff_Report_v1.md` (Phase 3, diffed against runtime, 10 amendments applied)
- 14 flowchart files (all validated, real Mermaid parser confirmed)

### 2. Database Architecture (Complete, Frozen)

`Database_Structure_v4_FINAL.md` — Supabase/Postgres schema, built through Phases A/B/C:
- **Schema-per-client architecture**: one `control` schema (renamed from "vault" — Supabase reserves that name) holding the manually-editable source of truth, 5 archetype **template** schemas (`tpl_emergency`, `tpl_commerce`, `tpl_appointment`, `tpl_consultation`, `tpl_engagement`), each = 21 common tables + archetype-specific extension table(s). Client onboarding = copy the right template, rename, register with Supabase's Exposed Schemas (manual step — see below), sync from `control`.
- 35 total distinct table structures designed and built (8 control + 21 common + 6 archetype-specific)
- Real, empirically-tested via Supabase MCP (not just designed on paper) — including catching that `LIKE...INCLUDING ALL` does NOT copy foreign keys or RLS state (a real Postgres gotcha discovered mid-build)
- `control.template_versions` and `control.agent_prompts.version/status` — early groundwork for future agent/workflow versioning
- `tool_call_log` table — early groundwork for the Action Tool Execution Contract's REQUESTED→WAITING→SUCCESS/FAILED/TIMEOUT lifecycle
- Decision: **manual-first** template-migration process (deliberately NOT automated yet — "learn the process by hand before automating")

**Companion documents (all in project knowledge):**
- `Database_API_Reference.md` — the operational API reference: Accept-Profile/Content-Profile header mechanics (empirically tested with real HTTP requests, real status codes documented — `406`/`PGRST106` for unexposed schema, `401`/`42501` for permission denial), the manual Exposed-Schemas step-by-step builder guide, rate/connection limits
- `Supabase_MCP_Implementation_Notes.md` — MCP tool behavior, Postgres gotchas discovered, skill-system behavior
- `Template_Migration_Process.md` — the manual migration procedure
- `Client_Onboarding_Sequence_Spec.md` — the concrete, tested 8-step onboarding sequence
- `Database_Architecture_Decisions_History.md` — why Airtable → Supabase, why flat → schema-tree
- `Database Architecture Review & Future Runtime Roadmap v1.md` — independent review confirming the database is complete for this phase; recommended sequence: Runtime → Database → n8n Architecture → n8n Planning → n8n Build (the sequence being followed)

### 3. Modular Architecture (Archived)

An earlier, superseded approach (task-type/add-on library model). Archived at `01_Strategy/Modular_Legacy/` with a clear disposition note. Four genuinely valuable artifacts were extracted and rebuilt against current terminology:
- `Tool_Naming_Convention.md` — verb-entity webhook naming (`get-`, `list-`, `check-`, `create-`, `update-`, `cancel-`, `send-`), with a real tool-name registry drawn from the 5 archetype builds, and explicit module-ownership mapping
- `Fallback_Pattern_Catalog.md` — the A/B/C/D graceful-degradation vocabulary (Input Retry / Silent Retry / Graceful Redirect / Warm Handoff), naming a pattern already implemented throughout the runtime doc
- `Client_Onboarding_Guide.md` — business-process side of onboarding
- `Version_Control_and_KPI_Framework.md` — Stable/Beta discipline, KPI framework

### 4. n8n Execution Architecture (Complete, Frozen — v1.0, just finished)

`n8n_Execution_Architecture_v1.md` (**upload the corrected version — see warning above**) — the 4th foundational architecture document. 22 parts, ~1,250 lines. Key content:
- **Philosophy:** "Runtime decides. Execution Layer executes. Database stores. Conversation platforms communicate."
- **Execution Ownership Model** (Part 3) — permanent table answering "which layer owns this?"
- **Scoring boundary** (3.4) — n8n may *calculate*, Runtime alone *interprets*
- **01-08 canonical folder structure** (Part 6) — organized by Runtime module ownership, NOT by external integration (`Conversion Engine/Book_Appointment` touching Calendar+DB+Email+CRM, not split across integration-named folders)
- **Execution Core / Adapter Boundary** (5.2, 6.4 — renamed from "Layer 1/Layer 2" per review) — Folders 01-07 platform-neutral, Folder 08 (`Adapters`) is the ONLY place platform-specific code exists. Migration to a new conversation platform = rebuild Folder 08 only.
- **Schema Targeting** (Part 7) — first-class architectural concern; the actual Accept-Profile/Content-Profile mechanism stated concretely, with the Schema Resolver utility fully specified
- **Universal Workflow Pattern** (Part 8): `Receive → Validate → Authenticate → Resolve Schema → Execute → Log → Respond` (Authenticate deliberately precedes Resolve Schema — fail fast before a DB round-trip)
- **Universal Error Handling** (Part 9) — 5 error categories mapped explicitly to the Fallback Pattern Catalog's A/B/C/D (Part 9.4's mapping table)
- **Retry Strategy** (Part 10) — idempotency-dependent, simple immediate→backoff→final→escalate lifecycle
- **Idempotency** (Part 11), **Tool Architecture** (Part 12 — explicit bold rule: *"A Tool is a Runtime-facing capability. A Workflow is an Execution implementation."*), **Shared Components** (Part 13 — the 5 canonical Utilities), **Database Integration** (Part 14), **Runtime Integration Contract** (Part 15 — structure only; wire-level detail explicitly deferred to a companion doc), **Platform Integration** (Part 16 — Voiceflow ✅ production, Convocore 🔶 prospective/not yet built), **Deferred-by-Design Layers** (Part 17 — explicitly NOT building Runtime State Machine, full Event System, Tool Definition/Workflow Registry, Execution State Layer, Workflow Versioning yet — Voiceflow already handles these internally; two of these already have real groundwork: `tool_call_log` and `control.template_versions`), **Security** (Part 18), **Monitoring** (Part 19), **Scaling** (Part 20 — deliberately minimal, no premature horizontal scaling), **Builder Rules** (Part 21 — including Rule 11: verify every node config against live n8n docs/MCP, never trust prior build docs, since the old n8n build docs were found ~98% wrong against the current platform version)

**Critical standing instruction embedded in this document (Rule 11, 21.12):** every node configuration must be verified against current n8n documentation and/or the live n8n MCP connection before being trusted — not against `n8n_Core_Engine_Build_Guide_v1.docx` / `n8n_Recovery_Engine_Build_Guide_v1.docx` / etc. Those old docs are reference-only for **workflow patterns and sequencing philosophy** (which is largely sound — Utilities-first build order, WF-5XX naming convention, error-handling philosophy), but their actual **node configurations are known to be substantially wrong** against the real running platform.

### 5. n8n Scan & Plan (Complete)

`n8n_Scan_and_Plan_v1.md` — cross-references the runtime doc's execution requirements against the old n8n build guides. Key findings:
- **Reusable from old docs:** Utilities-first build order (`WF-501` Error Logger, `WF-503` Data Validator built before anything else), WF-5XX naming convention, the "utilities prevent duplicate logic" philosophy
- **Must NOT carry forward:** hardcoded `Recovery Status = 'Failed'` (contradicts the corrected `Active/Paused/Completed/Stopped` enum), hardcoded business names in workflow logic, hardcoded cadence intervals (must read from `control.recovery_cadence_profiles`), single shared Airtable base assumptions (must become schema-aware Accept-Profile/Content-Profile calls)
- **3 open design decisions — all resolved:**
  1. Schema-name parameterization → new **Schema Resolver** utility (confirmed, fully specified in the Execution Architecture)
  2. WAITING-state implementation → **sync-with-timeout** (matching the old docs' proven 20-second pattern), not async-with-callback — deliberately simple, matches what Voiceflow can actually do today
  3. Folder structure → 01-08 module-based (confirmed, now canonical in the Execution Architecture)

---

## Immediate Next Steps (What This New Chat Should Do)

Per `n8n_Execution_Architecture_v1.md` §22.5's own recommended sequence, and the Database Review's confirmed sequence:

```
✅ 1. Agent Runtime System
✅ 2. Database Architecture
✅ 3. Database Future Roadmap
✅ 4. n8n Execution Architecture
⏳ 5. Execution Layer Integration Contract v1   ← START HERE
   6. n8n Workflow Specification v1
   7. n8n Build Execution Plan
   8. n8n Builder Guide (actual node-by-node build, using n8n MCP)
```

**Step 5 — Execution Layer Integration Contract v1 (not yet written):** the wire-level companion to Execution Architecture's Part 15 (Runtime Integration Contract). Needs: concrete JSON request/response schemas, exact header requirements, exact error code enums (mapped to the 5 categories in Part 9.3), idempotency key format, Correlation ID format, Tool naming rules (cross-reference `Tool_Naming_Convention.md`), versioning strategy. Same relationship as `Database_API_Reference.md` had to `Database_Structure_v4_FINAL.md` — one stays conceptual, one holds exact implementation detail builders reference constantly.

**Step 8 build order (once specs are done):** Utilities first — Error Logger → Data Validator → Schema Resolver → Notification Router → Stop Checker — one at a time, reviewed, per the proven sequencing. **Every node config must be verified against n8n MCP / live docs before trusting it**, per the standing Rule 11.

---

## Working Discipline Established Across This Entire Project (Carry Forward)

1. **Architecture before implementation, always.** Design/review fully in chat first, then hand a precise instructions file + starting prompt to Claude Code. Never skip straight to building.
2. **One phase at a time, with a hard stop and review checkpoint after each.** Never let Claude Code self-chain into the next phase.
3. **Verify empirically, never assume — especially platform-specific behavior.** This caught real bugs repeatedly (the `LIKE...INCLUDING ALL` FK/RLS gap, Supabase's `public`/`graphql_public`-specific default grants, the old n8n docs' ~98% wrongness). Apply the same discipline to n8n node configs via MCP.
4. **"Manual first, learn the process, automate later"** — applied to template migrations, will likely apply to Schema Exposure automation (explicitly deferred, optional, end-of-n8n-build per Execution Architecture §17.8) and probably to early workflow iteration generally.
5. **Never build speculative infrastructure.** Multiple explicit rejections of scope creep throughout this project (2 queue types not 6, no horizontal scaling design, no async-callback WAITING state, no automated template propagation) — build what's proven needed now, defer what isn't.
6. **New Claude Code sessions for genuinely new work domains**, not perpetual reuse of one giant session — this handoff document exists because of exactly that discipline.
7. **Terminology discipline matters.** "Revenue Agent" → "Growth Agent" rename was a deliberate, thorough, verified-clean global change. "Layer 1/Layer 2" → "Execution Core/Adapter Boundary" just happened for the same reason. Don't let naming drift.
8. **Flag ambiguity, don't guess.** Every phase of this project has examples of Claude Code correctly stopping to ask rather than assuming (the `archetype_enum` Commerce sub-variant question, the missing `Database_Structure_v3_Delta.md` file, etc.).

---

## Full Project Folder Structure (Working Directory)

```
CLAUDE.md                                    ← governance rules, read first
Architecture Expansion Rule + Implementation
  Independence principle (inside
  Agent_Runtime_System_v1.md header)         ← the core cross-cutting principle

00_Project_Control/
  Completed_Task_Archive/                    ← full build history, organized
    Initial_Build_Steps0-6/
    Batch1_Mermaid_Fix/
    Batch2_Research_Amendments/
    Batch3_Enterprise_Hardening/
    Step4_Archetype_Builds/
    Comprehensive_Scan/
    PreStep4_Cleanup/
    Modular_Archival/
    Database_Build/                          ← Phases A/B/C + docs task artifacts
    Reorganization/
    Superseded_Intermediates/
  Client_Onboarding_Guide.md                 ← business-side onboarding process
  Version_Control_and_KPI_Framework.md
  Needs_Review/                              ← 2 unresolved generic diagrams (non-Modular)
  Research_Paper/                            ← PAUSED task, resume after implementation
    Research_Paper_Outline.md
    Research_Paper_Resumption_Plan.md

01_Strategy/
  Blueprint/
  Business_Model/  (empty)
  Offer/
  Modular_Legacy/                            ← archived old architecture, disposition noted
  Research/                                  ← Phase 1-3 psychology/architecture-diff research
    Customer_Psychology_Marketing_Research_v1.md
    customer_psychology_principles_v1.md
    Architecture_Diff_Report_v1.md

02_Agent_Runtime_System/
  Agent_Runtime_System_v1.md                 ← THE core runtime doc, frozen
  Stress_Test_Library_v1.md
  Flowcharts/                                ← 14 files, all validated
  Working_Drafts/  (empty)

03_Archetypes/  04_Service_Modules/  05_Platform_Builds/   ← mostly empty scaffolds

06_Infrastructure/
  Database/
    Database_Structure_v4_FINAL.md           ← frozen schema doc
    Database_API_Reference.md
    Supabase_MCP_Implementation_Notes.md
    Template_Migration_Process.md
    Client_Onboarding_Sequence_Spec.md
    Database_Architecture_Decisions_History.md
    migrations/                              ← real, applied SQL migration history
    Archive/                                 ← superseded v1/v2/v3/v3_delta drafts
  n8n/
    Planning/
      n8n_Scan_and_Plan_v1.md                ← merged scan + platform-independence addendum
    [old n8n build guides — reference-only, node configs unreliable, sequencing philosophy reusable]
  Airtable/                                  ← old, superseded reference material
  Integration/
  Tool_Naming_Convention.md
  Fallback_Pattern_Catalog.md

07_Tools/
  Architecture-Explorer/                     ← HTML review tool (internal doc mirror is
                                                stale/pre-rename — known, low-priority)

08_Product_Assets/
  zenny-website/                             ← real client-facing marketing site

Database Architecture Review & Future Runtime Roadmap v1.md   ← at or near root, confirms
                                                                  database-complete status
n8n_Execution_Architecture_v1.md              ← ⚠️ UPLOAD THE CORRECTED VERSION, see warning
```

---

## Known Open Items (Not Blockers, Just Tracked)

- `DV-02` (relative-date resolution) — flagged repeatedly across Commerce/Appointment/Engagement/Consultation archetype builds, never fixed, belongs to Step 0B
- Architecture-Explorer's internal doc mirror is stale (still references pre-rename "Revenue Agent" filenames) — cosmetic, low priority
- `Needs_Review/` — 2 generic diagrams, confirmed non-Modular, disposition still undecided
- Voiceflow's `x-webhook-secret` is a static demo secret — flagged as needing a real secret-management upgrade before broader production use (Execution Architecture Part 18.6)
- Schema Exposure automation — explicitly deferred/optional (Execution Architecture Part 17.8)
- Research Paper task — fully paused, resumption plan exists, revisit after implementation phase

---

## What NOT to Do

- Do not trust the project-knowledge copy of `n8n_Execution_Architecture_v1.md` — it's the pre-correction draft.
- Do not build any n8n node configuration from the old `n8n_*_Build_Guide_v1.docx` files without verifying against live n8n MCP/docs first — their sequencing/philosophy is reusable, their exact node configs are not.
- Do not skip the Integration Contract and jump straight to workflow building — the Execution Architecture explicitly gates this.
- Do not reintroduce Airtable-era patterns (shared base, hardcoded business names/cadences, `Recovery Status = 'Failed'`).
- Do not build speculative infrastructure (queues, scaling, async callbacks, automated schema exposure) ahead of proven need.
