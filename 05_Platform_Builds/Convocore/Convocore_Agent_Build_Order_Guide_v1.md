# Convocore Agent Build Order Guide v1

```
Status:     NEW. First version.
Purpose:    A sequencing and placement guide for whoever builds an agent
            inside Convocore's dashboard — what to configure, in what
            order, and WHERE each type of content belongs. This is a
            methodology document, not a content library — it does not
            supply actual prompt text, tool configs, or node instructions.
            It teaches the shape of a well-built agent so a builder makes
            fewer placement mistakes, not what to type into any given
            field.
Audience:   Whoever is actually inside Convocore's dashboard building or
            editing an agent — could be a developer, a semi-technical
            builder, or eventually informed by the Template Dashboard
            system (Convocore_Findings_Required_Updates_FINAL.md Part
            6.1) once that exists.
Companion   Convocore_Canvas_Ground_Truth_v1 (FINAL) — the mechanics
documents:  reference (what each field/toggle actually does). This guide
            assumes that document's content as known and focuses purely
            on sequencing and placement. Read Ground Truth first if any
            term here is unfamiliar.
            Convocore_Adapter_Spec_FINAL.md — for anything touching how a
            built agent connects back to Zenny's own Runtime/Database.
```

---

## PART 0 — How to Use This Guide

Building a Convocore agent well is not "fill in every field top to bottom." It's a sequence with real dependencies — some things must exist before others can be configured correctly, and some content has exactly one correct home even though Convocore's UI would technically let you put it somewhere else.

This guide is organized as **11 build phases**, in the order they should actually happen, followed by a **placement quick-reference** (Part 12) for when you already know roughly what you're doing and just need to double-check where something goes.

**The core discipline this guide teaches, stated once up front:** every phase either creates something a later phase depends on, or tests something before it gets relied on. Skipping ahead (writing node instructions before tools exist, wiring nodes before testing them individually, deploying before running Canvas Test Mode) is where avoidable mistakes happen.

---

## PART 1 — Pre-Build Planning (Before Touching Convocore At All)

Before opening the dashboard, know the answers to:

