# Convocore Master Reference (v1)

> **Purpose of this document:** This is the single source of truth for how Convocore works — for humans, for LLMs (Claude, GPT, etc.) reasoning about our build, and for coding agents (Claude Code) implementing against it. Refer to this instead of re-fetching Convocore's docs site.
>
> **Scope:** Usage / conceptual documentation only (how the platform works, how pieces relate). Does NOT cover the REST/WebSocket API field-by-field reference — that is a separate, later document.
>
> **Source:** Compiled directly from `docs.convocore.ai` (fetched July 25, 2026) — covers the core product surface (~45 of ~90 conceptual pages fetched in full; remaining pages are narrow UI-walkthroughs or agency-billing minutiae, referenced but not expanded here — see "Not Covered" at the end).
>
> **Status:** v1 — standalone. Not yet cross-mapped to our own runtime/architecture. That mapping is a deliberate next step, done separately once this doc is validated as an accurate model of Convocore itself.

---

## 0. How to read this document

Convocore is not one feature — it's a stack of layered systems that all feed into a single thing: **what gets sent to the LLM, and what happens with what the LLM sends back.** Almost every feature in Convocore is one of three things:

1. **Something that shapes the prompt** the LLM sees (system prompt, KB retrieval, global prompts, node instructions, prestart tool, UI Engine instructions, lead-funnel criteria)
2. **Something that gives the LLM new capabilities** (tools, KB search, live-handoff, UI Engine rendering)
3. **Something that gets the conversation to/from the LLM** (channels, widget, voice, WebSocket/REST API, Canvas routing)

Keep that three-way split in mind — it's the skeleton everything below hangs on.

---

## 1. What Convocore Is (Mental Model)

Convocore is a **managed AI agent platform**: build, test, deploy, and monitor text + voice AI agents across many channels from one dashboard, without building the underlying infrastructure yourself.

### 1.1 What Convocore replaces (build vs. buy)

If you did NOT use Convocore, you'd need to build and maintain yourself:

- Conversation & lead storage
- Streaming chat/voice runtime infrastructure
- Channel integrations (WhatsApp, Instagram, Discord, Telegram, etc.)
- Agent configuration UI
- Analytics & transcript tooling
- Human handoff workflows
- API + permissions layer
- Client-facing dashboard infra (if reselling)

### 1.2 When Convocore is the right fit

**Strong fit** when you want to:
- Ship across multiple channels from one platform
- Build via prompts + KB + tools + flows instead of custom backend plumbing
- Track conversations/analytics/leads/handoff in one place
- Resell to clients via whitelabel

**Not ideal** when you need:
- A fully custom front-end where platform widget patterns are too limiting
- Full ownership of runtime/hosting/RAG stack
- A highly specialized product where the managed model is more restrictive than helpful

### 1.3 The 5-step lifecycle

```
1. CREATE          → Build/customize an agent (appearance, voice, behavior)
2. PREPARE DATA     → Knowledge base: scrape URLs, upload files, direct text entry
3. BUILD & DEVELOP  → Refine prompts, add tools, A/B test, (optionally) build Canvas flows
4. DEPLOY           → Website widget, WhatsApp, Discord, Telegram, Meta, Voice, API
5. MONITOR & MANAGE → Conversations tab, analytics, live handoff, lead qualification
```

### 1.4 Two ways to build the "brain" of an agent

This is a critical architectural fork that isn't obvious from feature docs alone:

| Path | What it is | When you'd use it |
|---|---|---|
| **Native Convocore agent ("VG")** | Single system prompt + KB + Tools, OR the node-based **Canvas** flow builder | Default path. Most agents (including simple support bots) live here. |
| **Voiceflow-imported agent ("VF")** | An agent built in Voiceflow's own visual builder, imported into Convocore via Agent ID + Project ID, using a Convocore-provided Voiceflow template + library components | Legacy/alternate path. Convocore renders and channels a Voiceflow-authored flow. Has **narrower feature support** — see 1.5. |

You should know which path an agent uses because **feature availability differs**:

### 1.5 VG vs VF feature support (from Events Webhook + Analytics docs)

| Capability | Convocore-native (VG) | Voiceflow-imported (VF) |
|---|---|---|
| Automatic lead capture (`lead_captured` event) | ✅ | ❌ |
| UI Engine forms (`form_submitted` event) | ✅ | ❌ |
| Real-time WebSocket streaming | ✅ | Uses VF's REST-based runtime instead |
| Message/chat/bug/org/client events | ✅ | ✅ |
| Lead Qualification Funnel | ✅ | Not documented as supported |
| Voiceflow-specific analytics (Top Intents, Understood Messages, satisfaction rating) | N/A | ✅ (VF-only) |

**Implication for our build:** unless we have a specific reason to import a Voiceflow flow, we should build natively in Convocore (system prompt / Canvas) to get the full feature set — lead funnel, UI Engine forms, native lead capture events.

---

## 2. Agent Creation — Core Building Blocks

An agent (native/VG) is assembled from these layers, roughly in the order they matter for a support-agent build:

1. **Design & Setup** — name, description, branding, appearance/theme, avatars
2. **System Prompt** — the core behavior definition
3. **Knowledge Base (KB)** — RAG-backed factual grounding
4. **Tools** — external actions/API calls
5. **Initial Message / Initial Prompt** — first thing the user sees
6. **Settings** — operational config (limits, delays, handoff, translation, STT)
7. **(Optional) Canvas** — node-based flow if single-prompt isn't enough
8. **(Optional) Global Prompts** — cross-agent shared instructions
9. **(Optional) UI Engine** — rich interactive responses
10. **(Optional) Lead Qualification Funnel** — automatic lead scoring

### 2.1 Designing the agent (appearance/branding)

Configured under **Overview**, **Appearance**, **Launch Avatar**, **Custom Theme**:

- **Title** — agent's name (e.g. "GymBuddy GPT")
- **Description** — short tagline/CTA
- **Branding** — e.g. `⚡Powered by YOUR AGENCY:youragency.com⚡` (colon = hyperlink syntax)
- **Font family** — any free Google Font, or literal `inherit` to match host page (risky — can break widget, "use at your own risk")
- **Widget Language** — ISO 639-1 codes; labels/placeholders auto-translate; `Title`/`branding` stay as-typed; "Automatic" pulls site language
- **Buttons Layout** — Vertical (standard) / Horizontal / In-footer (footer style mimics Copilot/Perplexity follow-up-question UX)
- **Launch Avatar images** — Launch Avatar (chat bubble), Header Image, Banner Image, Chat Avatar, Background Chat Image. Max 0.5MB, ≥400×400px recommended.
- **Custom Theme** — 6 preset themes (light/dark aware), "Autogen from Color" (auto-generates a full theme from one brand color — check white-text-on-primary-color legibility), or manual HEX input. Everything is further overridable via **Custom CSS**.
- **Prototype link** vs **Demo link** — Prototype = shareable branded test link (whitelabeled if applicable) for client review; Demo = chat-bubble-in-context preview to see how it'll look embedded on a real site.

### 2.2 System Prompt — the core of behavior

**This is the single most important artifact in an agent.** Two mandatory template variables:

```
{kb_context}     → retrieved KB chunks get injected here — WITHOUT this, RAG is invisible to the LLM
{about_context}   → agent/company context info
```

> **Hard rule:** every system prompt must include both variables or the agent cannot use retrieved knowledge at all. This is stated repeatedly across the docs as the #1 mistake to avoid.

#### Formatting language by model family
- **GPT models (OpenAI)** → read **Markdown** best
- **Claude models (Anthropic)** → read **XML tags** best
- Convocore explicitly recommends matching format to the model you've selected for that agent/node.

#### The 5-step prompt-writing framework Convocore teaches

