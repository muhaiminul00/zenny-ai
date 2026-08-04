# Version Control & KPI Framework

```
Project:   Zeny Ai - Voiceflow
Document:  Version_Control_and_KPI_Framework.md v1.0
Layer:     00_Project_Control — operations, not runtime behavior
```

---

## What This Is

Adapted from the original Modular architecture's operations framework
(`01_Strategy/Modular_Legacy/CS_AI_Agent_PreBuild_Guide_Modular.md`,
Steps 12–13). The Stable/Beta discipline, promotion gate, and rollback
procedure are sound operational practice independent of the underlying
behavior architecture and are preserved largely as-is — Modular's
"add-on" becomes "module/archetype configuration." The 3-level KPI
framework's middle tier is adapted from "add-on-level" to "module-level
and archetype-level" to match the current system's structure.

---

## Version Tracks

Maintain two tracks for every module and archetype configuration in the
system: **Stable** and **Beta**. Stable is deployed to all active
clients. Beta is deployed to new clients and opt-in test clients. All
changes go to Beta first — never push a change directly to Stable. This
is the rule that prevents simultaneous breakages across multiple
clients, and it is genuinely architecture-agnostic: it held for
Modular's add-ons and holds identically for a change to, say,
Appointment's Decision Tree or Recovery Engine's cadence logic.

**Promotion criteria, Beta → Stable:** the Beta version must run a
minimum of 14 days with zero critical issues — defined as a broken
Decision Tree branch, an incorrect tool-call result (Step 1D.3 FAILED
state reaching the customer as if it were SUCCESS), or an escalation
rate spike above baseline for the affected archetype/module. After
passing, promote to Stable; all active clients on that archetype/module
receive the update at the next scheduled maintenance window.

**Breaking vs. non-breaking classification** — decide before writing a
single line of change:
- **Non-breaking:** adding a new intent-trigger phrase to Step 1B's
  classification training, improving response wording, fixing a KB
  content error, adjusting a message template's tone. Safe to
  auto-update all clients.
- **Breaking:** changing a tool's interface (see
  `Tool_Naming_Convention.md`'s `-v2` rule), adding a required Tier 2/3
  field, restructuring an archetype's Decision Tree or Conversion
  State Machine transitions, changing a freedom-level default, changing
  a Recovery Engine cadence profile. Requires per-client UAT (per
  `Client_Onboarding_Guide.md`'s UAT Checklist, re-run against the
  specific change) before updating.
- Always err toward classifying as breaking when in doubt — this
  matches the runtime document's own conservative-default discipline
  (CLAUDE.md Rule 2: missing/ambiguous config resolves toward the
  restrictive path, never assumed permission).

**Rollback procedure.** Archive every published version of every
module/archetype configuration. If a Stable update causes a production
issue, rollback to the previous version must be possible in under 30
minutes. Keep at minimum the last two Stable versions archived at all
times. Write and test the rollback procedure before the client count
makes an untested rollback too risky to attempt live.

**Change log.** Record, per module/archetype configuration: what
changed, breaking/non-breaking classification, date promoted to Stable,
and any client-specific notes. This is what lets an account manager
proactively explain a behavior change to a client, instead of the
client discovering it mid-conversation and filing a support ticket
about your own update.

---

## 3-Level KPI Framework

### Client-Level KPIs

Preserved from Modular, unchanged in substance:
- **Resolution rate** — percentage of sessions fully resolved by the
  agent with no human needed.
- **CSAT score** — post-session survey, 1–5 scale.
- **Escalation rate** — percentage of sessions reaching Module 1D's
  Human Handoff Handler.
- **First response time** — for any recognized intent.

### Module & Archetype-Level KPIs (replaces Modular's "add-on-level")

- **Usage frequency per module** (Core / Growth / Conversion / Recovery
  / Email) **and per archetype** — informs which archetype/module
  combinations need the most build and QA attention going forward.
- **Success rate per archetype's Decision Tree branches** — a low rate
  on a specific branch (e.g., Commerce Ecom's out-of-stock handling
  branch, or Appointment's Availability Conflict Handling) signals a
  gap the same way a low add-on success rate did in Modular, but mapped
  onto the current system's actual Decision Tree structure (Step 4,
  each archetype's §5) instead of a flat add-on list.
- **Escalation rate per Escalation Priority tier** (Module 1D's P1
  Immediate / P2 Standard / P3 Review) — new metric, did not exist in
  Modular's framework at all, made possible by the current system's
  Escalation Priority Classification. A P1 rate climbing for a given
  archetype is a materially different signal than a P3 rate climbing —
  this framework can now distinguish them.
- **Availability Validation fallback rate** (Module 3 §2.1) — how often
  a Mode A action falls to Mode B/C due to a failed availability check,
  per archetype. High fallback rate signals either an integration gap
  (calendar/inventory sync issue) or a genuinely under-resourced
  business, both worth knowing separately from a generic "success rate."

### Product-Level KPIs

- **Time to deploy a new client** — tracks onboarding playbook maturity,
  per `Client_Onboarding_Guide.md`'s sequence.
- **Archetype/module reuse rate** (replaces Modular's "add-on reuse
  rate") — how many clients use each archetype/sub-variant and module
  combination; a high reuse rate on, say, Commerce's two sub-variants
  validates that the archetype-level abstraction is capturing real
  shared structure, the same signal add-on reuse gave Modular, mapped to
  the current system's actual unit of reuse.
- **Stress Test Library coverage rate** — percentage of a new client's
  UAT run (`Client_Onboarding_Guide.md`'s UAT Checklist) that passes
  against existing `Stress_Test_Library_v1.md` test IDs without a
  client-specific workaround, versus requiring one. Replaces Modular's
  "library coverage rate" (percentage of intents served by existing
  add-ons); this is the same underlying question — how much of a new
  client's needs are already covered by what exists — asked against the
  current system's actual test structure instead of an add-on backlog.

---

## Measurement Infrastructure

After every conversation, write: session outcome (per Step 1G's 5 End
States), module(s)/archetype involved, Escalation Priority tier if
escalated (P1/P2/P3), CSAT score if collected, and session duration — to
the analytics store defined in the Integration Contract. Review
module/archetype-level failure rates weekly. Review product-level KPIs
monthly. Set baselines before a given archetype's first client goes
live, and revisit targets as each archetype accumulates enough live
sessions to be statistically meaningful — a freshly-launched archetype's
early numbers are a sample-size problem, not necessarily a
quality signal.

---

```
ZeroManual · Zenny AI Workforce · Version_Control_and_KPI_Framework.md v1.0
Extracted and rebuilt from the Modular architecture's Stable/Beta tracks,
promotion gate, rollback procedure, and 3-level KPI framework
(01_Strategy/Modular_Legacy/CS_AI_Agent_PreBuild_Guide_Modular.md, Steps
12–13), against current Archetype/Runtime terminology and structure.
```
