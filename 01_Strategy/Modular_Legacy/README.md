# Modular Legacy Architecture

This folder contains the original "Modular" composable add-on architecture
(Universal Core + 36 task-typed add-ons + client bundles), designed before
the current Archetype/Runtime system (`Agent_Runtime_System_v1.md`).

**Status: Superseded as a behavior-design architecture, archived for
reference.** The task-type/add-on model could not express the
psychology-driven, freedom-level-adaptive behavior the current system
requires. Do not build against this architecture.

**What was extracted and preserved, at the correct layer:**
- Action Tool Naming Convention → 06_Infrastructure/Tool_Naming_Convention.md
- Fallback Pattern Catalog → 06_Infrastructure/Fallback_Pattern_Catalog.md
- Client Onboarding Operations Guide → 00_Project_Control/Client_Onboarding_Guide.md
- Version Control & KPI Framework → 00_Project_Control/Version_Control_and_KPI_Framework.md

These four documents took specific, still-valuable ideas from Modular and
rebuilt them to reference the current Archetype/Runtime system's actual
terminology and module structure — they are not copies of the original
Modular content.

## Contents

- `CS_AI_Agent_PreBuild_Guide_Modular.md` — the 14-step, 4-phase Modular
  pre-build planning guide. Source of the extracted onboarding, version
  control, and KPI content.
- `ZeroManual_AddOn_Anatomy_Standard.md` — the add-on template standard,
  webhook naming convention, and fallback pattern catalog (A/B/C/D).
  Source of the extracted tool naming and fallback pattern content.
- `ZeroManual_Agent_Architecture_Reference.md` — the composable
  architecture team reference (3 layers, 5 task types, 4 niche clusters,
  tech stack: ConvoCore + Voiceflow + n8n).
- `ZeroManual_AddOn_Library_Master .md` — the full 36-add-on backlog
  (19 MVP / 17 Phase 2), organized by task type and cluster.
- `Zenny_Demo_Build_Plan.md` — a Modular-era sales demo sprint plan (two
  demo brands, 6 working demos). Not one of the 4 documents named in the
  archival task's source list; found alongside them in `/Modular` and
  archived here as clearly Modular-origin content (built entirely on the
  cluster/add-on model). See the archival task's report for detail.
- `docx/` — the original `.docx` source files for all five documents
  above, archived alongside their `.md` counterparts.
- Diagrams originally misfiled under `00_Project_Control/Needs_Review/`
  that visually depict this architecture (composable add-on layers,
  the 4 niche clusters, the add-on library master plan, and the early
  product-ecosystem sketch referencing the pre-rename "Revenue Agent")
  were moved here during the same archival pass — see `Diagrams/`.

Reviewed and archived: 2026-07-12
