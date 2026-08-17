# BC-071 — Carmelli Bakery: Variables Spec (v1)

```
Client:     Carmelli Bakery (client_id eb27a21f-209d-4b6d-8f6e-cb216411f6c4)
Archetype:  commerce_ecom
Purpose:    Every Variable to create in Convocore's Canvas Variables panel
            before touching Tools or node Instructions — per
            Convocore_Agent_Build_Order_Guide_v2.md Part 3 ("Variables
            Before Tools"). Copy-paste-ready for the human's manual
            Canvas UI build (BC-060 gate 2).
Sourced:    n8n_Workflow_Specification_v1.md Part 13 (payload schemas),
            Convocore_Canvas_Ground_Truth_FINAL.md Part 7 (Variable
            mechanics — this is what actually overrides the generic
            Runtime doc's abstract field names below). Recheck passes
            (2026-08-17) additionally verified `customer_id`'s real
            precondition against WF-001's live code (§1b) and, via the
            human's own live-captured test call, that System Variables
            can't be reused as differently-named payload fields (§0/§1).
```

---

## 0. Real finding — most "capture" work is already done for you

Convocore auto-populates 9 **System (Default) Variables** on every
conversation, read-only, no setup needed (`Convocore_Canvas_Ground_Truth_
FINAL.md` §7.5): `phone_number`, `channel`, `timestamp`, `conversation_id`,
`user_email`, `user_name`, `agent_id`, `agent_name`, `user_id`.

**Consequence:** do NOT create custom Variables for customer name/email/
phone — `user_name`/`user_email`/`phone_number` already exist and are
already what Convocore's own lead system keys off (confirming
`Convocore_Agent_Build_Order_Guide_v2.md` Part 3.4's note: "`email`,
`name`, `address` as exact Keys are auto-captured").

**Correction (recheck pass, 2026-08-17) — do NOT attach System
Variables directly as a Custom Tool's payload parameters if the target
field needs a different name.** A live-captured real Convocore Custom
Tool call (human test, `02_Tools_Spec.md` §0.5) proved a Variable's
outgoing JSON field name is always its own `Key` — Convocore has no
mechanism to attach a Variable "as" a differently-named payload field.
Attaching the system variable `user_id` to `create-lead` sends a field
literally named `user_id`; WF-001 needs `customer_id` and gets nothing.
§1a below is the real fix: a genuinely new custom Variable whose Key
already matches the target field name, kept in sync via a capture
instruction, not a reused System Variable.

---

## 1. Custom Variables to create (5 total — corrected count, recheck pass)

Carmelli has no cart-creation API and no order-tracking backend yet
(Intake D2: static site, no ecommerce platform connected — human
decision, "for now take it as a static site, as a demo that enough").
This keeps the Variable list real and small, not padded for
capabilities that don't exist yet — see `02_Tools_Spec.md` §0 for the
full Mode A→B consequence.