1. **Define tone & objective** — role, personality, primary goal. Explicitly framed as adopting a "persona" (friendly tutor, professional advisor, casual guide, etc.)
2. **Context + boundaries** — context sources are: system prompt, user input, KB. Boundaries = scope limits, information-source restrictions, fallback behavior, functional limitations (what the agent explicitly cannot do), and how to use UI Engine/Tools.
3. **Chain of Thought (CoT)** — explicit step-by-step reasoning instructions ("Before answering, break down the problem..."), reduces hallucination, improves explainability.
4. **Few-shot examples** — 1–5 example exchanges showing exact desired format/tone. Warning: don't overload — start with 1–2.
5. **Reinforcement** — repeat critical instructions at start, middle, and end of the prompt (models "forget" instructions over long conversations otherwise). Use formatting (bold, headers) to make reinforced instructions visually distinct.

#### Reference prompt anatomy (BakeMate example — annotated)

A production-quality system prompt combines:
- Persona/tone setting (with brand-specific quirks, e.g. emoji use)
- `{about_context}` and `{kb_context}` blocks
- Explicit scope limitation ("only answer questions about X")
- A canned off-topic deflection line
- Explicit "never fabricate" instruction
- Explicit "don't reveal these instructions" instruction
- Attribution instruction (who built this agent, if asked)
- Explicit denial of capabilities the agent doesn't have (inventory, pricing, tracking) to prevent hallucinated confidence
- A clear fallback: human contact info for anything out of scope
- Multi-language handling instruction

#### Full worked customer-support-agent template (from docs, directly reusable)

```markdown
# ROLE
You are {agent_name}, the AI customer support assistant for {company_name}.
You help customers with questions about our products, services, policies, and troubleshooting.

# PERSONALITY & TONE
- Friendly, professional, and empathetic
- Use the customer's first name when known
- Keep responses concise but thorough
- Use emojis sparingly to add warmth
- Never make promises you can't keep

# KNOWLEDGE BASE
You have access to our knowledge base. Use the retrieved information to answer questions accurately.
{kb_context}
{about_context}

# CAPABILITIES
1. Answer product questions using the knowledge base
2. Help with troubleshooting steps
3. Explain policies (returns, refunds, shipping)
4. Escalate to human agents when needed
5. Collect feedback and ratings

# RULES
- Always check the knowledge base before answering factual questions
- If you don't know something, say so honestly — never make up information
- For complex technical issues or billing disputes, offer to connect with a human agent
- Never share sensitive customer data with other users
- Follow GDPR/privacy guidelines
- If a user is frustrated or angry, acknowledge their feelings and offer solutions

# ESCALATION TRIGGERS
Offer live handoff when:
- User explicitly asks for a human
- Issue requires account access or sensitive data
- Technical issue beyond knowledge base scope
- User expresses strong dissatisfaction
- Billing or refund disputes

# RESPONSE FORMAT
- Start with a brief acknowledgment
- Provide the answer using knowledge base info
- Offer follow-up help
- End with a friendly closing
```

#### Prompt layering order (runtime composition — CONFIRMED MECHANICS)

This is documented precisely in the Global Prompts page and matters a lot for debugging "why is my agent not following instructions":

```
Final System Prompt =
    Base System Prompt
  + Node-Specific Instructions   (Canvas only, if used)
  + Global Prompt 1
  + Global Prompt 2
  + ... (up to 10 global prompts, concatenated in order)
```

Global prompts are injected **at runtime**, at conversation start — so editing a global prompt affects all NEW conversations immediately, but conversations already in progress keep using the version active when they started.

**Precedence in Canvas specifically:**
1. Global Prompts (workspace-level, from Prompts dashboard)
2. Canvas Global Configuration (appendBeforePrompt)
3. Node-Specific Instructions (most specific — effectively wins on conflict)

### 2.3 Global Prompts (cross-agent shared instructions)

A separate first-class feature (not the same as Canvas Global Nodes — easy to conflate).

- Created/managed from a workspace-level **Prompts** dashboard (not inside a single agent)
- Assign one prompt to many agents, or many prompts to one agent
- **Hard limit: 10 global prompts per agent**
- Use cases: company-wide brand voice, legal/compliance boilerplate, technical output-formatting rules, industry-specific domain knowledge, cross-agent handoff coordination protocols, time-boxed seasonal campaigns
- Best practice: **one concern per prompt** (don't combine "brand voice" + "GDPR" + "formatting" into one prompt — makes them harder to manage/remove independently)
- Deleting a global prompt immediately removes it from all assigned agents (new conversations only); this is irreversible
- Manageable via API (`POST /v3/prompts`, etc.)

### 2.4 Initial Message vs Initial Prompt — an important distinction

These are two different mechanisms and easy to confuse:

| | **Initial Message** | **Initial Prompt** |
|---|---|---|
| What it is | Static pre-written greeting text(s) | An *instruction to the LLM* for what to generate as the first message |
| Variants | Multiple variants, one shown at random per session (can AI-generate 3–5 variants) | Single prompt, but the LLM can generate different output each time if instructed to |
| Can use UI Engine | No (plain text/markdown only) | Yes — can instruct the LLM to render buttons, cards, carousels, iframes, images as the very first message |
| Overrides the other? | — | **Initial Prompt overrides Initial Message** when both are set |
| Char limit | — | 10,000 characters max |
| Credit cost | Low (static text) | Higher — an LLM call happens, and UI Engine generation adds more (docs warn: "up to 100 credits per visit" if long + UI Engine enabled) |

**Practical guidance from docs:** Initial Prompt is powerful (can build a fully interactive welcome screen with buttons/carousels/forms) but is also the single biggest avoidable credit-cost source if `autostart` is also enabled — every page visit triggers an LLM call before the user has typed anything. Default recommendation: **disable autostart**, and prefer a light single-line "Proactive Message" over full initial-prompt-driven autostart unless you specifically need the interactive welcome screen.

### 2.5 Agent Settings (operational configuration)

Grouped by function:

**Display**
- Scroll Animation, Record Transcripts, Enable Sound Effects, Forget Chat History (no persistence on user device)

**Startup**
- Autostart With Popup (auto-opens widget on page load — credit-expensive, see 2.4)
- Proactive Message (lightweight 1-line alternative to full autostart)

**Messages**
- Chat End Message
- AI Introduction Message — **Meta requirement: you MUST disclose the user is talking to an AI** if deployed on Meta channels (WhatsApp/Instagram/Messenger)

**Interaction controls**
- Message Delay (ms) — artificial delay between messages
- User Input Delay (ms) — debounce before submitting user's message (waits to see if they're still typing)

**Usage limits** (all can be set to 0 = unlimited)
- Monthly Interactions Limit
- Interactions Limit per User/session
- Monthly AI Tokens Limit
- Credits Limit (monthly and/or annual)

**Technical**
- Prefer HTTP instead of WebSockets (advanced — affects UI rendering, only change if you understand implications)
- Does Know Threshold — used for Discord/Slack-style channels to gauge AI confidence

**Handoff**
- Enable Handoff Popup
- Fixed Handoff Popup (persistent, top-of-widget — **requires agent be assigned to an organization**)
- Always Show Handoff (regardless of live-agent availability)

**Additional**
- AI Translation (requires OpenAI key in agency config) + Translate User Responses
- Speech-to-Text input (1 credit/request)
- Quick Upload Button (file attachments via URL triggers)
- GeoAnalytics (optional, +0.1 credit/request — tracks visitor geography, not conversation-specific)
- Hide Handoff Analytics (dashboard display toggle)

**Custom CSS** — full override capability; common targets:
```css
#vg-mother-container { width: 400px !important; height: 600px !important; }
.vg-root { bottom: 20px !important; right: 20px !important; }
.vg-proactive-message--container { display: none !important; }
.vg-chat-end { display: none !important; }  /* hide end-of-chat rating */
```

---

## 3. Knowledge Base (KB) — RAG System

