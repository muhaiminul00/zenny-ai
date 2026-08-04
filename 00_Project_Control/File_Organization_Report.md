# File Organization Report

## Date
2026-07-08

## Files Moved

| Original Location | File Name | Destination | Confidence |
|---|---|---|---|
| / | 0. Build_Execution_Plan_v2.docx | 00_Project_Control/ | High — "Build_Plan" match |
| / | 2. DEMO_PHASE_MASTER_PLAN_v3.docx | 00_Project_Control/ | High — "Demo_Phase" match |
| / | 7. Demo_Business_Build_Spec_v1.docx | 00_Project_Control/ | High — "Demo_Business" match |
| / | Zenny_Agent_Runtime_System_v1_Execution_Plan.md | 00_Project_Control/ | High — "Agent_Runtime_System_Execution_Plan" match |
| / | 1. ZeroManual_Blueprint_v3.docx | 01_Strategy/Blueprint/ | High — "Blueprint" + "ZeroManual_Blueprint" match |
| / | Zenny-Grand-Slam-Offer.docx | 01_Strategy/Offer/ | High — offer strategy document, filename explicit |
| / | 3. Archetype_Implementation_Matrix_v1.docx | 03_Archetypes/ | High — "Archetype" match |
| / | 4. Archetype_Build_Guide_v1.docx | 03_Archetypes/ | High — "Archetype" match |
| / | 5. Service_Implementation_Guide_v1.docx | 04_Service_Modules/ | High — "Service_Implementation" match |
| / | EMAIL MANAGER V2 ARCHITECTURE PLAN.docx | 04_Service_Modules/Email_Manager/ | High — explicit Email Manager service module |
| / | 10. Voiceflow_Agent_Architecture_v1.docx | 05_Platform_Builds/Voiceflow/ | High — "Voiceflow" match |
| / | 11. Voiceflow_Build_Sheet_v1.docx | 05_Platform_Builds/Voiceflow/ | High — "Voiceflow" match |
| / | 12. Voiceflow_Prompt_Playbook_Spec_v1.docx | 05_Platform_Builds/Voiceflow/ | High — "Voiceflow" match |
| / | VOICEFLOW UNIVERSAL BUILD STANDARD.md | 05_Platform_Builds/Voiceflow/ | High — "Voiceflow" match, content confirmed (Voiceflow build rules) |
| / | api_tool.md | 05_Platform_Builds/Voiceflow/ | High — content confirmed (Voiceflow API tool specs, n8n webhook payloads) |
| / | AI BUILDER GUIDE v1.docx | 05_Platform_Builds/Voiceflow/ | Medium-High — no exact keyword match, but content is a build guide for the Voiceflow agent builder |
| /Backups/ | Ember_&_Co-2026-07-06_13-53.vf | 05_Platform_Builds/Voiceflow/Backups/ | High — .vf is a Voiceflow project export format |
| /Backups/ | GlowWell_Studio-2026-07-06_13-53.vf | 05_Platform_Builds/Voiceflow/Backups/ | High — .vf is a Voiceflow project export format |
| /Convocore/ | EMBER_BUILD_GUIDE_(Convocore).md | 05_Platform_Builds/Convocore/ | High — "Convocore" match |
| /Convocore/ | convocore_customer_support_agent_guide.md | 05_Platform_Builds/Convocore/ | High — "Convocore" match |
| /Convocore/ | covocore-research-report.md | 05_Platform_Builds/Convocore/ | High — Convocore research (typo in original filename), moved as folder unit |
| / | 6. Infrastructure_Specification_v1.docx | 06_Infrastructure/ | High — "Infrastructure_Specification" match |
| / | 8. Airtable_Build_Sheet_v1.docx | 06_Infrastructure/Airtable/ | High — "Airtable" match |
| / | 18. Airtable_Data_Population_Guide_v1.md.docx | 06_Infrastructure/Airtable/ | High — "Airtable" + "Data_Population" match |
| / | 9. n8n_Workflow_Specification_v1.docx | 06_Infrastructure/n8n/ | High — "n8n" + "Workflow" match |
| / | 13. n8n_Core_Engine_Build_Guide_v1.docx | 06_Infrastructure/n8n/ | High — "n8n" match |
| / | 14. n8n_Email_Manager_Build_Guide_v1.docx | 06_Infrastructure/n8n/ | High — "n8n" match (infrastructure build guide, not the service module definition itself) |
| / | 15. n8n_Recovery_Engine_Build_Guide_v1.docx | 06_Infrastructure/n8n/ | High — "n8n" match |
| / | 16. n8n_Dashboard_Engine_Build_Guide_v1.docx | 06_Infrastructure/n8n/ | High — "n8n" match |
| / | 17. n8n_Utilities_Build_Guide_v1.docx | 06_Infrastructure/n8n/ | High — "n8n" match |
| / | 19. INTEGRATION CONTRACT v1.docx | 06_Infrastructure/Integration/ | High — "Integration Contract" match |
| /Diagrams/ | addon_library_master_plan.html | 00_Project_Control/Needs_Review/Diagrams_from_root/ | Low — see Needs_Review table |
| /Diagrams/ | agent_conversation_flow.png / .svg | 00_Project_Control/Needs_Review/Diagrams_from_root/ | Low — see Needs_Review table |
| /Diagrams/ | composable_agent_architecture.png / .svg | 00_Project_Control/Needs_Review/Diagrams_from_root/ | Low — see Needs_Review table |
| /Diagrams/ | customer_support_ai_agent_qualities.png / .svg | 00_Project_Control/Needs_Review/Diagrams_from_root/ | Low — see Needs_Review table |
| /Diagrams/ | finalized_cluster_map.png / .svg | 00_Project_Control/Needs_Review/Diagrams_from_root/ | Low — see Needs_Review table |
| /Diagrams/ | modular_agent_architecture.png / .svg | 00_Project_Control/Needs_Review/Diagrams_from_root/ | Low — see Needs_Review table |
| /Diagrams/ | zenny_product_ecosystem.png / .svg | 00_Project_Control/Needs_Review/Diagrams_from_root/ | Low — see Needs_Review table |

