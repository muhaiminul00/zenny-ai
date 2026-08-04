# Convocore Canvas — Ground Truth Build Standard (Consolidated)

> **Status:** This is the final, organized reference from live-dashboard, live-testing, and Convocore-support-confirmed findings. Supersedes all prior scattered working notes on Canvas, Nodes, Advanced Settings, Tools, and Variables. Ready for implementation use.
>
> **Relationship to other docs:** This corrects and extends `Convocore_Master_Reference_v3.md` on everything Canvas-related — where they conflict, **this document wins**, since it's built from direct live inspection rather than Convocore's own (sometimes stale) published docs.

---

## PART 1 — CANVAS STRUCTURE

### 1.1 Sidebar Icons

| Icon | Function |
|---|---|
| **Settings** (gear) | Opens **Advanced Settings** — Global Prompt, Router LLM, and flow-wide config live here |
| **Variables** | CRUD panel for variables |
| **Tools** | CRUD panel for tools |
| **Condition** | Adds a Condition Node to canvas |
| **New Agent** | Adds a Default Node (toggleable → Global Node) |
| **End** | Adds an End Node |

### 1.2 Node Types — Overview

| Node Type | Input wiring | Output wiring | Config panel | Card color |
|---|---|---|---|---|
| **Start Node** | None (entry point) | Yes | Full | Green |
| **Default Node** | Yes | Yes | Full | Grey/ash |
| **Global Node** | None (removed via toggle) | Yes | Full (identical to Default) | Blue |
| **Condition Node** | Multiple allowed | Exactly 1 | Minimal (one field) | Orange/yellow |
| **End Node** | Yes | None | Not configurable | Red/pink |

**Global Node = Default Node + toggle ON.** Not a separate type. Only changes: (a) input wiring removed, (b) card color → blue.

**"Settings" is not a separate tab** — it IS the node's entire configuration panel. No hidden extra tab exists.

### 1.3 Node Card (on-canvas display)

Shows: agent name label, node title, instructions preview, model badge, tool count (icon), KB indicator (colored dot), children count, connection dots (grey circles — top=input, bottom=output, except Global Node).

### 1.4 Connecting Nodes

- Drag from output (bottom dot) to input (top dot) to connect
- Connecting two nodes directly **automatically surfaces "Add a condition"**, opening **Edge Configuration**:
  - Connection summary (Source to Target)
  - **Edge Label** (free text)
  - **Edge Condition Configuration** — "Describe when the router of the source node should route to this node."

### 1.5 Top Bar / Top Tabs

- **Top bar:** agent selector, Published / Test / Share
- **Top tabs (agent-level, outside Canvas):** Canvas, Voice, Widget, Knowledge, Chats, Analytics, Leads, Channels, Simulator, Settings

### 1.6 Notes (non-functional)

Free-floating text annotation boxes on canvas (pencil icon to edit). Documentation only — no effect on agent behavior.

---

## PART 2 — NODE CONFIGURATION (Start / Default / Global — shared structure)

### 2.1 Start Configuration (Start Node ONLY)
- **"Who should start?"** — User starts / AI starts
- **"Customize this for voice call too"** — separate behavior for voice
- **AI Opening Message** — filled = shown verbatim; empty = AI generates dynamically from Instructions + few-shot examples

### 2.2 Global Node Toggle — special case on Start Node
Confirmed (Convocore support): "By default, the Start Node only triggers once at the very beginning of a session. However, when you enable the Global Node toggle on it, you are giving the AI permission to jump back to that node at any time during the conversation if the user's request matches its context (e.g. 'start over'). If you want the Start Node to trigger exactly once per session, keep the toggle off." Intentional, not a bug.

### 2.3 Description Section (grouped — Start/Default/Global identical)
One section, three parts together:
1. **Language selector**
2. **Instructions** ("Base Instructions (Agent Script)") — the actual prompt/script, edited via "Edit Instructions" button
3. **"Defines what this [node] does"** — separate routing-trigger box, read ONLY by the **Router LLM**, not the response-generating LLM

### 2.4 Model Alerts (conditional)
- **Google Gemini Live Mode Active** — LLM settings below unused; voice handles conversation + speech internally
- **Multiple Nodes Detected** — Gemini Live voice reliably supports single-node flows only

### 2.5 Model Configuration (this node's response-generation LLM)
Model selector, Temperature slider, Max Tokens slider, Add Tool button+dropdown. Identical across Start/Default/Global.

