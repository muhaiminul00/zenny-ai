# Convocore Findings → Required System Updates v1

```
Status:    NEW — cross-references Convocore_Canvas_Ground_Truth_v1.md and
           Convocore_Adapter_Spec_v1.md against n8n_Workflow_Specification_v1.md
           (APPROVED — Architecture Freeze) and its dependency chain.
Purpose:   List every concrete finding from the Convocore documentation/
           testing phase that requires a change, addition, or Change
           Request against already-frozen documents — so nothing discovered
           gets silently lost or has to be re-discovered later.
Position:  A companion/index document, not itself a frozen architecture
           document. Each item below should become either (a) a formal
           Change Request against the named frozen document, following
           that document's own revision-note convention (e.g. "Registered
           per Change Request N"), or (b) content folded directly into
           Convocore_Adapter_Spec_v1.md if it belongs there instead.
Framing:   Convocore is being adopted as the Conversation Layer for as
           long as the client base doesn't require switching — this list
           assumes Convocore is a real, load-bearing adapter, not a
           temporary demo integration. Findings are written accordingly:
           if something would need fixing before real client traffic runs
           through Convocore, it's listed here.
```

---

## How to read this list

Each finding has:
- **What was found** — the concrete discovery, sourced from live testing
- **Where it needs to go** — which frozen document, which Part/Section
- **Why it matters** — what breaks or stays unknown if it's not addressed
- **Urgency** — Blocking (must resolve before Convocore Build Cards can be written) / Needed-before-production / Nice-to-have

---

## FINDING 1 — `n8n_Workflow_Specification_v1.md` Part 17.4's Convocore status is now stale

**What was found:** Part 17.4 (mirrored from `INTEGRATION_CONTRACT_v1.md` Part 17.4 and `n8n_Execution_Architecture_v1.md` Part 16.4) still reads: *"Convocore | 🔶 Prospective — not yet built or confirmed."* This was accurate when written. It is no longer accurate — Convocore's mechanics have now been live-verified end-to-end (Ground Truth v1) and a full Adapter Spec exists.

**Where it needs to go:** `n8n_Workflow_Specification_v1.md` Part 17.4, `INTEGRATION_CONTRACT_v1.md` Part 17.4, `n8n_Execution_Architecture_v1.md` Part 16.4 — all three currently carry the identical stale status line and should be updated together, not just one.

**Recommended new status line:** `Convocore | 🟢 Adapter Specified — Convocore_Adapter_Spec_v1.md written, ADP-{NNN} ID not yet assigned, Build Card not yet written`

**Why it matters:** three frozen documents currently understate progress already made — anyone reading them fresh would wrongly conclude Convocore evaluation hasn't started.

