# n8n Architecture — Scan & Plan
### Findings Before Any Workflow Gets Built

```
Status: Scan complete. Findings + proposed structure, including the
Platform Independence Layering addendum, merged into one document.
All 3 open design decisions are RESOLVED — see "Decisions — Resolved"
below. Not yet the final workflow spec — same discipline as the
database work's Phase 1 scan.
Sources reviewed: Agent_Runtime_System_v1.md (primary), old n8n build
guides (Core/Recovery/Email/Dashboard/Utilities/Workflow Spec —
reference only, per Architecture Expansion Rule), Tool_Naming_
Convention.md, Fallback_Pattern_Catalog.md, Client_Onboarding_Guide.md,
Database_API_Reference.md, Supabase_MCP_Implementation_Notes.md,
Database_Structure_v4_FINAL.md, VOICEFLOW_UNIVERSAL_BUILD_STANDARD.md.
```

---

## What n8n Actually Needs to Implement

Cross-referencing the runtime doc's execution layer against what n8n concretely has to do:

| Runtime Concept | Section | What n8n Must Do |
|---|---|---|
| Action Tool Execution Contract | Step 1D.3 | Every webhook n8n exposes must report back through REQUESTED→WAITING→SUCCESS/FAILED/TIMEOUT — not just succeed/fail |
| Module Responsibility Contract | Step 1D.0.5 | n8n workflows are organized per-module (Core/Growth/Conversion/Recovery/Email), each only calling tools within its OWNS list |
| Universal Availability Validation Layer | Module 3 §2.1 | Real availability checks (calendar, inventory, dispatch capacity) before any Mode A action commits — Emergency's team-availability gap flagged as genuinely not yet built anywhere |
| Duplicate Action Protection | Module 3 §1.2 | n8n must check `conversions`/`recovery_queue` for an existing active record before creating a new one — directly maps to a query against the new schema |
| Universal Fallback (graceful degradation) | CLAUDE.md Rule 2, Voiceflow Rule 11 | Every tool call needs a defined fallback path, referencing `Fallback_Pattern_Catalog.md`'s A/B/C/D vocabulary |
| Tool Naming Convention | Cross-referenced live in runtime doc | Every n8n webhook name follows verb-entity format (already partially true in old docs — `get-order-status` style — needs full audit against the new convention doc) |

---

## Headline Finding: Old n8n Docs Are More Reusable Than the Database Layer Was

Different situation than the Airtable/database scan. The **workflow patterns** in the old n8n docs are largely sound and reusable — sequencing, error-handling philosophy, the Utilities-first build order. What needs to change is almost entirely **what they read/write** (schema-per-client Supabase instead of one shared Airtable base) and **what was hardcoded that must become config-driven**. This is good news — less gets thrown away than the database rebuild required.

**Confirmed reusable patterns (structure, not content):**
- **Utilities-first build order** — `WF-501` (Error Logger) and `WF-503` (Data Validator) built before anything else, since every other workflow calls them on failure. Directly maps to our `tool_call_log` table and Step 0B §7 validation — this pattern should carry forward almost as-is.
- **WF-5XX naming convention** for shared utilities, separate from the WF-0XX/1XX/2XX/3XX/4XX numbering for core/recovery/email/dashboard workflows — clean, keep it.
- **The "Utilities exist to prevent duplicate logic" philosophy** — directly reusable, just pointed at the new schema.
- **Demo Day Shortcuts table pattern** (explicit MVP-vs-production distinction per workflow) — worth reviving as its own artifact for this build too.

**Confirmed patterns that must NOT carry forward — same violations flagged during the database scan, now confirmed in the n8n layer specifically:**
1. **`WF-101`'s hardcoded `Recovery Status = 'Failed'`** — directly contradicts the runtime doc's explicit correction (`Active/Paused/Completed/Stopped`, never `Failed`) and the database's actual enum, which has no `failed` value. Every old recovery workflow's terminal-state logic needs rewriting, not just relabeling.
2. **Hardcoded business names in workflow logic** ("Precision Home Services," "Ember," "GlowWell" appearing directly in node configs, cadence schedules, and even KB Slack messages) — must become schema-name-parameterized, reading from `control.clients`/`control.client_config`, per the standing "not hardcoded, database-driven" requirement.
3. **Hardcoded cadence intervals inline per workflow** (`WF-101`'s 15min/6hr/24hr baked into Set nodes) — must read from `control.recovery_cadence_profiles` / the client's local synced copy instead.
4. **Single shared Airtable base assumption** throughout — every `Airtable — Search/Update Record` node needs to become a schema-aware Supabase call using `Accept-Profile`/`Content-Profile` headers per `Database_API_Reference.md`.
5. **The `x-webhook-secret` static demo secret** (`zm_demo_vf_2026_x7Kp9LmQ2`) — fine for a demo, not a real security model for multi-client production; needs a real secret-management approach.

---

## Real Gaps — Neither Old Docs Nor Runtime Doc Fully Resolve These

1. **Schema-name parameterization mechanism.** The runtime doc requires config-driven behavior; the old docs assumed one Airtable base. Neither source defines exactly *how* an n8n workflow, mid-execution, determines which client schema to target. This was the single most important new design decision for this scan-and-plan phase — see "Decisions — Resolved" below.

2. **Emergency team-availability check** (Module 3 §2.1, explicitly flagged as "not currently built") — no old-doc equivalent exists either (old docs only checked "is a human available to receive dispatch," a different thing). Genuinely new n8n logic needed.

3. **The `WAITING` state's practical implementation.** Step 1D.3 requires the agent to never confirm an action while a tool call is in flight — but Voiceflow (the conversation layer) and n8n (the execution layer) are separate systems communicating via webhook. How does Voiceflow actually know to hold at "WAITING" rather than just waiting synchronously for the HTTP response (which the old `Rule 18`'s "Request Timeout: 20 seconds" suggests was the old model)? See "Decisions — Resolved" below for the resolved model.

