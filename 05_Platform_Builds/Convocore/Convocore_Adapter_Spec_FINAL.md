# Convocore Adapter Spec (FINAL — Single Entry Point)

```
Status:     FINAL. Supersedes Convocore_Adapter_Spec_v1.md (and its v1.1
            Voice addition) entirely.
Purpose:    This document is the SINGLE ENTRY POINT for how Zenny's
            Runtime, Execution Layer, and Database relate to Convocore.
            Any future question of the shape "how does X work with
            Convocore" should be answerable from this document, or from
            a document this one explicitly points to. Nothing about
            Convocore should need to be re-derived from scratch elsewhere
            in the system.
Position:   Sits at the Conversation Layer / Adapter boundary, exactly
            where n8n_Execution_Architecture_v1.md Part 16.4 and
            INTEGRATION_CONTRACT_v1.md Part 17.4 reserved a slot for it.
            Registered as ADP-002 in n8n_Workflow_Specification_v1.md
            (per Convocore_Findings_Required_Updates_FINAL.md Part 3.1).
Frozen documents this respects, does not redesign:
            Agent_Runtime_System_v1.md, Database_Structure_v4_FINAL.md,
            n8n_Execution_Architecture_v1.md, INTEGRATION_CONTRACT_v1.md.
            Where any Convocore-specific reality required a change to one
            of these, that change is tracked in
            Convocore_Findings_Required_Updates_FINAL.md, not made here.
```

---

## PART 0 — Document Map (Where to Look for What)

This document is the entry point, not the only Convocore document. Route deeper questions to the right source:

| Question | Go to |
|---|---|
| "How does Zenny's system talk to Convocore?" | **This document** |
| "What needs to change in our frozen docs because of Convocore?" | `Convocore_Findings_Required_Updates_FINAL.md` |
| "How does a specific Canvas node/Tool/Variable field actually work?" | `Convocore_Canvas_Ground_Truth_FINAL.md` |
| "How do I actually build a well-configured Convocore agent, step by step?" | `Convocore_Agent_Build_Order_Guide_v2.md` |
| "What does a specific REST endpoint's request/response look like?" | `Convocore_API_Reference_v1.md` |
| "Has endpoint X been live-tested, and what happened?" | `Convocore_REST_Live_Test_v1.md` |
| "What can Convocore's MCP server actually do, and what are its bugs?" | `Convocore_MCP_Reference_v1.md` |
| "General Convocore platform concepts (Canvas, Tools, channels, pricing)" | `Convocore_Master_Reference_v3.md` |

**Confidence levels differ across these documents — this matters when reading them.** `Convocore_Canvas_Ground_Truth_FINAL.md`, `Convocore_REST_Live_Test_v1.md`, and `Convocore_MCP_Reference_v1.md` are built from direct, live, reproducible testing — treat their findings as fact. `Convocore_Master_Reference_v3.md` and this document's Voice section (Part 13) are sourced substantially from Convocore's own published docs and, for Voice specifically, Convocore's own AI support assistant — useful, but not independently verified to the same standard. Where this matters, it's flagged explicitly at the point of use, not just here.

---

## PART 1 — Architectural Position (Unchanged, Confirmed)

### 1.1 Where Convocore sits

```
Customer
    │
    ▼
Conversation Layer (Convocore: Canvas flow, widget/channel delivery, Voice)
    │
    ▼
Convocore Adapter  ◄── THIS DOCUMENT specifies this layer's translation rules
    │
    ▼
Agent Runtime System              (unchanged — makes business decisions)
    │
    ▼
Execution Layer (n8n)              (unchanged — performs operations)
    │
    ▼
Database (Supabase)                 (unchanged — stores business truth)
```

### 1.2 What the Adapter may and must never do (unchanged, restated)

Per `INTEGRATION_CONTRACT_v1.md` Part 17.2/17.3, identical to every adapter (Voiceflow, Convocore, future LangGraph):

**May:** translate requests, normalize payloads, validate authentication, convert responses, handle platform-specific formatting.