**Urgency:** Nice-to-have (documentation accuracy, doesn't block build work) — but cheap to fix and worth doing in the same pass as Finding 2.

---

## FINDING 2 — Convocore Adapter needs a real `ADP-{NNN}` ID and a Part 17 registry entry

**What was found:** `n8n_Workflow_Specification_v1.md` Part 3.1 already reserves the `ADP-{NNN}` prefix specifically for Platform Adapters, and Part 6.3's folder structure already has `08_Adapters/` as a real folder. But no Part 17 (or equivalent adapter registry section) currently exists with an actual entry — the Specification's structure anticipated this but the content was never filled in, consistent with Convocore being "prospective" at the time.

**Where it needs to go:** `n8n_Workflow_Specification_v1.md` — needs a new **Part 17 — Platform Adapters registry** (or a subsection if Part 17 is already used for something else in the current version — verify numbering doesn't collide), following the same table format as Part 8's Scheduled Workflows registry:

| ID | Adapter | Status | Folder | Spec Document |
|---|---|---|---|---|
| ADP-001 | Voiceflow Adapter | Production | 08 | (existing, wherever it's currently documented) |
| ADP-002 | Convocore Adapter | Specified, not built | 08 | Convocore_Adapter_Spec_v1.md |

**Why it matters:** without a real registry entry, the Convocore Adapter has no permanent ID, no lifecycle status (per Part 3.2's Planned→Ready→Building→... model), and no Build Card can reference it correctly per this document's own ID discipline (Part 3.1: *"Build Cards never invent their own numbering scheme"*).

**Urgency:** Blocking — needed before a Convocore Adapter Build Card can be written at all.

---

## FINDING 3 — New database table required: `control.convocore_agent_map`

**What was found:** Convocore Adapter Spec Part 5/7 identifies exactly one net-new table needed — resolving Convocore's `agentId` (+ region, + agent secret) to Zenny's internal `client_id`. Fully specified in the Adapter Spec, not yet built.

**Where it needs to go:** `Database_Structure_v4_FINAL.md` — follows the exact same addition pattern already used for the 4 new `control` tables specified (but not yet built) in `Client_Integration_and_Credential_Platform_v1.md` Part 12 item 4 (`oauth_apps`, `client_connections`, `oauth_state`, `connection_audit_log`). Should go through `Template_Migration_Process.md`'s existing manual procedure — same process, not a new one.

**Exact schema (already specified, Adapter Spec Part 5.2 + 7.2):**
```sql
control.convocore_agent_map (
    client_id                    uuid NOT NULL REFERENCES control.clients(client_id),
    convocore_agent_id           text NOT NULL,
    convocore_agent_secret_id    uuid NOT NULL,  -- Vault secret reference
    convocore_region             text NOT NULL,  -- 'eu' | 'na'
    created_at                   timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT convocore_agent_map_unique_agent UNIQUE (convocore_agent_id)
)
```

**Why it matters:** without this table, the Convocore Adapter has no way to resolve an inbound webhook's `agentId` into a `client_id` — this is the single mandatory first step of every Adapter request (Adapter Spec Part 5.3). Nothing else in the Adapter can function without it.

**Urgency:** Blocking — this is the one piece of net-new schema required before any Convocore traffic can flow through the Execution Layer.

---

## FINDING 4 — Tool naming discipline decision needed: Convocore Tool `Key` = Runtime `tool_name`

**What was found:** Convocore Custom Tools use a `Key` field as their identifier (Ground Truth §6.2). The Adapter Spec (Part 4.2) recommends this Key be set identical to the Runtime's existing `tool_name` registry (`CreateAppointment`, `CreateLead`, etc. — `INTEGRATION_CONTRACT_v1.md` Part 4, restated in `n8n_Workflow_Specification_v1.md` Part 7) — a pure pass-through, no translation table.

**Where it needs to go:** This isn't a schema or contract change — it's a **build convention** that should be written into whichever document governs how Convocore agents actually get built. Two candidates:
- `Convocore_Adapter_Spec_v1.md` (already has this as a "recommendation, not yet binding," Part 4.2) — could simply be upgraded to a binding rule once confirmed
- A future Convocore-specific Build Card template / Build Execution Plan entry, once those are written

**Why it matters:** if Custom Tool Keys drift from Runtime Tool Names during actual agent-building (e.g. a builder names a tool `book_appointment` instead of `CreateAppointment` because it "reads more naturally" in Convocore's UI), the Adapter needs a translation table that doesn't otherwise need to exist — extra complexity, extra failure surface, avoidable entirely with a naming rule enforced at build time.

**Urgency:** Needed-before-production — not blocking today (no Tools have been built yet), but must be decided and written down **before** the first real Convocore Custom Tool is created, or the convention will already be broken by the time anyone notices.

---

## FINDING 5 — `human-handoff` integration depth is an unresolved business decision, not a technical gap

**What was found:** Convocore's `human-handoff` system tool (Ground Truth §6.3) can notify a human via email directly, entirely within Convocore, with zero touchpoint to Zenny's Runtime/Execution/Database layers. Whether that's sufficient, or whether a handoff should *also* write an `escalations` row (Database Structure v4 §4, owned by Core Agent per `Module Ownership`, Execution Architecture Part 14.7) is explicitly flagged as unresolved in Adapter Spec Part 8.1/Part 9 item 1.

**Where it needs to go:** This is a Runtime-level decision, not a database or contract change by itself — belongs as a Change Request against `Agent_Runtime_System_v1.md`'s Human Handoff Handler section (referenced in `n8n_Workflow_Specification_v1.md` Part 7.1's `NotifyHuman` Tool, "exclusive to Human Handoff Handler"). If the decision is "deep" (write to `escalations`), then `NotifyHuman`'s existing Entry Workflow (WF-{NNN}, wherever it's currently registered) needs to become callable not just from Voiceflow-side Runtime logic but also potentially triggered by a Convocore system-tool webhook that isn't a standard Custom Tool call — a different trigger shape than every other finding in this list.

**Why it matters:** if left undecided and Convocore ships with the "shallow" behavior by default (since that's what requires zero extra work), Zenny's escalation tracking/analytics will have a silent blind spot for every Convocore-originated handoff — a real business visibility gap, not just a technical nice-to-have.

**Urgency:** Needed-before-production — should be decided before the `human-handoff` tool is configured on any real client's Convocore agent, since changing behavior later means retroactively fixing however many clients already have the "shallow" version live.

---

## FINDING 6 — Shopify system tool sits outside the existing Credential Platform's model

**What was found:** Ground Truth §6.4 confirms Zenny will use Convocore's native `shopify` system tool with **the client's own** Shopify Client ID/Secret — not Zenny's own OAuth platform (which is the assumed model for every other provider in `Client_Integration_and_Credential_Platform_v1.md`, e.g. Google/Calendly/Slack all route through Zenny's own registered OAuth app, Part 8). This is flagged as a genuine open question in Adapter Spec Part 9 item 2, not resolved.

**Where it needs to go:** Either (a) a small addendum to `Client_Integration_and_Credential_Platform_v1.md` explicitly carving out Shopify's Convocore-native path as a deliberate, documented exception to the standard OAuth model, or (b) a confirmation that this is fine as-is because Shopify-via-Convocore is read-only product/order lookup (lower risk than a write-capable integration) and doesn't need to route through Zenny's credential platform at all.

**Why it matters:** right now this is neither explicitly allowed nor explicitly forbidden by the Credential Platform document — an ambiguity that should be closed with a real decision rather than left to whoever builds the first Shopify-enabled Convocore agent to improvise an answer.

**Urgency:** Needed-before-production, only for clients actually requesting Shopify integration (per Ground Truth §6.1's confirmed limited use case — not every client needs this).

---

## FINDING 7 — `runtime_module` has no native Convocore source — needs an explicit design decision

**What was found:** The Standard Request Contract requires a `runtime_module` field (`growth_agent`, `conversion_engine`, etc.) on every request. Convocore has no native equivalent. Adapter Spec Part 3.2/Part 9 item 3 flags two options: (a) Adapter infers it from a Tool→Module lookup table, or (b) Convocore node Instructions are explicitly told to set a Variable carrying the module, and the Adapter just reads it.

**Where it needs to go:** This is a real architectural choice with a principle already established that should decide it: `INTEGRATION_CONTRACT_v1.md` Part 17.3 / `n8n_Execution_Architecture_v1.md` Part 16.6 both state adapters "must never... implement Runtime logic." Inferring `runtime_module` from which Tool was called is arguably light business logic (deciding *which module owns this action* is a classification decision), which leans toward option (b) — but this hasn't been explicitly decided, only flagged.

**Where it needs to go, concretely:** `Convocore_Adapter_Spec_v1.md` Part 3.2/Part 9 should be updated with the actual decision once made — this doesn't require touching any *other* frozen document, since `runtime_module`'s definition itself isn't changing, only how the Convocore side populates it.

**Why it matters:** if left ambiguous, different builders might implement this differently across different Convocore agents/nodes, creating exactly the kind of drift the Tool Name registry (Finding 4) is designed to prevent.

**Urgency:** Blocking — needed before the first Convocore Custom Tool that maps to a real Runtime module can be correctly built, since every Standard Request Contract call requires this field.

---

## FINDING 8 — Voice-specific system tools (`forward-call`, `end-call`) likely need an explicit "out of Adapter scope" confirmation

**What was found:** Ground Truth §6.7 confirms these tools are pure Convocore-native actions (ending/forwarding a call) with no natural Standard Request Contract mapping — there's no "business result" to log. Adapter Spec Part 8.2 flags this as "likely out of scope" but not formally confirmed.

**Where it needs to go:** Small, low-effort addition — either a one-line confirmation added directly to `Convocore_Adapter_Spec_v1.md` Part 8.2 (upgrading "likely" to a decided fact), or explicitly left as a permanently-open item if there's a future scenario where call-ending should be logged (e.g. for call-duration analytics).

**Why it matters:** minor — mostly a documentation-completeness item, unlikely to cause a real build problem either way, but cheap to close out.

**Urgency:** Nice-to-have.

---

## FINDING 9 — Convocore's own confirmed platform bugs are operational risk, not architecture — need a tracking home

**What was found:** Two real, live-confirmed Convocore-side bugs surfaced during Ground Truth testing that directly affect production reliability if Convocore is the long-term Conversation Layer:
- `childrenNodes` wiring bug (bare ID-string array saves without validation error but crashes `interact_with_agent` at runtime) — confirmed via both MCP and direct REST testing, a genuine Convocore backend bug, not fixable on Zenny's side
- Conversation single-item lookup bug (`get_conversation`/`update_conversation`/etc. return "not found" on conversations that demonstrably exist per list endpoints) — same, confirmed backend bug

**Where it needs to go:** These aren't architecture findings — nothing in Zenny's own system needs to change because of them. But per the framing that Convocore may be the long-term Conversation Layer (not just a demo), these represent **known operational risk that should be tracked somewhere persistent**, not left buried in `Convocore_MCP_Reference_v1.md`'s test-log sections where they're easy to lose track of. Recommend: a short "Known Platform Risks" note added to `Convocore_Adapter_Spec_v1.md` itself (or a new lightweight tracking doc if this category grows), specifically flagging that:
  - Any Adapter logic that reads back a conversation by ID immediately after creating it (rather than relying on list endpoints or the webhook payload's own data) will hit the "not found" bug — the Adapter must be built to avoid this pattern entirely, not just be aware of it
  - Any Canvas flow with multi-node wiring should be validated by actually running a test conversation (per Ground Truth Part 8's decision: full connected-system testing happens during implementation, not as a pre-build gate) — specifically because the `childrenNodes` bug means a flow can *look* correctly wired in the dashboard and still crash at runtime

**Why it matters:** these are exactly the kind of thing that, if not written down somewhere a future builder will actually see, get silently re-discovered (expensively, in production) instead of designed around from day one.

**Urgency:** Blocking, specifically for the conversation-lookup-avoidance rule — this should shape how the Adapter is built, not be treated as a footnote. The `childrenNodes` risk is Needed-before-production (testing discipline, not a code change).

---

## FINDING 10 — `authentication` field's real strength needs an explicit call, not silent trust

**What was found:** Adapter Spec Part 7 already flags that Convocore's agent-secret-as-Bearer-token mechanism is "a genuinely useful, low-effort authentication signal" but explicitly **not sufficient alone** — the Adapter should also verify the resolved `client_id` matches, per the same discipline already required of Voiceflow's known-weak `x-webhook-secret` (Execution Architecture Part 16.3, flagged technical debt).

**Where it needs to go:** No new document needed — this is already correctly captured in `Convocore_Adapter_Spec_v1.md` Part 7. Listed here only to make sure it doesn't get *weakened* during actual Build Card writing (a common failure mode: a security caveat written carefully in a spec gets quietly dropped when someone's just trying to get a webhook working end-to-end fast).

**Why it matters:** repeats the existing Voiceflow technical debt pattern if not enforced — worth flagging explicitly rather than assuming it'll naturally carry through to implementation.

**Urgency:** Needed-before-production.

---

## Summary Table — All Findings by Urgency

| # | Finding | Urgency | Target Document |
|---|---|---|---|
| 2 | ADP-{NNN} ID + Part 17 registry entry | **Blocking** | n8n_Workflow_Specification_v1.md |
| 3 | `control.convocore_agent_map` table | **Blocking** | Database_Structure_v4_FINAL.md (via Template_Migration_Process.md) |
| 7 | `runtime_module` population decision | **Blocking** | Convocore_Adapter_Spec_v1.md |
| 9 | Conversation-lookup-avoidance build rule | **Blocking** | Convocore_Adapter_Spec_v1.md |
| 4 | Tool Key = Runtime Tool Name convention | Needed-before-production | Convocore_Adapter_Spec_v1.md |
| 5 | `human-handoff` integration depth decision | Needed-before-production | Agent_Runtime_System_v1.md (Change Request) |
| 6 | Shopify credential model exception | Needed-before-production | Client_Integration_and_Credential_Platform_v1.md |
| 9 | `childrenNodes` runtime-testing discipline | Needed-before-production | Convocore_Adapter_Spec_v1.md |
| 10 | Auth strength — don't silently weaken | Needed-before-production | (enforcement note only, no doc change) |
| 1 | Stale "prospective" status in 3 documents | Nice-to-have | n8n_Workflow_Specification_v1.md, INTEGRATION_CONTRACT_v1.md, n8n_Execution_Architecture_v1.md |
| 8 | Voice tools out-of-scope confirmation | Nice-to-have | Convocore_Adapter_Spec_v1.md |

---

## Recommended Next Action

The 4 **Blocking** items (2, 3, 7, 9) are the real gate before a Convocore Adapter Build Card can be written — everything else can proceed in parallel or slightly after. Suggest resolving these four first, as a single focused pass, since three of them (2, 7, 9) are pure decisions/documentation with no dependencies on each other, and the fourth (3) is a well-specified, low-risk schema addition following an already-proven pattern.

---

## Document Changelog
- **v1 (this version)** — first pass, cross-referencing Convocore_Canvas_Ground_Truth_v1.md and Convocore_Adapter_Spec_v1.md against the frozen n8n_Workflow_Specification_v1.md and its dependency chain (Integration Contract, Execution Architecture, Database Structure, Credential Platform, Runtime System). 10 findings identified: 4 Blocking, 5 Needed-before-production, 2 Nice-to-have (one item appears twice across categories — #9 has both a blocking and a production-readiness component).
