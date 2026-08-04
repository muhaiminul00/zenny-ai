# Convocore Adapter Spec v1

```
Status:     DRAFT — resolves the Convocore-side flags left open in
            External_Integration_Strategy_v1.md (Part 1.3) and
            Client_Integration_and_Credential_Platform_v1.md (Part 9).
Purpose:    Define how Convocore fits into the existing, frozen 5-layer
            architecture as the Conversation Layer / Adapter — NOT a
            redesign of Runtime, Execution, or Database. This document
            answers "what does the Convocore Adapter actually translate,
            concretely" using the confirmed Canvas/Tools/Variables
            mechanics from live dashboard testing.
Position:   Sits beside the Voiceflow Adapter section of
            n8n_Execution_Architecture_v1.md Part 16.4 and
            INTEGRATION_CONTRACT_v1.md Part 17.4 — this document is the
            concrete fulfillment of what those sections marked
            "prospective."
Sources:    Convocore_Canvas_Ground_Truth_v1.md (live-verified Canvas/
            Tools/Variables mechanics — authoritative for anything Canvas-
            related), Convocore_Master_Reference_v3.md, Convocore_API_
            Reference_v1.md, INTEGRATION_CONTRACT_v1.md (frozen wire
            contract), Database_Structure_v4_FINAL.md (frozen schema),
            External_Integration_Strategy_v1.md, Client_Integration_and_
            Credential_Platform_v1.md.
Frozen documents this respects, does not redesign:
            Agent_Runtime_System_v1.md, Database_Structure_v4_FINAL.md,
            n8n_Execution_Architecture_v1.md, INTEGRATION_CONTRACT_v1.md.
```

---

## PART 1 — What This Document Is (and Is Not)

### 1.1 The actual question this answers

Not "how does Convocore relate to our whole system" — that's already answered: **Convocore is a Conversation Layer / Adapter candidate**, exactly like Voiceflow, sitting at the same architectural position (`n8n_Execution_Architecture_v1.md` Part 16.4, Part 5.2's Execution Core / Adapter Boundary split). The Runtime, Execution Layer, and Database do not change based on which conversation platform sits above them — that is the entire point of the adapter pattern already designed.

The real, narrower question: **given Convocore's actual mechanics (Canvas nodes, Tools, Variables, the Router LLM) — confirmed via direct live testing, not assumption — how does a Convocore Adapter translate between Convocore's native shapes and the already-frozen Standard Request/Response Contract (`INTEGRATION_CONTRACT_v1.md` Part 5, Part 8)?**

### 1.2 What this document does NOT decide

- Does not redesign Runtime, Execution Architecture, or Database Structure — all three remain frozen, unchanged
- Does not choose Convocore over Voiceflow, or vice versa — that decision sits elsewhere, outside this document's scope
- Does not specify exact n8n workflow nodes — per Execution Architecture's own Rule 11, concrete node-level configuration must be verified against live n8n docs/MCP at build time, not assumed here
- Does not re-litigate any Convocore Ground Truth decision (own-OAuth-platform, MCP-as-checklist-only, Canvas-as-standard-path) — those are settled, referenced as given

### 1.3 Relationship to existing documents

```
Agent Runtime System v1                    (unchanged — defines WHAT should happen)
        ↓
Database Structure v4 FINAL                (unchanged — defines WHAT is stored)
        ↓
n8n Execution Architecture v1               (unchanged — Part 16.4 named Convocore
        ↓                                    "prospective," Part 17.4 same in the
        ↓                                    Integration Contract)
Execution Layer Integration Contract v1     (unchanged — Part 5/8's Standard Request/
        ↓                                    Response Contract is platform-agnostic
        ↓                                    by design; this doc doesn't touch it)
Convocore Canvas Ground Truth v1            (unchanged — live-verified Convocore
        ↓                                    mechanics, authoritative source for
        ↓                                    "what Convocore actually does")
Convocore Adapter Spec v1                   ← THIS DOCUMENT (the missing piece:
                                               concretely wires the two together)
```

This document **resolves two explicit open flags**:
- `External_Integration_Strategy_v1.md` Part 1.3: *"Convocore-specific database fields (`conversation_id`, agent identifiers, etc.) — deferred per your explicit instruction; Convocore-side decisions are still finalizing."*
- `Client_Integration_and_Credential_Platform_v1.md` Part 9: *"`convoId` and `origin` storage... is not added by this document [because] Convocore-side decisions are still finalizing."*

