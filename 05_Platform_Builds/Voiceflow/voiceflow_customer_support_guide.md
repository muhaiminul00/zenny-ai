# Complete Guide: Building an AI Customer Support Agent on Voiceflow

## Table of Contents
1. [Introduction & Architecture Overview](#1-introduction--architecture-overview)
2. [Agent Configuration (The Brain)](#2-agent-configuration-the-brain)
3. [Skills & Logic (Playbooks & Workflows)](#3-skills--logic-playbooks--workflows)
4. [Conversation Steps (Building Blocks)](#4-conversation-steps-building-blocks)
5. [Knowledge Base (The Memory)](#5-knowledge-base-the-memory)
6. [Tools & Integrations (The Hands)](#6-tools--integrations-the-hands)
7. [Data Management (Variables & Secrets)](#7-data-management-variables--secrets)
8. [Behavior & Settings](#8-behavior--settings)
9. [Framework & Deployment](#9-framework--deployment)
10. [Channels & Interfaces](#10-channels--interfaces)
11. [Measurement & Optimization](#11-measurement--optimization)
12. [Best Practices Checklist](#12-best-practices-checklist)

---

## 1. Introduction & Architecture Overview

Voiceflow is a platform for building, testing, deploying, and monitoring reliable chat and voice agents across any channel or language. For customer support, you need to configure several layers that work together:

**Layer Architecture:**
```
┌─────────────────────────────────────┐
│  GLOBAL PROMPT (Identity & Personality) │  ← Runs EVERY turn
├─────────────────────────────────────┤
│  INSTRUCTIONS (Routing & Decision Making) │  ← Decides WHAT to do
├─────────────────────────────────────┤
│  PLAYBOOKS (Flexible, AI-driven skills)   │  ← Open-ended tasks
│  WORKFLOWS (Deterministic, step-by-step)  │  ← Structured processes
├─────────────────────────────────────┤
│  TOOLS (APIs, Integrations, Functions)    │  ← External actions
├─────────────────────────────────────┤
│  KNOWLEDGE BASE (Documents & Data)        │  ← Information retrieval
├─────────────────────────────────────┤
│  DATA (Variables, Secrets, Personas)      │  ← State & context
└─────────────────────────────────────┘
```

---

## 2. Agent Configuration (The Brain)

### 2.1 Global Prompt
**What it is:** The foundational identity of your agent. Applied to EVERY single turn of every conversation, regardless of which playbook or workflow is active.

**What it controls:**
- **Personality** - Who the agent is (vocabulary, attitude, formality)
- **Goal** - Primary objective (e.g., "Resolve issues on first contact")
- **Tone** - How the agent sounds (conversational, empathetic, efficient)
- **Guardrails** - Hard boundaries (what NOT to do)

**Best Practices:**
- Keep it 100-300 words (short = less latency, better focus)
- Be specific about WHO the agent is, not just what it does
- Use declarative statements, not suggestions
- Don't put step-by-step procedures here (move to workflows)
- Don't repeat task-specific instructions (move to playbooks)

**Example for Customer Support:**
```
# Role
You are a senior support specialist for Acme Corp. You've been helping customers for years and genuinely enjoy solving problems. You're patient with confused customers and direct with experienced ones.

# Goal
Help customers resolve their issues as quickly as possible. Prioritize first-contact resolution. If you can't resolve the issue, make sure the customer feels heard and knows exactly what happens next.

# Tone
Conversational and warm, but not overly casual. Match the customer's energy — if they're frustrated, be calm and empathetic. If they're upbeat, be friendly. Keep responses to 2-3 sentences unless the customer asks for more detail.

# Guardrails
Never guess at order status, delivery dates, or stock levels
Never share internal pricing logic or margin info
Never process a refund without confirming details with the customer first
Never override return window policies — escalate instead
```

**Variables in Global Prompt:**
You can inject dynamic context using variables like `{customer_name}`, `{pricing_tier}`, `{vf_now}` (timestamp), `{vf_user_timezone}`. This enables personalization from the first message.

### 2.2 Instructions
**What it is:** The decision-making layer. Defines WHEN the agent does things and which skills/tools to use.

**What it controls:**
- Routing logic (which playbook/workflow to call)
- Tool selection (when to use which tool)
- Starting message behavior

**How it works:**
Every playbook, workflow, and tool has a **Name** and **LLM Description**. The agent reads these to decide what to use.

**Best Practices:**
- Put both WHAT and WHEN in the LLM description
- Use Instructions for additional context, routing reminders, and ordering
- Keep routing rules clear and specific

**Example:**
```
# Routing
Route to Order Status playbook if the customer asks about an existing order, delivery, or tracking information.
Route to Returns workflow if the customer wants to return, exchange, or get a refund.
Route to Product Info playbook if the customer asks about product details, availability, or compatibility.
If the request doesn't fit any tool, let them know what you can help with and ask them to rephrase.
```

---

## 3. Skills & Logic (Playbooks & Workflows)

### 3.1 Playbooks
**What it is:** Autonomous, goal-based conversations with tool calling. The agent decides how to navigate based on context, intent, and goals.

**When to use:**
- Flexibility matters more than predictability
- The conversation is open-ended
- The agent needs to reason about what to do
- There are many possible paths

**Components of a Playbook:**
- **Instructions** - Goal-specific behavior and reasoning
- **Tools** - Which tools this playbook can access
- **System Tools** - Toggle which native tools are available (Knowledge base, Buttons, Cards, Carousels, Forms, Web search, End)
- **Exit Conditions** - When to hand off to another playbook/workflow

**Example Playbooks for Support:**
- Order Status Agent
- Returns & Refunds Agent
- Product Recommendations Agent
- Technical Troubleshooting Agent

### 3.2 Workflows
**What it is:** Visual, step-by-step conversation flows with branching, conditions, and integrations. Deterministic execution.

**When to use:**
- Predictability matters more than flexibility
- The process has strict business logic
- Steps are the same every time
- There's one or a few correct paths

**Key Feature:** Workflows can embed Playbooks and other AI-powered steps inside them, giving you deterministic control with AI reasoning where needed.

**Recommendation:** Start with Playbooks for flexibility, then add Workflows later for specific processes that need structure.

---

## 4. Conversation Steps (Building Blocks)

Steps are organized into four categories:

### 4.1 Agentic Steps (AI-powered)
| Step | What it does |
|------|-------------|
| **Playbook** | Embeds an AI-driven playbook inside a workflow |
| **Crew** | Multi-agent collaboration (multiple playbooks working together) |
| **Operator** | AI reasoning step that decides next action based on context |

### 4.2 Scripted Steps (Deterministic UI)
| Step | What it does |
|------|-------------|
| **Message** | Sends a single message (static or AI-generated). Can wait for user input |
| **Card** | Displays a rich card with image, title, description, and buttons |
| **Carousel** | Displays multiple cards in a scrollable carousel |
| **Buttons** | Shows quick-reply button options |
| **Listen** | Captures user input and saves to a variable |

### 4.3 Tool Steps (External Actions)
| Step | What it does |
|------|-------------|
| **Integration** | Calls pre-built connectors (Zendesk, Salesforce, etc.) |
| **MCP** | Calls Model Context Protocol server tools |
| **API** | Makes raw HTTP requests to external REST APIs |
| **Function** | Runs custom JavaScript logic |

### 4.4 Logic Steps (Flow Control)
| Step | What it does |
|------|-------------|
| **Set** | Sets variables or properties |
| **Condition** | Creates branching paths based on variable comparisons |
| **Code** | Runs custom JavaScript for complex logic |
| **Workflow** | Calls another workflow |
| **End** | Terminates the conversation |
| **Handoff** | Transfers to a human agent |
| **Call Forward** | Forwards phone calls |

---

## 5. Knowledge Base (The Memory)

### 5.1 Importing Data Sources
**What it is:** Upload documents, URLs, and data to ground your agent's responses in real information via RAG (Retrieval-Augmented Generation).

**Supported Data Types:**
| Type | What it imports | Best for |
|------|----------------|----------|
| **Web page(s)** | One or more URLs | Specific help articles |
| **Sitemap** | All pages from a site | Full help centers, doc sites |
| **Docs** | PDF, TXT, DOCX (up to 10MB) | Policies, manuals |
| **Table** | CSV, XLSX (up to 10MB) | Structured product data, FAQs |
| **Plain text** | Raw pasted content | Quick notes, temporary info |
| **Zendesk** | Articles from Zendesk KB | Existing support content |
| **Shopify** | Product catalogs, inventory | E-commerce support |

**Refresh Rate:** Set automatic syncing (Never, Daily, Weekly, Monthly) to keep content current.

### 5.2 Querying the Knowledge Base
**System Tool:** Enable the Knowledge Base toggle in your Agent's System Tools.

**Configuration Options:**
- **LLM Description** - When to use the knowledge base (default: "Use this tool when answering any question about your company, product, service, or purpose")
- **Custom Query** - Override the search query with a variable or reformulated version
- **Query Rewriting** - Enable to improve retrieval for conversational/ambiguous inputs
- **Chunk Limit** - Number of content chunks returned (1-10, default 3). Higher = more context but more latency
- **Metadata Filtering** - Filter by tags to serve different content to different user types
- **Tool Messages** - Customize what users see during query (Start, Complete, Fail, Delay states)
- **Show Source URLs** - Include source links in responses (chat only)

**Best Practice:** Start with chunk limit of 3, increase if agent misses relevant information.

---

## 6. Tools & Integrations (The Hands)

### 6.1 Tool Types
| Type | Description | Use Case |
|------|-------------|----------|
| **API Tool** | Connect to external REST APIs | Custom backend integrations |
| **Function Tool** | Write custom JavaScript logic | Data transformation, calculations |
| **Integration Tool** | Pre-built connectors | Quick CRM/helpdesk connections |
| **MCP Tool** | Model Context Protocol servers | Standardized multi-tool access |
| **Global Tool** | Available across all playbooks | Cross-cutting capabilities |
| **System Tool** | Native Voiceflow tools | Knowledge base, buttons, cards, etc. |

### 6.2 Available Integration Tools
| Integration | Actions |
|-------------|---------|
| **Zendesk** | Create/find/update tickets, add comments, lookup users/groups |
| **Salesforce** | Create/update contacts, leads, cases; add comments |
| **HubSpot** | Create/update contacts, deals, tickets |
| **Shopify** | Lookup orders/products/customers, cancel/update orders |
| **Twilio** | Send SMS messages |
| **Airtable** | Read/create/update records |
| **Make** | Trigger scenarios and pass data |
| **Gmail** | Send emails and create drafts |
| **Google Sheets** | Read and write rows |

### 6.3 Global Tools
**What it is:** Tools added at the Agent level, available in any playbook throughout your agent without adding them individually.

**When to use:**
- CRM lookup any playbook might need
- Ticketing API used across multiple support flows
- Shared data formatting functions

**Note:** Global tools only work in agentic contexts (playbooks, crews), NOT in scripted workflow steps.

---

## 7. Data Management (Variables & Secrets)

### 7.1 Variables
**What it is:** Store user inputs, API responses, and conversation state to personalize interactions.

**Built-in Variables:**
- `{vf_now}` - Current timestamp
- `{vf_user_timezone}` - User's timezone
- `{user_id}` - Unique user identifier
- `{last_event}` - Last interaction event payload
- `{vf_memory}` - Conversation history (condensed when exceeding memory limit)

**Custom Variables:** Create your own to store customer data, order IDs, preferences, etc.

**Setting Variables:**
- Use the **Set** step in workflows
- Capture from user input with **Listen** step
- Store API responses from tool steps
- Pre-fill via widget API or Conversations API

### 7.2 Secrets
**What it is:** Securely store API keys and credentials for use in tools and integrations.

**How to use:**
- Store in Settings → Secrets
- Reference in API tools and integrations
- Never expose in transcripts or logs

### 7.3 PII Redaction
**What it is:** Automatically detects and removes personally identifiable information from production transcripts.

**How it works:**
- Replaces names, emails, phone numbers, financial details with markers like `[NAME]`, `[EMAIL_ADDRESS]`
- Uses ML model hosted within Voiceflow (no third-party sending)
- Production-only (development/test conversations not redacted for debugging)
- Not retroactive (only affects future conversations)
- Unredacted view available for 48 hours after conversation

**Enable:** Settings → Security (requires add-on subscription)

### 7.4 Personas
**What it is:** Define different user types or customer segments that affect how the agent responds.

**Use cases:**
- Premium vs. standard customers
- Different regions/languages
- B2B vs. B2C support styles

---

## 8. Behavior & Settings

### 8.1 Model & Reasoning
| Setting | What it controls |
|---------|-----------------|
| **Default Model** | Primary LLM (Claude, GPT, Gemini, etc.) |
| **Temperature** | Creativity vs. determinism (0 = consistent, 1 = creative) |
| **Max Tokens** | Maximum response length per turn |
| **Memory** | Conversation turns kept in context (10-100, default 50) |
| **Faster Processing** | Speed vs. cost trade-off |
| **Outage Protection** | Fallback LLM provider if primary goes down |
| **Timezone** | Agent's internal clock for time-aware behavior |

**Memory Best Practice:** Most agents work well at 25-50 turns. Excess memory is condensed and summarized, not lost.

### 8.2 Default Guidelines
Voiceflow provides default response formatting guidelines:
- One idea per paragraph, separated by blank lines
- No bold, italics, headers, or markdown emphasis
- Bullets only for 3+ parallel items
- Emoji only if the user uses them

---

## 9. Framework & Deployment

### 9.1 Choosing a Framework
**Agentic (Recommended):** AI-driven with playbooks and workflows. Best for complex, multi-turn conversations.
**Conversational Flow:** More deterministic, scripted interactions. Best for simple, linear flows.

### 9.2 Initialization Workflow
**What it is:** A workflow that runs at the start of each conversation before the agent begins talking.

**Use cases:**
- Identify the user and pull their profile
- Check recent orders or account status
- Set variables for personalization
- Verify authentication

**Example:** Pull customer record → Set `{customer_name}`, `{pricing_tier}`, `{recent_orders}` → Agent greets with personalized context

### 9.3 Environments
**What it is:** Branching model for agent development with staging, A/B testing, and gradual rollouts.

**How it works:**
1. Clone production environment
2. Develop changes in isolation
3. Route small % of traffic to new version
4. Compare analytics and transcripts
5. Merge when confident

**Traffic Splits:** Configure in Settings → Environments to gradually roll out changes.

---

## 10. Channels & Interfaces

### 10.1 Web Chat Widget
**Installation:** Copy snippet from Widget settings, paste into your website HTML.

**Customization Options:**
- Colors, icons, launcher style, interface type
- Placeholder text and privacy policy links
- Modality: Chat (default) or Voice
- Security: Approved domains, legal disclaimer, transcript saving
- Branding removal (Business plan+)

**Widget API Methods:**
| Method | Description |
|--------|-------------|
| `load()` | Initialize widget |
| `open()` / `close()` | Open/close chat window |
| `show()` / `hide()` | Show/hide widget |
| `interact()` | Send simulated user action |
| `proactive.push()` | Send proactive messages |
| `destroy()` | Reset widget |

**Advanced Features:**
- **Extensions** - Add custom UI elements (forms, file uploads, date pickers, maps, video)
- **Custom CSS** - Override widget styling with your own CSS
- **Chat Persistence** - localStorage (default), sessionStorage, or memory
- **Custom User ID** - Pass unique IDs for user tracking
- **Custom Variables** - Pre-fill context on load

### 10.2 Phone Integration
**Providers:** Voiceflow (US/Canada), Twilio, Vonage, Telnyx

**Inbound Calling:**
- Connect phone number → Routes to agent
- Caller ID automatically set as `{user_id}`
- Can point numbers to specific environments or drafts for testing

**Outbound Calling:**
- Trigger via API POST to runtime endpoint
- Pass custom variables (name, account info)
- Include compliance disclosures for automated calls
- Answering machine detection available

**Important:** Outbound calls may violate regulations without consent. Always include opt-in and disclosure.

### 10.3 Custom Interfaces
**Conversations API:** Programmatically interact with your agent via HTTP.

**Use cases:**
- Build custom chat UIs
- Integrate with mobile apps
- Connect to WhatsApp, Discord, Slack, Telegram
- Embed in existing applications

**Key Endpoints:**
- Interact (stream and non-stream)
- Get/Update/Delete conversation state
- Start session / Emit session event

---

## 11. Measurement & Optimization

### 11.1 Transcripts
**What it is:** Full conversation history with messages, call recordings, logs, metadata, and evaluation scores.

**Features:**
- Attach custom properties for filtering (plan tier, topic, sale made)
- Customize table view columns
- Batch run evaluations on historical transcripts
- Save test conversations for QA

### 11.2 Evaluations
**What it is:** AI-powered analysis of transcripts based on criteria you define.

**Default Evaluations:**
- **Customer Satisfaction** - Rates satisfaction 1-5 based on tone and content
- **Deflection Rate** - Whether issue was resolved without human intervention
- **Resolution Rate** - Whether agent fully resolved the issue

**Custom Evaluations:**
- **Rating** - Numeric scale (e.g., 1-5)
- **Binary** - Pass/fail
- **Options** - Categorical outcomes
- **Text** - Free-form analysis/summaries

**Models:** GPT-4o mini (default), or choose from multiple LLM options.

### 11.3 Tests & Simulations
**Conversation Profiler:**
- **Traditional Testing** - Predefined interactions with exact response validation
- **Agent-to-Agent Testing** - AI simulates realistic user conversations
  - OpenAI-powered (dynamic, varied behavior)
  - Voiceflow Agent-powered (consistent, reproducible)

**Use cases:**
- Regression testing
- Edge case discovery
- CI/CD pipeline integration
- Quality assurance

### 11.4 Analytics
**What it tracks:**
- Runtime performance
- Response times
- Token usage
- Routing accuracy
- Conversation volume
- Resolution rates
- Handoff rates

---

## 12. Best Practices Checklist

### Agent Identity
- [ ] Write a concise Global Prompt (100-300 words)
- [ ] Define specific personality, not generic "be helpful"
- [ ] Set clear goals and guardrails
- [ ] Use variables for personalization
- [ ] Keep task-specific logic out of global prompt

### Routing & Skills
- [ ] Write clear LLM descriptions for every playbook/workflow/tool
- [ ] Include both WHAT and WHEN in descriptions
- [ ] Use Instructions for routing reinforcement
- [ ] Start with Playbooks, add Workflows for strict processes
- [ ] Create specialized playbooks for different support topics

### Knowledge Base
- [ ] Import FAQ docs, help articles, policies
- [ ] Set appropriate refresh rates
- [ ] Use metadata filtering for different user segments
- [ ] Start with chunk limit of 3, adjust as needed
- [ ] Enable query rewriting for conversational inputs

### Tools & Integrations
- [ ] Add frequently-used tools as Global Tools
- [ ] Use Integration Tools for quick CRM/helpdesk connections
- [ ] Write clear tool descriptions for LLM decision-making
- [ ] Store API keys in Secrets, never hardcode

### Data & Security
- [ ] Create variables for user data, order info, preferences
- [ ] Use initialization workflow to pre-populate context
- [ ] Enable PII redaction for production
- [ ] Set up proper secrets management

### Deployment
- [ ] Use environments for staging and A/B testing
- [ ] Configure traffic splits for gradual rollouts
- [ ] Test draft changes with phone numbers pointed to draft
- [ ] Monitor analytics after deployment

### Measurement
- [ ] Enable default evaluations (CSAT, deflection, resolution)
- [ ] Create custom evaluations for business-specific metrics
- [ ] Review transcripts regularly for edge cases
- [ ] Run agent-to-agent simulations before major updates
- [ ] Track handoff rates and reasons

### Customer Experience
- [ ] Design clear handoff paths to human agents
- [ ] Include fallback responses for unknown queries
- [ ] Test on real devices (phone calls, mobile chat)
- [ ] Monitor for repetitive failures and update knowledge base
- [ ] Keep response length appropriate (2-3 sentences default)

---

## Quick Reference: What Each Component Does

| Component | Analogy | Purpose | When to Configure |
|-----------|---------|---------|-----------------|
| **Global Prompt** | Agent's DNA | Personality, tone, rules | First thing you set |
| **Instructions** | Manager's brief | Routing decisions | After setting up playbooks/workflows |
| **Playbooks** | Skilled specialists | Flexible, AI-driven tasks | For open-ended support topics |
| **Workflows** | Assembly lines | Deterministic processes | For strict business logic |
| **Knowledge Base** | Agent's library | Information retrieval | After building basic agent structure |
| **Tools** | Agent's hands | External actions | When agent needs to DO things |
| **Variables** | Agent's notepad | Store conversation state | Throughout building process |
| **Secrets** | Agent's vault | Secure credentials | When adding API integrations |
| **Evaluations** | Quality inspector | Performance scoring | Before going live |
| **Environments** | Staging areas | Safe deployment | Before production launch |

---

*This guide is based on Voiceflow documentation as of June 2026. For the latest updates, visit docs.voiceflow.com*