| Key | Type | Global? | Description (paste into Convocore's Description field) | Capture instruction (must be echoed in node Instructions — Convocore does NOT auto-infer, `Ground_Truth` §7.4) | Used by |
|---|---|---|---|---|---|
| `selected_product` | String | No (Local) | "The specific product or item the customer has shown real interest in — a named bakery item (e.g. 'sourdough loaf', 'kosher challah'), not a category. Set only once genuine interest is confirmed, per Recommendation Confidence Requirement (`Agent_Runtime_System_v1.md` Module 2 §2.B)." | "When the customer confirms interest in a specific item, save it to `selected_product` using the exact item name they responded positively to." | Conversion Engine node — carries the item across the Growth→Conversion handoff so Conversion Engine never re-asks (`Agent_Runtime_System_v1.md` Module 2 §3). |
| `intent` | String | No (Local) | "One short sentence naming what the customer is interested in or needs — used to create a Lead record, not shown to the customer verbatim." | "Before handing off to the ordering step, or if the customer disengages with open interest, summarize their need in one sentence and save it to `intent`." | `create-lead` tool's `intent` payload field (`n8n_Workflow_Specification_v1.md` §13.1). **Renamed from `lead_intent` (recheck pass) — WF-001's real code requires the exact field name `intent`; a different Key produces a missing-field validation error.** |
| `conversation_summary` | String | No (Local) | "A brief, factual summary of what's been discussed so far in this conversation — used to hand context to a human or to a Lead record, never shown to the customer." | "Keep `conversation_summary` updated with a brief factual recap whenever you hand off to a human or create a lead." | `create-lead` tool's `conversation_summary` field; supplements (does not replace) the `human-handoff` System Tool's own built-in `issue_summary` field (§2 below). |
| `customer_id` | String | No (Local) | **NEW (recheck pass).** "Always kept equal to this conversation's built-in `user_id` value — exists only because Convocore Custom Tools send a Variable's own Key as the outgoing field name, and `create-lead`'s required field is `customer_id`, not `user_id`." | "As soon as the conversation's `user_id` is available, save the same value into `customer_id` — keep them in sync for the rest of the conversation." | `create-lead` tool's `customer_id` payload field. Cannot reuse the system variable `user_id` directly — see §0's correction above. |
| `source_channel` | String | No (Local) | "Always kept equal to this conversation's built-in `channel` value — exists only because Convocore Custom Tools send a Variable's own Key as the outgoing field name, and `create-lead`'s required field is `source_channel`, not `channel`." | "Keep `source_channel` set to the same value as the built-in `channel` variable." | `create-lead` tool's `source_channel` payload field — real enum now `web-chat\|whatsapp\|instagram\|facebook\|email\|sms` (corrected 2026-08-17, platform-wide migration — `web-chat` matches Convocore's own `channel` value exactly, no override needed). |

**Naming discipline applied:** all five Keys are `snake_case`, per
`Convocore_Canvas_Ground_Truth_FINAL.md` §7.6's stated convention, and
none collides with a System Variable or the auto-captured `email`/
`name`/`address` keys.

### 1b. Real finding, recheck pass (2026-08-17) — `customer_id`'s real precondition

`create-lead`'s payload needs `customer_id` (§1's new `customer_id`
Variable, kept in sync with `user_id`). Live-reading WF-001's actual
code (n8n MCP, 2026-08-17) shows a step this build package hadn't
surfaced before: WF-001 calls a `client_customer_exists` RPC and
**responds `CUSTOMER_NOT_FOUND` (not a silent failure) if `customer_id`
doesn't already belong to an existing customer record for this
client** — it does not create one.

**RESOLVED (2026-08-17, real fix, not a workaround):** confirmed via the
human's own live test that `customer_id` is never a real internal UUID
when it arrives — it's whatever channel-native identifier the calling
platform uses (Convocore's own `user_id`/chat-session value, an
arbitrary string like `user_123456`). WF-001 has been rebuilt to
resolve this itself: it looks up (or creates + links, if new) the real
internal customer via `find_client_customer_by_channel`/
`insert_client_customer`/`insert_client_channel_identity_link` — RPCs
that already existed but were never wired into any workflow before this
fix. **Consequence: `customer_id` in `create-lead`'s Variables (§1
above) should carry Convocore's own `user_id` value directly (via the
system variable, or this custom var kept in sync with it) — never a
real UUID, and nothing needs to resolve one before calling this tool.**
Live-tested both branches (not-found → creates a real customer + link;
found → resolves the same customer on a repeat call) against real
Carmelli data, execution ids `30872`/`30876` — see `06_Infrastructure/
n8n/Workflow_Registry.md` WF-001 entry for full detail.

---

## 2. NOT a Variable you create — the human-handoff System Tool's own fields