Convocore-side decisions are now finalized (Convocore Canvas Ground Truth v1). This document is the resolution.

---

## PART 2 — Architectural Position (Confirmation, Not New Design)

### 2.1 Where Convocore sits

```
Customer
    │
    ▼
Conversation Layer (Convocore: Canvas flow, widget/channel delivery)
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

Matches `n8n_Execution_Architecture_v1.md` Part 16.4's already-specified shape exactly:
```
Customer → Convocore → Convocore Adapter → Runtime → Execution Layer
```

### 2.2 Adapter responsibilities — unchanged, restated for Convocore specifically

Per `INTEGRATION_CONTRACT_v1.md` Part 17.2/17.3 (applies identically to every adapter):

**May:** translate requests, normalize payloads, validate authentication, convert responses, handle platform-specific formatting.

**Must never:** execute business decisions, access databases directly, perform qualification, interpret customer psychology, implement Runtime logic.

**Concretely for Convocore, this means:** a Convocore Canvas node's Instructions may tell the LLM *when* to call a Tool (e.g. "when the user wants to book, call CreateAppointment") — but the actual qualification logic, freedom-level gating, and business decision of *whether* that booking should proceed lives in the Runtime, not in the Canvas prompt. Convocore's Tools (Ground Truth Part 6) are the mechanism by which the Adapter is invoked — they are not where business logic lives. This is the same discipline already enforced for Voiceflow; Canvas nodes are not a place to smuggle in Runtime logic just because Convocore makes it easy to write natural-language instructions.

### 2.3 What stays exactly the same regardless of adapter

Per Execution Core / Adapter Boundary (Part 5.2, unchanged): Core Agent, Growth Agent, Conversion Engine, Recovery Engine, Email Manager, Utilities, Dashboard — **none of these change** whether the adapter is Voiceflow or Convocore. This document does not touch any of them.

---

## PART 3 — Convocore → Standard Request Contract Mapping

### 3.1 The frozen contract (restated, not redefined)

`INTEGRATION_CONTRACT_v1.md` Part 5.1:
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

### 3.2 Where each field comes from, on the Convocore side

| Contract Field | Convocore Source | Confidence |
|---|---|---|
| `request_id` | Generated by the Adapter itself at translation time (not sourced from Convocore) | Certain — same as Voiceflow Adapter |
| `contract_version` | Fixed `"v1"`, hardcoded in the Adapter | Certain |
| `correlation_id` | Generated/owned by Runtime per Part 5.2's ownership rule (*"Ownership: Runtime always generates `correlation_id`. Downstream layers... echo it — they must never replace, regenerate, or override it"*) — the Adapter must NOT generate this itself, only pass it through on the response leg | Certain — binding rule, not a choice |
| `client_id` | Resolved by the Adapter from which Convocore **agent** received the message (each Zenny client = one Convocore agent, per Ground Truth's confirmed 1-agent-per-client build pattern) — requires a lookup table, see Part 5 | **Needs new mapping — Part 5** |
| `conversation_id` | Convocore's own `conversation_id` system variable (Ground Truth §7.5, confirmed) — auto-populated, read-only, always present on every turn | Certain — direct 1:1 mapping available |
| `runtime_module` | NOT directly available from Convocore — must be inferred by the Adapter from which **Tool** was called (see Part 4's Tool→Module mapping) or supplied explicitly via a Convocore Variable the node's Instructions are told to set | **Needs Adapter logic — Part 4** |
| `tool_name` | Convocore Custom Tool's `Key`/name field (Ground Truth §6.2) — this is the direct mapping point. The Custom Tool's Description tells the LLM when to call it; the Tool's Key must match (or map cleanly to) the Runtime's Tool Name registry (`INTEGRATION_CONTRACT_v1.md` Part 4) | Certain mechanism, needs 1:1 naming discipline — Part 4 |
| `timestamp` | Convocore's `timestamp` system variable (ISO 8601, confirmed Ground Truth §7.5) | Certain |
| `idempotency_key` | NOT natively provided by Convocore — must be constructed by the Adapter, following the same pattern already used elsewhere in this project (`INTEGRATION_CONTRACT_v1.md` Part 20.1 example: `"create-lead_{client_id}_{conversation_id}"`) | **Adapter constructs this — no Convocore source, expected** |
| `payload` | Built from the Custom Tool's **Variables** (Ground Truth §6.2, §7) — each Variable attached to the Tool becomes a payload field. This is the primary translation surface — see Part 5 | Certain mechanism — Part 5 details field-by-field mapping |
| `authentication` | The Custom Tool's Secret Key (Bearer token) — per Ground Truth §6.2's confirmed behavior, if left blank Convocore sends **the agent's own secret key** as the Bearer token automatically. This IS usable as a lightweight authentication signal the Adapter can verify against a known-agent-secret lookup, though it should not be the *only* auth check (see Part 7's security note) | Certain mechanism, one design decision needed — Part 7 |

### 3.3 Standard Response Contract — return path

Per `INTEGRATION_CONTRACT_v1.md` Part 8 (unchanged, restated for context): Success/Status, Correlation ID, Execution Timestamp, Business Result, Errors, Warnings.

**Convocore side:** the Adapter receives this standard response from the Execution Layer and must translate it into whatever the calling Custom Tool's webhook response is expected to look like. Per Ground Truth §6.2's confirmed guidance (*"We highly recommend providing a detailed human readable JSON response for the tool result so the AI can understand easier what to do next"*) — this is a **hard requirement for the Adapter's response translation**, not just good practice: a terse/ambiguous response measurably increases LLM hallucination on Convocore's side (confirmed in Ground Truth §6.2, sourced from Convocore's own UI guidance). The Adapter's job on the return leg is not just "pass the Business Result back" — it must format it as clear, natural-language-friendly JSON that the calling node's Instructions can reason about.

---

## PART 4 — Tool Name Registry Alignment

### 4.1 The existing registry

`INTEGRATION_CONTRACT_v1.md` Part 4 already defines a Tool Name registry (`CreateAppointment`, `CreateLead`, `NotifyHuman`, etc.) — illustrative of a real, already-decided set, with the complete inventory living in `n8n_Workflow_Specification_v1` (not yet written, per that document's own note).

### 4.2 Convocore-side constraint discovered during Ground Truth testing

Convocore Custom Tools use a **`Key`** field as the tool's identifier (Ground Truth §6.2) — this is what the LLM sees and reasons about when deciding to call a tool. **This Key should be set to the exact Runtime Tool Name** (`CreateAppointment`, not `book_appointment` or `bookAppt`) — a direct, disciplined 1:1 naming match, not a translation table with two different vocabularies to keep in sync.

**Recommendation, not yet a binding decision — flagged for your confirmation:** every Convocore Custom Tool's `Key` field should be created identical to its corresponding Runtime `tool_name` (per `Tool_Naming_Convention.md`'s verb vocabulary, already governing the Runtime-side registry). This means the Adapter's `tool_name` field mapping (Part 3.2) becomes a pure pass-through — Convocore's Tool Key IS the Runtime Tool Name, zero translation table needed. This is the simplest possible design and should be the default unless a real naming conflict is found during Tool build-out.

### 4.3 System Tools vs. Custom Tools — different Adapter treatment

Per Ground Truth Part 6.1's confirmed decision: Zenny uses `forward-call`, `end-call`, `human-handoff` (voice/handoff system tools) and `shopify` (client-configured) as Convocore **system tools** — everything else routes through **Custom Tools**.

- **System tools** (`forward-call`, `end-call`, `human-handoff`) generally do **not** need to round-trip through the Standard Request Contract at all — they're Convocore-native actions (ending a call, forwarding a call, notifying a human via Convocore's own email mechanism) that don't touch Zenny's Runtime/Execution/Database layers. **Exception: `human-handoff`'s outcome (a handoff occurred) likely SHOULD be logged into Runtime/Database** (ties to `escalations` table, Database Structure v4 §4) — this needs a decision: does the Convocore `human-handoff` tool's own email notification suffice, or does the Adapter also need to fire a corresponding Runtime `NotifyHuman`-equivalent call so the escalation is recorded in `control`/client schema data? **Flagged as an open decision, Part 9.**
- **`shopify` system tool** (client-configured, Ground Truth §6.1) — per Part 6.4's confirmed decision, Zenny does NOT use Convocore's native OAuth-based system tools generally, but Shopify is the one exception, using the **client's own** Shopify Client ID/Secret rather than Zenny's OAuth platform. This sits slightly outside the Client Integration & Credential Platform's model (which assumes Zenny's own OAuth app per provider) — **flagged as a genuine architectural question, Part 9**, not resolved by this document.
- **Custom Tools** (everything else — CreateAppointment, CreateLead, GetOrderStatus, etc.) — these are the primary Adapter surface, following the full Part 3 mapping.

---

## PART 5 — `client_id` Resolution (New Mapping Requirement)

### 5.1 The gap

Convocore has no native concept of Zenny's `client_id` (a Supabase `control.clients` UUID). Convocore's own identifiers are **`agentId`** (one Convocore agent = one Zenny client, per the established build pattern) and **`conversation_id`** (per-conversation).

### 5.2 Required new mapping table

A new lookup is needed — **not** a redesign of `control.clients`, an additive mapping alongside it:

```sql
-- Proposed, not yet built — follows the same control-schema,
-- service_role-only pattern as every other control table
-- (Database_Structure_v4_FINAL.md §9's security posture)

control.convocore_agent_map (
    client_id       uuid NOT NULL REFERENCES control.clients(client_id),
    convocore_agent_id   text NOT NULL,   -- Convocore's agentId
    convocore_region     text NOT NULL,   -- 'eu' | 'na' — per
                                           -- Convocore_API_Reference_v1.md
                                           -- §3's region-locked base URLs;
                                           -- the Adapter needs this to hit
                                           -- the correct regional endpoint
    created_at       timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT convocore_agent_map_unique_agent UNIQUE (convocore_agent_id)
)
```

**Why `convocore_region` matters here specifically:** confirmed in Convocore_API_Reference_v1.md §3 — EU and NA are genuinely separate base URLs (`eu-gcp-api.vg-stuff.com` vs `na-gcp-api.vg-stuff.com`), and Ground Truth §4.3 confirmed at least one model behaves differently by region (Grok 4.5 NA-only, silent reroute on EU). If Zenny ever has clients on both regions, the Adapter needs to know which regional API to call for anything beyond the inbound webhook itself (e.g. if the Adapter or a scheduled job ever needs to call Convocore's REST API back, per Part 6).

**This table's addition:** follows `Template_Migration_Process.md`'s existing, established manual migration procedure (Database_Architecture_Decisions_History.md's already-proven pattern) — not a new process, just one more table added the same way `oauth_apps`/`client_connections` etc. are already specified to be added (`Client_Integration_and_Credential_Platform_v1.md` Part 12, item 4).

### 5.3 How the Adapter uses this mapping

```
Convocore webhook fires (Custom Tool call)
    → Adapter receives Convocore's agentId
    → Adapter queries control.convocore_agent_map WHERE convocore_agent_id = {received agentId}
    → Adapter resolves client_id
    → Adapter proceeds to build the Standard Request Contract (Part 3) with the resolved client_id
```

This is the **first, mandatory step** of every Convocore Adapter request — matches the existing Schema Resolution pattern already established for the Execution Layer generally (`Receive Request → Resolve Client → Resolve Schema → Verify Access → Execute Query`, `n8n_Execution_Architecture_v1.md` Part 14.3) — the Adapter performs an equivalent client-resolution step before the request ever reaches that existing pipeline.

---

## PART 6 — Variables → Payload Field Mapping

### 6.1 The mechanism (confirmed, Ground Truth §7)

A Convocore Custom Tool's parameters are Variables attached to that Tool (Ground Truth §6.2, §7.2's "Select variables"/"Add variable"). Each Variable has a `Key`, `Type` (String/Number/Boolean), and `Description`.

### 6.2 Direct mapping to `payload`

```
Convocore Tool's attached Variables  →  Standard Request Contract's `payload` object
```

Each Variable's `Key` becomes a `payload` field name; its captured value (per Ground Truth §7.4's confirmed capture mechanism — explicit node-prompt instruction required, `set_variable` used internally) becomes that field's value.

**Naming discipline required (new recommendation, not yet built):** Variable Keys attached to a given Custom Tool should match the field names the Execution Layer's corresponding workflow actually expects — this is the same "avoid a second translation table" principle as Part 4.2's Tool Key recommendation. E.g., if `CreateAppointment`'s workflow (once `n8n_Workflow_Specification_v1` is written) expects a payload field `preferred_datetime`, the Convocore Variable attached to that Tool should be Keyed `preferred_datetime`, not `appointment_time` or `when`.

### 6.3 System Variables — a different category, mostly not payload-bound

Per Ground Truth §7.5, Convocore's system variables (`conversation_id`, `user_name`, `user_email`, `phone_number`, `channel`, `agent_id`, etc.) are **read-only and auto-populated** — these largely map to the Contract's top-level fields (Part 3.2), not into `payload`. Exception: if a specific Tool's workflow genuinely needs, say, `channel` as a business-logic input (e.g. Recovery Engine's channel-specific re-engagement logic, referenced in `External_Integration_Strategy_v1.md` Part 6.3 and flagged there as depending on which channels Convocore ultimately supports) — that system variable can additionally be included in `payload` as a normal field, sourced the same way.

### 6.4 ENV Variables — explicitly NOT part of this mapping

Per Ground Truth §7.2's confirmed finding, ENV-type variables are **deliberately hidden from the LLM** and used for secrets in tool authentication. These do not appear in conversational payload construction at all — they're an Adapter-side/Convocore-side authentication concern (Part 7), never a business-data field.

---

## PART 7 — Authentication (Convocore → Adapter direction)

### 7.1 What Convocore provides

Per Ground Truth §6.2's confirmed behavior: a Custom Tool's Secret Key field, if left blank, causes Convocore to send **the agent's own secret key** as the Bearer token on every call to that Tool's webhook.

### 7.2 How the Adapter should use this

This is a genuinely useful, low-effort authentication signal: since `control.convocore_agent_map` (Part 5.2) already stores each `convocore_agent_id`, and each Convocore agent has its own unique secret key (confirmed — `Convocore_API_Reference_v1.md` §2's Agent Secret concept), the Adapter can:

1. Receive the Bearer token on an inbound webhook call
2. Look up which agent that secret belongs to (requires storing each agent's secret alongside its mapping — **extends Part 5.2's table**, see below)
3. Confirm the resolved `client_id` (Part 5.3) matches the agent that the secret authenticates — a real security check, not just a lookup convenience

**Extends the Part 5.2 mapping table:**
```sql
control.convocore_agent_map (
    client_id             uuid NOT NULL REFERENCES control.clients(client_id),
    convocore_agent_id         text NOT NULL,
    convocore_agent_secret_id     uuid NOT NULL,  -- references a Vault
                                                  -- secret (same pattern as
                                                  -- Client_Integration_and_
                                                  -- Credential_Platform_v1.md
                                                  -- Part 4.4 — never
                                                  -- plaintext)
    convocore_region       text NOT NULL,
    created_at             timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT convocore_agent_map_unique_agent UNIQUE (convocore_agent_id)
)
```

⚠️ **This is a design recommendation, not a security guarantee by itself** — an agent secret being present confirms the call came from *a* legitimate Convocore agent context, but per `INTEGRATION_CONTRACT_v1.md` Part 18's existing security requirements ("every request authenticated," "no cross-client data access under any circumstance"), the Adapter should still perform its own explicit `client_id`-match verification (step 3 above) rather than trusting the secret alone as sufficient isolation — same discipline already required of the static `x-webhook-secret` used for Voiceflow (flagged as known technical debt, Execution Architecture Part 16.3, Part 18).

---

## PART 8 — `human-handoff` and Live Voice — Special Cases

### 8.1 `human-handoff` (Convocore system tool)

Per Ground Truth §6.3: built-in variables `team_key`, `issue_summary`; supports direct email notification to configured addresses, works across all channels including voice.

**Two possible integration depths — flagged for decision, not resolved here:**
- **Shallow:** Convocore's own email notification is sufficient; the Adapter does nothing extra. Simplest, but means Zenny's Database (`escalations` table, Database Structure v4 §4) never learns a handoff occurred — no analytics, no Recovery Engine awareness, no cross-channel visibility.
- **Deep:** The Adapter also treats `human-handoff` invocations as a Standard Request Contract call (mapping `team_key`→ some routing field, `issue_summary`→ escalation reason), writing a real `escalations` row. Matches the existing Module Ownership principle (`Core Agent → Complaints, Customers, Escalations`, Execution Architecture Part 14.7) — but requires the Convocore Adapter to fire on a system tool, not just Custom Tools, which is a slightly different trigger mechanism than Part 3–6 assume.

**Recommendation:** Deep integration, for consistency with how every other significant conversational event is already tracked — but this is a real scope decision, not a detail, and should be confirmed before build.

### 8.2 Voice-specific tools (`forward-call`, `end-call`)

Per Ground Truth §6.7: zero configuration, pure prompt-driven, no natural mapping to the Standard Request Contract (there's no "business result" to a call ending). **These likely stay outside the Adapter's translation responsibility entirely** — Convocore-native actions with no Runtime/Database touchpoint. Flagged for confirmation, not assumed silently.

---

## PART 9 — Open Decisions (Genuinely Unresolved — Do Not Guess Past These)

1. **`human-handoff` integration depth** (Part 8.1) — shallow (Convocore-only) vs. deep (also writes to `escalations`)? Affects whether the Adapter needs a second trigger path beyond Custom Tools.
2. **Shopify system tool's credential model** (Part 4.3) — uses the *client's own* Shopify credentials, not Zenny's OAuth platform, which sits outside `Client_Integration_and_Credential_Platform_v1.md`'s assumed model (Zenny's own registered app per provider). Does this need its own small addendum to that document, or is it a deliberate, acceptable exception since Shopify data flows differently (read-only product/order lookup, not a write-capable business action)?
3. **`runtime_module` inference** (Part 3.2) — should this be inferred by the Adapter from a Tool→Module lookup table (simple, but adds a translation layer), or should Convocore node Instructions be told to explicitly set a Variable carrying the intended module (keeps the Adapter dumber/thinner, per Part 2.2's "must never implement Runtime logic" — arguably inferring module from tool name IS a form of light business logic worth avoiding)?
4. **Voice call events** (Part 8.2) — confirmed likely out of scope, but not yet formally decided as such.
5. **`control.convocore_agent_map` table** — specified in this document (Part 5.2, Part 7.2) but, per this project's own established discipline, **not created by this document** — goes through `Template_Migration_Process.md` same as every other schema addition, only after this Adapter Spec itself is reviewed/approved.

---

## PART 10 — Voice (New Scope — Not Previously Covered)

> ⚠️ **Confidence level, stated plainly:** everything in this Part is sourced from Convocore's own published documentation (Master Reference §18, Ground Truth Part 18's predecessor material) — **none of it has been live-verified** the way Canvas/Tools/Variables were in Ground Truth v1. This section identifies what's needed and what's unknown; it does not claim the same authority as Parts 1-10. Live verification should happen before any Voice build work starts, same discipline as everything else in this project.
>
> **Why this is now in scope:** `External_Integration_Strategy_v1.md` Part 8 explicitly deferred "Voice / Telephony (Twilio) — architecture not yet designed." This Part resolves that deferral's *design* question — the live-verification work is a separate, still-pending step (see Part 10.7).

### 10.1 What Voice adds to the Adapter's job

Everything in Parts 3-7 (Standard Request Contract mapping, Tool Name Registry, `client_id` resolution, Variables→payload, authentication) applies **identically** to voice-originated Tool calls — a Custom Tool called from a voice conversation goes through the exact same translation path as one called from a text conversation. Voice does not require a parallel contract.

**What voice actually adds, specifically:**
1. A new **conversation origination path** (phone call, not widget/chat) — relevant to the WebSocket-origination rule (Part 8/Finding #9's corrected rule) — needs confirming that phone-originated conversations behave like other real (non-REST-created) conversations for lookup purposes, not assumed
2. New **system variables** specific to voice (`phone_number` already confirmed in Ground Truth §7.5; likely others — see 10.4)
3. New **cost dimension** (per-minute charges, separate from per-interaction/per-token costs already documented)
4. Two **voice-specific system tools** already covered in Ground Truth §6.7 (`forward-call`, `end-call`) — confirmed out-of-Adapter-scope in Part 8.2, unchanged by this Part
5. A **client-provisioning requirement** — voice needs a real phone number, which is a setup step with its own fields/decisions, not just a config toggle

### 10.2 Required client-side setup (per Master Reference §18.4, documentation-sourced)

For any client using Convocore's voice agent, the following must be provisioned before voice can work at all:

| Requirement | Source | Notes |
|---|---|---|
| A Twilio number (purchased via Convocore, or the client's own imported number) | Master Reference §18.4 | Two paths exist — Convocore-purchased vs. client's own Twilio account imported. **Which path Zenny uses per client is an open decision, not yet made — see 10.6.** |
| That number assigned to the specific Convocore agent | Master Reference §18.4 | One assignment step, straightforward per docs |
| Twilio Account SID + Auth Token (if importing an existing number) | Master Reference §18.4 | Only needed for the import path, not the purchase path |

### 10.3 Voice configuration fields (documentation-sourced, per agent)

These exist on the Convocore side and would need to be set per client agent — **not yet confirmed whether Zenny will expose any of these as client-configurable, or fix them as a standard template across all voice-enabled agents.** That's itself an open question (10.6).

**Transcriber (Speech-to-Text) — Master Reference §18.1:**
- Provider (Deepgram, AssemblyAI, Gladia)
- Model ID
- Language (2-char code)
- Utterance Threshold (150-500ms recommended range)
- Input Voice Enhancer (on/off)

**Speech Generation (Text-to-Speech) — Master Reference §18.2:**
- Provider (ElevenLabs primary)
- Voice ID selection
- Background Noise simulation (Restaurant/Office/Quiet)
- Punctuation Breaks

**Advanced/Call Behavior — Master Reference §18.3:**
- Enable Web Calling (on/off)
- Record Calls (on/off) — ⚠️ **enabling this makes the agent NOT HIPAA compliant**, confirmed in docs, worth flagging to any client who might care about this
- Router Backchanneling (filler phrases during routing decisions)
- Server URL + Server URL Secret (webhook for live call events — this is itself a potential Adapter integration point, see 10.5)

### 10.4 System variables likely relevant to voice (partially confirmed, partially inferred)

Confirmed already in Ground Truth §7.5 (core system variables, apply to voice same as text): `phone_number`, `channel` (would read as `"voice"` or similar for voice conversations — exact value not confirmed), `conversation_id`, `timestamp`, `agent_id`, `agent_name`.

**Not yet confirmed, worth checking during live verification:** does a voice conversation populate any voice-specific system variables beyond `phone_number` (e.g. call duration, call direction inbound/outbound, Twilio Call SID)? Master Reference's documentation doesn't list any beyond what's already captured — this needs a real test call to confirm, not an assumption either way.

### 10.5 Server URL webhook — a second possible Adapter integration point

Master Reference §18.3 documents a **Server URL + Server URL Secret** field specifically for "live call event POSTs." This is architecturally interesting and worth flagging clearly: **this may be a second, parallel webhook mechanism separate from Custom Tools**, specifically for call lifecycle events (call started, call ended, etc.) rather than conversational Tool calls.

**Open question, not yet investigated at all:** does this webhook fire the same Standard Request Contract shape as a Custom Tool call, or does it have its own distinct payload shape that would need its own translation logic in the Adapter? This is a real unknown, not just an open decision — needs actual investigation (check docs, or live-test) before assuming either way.

### 10.6 Open Decisions — Voice (parallel to Part 9's text-side list)

1. **Twilio number provisioning model** — does Zenny purchase/manage numbers centrally through one Convocore workspace (simpler, but means all clients' calls route through shared infrastructure), or does each client bring/connect their own Twilio account (per Ground Truth's confirmed model — client provides their own Twilio number, consistent with how SMS is already scoped)? Ground Truth §6.7 implies the latter ("client provides their own Twilio number") but this was stated in the Tools context, not confirmed as the definitive provisioning model for the whole voice feature.
2. **Voice configuration — templated vs. per-client customizable?** Transcriber/Speech-Gen/Advanced settings (10.3) could be a fixed Zenny-standard template applied to every voice agent, or exposed as client-configurable options. Not decided.
3. **Record Calls — default policy?** Given the HIPAA-compliance tradeoff, does Zenny default this OFF across all clients (safer default), or leave it as a per-client opt-in decision? Needs a real policy decision, not a technical default.
4. **Server URL webhook (10.5)** — is this something the Convocore Adapter should actually implement (giving Zenny real-time call lifecycle visibility), or left unconfigured/unused? If implemented, its payload shape needs investigation first (10.5’s open question).
5. **Cost tracking** — voice is confirmed to bill per-minute (Master Reference §18.4/§15.6), separately from the per-interaction/token costs already tracked for text. Does Zenny's own usage/billing tracking (wherever that lives in the Database/Runtime) need a voice-specific cost dimension added, or is this purely a Convocore-side cost Zenny doesn't need to mirror internally? Not yet discussed anywhere in this project.
6. **`forward-call` destination numbers** — Ground Truth §6.7 confirms this tool exists and works purely via prompt instruction, but doesn't address *where* the forwarded number comes from per client (a fixed number in the prompt? A Variable? Client-configurable?). Needs a real design decision if voice-based human handoff via call-forwarding is actually going to be used.

### 10.7 Required Before Build: Live Verification Pass

Per this whole project's established discipline (documentation is a starting point, not a substitute for live testing), **Voice needs its own Ground-Truth-style live verification pass before any of the above is trusted for building** — same treatment Canvas/Tools/Variables already received. Specifically worth testing live, not assumed from docs:
- Does a real Twilio-originated call create a conversation record that behaves like other real (non-REST-created) conversations — i.e., is it safe for later lookup per the corrected Finding #9 rule?
- What does the Server URL webhook (10.5) actually send, if configured?
- Does `channel` system variable read as expected on a real voice conversation?
- Real per-minute cost, confirmed against an actual test call, cross-checked against the documented formula (Master Reference §15.6)

---

## PART 11 — What This Document Confirms Does NOT Need to Change

Directly answers your original step 3 ("our existing database update requirement for Convocore usage") — the honest answer, per everything reviewed:

- **No redesign of `control.clients`, `client_config`, `templates`, or any of the 21 common / 6 archetype-specific tables** — Convocore is a Conversation Layer concern, these tables are Business Data Layer concerns, and the architecture's own layering already prevents one from requiring changes to the other (`Database_Architecture_Review___Future_Runtime_Roadmap_v1.md`'s deferred-layers analysis already concluded this generally; this document confirms it specifically for Convocore, not just in principle)
- **No change to `INTEGRATION_CONTRACT_v1.md`'s Standard Request/Response Contract shape** — it was built platform-agnostic from the start (Part 15.9's explicit design goal), and Convocore's mechanics map onto it without needing new top-level fields
- **The only net-new schema requirement confirmed so far is `control.convocore_agent_map`** (Part 5.2/7.2) — one small, additive table, following the exact same pattern already used for `oauth_apps`/`client_connections` (`Client_Integration_and_Credential_Platform_v1.md` Part 4.2) — not a redesign, an extension

⚠️ **This verdict covers text/Canvas only.** Part 10 (Voice) introduces its own open questions — most notably the Twilio number provisioning model (10.6 item 1) — that could require additional schema (e.g. tracking which phone number belongs to which client, if numbers are managed per-client rather than templated) once those decisions are actually made. This document does not yet claim Voice requires zero schema changes — that verdict is pending Part 10.6/10.7's open items being resolved.

This confirms the Database Architecture Review's own verdict (*"No database redesign is recommended... The database should be treated as stable for the current phase"*) held true even once Convocore's real, live-tested mechanics were factored in — not just in the abstract "adapters are thin" argument, but concretely, field by field.

---

## Document Changelog
- **v1** — first draft. Resolves the Convocore-side flags left open in External_Integration_Strategy_v1.md Part 1.3 and Client_Integration_and_Credential_Platform_v1.md Part 9. Maps confirmed Convocore Canvas/Tools/Variables mechanics (Convocore_Canvas_Ground_Truth_v1.md) onto the frozen Standard Request/Response Contract (INTEGRATION_CONTRACT_v1.md Part 5/8). Identifies exactly one net-new database table (`control.convocore_agent_map`) and five genuinely open decisions (Part 9) requiring explicit resolution before build — everything else in the existing frozen architecture requires no change.
- **v1.1 (this version)** — added Part 10 (Voice), resolving the deliberate deferral in `External_Integration_Strategy_v1.md` Part 8 ("Voice / Telephony — architecture not yet designed"). ⚠️ Unlike Parts 1-9/11, Part 10 is sourced entirely from Convocore's published documentation, not live-verified — flagged explicitly within the section itself. Identifies 6 new open decisions specific to voice (Twilio provisioning model, config templating, Record Calls default policy, the Server URL webhook's unknown payload shape, cost-tracking scope, forward-call destination handling) and confirms a dedicated live-verification pass is required before voice can be trusted for building, matching the rigor already applied to Canvas/Tools/Variables. Old Part 10 renumbered to Part 11; its "no schema changes needed" verdict caveated to explicitly exclude Voice pending Part 10's open items.
