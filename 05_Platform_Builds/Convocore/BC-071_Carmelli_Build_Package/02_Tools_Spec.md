# BC-071 — Carmelli Bakery: Tools Spec (v1)

```
Client:     Carmelli Bakery (client_id eb27a21f-209d-4b6d-8f6e-cb216411f6c4)
Archetype:  commerce_ecom
Purpose:    Every Custom Tool + System Tool to configure in Convocore,
            per Convocore_Agent_Build_Order_Guide_v2.md Part 4
            ("Tools — Test Before Wiring Into Prompts"). Keys sourced
            from the real Tool Name Registry, never invented.
Sourced:    INTEGRATION_CONTRACT_v1.md Part 4.2 (registry) + Part 20
            (example payloads), n8n_Workflow_Specification_v1.md
            Part 13 (exact payload/response schemas) + Part 7.6
            (module ownership table), Tool_Naming_Convention.md
            (Key format rule), Convocore_Canvas_Ground_Truth_FINAL.md
            Part 6 (System Tools mechanics), Convocore_Adapter_Spec_
            FINAL.md Parts 2-3 + 7 (Adapter routing mechanics), and —
            for §0.5 and every Server URL below — a live n8n MCP
            read of the real Adapter workflow (ADP-002, id
            `BOxeuH6ehv46FZL0`) and WF-001/WF-016 (2026-08-17,
            recheck pass).
```

---

## 0.5 Real finding — ONE Server URL for every Custom Tool, not one per tool (recheck, 2026-08-17)

