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
            Runtime doc's abstract field names below).
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
`name`, `address` as exact Keys are auto-captured"). Reference these
system variables directly in tool payloads and Instructions — creating
a duplicate custom Variable with the same data is wasted structure.

---

## 1. Custom Variables to create (3 total — genuinely minimal)

Carmelli has no cart-creation API and no order-tracking backend yet
(Intake D2: static site, no ecommerce platform connected — human
decision, "for now take it as a static site, as a demo that enough").
This keeps the Variable list real and small, not padded for
capabilities that don't exist yet — see `02_Tools_Spec.md` §0 for the
full Mode A→B consequence.

| Key | Type | Global? | Description (paste into Convocore's Description field) | Capture instruction (must be echoed in node Instructions — Convocore does NOT auto-infer, `Ground_Truth` §7.4) | Used by |
|---|---|---|---|---|---|
| `selected_product` | String | No (Local) | "The specific product or item the customer has shown real interest in — a named bakery item (e.g. 'sourdough loaf', 'kosher challah'), not a category. Set only once genuine interest is confirmed, per Recommendation Confidence Requirement (`Agent_Runtime_System_v1.md` Module 2 §2.B)." | "When the customer confirms interest in a specific item, save it to `selected_product` using the exact item name they responded positively to." | Conversion Engine node — carries the item across the Growth→Conversion handoff so Conversion Engine never re-asks (`Agent_Runtime_System_v1.md` Module 2 §3). |
| `lead_intent` | String | No (Local) | "One short sentence naming what the customer is interested in or needs — used to create a Lead record, not shown to the customer verbatim." | "Before handing off to the ordering step, or if the customer disengages with open interest, summarize their need in one sentence and save it to `lead_intent`." | `CreateLead` tool's `intent` payload field (`n8n_Workflow_Specification_v1.md` §13.1). |
| `conversation_summary` | String | No (Local) | "A brief, factual summary of what's been discussed so far in this conversation — used to hand context to a human or to a Lead record, never shown to the customer." | "Keep `conversation_summary` updated with a brief factual recap whenever you hand off to a human or create a lead." | `CreateLead` tool's `conversation_summary` field; supplements (does not replace) the `human-handoff` System Tool's own built-in `issue_summary` field (§2 below). |

**Naming discipline applied:** all three Keys are `snake_case`, per
`Convocore_Canvas_Ground_Truth_FINAL.md` §7.6's stated convention, and
none collides with a System Variable or the auto-captured `email`/
`name`/`address` keys.

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
