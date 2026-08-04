# Cross-Architecture Validation Report v1

```
Status:    DRAFT — resolves Architecture Breakthrough Report v1, Problem 5
Purpose:   Audit every frozen/completed document against every other one,
           checking that Tools, tables, utilities, and fields referenced in
           one document actually exist, match, and agree in every other.
           This is a validation pass, not a design document — it produces
           findings and Change Requests, it does not itself decide anything.
Position:  Final step before the paused Build Execution Plan resumes.
Method:    Each check below traces one specific claim across the full
           document chain against the live/frozen content actually found
           in project knowledge — not against memory or assumption.
Convocore note: per your instruction, Convocore-side work is proceeding on
           a separate thread. This report does not attempt to validate
           anything Convocore-dependent (convoId/origin storage, channel
           re-engagement rules) — those remain correctly flagged as
           deferred in their source documents, not re-litigated here.
```

---

# PART 1 — Scope & Method

## 1.1 What This Report Checks

Five checks, corresponding to the five questions the Breakthrough Report
itself posed under Problem 5:

1. Does every Runtime Tool have a Workflow?
2. Does every Workflow have Database ownership?
3. Does every response match the Integration Contract?
4. Does every external platform have an adapter/pattern?
5. Does every dependency actually exist where it's assumed to?

## 1.2 What This Report Does Not Do

- Does not re-decide anything already decided — findings point to the
  document that owns the decision, they don't relitigate it here.
- Does not touch Convocore-dependent items — deferred, per your
  instruction, to the separate thread.
