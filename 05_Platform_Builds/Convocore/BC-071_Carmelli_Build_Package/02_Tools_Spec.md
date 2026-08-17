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
            Part 6 (System Tools mechanics).
```

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
| **Server URL** | n8n webhook URL for WF-001 (`create-lead` Entry Workflow) — get from the human/n8n instance, not invented here | `n8n_Workflow_Specification_v1.md` §13.1 |
| **Secret Key** | Bearer token per the credential platform — Credential Gate applies, do not invent | `Convocore_Canvas_Ground_Truth_FINAL.md` §6.2 |
| **Parameters (attach as Variables)** | `customer_id` → system var `user_id`; `archetype` → hardcode `"commerce_ecom"` (static, not LLM-decided); `intent` → custom var `lead_intent`; `source_channel` → hardcode `"website"` (Carmelli is web-only, B2/B3/B4 all false); `conversation_summary` → custom var `conversation_summary` | `n8n_Workflow_Specification_v1.md` §13.1 payload schema + `01_Variables_Spec.md` |
| **Test before wiring** | Fire the Test button with a realistic payload before referencing it in any node's Instructions | `Convocore_Agent_Build_Order_Guide_v2.md` Part 4 item 3 |

### 1.2 `update-customer`

| Field | Value | Source |
|---|---|---|
| **Key** | `update-customer` | `INTEGRATION_CONTRACT_v1.md` §4.1 table |
| **Owning module** | Core Agent | `n8n_Workflow_Specification_v1.md` §7.6 |
| **Description** | "Call this only when a customer explicitly corrects previously-given information (e.g., a misspelled name, wrong email). Do not call this speculatively." | Derived from Module 1's general low-risk-action framing (§B Customer Verification Rule) |
| **Method** | POST/PATCH (confirm against the live n8n workflow when built) | `n8n_Workflow_Specification_v1.md` §13.16 |
| **Parameters** | `customer_id` → system var `user_id`; `fields` → open object, composed by the LLM from the specific correction stated in-conversation, not a stored Variable (the field being corrected varies per use) | `n8n_Workflow_Specification_v1.md` §13.16 payload schema |
| **Priority for this build** | Low — genuinely edge-case for a launch-scope demo. Build if time permits; not blocking BC-071's Definition of Done. | Scope judgment, disclosed not hidden |

---

## 2. System Tools to enable

### 2.1 `human-handoff` — enable, core tool

Per `Convocore_Canvas_Ground_Truth_FINAL.md` §6.3: config needed is
"Description + variables + emails" — no webhook to build, this is native
to Convocore.

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
