**Customer Support AI Agent**

Modular Pre-Build Planning Guide

Composable Architecture Edition

A composable, plugin-based framework for planning and building a scalable, niche-agnostic AI customer support agent — built on the 3-layer add-on architecture using Voiceflow and n8n.

|  |  |  |  |
| --- | --- | --- | --- |
| **14 Steps** | **4 Phases** | **12 Niches** | **Voiceflow + n8n** |

ZeroManual · Customer Intelligence Division · 2025

**The Composable Architecture**

All 14 planning steps in this guide are built around a 3-layer composable add-on architecture. Understanding this system before reading the steps is essential — every planning decision flows from it.

**The 3 Layers**

|  |  |  |  |
| --- | --- | --- | --- |
| **Layer** | **Name** | **Role** | **Built when** |
| 3 | Client bundle | Selected and personalized add-ons for one specific client | During client onboarding |
| 2 | Add-on library | All add-ons organized by task type. Built once, reused always | Before first client |
| 1 | Universal core | 6 non-removable capabilities, always active for every agent | First — before any add-ons |

**The 5 Task Types — The True Common Layer**

Every add-on belongs to exactly one of 5 task types. These types exist in every niche. They are the organizing principle of the library and the reason a Salon add-on and a Plumbing add-on can share the same structural pattern.

|  |  |  |
| --- | --- | --- |
| **Task type** | **Definition** | **Example add-ons** |
| Lookup | Read data from a system and report it to the customer | Order status, Booking status, Stock check |
| Action | Execute a task or transaction in an external system | Refund initiate, Book appointment, Cancel request |
| Info | Answer a question from the knowledge base | FAQ answer, Policy lookup, Product info |
| Lead capture | Collect customer information for follow-up | Quote request, Contact form, Service enquiry |
| Escalation | Route to a human agent or flag urgency | Complaint log, Human handoff, Urgent flag |

**The 4 Niche Clusters**

The 12 target niches group into 4 clusters based on task overlap. Build per cluster — within a cluster, 70–80% of add-ons are shared. One cluster build gives you almost the entire niche group.

|  |  |  |
| --- | --- | --- |
| **Cluster** | **Niches** | **Primary task types** |
| Lifestyle services | Restaurant, Salon, Spa, Gym | Lookup + Action (booking focus) |
| Home trades | Roofing, Plumbing, Electrician, Cleaning | Lead capture + Info (enquiry focus) |
| Commerce | Ecommerce | Lookup + Action (order and refund focus) |
| Professional | Marketing agency, NGO, Travel agency | Info + Lead capture (guidance focus) |

**Table of Contents**

**PHASE 1 — FOUNDATION DECISIONS**

01 — Architecture commitment

02 — Niche cluster mapping

**PHASE 2 — ARCHITECTURE SPECIFICATION**

03 — Add-on library master plan

04 — Add-on anatomy standard

05 — Universal core specification

06 — Integration adapter architecture

**PHASE 3 — DESIGN & CONTENT**

07 — Conversation flow architecture

08 — Knowledge base architecture

09 — Agent persona & tone system

10 — Scope, guardrails & compliance

**PHASE 4 — OPERATIONS & LAUNCH**

11 — Client onboarding process

12 — Version control & release management

13 — Success metrics & KPIs

14 — Pre-build green-light checklist

**How to Use This Guide**

This guide replaces the previous pre-build planning process with one built around the composable add-on architecture. Each of the 14 steps produces a concrete deliverable. Complete all steps and get every deliverable signed off before opening Voiceflow or n8n.

|  |  |  |
| --- | --- | --- |
| **Phase** | **Steps** | **What you finalize** |
| Phase 1 — Foundation | Steps 1–2 | The architectural approach and niche cluster map. Everything downstream depends on these two decisions. |
| Phase 2 — Architecture | Steps 3–6 | The add-on library, anatomy standard, universal core spec, and integration adapter layer. The technical blueprint. |
| Phase 3 — Design | Steps 7–10 | Conversation routing, knowledge base, agent persona, and guardrails. The layer clients see and feel. |
| Phase 4 — Operations | Steps 11–14 | Client onboarding, version control, metrics framework, and the final green-light checklist. |