- Does not fix anything itself — every finding below either confirms
  consistency or produces a named Change Request, to be actioned as its
  own small, scoped fix (per your framing: "not huge fix, just mark
  this").

## 1.3 Documents Checked

```
Agent Runtime System v1
Database Structure v4 FINAL / current_state.sql
n8n Execution Architecture v1 (frozen)
Integration Contract v1 (frozen)
n8n Workflow Specification v1 (frozen)
External Integration Strategy v1
Client Integration & Credential Platform v1
Provider App Setup & Developer Configuration Guide v1
Tool Naming Convention v1
Fallback Pattern Catalog v1
AI Builder Operating Manual v1
```

---

# PART 2 — Check 1: Does Every Runtime Tool Have a Workflow?

## 2.1 Method

Cross-referenced the Workflow Specification's 19-Tool registry (Part 7.6)
against the Tool Naming Convention's registry and the Integration
Contract's Part 4.2 table.

## 2.2 Finding: CONSISTENT

All 19 Tools appear identically across all three documents — same Tool
Name, same webhook ID, same owning module. No orphaned Tool (named in one
document, absent from another) found. `RecordConversion` appears correctly
in the Workflow Spec (Part 7.3/7.6) though it was not in the Integration
Contract's illustrative Part 4.2 table — that table was explicitly marked
"illustrative... not exhaustive" (Integration Contract Part 4.2's own
closing note), so this is not an inconsistency, it's the Workflow Spec
correctly being the more complete, later document.

## 2.3 Finding: Module Ownership Rules Consistent

The two hard rules (Growth Agent never calls an action tool directly;
`NotifyHuman` exclusive to Core Agent's Human Handoff Handler) are stated
identically in the Tool Naming Convention, the Integration Contract, and
the Workflow Specification. No drift found.

**Verdict: PASS. No Change Request needed.**

---

# PART 3 — Check 2: Does Every Workflow Have Database Ownership?

## 3.1 Method

Checked the Workflow Spec's Part 14.3 module→table ownership mapping
against Database Structure v4 FINAL's actual table list.

## 3.2 Finding: CONSISTENT, One Note

Module ownership (Growth Agent → Leads/Growth Events/Handoff Payloads;
Conversion Engine → Conversions; Recovery Engine → Recovery Queue/
Suppression; Core Agent → Complaints/Customers/Escalations; Email Manager →
Emails/Attachments/Draft Edit Log) matches the real tables found in
`Database_Structure_v4_FINAL.md` — `escalations`, `tool_call_log`, and the
6 archetype-specific `conversions` extensions all exist as described.

**Note, not a defect:** `tool_call_log` itself has no explicit module
"owner" in the Part 14.3 mapping — every module writes to it (it's the
shared Error Logger's target, UTIL-003). This is correct as designed, not
a gap — flagging only so a future reader doesn't mistake the absence for
an oversight.

**Verdict: PASS. No Change Request needed.**

---

# PART 4 — Check 3: Does Every Response Match the Integration Contract?

## 4.1 Method

Checked the Workflow Spec's per-Tool response schemas (Part 13) against
the Integration Contract's Standard Success Response shape (Part 8) and
Error Contract (Part 9).

## 4.2 Finding: CONSISTENT

Every Tool's `result` object in Part 13 is a plain, flat object as the
Contract's Part 8 requires — no Tool nests a second envelope or deviates
from the `success`/`status`/`correlation_id`/`result` shape.

## 4.3 Finding: `tool_call_state_enum` — Genuine Open Item, Correctly Flagged Already

The Workflow Spec (Part 13.2) and the Integration Contract (Part 9.4) both
correctly flag that `tool_call_state_enum`'s exact member values were not
verified against the live schema. Checking directly against
`Database_Structure_v4_FINAL.md` / `current_state.sql` now: the enum is
referenced (`state tool_call_state_enum NOT NULL` in `tool_call_log`) but
**its actual member list was not found in the schema excerpt available to
this validation pass** — meaning this remains a genuine open item, not
resolved by this report. Both source documents already flag it correctly;
no drift, but also no closure.

**Verdict: PASS on consistency; the underlying open item itself remains
open (correctly, not incorrectly) — flagged again in Part 8 below for
visibility, not because either document is wrong.**

---

# PART 5 — Check 4: Does Every External Platform Have an Adapter/Pattern?

## 5.1 Method

Checked that every external service named across the three new
integration documents (External Integration Strategy, Client Credential
Platform, Provider Setup Guide) is actually routed through the Capability
→ Router → Provider Branch pattern, with no Tool silently assuming a
single hardcoded provider.

## 5.2 Finding: CONSISTENT

Calendar (Google/Calendly/Cal.com), Email (Gmail), Ecommerce (Shopify/
WooCommerce), Notification (Email/Slack/Channel) — all correctly modeled
as `client_config`-driven, Router-branched, per External Integration
Strategy Part 5. No Tool payload schema in the Workflow Spec (Part 13)
hardcodes a provider name anywhere — confirmed by direct check of all 19
Tool payload/response blocks.

## 5.3 Finding: REAL GAP — `UTIL-006` Credential Resolver Not Yet Added to the Frozen Workflow Spec

**This is the most significant finding in this report.**

`Client_Integration_and_Credential_Platform_v1.md` Part 12, Change Request
1, explicitly states the Credential Resolver needs to become a formal
6th canonical utility (`UTIL-006`) in the Workflow Specification. Checking
the Workflow Spec's actual current content directly: **Part 6.10's Utility
ID Summary still lists only 5 utilities (UTIL-001 through UTIL-005) and
explicitly states "No further utilities are in v1 scope. A 6th canonical
utility requires architectural approval... before a UTIL-006 ID is
assigned."**

This means: the Change Request was correctly written and filed in the
Credential Platform document, but has not yet been actioned against the
Workflow Specification itself. As of this validation pass, **the frozen
Workflow Spec and the Credential Platform document disagree** — one says
"5 utilities, v1 scope closed," the other assumes a 6th exists.

**This is exactly the kind of small, mechanical, non-huge fix you
anticipated** — not a design problem, a bookkeeping one. The Credential
Resolver's full specification already exists in Client Integration &
Credential Platform v1 Part 6.2; this is a matter of formally registering
it in the Workflow Spec's Part 6 (with an ID, a Utility Ownership Matrix
row per Part 6.0.1, and updating Part 6.10's "5 utilities" closing
statement to 6), not redesigning anything.

**Verdict: FINDING — Change Request against `n8n_Workflow_Specification_v1.md`
Parts 6.0.1 and 6.10, formally registering UTIL-006.**

## 5.4 Finding: REAL GAP — `SCH-006` Token Refresh Sweep Not Yet Added

Same pattern as 5.3. Client Integration & Credential Platform v1 Part 12,
Change Request 2, states the Token Refresh Sweep needs a new `SCH-{NNN}`
entry in the Workflow Spec's Part 8 (Scheduled Workflows). Checking the
Workflow Spec's Part 8 directly: it lists SCH-001 through SCH-005 (Process
Recovery Queue, Stale Tool Call Sweep, Sync Inbox Trigger, Health Check,
Metrics Rollup) — no Token Refresh Sweep entry exists.

**Verdict: FINDING — Change Request against `n8n_Workflow_Specification_v1.md`
Part 8, adding SCH-006 (Token Refresh Sweep).**

---

# PART 6 — Check 5: Does Every Dependency Actually Exist?

## 6.1 Method

For each of the 6 new `client_config` fields named across the External
Integration Strategy and Client Credential Platform documents
(`calendar_provider`, `email_provider`, `ecommerce_provider`,
`notification_option`, `recovery_channel_policy`,
`emergency_booking_mode`), checked directly against the live
`current_state.sql` schema to confirm they genuinely don't exist yet
(rather than assuming the "does not exist today" notes in those documents
are still accurate).

## 6.2 Finding: CONFIRMED, All 6 Fields Genuinely Absent

Direct check of `control.client_config`'s real column list
(`current_state.sql`): `client_id, language_mode, language_list,
default_country_code, max_booking_horizon, send_window_start,
send_window_end, after_hours_emergency_contact,
reactivation_threshold_override, email_address, kb_email_file_id,
archetype_settings`. None of the 6 new fields are present. Every "does
not exist today" claim across both integration documents is accurate as
of this check — no drift, no field added elsewhere that would make those
notes stale.

**Verdict: PASS — the documents' own "not yet added" flags remain
accurate. Confirms, does not newly discover, the need for the eventual
migration (already correctly deferred pending Convocore, per your
instruction).**

## 6.3 Finding: New `control` Tables (`oauth_apps`, `client_connections`,
`oauth_state`, `connection_audit_log`) — Confirmed Genuinely New

