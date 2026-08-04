**Modular Agent Architecture**

Customer Support AI Agent · Team Reference · v1.2 · ZeroManual · 2025

**WHAT WE'RE BUILDING**

A composable customer support AI agent built on a reusable add-on library, deployed as a product suite. Channels are managed through ConvoCore — a white-label bridge handling WhatsApp, Instagram, and Facebook Messenger via Meta auth. Clients receive a branded ConvoCore dashboard. Any niche is served. No niche is filtered out.

Stack: ConvoCore (channel bridge) + Voiceflow (agent brain) + n8n (integration hub) + supporting services. Email is handled separately through n8n — ConvoCore does not support email.

|  |
| --- |
| **Variable slots:** Every capability in the Universal Core and every add-on contains named variable fields (e.g. agent\_name, tone, greeting\_phrase, active\_add\_on\_list, escalation\_contacts). Core logic and flow structure never change per client — only slot values change. Filled at client onboarding. |

**PRODUCT SUITE**

The product suite delivers the core agent plus standalone modules. Build planning separates what lives inside the agent from what is built alongside it on shared infrastructure (n8n + Claude API).

|  |
| --- |
| **5-day delivery:** The modular add-on architecture enables the live-in-5 guarantee. Pre-built Voiceflow templates + ConvoCore Meta auth channel setup = slot-filling and configuration, not custom builds per client. |

**Inside the agent**

|  |  |  |
| --- | --- | --- |
| **Deliverable** | **Built as** | **Notes** |
| 24/7 AI Revenue Agent | Core Voiceflow agent + full add-on library | Handles leads, FAQs, support. Delivered via ConvoCore channels. |
| Booking Engine (when bundled) | Book Appointment add-on, same agent | No separate build. When client takes both products, this add-on is simply activated. |
| CRM Auto-Sync | n8n extension of core Logging | After every session: n8n writes contact + conversation data to HubSpot, GoHighLevel, Salesforce, or Pipedrive. |

**Separate modules (built alongside, not inside the agent)**

|  |  |  |
| --- | --- | --- |
| **Deliverable** | **What it does** | **Engine** |
| Booking Engine (standalone) | Fixed-sequence flow: capture intent → send calendar link → confirm user + notify team | Voiceflow simple-flow template |
| Lead Recovery Engine | Outbound follow-up for unconverted leads, no-shows, and abandoned conversations | n8n scheduled automation |
| Email Inbox Manager | Triage inbox, classify intent, draft AI replies, escalate urgent emails | n8n + Claude API |
| Revenue Dashboard | Daily morning digest: leads, bookings, CSAT scores, revenue flags | n8n + Google Sheets + Looker Studio |

**THE 3 LAYERS**

|  |  |  |  |
| --- | --- | --- | --- |
| **Layer** | **Name** | **What it is** | **Who touches it** |
| 3 | Client bundle | Selected add-ons + personalization for one specific client | You + client (at onboarding) |
| 2 | Add-on library | All add-ons organized by task type. Built once, reused for every client | Builders (you) |
| 1 | Universal core | 6 core capabilities always active. Same for every agent, every client | Builders — built first, never modified per client |

**THE 5 TASK TYPES**

Every add-on belongs to exactly one task type. These 5 types exist in every niche — they are the common denominator that makes the library work across all industries.

|  |  |  |
| --- | --- | --- |
| **Task type** | **Definition** | **Example add-ons** |
| Lookup | Read data from a system and report it to the customer | Order status, Booking status, Stock check |
| Action | Execute a task or write to an external system | Refund initiate, Book appointment, Cancel request |
| Info | Answer a question from the knowledge base | FAQ answer, Policy lookup, Product info, Service guide |
| Lead capture | Collect customer information for follow-up | Quote request, Contact form, Service enquiry |
| Escalation | Route to a human or flag urgency | Complaint log, Human handoff, Urgent flag |

**THE 4 NICHE CLUSTERS**

Every niche — current or future — maps to exactly one cluster based on its dominant support task pattern. Build per cluster (70–80% of add-ons shared within a cluster). To place any new niche, read the 'Add here if' condition in the table below.

