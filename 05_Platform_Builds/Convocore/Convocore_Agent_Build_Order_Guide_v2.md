# Convocore Agent Build Order Guide v2

```
Status:     v2. Supersedes Convocore_Agent_Build_Order_Guide_v1.md.
Purpose:    A sequencing and placement guide for whoever (human or Claude
            Code) builds an agent inside Convocore's dashboard — what to
            configure, in what order, WHERE each type of content belongs,
            and — new in this version — WHERE TO GET THE ACTUAL CONTENT
            from before writing anything.
Companion   Convocore_Canvas_Ground_Truth_FINAL.md — mechanics reference.
documents:  Convocore_Adapter_Spec_FINAL.md — how a built agent connects
            back to Zenny's Runtime/Database.
```

---

## PART 0 — How to Use This Guide (Read This First — Two Corrections From v1)

### 0.1 The Doc-Search-First Rule — applies to every single phase below

**Zenny's own system documentation is the primary source of truth for WHAT goes into any given field.** This guide teaches sequencing and placement — WHERE something belongs and WHEN to build it. It has never told you WHAT to actually write, and that was a real gap in v1: it left "what content goes here" open without ever pointing at where that content already lives. Most of it is already documented, somewhere in the project's system docs.

**The rule, stated once here, referenced everywhere below as "🔍 Doc-Search-First":**

```
1. SEARCH the relevant system documentation first (each phase below names
   which document to check).
2. If the answer is there → use it. Don't paraphrase from memory, don't
   improvise something that sounds plausible — pull the actual content.
3. If a real search was done and the answer genuinely isn't there →
   ONLY THEN ask the human. Don't guess, don't invent, don't fill the
   gap with something reasonable-sounding.
4. Never skip step 1 to save time. Never treat "I couldn't find it
   quickly" as equivalent to "it doesn't exist" — search properly first.
```

This applies whether the builder is a human going through Zenny's own project files, or Claude Code searching project knowledge — same discipline either way.

### 0.2 Correction: this is a MULTI-NODE build, not single-node

**v1 defaulted to "start with one node, only split if there's a genuine reason."** That default was wrong for how Zenny actually builds. **Zenny's standard agent is multi-node** — the natural node boundary maps to Zenny's active Runtime modules (Core Agent, Growth Agent, Conversion Engine, Recovery Engine, and any others active for a given client), consistent with the embedded-module-logic decision (`Convocore_Adapter_Spec_FINAL.md` Part 8) — each module's logic lives in its own node(s), not blended into one generic node.

**Single-node remains valid only for a genuinely simple client** (e.g. FAQ-only, no Growth/Conversion logic active at all) — but that's the exception now, not the default assumption a builder should start from.

---

## PART 1 — Pre-Build Planning (Before Touching Convocore At All)

**🔍 Doc-Search-First:** before anything else, determine which modules are active for this client. Check `Agent_Runtime_System_v1.md` for the module definitions themselves, and whatever client-configuration record holds this specific client's active-module list (per `Convocore_Findings_Required_Updates_FINAL.md` Database Part 1.4's module-flag additions). Do not assume a module combination — confirm it from the actual client record.

1. **Which modules are active for this client?** → determines node structure (0.2). Each active module typically becomes its own node or small node cluster.
2. **Node structure, given the modules found in step 1** — sketch which module maps to which node before opening Convocore. Multi-node is the default; document the mapping (e.g. "Core Agent → Start Node, Growth Agent → Node 2, Conversion Engine → Node 3") before building anything.
3. **Which channels does this agent need?** (Web, WhatsApp, Messenger, Telegram, Voice) — check the client's onboarding/config record, don't assume.
4. **Which integrations does this client need?** Shopify, SMS, Voice — same source, the client's own configuration record.
5. **What does this agent need to capture?** — 🔍 **Doc-Search-First:** check `INTEGRATION_CONTRACT_v1.md`'s Tool Name Registry and any existing payload schemas for what data fields the Runtime modules already expect to receive — this tells you what needs capturing as a Variable before you have to guess.

---

## PART 2 — Phase 1: Agent Creation & Identity

1. **Create the agent** in the dashboard.
2. **Set the agent's name** — 🔍 **Doc-Search-First:** check `Convocore_Findings_Required_Updates_FINAL.md` Database Part 1.2 for the naming convention. If it's been written since this guide's last update, use it exactly. If it still doesn't exist, **ask the human** rather than inventing a naming pattern on the spot — this is exactly the kind of thing that should be consistent across every client, not decided ad hoc per build.
3. **Basic branding/appearance** — 🔍 **Doc-Search-First:** check `Zenny_Feature_and_Design_Reference_docx.md` / `ZeroManual_Blueprint_v3.docx` for brand colors/visual identity before picking anything arbitrarily.