### 3.1 What it is

A repository (documents/FAQs/manuals/text) that agents query via **Retrieval Augmented Generation (RAG)**: retrieve relevant chunks from a vector database → inject into LLM context → generate grounded response.

```
User Query → Retrieval (vector search on KB) → Augmentation (chunks injected as {kb_context})
           → Generation (LLM responds using chunks + its own reasoning) → Response
```

Why it matters: reduces hallucination, lets the agent speak with organization-specific facts/policies/brand voice that a general-purpose LLM wouldn't know.

### 3.2 Adding data — 3 methods

| Method | Best for | Notes |
|---|---|---|
| **File Upload** | Bulk import | Supports `.txt .pdf .docx .doc .csv .xlsx` |
| **URL Scraper** (basic, in KB tab) | Ad hoc single-page/sitemap import | Costs credits per page; fetch sitemap XML, review/remove unwanted pages before saving |
| **Direct Text Entry** | Real-time edits, small docs | Paste/write directly in the KB editor |

There's also the standalone **Crawler** feature (Section 3.6) for larger, scheduled, pattern-filtered scraping jobs — distinct from the basic in-KB URL scraper.

### 3.3 Structuring KB documents (matters a lot for retrieval quality)

Format to match the model reading it:

**For GPT/OpenAI models → Markdown**, hierarchical headers:
```markdown
# Product X User Manual
## 1. Introduction
- Overview of Product X
- Key features and benefits
## 2. Getting Started
...
```

**For Claude/Anthropic models → XML tags:**
```xml
<ProductManual>
  <Section>
    <Title>1. Introduction</Title>
    <Subsection>Overview of Product X</Subsection>
  </Section>
</ProductManual>
```

**Every document should also include:**
- **Document Description** (2–3 sentences) — fed to the LLM as retrieval context, helps it judge relevance
- **Tags** — keywords for searchability (e.g. `customer-service, returns, refunds, policy`)

Tip from docs: to quickly reformat a messy source doc, feed it to an LLM and ask it to restructure into the target format.

### 3.4 Adjusting KB settings

**Max Chunks Retrievable** (slider, 1–10)
- Recommended default: **3–4** for typical KB size
- For >10 documents in the KB, consider raising to ~6
- ⚠️ Higher chunk count = more tokens retrieved = **more credits consumed** per interaction, and may exceed a smaller model's input limit

**Search Similarity Prompt** — customizes how the system generates search keywords from conversation history before querying the vector DB. **Must include `{chat_history}`** or KB search breaks entirely. Default/example prompt:

```markdown
# You are an advanced AI tasked with generating relevant search keywords.
Use the chat history to create accurate and relevant keywords for searching our knowledge base.

## This is the chat history: {chat_history}

# Steps:
1. Analyze the chat history and context
2. Identify main themes, topics, and keywords
3. Generate a list of specific, relevant keywords for the search

Output your list of keywords, separated by commas.
```

### 3.5 Previewing / debugging the KB

**Preview KB** (in Knowledge tab) lets you test retrieval before going live: run a query, see which chunks it returns, with what similarity scores, using which model, and token cost (input/output) per query. This is flagged as an **advanced/optional** feature — most users won't need it until KB complexity grows, but it's the right tool when retrieval quality is a suspected problem.

**Document version history** — every KB doc has built-in history: see saved versions, timestamps, restore old versions, see who changed what (when actor data is available). Works for both native (VG) and Voiceflow (VF) agents. History only starts recording once a doc is saved with the feature active (no retroactive history).

### 3.6 The Crawler (advanced scraping tool)

A more powerful, job-based version of the basic URL scraper, with its own tab and its own API surface.

**Creating a crawler job:**
1. **Source URL(s)** — main entry URL(s)
2. **Crawl quality**: Regular (1 credit/page) vs Deep (10 credits/page — autoscrolls, forces image loading, better for JS-heavy sites)
3. **Refresh Rate**: 6h / 12h / 24h / 7 days / Never — lets you keep fast-changing sections (e.g. an e-commerce `/collections/x` page) fresher than slow-changing ones, by running **separate jobs per sub-path** with different refresh rates
4. **Page Limit**: 10–500 pages per job (check `/sitemap.xml` first to size this correctly)
5. **URL Patterns**: Match patterns (include) and Unmatch patterns (exclude) — e.g. match `/products`, `/blog`; unmatch `/blog` if you only want products despite blog also matching a broader include

**Job lifecycle:** Pending → Active → Completed (dashboard notification on completion)

