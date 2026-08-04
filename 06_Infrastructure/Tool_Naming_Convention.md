# Action Tool Naming Convention

```
Project:   Zeny Ai - Voiceflow
Document:  Tool_Naming_Convention.md v1.0
Layer:     06_Infrastructure — operations/tooling, not runtime behavior
```

---

## What This Is

`Agent_Runtime_System_v1.md`, Step 1D.3 (Action Tool Execution Contract)
defines how every external tool call *behaves* once invoked: REQUESTED →
WAITING → SUCCESS / FAILED / TIMEOUT, generalized system-wide from Module
3 §1.1 and §5. Step 1D.3 does not define what the tools themselves are
*named* — this document fills that specific gap.

Every concrete tool/webhook the runtime calls — regardless of which
module invokes it or which of the 5 archetypes it serves — follows this
convention. This is a builder-facing naming standard, not a change to
any runtime behavior defined in the main document.

---

## Format

```
{verb}-{entity}
```

- kebab-case, all lowercase, no abbreviations.
- One action per tool name. A tool that both checks availability and
  books a slot is wrong — these are two tools (`check-availability` and
  `create-appointment`), never combined into one call, even if a
  specific integration happens to support both in one API request.
- Info-type lookups that pull from Business Memory / the knowledge base
  rather than calling an external system use `kb:{section-name}` instead
  of a verb-entity webhook name (e.g. `kb:cancellation-policy`,
  `kb:service-catalog`) — these are not tool calls under Step 1D.3's
  lifecycle, since there is no external system to wait on.

---

## Verb Vocabulary

| Verb | When to use | Example tool names |
|---|---|---|
| `get` | Read a single resource | `get-order-status`, `get-booking-status` |
| `list` | Fetch multiple items or options | `list-available-slots`, `list-products` |
| `check` | Verify or validate something before committing to it | `check-availability`, `check-stock-level` |
| `create` | Create a new record, booking, or queue entry | `create-appointment`, `create-cart`, `create-callback-queue-entry` |
| `update` | Modify an existing record | `update-appointment`, `update-delivery-address` |
| `cancel` | Cancel or revoke a record | `cancel-appointment`, `cancel-order` |
| `send` | Trigger an outbound notification or message | `send-recovery-message`, `send-email-reply` |

---

## Tool Name Registry — Examples Drawn From the 5 Archetype Builds

This is not the complete tool inventory (that lives in the Integration
Contract) — it is enough real, archetype-grounded examples to make the
convention concrete for a builder naming a new tool.

| Tool name | Calling module | Archetype / context |
|---|---|---|
| `check-availability` | Conversion Engine | Universal Availability Validation Layer (Module 3 §2.1) — table/slot, calendar, or team availability depending on archetype |
| `create-cart` | Conversion Engine | Commerce Ecom, Mode A (Agentic Completion) |
| `create-reservation` | Conversion Engine | Commerce Restaurant, Mode A |
| `create-waitlist-entry` | Conversion Engine | Commerce Restaurant, Mode B — waitlist sub-type when `waitlist_enabled` and no slot available |
| `create-appointment` | Conversion Engine | Appointment, Mode A (Direct Booking) |
| `create-booking-request` | Conversion Engine | Appointment, Mode B — Request Booking sub-type (human confirms) |
| `cancel-appointment` | Core Agent (Support Handler, after handoff) | Appointment/Commerce Restaurant reservation-modification handoff |
| `create-callback-queue-entry` | Conversion Engine | Emergency, Mode A (Callback Queue) |
| `create-inspection-slot-booking` | Conversion Engine | Emergency, Mode B — non-emergency/quote-request branch (Appendix B Flag 1) |
| `create-scored-booking` | Conversion Engine | Consultation, Mode A — fires only after the Score Gate (`consultation_scoring_enabled`) passes |
| `create-registration` | Conversion Engine | Engagement — Donate/Volunteer/Attend, Mode A (Direct Registration) |
| `get-order-status` | Core Agent (Support Handler) | Commerce Ecom, Intent 04 |
| `send-recovery-message` | Recovery Engine | All archetypes, per cadence step (Module 4 §4) |
| `send-email-reply` | Email Manager | Level 2/3 autonomous or human-approved sends (Module 5 §4) |
| `notify-human` | Core Agent (Human Handoff Handler) | Module 1D — carries `conversation_summary`, intent history, escalation reason |

---

## Rules

- **One action per tool name** — never combine two actions into one
  call (e.g., a single tool that both checks availability AND books is
  wrong; these are two tools, always called as two separate Step 1D.3
  lifecycles).
- **Breaking interface change → append `-v2` suffix.** Do not silently
  redefine an existing tool's contract — a client already integrated
  against `create-appointment` must not have its behavior change under
  the same name. Publish `create-appointment-v2` and migrate deliberately.
- **New verb needed → document here first.** No ad hoc naming by
  individual builders. If none of the 7 verbs above fit, propose the
  addition to this registry before using it in a build.

---

## Mapping to the Module Responsibility Contract

Each tool name's calling module is determined by the Module
Responsibility Contract (Step 1D.0.5) — a tool is only called by the
module that OWNS the action it performs, independent of whether Step
1D's routing happened to land elsewhere first.

- **Conversion Engine** owns every `create-{booking-type}` /
  `create-cart` / `create-registration` tool — the archetype's Mode A
  agentic-completion actions.
- **Recovery Engine** owns `send-recovery-message` exclusively — no
  other module fires a recovery-cadence send.
- **Email Manager** owns `send-email-reply` and any `send-*` tool used
  for outbound email content (Module 5 §7's transactional-vs-
  discretionary distinction still applies to *when* the send happens,
  not to which module owns the tool).
- **Core Agent** owns lookup/status tools reached via its Support
  Handler (`get-order-status`, `get-booking-status`) and the
  `notify-human` tool inside its Human Handoff Handler — Growth Agent
  and Conversion Engine never call `notify-human` directly, they
  reclassify per Step 1E and let Core Agent own the handoff, consistent
  with the Contract's MUST TRANSFER rule.
- **Growth Agent never calls an action tool directly.** Per the Module
  Responsibility Contract, Growth Agent's role ends at handoff (Module 2
  §3) — every `create-*` tool call happens after control passes to
  Conversion Engine, never before.

---

```
ZeroManual · Zenny AI Workforce · Tool_Naming_Convention.md v1.0
Extracted and rebuilt from the Modular architecture's webhook naming
convention (01_Strategy/Modular_Legacy/ZeroManual_AddOn_Anatomy_Standard.md
§2), against current Archetype/Runtime terminology.
```