`team_key` and `issue_summary` are **built into Convocore's `human-handoff`
System Tool itself** (`Convocore_Canvas_Ground_Truth_FINAL.md` §6.3) —
they are not created in the Variables panel at all. This corrects
`Agent_Runtime_System_v1.md` Module 1 §D's "planned Integration Contract
v2 fields" (`escalation_type`/`escalation_reason`/`escalation_priority`/
`origin_module`/`trigger_condition`) — those were written before the
live Convocore mechanism was confirmed; Convocore's actual, simpler
mechanism wins per the Doc-Search-First rule (a live, confirmed platform
fact outranks a document's own "planned" language). See `03_GlobalPrompt_
and_Nodes_Spec.md` for how `team_key`/`issue_summary` get configured for
Carmelli specifically.

---

## 3. Explicitly NOT created (disclosed, not silently skipped)

| Would-be Variable | Why it's not in this build |
|---|---|
| `order_reference` / anything for `GetOrderStatus` | No order-tracking backend exists yet for Carmelli (static site, no ecommerce platform) — see `02_Tools_Spec.md` §0. Wiring a Variable for a tool with nothing to query against would be inventing structure ahead of the actual capability. |
| `product_quantity` | Mode B (Guided to Product Link, this build's real mode) delivers a link, not a cart line — quantity has no consumer in this flow. Add only if/when Carmelli gets a real cart API and Mode A becomes buildable. |
| Anything cart/checkout-related (`cart_id`, `checkout_link`, etc.) | `CreateCart`'s payload/response fields (`n8n_Workflow_Specification_v1.md` §13.5) are not reachable without the cart-creation API this deployment doesn't have. Not built — see `02_Tools_Spec.md` §0. |

---

## Document Changelog
- **v1 (2026-08-17)** — first version, built for Carmelli Bakery's real
  intake answers (BC-060) against `Agent_Runtime_System_v1.md` Modules
  1–3, `n8n_Workflow_Specification_v1.md` Part 13, and `Convocore_Canvas_
  Ground_Truth_FINAL.md` Part 7. Real finding: System Variables cover
  all customer-identity capture already; only 3 custom Variables are
  genuinely needed for this deployment's real scope.
- **v1.1 (2026-08-17)** — recheck pass, human-requested. Live n8n MCP
  read of WF-001's actual code surfaced a genuine open precondition on
  `customer_id` (§1a) — disclosed, not resolved (no document answers
  it). No other inaccuracies found in this doc's 3 Variables on
  recheck.
- **v1.2 (2026-08-17)** — second recheck, same day, prompted by the
  human's own live test capture of a real Convocore Custom Tool call
  (`02_Tools_Spec.md` §0.5). **Real bug found and fixed:** v1's guidance
  to reuse System Variables (`user_id`, `channel`) directly as
  `create-lead` payload parameters was wrong — Convocore has no
  mechanism to rename a Variable's Key on attachment, so reusing them
  sends fields literally named `user_id`/`channel`, not the
  `customer_id`/`source_channel` WF-001 actually requires. Fixed:
  2 new custom Variables (`customer_id`, `source_channel`), `lead_intent`
  renamed to `intent` (WF-001's real required field name). Custom
  Variable count corrected 3 → 5. §1b renumbered from §1a.
- **v1.3 (2026-08-17)** — §1b's open precondition genuinely RESOLVED,
  not just disclosed. Human live-tested `create-lead` for real and hit
  exactly the predicted failure (invalid UUID); root cause confirmed
  and fixed live in WF-001 itself (find-or-create customer resolution,
  previously-unwired RPCs assembled into a real flow) — see
  `06_Infrastructure/n8n/Workflow_Registry.md` WF-001 entry. `customer_id`
  in this doc's §1 table needed no change — it always correctly said to
  keep it synced with the system var `user_id`, which is exactly right
  now that WF-001 resolves it internally.
- **v1.4 (2026-08-17)** — platform-wide fix, human's own architecture
  call: rather than keep instructing the LLM to override `source_channel`
  with a hardcoded literal that didn't match Convocore's real `channel`
  value, `public.source_channel_enum`'s `website` value was renamed to
  `web-chat` (live-confirmed exact string via the human's original raw
  webhook capture) everywhere in the database — existing rows migrated
  automatically, no data loss. `source_channel`'s capture instruction
  simplified to a direct passthrough of the built-in `channel` value
  (no more override) — still a distinct custom Variable, same reasoning
  as `customer_id` (Convocore can't rename a Variable's Key on
  attachment, so a Key literally named `source_channel` is still
  required even though its value now just mirrors `channel` exactly).