|  |
| --- |
| **PHASE 1 — FOUNDATION DECISIONS** |

|  |  |
| --- | --- |
| **01** | **Architecture commitment** |

|  |
| --- |
| *What is the architectural approach — and why does this decision shape everything that follows?* |

[ Foundation decision ] [ Non-negotiable ] [ Shapes all downstream steps ]

**WHAT TO FINALIZE**

* **Confirm the composable add-on architecture.** This product is not a niche-specific build — it is a platform that delivers configurable agent bundles to any client in any niche. This distinction shapes every technical and business decision downstream.
* **The 3 layers are non-negotiable:** Universal Core (always on, built first, never client-customized), Add-On Library (task-type organized, built once, reused always), Client Bundle (selected and personalized per client at onboarding). No layer can be removed or reordered.
* **The 5 task types are the true common denominator across all niches:** Lookup, Action, Info, Lead Capture, Escalation. Every add-on ever built belongs to exactly one of these. This taxonomy is the backbone of the entire library and enables cross-niche reuse.
* **This decision eliminates the niche-filtering problem.** No niche is excluded because the library covers all task types. A client's niche only determines which add-ons are selected — not how the agent is architected or built.
* **Document and sign off this decision before any other step.** Every team member — product, technical, and commercial — must align on this architecture. Changes after building begins are extremely costly.

|  |  |
| --- | --- |
| **DELIVERABLE** | Architecture Decision Record (ADR): confirmed 3-layer composable system, signed off by all stakeholders |

|  |  |
| --- | --- |
| **02** | **Niche cluster mapping** |

|  |
| --- |
| *How do the 12 target niches group into clusters — and which cluster do you build first?* |

[ 12 niches → 4 clusters ] [ Build per cluster not per niche ] [ First-build selection ]

**WHAT TO FINALIZE**