**Must never:** execute business decisions, access databases directly, perform qualification, interpret customer psychology, implement Runtime logic.

**⚠️ This rule interacts directly with Part 8's embedded-logic decision below — read that section carefully.** The embedded-logic approach means Runtime *business logic content* now lives inside Convocore prompt text, authored by a Zenny-controlled Template Dashboard (`Convocore_Findings_Required_Updates_FINAL.md` Part 6.1) — not invented ad hoc by whoever builds a given agent, and not decided at runtime by the Adapter itself. The Adapter's own code still contains zero business logic; what changed is that the *execution instructions* for that logic can now live in Convocore's Canvas rather than exclusively in n8n. This is a deliberate, considered exception to keeping logic in one place — not a violation of the thin-adapter rule, but worth understanding precisely rather than assuming it's a contradiction.

### 1.3 What stays exactly the same regardless of adapter

Core Agent, Growth Agent, Conversion Engine, Recovery Engine, Email Manager, Utilities, Dashboard — none of these change whether the adapter is Voiceflow or Convocore.

---

## PART 2 — Client Resolution (First Step of Every Request)

### 2.1 The problem

Convocore has no native concept of Zenny's `client_id`. Every inbound request must resolve to one before anything else happens.

### 2.2 The resolution mechanism

```
Convocore webhook/Tool call fires
    → Adapter receives Convocore's agentId
    → Adapter resolves agentId → client_id
    → Adapter proceeds to build the Standard Request Contract (Part 4)
```

### 2.3 Where the mapping lives — pending final schema decision

**⚠️ Not yet finalized which exact schema shape stores this mapping** — `Convocore_Findings_Required_Updates_FINAL.md` Database Part 1.1 identifies two options (a dedicated `control.convocore_agent_map` table, or additional columns on the main client table) and flags this as a builder decision, not resolved here. **Whichever shape is chosen, it must store, at minimum:** `client_id`, `convocore_agent_id`, a secure reference to that agent's secret (Vault, never plaintext), `convocore_region` (`eu`/`na` — matters because EU/NA are genuinely separate API base URLs, confirmed in `Convocore_API_Reference_v1.md` §3), and the agent's display name (the name shown on the web chat widget — new requirement, Findings doc Database Part 1.2).

### 2.4 Authentication as a secondary confirmation

Per Ground Truth §6.2's confirmed behavior: a Custom Tool's Secret Key, if left blank, causes Convocore to send **the agent's own secret key** as the Bearer token automatically. The Adapter should use this as a real security check, not just a lookup convenience: after resolving `client_id` from `agentId`, confirm the Bearer token received matches that same agent's known secret — don't trust the `agentId` alone as sufficient authentication. Same discipline already required of Voiceflow's known-weak static webhook secret (`n8n_Execution_Architecture_v1.md` Part 16.3, flagged technical debt) — don't let Convocore repeat that same weakness by skipping the check.

---

## PART 3 — Standard Request Contract Mapping

### 3.1 The frozen contract (unchanged, restated for reference)

```json
{
  "request_id": "uuid",
  "contract_version": "v1",
  "correlation_id": "uuid",
  "client_id": "uuid",
  "conversation_id": "uuid",
  "runtime_module": "conversion_engine",
  "tool_name": "CreateAppointment",
  "timestamp": "2026-07-18T09:30:00Z",
  "idempotency_key": "string",
  "payload": {},
  "authentication": {}
}
```

### 3.2 Field-by-field source, confirmed