4. **Tool Naming Convention audit** — the convention doc exists and is good, but no one has yet audited the old docs' actual webhook names (`create-lead`, `create-conversion`, `create-escalation`, `get-order-status`, etc.) against it for full compliance. Quick, mechanical task, not yet done.

5. **`WF-506` Recovery Stop Checker was deferred to "Sprint 02" in the old docs** (inline in Sprint 01 instead) — worth deciding now whether this extracts into its own utility from the start this time, given we're not under the same demo-day time pressure.

---

## Proposed n8n Folder/Workflow Structure

Adapting the old docs' proven 6-folder structure, updated for the new schema and module-ownership model:

```
01 Core Agent            — WF-0XX: Support/FAQ/Complaint/Handoff tool calls
02 Growth Agent           — WF-1XX: Discovery/Recommendation/Objection tool calls
03 Conversion Engine       — WF-2XX: per-archetype conversion actions
04 Recovery Engine          — WF-3XX: cadence execution, schema-per-client aware
05 Email Manager              — WF-4XX: categorization, autonomy-level routing
06 Utilities                    — WF-5XX: Error Logger, Data Validator, Config
                                  Loader, Notification Router, Schema Resolver
                                  (NEW), Stop Checker
07 Dashboard/KPI                  — WF-6XX (renumbered from old WF-4XX to avoid
                                  collision with Conversion Engine's new WF-2XX)
```

**Renumbering note:** the old docs used WF-4XX for Dashboard — collides with this proposal's Conversion Engine range. Flagging now so the actual build doesn't inherit an accidental collision.

---

## Platform Independence Layering

```
Status: Extends the folder structure above. Applies before any workflow
build begins.
Principle source: Agent_Runtime_System_v1.md's Implementation
Independence principle, extended one layer down.
```

### The Rule

**Every workflow, tool, and table reference is platform-neutral by default. Only the thin adapter at the actual edge — where n8n hands a result back to whatever conversation platform is asking — is platform-named. Everything else stays generically named regardless of whether Voiceflow, Convocore, or a future custom frontend is calling it.**

This directly extends a principle already established in the runtime doc: *"Execute Action Tool" — currently implemented via n8n* (Implementation Independence, near the document header). Applied one layer down: **n8n itself is the stable, platform-neutral execution layer. The conversation platform (Voiceflow today) is the swappable edge, not n8n.**

### Two-Layer Split, Applied to Every Workflow

```
LAYER 1 — Execution Workflow (platform-neutral, permanent)
  Does the actual work: validates input, resolves the client schema,
  writes to Supabase, checks Duplicate Action Protection, returns a
  structured result object (success/failed/timeout + data).
  Named generically: create-lead, create-conversion, check-availability
  — verb-entity, per Tool_Naming_Convention.md, with ZERO platform
  reference anywhere in the name, folder, or internal logic.

LAYER 2 — Platform Adapter (platform-specific, swappable)
  Translates Layer 1's structured result into whatever shape the
  calling platform expects. This is the ONLY place "Voiceflow" appears
  by name. When migration to Convocore or a custom SaaS frontend
  happens, ONLY this layer gets rebuilt — Layer 1 is untouched.
  Named explicitly: voiceflow-adapter-create-lead, or similar —
  the platform name belongs in the adapter's name specifically because
  it's the one place platform-specificity is real and intentional,
  not accidental.
```

**Practical folder structure implication** (revising the 7-folder proposal above):

```
01 Core Agent            — Layer 1 execution workflows (platform-neutral)
02 Growth Agent            — Layer 1 execution workflows
03 Conversion Engine         — Layer 1 execution workflows
04 Recovery Engine             — Layer 1 execution workflows
05 Email Manager                  — Layer 1 execution workflows
06 Utilities                        — Layer 1 (Error Logger, Data Validator,
                                    Schema Resolver, Notification Router,
                                    Stop Checker — all platform-neutral)
07 Dashboard/KPI                      — Layer 1 execution workflows

08 Platform Adapters — Voiceflow          — NEW folder. Layer 2 only.
                                          Every adapter workflow here is
                                          thin — receive Voiceflow's
                                          webhook call, extract/reshape
                                          fields into Layer 1's expected
                                          input, call Layer 1, reshape
                                          Layer 1's response into what
                                          Voiceflow's tool-call response
                                          format expects, return.
```