**Do not write any Instructions yet.**

---

## PART 3 — Phase 2: Variables (Before Tools)

**🔍 Doc-Search-First:** check `INTEGRATION_CONTRACT_v1.md`'s payload examples and `Tool_Naming_Convention.md` for existing field-naming patterns before inventing new Variable Keys. If a Runtime workflow already expects a field called `preferred_datetime`, the Convocore Variable must be Keyed `preferred_datetime` too — not `appointment_time`, not `when`. This isn't a style preference, it's the mapping mechanism itself (`Convocore_Adapter_Spec_FINAL.md` Part 5.1's naming-discipline rule).

1. **List what this agent needs to capture**, per Part 1 step 5's findings.
2. **Decide type per Variable** — Local (per-conversation, most common), Global (business-wide, 10-cap), ENV (secrets).
3. **Create them**, using names sourced per the Doc-Search-First check above — not invented. Also add porper Description to clearly signal to the LLM What to calture in this variable, if possible add few-shot example.
4. **Remember:** `email`, `name`, `address` as exact Keys are auto-captured by Convocore's lead system.
5. **Capture is never automatic** — every Variable needing a value from conversation needs an explicit instruction in a node's Instructions later (Part 6).

---

## PART 4 — Phase 3: Tools (Test Before Wiring Into Prompts)

**🔍 Doc-Search-First — this is the single most important search in the whole build:** before creating any Custom Tool, check `INTEGRATION_CONTRACT_v1.md` Part 4 (Tool Name Registry) and `n8n_Workflow_Specification_v1.md` Part 7 for the tool's canonical name and exact expected payload shape. **The Tool's `Key` field is not something to name freely — it must be copied exactly from the existing registry entry**, per the now-binding naming convention. If a Runtime action doesn't have a registry entry yet, **ask the human** before inventing one — a Tool built against a name that doesn't exist in the registry breaks the Adapter's pass-through mapping (`Convocore_Adapter_Spec_FINAL.md` Part 4).

1. **Create each Custom Tool**, per Part 1's integration list — Key sourced from the registry (above), Description written to clearly signal to the LLM when to call it, parameters attached as Variables (Part 3) with Keys matching the expected payload field names.
2. **Enable relevant System Tools** — `human-handoff` (near-universal — 🔍 check `Agent_Runtime_System_v1.md`'s Human Handoff Handler section for the actual escalation logic/`team_key` routing rules before configuring), `forward-call`/`end-call` (voice), `shopify` (if applicable).
3. **Test every Custom Tool via its own Test button before referencing it in any node's Instructions.**

---

## PART 5 — Phase 4: Global Prompt & Router LLM

**🔍 Doc-Search-First:** before writing any identity/persona/tone content, check `Customer_Psychology_Principles_v1.md` and `Zenny_AI_Agent__Customer_Psychology_and_Conversion_Science_Evidence_Foundation.md` — Zenny's brand voice, tone principles, and conversational psychology approach are already documented there. Do not invent a persona from scratch; pull from what's already been established.

**What belongs in Global Prompt vs. node Instructions:**

| Belongs in Global Prompt | Belongs in node Instructions instead |
|---|---|
| Agent identity, persona, tone (sourced per the search above) | Task-specific, module-specific steps |
| Hard universal rules | Anything relevant to only one node/module |
| Anything true regardless of which node the conversation is in | Routing hints (use the routing-trigger field, Part 6) |

**Keep it short** — re-sent on every turn, no platform limit, real cost implication either way.

**Router LLM:** default Gemini 2.5 Flash unless there's a specific reason otherwise. Configure fallback models if uptime matters for this client.

**Global Variables/Tools:** use sparingly, per the dashboard's own hallucination warning — prefer node-level assignment.

---

## PART 6 — Phase 5: Node-by-Node Build (Multi-Node, Per Part 0.2)

### 6.1 Start Node

Handles initial contact — typically the Core Agent module, or a general router/greeting role if multiple modules are active and the Start Node's job is primarily to hand off to the right module-node.

1. **Start Configuration** — who starts, opening message.
2. **Instructions (Text slot)** — 🔍 **Doc-Search-First:** check `Agent_Runtime_System_v1.md`'s Core Agent section (or whichever module owns the Start Node's role for this client) for the actual behavior/logic that belongs here. This is the embedded module logic (`Convocore_Adapter_Spec_FINAL.md` Part 8) — it comes from the Runtime documentation, not invented fresh per build.
3. **Instructions (Voice slot)**, if applicable — same search, written separately for voice-appropriate phrasing.
4. **Routing-trigger field** — write based on this node's actual role among the other module-nodes being built (see 6.2).
5. **Model Configuration**, **Enable KB** if needed, **Router Configuration** — as needed.