| Contract Field | Convocore Source |
|---|---|
| `request_id` | Generated by the Adapter itself |
| `contract_version` | Fixed `"v1"` |
| `correlation_id` | Generated/owned by Runtime — Adapter only echoes it on the response leg, never generates or replaces it |
| `client_id` | Resolved per Part 2 |
| `conversation_id` | Convocore's `conversation_id` system variable — **only trustworthy if the conversation originated via WebSocket, never `POST /convos`** (Part 12.2 covers this rule in full) |
| `runtime_module` | **Set via embedded prompt logic, not inferred by the Adapter** — see Part 8, this is a confirmed reversal of an earlier draft's recommendation |
| `tool_name` | Convocore Custom Tool's `Key` field — **must be identical to the Runtime's `tool_name` registry entry, now a binding convention** (Findings doc Workflow Spec Part 3.4), making this mapping a pure pass-through |
| `timestamp` | Convocore's `timestamp` system variable (ISO 8601) |
| `idempotency_key` | Constructed by the Adapter — no Convocore source, matches the existing pattern (`{action}_{client_id}_{conversation_id}` or similar, per `INTEGRATION_CONTRACT_v1.md` Part 20 examples) |
| `payload` | Built from the Custom Tool's attached Variables — see Part 5 |
| `authentication` | The Custom Tool's Bearer token (agent secret) — see Part 2.4 |

### 3.3 Response leg

Per `INTEGRATION_CONTRACT_v1.md` Part 8: the Adapter translates the Standard Response Contract back into a webhook response Convocore's calling Tool can use. **This must be detailed, human-readable JSON** — confirmed both by Convocore's own UI guidance (Ground Truth §6.2: *"a terse or ambiguous response causes the LLM to struggle to understand what is going on"*) and by this project's general findings — a vague response measurably increases hallucination risk on Convocore's side. This is a hard requirement on the Adapter's response-formatting logic, not a stylistic suggestion.

---

## PART 4 — Tool Name Registry Alignment (Now Binding)

**Confirmed, binding convention:** every Convocore Custom Tool's `Key` field is created identical to its corresponding Runtime `tool_name` (`CreateAppointment`, `CreateLead`, etc. — the existing registry, `INTEGRATION_CONTRACT_v1.md` Part 4). This makes Part 3.2's `tool_name` mapping a pure pass-through — no translation table needed, no drift risk between two parallel naming vocabularies.

**System Tools vs. Custom Tools — different Adapter treatment (unchanged from earlier draft, reconfirmed):**
- **`forward-call`, `end-call`** — pure Convocore-native voice actions, zero configuration, no Standard Request Contract mapping exists or is needed. Confirmed out of Adapter scope.
- **`human-handoff`** — now confirmed **deep integration** (Part 9) — a real trigger path into the Standard Request Contract, distinct from a normal Custom Tool call.
- **`shopify`** — confirmed exception, credential-routed but not Adapter-mediated for the conversational Q&A use itself (Part 10).
- **Everything else** — standard Custom Tools, full Part 3 mapping applies.

---

## PART 5 — Variables → Payload Field Mapping

### 5.1 The mechanism (confirmed, unchanged)

A Custom Tool's parameters are Variables attached to that Tool (Ground Truth §6.2/§7.2). Each Variable's `Key` becomes a `payload` field name; its captured value becomes that field's value.