Checked the real 8-table `control` schema list from `current_state.sql`
(`clients`, `client_active_modules`, `client_config`, `templates`,
`email_categories`, `recovery_cadence_profiles`, `agent_prompts`,
`sync_log`). None of the 4 tables the Credential Platform document
specifies (Part 4.2) exist yet — confirmed genuinely new, not a naming
collision with anything already live.

**Verdict: PASS — no collision found.**

## 6.4 Finding: `recovery_channel_policy` References `leads.source_channel`
— Confirmed To Actually Exist

External Integration Strategy Part 6.3 builds its Recovery channel logic
on `leads.source_channel` (`source_channel_enum`) as an existing,
already-live field. Checking `current_state.sql` directly for this
column: **confirmed present** — `leads` does carry a `source_channel`
column of that enum type. This dependency is real, not assumed.

**Verdict: PASS.**

## 6.5 Finding: Fallback Pattern Catalog vs. Tool Execution Fallback —
Correctly Distinct, No Collision

Checked that the Credential Platform's new "Tool Execution Fallback"
(Part 7) doesn't silently duplicate or contradict the existing Fallback
Pattern Catalog's A/B/C/D patterns. Confirmed: the Catalog's own "Usage"
section states its shorthand is descriptive of *existing* runtime
behavior and explicitly invites new situations to be handled by
consulting the relevant module rather than inventing a 5th letter without
updating the catalog. The Tool Execution Fallback correctly does not
invent a 5th letter — it operates one layer beneath the Catalog entirely
(provider-level technical failure vs. business-outcome failure), and
explicitly cites which existing Pattern (B for retry, D for terminal
escalation) it eventually feeds into. No overlap, no contradiction.