Live-verified via n8n MCP against the actual deployed Adapter workflow
(`BOxeuH6ehv46FZL0`, "Zenny Platform Adapter - Convocore Adapter
ADP-002", `active: true`). This corrects v1's placeholder ("n8n webhook
URL for WF-001... get from the human") — the URL is real, live, and the
same for every Custom Tool, not per-tool:

```
Server URL (paste into EVERY Custom Tool's Server URL / "Final URL" field,
appending each tool's own query string per §0.6 below):
  https://n8n-cbzu.srv1881104.hstgr.cloud/webhook/convocore-adapter?agent_id=<this-agent's-real-convocore-agent-id>&key=<tool-key>

  create-lead:      ...convocore-adapter?agent_id=<real-id>&key=create-lead
  update-customer:  ...convocore-adapter?agent_id=<real-id>&key=update-customer

Method: POST (all tools)
```

**Why one URL, not per-tool:** the Adapter is a single n8n workflow that
every Convocore Custom Tool call hits first — it resolves `agentId` →
`client_id` (per `convocore_agent_map`), verifies the Bearer token
against that agent's stored secret, builds the Standard Request
Contract, then internally forwards to the *real* per-tool n8n webhook
(e.g. `.../webhook/create-lead`) based on the Custom Tool's `Key` field
(read as `tool_name`/`key` in the incoming payload). Convocore itself
never calls `create-lead`'s or `update-customer`'s webhook directly —
confirmed by reading the Adapter's own `Forward To Tool` node, which
builds the downstream URL from a hardcoded `builtTools` allow-list that
includes both `create-lead` and `update-customer`.

**Secret Key field — corrected 2026-08-17, real value, not blank:**
v1.2's "leave blank" guidance assumed Convocore's own auto-Bearer
mechanism was inspectable/verifiable through the dashboard. It isn't —
there's no UI field that surfaces what a blank Secret Key actually
sends, so it can't be confirmed or matched against anything on our
side. Standard fix instead: **we generate our own secret and you paste
it into this field.** A real 256-bit random secret has been generated
and stored in the credential platform (`convocore_agent_map` row for
Carmelli now live, secret_id `a0ca9dc4-c678-46d3-96a3-2de8a54b3136`,
region `na`). **Paste that exact value into the Secret Key field of
BOTH Custom Tools** (`create-lead` and `update-customer`) — the
plaintext value was given directly in chat when this was generated, not
committed here (never store a real secret in a git-tracked file, per
CLAUDE.md's standing repo rule); retrieve it again anytime via
`SELECT public.read_credential_secret('a0ca9dc4-c678-46d3-96a3-2de8a54b3136'::uuid)`
if needed.

This is not a third-party credential being invented — it's a webhook
signing secret we control both ends of (we generated it, we store it,
Convocore just echoes it back as the Bearer token on every call so the
Adapter can confirm it's really this agent). The Adapter's `Read Agent
Secret` → `Bearer Token Valid?` nodes check the caller's Bearer token
against this exact stored value.

**Real doc-vs-reality gap resolved (Document Resolution Authority):**
`n8n_Workflow_Specification_v1.md` §13.1/§13.16 label `CreateLead` and
`UpdateCustomer` **"Status: Planned."** Live n8n MCP check shows both
are actually **built and active**: `Zenny Growth Agent - CreateLead
(WF-001)` (id `fjJkKxA3o6kfeLoz`, `active: true`) and `Zenny Core Agent
- UpdateCustomer (WF-016)` (id `ogYca9QFCMIEWrWG`, `active: true`).
The master registry doc is stale on this one field, not a real gap —
noted here and in `Wiki/log.md`, not fixed in the registry doc itself
(out of this card's scope).

**Real finding on `update-customer`'s actual current behavior:** WF-016's
own description states it plainly — *"high-risk action. No verification
process is configured anywhere in this system yet, so per the Customer
Verification Rule it always routes to Human Handoff Handler (WF-017)
rather than executing unverified."* **Calling `update-customer` today
always produces a human handoff — it never actually updates a field.**
This doesn't change §1.2's Low-priority framing, but sharpens why: right
now it's functionally identical to just invoking `human-handoff`
directly, so there's little value wiring it as a separate Custom Tool
for Carmelli's launch until real customer verification exists.

---

## 0.6 CRITICAL — a real live bug the human's own test found and this pass fixed (2026-08-17)

**The Adapter's live code, as it stood through v1.1 of this doc, would
have 401'd on every single real Custom Tool call.** The human ran a real
create-lead test in n8n and captured Convocore's actual outgoing request
body directly from the webhook node. It looks nothing like what the
Adapter's `Normalize Incoming Payload` node assumed:

```json
// Convocore's REAL body shape (live-captured, human test):
{
  "convo_id": "<conversation-id>",
  "session_id": "<session-id>",
  "tool_metadata": { "tool_id": "" },
  "tool_payload": { "channel": "web-chat", "lead_intent": "...", "conversation_summary": "...", "archetype": "...", "user_id": "..." }
}
```

**vs. what the Adapter code expected:** `body.agentId`, `body.conversation_id`,
`body.tool_name`/`body.key`, `body.variables`/`body.payload` — **none of
which exist in the real body.** Most critically, **`agentId` is not
present anywhere** — the Adapter's very first step (resolve the calling
agent → `client_id`) had no data to work with, meaning every real call
would have failed with `UNKNOWN_AGENT` before reaching any tool logic.

**Root cause, and the fix actually applied (live, this session):**
Convocore's Custom Tool call body genuinely never carries which agent or
which tool is calling — that information has to come from the URL
itself. Fixed `Normalize Incoming Payload` (workflow `BOxeuH6ehv46FZL0`)
to read `agent_id`/`key` from the **URL query string** (hence §0.5's
Server URL now including `?agent_id=...&key=...`), `convo_id` for the
conversation ID, and `tool_payload` for the actual parameters. **Live-
tested against the human's real captured shape** (with query params
added): `Normalize Incoming Payload` now correctly outputs `agentId`,
`tool_name: "create-lead"`, `conversation_id`, and the real `variables`
object — verified via a real n8n test execution (id `30214`), which
correctly reached `Get Convocore Agent Map` and correctly stopped at
"Unknown Agent" only because no real Carmelli agent exists yet (expected
— gate 2 isn't built). No live data was touched; the Supabase lookup
ran for real and correctly found nothing.

**What this means for you, building in Convocore's dashboard:** every
Custom Tool's Server URL **must** include its own `?agent_id=...&key=...`
query string (§0.5) — this is not optional decoration, it's now the
only way the Adapter can identify the caller at all. The literal
`agent_id` value is your agent's own real `convocore_agent_id`, which
only exists once you've created the agent in Canvas UI (gate 2) — fill
this field in after that step, not before.

---

## 0. Real finding — Carmelli's conversion mode is B, not A (read this first)

`Agent_Runtime_System_v1.md` Module 3 §2 states plainly: Commerce (Ecom)'s
`conversion_mode` is `agent_cart` (Mode A) only if "a cart-creation API
integration exists"; **"without it, config defaults to Mode B" (guided_link)**.
Carmelli's real intake answer (D2, BC-059/060) is "None yet / static site
only — demo decision." No cart-creation API exists for this client.

**Consequence for this build:**
- `CreateCart` (Mode A's tool) is **not wired** — there is nothing for it
  to call. Building it now would mean configuring a tool against a
  backend that doesn't exist, which is the same class of problem the
  Credential Gate exists to prevent for credentials — extended here to
  "don't build a tool with no real target."
- Carmelli's Conversion Engine node runs **Mode B — Guided to Product
  Link** (`Agent_Runtime_System_v1.md` Module 3, Commerce—Ecommerce,
  "Mode B — Guided to Product Link"): confirm the item, give a direct
  product-page link (sourced from the client's real site/KB, not
  invented), no tool call needed for the happy path.
- **`GetOrderStatus` is also not wired**, for the same reason one level
  up the chain — Mode B never creates an order record in the first
  place (no cart write happens), so there is no order to look status up
  on yet. This is a genuine, disclosed gap, not an oversight: revisit
  both `CreateCart` and `GetOrderStatus` if/when Carmelli connects a
  real ecommerce platform (Shopify/WooCommerce/custom) — at that point
  this becomes a real Build Card, not a retrofit of this one.

**If a live cart/order backend is connected later:** re-open this card's
scope rather than improvising Mode A content into the Global Prompt/Node
spec ahead of time — Mode A's actual flow (`Agent_Runtime_System_v1.md`
Module 3, Ecom Mode A) needs the real API's response shape to write
correct Instructions against, which doesn't exist yet.

---

## 1. Custom Tools to build (2 — real, wired, Doc-Search-First sourced)

### 1.1 `create-lead`

| Field | Value | Source |
|---|---|---|
| **Key** | `create-lead` (kebab-case, matches `CreateLead`'s Runtime-facing name exactly) | `INTEGRATION_CONTRACT_v1.md` §4.1 table + `Tool_Naming_Convention.md` registry |
| **Owning module** | Growth Agent (creates); Conversion Engine executes downstream — Growth Agent never calls an action tool itself beyond this handoff | `Tool_Naming_Convention.md` "Mapping to the Module Responsibility Contract" |
| **Description** (paste into Convocore) | "Call this once a customer has shown genuine interest in a specific bakery item but hasn't yet committed to getting the product link, OR when handing off an open interest to a human/lead record. Do not call this for every message — only when a real, specific interest exists." | Derived from Module 2 §B "Tier 2 data collection trigger point" + §3 "What data must be ready before handoff" |
| **Method** | POST | `Convocore_Canvas_Ground_Truth_FINAL.md` §6.2 (Custom Tool fields) |
| **Server URL** | `https://n8n-cbzu.srv1881104.hstgr.cloud/webhook/convocore-adapter?agent_id=88k7NMEPY59vDEG4Jk90&key=create-lead` — see §0.5/§0.6 for why the query string is now mandatory, not optional | n8n MCP live read, ADP-002 (`BOxeuH6ehv46FZL0`), fixed and live-tested this pass |
| **Secret Key** | Paste the real generated secret (credential platform id `a0ca9dc4-c678-46d3-96a3-2de8a54b3136`) — NOT blank, corrected 2026-08-17 — see §0.5 | n8n MCP live read (Adapter's `Read Agent Secret`/`Bearer Token Valid?` nodes) + real Supabase insert this pass |
| **Parameters (attach as Variables)** | `customer_id` → custom var `customer_id` (NOT the system var `user_id` directly — Convocore sends a Variable's own Key as the field name, no renaming on attachment; `01_Variables_Spec.md` §0/§1); `archetype` → hardcode `"commerce_ecom"` (static, not LLM-decided); `intent` → custom var `intent` (renamed from `lead_intent` this pass — must match WF-001's real field name exactly); `source_channel` → custom var `source_channel`, kept in sync with the built-in `channel` value (**corrected 2026-08-17**: the DB enum was renamed platform-wide from `website` to the real Convocore value `web-chat`, so this is now a direct passthrough — no more override/hardcode instruction needed, same reasoning as `customer_id`/`user_id`); `conversation_summary` → custom var `conversation_summary` | `n8n_Workflow_Specification_v1.md` §13.1 payload schema + `01_Variables_Spec.md` v1.4, confirmed against WF-001's live `Normalize Contract`/`Validate Input` nodes AND a live-captured real Convocore call (§0.6) |
| **Test before wiring** | Fire the Test button with a realistic payload before referencing it in any node's Instructions | `Convocore_Agent_Build_Order_Guide_v2.md` Part 4 item 3 |

### 1.2 `update-customer`

| Field | Value | Source |
|---|---|---|
| **Key** | `update-customer` | `INTEGRATION_CONTRACT_v1.md` §4.1 table |
| **Owning module** | Core Agent | `n8n_Workflow_Specification_v1.md` §7.6 |
| **Description** | "Call this only when a customer explicitly corrects previously-given information (e.g., a misspelled name, wrong email). Do not call this speculatively." | Derived from Module 1's general low-risk-action framing (§B Customer Verification Rule) |
| **Method** | POST | n8n MCP live read (WF-016's real webhook trigger) |
| **Server URL** | Same shared Adapter URL as `create-lead`, own query string — `https://n8n-cbzu.srv1881104.hstgr.cloud/webhook/convocore-adapter?agent_id=88k7NMEPY59vDEG4Jk90&key=update-customer` | See §0.5/§0.6 |
| **Secret Key** | Same real generated secret as `create-lead` (§0.5) | See §0.5 |
| **Parameters** | `customer_id` → same `customer_id` custom var as `create-lead` uses (not the system var `user_id` directly — same reasoning as §1.1); `fields` → open object, composed by the LLM from the specific correction stated in-conversation, not a stored Variable (the field being corrected varies per use) | `n8n_Workflow_Specification_v1.md` §13.16 payload schema |
| **Priority for this build** | Low, and lower than v1 stated — WF-016's own live description confirms it **always** routes to human-handoff right now (no verification mechanism exists yet), so it currently behaves identically to calling `human-handoff` directly. Build if time permits; not blocking BC-071's Definition of Done. See §0.5. | n8n MCP live read (WF-016 description) |

---

## 2. System Tools to enable

### 2.1 `human-handoff` — enable, core tool

Per `Convocore_Canvas_Ground_Truth_FINAL.md` §6.3: config needed is
"Description + variables + emails" — no webhook field is documented in
the dashboard UI for System Tools the way Custom Tools have one.

**Genuinely open, verify live (not invented here):** the Adapter's own
live code (`Normalize Incoming Payload` node) explicitly checks for
`tool_name === 'human-handoff'` and routes it through a dedicated path
that writes directly to `insert_client_escalation` (skipping WF-017
entirely — this tool_name never gets forwarded to a per-tool n8n
webhook the way `create-lead`/`update-customer` do). This confirms the
Adapter *expects* `human-handoff` invocations to reach it, matching
`Convocore_Adapter_Spec_FINAL.md` Part 7's note that human-handoff
"requires the Adapter to have a trigger path... distinct from a
standard Custom Tool call" — but neither that doc nor Ground Truth
confirms *which Convocore dashboard field* makes that connection happen
(a System Tool's own webhook/notification setting, a workspace-level
integration setting, or something else). **Check Convocore's dashboard
live when configuring this tool** rather than assuming a field exists
that hasn't been confirmed — if a webhook/URL field does appear for
`human-handoff`, it takes the same shared Adapter URL from §0.5.

| Field | Value | Source |
|---|---|---|
| **Description** | "Use when the customer explicitly asks for a human, when a question can't be answered after 2 clarification attempts, when a complaint needs escalation, or when Mode B's guided link isn't the right fit for what the customer needs (e.g., a bulk/custom order)." | `Agent_Runtime_System_v1.md` Module 1 §D Entry Condition (Explicit Request + Agent-Triggered cases) |
| **Built-in `team_key`** | Single value for Carmelli — there is one escalation contact (`carmelli.zennyai@gmail.com`, checklist B9), so `team_key` can be a fixed identifier (e.g. `carmelli_default`) rather than a routing decision the LLM makes. Confirm the exact expected value/format live in Convocore's dashboard when configuring — this is a Canvas-UI field, not a database value to look up. | `Convocore_Canvas_Ground_Truth_FINAL.md` §6.3 + `BC-060_Onboarding_Process_Reference_v1.md` (B9 answer) |
| **Built-in `issue_summary`** | LLM-composed at call time — instruct the node to summarize the specific reason for escalation in one or two sentences when invoking this tool (this is separate from, and can reuse, the `conversation_summary` custom Variable's running content). | `Convocore_Canvas_Ground_Truth_FINAL.md` §6.3 + `Agent_Runtime_System_v1.md` Module 1 §D "What context is passed to human agent" |
| **Notify-emails field** | `carmelli.zennyai@gmail.com` | Checklist B9 |
| **"Also notify workspace owner emails"** | Human decision — confirm with the human when building (not assumed here) | — |

### 2.2 Not enabled for this build

| System Tool | Why not |
|---|---|
| `shopify` | No Shopify connection exists for Carmelli (D2) — see §0. |
| `sms` | `sms_agent_enabled = false` (checklist B4/B3, `BC-060_Onboarding_Process_Reference_v1.md` Step 3) |
| `forward-call`, `end-call` | `voice_agent_enabled = false` (same source) — Carmelli is web-chat only. |
| `airtable`/`google-sheets`/`google-calendar`/`calendly`/`web-control` | Standing platform decision, not client-specific — `Convocore_Canvas_Ground_Truth_FINAL.md` §6.4/§6.5 (own-OAuth-platform strategy; web-control not planned for use). |

---

## 3. KB — not a Tool

Confirmed live: "KB-Search is NOT and never was a system tool" — it's
node-level config (Enable KB toggle + Search on start + prompt
instructions), not a Tools-panel object. Covered in `03_GlobalPrompt_
and_Nodes_Spec.md`, not here. (`Convocore_Canvas_Ground_Truth_FINAL.md`
§6.1 note.)

---

## Document Changelog
- **v1 (2026-08-17)** — first version. Real finding (§0): Carmelli's
  real intake answer (no ecommerce platform) rules out Mode A/`CreateCart`
  and, downstream, `GetOrderStatus` — both disclosed as not-built rather
  than invented against a nonexistent backend. Only 2 Custom Tools
  (`create-lead`, `update-customer`) plus the `human-handoff` System
  Tool are real, wired scope for this build.
- **v1.1 (2026-08-17)** — recheck pass, human-requested. Real finding
  (§0.5), live n8n MCP-verified: every Custom Tool's Server URL is the
  SAME shared Adapter webhook (`.../webhook/convocore-adapter`), not a
  per-tool URL as v1 implied — confirmed against the live Adapter
  workflow (ADP-002) and WF-001/WF-016's real, active (not "Planned")
  status. Secret Key corrected to "leave blank" (Convocore's own
  auto-Bearer mechanism, verified against the Adapter's actual auth
  check) rather than "invent a credential." Found WF-016 currently
  always routes to human-handoff (no verification mechanism exists),
  sharpening its Low-priority note. `human-handoff`'s own webhook wiring
  in Convocore's dashboard remains a genuinely open, disclosed question
  — not resolved by any doc, flagged for live verification rather than
  guessed.
- **v1.2 (2026-08-17)** — second recheck, same day, triggered by the
  human's own real test: pinned a live Convocore Custom Tool call in
  n8n's webhook test mode and captured the actual body Convocore sends.
  **Found and FIXED a critical live bug (§0.6):** the Adapter's real
  body shape (`convo_id`/`session_id`/`tool_metadata.tool_id`/
  `tool_payload`) never matched what `Normalize Incoming Payload`
  expected (`agentId`/`conversation_id`/`tool_name`/`variables`) —
  `agentId` in particular was never present in the body at all, meaning
  every real call would have failed `UNKNOWN_AGENT`. Fixed the Adapter's
  live n8n node (workflow `BOxeuH6ehv46FZL0`) to read `agent_id`/`key`
  from the Server URL's own query string instead, and `tool_payload` for
  parameters — live-tested against the human's real captured shape,
  confirmed working (execution id `30214`). Server URL guidance (§0.5)
  updated to require `?agent_id=...&key=...` on every Custom Tool — not
  optional. Also found: the create-lead Variable-attachment guidance
  itself was wrong (System Variables can't be renamed on attachment) —
  see `01_Variables_Spec.md` v1.2 for the paired fix; this doc's §1.1/1.2
  Parameters rows corrected to match.
- **v1.3 (2026-08-17)** — human reported "there is no way to get agent
  secret from the UI," correctly invalidating v1.2's "leave Secret Key
  blank" guidance (that mechanism can't be verified against anything if
  it can't be inspected). Real fix: generated a real 256-bit secret via
  Postgres (`gen_random_bytes`), stored it in the credential platform,
  and inserted Carmelli's real `convocore_agent_map` row (agent id
  `88k7NMEPY59vDEG4Jk90`, region `na`, secret id `a0ca9dc4-c678-46d3-
  96a3-2de8a54b3136`) — live, not a placeholder. Secret Key field now
  correctly says "paste this specific real value," plaintext given in
  chat only, never committed to this file (repo standing rule). Also
  landed Carmelli's `client_config` row (was empty — real gap, see
  `Wiki/log.md` session-BC-071-followup) using BC-060's already-decided
  fields plus `max_booking_horizon = 365`, the documented default
  (`Agent_Runtime_System_v1.md` line 1078/Appendix B) — a Doc-Search-
  First miss in the original BC-071 pass, not a real open decision.
- **v1.4 (2026-08-17)** — human live-tested `create-lead` for real,
  found WF-001's customer-resolution path was never actually wired
  (fixed — see `Wiki/log.md` session-BC-071-customer-resolution-fix and
  `06_Infrastructure/n8n/Workflow_Registry.md`'s WF-001 entry), then
  made a platform-wide architecture call on `source_channel`: instead of
  instructing the LLM to override it with a hardcoded literal that
  didn't match Convocore's real `channel` value, renamed
  `public.source_channel_enum`'s `website` value to the real Convocore
  value `web-chat` everywhere in the database (existing rows migrated
  automatically). §1.1's Parameters row corrected — `source_channel` is
  now a direct passthrough of the built-in `channel` value, no more
  override instruction needed. Also fixed the one stale example in
  `INTEGRATION_CONTRACT_v1.md` Part 20.1 (`"website"` → `"web-chat"`).