**Naming discipline, same principle as Part 4:** a Variable's `Key` attached to a given Tool should match the field name the Execution Layer's corresponding workflow actually expects (once `n8n_Workflow_Specification_v1.md`'s per-Tool payload schemas exist for a given Tool) — avoiding a second translation table, same reasoning as the Tool-naming convention.

### 5.2 System Variables

Read-only, auto-populated (`conversation_id`, `user_name`, `user_email`, `phone_number`, `channel`, `agent_id`, `agent_name`, `user_id` — full list, Ground Truth §7.5). These map to the Contract's top-level fields (Part 3.2), not generally into `payload` — except where a specific workflow genuinely needs one as a business-data input, in which case it's included the same way as any other Variable.

### 5.3 ENV Variables — never part of payload

Confirmed: ENV-type Variables are deliberately hidden from the LLM (Ground Truth §7.2) and used only for tool-authentication secrets. Never appear in conversational payload construction — Adapter/Convocore-side authentication concern only (Part 2.4).

### 5.4 Capture requires explicit instruction

Confirmed (Ground Truth §7.4): Convocore does **not** auto-infer and write Variables from their Description alone — every Variable that needs a value captured from conversation requires an explicit instruction in the node's prompt (e.g. *"When the user provides their name, save it to 'user_name'"*). This is directly relevant to how the Template Dashboard (Part 8) generates prompt text — capture instructions for any Variable a module's logic depends on must be included in the generated prompt, not assumed to happen automatically.

---

## PART 6 — Voice Webhook vs. Custom Tools (Clarified — Resolves an Earlier Open Question)

**Confirmed, structural fact (source: Convocore's own AI support assistant — treat as reasonably reliable for this specific mechanism-level question, though not independently live-tested by us):** the **Voice Webhook** (Server URL field, Voice → Advanced Settings) and **Custom Tools** are two genuinely separate mechanisms, not competing options for the same job:

| | Voice Webhook | Custom Tools (during a call) |
|---|---|---|
| Trigger | Automatic, on call lifecycle events | On-demand, via prompt instruction |
| Direction | Convocore → your server, one-way | Agent → your server → Agent (two-way) |
| Response | Fire-and-forget, no reply expected | Agent waits for and uses the response |
| Use case | Passive logging/notification | Real-time data lookup, decisions mid-call |

**Practical implication, confirmed:** voice agents can already call Zenny's normal Custom Tools mid-call, through the exact same Part 3-5 mapping as any text conversation — **no separate mechanism is needed for a voice agent to reach the Runtime/Execution Layer.** The Voice Webhook is a distinct, optional, passive logging channel.

**Decision:** the Voice Webhook is **not used for now** — deprioritized, not a blocker to voice functionality. If used later, it would need its own payload-shape investigation (its exact event names/payload structure have not been independently verified — the specific event list and JSON shape shown by Convocore's support assistant should be treated as unconfirmed until tested) and its own new database/schema consideration, tracked as a future item, not resolved here.

---

## PART 7 — `human-handoff` (Deep Integration, Staged Fallback)

**Confirmed decision:** Convocore's `human-handoff` Tool invocations trigger a real Runtime-level escalation, written into the `escalations` table architecture — not left as a Convocore-internal-only email notification.

**Staged fallback approach, confirmed:**
1. First: Convocore's own email notification + Zenny's KB-informed response
2. Only if that combination proves insufficient: an additional notification method

**⚠️ Genuinely open, not resolved here:** the exact operational definition of "insufficient" (what triggers stage 2) — tracked as a builder decision in `Convocore_Findings_Required_Updates_FINAL.md` Runtime Part 2.1.

**⚠️ Also open:** whether the existing `escalations` table's columns cleanly accommodate Convocore's `team_key`/`issue_summary` shape, or need a new column — tracked in the Findings doc Database Part 1.8.

**Mechanism note:** this requires the Adapter to have a trigger path for `human-handoff` specifically, distinct from a standard Custom Tool call (Part 4's system-tool treatment) — since `human-handoff` is a Convocore system tool, not a Zenny-defined Custom Tool with a Runtime-registry-matched Key.

---

## PART 8 — `runtime_module` — Embedded Prompt Logic (Confirmed Reversal, Read Carefully)

### 8.1 The decision

**Confirmed, and this is the single most architecturally significant decision in this document:** `runtime_module` (and the business logic that determines which module's behavior applies) is set via **embedded logic directly in Convocore's node prompts** — not inferred by the Adapter from which Tool was called, and not driven by a runtime conditional variable the LLM would have to reason about at conversation time.

**Why embedded logic was chosen over the alternatives, stated plainly for context:**
- Tool-name inference was rejected because deciding "which module owns this" based on which tool got called is itself a light business-logic judgment — exactly what Part 1.2's adapter rule says must never live in the Adapter.
- A runtime conditional variable (`if {module_variable} == X, do Y, else Z`) was explicitly rejected because this class of conditional logic is prone to LLM hallucination when embedded in a natural-language prompt — an LLM reasoning over "if this variable is set, behave this way" is a weaker, less predictable mechanism than static, pre-written instructions.
- **Embedded logic** — the actual module behavior is written directly into the node's Instructions as static text, generated per-client based on which modules are active — sidesteps both problems. The Adapter and the Convocore prompt itself carry zero runtime decision-making; the decision of *which* logic applies was already made **before** the agent was built, not during a live conversation.

### 8.2 What this requires — the Template Dashboard

This decision is only workable with a system that generates the correct embedded prompt text per client, per active module combination — otherwise every agent build would require manually re-deriving correct logic, which doesn't scale and risks drift between clients.

**This system does not exist yet.** It's a confirmed requirement, tracked as a new build task in `Convocore_Findings_Required_Updates_FINAL.md` Part 6.1 — described there as: a dashboard that takes "which modules are active for this client" as input, and outputs the exact prompt text a builder pastes into the relevant Convocore node(s). Not designed in this document; flagged here because the Adapter's own correctness depends on this system existing and working correctly once built.

### 8.3 Consequence for Runtime documentation

Per Findings doc Runtime Part 2.3: any Runtime module logic that will ever run inside a Convocore-hosted node needs a maintained, prompt-embeddable version alongside its normal implementation — a real authoring discipline, not just a note.

---

## PART 9 — Lead Qualification Funnel Precedence

**Confirmed decision:** Convocore's built-in Lead Qualification Funnel is the **primary** lead-scoring mechanism, not Zenny's own Growth Agent scoring. Growth Agent's own scoring is reserved as a fallback, built and used only if Convocore's funnel underperforms.

**Operational note, confirmed:** Convocore's funnel requires real per-client dashboard setup (qualification steps, point weights, notification thresholds — Ground Truth §7.6-equivalent, Master Reference §8) — not zero-config. Whatever provisions a new Convocore agent (manually today, eventually via the Build Order Guide) must include this setup step.

**⚠️ Open:** the exact trigger condition for "underperforming enough to build/switch to Zenny's own scoring" — tracked in Findings doc Runtime Part 2.2.

---

## PART 10 — Shopify

### 10.1 Confirmed shape

Convocore's native `shopify` system tool is used for conversational product Q&A (read-only — orders/products/product_listings/customers, per Ground Truth §6.1/§22.8). Client credentials (Shopify OAuth or Client ID+Secret) are collected through **Zenny's own credential platform** — the client never interacts with Convocore directly for this. Zenny's backend then manually/programmatically provisions those credentials into Convocore's system.

This is a **confirmed, formal exception** to the standard "every integration routes through Zenny's own OAuth app" model (`Client_Integration_and_Credential_Platform_v1.md` — addendum required, Findings doc Part 4.1).

### 10.2 Separate, new requirement: product/inventory sync workflow

**Confirmed:** Zenny's own database never stores product or inventory data (Findings doc Database Part 1.7) — it stays FAQ/business-knowledge only. Instead, a **new scheduled/triggered workflow** is required: pull product/inventory from Shopify **and WooCommerce** → push into Convocore's KB via API (both read-from-store and write-to-Convocore-KB directions).

This workflow does not exist yet — tracked as a new build task, Findings doc Workflow Spec Part 3.3. It is architecturally distinct from the `shopify` system tool itself: the system tool handles live conversational lookups (orders, current stock), while this new workflow keeps Convocore's KB populated with product *descriptions/catalogue* content for general Q&A.

---

## PART 11 — Recovery Messaging (Current State: No API Path)

**Confirmed, current-state constraint:** three investigated paths (WebSocket `prompt` field — simulates the customer, not the agent; Campaigns — no single-conversation targeting exists; the `PATCH .../messages` endpoint — overwrites the stored record without delivering anything, and destructively replaces history rather than appending) are all confirmed dead ends for triggering a genuine agent-initiated outbound message.

**Current behavior:** Recovery Engine uses **email only**, manually/by default, until Convocore responds to the support inquiry already sent (tracking this response is an open external dependency, not a Zenny-side task).

**Direct channel API was considered and ruled out:** Zenny does not hold its own WhatsApp/Messenger channel credentials — only integration-level OAuth exists in the credential platform, not channel-level. This path is closed, not just deprioritized.

---

## PART 12 — Conversation Origination Rule (Critical Build Constraint)

### 12.1 The corrected, precise rule

**Confirmed, live-tested across three independent workspaces:** conversations created via `POST /agents/{agentId}/convos` (REST) are structurally broken for every later single-item operation (`GET`/`PATCH`/`DELETE`) — 100% reproducible failure, identifiable by their `{agentId}_{suffix}` ID pattern. Conversations originated by a **real WebSocket Interact turn** — whether a genuine user or a backend-simulated one — work completely correctly on all the same operations.

### 12.2 The build rule this creates

**Any Zenny component that will need to read, tag, update, or reference a conversation later must originate that conversation via a real WebSocket Interact turn, never `POST /convos`.** `POST /convos` should be treated as write-once/read-never (bulk import only) — matching what Convocore's own API Reference already describes it as being for.

This directly governs the `leads.convocore_conversation_id` column (Findings doc Database Part 1.3) — that column is only safe to populate from a WebSocket-originated ID.

### 12.3 Related, confirmed platform risks (see Part 16 for the full list)

`childrenNodes` wiring, `kb/stats` on empty KB, `get_agent_usage`/`search_agents` auth behavior, Custom Metrics `PATCH`, and Telegram's distinct 500 error — all tracked in Part 16, not repeated here.

---

## PART 13 — Voice

> ⚠️ **Confidence level, stated plainly:** substantially more detail is confirmed this round than the earlier draft (via 7 direct decision answers), but this section remains sourced from a mix of Convocore's published documentation and Convocore's own AI support assistant's answers — **not independently live-tested** the way Canvas/Tools/Variables were. Treat structural facts (node behavior, mechanism existence) as reliable; treat specific settings/recommendations (exact model picks, temperature values, cost tables) as unconfirmed vendor suggestions, not verified findings.

### 13.1 Core confirmed structure — one node, two instruction slots

**Confirmed, important:** a single Canvas node handles **both chat and voice** — there is no need for separate nodes per channel. Every node (including the Start Node) has **two separate instruction slots: Text and Voice.** Configuring a voice agent is two pieces of work: (a) number provisioning (Part 13.3) + basic voice-tab settings (model, language selection), and (b) writing the Voice-slot instructions in each relevant node, alongside the existing Text-slot instructions already used for chat.

**Confirmed constraint:** the Google Live model is **incompatible with multi-node agents** (ties directly to the "Multiple Nodes Detected" warning already documented in Ground Truth §2.4) — any voice agent using more than one Canvas node must use a non-Live-model voice pipeline (standard Transcriber+LLM+Speech-Gen, not the Live all-in-one).

### 13.2 Tool access during calls

Per Part 6: voice agents can call standard Custom Tools mid-call through the normal Part 3-5 mapping, no separate mechanism required. The Voice Webhook is a distinct, currently-unused, passive logging channel.

### 13.3 Client-side provisioning — confirmed, single model

**Confirmed: Twilio only, in every case** — Convocore-purchased numbers are not used. The number may be one the client already owns on their own Twilio account, or one purchased directly from Twilio outside Convocore — either way, Zenny always collects the same three credentials via its own credential platform: **Twilio Account SID, Auth Token, and the phone number itself** (Findings doc Credential Platform Part 4.2).

**Fully backend-abstracted from the client:** once submitted, all further setup (assigning the number to the correct Convocore agent, etc.) happens on Zenny's backend — never client-facing (Findings doc Credential Platform Part 4.3).

### 13.4 Voice configuration fields — deferred templating decision

Transcriber (Speech-to-Text), Speech Generation (Text-to-Speech), and Advanced/Call Behavior settings all exist and are configurable per Ground Truth §18.1-18.3, but **whether these become a Zenny-standard template or stay per-client-customized is explicitly deferred** — not decided in this build phase. Confirmed reasons for deferring: (a) real multi-client testing is needed before templating makes sense, (b) as of this round, **no "Record Calls" toggle is currently visible** in the dashboard (worth re-checking — may have changed), and (c) the number of model/language options currently available makes early templating premature.

### 13.5 Cost structure

**Confirmed:** voice billing is per-minute, three components: fixed platform charge + LLM cost + Twilio cost. Cross-references Master Reference §15.6/§18.4's documented formula — not independently re-verified this round, but consistent with what was already on file.

**⚠️ Open, not yet discussed anywhere in this project:** whether Zenny's own usage/cost tracking needs a voice-specific dimension added, separate from existing per-interaction/token tracking. Not resolved here.

### 13.6 `forward-call` destination numbers

**Confirmed:** purely prompt-instruction-based — a node's Instructions define when to use the tool and which number to forward to, either hardcoded in the prompt text or referenced via a Variable. No separate configuration surface exists for this.

### 13.7 Required before real voice build work

Per the confidence-level warning at the top of this Part: a genuine live-verification pass (parallel to what Canvas/Tools/Variables already received) is still owed before any of Part 13 is fully trusted for production building — specifically: does a real Twilio call create a WebSocket-equivalent "safe" conversation record (Part 12's rule) or something structurally different; what does the Server URL webhook actually send if ever configured; real per-minute cost confirmed against an actual test call.

---

## PART 14 — Convocore Auto-Generated Data — Utilization Precedence

**Confirmed, general rule:** for anything Convocore already computes — AI-generated conversation summary, per-message sentiment/feedback, token usage, cost, Lead Qualification Funnel score — Zenny uses **Convocore's version first**, storing it per lead (Findings doc Database Part 1.6). Zenny's own computation is a fallback only, built/used if Convocore's version proves insufficient. **Analytics (aggregate reporting) is explicitly excluded from this per-lead storage rule** — that stays live/pulled from Convocore's Analytics/Custom Metrics API, never duplicated into Zenny's own dashboard rollups by default.

**⚠️ Open:** exact "insufficient" trigger conditions per data type — tracked in Findings doc Runtime Part 2.5. Also open: the exact storage shape (columns on `leads` vs. a separate conversation-keyed table) — Findings doc Database Part 1.6.

---

## PART 15 — MCP's Role (Confirmed, Unchanged From Prior Decision)

**Confirmed, standing decision:** MCP is a **post-build checklist/verification tool only — never a build tool.** Reconfirmed multiple times this round, including on a third independent workspace and a real manually-built agent (not just disposable test agents) — the same category of unreliability persisted (Tools/Variables not exposed at all via MCP, conversation/usage bugs identical, and a newly sharpened finding: `childrenNodes` writes that succeed via MCP still render as a visually blank/broken node in the Canvas dashboard).

**Connection method, confirmed:** **npx**, not Docker, for whenever the checklist phase runs.

**Hard rule, confirmed, permanent regardless of connection method:** `run_command` (the arbitrary shell-execution tool exposed by the MCP server) is **never called, under any circumstance** — this is not conditional on Docker's sandboxing being present; it's a standing prohibition.

**API's role, similarly confirmed narrow:** the REST API is not a build tool either. Its only confirmed legitimate use going forward is **moving data from Convocore into Zenny's system** (summaries, metrics, KB sync workflows) — never building or wiring agents. All agent construction (Canvas nodes, wiring, Tools, Variables) happens manually in the dashboard, guided by the eventual Build Order Guide (Step 3 of this project).

---

## PART 16 — Known Platform Risks (Convocore-Side Bugs, Tracked Here for Build Awareness)

These require no Zenny-side schema/logic change by themselves, but must shape how the Adapter and any manual build process handles Convocore — listed here so a future builder sees them before hitting them in production, not after.

1. **`childrenNodes` wiring** — accepts a bare ID-string array with zero validation error at write time, but the routing engine can crash at runtime, AND separately/additionally can render as a visually blank/broken node in the Canvas dashboard even on a reported-success write. Confirmed via both MCP and direct REST/WebSocket. Crash reproduction has been inconsistent (reproduced twice, absent once under a similar setup) — treat as intermittent, not resolved. **Practical rule: never trust a multi-node Canvas flow's wiring based on dashboard visual state or a successful write response alone — always validate by actually running a test conversation via `interact_with_agent` or dashboard Test Mode.**
2. **REST-created conversations** — see Part 12, the core conversation-origination rule.
3. **`kb/stats` on an empty KB** — throws a `500` error; works correctly once real content exists. A realistic sequence (create agent → check KB stats before populating) currently fails — handle this gracefully, don't treat as a hard failure.
4. **`get_agent_usage` / `search_agents`** — `get_agent_usage` returns "Unauthorized workspace scope" consistently, confirmed across multiple credentials/agents, appears to be a genuine platform-side auth-scoping bug, not account-specific. `search_agents` runs successfully but always returns zero results, even for real matching agent names. **Workaround confirmed:** `POST /workspaces/{uid}/usage` (workspace-wide usage) works correctly with the same credential — use this instead of the broken agent-level endpoint, filtering client-side if per-agent breakdown is needed.
5. **Custom Metrics `PATCH`** — returns `404` on a valid, existing metric ID, even though `GET` and `DELETE` both work correctly on the same ID. Newly discovered, not previously documented.
6. **Telegram conversations** — a real, organic Telegram conversation can return `500 "Output validation failed"` on `GET` — confirmed distinct from the REST-creation bug (Part 12); this affects a genuinely real, WebSocket-equivalent conversation. A third, separate failure mode.

**Pending action, tracked in Findings doc Part 8.4, not resolved here:** an updated bug report incorporating all of the above needs to be finalized and sent to Convocore — drafted previously, held pending a retest (now complete), final rewrite still outstanding.

---

## PART 17 — What This Document Confirms Does NOT Need to Change

- **No redesign of `control.clients`, `client_config`, `templates`, or any of the common/archetype-specific tables** — Convocore is a Conversation Layer concern; these are Business Data Layer concerns, and the architecture's layering already prevents one from requiring changes to the other.
- **No change to `INTEGRATION_CONTRACT_v1.md`'s Standard Request/Response Contract shape** — confirmed, re-verified this round (Findings doc Part 5.2) — every Convocore-specific decision from this entire project maps onto the existing platform-agnostic contract without needing new top-level fields.
- **Net-new schema requirements are fully enumerated in `Convocore_Findings_Required_Updates_FINAL.md` Part 1** — this document does not introduce any database change not already tracked there.

---

## PART 18 — Open Items (Pointer Only — Full Detail Lives in the Findings Doc)

Every genuinely open decision referenced throughout this document is consolidated in one place: **`Convocore_Findings_Required_Updates_FINAL.md` Part 10.** Not duplicated here to avoid the two documents drifting out of sync — check that table for the current, authoritative list of what still needs a builder decision.

---

## Document Changelog

- **v1** — first draft, resolved the original Convocore-side flags in `External_Integration_Strategy_v1.md` and `Client_Integration_and_Credential_Platform_v1.md`.
- **v1.1** — added Voice (Part 10), documentation-sourced, flagged low-confidence.
- **FINAL (this version)** — complete rewrite as the system's single entry point for Convocore. Incorporates all 31 decisions from the latest answer round: the `runtime_module` embedded-logic reversal (Part 8, now the most architecturally significant decision in the document, with the new Template Dashboard requirement it creates), `human-handoff` deep integration with staged fallback (Part 7), Shopify's formal credential exception plus the newly-identified product-sync workflow requirement (Part 10), Lead Qualification Funnel precedence (Part 9), Convocore auto-generated data precedence (Part 14), Recovery Engine's confirmed current-state constraint (Part 11), a substantially expanded and more confident Voice section (Part 13, still explicitly flagged lower-confidence than the rest of the document), the clarified Voice-Webhook-vs-Custom-Tools distinction (Part 6), MCP's role reconfirmed on a third independent workspace (Part 15), and an expanded Known Platform Risks list with two newly discovered bugs (Part 16). All open items consolidated to a single pointer (Part 18) rather than duplicated across two documents. Document Map (Part 0) added so this genuinely functions as the entry point it's meant to be.