**Verdict: PASS.**

---

# PART 7 — Cross-Document Terminology Check

## 7.1 Method

Scanned for the same concept being given two different names across
documents — a common, easy-to-miss drift source.

## 7.2 Finding: CONSISTENT

`client_schema_name`, `correlation_id`, `contract_version`,
`idempotency_key` — all used identically, same casing, same meaning,
across every document checked. No synonym drift found (e.g., no document
calls it `tenant_schema` or `trace_id` instead).

**Verdict: PASS.**

---

# PART 8 — Consolidated Findings

## 8.1 Real Findings Requiring Action (Small, Not Huge — Per Your Framing)

| # | Finding | Document(s) Affected | Fix Size |
|---|---|---|---|
| 1 | `UTIL-006` Credential Resolver not registered | `n8n_Workflow_Specification_v1.md` Parts 6.0.1, 6.10 | Small — register existing spec, no redesign |
| 2 | `SCH-006` Token Refresh Sweep not registered | `n8n_Workflow_Specification_v1.md` Part 8 | Small — register existing spec, no redesign |

## 8.2 Confirmed-Still-Open Items (Not New, Not Fixed Here, Just Verified Still Accurate)

| # | Item | Status |
|---|---|---|
| 3 | `tool_call_state_enum`'s exact member values | Still genuinely unverified — both source documents already flag this correctly |
| 4 | 6 new `client_config` fields | Confirmed still absent — migration correctly deferred pending Convocore |
| 5 | 4 new `control` credential tables | Confirmed genuinely new, no collision — migration correctly deferred pending Convocore |
| 6 | `convoId`/`origin` storage design | Correctly deferred — Convocore thread, out of scope for this report |

## 8.3 What Passed Clean

- Tool inventory consistency (all 19 Tools, all 3 documents) — Part 2
- Module ownership rules — Part 2
- Database table ownership mapping — Part 3
- Response shape conformance to the Integration Contract — Part 4
- Provider-agnostic pattern applied with no hardcoded provider anywhere in
  any Tool payload — Part 5
- `leads.source_channel` dependency — Part 6
- Fallback Pattern Catalog / Tool Execution Fallback non-collision — Part 6
- Terminology consistency — Part 7

---

# PART 9 — Recommended Next Actions

Per your instruction ("not huge fix, just mark this") — these are not
proposed as urgent blockers, just named so they don't get lost:

1. **Small fix, whenever convenient before Build Cards for Calendar/Email/
   Notification/Recovery Tools begin:** add `UTIL-006` and `SCH-006` to
   the Workflow Specification's registries. The content to add already
   exists verbatim in Client Integration & Credential Platform v1 Parts
   6.2 and 6.1 — this is a copy-and-register action, not new design work.
2. **No action needed yet:** items 3–6 in Part 8.2 remain correctly
   deferred — nothing here changes their status, this report just
   confirms they haven't silently drifted or been forgotten.
3. **When the Convocore thread completes:** per your own note, expect
   small (not huge) Runtime + Database additions at that point — this
   report doesn't attempt to predict their shape, only confirms the
   current documents are in a clean, consistent state to receive them.

---

```
ZeroManual · Zenny AI Workforce · Cross-Architecture Validation Report v1
Resolves Architecture Breakthrough Report v1, Problem 5.
Checked against: Agent_Runtime_System_v1.md, Database_Structure_v4_FINAL.md,
current_state.sql, n8n_Execution_Architecture_v1.md, INTEGRATION_CONTRACT_v1.md,
n8n_Workflow_Specification_v1.md, External_Integration_Strategy_v1.md,
Client_Integration_and_Credential_Platform_v1.md, Provider_App_Setup_Guide_v1.md,
Tool_Naming_Convention.md, Fallback_Pattern_Catalog.md,
AI_Builder_Operating_Manual_v1.md. Convocore-dependent items deliberately
out of scope, per instruction — that work proceeds on a separate thread.
```