When Convocore or a custom SaaS frontend eventually arrives, it gets its own parallel `Platform Adapters — Convocore` / `Platform Adapters — [SaaS]` folder — Folders 01-07 never change.

### What This Means for the Voiceflow Build Standard's Rules

Per the instruction to learn patterns/rules from `VOICEFLOW_UNIVERSAL_BUILD_STANDARD.md` while still keeping the core platform-independent: that document's rules split cleanly along this same Layer 1/Layer 2 boundary —

**Rules that are genuinely about the platform-neutral contract (belong in Layer 1's design, described platform-agnostically even though this specific doc frames them via Voiceflow):**
- Rule 18's naming convention (input variable names match field names exactly, no prefixes/aliases) — this is really a Layer 1↔Layer 2 contract discipline, restate it as "the adapter's field names must match Layer 1's expected input exactly," not Voiceflow-specific
- Rule 11 (Graceful Degradation) — already platform-neutral, already reflected in `Fallback_Pattern_Catalog.md`

**Rules that are genuinely Voiceflow-specific (belong ONLY in Layer 2, the adapter):**
- Rule 15 (Playbook Ownership) — a Voiceflow conversation-flow concept, not relevant to n8n at all
- Rule 16 (Buttons/Carousel) — pure Voiceflow UI concern
- Rule 17 (Active Task Continuity) — Voiceflow-specific conversation-state handling
- The specific webhook URL pattern, `x-webhook-secret` header, 20-second timeout, Form-data body format — all Layer 2 adapter configuration, not Layer 1 design

This split means: when the actual n8n build plan gets drafted, Layer 1 workflows should be designed by reading the *runtime doc* as the primary source (what must happen, functionally) — the Voiceflow standard gets consulted only when designing Layer 2 adapters specifically.

---

## Decisions — Resolved

All 3 open design decisions from the original scan are now resolved.

### Decision 1 — Schema Resolver: CONFIRMED as proposed

**Outcome:** Every n8n workflow that touches client data starts with a **Schema Resolver** step (a new Utility, `WF-5XX_Schema_Resolver`): given a `client_id` (passed in from Voiceflow via the webhook trigger, same pattern as the old `Create Lead` tool's `business` field), query `control.clients.client_schema_name`, then use that value to set `Accept-Profile`/`Content-Profile` headers on every subsequent Supabase call in that execution. This directly replaces the old `WF-504 Business Config Loader`'s role, extended to also resolve the schema name, not just config values.

**Reasoning:** Already platform-neutral as originally proposed — it takes a `client_id`, returns a schema name. Nothing about it is Voiceflow-specific, and no old-doc equivalent needed adaptation beyond the extension already designed. No change required.

### Decision 2 — WAITING-State Implementation: CONFIRMED as sync-with-timeout

**Outcome:** Start with **sync-with-timeout** (the old, proven pattern), not async-with-callback. Revisit async only if a specific workflow genuinely needs it — don't build the more complex thing speculatively.

**Reasoning:** Framed as a Layer 1/Layer 2 boundary question, not just a technical implementation choice. The WAITING-state *logic itself* — tracking state, deciding when to time out, what counts as ambiguous — belongs entirely in Layer 1 (platform-neutral) regardless of which model is chosen. Only *how the calling platform is told to wait or gets notified* is Layer 2. This means Layer 1 can be built with the full REQUESTED→WAITING→SUCCESS/FAILED/TIMEOUT state machine internally even though Voiceflow today only supports synchronous request/response (per the old docs' 20-second timeout pattern) — Layer 2's adapter just currently blocks/polls synchronously to fit Voiceflow's model. If a future platform supports real async callbacks, only Layer 2 changes; Layer 1's state machine doesn't need to be rebuilt.

### Decision 3 — Folder/Numbering Structure: CONFIRMED with Layer 2 addition

**Outcome:** Folders 01-07 unchanged from the original proposal; folder 08 (Platform Adapters — Voiceflow) added as new, per the Platform Independence Layering section above. The WF-4XX/WF-2XX collision flag (Dashboard renumbered to WF-6XX) still applies and still needs the same renumbering fix.

**Reasoning:** The two-layer split (platform-neutral execution vs. swappable platform adapter) requires a home for Layer 2 workflows that is structurally separate from Layer 1's 01-07 folders, so that a future platform migration touches only folder 08 (or its future siblings) and never folders 01-07.

---

## Next Step

This scan surfaces enough to draft the actual n8n build plan. With all 3 decisions resolved, the next deliverable is the actual n8n build plan — Utilities first (per the old docs' proven, correct sequencing), then per-module workflows.