### 6.2 Module Nodes (the default case — one node per active module)

For each additional active module (Growth Agent, Conversion Engine, Recovery Engine, etc.), build a corresponding node:

- **🔍 Doc-Search-First, mandatory for every module node:** check `Agent_Runtime_System_v1.md`'s section for that specific module before writing a single word of Instructions. The actual business logic, qualification rules, conversation strategy, and behavioral boundaries for Growth Agent, Conversion Engine, etc. are already fully specified there — the node's Instructions field is where that already-written logic gets embedded, not a place to re-derive it from general judgment.
- **🔍 Also check `Fallback_Pattern_Catalog.md`** for what this module should do when its primary path fails (unclear input, tool failure, etc.) — don't invent fallback behavior; it's already catalogued.
- **🔍 Also check `Client_Onboarding_Sequence_Spec.md`** if this node handles anything onboarding-related.
- **Instructions field** — the embedded module logic, sourced per above, adapted only for Convocore's prompt format (Markdown/XML per model family), never re-authored from scratch.
- **Routing-trigger field** — a clear, specific intent-match statement distinguishing this module-node from every other one.
- **Default (wired) vs. Global toggle** — wired if this module should only activate after a specific prior step; Global if it should be reachable anytime (e.g. Recovery Engine logic that can trigger mid-conversation regardless of current node).
- **Tools** — only the specific Tools this module's logic actually calls (per its Runtime documentation), sourced with Keys per Part 4's registry rule.
- **KB** — scoped to what this module's domain actually needs.

**If `Agent_Runtime_System_v1.md` doesn't have enough detail for a given module to write real Instructions — this is a Doc-Search-First failure case. Ask the human. Do not fill the gap with plausible-sounding generic customer-service language.**

### 6.3 Condition Nodes

Only for genuinely reused routing logic across multiple edges — not a substitute for well-written per-node routing-trigger fields.

### 6.4 End Node

No configuration. Wire where a conversation should terminate.

---

## PART 7 — Phase 6: Wiring & Routing

**🔍 Doc-Search-First:** check `Agent_Runtime_System_v1.md` for any documented module-transition rules (e.g. does Growth Agent logic explicitly hand off to Conversion Engine under certain conditions?) before deciding how nodes connect. Module-to-module flow, if it's been designed at the Runtime level, should be mirrored in the Canvas wiring — not invented independently at the Convocore layer.

1. Connect nodes per the mapping sketched in Part 1.
2. Add Edge Conditions where a connection is conditional.
3. Condition Node restrictions: max 1 output, no chaining, must have ≥1 output connected.
4. **Never trust the Canvas's visual wiring display alone** — known bug can misrepresent actual wiring state. Validate via a real test conversation (Part 10).

---

## PART 8 — Phase 7: Knowledge Base

**🔍 Doc-Search-First:** check whether this client's actual FAQ/business-knowledge content already exists somewhere in Zenny's system (the client's own onboarding materials, `Client_Onboarding_Guide.md`'s intake process, or wherever client-provided business content is stored) before treating KB population as a blank-slate writing task. Most of this should already exist from client onboarding, not be freshly authored during the Convocore build.

1. Add KB content — direct entry, file upload, or Crawler.
2. Match formatting to the primary model (Markdown for GPT-family, XML for Claude-family).
3. Document Description + Tags on every KB doc.
4. Enable KB per-node, scoped to each module's actual domain.
5. **Shopify/WooCommerce product content does not go through manual KB entry** — flows through the dedicated sync workflow (`Convocore_Adapter_Spec_FINAL.md` Part 10.2, not yet built). Don't hand-populate what that workflow will own.

---

## PART 9 — Phase 8: Voice Configuration (If Applicable)