### 2.6 Node Pre Start Tool
Runs a GET request **immediately before the node activates** (background, before AI speaks) — e.g. CRM/inventory/status lookup so context is ready.
- **Params:** via URL query string, `{{variable}}` syntax supported — e.g. `?user_id={{user_id}}`
- **Headers:** not supported on this quick-URL field (bare GET only). For custom headers/auth, use a full **Custom Tool** (webhook) instead.
- **Convo ID** field — for testing, real-call format example `+1234567890`
- Same name, same behavior across Start/Default/Global (not Start-exclusive despite the name)

### 2.7 MCP Servers (per-node, MCP CLIENT side — node consumes external MCP servers)
Toggle **Advanced Mode**:
- **OFF (simple form):** Server Name (spaces to underscores), Server URL (must be http(s)://, SSE or WebSocket)
- **ON (JSON):** `{ "mcpServers": {} }` — supports `command`/`args` for local/stdio servers too (500ms debounce validation)
- **Once connected:** server card shows "Connected" (green badge). Its tools **automatically appear in the node's Tools list**, grouped/labeled by server name — no manual recreation needed, just toggle on.

### 2.8 Enable Knowledge Base
- Enable Knowledge Base toggle
- Search KB on start toggle
- Max chunks per query / Max search queries sliders
- No KB Filter Tags field exists (corrects earlier assumption)

### 2.9 Router Configuration
- **Router LLM model** selector (per-node override of the flow default)
- Temperature, Max Tokens (typically low, e.g. 128 — routing decision only)
- **Rewind Level — 3 discrete levels, confirmed:**
  - Level 1 = back 1 node
  - Level 2 = back 2 nodes
  - Level 3 = back 3 nodes
- **Auto Rerouter** toggle — LLM automatically reroutes to previous nodes if needed (off by default)

---

## PART 3 — CONDITION NODE (fully distinct, minimal panel)

- **Wiring:** multiple inputs allowed; **exactly 1 output allowed**
- **Cannot chain two Condition Nodes together** — confirmed directly
- **Behavior with no/unconnected output** (Convocore support, confirmed): "If a branch has no connection, it is silently ignored and the system will fall through to the next available condition or the default 'Else' path. If no outputs are connected to the node at all, it effectively does nothing and the flow will either dead-end or rely on your global fallbacks." Must have at least 1 output connected to matter at all.
- **Panel:** ONLY an Edge Condition text box. No Model Config, no Router Config, no KB, no Tools, no MCP.

---

## PART 4 — ADVANCED SETTINGS (flow-wide panel, gear icon)

**Global Prompt is the central/most important field in this panel** — everything else is supporting configuration around it.

### 4.1 Toggles
- **Enable Nodes** — master on/off for the multi-node system
- **UI Engine** — allows buttons/cards/images on text channels (relocated here from the old agent Prompts tab — Convocore's own published docs are stale on this, confirmed platform drift)
- **Fillers on Tool Usage** — filler words during tool calls

### 4.2 UI Types by Channel (appears right after UI Engine toggle)
"Choose which UI Engine elements this agent may send on each channel. Everything enabled by default. Text always allowed."

Tabs: WhatsApp | Instagram | Messenger | Telegram | Web — **Web has an expanded/different option set; the other four share one identical set.**

| Web-only | Shared (all channels) | WhatsApp-style-only |
|---|---|---|
| iFrame embeds, Forms (gated), Single inputs (gated) | Buttons/choice, Cards, Files/documents, Images/visual, Carousel, Location request, CTA URL button, Invoice (gated), Calendar booking (gated) | Voice notes |

Gated items ("Enable UI Engine X first") = Forms, Invoice, Calendar Booking, Single inputs — no separate hidden toggle exists for these; gating is tied to the main UI Engine toggle itself.

### 4.3 Router LLM (Advanced)
- Model selector — **default recommended: Gemini 2.5 Flash** ("has to be very fast or there will be noticeable latency with every interaction")
- Region gotcha: Grok 4.5 (NA-only) silently reroutes to grok-3-fast if selected on an EU workspace — no warning shown

### 4.4 Fallback models
Backup models used if the main Router LLM model is down — agent keeps retrying until one is available.

### 4.5 Start call phrases
Voice-specific custom trigger phrases.

### 4.6 Global Prompt
- "This prompt will be appended before every node's prompt."
- **No hard character limit** — tested to 20,000 chars, accepted. (Initial Prompt still has its own separate 10,000-char cap — the two are NOT the same limit.)
- Cost implication: longer Global Prompt = re-sent every single turn = direct, compounding cost. Self-imposed discipline required, not platform-enforced.
- Conceptually = Voiceflow's Global Prompt + Global Instructions combined, minus routing logic (routing lives in Router LLM instead)

### 4.7 Global Variables
Available to all nodes, always known to the AI once captured. Max 10 (workspace-wide cap, not per-agent).

### 4.8 Global Tools
Available to all nodes anytime. Warning: "might make the AI hallucinate more, highly recommended to specify which tools are accessible in each node" instead.

### 4.9 Default LLM Settings for Nodes/Tools/Routers
Fallback model/temperature/max-tokens used when an individual node hasn't overridden them.

---

## PART 5 — UI ENGINE (trigger mechanism, fully resolved)

**No dedicated node or wiring exists for UI Engine.** Purely prompt-driven:
1. Enable the toggle (now in Advanced Settings, Part 4.1) — appends generation instructions to system prompt
2. Instruct via prompt — three patterns: **Structured** ("generate 2 buttons: X, Y"), **Guided** (scripted multi-step), **Full Creative Freedom** (recommend Claude 3.5 Sonnet for this mode)
3. Can combine with KB (store product/card data in KB, reference generically) and Tools/webhooks (for elements that submit data — Forms, Calendar Booking)

### DECISION — Live UI Engine rendering test: DEFERRED (not cancelled)
**Reasons:**
1. Meta channels (Messenger/WhatsApp/IG) currently broken on whitelabel subdomains (reported to Convocore, awaiting fix) — would give incomplete results right now
2. Strategic reconsideration: we don't need every element type, and reflexive UI rendering burns tokens unnecessarily. Right question isn't "does everything render" — it's "which elements do we need, and when should the agent choose UI vs. plain text."

**Plan for the deferred sprint:**
- Decide the actual needed-elements shortlist FIRST (not during the sprint)
- Use detailed prompts (full field specs, not one-liners) + **real target webhooks/links** for data-submitting elements (Form, Calendar Booking, Invoice)
- Confirm per-channel enforcement (does the "UI types by channel" restriction actually get enforced at generation time) as part of the same sprint

---

## PART 6 — TOOLS

### 6.1 System Tools — 9 total (corrects earlier "only 2" assumption)

| Tool | Config needed | We use it? |
|---|---|---|
| airtable | OAuth (Convocore's) | No — see 6.4 |
| google-sheets | OAuth (Convocore's) | No — see 6.4 |
| google-calendar | OAuth (Convocore's) | No — see 6.4 |
| calendly | OAuth (Convocore's) | No — see 6.4 |
| shopify | Client's own Shopify Client ID+Secret | Yes — product catalogue/inventory |
| sms | Client's own Twilio SMS number | Per-client only, not default — 6.6 |
| web-control | Toggles within tool | Likely not needed — 6.5 |
| human-handoff | Description + variables + emails | Yes — core, used generally — 6.3 |
| forward-call | None — description+prompt only | Yes — voice offering |
| end-call | None — description+prompt only | Yes — voice offering |

**"KB-Search" is NOT and never was a system tool** — corrects an error that existed since the earliest Master Reference draft. KB retrieval is pure node-level config (Enable KB toggle + Search on start + prompt instructions), no Tool object involved.

**Main build effort = Custom Tools (webhooks), not these system tools.**

### 6.2 Universal Tool Requirements
Every tool needs: **Name** (Key) + **Description** (what the LLM reads to decide when/how to use it).

**Custom tools additionally need:**
- **Server URL** (labeled "Final URL" in UI — same thing)
- **Secret Key** — **Bearer token ONLY**, no other auth type. If blank, **falls back to sending the agent's own secret key** as the Bearer token (not "no auth")
- **Method** — GET/POST/PUT/PATCH/DELETE
- **Parameters** — via **Variables**: either "Select variables" (attach existing) or "Add variable" (create inline, without leaving the form)
- **Test** button — built into every tool panel
- **Backchannelling Phrases** — custom filler phrases per-tool (ties to Part 4.1's global Fillers toggle)

Standard UI guidance (confirmed verbatim): "We highly recommend providing a detailed human readable JSON response for the tool result so the AI can understand easier what to do next."

### 6.3 Human Handoff Tool (name corrected: "human-handoff", not "Live-handoff")
- Channels: telephony, web-chat, whatsapp, instagram, telegram, discord, messenger — **all channels**
- Built-in variables: `team_key` (which team to notify), `issue_summary` (conversation summary for handoff)
- Notify-emails field + "also notify workspace owner emails" checkbox
- **Requires BOTH** a well-written tool Description AND matching node prompt instruction — one alone insufficient
- **We use this generally, as a core tool.**

### 6.4 STRATEGIC DECISION — Convocore's OAuth system tools NOT used
airtable / google-sheets / google-calendar / calendly all require **Convocore's own OAuth flow**. **We will not use these.** Instead: **we build/maintain our own OAuth platform**, and connect to these services via **custom webhook tools** authenticated through our own layer.

**Practical implication:** client needs Airtable/Sheets/Calendar/Calendly functionality means we build a custom tool against our own backend (which talks to the third-party API via our OAuth) — never Convocore's built-in system tool.

### 6.5 Web Control Tool — documented, not planned for use
Full page inspection (screenshots, DOM, console/network), interactive actions with visitor consent (click/type/scroll/navigate/forms), screen sharing (pull-based). Web-chat only, VG native agents only. Config toggles include **"Allow JavaScript eval"** (off by default, logged when used — same risk category as MCP's `run_command` finding). ~20 `web_control_*` sub-tools exist but not individually explored — deferred until an actual use case emerges.

### 6.6 SMS Tool — confirmed NOT in default template
Requires client's own Twilio SMS-capable number. **Per-client only**, with client-specific instructions, only if specifically requested — never in the standard/global template.

### 6.7 Voice Tools (forward-call, end-call)
Zero configuration needed beyond description — all real behavior lives in the node's prompt (e.g. "if user asks for a human, use forward-call"). Exist because we offer voice agents on Convocore's own native voice stack (client provides their own Twilio number).

---

## PART 7 — VARIABLES

### 7.1 Access & Hard Limit
Canvas sidebar to Variables panel. **Max 10 Global variables, workspace-wide** (not per-agent).

### 7.2 The Four Variable Types

| Type | Scope | Editable? | Lifetime |
|---|---|---|---|
| **Default (System)** | Current conversation | Read-only | — |
| **Local (Conversation)** — the default/no-toggle state | Single conversation | During conversation | Deleted when conversation ends |
| **Global** (toggle ON) | All conversations, all agents, workspace-wide | By agents or API | Permanent until deleted |
| **Environment (ENV)** (toggle ON) | Workspace-wide, secure | Dashboard/API only, not mid-conversation | Permanent until deleted |

**ENV is special:** "Make this variable an environment variable which will make the AI NOT aware of it when used in tools' input schemas." — deliberately hidden from the LLM, correct mechanism for secrets used in tool auth.

### 7.3 Variable Fields (dashboard UI)
ENV toggle, Global toggle, Key (email/name/address are auto-captured by lead system — avoid reusing for unrelated purposes), Type (**String / Number / Boolean** — 3 confirmed options), Description (`{{` insertion syntax), Required toggle, Reusable toggle (labeled "SOON" — not live yet), ENV Value (ENV-only field, closest thing to a default value)

**No generic "Default Value" field in the dashboard.** (The REST API's `defaultValue` field is likely API-level only, not surfaced in UI — not a contradiction, just different surfaces.)

### 7.4 HOW VALUES GET CAPTURED — the critical mechanism
**Requires explicit instruction. The LLM does NOT auto-infer and write variables from Description alone.**

Confirmed (Convocore support): "You must tell the agent WHAT to capture and WHEN."

Example instruction pattern:
```
When the user provides their name, save it to the variable 'user_name'.
When they mention a date, store it in 'appointment_date'.
```

Internally: LLM reads conversation, identifies the info per your instruction, uses an internal **`set_variable` tool**, stores the value. **Every variable we want actively populated needs a matching capture instruction in the node's Instructions — this must be planned into every prompt, never assumed automatic.**

### 7.5 System Variables (read-only — do not edit descriptions)
**Core:** `phone_number`, `channel`, `timestamp`, `conversation_id`, `user_email`, `user_name`, `agent_id`, `agent_name`, `user_id`

**Per-integration** (ship with the corresponding OAuth system tool — not used by us per 6.4, documented for pattern reference only): Google Calendar (`calendar_method`, `calendar_event_*`...), Google Sheets (`sheets_method`, `sheets_range`...), Airtable (`airtable_base_id`, `airtable_method`...), Shopify (`shopify_resource`, `shopify_method` — read-only confirmed), Calendly (`calendly_method`, `calendly_start_time`...), SMS (`sms_to`, `sms_message`), Human Handoff (`team_key`, `issue_summary`)

Pattern worth mirroring in our own custom tools: structured variable sets (method/resource/query) per integration, not one flat catch-all variable.

### 7.6 Best Practices (confirmed)
`snake_case` naming; never store sensitive data in conversation variables, use ENV for secrets; keep values concise; capture at point of receipt, validate before saving; avoid vague names (`data`, `temp`); avoid overusing Global (clutter)

---

## PART 8 — CROSS-CUTTING ARCHITECTURAL DECISIONS (from this whole documentation phase)

These are **decisions**, not open questions — do not re-litigate without a specific new reason:

1. **Canvas is the standard build path.** Single-node Canvas replaces the old "simple single-prompt agent" concept entirely — no separate Prompt-tab workflow.
2. **MCP is a post-build checklist/verification tool ONLY — never a build tool.** Confirmed unreliable for writes (silent no-ops in one version, runtime-crashing writes in another, visually broken Canvas rendering observed directly in-dashboard). Direct REST API confirmed more trustworthy for the few bugs also tested there, but manual dashboard building remains the safest ground truth.
3. **Own OAuth platform, not Convocore's native OAuth system tools.** Airtable/Sheets/Calendar/Calendly integrations go through our own backend + our own OAuth, connected via Custom Tools — never Convocore's built-in versions.
4. **SMS and Web Control are opt-in, per-client only — not in the default/global template.**
5. **UI Engine live testing is deferred to a dedicated future sprint**, gated on (a) Meta channel bug fix and (b) deciding an actual needed-elements shortlist first.
6. **Phased automation approach:** Phase A = build everything manually in-dashboard until one fully-proven reference agent exists. Phase B = narrow, well-scoped REST API automations only (e.g. recovery messaging) — never Canvas/node building via API.

---

## PART 9 — CONFIRMED PLATFORM DRIFT (Convocore's own docs are stale on these)

- **UI Engine toggle** moved from agent Prompts tab to Canvas Advanced Settings panel
- **Widget CDN URL** changed from `vg-bunny-cdn.b-cdn.net` to `cdn.convocore.ai` (found via MCP live test)
- **Meta channel connections on whitelabel client subdomains** — was broken (JSSDK unknown host domain), reported to Convocore, **now confirmed fixed**

---

## Open / Not Yet Covered (genuine remaining gaps)

- [x] ~~**Meta channel bug**~~ — RESOLVED (fix confirmed working)
- [ ] **UI Engine live rendering test** — deferred, see Part 5's decision block
- [ ] **Integrations (native, Convocore-side)** — deprioritized given own-OAuth decision (Part 8, #3). ⚠️ If ever revisited: test live before relying on it, don't assume from documentation alone.
- [ ] **MCP client-side, populated state** — deprioritized, not currently needed (UI-based build approach). ⚠️ If ever required: test live first, confirm it actually works before depending on it.
- [ ] **`set_variable` internal tool visibility** — low priority, cosmetic curiosity, doesn't block anything
- [ ] **Simulator tab** — deprioritized, not currently needed. ⚠️ If ever required: test live first.
- [ ] **Variable capture mechanism, live end-to-end test** — deprioritized, not currently needed (UI-based build approach uses Custom Tools + direct testing, not conversational variable capture as the primary path). ⚠️ **Caution flag: if this mechanism is ever needed for a real build, test it live first — confirm capture actually works in a real conversation before depending on it.** Currently only confirmed in theory (Part 7.4), never watched happen.
- [x] ~~**Custom Tool webhook, end-to-end**~~ — CONFIRMED WORKING. Tested via the tool's own Test button against a test webhook. Flow confirmed: Server URL/webhook → Bearer token → Parameters (Variables). Works as documented in Part 6.2.
- [x] ~~Whether "UI types by channel" restrictions are enforced~~ — folded into the deferred UI Engine sprint, not a separate item
- [ ] **Full connected-system test (Global Prompt + Instructions + Tool + Variable working together in one real flow)** — not yet run. **This will happen naturally during implementation/build testing, not as a separate pre-build step.** If something fails at that stage, treat it as a normal build-debugging cycle — learn and improve from the failure rather than trying to pre-verify every combination in isolation first.

---


## Document Changelog
- **v1** — consolidated ground truth from the full live-dashboard walkthrough phase (Canvas, all 5 node types, Advanced Settings, UI Engine, Tools, Variables). Supersedes all prior scattered working notes on these topics.
- **v1.1 (this version)** — final pre-implementation check closed out: Meta channel bug confirmed resolved; Custom Tool webhook end-to-end confirmed working (Server URL → Bearer token → Variables, tested via built-in Test button); Variable capture mechanism, native Integrations, MCP client-side, and Simulator tab all deliberately deprioritized as not currently needed (UI-based build approach) with an explicit caution flag to test live before ever depending on them if revisited; full connected-system testing folded into normal implementation/build-debugging rather than treated as a separate pre-build gate. **Documentation/learning phase is now closed. Ready for implementation.**
