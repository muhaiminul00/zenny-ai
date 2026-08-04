# Convocore Findings → Required System Updates (FINAL)

```
Status:    FINAL — supersedes Convocore_Findings_Required_Updates_v1.md and
           Convocore_Session_Closeout_v1.md entirely. Both are now folded
           into this single document.
Purpose:   Every confirmed decision, required change, and genuinely open
           question that touches a FROZEN document, organized by WHICH
           document it lands in — so a Runtime/Database/Workflow builder
           can act directly from this doc without re-deriving context.
Reading    Each entry states: what was found, why it matters (context for
guide:     the builder, not just "what"), the specific proposed change,
           and whether this is a CONFIRMED decision (ready to implement)
           or a DECISION NEEDED (flagged, not mine to make unilaterally).
Position:  This document identifies changes. It does not make them. Each
           frozen document gets updated separately, through its own
           established Change Request process — this is the index that
           tells you what those Change Requests should contain.
Relationship to Convocore_Adapter_Spec: that document (rewritten next,
           Step 2) is the single entry point for HOW Zenny talks to
           Convocore. This document is broader — it also covers things
           the Adapter Spec doesn't own (Runtime behavior, Credential
           Platform fields, new workflows, database columns unrelated to
           the Adapter's own translation logic).
```

---

# PART 1 — `Database_Structure_v4_FINAL.md`

### 1.1 New table OR new columns: Convocore agent mapping

**What was found:** Convocore has no native concept of Zenny's `client_id`. Every inbound Convocore request needs to resolve to a client before anything else can happen.

**Why it matters:** without this, the Adapter cannot function at all — this is the first, mandatory step of every Convocore request.

**Proposed change — two options, your call which fits better (per your own flagged tradeoff):**
- **Option A (clean):** a dedicated `control.convocore_agent_map` table — `client_id`, `convocore_agent_id`, `convocore_agent_secret_id` (Vault reference), `convocore_region`, `agent_display_name`, `created_at`. Follows the exact pattern already used for `oauth_apps`/`client_connections`.
- **Option B (simpler, bends the one-table-per-concern convention):** add the same fields directly as columns on the main client info table.

**Status:** CONFIRMED to build (you accepted either option) — **which option is a DECISION NEEDED**, not made here.

**New requirement added this round:** must also store the **agent's display name** — confirmed to mean the name shown on the web chat widget. This needs to exist in whichever option is chosen above.

### 1.2 New requirement: Agent naming convention

**What was found:** no naming convention exists yet for Convocore agents (the display name stored per 1.1).

**Why it matters:** without one, agent names will drift inconsistently client-to-client, making support/debugging harder and any future automation (bulk operations, reporting) less reliable.

**Proposed change:** DECISION NEEDED — this is a new artifact to design, not a schema change by itself. Suggest a short naming-convention note (e.g. `{ClientBusinessName} — {Zenny/product name}` or similar) gets written either into this Database doc as an appendix, or into the Adapter Spec's client-provisioning section. Flagging existence of the requirement; not designing the convention here since that's a product/branding decision, not an architecture one.

### 1.3 New nullable column: `leads.convocore_conversation_id`

**What was found:** Recovery messaging (and any future feature needing to reference "which Convocore conversation did this lead come from") has nowhere to store that reference today.

**Why it matters:** confirmed decision — add the column now, even with no active use case, so no schema change is needed once a recovery-messaging solution exists (from Convocore or otherwise).

**Proposed change:**
```sql
ALTER TABLE {client_schema}.leads
  ADD COLUMN convocore_conversation_id text NULL;
```

**Critical constraint, must be documented alongside this column, not just added silently:** this column is only safe to populate with a **WebSocket-originated** conversation ID. Conversation IDs created via `POST /convos` (REST) follow the pattern `{agentId}_{suffix}` and are confirmed broken for every later single-item operation (GET/PATCH/DELETE) — live-tested and reproduced across three independent workspaces. Naturally-occurring IDs (real chat, real WebSocket turn) don't follow that pattern and work correctly. **Whatever writes to this column must be documented to only ever source the ID from a real WebSocket Interact turn.**