1. **Which modules are active for this client?** (Growth Agent, Conversion Engine, Recovery Engine, Email Manager, etc. — whichever combination applies) This determines what embedded logic needs to go into which nodes later (Part 6's "embedded module logic" placement). Once the Template Dashboard exists (`Convocore_Findings_Required_Updates_FINAL.md` Part 6.1), this step becomes semi-automated; until then, it's a manual determination.
2. **How many Canvas nodes does this agent actually need?** Default assumption: **start with one node.** Only split into multiple nodes if there's a genuine reason (Canvas-as-standard-path means single-node is the normal case, not multi-node). Splitting prematurely costs latency (Router LLM overhead on every turn) for no benefit.
3. **Which channels does this agent need?** (Web widget, WhatsApp, Messenger, Telegram, Voice) — determines later channel-deployment work and whether the UI-types-by-channel settings need attention.
4. **Does this client need any integrations?** Shopify (confirmed exception, native Convocore tool), SMS (per-client only), Voice (own Twilio number required either way). Knowing this now avoids mid-build surprises.
5. **What does this agent need to remember or capture?** (user name, email, order ID, preferences, etc.) — informs the Variables phase (Part 3).

---

## PART 2 — Phase 1: Agent Creation & Identity

1. **Create the agent** in the dashboard.
2. **Set the agent's name** per Zenny's naming convention — see `Convocore_Findings_Required_Updates_FINAL.md` Database Part 1.2 (convention itself still needs to be formally written; until it is, use a clear, consistent, human-readable name matching the client's business, since this name is what displays on the actual web chat widget).
3. **Basic branding/appearance** (theme, avatar) — cosmetic, lowest priority, can be done anytime, including last.

**Do not write any Instructions yet.** Nothing exists for the agent to reference or act on until Variables and Tools exist (Phases 2-3).

---

## PART 3 — Phase 2: Variables (Before Tools — Tools Depend On These)

**Why this comes before Tools:** a Custom Tool's parameters are Variables attached to it. Building Tools first means either leaving parameters unattached or creating Variables ad hoc mid-Tool-creation — building Variables first means Tools reference something that already exists and is already named correctly.

1. **List what data this agent needs to capture or reference**, from Part 1 planning.
2. **Decide the type for each** — Local (per-conversation, most common for user-provided data), Global (business-wide facts, capped at 10 workspace-wide), or ENV (secrets used in Tool authentication — never anything the LLM should see).
3. **Create them.** Remember: `email`, `name`, `address` as exact Variable Keys are auto-captured by Convocore's lead system — don't repurpose those exact keys for something unrelated.
4. **Do not expect these to populate automatically.** Every Variable that needs a value captured from conversation will need an explicit capture instruction written into a node's Instructions later (Part 6) — note that requirement now so it isn't forgotten when writing node prompts.

---

## PART 4 — Phase 3: Tools (Test Immediately, Before Wiring Into Prompts)

1. **Create each Custom Tool needed**, per Part 1's integration/action list.
   - **Key = the exact matching Runtime `tool_name`** (now a binding convention). Not a suggestion; a naming rule.
   - Attach the Variables created in Phase 2 as parameters.
   - Set the Secret Key deliberately — leaving it blank sends the agent's own secret as the Bearer token, which is sometimes fine, sometimes not; decide, don't default by accident.
2. **Enable relevant System Tools** — `human-handoff` (near-universal), `forward-call`/`end-call` (voice agents), `shopify` (if applicable, credentials pre-provisioned per `Convocore_Adapter_Spec_FINAL.md` Part 10).
3. **Test every Custom Tool using its own Test button — before it's ever referenced in a node's Instructions.** This is a deliberate, required step, not optional polish: a broken tool wired into a prompt fails silently from the builder's perspective (the agent just won't call it correctly, or will call it and get a bad response) — testing it standalone first isolates tool problems from prompt problems.

---

## PART 5 — Phase 4: Global Prompt & Router LLM (Advanced Settings)

**Global Prompt — what belongs here (and what emphatically doesn't):**

| Belongs in Global Prompt | Belongs in node Instructions instead |
|---|---|
| Agent identity, persona, tone of voice | Task-specific steps ("if user wants X, ask for Y") |
| Hard universal rules ("never discuss competitor pricing") | Anything only relevant in one scenario/node |
| Anything true no matter which node the conversation is in | Routing hints (put these in the node's routing-trigger field instead, Part 6) |

**Keep it short.** It's re-sent on every single turn — length has a direct, compounding cost. There's no platform-enforced limit (tested to 20,000 characters), which makes this a self-discipline problem, not a technical constraint.

**Router LLM:** set the model — default to Gemini 2.5 Flash unless there's a specific reason not to (speed matters here more than almost anywhere else in the build, since it runs on every turn). Configure fallback models if uptime matters for this client.

**Global Variables/Tools (also in this panel):** use sparingly. The dashboard's own warning applies — tools available globally increase hallucination risk; prefer assigning tools to specific nodes instead (Part 6).

---

## PART 6 — Phase 5: Node-by-Node Build

### 6.1 Start with the Start Node

Every agent has exactly one. Configure, in this order:
1. **Start Configuration** — who starts (usually AI), opening message (or leave blank for dynamic generation)
2. **Instructions (Text slot)** — this node's actual behavior for chat
3. **Instructions (Voice slot)**, if this agent will serve voice at all — write this separately, don't assume the Text instructions carry over
4. **The routing-trigger field ("Defines what this node does")** — write this even on the Start Node if there will be multiple nodes, since the Router LLM reads it to decide re-entry behavior (e.g. "start over" requests, if Global Node toggle is used here)
5. **Model Configuration** — pick a model deliberately, don't leave defaults unexamined
6. **Enable Knowledge Base**, if this node needs KB search
7. **Router Configuration** — usually leave at defaults unless this specific agent has a reason for custom rewind/auto-rerouter behavior

### 6.2 Additional nodes, if genuinely needed

Only build more nodes if Part 1's planning concluded this agent needs real branching (distinct scenarios with different tools/tone/KB scope). For each additional node:

- **Instructions field** — this node's specific task behavior. This is where embedded module logic (per `Convocore_Adapter_Spec_FINAL.md` Part 8) actually lives — the business logic content for whichever Runtime module this node serves.
- **Routing-trigger field** — write this as a clear, specific intent-match statement, not a vague summary. The Router LLM's routing quality depends entirely on how well this field distinguishes this node from every other node's routing-trigger field. ("Use this node when the user wants to book an appointment" — not "handles bookings.")
- **Default (wired) vs. Global toggle** — decide deliberately: wired if this node should only be reachable in a specific sequence (e.g., collect-email always before book-appointment); Global if it should be reachable from anywhere at any time (e.g., a general FAQ catch-all, "talk to a human").
- **Tools** — attach only the specific tools this node actually needs, not everything globally available (same hallucination-reduction reasoning as Part 5's Global Tools warning).
- **KB** — enable and scope per-node if this node's domain is narrower than the whole agent's KB.

### 6.3 Condition Nodes, only if genuinely reused

Don't reach for a Condition Node for a one-off branch — a normal edge condition handles that. Use a Condition Node specifically when the same condition logic needs to be referenced from multiple edges, to avoid rewriting it repeatedly.

### 6.4 End Node

No configuration exists. Just wire it where a conversation should logically terminate.

---

## PART 7 — Phase 6: Wiring & Routing

1. Connect nodes in the sequence Part 1's planning called for.
2. Add Edge Conditions where a connection should only be taken under specific circumstances.
3. Remember Condition Node restrictions: max 1 output, cannot chain two together, must have at least one output connected or it does nothing.
4. **Do not trust the Canvas's visual wiring display as proof the flow is correctly built** — a known Convocore bug can make wiring appear broken (or appear fine when it isn't) independent of the actual underlying data. Validate via an actual test conversation (Part 10), not by eyeballing the canvas.

---

## PART 8 — Phase 7: Knowledge Base

1. Add KB content — direct text entry, file upload, or Crawler for larger/website-sourced content.
2. **Match formatting to the primary model in use:** Markdown for GPT-family models, XML tags for Claude-family models.
3. Add a Document Description and Tags to every KB document — both feed retrieval quality.
4. Enable KB per-node (Part 6), not just globally — scope which nodes actually search which content, if the agent has multiple nodes with genuinely different knowledge domains.
5. **Shopify/WooCommerce product content specifically does not go through manual KB entry** — this is confirmed to flow through a separate, dedicated sync workflow (`Convocore_Adapter_Spec_FINAL.md` Part 10.2, not yet built) that keeps product data current automatically. Don't hand-populate product KB content that this workflow is meant to own.

---

## PART 9 — Phase 8: Voice Configuration (If Applicable)

1. **Number provisioning** — handled entirely by Zenny's backend once the client has submitted Twilio credentials via the credential platform (Account SID, Auth Token, phone number — always required, Convocore-purchased numbers are never used). Not a Convocore-dashboard-first step; the number gets assigned to this agent as part of backend provisioning.
2. **Voice tab basic settings** — model and language selection at minimum. Deeper Transcriber/Speech-Generation/Advanced settings exist but templating them is explicitly deferred (`Convocore_Adapter_Spec_FINAL.md` Part 13.4) — configure manually per client for now, based on real testing, not assumed defaults.
3. **Confirm node count compatibility** — if this agent uses more than one Canvas node, Google's Live model cannot be used (hard incompatibility, not a preference) — pick a standard Transcriber+LLM+Speech-Gen pipeline instead.
4. **Write Voice-slot instructions on every relevant node** (Part 6.1/6.2) — don't assume Text instructions are sufficient for voice; they're separate fields for a reason (spoken language reads differently than written text — shorter sentences, no markdown formatting, etc.).
5. **Voice Webhook (Server URL, Advanced Settings)** — not used for now, per confirmed decision (`Convocore_Adapter_Spec_FINAL.md` Part 6). Skip this field.

---

## PART 10 — Phase 9: Testing

**In this order, not skipped, not reordered:**

1. **Individual Tool tests** — already done in Phase 3, but re-verify in context if anything changed since.
2. **Canvas Test Mode** — run the full flow as a real conversation, not just visual inspection. Explicitly test: invalid/unexpected user inputs, a tool intentionally failing (if testable), any condition that should route to a fallback, and — critically — confirm multi-node wiring actually works end-to-end given the known Canvas-display bug.
3. **Voice test**, if applicable — a real test call, not just dashboard review, given voice remains the least independently-verified area of this whole system (`Convocore_Adapter_Spec_FINAL.md` Part 13.7).
4. **UI Engine elements** — only test what's actually being used; per the standing decision, this agent likely uses few or none by default (deferred sprint) unless this specific build explicitly calls for rich UI responses.

---

## PART 11 — Phase 10: Deployment

1. Widget embed / channel connections (WhatsApp, Messenger, Telegram) as needed per Part 1's channel list.
2. Voice number goes live once Phase 9's voice test passes.
3. Confirm the agent's `agentId` gets recorded into whatever mapping mechanism resolves it to this client (`Convocore_Adapter_Spec_FINAL.md` Part 2.3) — this is a Zenny-backend step, not a Convocore-dashboard step, but it must happen before this agent can receive traffic that the Adapter needs to correctly attribute.

---

## PART 12 — Phase 11: Post-Build MCP Checklist

Per the standing decision (`Convocore_Canvas_Ground_Truth_v1` FINAL Part 8 #2): MCP is checklist-only, never a build tool. Once the agent above is fully built and deployed, run an MCP-based read-only pass to verify nothing was missed — pull the agent's structure back via `get_agent`, cross-check against what was intended, confirm KB doc counts, confirm Tools/Variables list matches what was planned. **This is a verification step, not a build step** — if something looks wrong, go fix it manually in the dashboard; don't fix it via MCP.

---

## PART 13 — Quick-Reference: "Where Does This Belong?"

For when you already know roughly what you're doing and just need to double-check placement.

| This kind of content... | ...goes here | ...NOT here |
|---|---|---|
| Agent identity, tone, persona | Global Prompt | Node Instructions (repeats unnecessarily) |
| Universal hard rules | Global Prompt | Individual nodes |
| Task-specific steps for one scenario | That node's Instructions | Global Prompt |
| "When should the router send someone here" | That node's routing-trigger field | The Instructions field (wrong reader — Router LLM doesn't read Instructions) |
| A secret/API key used by a Tool | ENV Variable | A regular Variable, or hardcoded in a prompt |
| Per-user captured data (name, email, order ID) | Local Variable | Global Variable (wrong scope — leaks across users) |
| Business-wide static facts (hours, address, pricing) | Global Variable | Local Variable (won't persist/share correctly) |
| "Save X to variable Y" capture logic | Explicit instruction in node Instructions | Assumed automatic (it isn't) |
| A tool available to every node | Global Tools (Advanced Settings) — use sparingly | Attached individually where genuinely needed instead (preferred default) |
| Runtime module business logic | Embedded directly in the relevant node's Instructions | The Adapter itself, or a runtime conditional variable |
| Product/inventory data | Convocore's KB, via the dedicated sync workflow | Zenny's own database, or manual KB entry |
| A reused routing condition | A Condition Node | Repeated inline on every edge that needs it |

---

## Document Changelog
- **v1 (this version)** — first version. Companion to `Convocore_Canvas_Ground_Truth_v1` (FINAL) and `Convocore_Adapter_Spec_FINAL.md`. Provides sequencing (11 build phases) and placement guidance (Part 13's quick-reference table) for building a Convocore agent correctly, without supplying actual prompt content — teaches where things go and in what order, not what to write.