1. **Number provisioning** — backend-handled once Twilio credentials are submitted via the credential platform. Not a Convocore-dashboard-first step.
2. **Voice tab basic settings** — model/language selection. Deeper settings explicitly deferred from templating (`Convocore_Adapter_Spec_FINAL.md` Part 13.4) — configure manually.
3. **Node count compatibility** — Google Live model is incompatible with multi-node agents (hard rule) — **and since Part 0.2 confirms multi-node is the default build, Google Live is effectively ruled out for the standard Zenny agent** unless a client specifically warrants a single-node exception. Use a standard Transcriber+LLM+Speech-Gen pipeline instead.
4. **Write Voice-slot instructions on every module node that will serve voice** — 🔍 same Doc-Search-First discipline as Part 6.2, adapted for spoken delivery (shorter sentences, no markdown).
5. **Voice Webhook** — not used for now, per confirmed decision.

---

## PART 10 — Phase 9: Testing

1. **Individual Tool tests** — already done Phase 3, re-verify if anything changed.
2. **Canvas Test Mode** — full flow, real conversation. Explicitly test: invalid inputs, tool failure, fallback routing, and **module-to-module handoff specifically** (since this agent is multi-node by default, the handoffs between module-nodes are exactly where problems are most likely to surface — test these deliberately, not incidentally).
3. **Voice test**, if applicable — real test call.
4. **UI Engine elements** — only what's actually in use (deferred sprint otherwise).

---

## PART 11 — Phase 10: Deployment

1. Widget/channel connections per Part 1's channel list.
2. Voice number live once tested.
3. Confirm `agentId` recorded into the client-mapping mechanism (`Convocore_Adapter_Spec_FINAL.md` Part 2.3) before this agent receives real traffic.

---

## PART 12 — Phase 11: Post-Build MCP Checklist

MCP is checklist-only, never a build tool. Run a read-only MCP pass after deployment — pull the agent's structure back, cross-check against Part 1's planned module-to-node mapping, confirm KB/Tools/Variables match what was intended. Fix any discrepancy manually in the dashboard, never via MCP.

---

## PART 13 — Quick-Reference: "Where Does This Belong, and Where Does the Content Come From?"

| This kind of content... | ...goes here | ...content comes from |
|---|---|---|
| Agent identity, tone, persona | Global Prompt | `Customer_Psychology_Principles_v1.md`, `Zenny_AI_Agent__Customer_Psychology_and_Conversion_Science_Evidence_Foundation.md` |
| Universal hard rules | Global Prompt | Same as above, plus any compliance/brand docs |
| Module-specific behavior (Growth Agent, Conversion Engine, etc.) | That module's node Instructions | `Agent_Runtime_System_v1.md`, per-module section |
| Fallback behavior | Node Instructions | `Fallback_Pattern_Catalog.md` |
| Onboarding-specific flow | Relevant node Instructions | `Client_Onboarding_Sequence_Spec.md` |
| Routing logic between nodes | Routing-trigger field / edges | `Agent_Runtime_System_v1.md` module-transition rules |
| Tool name (`Key` field) | Custom Tool config | `INTEGRATION_CONTRACT_v1.md` Part 4, `n8n_Workflow_Specification_v1.md` Part 7 — **never invented** |
| Tool parameter names (Variable `Key`s) | Attached Variables | Same registry — matching payload field names |
| Secret/API key | ENV Variable | Credential platform, never hardcoded |
| Per-user captured data | Local Variable | — |
| Business-wide static facts | Global Variable | Client's own config/onboarding record |
| KB business content | Convocore KB | Client's actual onboarding materials — **not freshly authored** |
| Product/inventory data | Convocore KB via sync workflow | Shopify/WooCommerce directly, never manual entry |

**If a row's "content comes from" document doesn't actually have the answer:** stop, don't improvise, ask the human. This applies to every row, every phase, every build — the Doc-Search-First Rule (Part 0.1) is the standing discipline this entire table exists to support.

---

## Document Changelog
- **v1** — first version. Taught sequencing and placement, but never pointed at where actual content should come from, and incorrectly defaulted to single-node builds.
- **v2 (this version)** — added the Doc-Search-First Rule (Part 0.1) to every phase, naming the specific system document to check before writing any content, with an explicit "ask the human, don't guess" escalation. Corrected the node-count default from single-node to multi-node, mapped to Zenny's active Runtime modules (Part 0.2), with every subsequent phase (node build, wiring, voice, testing) updated to reflect multi-node as the standard case rather than an exception. Part 13's quick-reference table expanded with a "content comes from" column alongside the original placement column.