**Status:** CONFIRMED.

### 1.4 New module flags: `voice_agent`, `sms_agent`

**What was found:** Zenny will offer Convocore-based voice and SMS as real, separate offerings, each requiring its own client-level provisioning (Twilio credentials, phone number).

**Why it matters:** without a way to flag which clients have these enabled, there's no clean way to gate the credential-platform fields (1.5) or the provisioning workflow per client.

**Proposed change:** add two new boolean/enum flags to wherever module selection currently lives (likely `client_config` or equivalent) — `voice_agent_enabled`, `sms_agent_enabled`. Both can be true for the same client, and per your note, may share the same underlying phone number.

**Status:** CONFIRMED.

### 1.5 New columns: client voice/SMS phone numbers

**What was found:** ties directly to 1.4 — need somewhere to store which phone number(s) belong to a client.

**Proposed change:** `client_voice_number`, `client_sms_number` on the client info table (nullable, may hold the same value for both).

**Status:** CONFIRMED.

### 1.6 New storage requirement: Convocore auto-generated conversation data, per lead

**What was found:** Convocore already computes several things per conversation that Zenny would otherwise duplicate — AI-generated conversation summary, per-message sentiment/feedback, token usage, cost, and Lead Qualification Funnel score. Confirmed decision: **use Convocore's version first, store it per lead; only fall back to Zenny's own computation if Convocore's is insufficient. Analytics (aggregate reporting) is explicitly excluded from this storage rule — that stays live/pulled, not stored per-lead.**

**Why it matters:** this is new storage that doesn't exist anywhere in the current schema. Without a defined home for it, whichever module first needs this data (Growth Agent for lead score, Core Agent for summary, Email Manager for context) will improvise its own storage shape independently, risking exactly the inconsistency this whole precedence rule was designed to avoid.

**Proposed change — DECISION NEEDED, not resolved here:** two shapes are possible —
- **Option A:** columns directly on `leads` (`convocore_summary`, `convocore_sentiment`, `convocore_token_usage`, `convocore_cost`, `convocore_lead_score`) — simple, but assumes one lead maps cleanly to one conversation's worth of this data
- **Option B:** a separate table keyed by `conversation_id` (since a lead could have multiple conversations over time, and this data is genuinely per-conversation, not per-lead) — more correct if that scenario is realistic, more complexity if it isn't

**This needs a Runtime/Database builder decision on which shape fits, not an assumption made here.**

### 1.7 Confirmed: NO product/inventory storage for Shopify/WooCommerce

**What was found:** confirmed explicitly — Zenny's database stays FAQ/business-knowledge only. Product catalogue and inventory data are never stored in Zenny's own database; they flow Shopify/WooCommerce → (new sync workflow, see Part 3.3) → Convocore's KB directly.

**Why it matters:** this is a genuine constraint worth stating plainly in the schema documentation itself, so a future builder doesn't accidentally start adding product tables assuming that's expected.

**Status:** CONFIRMED, documentation-only change (a clarifying note, not a schema addition).

### 1.8 Escalations table — verify compatibility with Convocore-sourced handoffs

**What was found:** confirmed decision (Part 2 of this document) — Convocore's `human-handoff` tool invocations should write into the existing `escalations` table architecture, not stay Convocore-internal-only.