* **Map the 12 niches into 4 clusters** based on task overlap: Lifestyle services (Restaurant, Salon, Spa, Gym), Home trades (Roofing, Plumbing, Electrician, Cleaning), Commerce (Ecommerce), Professional (Marketing agency, NGO, Travel agency).
* **Within a cluster, 70–80% of add-ons are shared.** Building one cluster gives you almost all the components for the rest of the niches in it. This is the primary efficiency multiplier of the modular approach — one build, multiple PMF signals.
* **Score each cluster on 4 factors:** market demand (from your marketing partner's intelligence), task type simplicity, integration availability, and KB content ease of collection. Use a simple 1–5 scale per factor. Select the highest-scoring cluster to build first.
* **Recommended first build: Lifestyle services.** High appointment-booking demand, simple integrations (Calendly or similar), clear task types, and 4 niches covered in one cluster build. Gives you the fastest PMF signal across multiple client types.
* **For the first-build cluster, document:** primary customer journey from first message to resolution, top 5–8 customer intents, and the booking or order management system most commonly used by clients in those niches.

|  |  |
| --- | --- |
| **DELIVERABLE** | Cluster priority map: 4 clusters scored and ranked, first-build cluster selected with rationale |

|  |
| --- |
| **PHASE 2 — ARCHITECTURE SPECIFICATION** |

|  |  |
| --- | --- |
| **03** | **Add-on library master plan** |

|  |
| --- |
| *What is every add-on that needs to exist — organized by task type — and what is the MVP scope?* |

[ Master backlog ] [ Task-type organized ] [ MVP vs Phase 2 ] [ Universal vs cluster-specific ]

**WHAT TO FINALIZE**

* **For each of the 5 task types, enumerate all add-ons across all 4 clusters.** Example — Lookup: Order status (Commerce), Booking status (Lifestyle + Trades), Service request status (Trades), Stock check (Commerce). Info: FAQ answer (all clusters), Policy lookup (all clusters), Product info (Commerce), Service catalog (Lifestyle + Trades).
* **Label each add-on by scope:** Universal (all clusters need it — build first), Cluster-specific (1–2 clusters need it — build per cluster rollout), Niche-specific (one niche only — lowest priority, build last). Universal add-ons give the most leverage.
* **Mark MVP vs Phase 2.** MVP = top 3 add-ons per task type for the first-build cluster. Phase 2 = remaining add-ons for that cluster plus all add-ons for other clusters. Never start Phase 2 before MVP is live and validated.
* **Estimate build effort per add-on:** Simple — KB-only, no API call (half a day). Medium — one API call via n8n (one day). Complex — multi-step, multiple API calls (two to three days). This feeds your sprint planning and client delivery timeline.
* **This master list is your add-on backlog.** Import it into your project management tool (Linear, Notion, or Trello). Each add-on becomes a card with: task type, scope label, priority, effort estimate, assigned builder, and build status.

|  |  |
| --- | --- |
| **DELIVERABLE** | Add-on library master list: task type → add-on name → scope → priority → effort estimate → build status |

|  |  |
| --- | --- |
| **04** | **Add-on anatomy standard** |

|  |
| --- |
| *What structure must every add-on follow — so the library stays consistent and maintainable at scale?* |

[ Universal contract ] [ 5 required components ] [ Template required ] [ Built before Voiceflow ]

**WHAT TO FINALIZE**

* **Every add-on has exactly 5 components:** (1) Intent triggers — 5–8 NLU phrases that activate this add-on. (2) Required inputs — what data is needed from the customer or a connected system before the add-on can respond. (3) Integration hook — the n8n webhook name this add-on calls, or the KB section it queries for Info-type add-ons. (4) Personalization slots — values filled at client setup such as company name, return policy, service area, pricing. (5) Fallback behavior — what the add-on does if data is unavailable, the API fails, or the input is invalid.
* **Create a single Add-On Anatomy Template document** — one page per add-on — that must be fully completed before any Voiceflow flow or n8n workflow is built for that add-on. No completed template means no build begins. This is a hard gate.
* **The anatomy defines the build sequence:** fill template → build n8n workflow → build Voiceflow flow → unit test → integration test → add to library. Skipping the template step is the single most common cause of costly rework across agent builds.
* **The integration hook field is especially critical.** It must exactly match the webhook naming convention defined in Step 6. A single mismatch between the add-on template and the n8n workflow name breaks the integration silently — the agent will appear to work but produce wrong results.
* **Without this contract, every add-on will be built differently.** After 20 or more add-ons, inconsistency makes maintenance and updates impossible. Enforce the anatomy as a non-negotiable build gate from the very first add-on.

|  |  |
| --- | --- |
| **DELIVERABLE** | Add-On Anatomy Template (reusable for all add-ons in the library) + build gate checklist |

|  |  |
| --- | --- |
| **05** | **Universal core specification** |

|  |
| --- |
| *What are the 6 core capabilities that are non-removable and must be built before any add-on?* |

[ Always on ] [ Built first ] [ Never client-customized ] [ The chassis every add-on plugs into ]

**WHAT TO FINALIZE**

* **The 6 core capabilities:** Greeting (welcome message and language detection), Detect (intent classification and add-on routing — the traffic director of every conversation), Fallback (unrecognized intent → retry prompt → escalation after N retries), Escalate (configurable trigger conditions → human handoff with full context payload), CSAT (post-resolution 1–5 survey sent after every resolved session), Logging (full session transcript and metadata written to analytics store after every conversation).
* **Build the universal core first, before any add-on.** These capabilities are the chassis — every add-on plugs into them. A Fallback that is not rock-solid breaks every add-on. An Escalation that fires incorrectly wastes human agent time. Build order matters.
* **Define each capability's behavior precisely:** How many Fallback retries before escalation? (Recommend 2.) What exact text does CSAT send? What metadata fields are logged per session — at minimum: session\_id, add\_on\_used, resolution\_status, escalation\_triggered, csat\_score. Document these parameters as configuration, not hard-code.
* **The Detect capability is the most complex core component.** It must classify intent from free text, select the correct add-on, handle ambiguous inputs where multiple add-ons could match, and route gracefully to Fallback when confidence is low. Allocate the most design and testing time here.
* **The universal core is identical for every client.** No client can remove or significantly modify any of the 6 capabilities. Clients may configure specific parameters — escalation trigger keywords, CSAT survey timing, logging retention period — but cannot disable core capabilities.

|  |  |
| --- | --- |
| **DELIVERABLE** | Universal core spec sheet: all 6 capabilities with behavior definitions, configurable parameters, and test criteria |

|  |  |
| --- | --- |
| **06** | **Integration adapter architecture** |

|  |
| --- |
| *How do add-ons connect to external systems without being tightly coupled to any specific platform?* |

[ Decoupled ] [ Platform-agnostic ] [ n8n adapter layer ] [ Swap platforms without touching add-ons ]

**WHAT TO FINALIZE**

* **Adopt the integration adapter pattern:** the Voiceflow add-on calls a generic n8n webhook name. The n8n workflow connects to the specific client system. The add-on never knows what system is on the other side. This is the core scalability mechanism — changing a client's platform means updating one n8n workflow, not rebuilding an add-on.
* **Define a webhook naming convention:** verb-entity format. Examples: get-order-status, create-refund-request, post-appointment-booking, get-stock-level, create-support-ticket, get-quote-estimate. These names are used in the Add-On Anatomy Template from Step 4 and must never change after the add-on is published to the library.
* **Build a platform compatibility matrix.** For each webhook: list supported platforms and the n8n node used. get-order-status → Shopify HTTP node, WooCommerce node, custom REST API. post-appointment-booking → Calendly API, Cal.com API, Google Calendar API. create-support-ticket → Freshdesk node, Linear API, email node. This matrix is the integration promise you make to clients.
* **Client platform swapping works like this:** Client A uses Shopify, Client B uses WooCommerce. Both clients use the get-order-status webhook. The Voiceflow add-on is identical for both. Only the n8n workflow adapter differs per client. This is what makes the modular architecture commercially viable.
* **Flag add-ons that serve clients with no API.** Small trades businesses and some NGOs have no digital system at all. Decide the workaround pattern now: Google Sheets as a read/write backend via n8n, or Airtable as a simple database. Document which add-ons support this no-API fallback mode and build it as a third adapter option.

|  |  |
| --- | --- |
| **DELIVERABLE** | Integration adapter map: webhook name → supported platforms → n8n node → response schema + naming convention document |

|  |
| --- |
| **PHASE 3 — DESIGN & CONTENT** |

|  |  |
| --- | --- |
| **07** | **Conversation flow architecture** |

|  |
| --- |
| *How does the agent route between add-ons, pass context, and handle multi-turn interactions?* |

[ Routing logic ] [ Context schema ] [ Multi-step flows ] [ Escalation payload ]

**WHAT TO FINALIZE**

* **Main routing flow:** customer message → Universal Core Detect classifies intent → selects add-on → add-on executes → returns response → checks if follow-up is needed → closes session or returns control to Detect. This loop is the heartbeat of every conversation. Map it as a diagram before building.
* **Define the session context schema — variables that persist across turns within one session.** Minimum required fields: customer\_id (collected on first lookup or provided by channel), active\_add\_on, last\_intent, escalation\_score (increments on each failure or detected negative sentiment), session\_start\_time. Every add-on must be able to read and write to this schema.
* **Multi-step add-ons require a state machine spec.** Appointment booking requires date, time, service type, and confirmation — at minimum 4 turns. Define per multi-step add-on: what is collected in each turn, how partial or incorrect inputs are handled, how the customer can correct themselves mid-flow, and what the abort path looks like.
* **Define allowed add-on chains explicitly.** Chains that should be built: refund confirmed → CSAT triggered. Complaint logged → human handoff notification sent. Booking confirmed → confirmation details FAQ activated. Chains must be intentional — no implicit or automatic triggers that fire without explicit design.
* **The escalation handoff payload** must include: full session transcript, last active add-on name, customer\_id, escalation\_reason (keyword triggered or threshold exceeded), escalation\_score at time of handoff, and a one-sentence AI-generated summary of the issue. This payload is sent to the human agent via n8n. Without it, human agents start from scratch on every escalation.

|  |  |
| --- | --- |
| **DELIVERABLE** | Conversation routing diagram + session context schema + multi-step flow state machines for all MVP add-ons |

|  |  |
| --- | --- |
| **08** | **Knowledge base architecture** |

|  |
| --- |
| *How is the knowledge base structured to support modular add-ons and per-client customization?* |

[ 3-tier KB ] [ Per add-on sections ] [ Freshness rules ] [ Vector DB decision ]

**WHAT TO FINALIZE**

* **Use a 3-tier KB structure.** Universal tier: applies to every agent regardless of client — agent capabilities, privacy policy, how to reach human support, general FAQ about the agent itself. Cluster tier: applies to all niches in a cluster — typical service policies, common industry questions, cluster-specific terms and expectations. Client tier: specific to one client — their products, prices, opening hours, service area, return policy, staff FAQ.
* **Each Info add-on maps to a specific KB section.** The routing logic knows which KB section to query per add-on. This prevents cross-contamination — a question about return policy does not surface unrelated product catalog content. Maintain a KB section index: add-on name → tier → section name.
* **Freshness rules per tier.** Universal tier: reviewed quarterly by your team. Cluster tier: reviewed when the cluster's add-ons are updated or new niches are added. Client tier: client's own responsibility — define a monthly reminder process and a 'KB last updated' field for each client section. Stale KB is the leading cause of hallucinated or incorrect answers.
* **Vector DB strategy by scale.** Under 200 client documents: use Voiceflow's built-in knowledge base (free, no setup overhead). 200 to 2000 documents: use Supabase pgvector (generous free tier, native n8n integration). High-traffic clients or 2000+ documents: use Pinecone or Qdrant. Universal and cluster tier content can be injected directly into the system prompt as context to avoid embedding costs for stable content.
* **Client KB content collection is the biggest onboarding bottleneck.** Build a KB Content Checklist as part of the Client Onboarding Workbook from Step 11. List every piece of content required per tier, with format guidance. Most clients have 60% of what is needed already — it just requires organizing and formatting.

|  |  |
| --- | --- |
| **DELIVERABLE** | KB structure template: 3-tier map, per-add-on section index, freshness rules, ownership matrix, vector DB decision framework |

|  |  |
| --- | --- |
| **09** | **Agent persona & tone system** |

|  |
| --- |
| *How does the agent's voice work consistently across different clients and clusters — with room for customization?* |

[ 3-layer persona ] [ Cluster tone modifiers ] [ Client override slots ] [ System prompt skeleton ]

**WHAT TO FINALIZE**

* **Design a 3-layer persona system.** Base persona: the agent's core identity, baseline tone, and guardrail language that never changes regardless of client. Cluster modifier: a tone shift paragraph applied to all clients in a cluster. Client slots: specific values filled at onboarding that personalize the final voice — brand name, greeting phrase, language preference, custom restrictions.
* **Define cluster tone modifiers.** Lifestyle services — warm, friendly, conversational, patient with first-time customers, light use of reassuring language. Home trades — direct, professional, no small talk, efficiency-focused, action-oriented. Commerce — fast, transactional, urgency-aware, solution-first. Professional services (NGO and Agency) — formal, precise, compliance-aware, empathetic where appropriate.
* **Build the system prompt as a template with named slots.** Structure: 'You are {agent\_name}, the customer support assistant for {client\_name}. {cluster\_tone\_paragraph}. You help customers with: {add\_on\_list}. You always: {universal\_always\_rules}. You never: {universal\_never\_rules}. {client\_custom\_rules}.' Every slot is filled at onboarding. The system prompt is the only place persona lives — it should not be scattered across individual Voiceflow flows.
* **Validate the persona before building** by writing 5 sample exchanges per cluster tone — a greeting, a successfully resolved response, an 'I don't know' response, an escalation handoff, and an apology for a failure. Show these to a stakeholder and get explicit sign-off. Tone that is wrong after flows are built is expensive to fix.
* **Persona hard limits that no client can override.** The agent always discloses it is an AI if the customer sincerely asks. It never makes promises outside its active add-on scope. It never references competitor brand names. It never uses clinical, legal, financial, or technical language to give advice outside its authorized scope.

|  |  |
| --- | --- |
| **DELIVERABLE** | Persona system template: base persona + 4 cluster modifiers + system prompt skeleton with all slots defined |

|  |  |
| --- | --- |
| **10** | **Scope, guardrails & compliance** |

|  |
| --- |
| *What will this agent never do — and how are limits enforced at the universal, cluster, and client levels?* |

[ Universal limits ] [ Cluster compliance ] [ Client scope config ] [ Abuse prevention ]

**WHAT TO FINALIZE**

* **Universal hard limits — no client can override these.** Never process or store payment card data directly. Never impersonate a human when sincerely asked. Never share one customer's data with another customer in the same session. Never make commitments outside the active add-on's explicitly approved scope. These limits are written into the base persona and the universal core Fallback logic.
* **Cluster compliance rules.** Lifestyle services — no medical or health advice, critical especially for spa and gym contexts. Home trades — no structural engineering guidance, no electrical safety certification advice, no building code interpretation. Commerce — no investment or financial advice on high-value purchases. Professional services including NGO — donation and fund transparency disclosures required where relevant.
* **Client-level scope is configured at onboarding.** Each client defines: refund approval cap (agent will not approve refunds above this value without human review), service area restriction (agent flags out-of-area requests), operating hours handling (how out-of-hours sessions are escalated), and any additional topic restrictions specific to their business.
* **Escalation as the primary guardrail.** For any topic where the agent is not authorized to respond, the default behavior is not a refusal but a warm escalation: 'This is outside what I can help with directly — let me connect you with someone who can.' A hard refusal without a path forward damages customer experience. Warm escalation maintains trust while respecting scope limits.
* **Abuse prevention.** Offensive or abusive input: one warning message, then session end with escalation flag sent to the client. Prompt injection attempts such as 'ignore previous instructions': agent continues normally, logs the attempt as a security event. High-frequency bot sessions: rate limiting triggered at the n8n layer to keep detection logic out of the agent's conversation flow.

|  |  |
| --- | --- |
| **DELIVERABLE** | Guardrails matrix: 3-level structure — universal limits, cluster compliance rules, client scope configuration options |

|  |
| --- |
| **PHASE 4 — OPERATIONS & LAUNCH** |

|  |  |
| --- | --- |
| **11** | **Client onboarding process** |

|  |
| --- |
| *When a new client signs up, what is the exact repeatable sequence to configure and launch their agent?* |

[ Repeatable process ] [ Slot-filling driven ] [ 2–3 day target ] [ UAT required before go-live ]

**WHAT TO FINALIZE**

* **The onboarding sequence has 7 stages:** (1) Cluster identification and add-on selection, (2) Completion of Client Onboarding Workbook, (3) Integration credential collection and connection testing, (4) Personalization slot filling across all active add-ons, (5) KB content upload and query testing, (6) UAT — user acceptance testing against every active add-on, (7) Go-live approval and monitoring setup.
* **Create a Client Onboarding Workbook** — a structured document the client fills in before configuration begins. It collects: brand voice description, agent name preference, API credentials for each integration, service catalog, custom policies, FAQ content dump, operating hours, escalation contact name and email, and language preferences. Without a completed workbook, onboarding cannot start.
* **Add-on selection uses a guided decision questionnaire.** 'Do you take appointments? → Book appointment and Booking status add-ons. Do you sell physical products? → Order track and Stock check add-ons. Do you offer quotes? → Quote request add-on.' This questionnaire takes 30 minutes with the client and produces a confirmed add-on bundle list. The bundle drives everything else.
* **UAT checklist: for each active add-on, run 5 test cases.** Happy path (expected input, correct output), bad input (typos, vague phrasing, wrong language), API failure simulation (disconnect the integration and verify fallback behavior), escalation trigger (verify the escalation fires and the handoff payload is correct), and CSAT collection (verify the survey is sent and response is logged). All 5 must pass before go-live. One failure means fix before launch.
* **Target: new client live in 2–3 business days** with a mature library and playbook. Breakdown: Day 1 — workbook review, add-on selection, integration credential setup and testing. Day 2 — KB upload, slot filling, system prompt assembly. Day 3 — UAT, issue fixes, go-live approval, monitoring dashboard confirmed. Track actual versus target time per client to identify and improve bottlenecks.

|  |  |
| --- | --- |
| **DELIVERABLE** | Client onboarding playbook: 7-stage process document + Client Onboarding Workbook template + UAT checklist per add-on |

|  |  |
| --- | --- |
| **12** | **Version control & release management** |

|  |
| --- |
| *How do you update add-ons across all active clients without breaking existing deployments?* |

[ Stable vs beta tracks ] [ Promotion criteria ] [ Breaking vs non-breaking ] [ Rollback plan ]

**WHAT TO FINALIZE**

* **Maintain two tracks for every add-on in the library: Stable and Beta.** Stable is deployed to all active clients. Beta is deployed to new clients and opt-in test clients. All changes go to Beta first. Never push a change directly to Stable — this is the rule that prevents simultaneous breakages across multiple clients.
* **Promotion criteria from Beta to Stable:** the Beta version must run for a minimum of 14 days with zero critical issues — defined as broken flows, incorrect API responses, or an escalation rate spike above baseline. After passing, the add-on is promoted to Stable and all active clients receive the update at the next scheduled maintenance window.
* **Classify every change as breaking or non-breaking before writing a single line.** Non-breaking: adding a new intent trigger phrase, improving response wording, fixing a spelling error — safe to auto-update all clients. Breaking: changing an integration interface, adding a required input field, restructuring the conversation flow — requires per-client UAT before updating. Always err toward classifying as breaking when in doubt.
* **Archive every published add-on version.** If a Stable update causes an issue in production, rollback to the previous version must be possible in under 30 minutes. Keep at minimum the last two stable versions of every add-on archived. Write and test the rollback procedure before you have more than 5 active clients.
* **Maintain a change log per add-on.** Record what changed, the classification (breaking or non-breaking), the date promoted to Stable, and any client-specific notes. Client account managers can use this log to proactively explain behavior changes to clients. A clear change log prevents support tickets from your own clients about your own updates.

|  |  |
| --- | --- |
| **DELIVERABLE** | Version control policy: stable and beta tracks, promotion criteria, breaking change classification, rollback procedure |

|  |  |
| --- | --- |
| **13** | **Success metrics & KPIs** |

|  |
| --- |
| *How do you measure performance at 3 levels — client, add-on, and the overall product?* |

[ Client level ] [ Add-on level ] [ Product level ] [ 3-level measurement framework ]

**WHAT TO FINALIZE**

* **Client-level KPIs.** Resolution rate: percentage of sessions fully resolved by the agent with no human needed — target 70% or above by month 1, 80% or above by month 3. CSAT score: post-session survey on a 1 to 5 scale — target 4.0 or above. Escalation rate: target under 25%. First response time: under 2 seconds for any recognized intent.
* **Add-on-level KPIs.** Usage frequency: which add-ons are activated most — this informs library build prioritization for future clusters. Success rate per add-on: percentage of activations that resolved without escalation — a low rate on a specific add-on signals an intent trigger gap, KB gap, or integration reliability issue. Fallback rate per add-on: high fallback on one add-on means its intent triggers need expanding.
* **Product and business-level KPIs.** Add-on reuse rate: how many clients use each add-on — a high reuse rate validates the modular approach and proves the library is efficient. Time to deploy a new client: target 2–3 business days — tracks onboarding playbook maturity. Library coverage rate: percentage of all client intents served by existing add-ons versus requiring a custom build — target 85% or above by month 6.
* **Measurement infrastructure.** After every conversation, n8n writes: session outcome (resolved or escalated), add-on name used, CSAT score if collected, escalation flag, and session duration — to a Google Sheets database or a Supabase table. Voiceflow's built-in analytics dashboard covers intent-level fallback data. Review add-on failure rates weekly. Review library coverage rate monthly.
* **Set baselines before the first client goes live.** Source industry benchmarks for AI-assisted customer support resolution rates — typically 60 to 65% at launch. Your targets should be 5 to 10 percentage points above the benchmark in month 1, then a 5% improvement per month as the KB matures and intent triggers are refined from real conversation data.

|  |  |
| --- | --- |
| **DELIVERABLE** | 3-level KPI framework: all metrics with measurement method, baseline source, targets, and review cadence |

|  |  |
| --- | --- |
| **14** | **Pre-build green-light checklist** |

|  |
| --- |
| *Is every decision confirmed and every input in hand before the first Voiceflow flow is opened?* |

[ Go / no-go gate ] [ All items must be confirmed ] [ Green light = start building ]

**WHAT TO FINALIZE**

* **Architecture confirmed.** 3-layer composable architecture decision record signed off by all stakeholders. No open questions about the approach.
* **Clusters mapped.** All 4 niche clusters identified and documented. First-build cluster selected and rationale recorded. Cluster priority scores on file.
* **Add-on backlog finalized.** Master add-on list complete. MVP scope defined for first cluster (top 3 per task type). Every MVP add-on has scope label, priority, and effort estimate.
* **Add-on anatomy template approved.** Template structure reviewed and agreed by the build team. At least 2–3 sample templates fully completed for MVP add-ons to validate the format works in practice.
* **Universal core spec signed off.** All 6 capabilities defined with behavior parameters and test criteria. Build owner assigned. Core is the first item in the build sprint — confirmed.
* **Integration adapter map complete.** All MVP webhook names defined and agreed. At least one platform per webhook tested end-to-end. Response schemas documented. No-API workaround pattern decided.
* **Conversation routing and context schema agreed.** Routing flow diagram approved. Session context schema fields defined. State machines written for all multi-step MVP add-ons.
* **KB structure defined and first content collected.** 3-tier structure agreed. First-cluster KB content collected and organized. Uploaded and validated with at minimum 5 test queries returning correct results.
* **Persona system and system prompt template approved.** Base persona written. Cluster modifier for first-build cluster written. System prompt template assembled. 5 sample exchanges validated by a stakeholder.
* **Guardrails matrix reviewed and approved.** Universal limits, first-cluster compliance rules, and client scope configuration options all defined. Escalation-as-guardrail pattern confirmed.
* **Client onboarding playbook v0.1 ready.** Workbook template drafted. Add-on selection questionnaire written. UAT checklist built. Target go-live time set and agreed.
* **Version control policy agreed.** Stable and beta track structure documented. Breaking change classification criteria understood by all builders. Rollback procedure written.
* **KPIs, baselines, and targets defined.** All 3 levels of the KPI framework agreed. Measurement infrastructure (n8n to Google Sheets) set up and tested with a dummy session. Review cadence added to team calendar.
* **Build team roles assigned.** Who builds the universal core. Who builds which MVP add-ons. Who builds each n8n workflow. Who owns KB content. Who owns client onboarding. Zero ambiguity on ownership.

|  |  |
| --- | --- |
| **DELIVERABLE** | Signed-off pre-build green-light document — all 14 items confirmed = open Voiceflow and start building |