Build order: C1 + C3 in parallel first · C2 second · C4 third · All 4 complete before production launch.

|  |
| --- |
| **Phase 1 ★:** The 12 niches marked in the green column are the immediate build targets — ad campaigns are already running for these. Always complete Phase 1 niches within a cluster before adding others from that cluster. |

|  |  |  |
| --- | --- | --- |
| **Cluster — add new niches here if...** | **Phase 1 ★ (12 niches, build now)** | **Future expansion** |
| **Appointment & Booking** Build 1st  *Add here if: core support = booking, scheduling, or availability* | **Restaurant**  **Salon**  **Spa**  **Gym**  **Travel agency** | Healthcare  Hospitality  Real estate |
| **Trade & Professional** Build 2nd  *Add here if: core support = inquiries, quotes, or consulting* | **Roofing**  **Plumbing**  **Electrician**  **Cleaning**  **Marketing agency**  **NGO** | Legal  Manufacturing |
| **Commerce & Logistics** Build 1st (parallel)  *Add here if: core support = orders, tracking, returns, or delivery* | **Ecommerce** | Logistics  Retail |
| **Technology & Accounts** Build 3rd  *Add here if: core support = accounts, subscriptions, or technical help* | *none — future only* | SaaS / Tech  Finance / Banking  Education |

**ADD-ON ANATOMY**

Every add-on in the library must have exactly these 5 components. Fill the anatomy template fully before building any Voiceflow flow or n8n workflow — no exceptions.

|  |  |  |  |
| --- | --- | --- | --- |
| **#** | **Component** | **What it defines** | **Example** |
| 1 | Intent triggers | 5–8 NLU phrases that activate this add-on | 'where is my order', 'track parcel', 'order status' |
| 2 | Required inputs | Data needed from customer or system before responding | Order ID or email address |
| 3 | Integration hook | n8n webhook name this add-on calls (or KB section for Info type) | get-order-status |
| 4 | Personalization slots | Client-specific variable values filled at onboarding | Company name, return window, service area |
| 5 | Fallback behavior | What happens if data is missing, API fails, or input is invalid | 'I couldn’t find that order — please check the ID and try again' |

**UNIVERSAL CORE**

The chassis every add-on plugs into. Built first, tested in isolation. Always on for every client. Logic never changes — variable slots are filled per client at onboarding.

CSAT delivery: in-chat immediately after resolution (not async email or SMS).

|  |  |  |  |
| --- | --- | --- | --- |
| **#** | **Capability** | **What it does** | **Variable slots (filled at onboarding)** |
| 1 | Greeting | Welcome message + language detection on first message | agent\_name · greeting\_phrase · language |
| 2 | Detect | Intent classification → routes to the correct add-on. Traffic director of every conversation. | active\_add\_on\_list (which add-ons are enabled for this client) |
| 3 | Fallback | Unrecognized intent → rephrase prompt → retry (max 2) → escalate | fallback\_message · retry\_limit |
| 4 | Escalate | Triggered by: negative keywords, 3+ failures, explicit request. Sends context payload to human agent. | escalation\_contacts · trigger\_keywords · escalation\_message |
| 5 | CSAT | Post-resolution 1–5 rating survey. Sent after every resolved session. In-chat delivery. | survey\_timing · survey\_question |
| 6 | Logging | Full session transcript + metadata written to analytics after every conversation. | retention\_period |

**INTEGRATION PATTERN**

ConvoCore sits at the channel layer. Customers reach the agent through ConvoCore (WhatsApp, Instagram, Facebook Messenger). Voiceflow processes the conversation. n8n handles all business logic, API calls, data writes, and handoffs. The add-on adapter pattern is unchanged — add-ons call generic n8n webhook names, n8n adapts per client platform.

Email is outside ConvoCore. n8n connects directly to Gmail or Outlook API for email triage and the Email Inbox Manager module.