**Why it matters:** the existing `escalations` table was designed with Voiceflow-originated escalations in mind. It's not yet confirmed whether its current columns cleanly accommodate Convocore's specific handoff data shape (`team_key`, `issue_summary` — Convocore's own built-in variables for this tool).

**Proposed change:** DECISION NEEDED — a Database builder should check the existing `escalations` table's columns against `team_key`/`issue_summary` and confirm whether they map cleanly onto existing fields (e.g. an existing `notes`/`reason` field) or need a new column. Not assumed here since I don't have the exact current column list.

---

# PART 2 — `Agent_Runtime_System_v1.md`

### 2.1 `human-handoff` — deep integration, staged fallback

**What was found:** confirmed decision — Convocore handoffs should write a real `escalations` row (per Database Part 1.8), not rely on Convocore's own email notification alone. Additionally: **staged fallback approach** — try Convocore's email notification + Zenny's own KB-informed response first; only escalate to an additional notification method if that combination proves insufficient.

**Why it matters:** this is a genuine behavior change to how the Runtime's escalation/handoff logic works when the originating platform is Convocore specifically — not just a passive log write, per your note that "our workflow will also be triggered."

**Proposed change:** `Agent_Runtime_System_v1.md`'s Human Handoff Handler section needs an addition describing: (a) Convocore-originated handoffs trigger a real Runtime-level escalation write, (b) the staged fallback logic (Convocore email + KB response first, additional notification only if insufficient — and **what "insufficient" means operationally needs defining**, this is itself a DECISION NEEDED, not specified by your answer).

**Status:** Direction CONFIRMED, exact "insufficient" trigger condition NEEDS DECISION.

### 2.2 Lead Qualification — Convocore funnel as primary, own scoring as fallback

**What was found:** confirmed decision — use Convocore's built-in Lead Qualification Funnel as the primary lead-scoring mechanism, not Zenny's own Growth Agent scoring, at least initially. Own scoring only gets built/used if Convocore's funnel underperforms.

**Why it matters:** this is a real, significant simplification of what Growth Agent needs to do at launch — it changes Growth Agent's scope from "build and own lead scoring" to "consume Convocore's score, with a fallback path reserved for later." Worth stating explicitly in the Runtime doc so nobody builds a competing scorer by default.

**Proposed change:** `Agent_Runtime_System_v1.md`'s Growth Agent section should note this precedence explicitly, plus the operational note that **Convocore's funnel requires real dashboard setup work per client** (qualification steps, point weights) — this isn't zero-config, and whatever provisions a new Convocore agent needs to account for that setup step.

**Status:** CONFIRMED direction; the *trigger condition for "underperforming enough to switch to own scoring"* is a DECISION NEEDED, not specified.

### 2.3 `runtime_module` — embedded logic, not variable-based inference

**What was found:** reversed from an earlier recommendation. Confirmed decision: Convocore node prompts will contain **embedded module logic** directly (the business logic itself lives in what gets pasted into Convocore's prompt fields), rather than the Adapter inferring the module from which Tool was called, and rather than a variable-based conditional the LLM would have to reason about (explicitly rejected — risk of LLM hallucination on conditional variable logic).

**Why it matters — and this is the one item in this whole document with the largest ripple effect:** the Runtime's own logic must be **expressible as static, copy-pasteable prompt text** per active module combination. This is a new constraint on how Runtime logic gets authored — it can't just live as backend code no one outside Zenny's dev team ever sees; a version of it needs to exist in a form a non-developer (or semi-technical builder) can paste into a Convocore node.

**Proposed change:** `Agent_Runtime_System_v1.md` needs a new section acknowledging this constraint explicitly — Runtime logic that will ever run inside a Convocore-hosted node must have a corresponding "prompt-embeddable" version maintained alongside it. This isn't optional documentation, it's a real authoring discipline change.

**Status:** Direction CONFIRMED. **This also spawns a brand-new system requirement — see Part 6.1 (Template Dashboard) — which is a build task, not a documentation edit.**

### 2.4 Recovery Engine — no API path, default/manual only (current state)

**What was found:** confirmed — three investigated API paths (WebSocket prompt-field misuse, Campaigns, the messages-overwrite endpoint) all confirmed dead ends for sending an actual outbound recovery message. Current state: **email-only, manual/default recovery**, pending Convocore's response to the support inquiry already sent.

**Why it matters:** this is a real, current behavior constraint on Recovery Engine, not a future consideration — if Recovery Engine is being built now, it needs to be built knowing this channel doesn't exist yet, not architected around an assumption it will.

**Proposed change:** `Agent_Runtime_System_v1.md`'s Recovery Engine section should note this constraint plainly, with a pointer to revisit once Convocore responds (tracked in Part 8 of this document).

**Status:** CONFIRMED current-state constraint.

### 2.5 Convocore-sourced data precedence — applies across multiple modules

**What was found:** ties to Database Part 1.6 — the "Convocore first, own stack as fallback" rule for summary/sentiment/cost/lead-score applies to whichever Runtime module consumes each piece of data (Core Agent for summaries, Growth Agent for lead score, potentially Email Manager for context).

**Why it matters:** without stating this centrally, each module might independently decide its own precedence rule, risking the exact inconsistency (two different answers reaching your team) this rule was designed to prevent.

**Proposed change:** `Agent_Runtime_System_v1.md` should state this precedence rule once, centrally (e.g. in a shared principles/conventions section), rather than repeating it per-module — so every module that touches Convocore-available data inherits the same rule by default.

**Status:** CONFIRMED direction; exact fallback trigger conditions per data type are a DECISION NEEDED (same pattern as 2.1/2.2 — "when is Convocore's version insufficient" needs a real definition, not left implicit).

---

# PART 3 — `n8n_Workflow_Specification_v1.md`

### 3.1 Convocore Adapter needs a real `ADP-{NNN}` registry entry

**What was found:** the Specification already reserves the `ADP-{NNN}` ID prefix and Folder 08 for Platform Adapters, but no registry entry exists yet for Convocore.

**Why it matters:** without a real ID, no Build Card can correctly reference the Convocore Adapter per this document's own ID discipline.

**Proposed change:** add a Part 17 (or wherever the adapter registry lives) entry: `ADP-002 | Convocore Adapter | Specified | Folder 08 | Convocore_Adapter_Spec_v1.md` (exact next-available ID number to be confirmed against whatever's already assigned).

**Status:** CONFIRMED, blocking — needed before a Convocore Adapter Build Card can be written at all.

### 3.2 Stale "prospective" status lines (3 documents)

**What was found:** `n8n_Workflow_Specification_v1.md` Part 17.4, `INTEGRATION_CONTRACT_v1.md` Part 17.4, and `n8n_Execution_Architecture_v1.md` Part 16.4 all still read "Convocore | Prospective — not yet built or confirmed." No longer accurate.

**Proposed change:** update all three to something like `Convocore | Adapter Specified — see Convocore_Adapter_Spec_v1.md | Build not yet started`.

**Status:** CONFIRMED, low urgency (documentation accuracy only).

### 3.3 New scheduled workflow: Shopify/WooCommerce → Convocore KB sync

**What was found:** confirmed new requirement — Zenny needs a workflow that pulls product/inventory data from a client's Shopify or WooCommerce store and pushes it into Convocore's KB via API, on a schedule and/or update-triggered. Both read (fetch from store) and write (update Convocore KB) directions needed.

**Why it matters:** this is a brand-new workflow that doesn't exist in any current Build Card or Scheduled Workflow registry entry — it's a direct consequence of the "product data lives in Convocore's KB, never in Zenny's database" decision (Database Part 1.7), and needs to be built, not just noted.

**Proposed change:** new `SCH-{NNN}` registry entry — scheduled (and/or webhook-triggered on store update, if the store platform supports it) workflow: fetch product/inventory from Shopify/WooCommerce → transform → push into the relevant Convocore agent's KB via `POST`/`PATCH /agents/{agentId}/kb`.

**Status:** CONFIRMED requirement, NOT YET DESIGNED — this is flagged as a real build task, full workflow design (exact trigger cadence, transform logic, error handling) is a DECISION NEEDED / build task, not resolved here.

### 3.4 Tool Key = Runtime `tool_name` — now a binding convention

**What was found:** previously a recommendation, now confirmed binding — every Convocore Custom Tool's `Key` field must be created identical to its corresponding Runtime `tool_name` (per the existing Tool Name registry, Part 4/7).

**Why it matters:** keeps the Adapter's tool-name mapping a pure pass-through, no translation table needed — but only holds if actually enforced at build time.

**Proposed change:** this convention should be stated explicitly wherever Convocore Custom Tools get built (the future Build Order Guide, Step 3 of this project) — flagging here so it's tracked as a real, binding rule, not lost.

**Status:** CONFIRMED, binding.

---

# PART 4 — `Client_Integration_and_Credential_Platform_v1.md`

### 4.1 Shopify — formal exception to the standard OAuth model

**What was found:** confirmed, precise shape — Convocore's native Shopify system tool gets used (for conversational product Q&A), fed with the client's own Shopify credentials. But this stays **fully abstracted from the client** — the client only ever interacts with Zenny's own credential platform (giving Shopify OAuth access, or just Client ID + Secret). Zenny's backend then manually/programmatically places those credentials into Convocore's system. The client never touches Convocore directly for this.

**Why it matters:** this is a real, deliberate exception to the standard "every integration routes through Zenny's own registered OAuth app" model — worth a formal addendum rather than an ambiguous gap, since without one, a future builder might assume Shopify should work exactly like every other integration.

**Proposed change:** add a short, explicit addendum section to `Client_Integration_and_Credential_Platform_v1.md`: *"Shopify is a confirmed exception — client credentials are collected via the standard credential platform UI, but are manually provisioned into Convocore's native Shopify tool rather than used by a Zenny-owned integration workflow. This is intentional, not a gap."*

**Status:** CONFIRMED.

### 4.2 New credential fields: Twilio (Account SID, Auth Token, phone number)

**What was found:** confirmed — needed in **every case** of voice or SMS agent usage, since Convocore-purchased numbers are explicitly ruled out (Zenny always uses the client's own Twilio number, whether client-provided or purchased directly from Twilio outside Convocore).

**Why it matters:** this simplifies what could have been a two-model decision (Convocore-managed vs. client-managed numbers) into one consistent model — but it's still a new credential type the platform doesn't currently collect.

**Proposed change:** add new credential-platform fields: Twilio **Account SID**, **Auth Token**, and the **phone number** itself. Client provides these regardless of whether the underlying number was self-purchased from Twilio or provided by Zenny — the credential platform is where they always get entered. This is entirely client-facing (per 4.3) and needs its own UI/collection flow, same as every other credential type already in this platform.

**Status:** CONFIRMED.

### 4.3 Voice/SMS provisioning is fully backend-abstracted from the client

**What was found:** confirmed — once a client submits their Twilio credentials via the credential platform, all further setup (assigning the number to the correct Convocore agent, etc.) is performed by Zenny's backend, never client-facing.

**Why it matters:** clarifies the division of responsibility cleanly — worth stating explicitly so a builder doesn't accidentally expose Convocore-side configuration steps to clients.

**Status:** CONFIRMED, documentation-only addition.

---

# PART 5 — `INTEGRATION_CONTRACT_v1.md` / `n8n_Execution_Architecture_v1.md`

### 5.1 Same stale status update as Part 3.2

Covered in Part 3.2 above — both documents share the identical stale line, update together.

### 5.2 No contract-shape changes required

**Confirmed, re-verified this round:** nothing found in this entire session's worth of decisions requires changing the Standard Request/Response Contract's actual field shape (Part 5/8 of that document). Every Convocore-specific decision (embedded module logic, Shopify exception, Twilio fields, etc.) is either an Adapter-side translation concern or a Runtime/Database concern — none of it touches the platform-agnostic contract itself. Worth stating explicitly so this remains a confirmed, not assumed, verdict.

---

# PART 6 — New Systems Required (Build Tasks, Not Document Edits)

These aren't changes to an existing frozen document — they're new things that need to be designed and built, surfaced here so they don't get lost.

### 6.1 Template Dashboard (module-to-Convocore-prompt generator)

**What was found:** confirmed new concept — a dashboard that takes "which modules are active for this client" as input, and outputs the exact embedded-logic prompt text a builder should paste into the relevant Convocore node(s). Framed as a "copy-paste task" for the person building each client's agent.

**Why it matters:** this is the direct enabling mechanism for the "embedded logic in Convocore prompts" decision (Runtime Part 2.3) — without it, every Convocore agent build would require manually re-deriving the correct prompt text per module combination, which doesn't scale and risks inconsistency between clients.

**Status:** CONFIRMED requirement, **not designed at all yet** — this is a genuinely new system, on the scale of its own project, not a quick addition. Flagging its existence and rationale; actual design is future work, explicitly out of this document's scope.

### 6.2 Agent Naming Convention

Covered in Database Part 1.2 — repeated here because it's a design task, not just a schema field.

### 6.3 Shopify/WooCommerce Sync Workflow

Covered in Workflow Spec Part 3.3 — repeated here because it's a genuine new build, not a config change.

---

# PART 7 — Confirmed Architectural Decisions Feeding Into the Adapter Spec (Step 2)

These are resolved and will be written into `Convocore_Adapter_Spec_v1.md`'s next revision — listed here only as a pointer/index so this document is a complete record, not duplicated in full detail (full detail belongs in the Adapter Spec itself):

- `runtime_module` — embedded logic approach (Part 2.3)
- `human-handoff` — deep integration, staged fallback (Part 2.1)
- Shopify credential routing (Part 4.1)
- Twilio/voice provisioning model — always client's own SID/Token, fully backend-abstracted (Part 4.2/4.3)
- Tool Key = Runtime tool_name, now binding (Part 3.4)
- `conversation_id` column sourcing rule (Part 1.3)
- Voice: one node handles both chat and voice, via two separate instruction slots (Text/Voice) per node — including Start Node
- Voice: Google Live model confirmed incompatible with multi-node agents (ties to Ground Truth §2.4's existing "Multiple Nodes Detected" warning)
- Voice Webhook (Server URL/Advanced Settings) vs. Custom Tools — confirmed genuinely separate mechanisms (automatic/one-way/fire-and-forget vs. instruction-driven/two-way); voice agents CAN already call regular Custom Tools mid-call without needing the webhook. Webhook itself: deprioritized for now, not a blocker.
- MCP connection method: npx confirmed as default; `run_command` permanently off-limits regardless of connection method (not just risk-reduced under Docker)
- Voice configuration (Transcriber/Speech-Gen/Advanced settings) templating: explicitly deferred, out of scope for this build phase — manual per-client configuration for now

---

# PART 8 — Convocore Platform Bugs / Risks (Tracking, Not a Zenny-Side Change)

Nothing in this Part requires a change to Zenny's own system — these are Convocore-side issues worth tracking centrally so they're not lost, and worth reporting.

### 8.1 `childrenNodes` — worse than previously documented

**Updated finding:** previously documented as "saves without error but crashes `interact_with_agent` at runtime." **New, more precise finding this round:** the bug also manifests as a **visually blank/broken node in the Canvas dashboard UI**, even when the underlying API/MCP call reports success — reproduced via both API and MCP. This is worse than the original finding because it can mislead a human reviewing the Canvas visually, not just crash at conversation-time.

**Also newly noted:** the crash itself did NOT reproduce on a third, later test under a structurally similar setup — flagged as **intermittent, not resolved**. One clean run does not outweigh two independent crash reproductions.

**Action:** update the pending Convocore bug report (Part 8.4) with this sharper description before sending.

### 8.2 Custom Metrics `PATCH` — broken

**Finding:** `PATCH` on a valid, existing Custom Metric ID returns 404, even though `GET` and `DELETE` both work correctly on the same ID moments apart. Newly discovered this round, not previously documented.

### 8.3 Telegram conversations — third distinct failure mode

**Finding:** a real, organic Telegram conversation returns `500 "Output validation failed"` on `GET` — reproduced twice. This is confirmed **different** from the well-known "Conversation not found" bug (that one affects REST-created conversations; this affects a real Telegram conversation specifically). A third, previously undocumented failure mode.

### 8.4 Pending action: send updated bug report

**Status:** the MCP bug report (previously drafted, held per your "no hurry" instruction) was always going to wait for a retest against a manually-created agent — that retest is now done (NextGen AI Assistant, this session), plus the Zenny-UI REST retest. **The bug report itself still needs a final rewrite** incorporating: the sharper `childrenNodes` finding (8.1), Custom Metrics PATCH (8.2), and the Telegram 500 (8.3) — not yet written, flagged as a pending task, not resolved by this document.

---

# PART 9 — Closed / No Longer Open (For the Record)

Items that were open in earlier drafts of this project's findings, now definitively closed:

- **API-created agent's "simpler interface"** — confirmed a false alarm; Convocore updated their dashboard UI, not a real Zenny-side finding. No action.
- **Workspace-secret mix-up (both earlier incidents)** — confirmed both were on your end, not a Convocore issue. No action.
- **Unanswered "notify the Messenger recipient" question** — confirmed moot; you were both the tester and the real recipient throughout. No action.
- **`defaultValue` field mystery (Variables)** — confirmed real and functional at the API level, simply not surfaced in the dashboard UI. Not a contradiction; Ground Truth doc's original suspicion was correct.
- **REST-vs-WebSocket conversation origination rule** — fully resolved and confirmed stable across three independent workspace tests. No longer an open risk, now a settled build rule (already reflected in Part 1.3 above).

---

# PART 10 — Summary Table: All Items Needing a Builder Decision

Everything marked "DECISION NEEDED" above, in one place:

| # | Item | Where |
|---|---|---|
| 1 | `control.convocore_agent_map` — dedicated table vs. columns on client table | Database 1.1 |
| 2 | Agent naming convention — actual design | Database 1.2 / Part 6.2 |
| 3 | Convocore auto-generated data storage shape — columns on `leads` vs. separate conversation-keyed table | Database 1.6 |
| 4 | `escalations` table column compatibility with `team_key`/`issue_summary` | Database 1.8 |
| 5 | "Insufficient" trigger condition for handoff fallback escalation | Runtime 2.1 |
| 6 | "Underperforming" trigger condition for switching off Convocore's lead funnel | Runtime 2.2 |
| 7 | Fallback trigger conditions for Convocore-data precedence generally | Runtime 2.5 |
| 8 | Shopify/WooCommerce sync workflow — full design (cadence, transform, errors) | Workflow Spec 3.3 |

Everything else in this document is a confirmed decision, ready to act on.

---

## Document Changelog
- **v1** — original findings doc, 10 findings against the initial Adapter Spec draft.
- **v1.1** — Finding #9 corrected following REST-creation-specific conversation bug discovery.
- **v2 (this version, FINAL)** — complete rewrite. Absorbs `Convocore_Session_Closeout_v1.md` in full. Reorganized by target frozen document (Database, Runtime, Workflow Spec, Credential Platform, Contract/Execution Architecture) rather than by discovery order, so a builder can act directly per-document. Incorporates all 31 answered items from the latest decision round, the three voice-support-bot screenshots (filtered — only structural facts kept, vendor-claimed specifics like exact webhook event names/payloads explicitly NOT treated as verified), the sharper `childrenNodes` Canvas-UI finding, and two newly discovered bugs (Custom Metrics PATCH, Telegram 500). Introduces Part 6 (new systems required — Template Dashboard, Shopify sync workflow) as a distinct category from document edits. Part 10 consolidates every remaining builder decision into one table. This document is now the single source for "what needs to change because of Convocore" — Session Closeout doc is retired.