## Files in Needs_Review

| File Name | Reason for Uncertainty | Recommendation |
|---|---|---|
| addon_library_master_plan.html | Add-on library is not represented in the current folder taxonomy (no dedicated Service Modules / Add-Ons category); could belong under 01_Strategy or 04_Service_Modules | Architect to decide whether Add-On Library gets its own subfolder, likely under 04_Service_Modules or 01_Strategy/Business_Model |
| agent_conversation_flow.png / .svg | Diagram content spans runtime logic (conversation flow), which maps to 02_Agent_Runtime_System/Flowcharts, but was produced before that structure existed and may be outdated/superseded by future STEP 6 flowcharts | Likely destination: 02_Agent_Runtime_System/Flowcharts/ — confirm still accurate before promoting |
| composable_agent_architecture.png / .svg | "Composable agent architecture" could reflect either high-level Strategy/Blueprint thinking or Runtime System design — ambiguous which layer it documents | Likely destination: 01_Strategy/Blueprint/ or 02_Agent_Runtime_System/, pending architect read |
| customer_support_ai_agent_qualities.png / .svg | Appears to be early conceptual/strategy material, not tied to a specific build layer | Likely destination: 01_Strategy/ (general) — confirm relevance, may be superseded/archival |
| finalized_cluster_map.png / .svg | "Cluster map" terminology not defined elsewhere in reference docs; unclear if this maps to Archetypes, Service Modules, or Business Model | Architect to clarify what "cluster" refers to before filing |
| modular_agent_architecture.png / .svg | Filename suggests possible association with the protected /Modular folder's content, but Modular is locked and this file lives outside it — need to confirm this diagram is not itself Modular-derived IP that should stay untouched vs. just similarly named | Confirm with architect whether this diagram documents the Modular folder's system or is independent; do not link/move Modular itself regardless |
| zenny_product_ecosystem.png / .svg | High-level ecosystem overview spanning multiple layers (Strategy, Runtime, Platforms) — no single folder captures cross-cutting overview diagrams | Recommend creating a top-level overview location (e.g. 01_Strategy/ or a new 00_Project_Control subfolder) if more cross-cutting diagrams like this exist |

