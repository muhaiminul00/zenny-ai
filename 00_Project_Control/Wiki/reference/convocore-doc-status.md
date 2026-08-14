# Convocore Doc Set — Status Map

Catalogue of every doc in `05_Platform_Builds/Convocore/` (current folder,
not `Archieve/`), so a future session doesn't have to rediscover which
ones are worth reading. Each doc also carries a `DOC PREFERENCE` line
near its top pointing back here. Written during BC-057b (2026-08-14).

## Primary — read these first for a real agent build
- `Convocore_Agent_Build_Order_Guide_v2.md` — sequencing/placement guide,
  what to configure in what order, where to source real content from.
- `Convocore_Canvas_Ground_Truth_FINAL.md` — authoritative mechanics
  reference (Canvas/Nodes/Advanced Settings/Tools/Variables), live-
  verified via direct dashboard testing.
- `Convocore_Adapter_Spec_FINAL.md` — single entry point for how Zenny's
  Runtime/Execution/Database relate to Convocore.
- `Convocore_Findings_Required_Updates_FINAL.md` — errata/addendum to
  the 3 docs above; read alongside them.

## Technical backing — consult for exact field/endpoint detail
- `Convocore_API_Reference_v1.md` — REST/WebSocket contract, derived
  from `convocore_llms-full.txt` + live tests.
- `Convocore_MCP_Reference_v1.md` — what the Convocore MCP server adds
  or changes versus the dashboard/REST API.

## Background evidence — real but not build guides
- `Convocore_REST_Live_Test_v1.md` — dated (2026-07-27) raw-HTTP live
  tests isolating whether specific bugs are MCP-specific or backend
  bugs. Useful when a REST/MCP discrepancy needs its original evidence.

## Optional / secondary
- `Convocore_Master_Reference_v3.md` — simplified conceptual version of
  `convocore_llms-full.txt`. Not required; the 3 primary docs above are
  more authoritative (live-verified, not just conceptual).

## Superseded / raw source — do not build from these
- `convocore_customer_support_agent_guide.md` — the first, premature
  Convocore doc, written before this project's own live-tested
  reference set existed. Historical only.
- `convocore_llms-full.txt` — Convocore's own raw documentation scrape,
  uncurated. Already distilled into the two technical-backing docs
  above; consult only to trace a claim back to Convocore's own wording.

## Live reachability status (BC-057b, 2026-08-14)

Re-checked whether the 2026-08-04 billing block (`403 "API access
requires the Business plan or higher"`) still applies, via the smallest
possible calls on both paths — no agent creation attempted:

- **REST:** `GET https://na-gcp-api.vg-stuff.com/v3/agents` with the
  real workspace secret → **still `403 FORBIDDEN`**, identical message
  to the 2026-08-04 finding.
- **MCP:** `list_agents` (limit 3) via the Convocore MCP tools →
  **still `403 FORBIDDEN`**, same underlying error surfaced through the
  MCP wrapper (`endpoint: /agents?limit=3`, same message/code). Confirms
  this is the same account-level block, not an MCP-specific issue and
  not something that improved since 2026-08-04.

**Not a build blocker** — per human decision, a 3rd path (manual build
directly in the Convocore Canvas UI) remains available regardless of
API/MCP access, and is the fallback build method for the demo-business
Convocore agent (Path B) until/unless a real client's own Convocore
package resolves the plan-tier gap. See `PROJECT_STATE.md` Active
Blockers for the standing entry.
