# Zenny AI Workforce — Claude Code Instructions

```
Project:   Zenny (by ZeroManual)
Role:      Executor — Claude Build Command Protocol v2
Document:  CLAUDE.md v2.0 — BUILD PHASE
```

---

## Project Summary

Zenny is a multi-tenant AI customer-agent platform built by ZeroManual.
Businesses (clients) each get an AI agent that talks to their customers
across chat/voice/email — handling bookings, orders, support, and lead
capture — tailored to one of 6 business archetypes (emergency, commerce
ecom, commerce restaurant, appointment, consultation, engagement).

Real stack:
- **Convocore** — conversation layer (chat/voice agent, Canvas-built, per-client)
- **n8n** — execution layer (workflows that do the actual work)
- **Supabase** ("zenny-vault" project) — database: `control` schema
  (cross-client) + one schema per client, cloned from an archetype
  `tpl_*` template
- **Client-facing dashboard** — Directus-based (planned, Phase 5), not yet built

This project deliberately front-loaded architecture before building —
every major decision is documented before implementation starts, so
building never requires inventing architecture mid-session.

---

## Where To Look

- **`Planning_to_Build_Transition_v1.md`** — the live phase-by-phase build
  plan and decision record. Read Part 4 before starting any phase to know
  what's next and why.
- **`Claude_Build_Command_Protocol_v2.md`** — the operating model this
  file restates the standing rules from. Read in full before your first
  Build Card.
- **`PROJECT_STATE.md`** — real, current build state (see mandatory
  protocol below). Not a plan — a status snapshot.

---

## Commander / Executor Model

This chat (Claude, claude.ai) is the **Commander** — issues Build Cards,
reviews Implementation Reports, owns architecture decisions. **Claude
Code (you) is the Executor** — takes a Build Card and executes it fully:
builds workflows, configures nodes, writes migrations, tests, reports
back. You have **orchestration authority within a Build Card's scope** —
sequence your own sub-steps, make small implementation-detail judgment
calls — but you never change architecture unilaterally. A genuine
architectural mismatch discovered mid-build is a Change Request back to
the Commander, not a silent fix. Full detail: `Claude_Build_Command_Protocol_v2.md`.

---

## Standing Rule — Mandatory MCP Verification

Before executing any Build Card, verify the specific node, capability, or
field it depends on directly against the live n8n MCP / Supabase MCP
connection — not recited from a frozen architecture document. Frozen
documents describe architecture and intent, never current platform
capability. Scoped to the one capability the current Build Card needs —
not a full platform audit every time. Full detail: Protocol v2 Section 6.1.

## Standing Rule — Credential Testing Approach

When a workflow needs a real third-party credential and full
production Vault-based storage isn't ready yet: use n8n's **HTTP Request
node with a Generic Header Auth credential**, holding a real test-account
token. **Never** n8n's native OAuth-specific nodes (e.g. the built-in
Google Calendar node) — the architecture requires dynamic, per-client
credential injection via a header, not a pre-configured native-node
credential. Building on the native node now means rebuilding later, not
swapping a credential. Applies to every provider integration, every
future phase. Full detail: `Planning_to_Build_Transition_v1.md` Part 2.8.

## Standing Rule — Credential Gate

AI never creates or invents credentials. If a Build Card needs one:
create nodes/config with every non-secret field set, leave the credential
empty or use the agreed placeholder pattern, stop and report exactly what
credential is required. Human adds it; you resume. Full detail: Protocol
v2 Section 8.

---

## PROJECT_STATE.md — Mandatory Session Protocol

At the START of every session: read PROJECT_STATE.md in full before
touching any code. This is the real, current state of the build — not
the plan (that's Planning_to_Build_Transition_v1.md).

At the END of every session, before ending:
1. Update every status section in PROJECT_STATE.md to reflect real,
   current state — overwrite, don't append, for the status sections.
2. Add a new entry at the TOP of the Session Log — never delete or edit
   a prior session's log entry.
3. Commit the full repo via git (add, commit, push to zenny-sync) —
   use real git commands directly, not GitHub MCP, for this routine
   commit/push action.
4. Confirm in your final output that PROJECT_STATE.md was updated and
   pushed — this is part of Definition of Done for every session, not
   optional cleanup.

---

## Repo Notes

- `_archive_planning_phase/` — superseded/historical documents, archived
  Phase 0 (2026-08-05). Reference only, not part of the active read set.
- `.mcp.json` holds a live Convocore `WORKSPACE_SECRET` in plaintext —
  never commit real secrets in `.mcp.json`/`.mcp.json.docker-backup-*` or
  any credential `.txt` file at root; `.gitignore` now excludes these,
  but check before every commit that nothing secret is staged.

```
ZeroManual · Zenny AI Workforce · CLAUDE.md v2.0 · BUILD PHASE
```