No files were classified as fully "Unknown" (Rule C) — every remaining root file matched a Rule A keyword pattern. All ambiguity was confined to the pre-existing `/Diagrams` folder, whose contents are diagrams spanning multiple architecture layers.

## Folders Created

```
00_Project_Control/
00_Project_Control/Needs_Review/
00_Project_Control/Needs_Review/Diagrams_from_root/   (ad hoc, to hold ambiguous diagrams)
00_Project_Control/Reviews/

01_Strategy/
01_Strategy/Offer/
01_Strategy/Blueprint/
01_Strategy/Business_Model/

02_Agent_Runtime_System/
02_Agent_Runtime_System/Flowcharts/
02_Agent_Runtime_System/Working_Drafts/

03_Archetypes/
03_Archetypes/Emergency/
03_Archetypes/Commerce/
03_Archetypes/Appointment/
03_Archetypes/Engagement/
03_Archetypes/Consultation/

04_Service_Modules/
04_Service_Modules/Core_Agent/
04_Service_Modules/Revenue_Agent/
04_Service_Modules/Conversion_Engine/
04_Service_Modules/Recovery_Engine/
04_Service_Modules/Email_Manager/

05_Platform_Builds/
05_Platform_Builds/Voiceflow/
05_Platform_Builds/Voiceflow/Backups/   (ad hoc, to hold .vf project exports)
05_Platform_Builds/Convocore/
05_Platform_Builds/Future_Custom/

06_Infrastructure/
06_Infrastructure/Airtable/
06_Infrastructure/n8n/
06_Infrastructure/Integration/
```

## Notes

- **Modular folder**: confirmed present at project root, not moved, not renamed, no files inside touched or read. Fully compliant with RULE 1 in CLAUDE.md.
- **CLAUDE.md**: remains in project root, untouched, per Rule E.
- **`/Convocore` folder**: existed at root pre-organization, containing three Convocore-specific docs. Its contents were moved into `05_Platform_Builds/Convocore/` and the now-empty original folder was removed. No content was altered.
- **`/Backups` folder**: contained two `.vf` (Voiceflow project export) files. These are Voiceflow build artifacts, so they were relocated into `05_Platform_Builds/Voiceflow/Backups/` (a subfolder created ad hoc since the original spec did not define a Backups location). Flagging for architect confirmation this is the desired home.
- **`/Diagrams` folder**: contained 13 files (7 diagram concepts, each with PNG + SVG, plus one HTML file) that predate the new taxonomy and cut across multiple architecture layers (Strategy, Runtime, cross-cutting ecosystem views). Rather than guess and misfile architecturally significant diagrams, all were placed in `00_Project_Control/Needs_Review/Diagrams_from_root/` per Rule B/C. See table above for per-file reasoning and suggested homes.
- **Numbered filename prefixes** (e.g. "0.", "1.", "10.") were preserved as-is during moves — no renaming was performed, per task scope (organization only, not editing/renaming).
- **02_Agent_Runtime_System, 03_Archetypes subfolders (Emergency/Commerce/Appointment/Engagement/Consultation), and 04_Service_Modules subfolders (Core_Agent/Revenue_Agent/Conversion_Engine/Recovery_Engine)** were created per spec but remain empty — no existing source files corresponded to these granular categories yet. They are scaffolded and ready for STEP 3/STEP 4 outputs.
- **01_Strategy/Business_Model** and **05_Platform_Builds/Future_Custom** were created per spec but remain empty — no existing files matched these categories.

## Status

READY FOR ARCHITECT REVIEW