|  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- |
| **ConvoCore**  WA · IG · FB Messenger | **-->** | **Voiceflow Agent**  Conversation, NLU, add-on execution | **-->** | **n8n Hub**  API calls, data sync, escalation alerts | **-->** | **Client Platform**  CRM · Calendar · Shopify · etc. |

Response travels back the same path: client platform → n8n → Voiceflow → ConvoCore → customer.

Webhook naming convention: verb-entity format. Examples: get-order-status, post-appointment-booking, create-refund-request, get-stock-level, create-support-ticket.

|  |
| --- |
| **ConvoCore integrations:** ConvoCore has native Calendar, Calendly, and Outlook integrations. Use these for simple booking confirmations. Use n8n for complex multi-step flows or when avoiding vendor lock-in matters. Do not rely on ConvoCore's native analytics for client reporting — it may capture internal bot-to-Voiceflow messages. Primary analytics source: n8n → Google Sheets. |

**TECH STACK**

|  |  |  |  |
| --- | --- | --- | --- |
| **Layer** | **Tool** | **Role** | **Cost** |
| Channel bridge | ConvoCore (white-label) | Client-facing channel frontend. WA, IG, FB Messenger via Meta auth. Client gets branded dashboard. | Paid — agency plan |
| Email channel | n8n + Gmail / Outlook API | Email triage and inbox management. Handled separately — ConvoCore does not support email. | Free tiers (API) |
| Agent brain | Voiceflow | Conversation design, NLU, flow execution, KB queries | Paid — usage-based |
| Integration hub | n8n (self-hosted) | All API calls, automation, handoffs, CRM sync, logging | ~$10/mo VPS (Hetzner) |
| Knowledge base | Voiceflow KB + Supabase | RAG for FAQs, policies, product info | Free tiers |
| CRM | HubSpot / GoHighLevel / Airtable | Customer history, session tagging, lead recovery sequences | Free or client-provided |
| Ticketing | Freshdesk Free | Escalation ticket tracking | Free (up to 10 agents) |
| Analytics | Google Sheets + Looker Studio | CSAT, volume, add-on performance, Revenue Dashboard | Free |
| Human handoff | Slack / Email via n8n | Escalation alerts with full context payload | Free |

**BUILD SEQUENCE**

Follow this order exactly. Do not skip steps or build out of sequence.

1. **Universal core** — build and fully test all 6 capabilities before touching any add-on.
2. **Add-on anatomy templates** — fill the template for every MVP add-on before any Voiceflow flow is built.
3. **Integration adapter scaffolding** — create all MVP n8n webhooks with correct names (empty workflows are fine at this stage).
4. **MVP add-ons for first cluster** — top 3 add-ons per task type = 15 add-ons maximum. Build, test, publish to library.
5. **KB content** — universal tier, first-cluster tier, and first-client tier uploaded and tested.
6. **First client UAT** — run 5 test cases per add-on. All must pass before go-live.
7. **Monitor, iterate, expand** — fix KB and intent trigger gaps from real sessions, then build the next cluster.

**KEY RULES**

* **One task type per add-on.** Every add-on belongs to exactly one of the 5 task types. No hybrid add-ons.
* **Template before build.** Add-on anatomy template must be completed and reviewed before any Voiceflow flow or n8n workflow is created for that add-on.
* **Core first, always.** Universal core must be fully built and tested before any add-on build begins.
* **Adapter pattern only.** Add-ons call generic webhook names. They never reference client-specific platforms, credentials, or URLs directly.
* **ConvoCore is the channel layer.** All WhatsApp, Instagram, and Facebook Messenger traffic goes through ConvoCore. Never build direct channel API connections. Email connects through n8n directly.
* **Beta before Stable.** All add-on updates go to Beta first. Minimum 14 days with zero critical issues before promoting to Stable and updating existing clients.
* **Cluster not niche.** Build add-ons for entire clusters. One cluster build covers 70–80% of all niches in that group — never build for a single niche in isolation.
* **Anatomy template is the source of truth.** If the template and the built flow disagree, fix the flow.
* **Variable slots, never code changes.** All client customization goes through named variable slots only. Never modify underlying flow logic or structure for a specific client.