**Scraped page management:** each page gets a unique doc ID, URL, title, auto-generated description, char count, and the actual scraped markdown content. You can select pages → Export (zip of `.txt`) or Import (push directly into a chosen agent's KB).

**Cost discipline:** the docs are explicit that URL patterns + refresh rate are the two main levers to avoid credit waste on stale or irrelevant re-scrapes.

---

## 4. Tools (Function Calling / External Actions)

### 4.1 What tools are

Custom capabilities ("functions") that let an agent call external APIs/webhooks. Convocore sends parameters as a JSON payload to your endpoint — compatible with Make.com, Zapier, or any custom server.

### 4.2 Default (built-in) tools

Every agent has two tools out of the box:
- **KB-Search** — the mechanism the KB/RAG system itself uses to query and retrieve chunks (this is why {kb_context} works — it's tool-mediated, not magic)
- **Live-handoff** — triggers whenever a user requests human handoff (chat command or handoff popup)

⚠️ Docs explicitly warn: editing these default tools incorrectly **can break core functionality** — do so carefully.

### 4.3 Creating a custom tool

Steps (Tools tab → `+ New Tool`):
1. Choose type: fully custom, or a preset template (e.g. `SendEmail`)
2. Name it clearly — this name is what the LLM sees and reasons about when deciding to call it
3. Configure:
   - **Server URL** — your webhook/API endpoint (e.g. a Make.com webhook URL)
   - **Server Key** — auth token/UDID for that endpoint
   - **Tool Description** — fed to the LLM on every use; must be clear enough for the model to know when/why to call it
4. Define **Parameters**, each with:
   - **Key** (short, descriptive — e.g. `to`, `subject`)
   - **Default Value** (optional fixed value) and **Required** flag
   - **Type** (String/Number/Boolean) + placement (**Body** or **Header**)
   - **Description** (explains what data goes here, fed to LLM)
5. Save, then **assign the tool to the agent** — unassigned tools are invisible to the widget/preview even if fully configured.

### 4.4 Testing tools

- **Webhook Testing**: fire the tool with random or manual test data to confirm the endpoint receives/processes correctly, independent of the LLM.
- **Preview LLM**: full end-to-end test — select the tool, pick a compatible model (must support tool/function calling), adjust retrievable chunks, and send a natural-language test prompt (e.g. *"Send an email to [x] using SendEmail tool"*) to see how the LLM actually invokes it.

⚠️ **Critical guidance:** tool responses should be **detailed, human-readable JSON** — a terse or ambiguous response causes the LLM to "struggle to understand what is going on," increasing hallucination. This applies to both standalone Tools and Canvas tool calls (Canvas explicitly requires valid JSON or falls back to raw text, which is worse for the model).

### 4.5 Instructing the agent to use tools (system prompt patterns)

Reusable pattern — declare the tool, list required parameters, state the confirmation behavior:

```markdown
You have access to a tool called 'addLeadToCRM'. When a user expresses interest
in our products or services, use this tool to add their information to our CRM
system. The tool requires the following parameters:
- name: The full name of the lead
- email: The lead's email address
- interest: A brief description of what they're interested in

Always confirm with the user before adding their information to the CRM.
```

This pattern (declare tool name → list params w/ meaning → state confirmation/consent behavior) is used consistently across all documented examples (lead gen, appointment booking, newsletter signup, fitness planning).

---

## 5. UI Engine (Rich Interactive Responses)

### 5.1 What it is

An **experimental** feature: appends extra instructions to the system prompt that let the LLM emit structured JSON which the widget renders as interactive UI — buttons, cards, carousels, forms/inputs — in addition to plain text, images, and iframes (images/iframes work even without UI Engine enabled).

⚠️ Explicitly marked experimental — "may not always work as expected," test thoroughly.

### 5.2 Enabling it

Agent dashboard → **Prompts tab** → check the **UI Engine** checkbox → save. This literally appends generation instructions to the system prompt under the hood.

### 5.3 Instructing the agent — 3 patterns

1. **Structured instructions** — explicitly tell it what to generate ("Generate two buttons saying X and Y")
2. **Guided interaction** — a scripted multi-step flow with UI elements at each step
3. **Full creative freedom** — give it the capability and let it decide when a UI component improves the interaction (docs specifically recommend **Claude 3.5 Sonnet** as best at freeform, appropriate UI generation)

### 5.4 Component types

| Component | Variants |
|---|---|
| **Buttons** | single, or multiple in a row |
| **Cards** | text-only, w/ image, w/ button(s), w/ image+button(s), full (title+desc+image+buttons) |
| **Carousels** | image carousel, card carousel, card+button+text carousel, mixed content |
| **Forms/Inputs** | text, email, number, dropdown/select, checkbox/radio, textarea, date/time picker, file upload |
| **Images** | single, or embedded in cards/carousels — requires a valid, directly-loadable image URL |
| **Iframes** | arbitrary embeds — Calendly, YouTube, even another Convocore agent — width/height must be **fixed px in the code snippet itself**, not CSS `100%` |

### 5.5 UI Engine + Knowledge Base (combined pattern)

Instead of hardcoding product/card/carousel data in the system prompt, store it in the **KB** with clear formatting instructions, and reference it generically from the prompt:

```markdown
# When recommending products, create a carousel using the provided product info
and formatting instructions in the knowledge base with description, image links
and button text.
```

Then structure the KB doc itself with the literal field data:
```markdown
# When showing products in carousel use this information:

Title: Travis Scott x Air Jordan 1 Low OG 'Olive'
Description: ...
Image: https://...
Button: Cop now🔥
```

This keeps the system prompt lean and lets non-technical team members update product/offer data by editing KB docs, not the prompt.

### 5.6 Credit cost

UI Engine **increases per-response credit usage** (extra instructions injected every turn). Mitigations: monitor via Usage tab, mix UI + plain text rather than UI-heavy every turn, and (if reselling) proactively disclose the cost impact to clients.

---

## 6. Canvas — The Node-Based Flow Builder

### 6.1 Why Canvas exists

A single system prompt + tool list breaks down for complex agents — e.g. a scheduling agent juggling 10+ tools across many scenarios simultaneously. Canvas decomposes one giant prompt into a **flow graph**: small, focused prompts/toolsets per node, connected by conditional routing.

**Not every agent needs Canvas.** A simple, single-purpose support agent is often fine as a single system prompt. Reach for Canvas when scope/complexity genuinely requires branching logic, per-scenario tool isolation, or multi-step structured processes (e.g. booking flows).

### 6.2 Node types

| Node type | Behavior |
|---|---|
| **Start Node** | Auto-created, exactly one per flow, entry point |
| **Default Node** | Standard operation/decision point — the main building block |
| **End Node** | Marks a logical conversation/call end |
| **Global Node** | A Default Node with the "Global Node" toggle enabled — reachable from *anywhere* in the flow, for shared logic (e.g. "Help", "Cancel") |
| **Condition Node** | Reusable named condition, referenced by multiple edges (vs. per-edge inline conditions) — **strongly preferred** for maintainability |

### 6.3 Per-node configuration (5 tabs on every node)

1. **Overview** — name, description, instructions (this node's slice of the system prompt)
2. **LLM Configuration** — temperature, max tokens, rewind level (see 6.5)
3. **Tools** — which tools this specific node can call
4. **Knowledge Base** — enable KB retrieval for this node, set chunk count
5. **Router Configuration** — branching/condition logic to the next node(s)

### 6.4 Connecting nodes — edges & conditions

- Edges connect nodes; hover a node to see connection points, drag to another node
- **Edge conditions**: click an edge → Condition Editor → define logic using variables (`user_input`, etc.) with `AND`/`OR` operators
- **Condition Nodes** (preferred over inline edge conditions for anything reused): define once, reference everywhere
  - ⚠️ Restrictions: cannot chain two condition nodes together; cannot connect multiple outputs into one condition node; must have ≥1 output connected or it's silently ignored

### 6.5 Model Configuration parameters (per node)

| Parameter | Range | Effect |
|---|---|---|
| **Temperature** | 0–1 | 0–0.3 = precise/factual/deterministic; 0.7–1.0 = creative/varied. Docs suggest 0.2 for support/FAQ, 0.8 for brainstorming, 0.4–0.6 as a balanced middle |
| **Max Tokens** | — | Response length ceiling — 100 for short summaries, 500 for detailed explanations |
| **Rewind Level** | 0–3 | How many previous nodes the agent can reference/return to. 0 = no rewind (current node only); 1–3 = can go back that many nodes for retries/clarification/error handling |

### 6.6 Rewind — deeper detail

Configured via **Router Configuration → Rewind Level** slider. Use cases:
- **Error handling**: a failed tool call → rewind to retry or handle differently
- **Clarification**: unclear user input → rewind to the question node to re-ask
- **Flow redirection**: user changes their mind mid-flow → rewind to a decision node

Best practice: use conservatively — deep/frequent rewinds can make flows hard to reason about and confuse users if context isn't cleanly preserved.

### 6.7 Global Nodes & Global Access (Canvas-level, distinct from workspace Global Prompts!)

⚠️ **Naming collision warning:** "Global Node" (Canvas, per-flow, toggled on a Default Node) is a **different feature** from "Global Prompts" (workspace-level, Section 2.3, assigned across multiple agents). Don't conflate them when documenting or building.

- Global Nodes: reusable logic within ONE flow, reachable from anywhere in that flow
- Global Variables: data (e.g. `user_name`, `order_id`) accessible from any node, toggled "Global" in the Variable Drawer
- Common uses: Help node, Cancel node, personalization via global variables

### 6.8 Variables

- Created/edited via any Tool Drawer or Variable Drawer, or inserted in any Text Editor via `{` shortcut
- Fields: **Key**, **Default Value**, **Type** (string/number/etc.), **Description**, **Required** toggle
- Mark as **Global** to make accessible from every node

### 6.9 Turbo Mode (latency optimization)

When a flow has **only 1 node**, Canvas automatically skips the routing step entirely (Turbo Mode), saving ~100–500ms that would otherwise go to the router LLM (Convocore's default router model: **Llama 3.2 on Groq**, chosen for speed+quality balance). This is automatic — not a manual toggle — and is a good reason to keep single-purpose agents as a single node rather than artificially splitting them.

### 6.10 Testing flows

Canvas has a built-in **Test Mode** (Test button, top-right of Canvas workspace):
- Simulates real user interaction against the live flow
- **Flow Preview** shows current node/path/condition evaluation in real time
- Explicitly test: invalid inputs, tool failures, unmatched conditions (ensure a default/fallback path always exists — "dead ends" are called out as a design smell)

### 6.11 Calling tools inside Canvas (two mechanisms)

1. **Text Editor inline** — type `{` in any node/edge text field → dropdown of available tools → inserts a live tool-call reference, e.g.:
   ```
   Your appointment is scheduled for {get_appointment_time}.
   ```
2. **Node Tools tab** — traditional structured config (Tool Name, Server URL, Method, Variables) — same shape as standalone Tools (Section 4.3)

### 6.12 Custom Prompts at node level

Each node's **Overview → Instructions** field is effectively a scoped mini-system-prompt for that node — can reference variables/tools inline via `{`, and should be paired with appropriate LLM Configuration (e.g. low temperature + terse instructions for a data-collection node vs. higher temperature for a conversational node).

### 6.13 Accessibility / Advanced patterns

- **Dynamic Conditions**: route based on evaluated user input/variables, always define a **default/fallback path** for unmatched conditions
- Composited example patterns documented: multi-step booking (dynamic conditions + global Cancel node + rewind for correction), personalized recommendations (global variables + dynamic condition routing + global Help node), error handling with rewind (retry loop + escalation via global node)

---

## 7. Live Handoff (AI → Human)

### 7.1 What it is

Lets a human take over an in-progress conversation from the AI agent, and hand it back. Tightly coupled to the **client dashboard** (the whitelabel-managed interface a client organization's users log into).

### 7.2 Setup

1. Agent **Settings tab** → **Enable handoff popup** (shows the handoff UI to end users)
2. Optional: **Fixed handoff popup** — persistent, always visible at the top of the widget (⚠️ requires the agent be assigned to an **organization**, or it won't work)
3. For a client to use handoff themselves: the agent must be assigned to an **organization**, and that organization needs at least one **user** with dashboard login + the widget assigned to them. If the client hasn't been granted **settings** access, they can't enable handoff themselves — a permissions consideration when setting up client access.

### 7.3 Using handoff

**Incoming request (human side):** notification sound + dashboard corner alert → click to open the conversation (marked with `!`) → click **"Handle chat"** to take over.

**Proactively taking over (monitoring a live chat):** conversations actively in progress show `!` and red "a few seconds ago" text → click **"Continue chat yourself"**.

**Returning control to AI:** click **"Pass Chat to AI"** — the docs stress you must **clearly announce to the user** that you're handing back to the AI (avoid a jarring, unannounced switch).

### 7.4 Fallback for unanswered requests

If no human responds, the user can click **"Send email"** (with optional file attachment) — this requires their email + a message, appears in the conversation thread, and triggers a dashboard notification. Response must be manual (via the provided email).

### 7.5 Notifications

Configured from the client dashboard's bell icon (top-right): choose channel (email and/or push) and which events trigger a notification (all messages, or requests-only).

### 7.6 Handoff Analytics

A dedicated analytics section:
- **Total Accepted Handovers**, **Average Response Time** (per customer message during handoff), **Average Handling Time / AHT** (acceptance → completion or pass-back)
- Per-agent and per-organization breakdowns, sortable by volume
- Multiple handoffs in the same conversation are tracked as **separate events** (e.g. Agent A handles once, later Agent B from a different org handles again — both counted independently)
- Incomplete handoffs (never passed back / never marked complete) are **excluded** from AHT calculations
- Can be hidden from the dashboard entirely via a **"Hide Handoff Analytics"** setting if unused

---

## 8. Lead Qualification Funnel

### 8.1 What it is

Automatically scores conversations against defined qualification criteria and fires a notification once a lead crosses a threshold — without manual review of every conversation. **VG/native agents only** (not documented as VF-supported).

### 8.2 How evaluation works (mechanics — important for accuracy)

- **Web chat / async channels**: evaluation runs **after each AI response** (not after user messages — the AI has to respond first)
- **Voice channels**: evaluation runs **once, at call end**
- The AI reviews the conversation, determines which qualification steps are satisfied, and computes a score

### 8.3 Enabling & configuring

Agent dashboard → **Prompt tab** → **"Lead Scoring & Funnel"** section → toggle on.

**Qualification steps**, each with:
- **Name** (e.g. "Budget Disclosed")
- **Description/condition** — what counts as this step being satisfied
- **Points** (typically 5–25) — ⚠️ **all enabled steps must sum to exactly 100**, or the system flags an error

**Two ways to build steps:**
- **Manual**: Add Step → name/condition/points → toggle enable/disable individually
- **AI-Assisted**: click "AI Assist" → optionally add refinement instructions (e.g. "Focus on enterprise clients with $50k+ budgets") → generates 5–10 balanced steps from the agent's existing system prompt context → review → Apply or Discard (can "Try Again")
  - If steps already exist, AI Assist works in **refinement mode** instead (adjusts existing steps per your instructions rather than generating from scratch)

### 8.4 Notifications

- Sent **once per conversation**, when either: a **score threshold** is reached, OR a set of **specific steps** are all completed (your choice of trigger type)
- Recipients: workspace members by email, or arbitrary custom emails
- Optional: **require contact info** (email/phone) before notifying — ensures the notification is actually actionable
- Email includes: lead name/score/agent name, which steps matched + points earned, extracted conversation data, and a direct conversation link

### 8.5 Whitelabel branding on notification emails

Fully automatic based on agent assignment — **no manual per-agent config needed**:
- Agent assigned to a client organization → uses agency branding (logo, color, custom domain link, agency email sender, agency address/support email in footer)
- Agent not assigned to a client → default Convocore branding

Prerequisites for agency branding to actually apply: active agency account, theme configured (logo + primary color + company name), custom domain configured & verified, custom email domain configured. **If any piece is missing, that piece silently falls back to Convocore default** — not an all-or-nothing failure.

### 8.6 System prompt integration (automatic)

When the funnel is enabled, qualification criteria are **automatically appended to the agent's system prompt** — you don't need to manually restate them. What gets added: the step list (names+descriptions), an instruction to gather info conversationally (not like an interrogation), and a reminder to prioritize user experience over aggressive qualification. This is another example of the "layered prompt" architecture (Section 2.2) — the funnel is effectively injecting its own instruction block, similar to how Global Prompts inject theirs.

### 8.7 Recommended score-threshold bands (from docs)

| Score | Interpretation |
|---|---|
| 40–60 | Engaged lead |
| 60–75 | Qualified lead |
| 75–90 | Hot lead |
| 90–100 | Highly qualified / ready to convert |

### 8.8 Best practices (condensed)

- 5–7 steps is the sweet spot; progress from basic engagement → strong buying signals
- Make step conditions specific/measurable, not vague
- Don't let qualification questions override being genuinely helpful — pushy qualification hurts conversion
- Test with a **low threshold first** to confirm notifications actually fire before tightening

---

## 9. Analytics

### 9.1 Core metrics (every agent)

Monthly Interactions, AI Tokens Usage, Total Interactions, Total Conversations, Avg Messages/Chat, Avg Seconds/Chat, and (VF-only) Average Rating.

Time range filtering: presets (1h / 24h / 7d / 30d / 90d / 1yr) or custom date range.

### 9.2 Deeper performance graphs

- **User Retention** — messages exchanged before drop-off
- **Time Retention** — seconds spent, by user count
- **Total Conversations Over Time**

### 9.3 GeoAnalytics (optional, +0.1 credit/request)

Tracks unique website traffic (all IPs hitting the site, not just conversation participants) — gives visitor-volume context around how many site visitors are likely engaging vs. just browsing. Enabled per-agent in Settings.

### 9.4 Voiceflow (VF)-specific analytics

Only available for VF/imported agents: **Top Intents** (pie chart of most-triggered intents) and **Understood Messages** (% successfully parsed by the VF NLU — green=understood, red=not).

### 9.5 Custom Metric Charts

Build your own dashboard tiles:
- Chart types: Line (trends over time), Bar/Column (comparisons), Pie/Donut (proportions), Number (single KPI)
- Configurable: title, description, icon, size (Small=1/5 row, Medium=2/5, Large=3/5, Full=whole row)
- For boolean/enum metrics: filter which specific values display
- For number charts: choose sum vs. average aggregation
- Available metrics depend on what your agent actually captures — some require dev-side setup to emit

Example chart ideas given in docs: Conversion Rate, Question Categories, Support Issues, Regional Activity, Time-to-Resolution.

### 9.6 Handoff Analytics — see Section 7.6 (lives inside the Analytics tab)

---

## 10. Deployment & Channels

### 10.1 Website deployment — 4 integration methods

| Method | Use case |
|---|---|
| **Popup Widget** | Standard corner chat bubble |
| **Embedded Chat** | Full-width, in-page chat interface |
| **Iframe** | Maximum placement flexibility; also used to embed the agent inside third-party platforms (PowerBI, Slack, Teams, Monday.com), as a SaaS-product addon, as a landing-page component, or shared as a standalone URL |
| **Full HTML** | Same iframe mechanism, treated as its own deployment target |

**Universal popup snippet:**
```html
<div id="VG_OVERLAY_CONTAINER"></div>
<script defer>
    (function() {
        window.VG_CONFIG = {
            ID: "YOUR_AGENT_ID",
            region: 'eu', // or 'na'
            render: 'bottom-right', // or 'bottom-left'
            stylesheets: ["https://vg-bunny-cdn.b-cdn.net/vg_live_build/styles.css"],
        }
        var VG_SCRIPT = document.createElement("script");
        VG_SCRIPT.src = "https://vg-bunny-cdn.b-cdn.net/vg_live_build/vg_bundle.js";
        VG_SCRIPT.defer = true;
        document.body.appendChild(VG_SCRIPT);
    })()
</script>
```

**Iframe snippet:**
```html
<iframe src="https://convocore.ai/app/eu/render/YOUR_AGENT_ID/iframe"
        style="width: 100%; height: 100vh;" frameborder="0"></iframe>
```

**Key `VG_CONFIG` fields:**
- `ID` — agent ID
- `region` — `'eu'` or `'na'` (must match your account/dashboard region)
- `render` — `'bottom-right'` / `'bottom-left'` / `'full-width'`
- `stylesheets` — array of CSS URLs
- `user` — `{ name, email, phone }` object for personalization
- `userID` — custom user identifier (ties to conversation ID tracking)
- `autostart` — boolean; auto-opens widget on page load (⚠️ see Section 2.4 — credit cost implications)

⚠️ **Always use the latest `vg-bunny-cdn` script.** The docs explicitly call out that the legacy CDN was more expensive per-visit; switching to the current script alone was responsible for a large chunk of one user's 95% credit-usage reduction (paired with disabling autostart — see Section 2.4/Pricing notes).

**Platform-specific guides exist for:** Shopify (paste into `theme.liquid` before `</body>`), WordPress (via a header/footer plugin or `footer.php`), Wix (Custom Code in editor), Webflow (page settings Custom Code), Squarespace (Code Injection).

### 10.2 Messaging channels

| Channel | Setup shape |
|---|---|
| **WhatsApp** | Create a Facebook Business App → configure WhatsApp product → set Convocore's callback URL + verify token in the Meta app config → subscribe to `messages` webhook field → generate API credentials (Phone Number ID, WhatsApp Business Account ID) → generate a **permanent** system-user access token (temporary tokens expire) → paste into Convocore's Channels config. There's also a newer **Embedded Sign-Up** method documented as a faster path. |
| **Meta (Facebook/Instagram)** | Connect via business portfolio assets (Facebook/Instagram business pages) from the Channels tab |
| **Discord** | Connect a Discord server to the agent |
| **Telegram** | Connect a Telegram bot |
| **Voice (Vapi)** | Connect a Vapi account for voice channel (see Section 11 for Convocore's own native voice stack, which is separate from the Vapi integration path) |

⚠️ **Meta requirement (compliance, not optional):** agents deployed on Meta channels **must disclose to users that they're talking to an AI** — set via the "AI Introduction Message" in Agent Settings (Section 2.5).

### 10.3 Agent-native API access

Any channel not natively supported can be built via the **REST API** or **WebSocket Interact** channel (Section 12) — this is explicitly framed as the universal fallback: "basically any channel through our API."

---

## 11. Voice

### 11.1 What the Voice Suite provides

- **Real-time transcription** (Speech-to-Text)
- **Lifelike speech generation** (Text-to-Speech)
- **Phone integration** via Twilio (or SIP trunking — see 11.4)
- **Web calling** (browser-based, no phone number needed)

### 11.2 End-to-end flow

```
User speech → Transcriber (e.g. Deepgram) → Text
  → [LLM processes as normal conversation turn]
  → Speech Generator (e.g. ElevenLabs) → Audio → Playback
  → (Optional) Twilio for real phone number in/out
```

- **Patience Factor** — tunes how long the transcriber waits through pauses before finalizing what the user said (higher = more tolerant of hesitant speech, at the cost of latency)
- **Voice ID** — selects the TTS voice/accent/tone
- **Background Noise simulation** — can simulate ambient environments (e.g. "Restaurant") for realism

### 11.3 Provider options & why they matter (ties to Pricing, Section 13)

| Layer | Providers documented | Notes |
|---|---|---|
| STT | Deepgram, AssemblyAI, Gladia | AssemblyAI cheapest; Deepgram = high accuracy/speed; Gladia = premium features |
| TTS | Google Cloud, Rime AI, Twilio, OpenAI, Azure, Cartesia, ElevenLabs, PlayHT | Google Cloud cheapest reasonable-quality; ElevenLabs/PlayHT = premium/ultra-realistic, most expensive |
| Speech-to-speech (all-in-one) | **Ultravox**, **Google Gemini Live** | Collapses STT+LLM+TTS into one lower-latency pipeline; Gemini Live has its own flat per-minute pricing (see Section 13.4) |
| Telephony | Twilio (platform-rented numbers, or SIP trunking with your own provider) | |

### 11.4 SIP Trunking (bring-your-own telephony)

A separate, more advanced path than platform-rented Twilio numbers — lets you connect your **own SIP trunk** for inbound/outbound calls, with Convocore's SIP server bridging calls to the AI agent. Includes phone number management under your own trunk. (Doc pages exist for provider setup, the Asterisk-based bridge server, and a 5-minute quick-start — not expanded in this v1; flagged for follow-up if we need SIP specifically.)

### 11.5 Setup paths

- **Twilio Setup** — purchase/import a number, or connect an existing Twilio account
- **Web Calling** — enables voice-to-voice directly in-browser via the widget, no telephony provider needed at all

---

## 12. API & Real-Time Interaction (Conceptual Overview)

> Full endpoint-by-endpoint reference is **out of scope for this document** — this section covers just enough for architectural decisions. See Section 15 for what's deferred to the phase-2 API doc.

### 12.1 Two API surfaces

| Surface | Protocol | Use for |
|---|---|---|
| **V3 REST API** | Bearer-token HTTP, region-based base URL | Managing workspaces, agents, tools, variables, KB docs, leads, conversations, calls/numbers, campaigns, custom metrics — i.e., all CRUD/config operations |
| **WebSocket Interact** | `wss://` streaming | Real-time conversational turns — sending a user message and receiving a streamed AI response, used by the widget itself and available for custom front-ends |

### 12.2 REST API basics

**Base URLs (region-locked — must match your dashboard's region):**
```
EU: https://eu-gcp-api.vg-stuff.com/v3
NA: https://na-gcp-api.vg-stuff.com/v3
```

**Auth:** `Authorization: Bearer YOUR_SECRET_KEY` — either a **workspace secret** (workspace-level ops) or an **agent secret** (agent-scoped ops), both retrievable from the dashboard.

**Resource groups:** Workspaces, Agents, Tools, Variables, Knowledge Base, Leads, Conversations, Calls & Numbers, Campaigns, Custom Metrics.

⚠️ Using the wrong region's base URL causes requests to fail or silently return data from the wrong environment — always confirm region first.

### 12.3 WebSocket Interact — connection shape

```
wss://<region>-gcp-api.vg-stuff.com/interact
```
where `<region>` is `eu` or `na`.

**Opening payload (`interactObject`):**
```typescript
{
  agentId: "your-agent-id",
  convoId: "your-convo-id",
  bucket: "voiceglow-eu" | "(default)",   // eu vs na
  prompt: "Hello, how can you help me?",
  agentData: { ownerID: "user-id", userID: "user-id" },
  lightConvoData: {                        // optional
    userName: "John Doe",
    userEmail: "john@example.com",
    userPhone: "+1234567890",
    origin: "web-chat" | "discord" | "messenger" | "instagram" | "gb-chat"
  }
}
```

**Response stream shape:**
```typescript
{
  type: "sync_chat_history" | "metadata" | "debug" | "action" | "chunk";
  turns?: TurnProps[];
  metadata?: { sources?: string[] };
  chunk?: string;
  chunkIndex?: number;
  ui_engine?: boolean;
  action?: { type: "request_handoff" };
}
```

This is the mechanism that powers the widget itself — anything the widget can do, a custom front-end can replicate by driving this same WebSocket contract directly.

### 12.4 Choosing between surfaces (rule of thumb from docs)

- **V3 REST** — default choice for a stable, standard HTTP integration
- **V2/legacy** — only if maintaining an existing integration already built on it
- **WebSocket Interact** — only when you need real-time streaming behavior (custom chat UI, voice-like low-latency needs)

---

## 13. Events Webhook (Outbound Notifications)

### 13.1 What it is

Convocore POSTs a JSON payload to your configured endpoint whenever a subscribed event occurs — the inverse of the REST API (push vs. pull).

### 13.2 Platform support caveat

**Not all events fire for VF (Voiceflow) agents** — VF lacks `lead_captured` and `form_submitted` support because those depend on Convocore's own WebSocket-based interaction model (automatic conversation-based lead detection, UI Engine forms) which VF's REST-based runtime doesn't have.

| Event | Convocore (VG) | Voiceflow (VF) | Category |
|---|:---:|:---:|---|
| `message_received` | ✅ | ✅ | Message |
| `chat_delegated` | ✅ | ✅ | Handoff |
| `bug_reported` | ✅ | ✅ | Bug |
| `agent_created/updated/deleted` | ✅ | ✅ | Agent |
| `organisation_created/updated/deleted` | ✅ | ✅ | Org |
| `client_created/updated/deleted` | ✅ | ✅ | Client |
| `webhook_test` | ✅ | ✅ | Test |
| `lead_captured` | ✅ | ❌ | Lead |
| `form_submitted` | ✅ | ❌ | Form |

### 13.3 Payload shape (all events share this envelope)

```json
{ "type": "event_type_here", "payload": { "...event-specific fields...", "workspaceSecret": "your_workspace_secret" } }
```

Every payload includes `workspaceSecret` — **use it to verify authenticity of incoming webhooks** (this is the closest thing to a signing secret in this system; treat it as sensitive).

### 13.4 Implementation requirements

- Respond with **HTTP 200** for success; empty body is fine
- Must respond within **60 seconds** (timeout)
- **No automatic retry** — a missed/failed delivery is gone, design your endpoint for high availability
- **Delivery order is not guaranteed**
- Timestamps are Unix ms

---

## 14. Whitelabel & Agency (Reselling Model)

> Relevant if we ever resell/deliver agents under our own brand to clients. Skip if we're building only for internal/first-party use.

### 14.1 What "agency" means in Convocore

A whitelabel-enabled workspace that can: brand the platform as its own, manage multiple **client organizations**, and deliver AI agents as a service.

### 14.2 What it unlocks

- **Branding control** — own domain, logo, colors, footer, client-facing presentation
- **Client management** — organizations, per-user access control, agent assignment
- **Billing** — Stripe Connect + embeddable pricing table for client self-serve subscription
- **Custom delivery** — custom tabs, integrations exposed selectively per client

### 14.3 Typical agency workflow

```
1. Set up whitelabel workspace (branding, domain, footer, theme)
2. Create client organizations, assign relevant agents
3. Add client users, control dashboard access per person
4. Configure billing (embeddable pricing + Stripe)
5. Operate at scale via shared analytics/conversations/handoff tooling
```

### 14.4 Why this matters even for non-agency use

Several "core" features are **gated behind organization assignment** even for first-party use — most notably:
- **Fixed Handoff Popup** requires org assignment (Section 7.2)
- **Live handoff client-side access** requires an org + a user with dashboard login (Section 7.2)
- **Agency-branded lead-funnel emails** require the full whitelabel branding chain (Section 8.5)

So even a single-client/internal deployment may need a minimal "organization" set up if we want handoff or branded notifications to work as designed.

---

## 15. Pricing & Credits (Reference)

> Included because credit-cost tradeoffs directly shape technical decisions (which model, whether to enable UI Engine, chunk counts, autostart, etc.) — this is not a finance document, just the mechanics needed to make informed build decisions.

### 15.1 Core mechanic

**1 USD = 1,000 credits.** Flat, no tiers.

### 15.2 Plans (as of doc fetch — verify current pricing before quoting externally)

| Plan | Price | Notable inclusions |
|---|---|---|
| Free | $0 forever | 5 agent slots, text+voice agents, KB, analytics, live handoff, API access |
| Pay as you go | $20/mo + usage | 100 agent slots, $5 free credit/mo, no Convocore branding, **bring-your-own API keys** (up to ~20x cost reduction on LLM spend), autobilling via Stripe |
| Enterprise | $1000+/mo + usage | No markup on provider costs, on-prem option, custom dashboard features |

### 15.3 Add-ons

Whitelabel ($200/mo, includes 5 client seats + 1 Twilio number + 2 workspace seats), extra Workspace seat ($10/mo), extra Client seat ($15/mo), extra Concurrent Call Line ($5/mo), extra Twilio number ($3/mo).

### 15.4 Base usage costs

| Feature | Cost |
|---|---|
| Interaction (any channel) | $0.0010 |
| Custom channel | $0.0010 |
| Crawler (regular, per page) | $0.0010 (i.e. 1 credit) |
| Crawler (deep, per page) | $0.0100 (i.e. 10 credits) |
| GeoAnalytics | +0.1 credit/request |
| Speech-to-Text (widget input) | 1 credit/request |

### 15.5 LLM cost mechanics

Convocore charges a **~10% platform markup** on provider costs by default; **Enterprise plan pays exact provider cost, no markup**. Bringing your own API key (OpenAI/Anthropic/Google/etc., available Pay-as-you-go and above) routes billing directly to the provider instead, which the docs describe as up to a **20x cost reduction** for some models (since you skip both the markup and Convocore's credit-conversion overhead).

Full per-model $/1K-token tables are in the source docs (Pricing → Credits) — **do not treat the specific model list as current**; it will drift as providers release new models. Verify live pricing at time of build rather than trusting this document's numbers verbatim for financial decisions.

### 15.6 Voice cost formula

```
Total voice cost = Platform Fee ($0.03/min) + STT + TTS + LLM + Telephony (optional, Twilio only)
```

Budget config example (AssemblyAI + Google TTS + GPT-4o mini): **~$0.052/min**
Premium config example (Deepgram + ElevenLabs + GPT-4o): **~$0.090/min**

**Google Gemini Live** (speech-to-speech, all-in-one) has its own flat pricing: $0.02/min (Gemini) + $0.03/min (platform) = $0.05/min without telephony, $0.06–0.07/min with Twilio.

### 15.7 The two biggest avoidable cost mistakes (per docs, real customer case study)

A documented case reduced credit usage **~95%** by fixing exactly two things:
1. **Switching to the current `vg-bunny-cdn` widget script** (legacy CDN charged extra per visit)
2. **Disabling autostart + initial prompt** — autostart combined with a long initial prompt can burn up to ~50–100 credits *per page visit*, before the user has typed anything, because it forces an LLM call (and UI Engine generation, if enabled) on load

**Practical rule for our builds:** default `autostart: false`, prefer a lightweight static "Proactive Message" over an LLM-driven Initial Prompt unless the interactive first-message UI is a deliberate, valued feature — and always confirm the widget snippet points at `vg-bunny-cdn`, not a legacy CDN URL.

---

## 16. Build Playbook — Customer Support Agent (Synthesis)

This section translates the above into a concrete, ordered build sequence for a typical support agent, cross-referencing the relevant section numbers.

```
1.  Decide build path: native Convocore (single prompt or Canvas) vs Voiceflow-import (§1.4–1.5)
    → Default to native unless there's a specific reason to import a VF flow.
    → Native unlocks: lead funnel, UI Engine forms, native lead_captured events.

2.  Design & branding (§2.1) — name, theme, avatars, widget language

3.  Write the system prompt (§2.2) using the 5-step framework:
    tone/objective → context+boundaries → CoT → few-shot → reinforcement
    → MUST include {kb_context} and {about_context}
    → Use Markdown if primary model is GPT-family, XML if Claude-family

4.  Decide: single prompt, or Canvas? (§6.1)
    → Single prompt: simple, single-purpose support bot
    → Canvas: multi-scenario support (billing + technical + sales handoff
      as genuinely distinct flows with different tools/tone per scenario)

5.  Build the Knowledge Base (§3)
    → Structure docs per §3.3 (MD or XML depending on model)
    → Add Description + Tags to every doc (§3.3)
    → Set chunk count 3–4 default (§3.4)
    → Use Crawler (§3.6) for docs/help-center import at scale, with
      sensible refresh rates and URL match/unmatch patterns

6.  Add Tools as needed (§4) — e.g. CRM lookup, ticket creation, order status
    → Clear tool + parameter descriptions (LLM-readable)
    → Confirm-before-action pattern for anything consequential
    → Return detailed, human-readable JSON from your endpoint (§4.4)

7.  (Optional) Enable UI Engine (§5) if rich responses genuinely help
    (e.g. order-status cards, FAQ button menus) — mind the credit cost

8.  Configure Initial Message/Prompt (§2.4) — prefer static Proactive
    Message over LLM-driven Initial Prompt + autostart unless justified

9.  Set up Live Handoff (§7) — requires org assignment for fixed popup
    and for client-side dashboard access; wire escalation triggers into
    the system prompt (§2.2 template's "ESCALATION TRIGGERS" block)

10. (Optional) Enable Lead Qualification Funnel (§8) if this agent
    also serves a sales-adjacent function — define 5–7 steps summing
    to 100 points, set a sensible notification threshold

11. Configure Agent Settings (§2.5) — limits, delays, Meta AI-disclosure
    message if deploying to Meta channels, CSS if brand-matching needed

12. Deploy (§10) — pick channel(s): website widget (popup/embedded/
    iframe), WhatsApp/Meta/Discord/Telegram, or API/WebSocket for a
    fully custom front-end. Confirm vg-bunny-cdn + autostart:false (§15.7)

13. Test (§6.10 for Canvas Test Mode, §4.4 Preview LLM for tools,
    §3.5 Preview KB for retrieval quality) — cover invalid inputs,
    tool failures, unmatched conditions, and confirm fallback paths exist

14. Monitor (§9) — Analytics tab for engagement/retention, Handoff
    Analytics (§7.6) for human-agent performance, Custom Metric Charts
    for anything business-specific we want tracked

15. Wire Events Webhook (§13) if we need our own systems notified of
    leads, handoffs, or messages in real time (push model, vs. polling
    the REST API)
```

---

## 17. Terminology Quick-Reference (Disambiguation)

Convocore reuses some words for genuinely different features. This table exists specifically to prevent confusion when this doc (or Convocore's own docs) get referenced later:

| Term | Meaning A | Meaning B |
|---|---|---|
| **"Global"** | **Global Prompt** (§2.3) — workspace-level, assigned across multiple *agents*, max 10 per agent | **Global Node** (§6.7) — Canvas-level, reusable within *one flow*, toggled per node |
| **"Prompt"** | **System Prompt** (§2.2) — the core agent behavior definition | **Initial Prompt** (§2.4) — instruction for generating the first message only, overrides Initial Message |
| **Agent platform** | **VG** — native Convocore-built agent (Canvas or single-prompt) | **VF** — Voiceflow-imported agent, narrower feature support (§1.5) |
| **Scraping** | **URL Scraper** (§3.2) — basic, ad hoc, inside the KB tab | **Crawler** (§3.6) — job-based, scheduled, pattern-filtered, own tab + API |
| **Handoff** | **Live Handoff** (§7) — AI conversation handed to a human agent | (no second meaning documented — flagged here only because it's a load-bearing term) |
| **"Interact"** | **WebSocket `interact` channel** (§12.3) — the real-time streaming protocol | Generic word used loosely elsewhere in docs — always confirm which is meant |

---

## 18. Not Covered in This Version (Where to Look Next)

This v1 prioritized the conceptual/usage documentation most relevant to building and reasoning about a customer support agent. The following exist in Convocore's docs but were **not** fetched/expanded here — noted so nothing is assumed to not exist:

**Fetched only at summary/intro level (could be expanded on demand):**
- Voice: Transcriber Configuration, Speech Generation Configuration, Advanced Settings, Twilio Setup detail, Web Calling detail, SIP Trunking (provider setup, Asterisk bridge internals, phone number management, quick-start) — Ultravox provider page
- Channels: Discord, Telegram, Meta Channels, WhatsApp Embedded Sign-Up (only classic WhatsApp flow was fetched in full) — full Shopify/WordPress/Wix/Squarespace platform-specific steps
- Agent Dashboard: Prototype Testing, Tabs Configuration, Theme Customization, Widget Configuration (Tools Management was fetched in full)
- Features: Agent Campaigns, Agent Metrics, Usage Tab, Agent Tester, Voice-to-voice (VAPI integration)
- Voiceflow: Extensions page
- Integrations: Airtable, Calendly, Google Calendar/Gmail/Sheets, Outlook, Zoho Mail, Shopify (data integration, distinct from website-embed Shopify guide)

**Not fetched at all (whitelabel operational detail):**
- Custom Domain, Custom Tabs, Email Routing, Embeddable Pricing (+ quick start), Agency Footer, Overview Tab, Agency Theme detail
- Client-side: Access/Roles/Activity Logs, Billing Activation, Billing FAQs, Stripe Billing setup, Client Dashboard Analytics/Features, Creating Users, Managing Organizations, Managing Teams
- Getting Started (whitelabel), Whitelabeled Integrations

**Explicitly out of scope for this document (by your instruction) — phase 2:**
- Full **API Reference** (`/api-reference/**`) — every REST endpoint for Agents, Analytics, Convos, KB, Interact, State, plus the full **V3** resource set (Agents, Calls, Conversations, Crawler, Custom Metrics, KB, Leads, Orgs, SMS, Tools, Variables, Voices, Workspaces)
- **OpenAPI specs** (sms, calls, voices, kb, crawler, leads, metrics, workspaces, variables, tools, orgs, numbers, misc, conversations, campaigns, analytics, agents)
- **AsyncAPI spec** for the Interact WebSocket channel

**Also not covered:**
- Affiliate Program, full Billing/Troubleshooting/FAQ/Contact pages (support-process docs, not build docs)

If/when we need any of the above, fetch the specific page(s) from `docs.convocore.ai` (full index always available at `https://docs.convocore.ai/llms.txt`) rather than re-deriving from memory — this document should be extended, not guessed from.

---

## Document Changelog

- **v1** (this version) — initial comprehensive conceptual reference, standalone (no runtime cross-mapping yet). Compiled from ~45 full-text page fetches + the full site index.
- **Next planned step** (per your direction): cross-map this document's concepts to our own system/runtime terminology once this version is validated as accurate.

