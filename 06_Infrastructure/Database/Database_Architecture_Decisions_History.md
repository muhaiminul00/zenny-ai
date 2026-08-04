# Database Architecture Decisions — History
### Brief reference: what changed, and why, across both restructures

```
Purpose: A quick-reference record of why the database looks the way it
does now — for anyone (including future us) who opens the schema and
wonders "why isn't this just one Airtable base" or "why schemas, not
separate projects."
```

---

## Restructure 1 — Airtable (old) → Supabase Multi-Schema (new)

**What it was:** One shared Airtable base. Every client's data lived in the same tables, distinguished only by a `Business` Single Select field (a filter column, not real isolation). Business names ("Ember," "GlowWell," "Precision") were hardcoded directly into workflow logic, cadence timings, and even Slack alert text.

**Why it changed:**
1. **Hard rate ceiling that never lifts.** Airtable caps every base at 5 requests/second, on every tier including Enterprise. For a system where n8n calls the database on nearly every customer message, this is a real constraint, not a someday-problem.
2. **Record limits force disruptive upgrades.** 1,000/base (Free) → 50,000 → 125,000, with a steep per-seat cost jump at the top tier — and records count cumulatively across all tables in one base.
3. **No real multi-tenant access control.** Airtable's permission model is built for internal teams, not isolating one client's data from another's.
4. **It already matched the wrong problem.** A `Business` Single Select field is a *filter*, not isolation — every client's data physically sat in the same tables.
5. **Directly contradicted the stated long-term direction** (Supabase/Postgres-based custom SaaS) — building on Airtable now meant paying a real migration cost twice: once to build it, once to leave it.

**What replaced it:** Supabase (real Postgres). Chose **schema-per-client** over separate-project-per-client specifically to fit the free tier (2 projects, 1 database each) while still giving each client fully isolated tables — same practical isolation, none of Airtable's ceilings.

**One thing kept from Airtable's spreadsheet-style UX, solved differently:** Supabase's built-in Table Editor already gives a comparable grid-view experience for manual review/troubleshooting — no compromise needed on that specific need.

---

## Restructure 2 — Flat "One Database Per Client" → Schema Tree (Vault → Control → Templates → Client Schemas)

**What the first Supabase draft (v1) looked like:** Flat — one client, one full set of ~24 tables, no shared structure between clients beyond "they all happen to use the same column names."

**Why it changed to a schema tree (v2):**
1. **You specifically asked for a central vault + reusable templates**, not N independent full copies designed from scratch each time — a business config table per client, synced from one manually-editable central source of truth ("the vault should be accessible to us, manually view or edit... if the system does any error, main vault doesn't get harmed").
2. **Archetype-level reuse.** Every Commerce client needs the same base structure; only their data differs. Building 5 reusable **templates** (one per archetype: Emergency, Commerce, Appointment, Consultation, Engagement) — each assembled once from a shared common-table set plus that archetype's specific tables — means onboarding a new client is "copy the right template," not "design a new schema."
3. **Common vs. archetype-specific split.** Most tables (customers, leads, escalations, emails, etc.) are identical regardless of archetype; only a handful (the `conversions_*` extension tables) genuinely differ per archetype. Splitting these apart avoids either duplicating structure 5 times or building one giant table with dozens of mostly-empty columns.

**Why `vault` got renamed to `control`:** Supabase reserves the schema name `vault` for its own built-in encrypted-secrets extension — a real naming collision, caught before any SQL ran. `control` was chosen as the replacement since it matches language already used for this concept ("Control Plane vs. Client Data").

**Why `client_config`'s per-archetype settings became one JSONB column, not a separate table:** A client can run multiple archetypes at once (e.g., a Commerce client with both Ecom and Restaurant sub-variants), each potentially needing different settings (freedom level, conversion mode). Rather than a second table, `client_config.archetype_settings` holds one JSON object keyed by archetype — one row per client either way, multi-archetype clients just have more keys.

**Why `agent_prompts` is Vault-only and never synced to client schemas (unlike everything else in Vault):** This table holds the actual behavioral intelligence — the LLM instructions governing how the agent thinks, not customer-facing message copy. Two reasons it stays centralized: (1) it's the project's real IP, safer never duplicated into every client's schema; (2) it happens to solve the "what if a template improves after clients already exist" problem for this content specifically, since nothing was ever copied out to go stale in the first place.

**Why Voiceflow's actual playbook files (`.vf`) were explicitly kept OUT of the database entirely:** They're Voiceflow's own proprietary flow format — not portable content. Storing them in Postgres would create *false* portability (looks migrated to a future platform, but isn't — LangGraph can't read a `.vf` file). Only the platform-independent *content* (prompts, templates) belongs in the database; the platform-specific *wiring* stays in Voiceflow itself, backed up under real version control.

---

## The Constant Across Both Restructures

Every change traces back to one repeated principle: **build for the platform-independent, long-term shape of the system, using whatever specific tool is correct today — never let today's tool's limitations become permanent architecture.** Airtable's row/rate limits, Supabase's `vault` naming collision, and Voiceflow's proprietary playbook format were all treated as *implementation facts to design around*, not constraints the architecture had to permanently accommodate.
