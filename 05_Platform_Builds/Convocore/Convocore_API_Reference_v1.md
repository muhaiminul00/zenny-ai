# Convocore API Reference (Phase 2 — v1)

> **DOC PREFERENCE (2026-08-14, BC-057b):** CURRENT — technical backing reference. Derived from `convocore_llms-full.txt` plus live tests; consult alongside the 3 primary build docs (`Convocore_Agent_Build_Order_Guide_v2.md`, `Convocore_Canvas_Ground_Truth_FINAL.md`, `Convocore_Adapter_Spec_FINAL.md`) when exact field/endpoint detail is needed. As of BC-057b (2026-08-14), REST API access is still blocked workspace-wide (`403 Business plan or higher`) — this doc's endpoints are accurate but currently unreachable for this workspace; manual Canvas UI is the fallback build method. See `Wiki/reference/convocore-doc-status.md`.

> **Companion document to `Convocore_Master_Reference_v2.md`.** That doc covers *what Convocore is and how to use the dashboard*. This doc covers *how to control Convocore programmatically* — every REST resource, the WebSocket protocol, request/response shapes, and worked examples.
>
> **Audience:** written for humans, LLMs (Claude/GPT reasoning about integration code), and coding agents (Claude Code) implementing against this API. Every technical term is defined in plain English on first use — no assumed prior API-design vocabulary.
>
> **Source:** compiled from the `convocore_llms-full.txt` project file (API reference + AsyncAPI sections), cross-referenced against the Master Reference doc.

---

## 0. Read This First — Core Concepts in Plain English

If you've never worked with an API like this before, these five ideas unlock everything else in this document.

**API (Application Programming Interface)** — a defined way for your own code to talk to Convocore's servers, instead of a human clicking around the dashboard. Every action a person can do in the dashboard (create an agent, upload a KB doc, send a message) has a corresponding API call that code can do instead.

**REST** — the style of API Convocore uses for most things. You send an HTTP request (the same kind of request your browser sends to load a webpage) to a specific **URL**, using a specific **method** (GET to read, POST to create, PATCH to partially update, DELETE to remove), and you get a **response** back — usually as **JSON** (a text format for structured data, like a dictionary of key-value pairs).

**Endpoint** — one specific URL + method combination that does one specific thing. E.g. `GET /agents` is one endpoint ("give me all my agents"); `POST /agents` is a *different* endpoint at the *same URL* ("create a new agent"), because the method changes what it does.

**Authentication (auth)** — proving to Convocore's servers that you're allowed to do what you're asking. Convocore uses a **Bearer token** — a secret string you include in every request's `Authorization` header, formatted as `Authorization: Bearer YOUR_SECRET_KEY`. Think of it like a hotel key card: whoever holds the card can open the door, so it must be kept private.

**Base URL / Region** — Convocore runs your data in one of two data-center regions, `EU` or `NA` (matching wherever your dashboard/workspace was created). Every request must go to the URL for *your* region — sending a request to the wrong region's URL will fail or, worse, silently return someone else's (wrong) data.

**Resource** — a "thing" the API lets you manage: an Agent, a Tool, a Conversation, a Lead, etc. Resources are organized into **resource groups** (Agents, Tools, Variables, Knowledge Base, Leads, Conversations, Calls & Numbers, Campaigns, Custom Metrics, Workspaces, Voices, SMS, Orgs) — this document has one section per group.

**CRUD** — a shorthand for the four basic things you can do to a resource: **C**reate, **R**ead, **U**pdate, **D**elete. Almost every resource group in this doc follows the same CRUD pattern, so once you understand one (e.g. Tools), the others will feel familiar.

---

## 1. Which API Surface Should You Use?

Convocore exposes **three** different ways to talk to it. Picking the right one matters — using the wrong one for your use case means more work or things simply not working.

| Surface | What it is (plain English) | Use it for |
|---|---|---|
| **V3 REST API** | The current, recommended HTTP API. Stable, well-documented, Bearer-token authenticated. | **Default choice.** Managing agents, tools, variables, KB docs, leads, conversations, calls/numbers, campaigns, custom metrics — any "set up or manage my stuff" task. |
| **WebSocket Interact** | A persistent, two-way live connection (`wss://` — like a phone call that stays open, vs. REST's "one question, one answer" model) used to actually *have a conversation* with an agent in real time, with the response streaming back word-by-word. | Building your own custom chat UI, or anything that needs to feel like a live typing conversation instead of a single request/response. This is literally what powers Convocore's own website widget. |
| **V2 / Legacy REST API** | An older API surface, still functional but not recommended for new work. | **Only** if you're maintaining an existing integration that was already built on it before V3 existed. Don't start new projects here. |

**Rule of thumb:** if you're not sure, use **V3 REST**. Only reach for WebSocket Interact when you specifically need a live, streaming conversation experience — and only touch V2 if you're stuck maintaining something that predates this document.

---

## 2. Authentication

**How it works:** almost every endpoint (except a couple of public/analytics ones) requires an `Authorization` header on every request:

```
Authorization: Bearer YOUR_SECRET_KEY
```

**Where do I get a key?** Two kinds of secret exist, both visible in your Convocore dashboard:

| Key type | Scope | Get it from |
|---|---|---|
| **Workspace secret** | Can act on *anything* in your workspace — all agents, all resources | Dashboard → workspace switcher → workspace settings |
| **Agent secret** | Scoped to *one specific agent* only | That agent's own Settings page |

**Which one should I use?** Use the **agent secret** whenever a task is scoped to a single agent (e.g. a server that only manages one chatbot) — it limits the blast radius if the key ever leaks. Use the **workspace secret** when you genuinely need to manage multiple agents or workspace-level resources (like creating new agents, or workspace usage stats).

⚠️ **Security rule, no exceptions:** never put a secret key in client-side code (JavaScript that runs in a user's browser), never commit it to a public code repository, never log it. Treat it exactly like a password. If a key is ever exposed, regenerate it immediately from the dashboard.

---

## 3. Base URLs (Endpoints by Version & Region)

**"Base URL"** = the common prefix that every request in that API surface starts with. You then add the specific resource path (e.g. `/agents`) to the end of it.

### V3 REST (recommended)

| Region | Base URL |
|---|---|
| EU | `https://eu-gcp-api.vg-stuff.com/v3` |
| NA | `https://na-gcp-api.vg-stuff.com/v3` |

Example full URL: `https://eu-gcp-api.vg-stuff.com/v3/agents`

### WebSocket Interact

| Region | URL |
|---|---|
| EU | `wss://eu-gcp-api.vg-stuff.com/interact` |
| NA | `wss://na-gcp-api.vg-stuff.com/interact` |

### V2 / Legacy

| Region | Base URL |
|---|---|
| EU | `https://eu-cloudflare.vg-stuff.com` (some docs also reference `https://eu-vg-edge.moeaymandev.workers.dev` for `/v2/agents/*` specifically) |
| NA | `https://na-cloudflare.vg-stuff.com` (NA equivalent: `https://na-vg-edge.moeaymandev.workers.dev`) |

⚠️ **Always double-check your region before writing any integration code.** A wrong-region request doesn't always fail loudly — sometimes it silently returns empty or mismatched data, which is a much more confusing bug to track down than an outright error.

### Minimal working example (V3, curl)

`curl` is a common command-line tool for making HTTP requests — useful for testing an API call before writing real code.

```bash
curl --request GET \
  --url https://eu-gcp-api.vg-stuff.com/v3/agents \
  --header "Authorization: Bearer YOUR_SECRET_KEY"
```

This asks: "give me the list of all agents in my workspace" (EU region). If it works, you'll get back a JSON response listing your agents.

---

## 4. Agents

**What an "agent" is, in API terms:** the core object representing one AI chatbot/assistant — its name, its behavior instructions, its model configuration, and (for Canvas-based agents) its flow of nodes. See the Master Reference doc §1.4–1.5 for the conceptual difference between native ("vg") and Voiceflow-imported ("vf") agents — that distinction matters here too, since it's set via the `agentPlatform` field.

### 4.1 List all agents

```
GET /agents
```
Returns every agent owned by your workspace. Use `GET /agents/{id}` (below) to get one agent's *full* detail — the list endpoint gives a lighter summary.

### 4.2 Get one agent by ID

```
GET /agents/{id}
```
Returns the full configuration for one agent, including its `SECRET_API_KEY` (the agent-scoped secret) and its full `nodes` array (its Canvas flow / instructions).

💡 **Key term — "node" and `__start__`:** an agent's actual behavior instructions live inside a `nodes` array, not as a simple top-level "prompt" field. Every agent has (at minimum) one node with `id: "__start__"` — this is the main/default node, and for a simple single-prompt agent, its `instructions` field *is* effectively the system prompt. (See Master Reference §6 for the full Canvas node concept — nodes are how Convocore represents both simple one-prompt agents and complex multi-node flows in one consistent data structure.)

### 4.3 Create an agent

```
POST /agents
```

**Simplest possible request** — just the basics, no custom instructions yet:
```json
{
  "agent": {
    "title": "My Customer Service Agent",
    "description": "An AI agent that handles customer inquiries",
    "agentPlatform": "vg"
  }
}
```
`agentPlatform: "vg"` means "native Convocore agent" (as opposed to `"vf"` for a Voiceflow-imported one — see Master Reference §1.4).

**With custom instructions set at creation time** — add a `nodes` array:
```json
{
  "agent": {
    "title": "My Agent",
    "agentPlatform": "vg",
    "nodes": [
      {
        "id": "__start__",
        "name": "Start",
        "instructions": "You are a helpful customer support agent. Be friendly and concise."
      }
    ]
  }
}
```

**With a custom color theme** set at creation:
```json
{
  "agent": {
    "title": "My Agent",
    "customTheme": { "themeType": "dark", "primary": "#3B82F6" }
  }
}
```

**What you get back:** a unique agent `ID` and a `SECRET_API_KEY` (the agent secret) are auto-generated — you don't choose these. New agents default to `enableNodes: true` for `vg`-platform agents (i.e. the modern node-based system is on by default).

### 4.4 Update an agent

```
PATCH /agents/{id}
```

💡 **Key term — PATCH / "partial update" / "deep merge":** unlike `POST` (create something new) or a full `PUT` (replace the whole object), `PATCH` means "only change the specific fields I send you — leave everything else as it was." Convocore's PATCH uses **deep merging**, meaning this works even for nested structures like the `nodes` array: if you send one node's updated `instructions`, only that node updates (matched by its `id`) — other nodes and other fields on that same node are left untouched.

⚠️ **The single most common mistake integrators make:** trying to update an agent's prompt by sending an `instructions` field at the *top level* of the request. **This does nothing.** Instructions live inside `nodes`, specifically the node with `id: "__start__"` for a simple agent.

**Correct way to update just the instructions:**
```json
{
  "id": "your_agent_id",
  "agent": {
    "nodes": [
      { "id": "__start__", "instructions": "Your new instructions here." }
    ]
  }
}
```

**Update instructions AND the model/LLM settings together:**
```json
{
  "id": "your_agent_id",
  "agent": {
    "nodes": [
      {
        "id": "__start__",
        "instructions": "You are a friendly customer support agent. Help users with their questions.",
        "llmConfig": {
          "modelId": "gpt-4o",
          "temperature": 0.7,
          "maxTokens": 2048
        }
      }
    ]
  }
}
```
(`temperature` and `maxTokens` correspond exactly to the dashboard's Model Configuration sliders described in Master Reference §6.5.)

**Update just the agent's title/description (metadata) alongside instructions:**
```json
{
  "id": "your_agent_id",
  "agent": {
    "title": "My Updated Agent",
    "description": "A helpful customer support assistant",
    "nodes": [
      { "id": "__start__", "instructions": "Greet users warmly and help them with their inquiries." }
    ]
  }
}
```

**Node object fields you can set:**

| Field | Type | Meaning |
|---|---|---|
| `id` | string | Required. `"__start__"` for the main node, or a custom ID for other Canvas nodes. |
| `instructions` | string | The prompt/behavior text for that node. |
| `name` | string | Display name shown in the dashboard. |
| `llmConfig` | object | `modelId`, `temperature`, `maxTokens` — see §4.6 below for temperature guidance. |

**Custom theme structure (advanced):** if you want to set a full 10-color palette instead of just a primary color:
```json
{
  "agent": {
    "theme": "custom-dark",
    "customThemeJSONString": "{\"themeType\":\"dark\",\"primary\":\"#8A2BE2\",\"nineColorPallet\":[[280,60,50],[280,60,45],...],\"autogenTheme\":false}"
  }
}
```
- `theme` (top-level field) must match the `themeType` *inside* the JSON string (e.g. `"custom-dark"` outside pairs with `"dark"` inside)
- `nineColorPallet` is an array of exactly 10 `[Hue, Saturation, Lightness]` triples (HSL color format: Hue 0–360 = position on the color wheel, Saturation 0–100 = intensity, Lightness 0–100 = brightness)
- Set `autogenTheme: true` instead if you just want to supply a `primary` color and have Convocore auto-generate the rest of the palette — much simpler for most use cases:
```json
{
  "agent": {
    "theme": "custom-light",
    "customThemeJSONString": "{\"themeType\":\"light\",\"primary\":\"#6366f1\",\"autogenTheme\":true}"
  }
}
```

⚠️ **Deprecated / legacy top-level fields — do not use these in new code:** `vg_systemPrompt`, `vg_initPrompt`, `vg_prompt`, `vg_initMessages`, and a top-level `instructions` field. These existed before the `nodes` array architecture and are only relevant if you're migrating an old agent — see §4.5 (Import Template) for the proper migration path. Always use `nodes` going forward.

### 4.5 Delete an agent

```
DELETE /agents/{id}
```
⚠️ **Irreversible.** Also deletes all tools and variables associated with that agent. You must own the agent. Consider exporting a template first (§4.6) if you might need it later.

### 4.6 Export / Import agent templates (backup, duplication, sharing)

**Export** — get a portable JSON snapshot of an agent's full configuration:
```
GET /agents/{agentId}/export-template
```
```json
{
  "agentTemplate": {
    "name": "My Agent - Exported 2024-01-15T10:30:00.000Z",
    "agentData": { "title": "My Agent", "description": "Customer support agent", "nodes": [...] },
    "tools": [...],
    "variables": [...],
    "nodes": [...],
    "workspaceId": "workspace_123"
  }
}
```
Use cases: **backup** before making risky changes, **duplicate** an agent (export then import), **share** a template with another workspace. Note: the agent's `SECRET_API_KEY` is deliberately excluded from exports for security — you can't accidentally leak it via a shared template file.

**Import** — recreate an agent from an exported template:
```
POST /agents/import-template
```
```json
{
  "agentTemplate": { "name": "My Template", "agentData": {...}, "tools": [...], "variables": [...], "nodes": [...] },
  "agentName": "My New Agent"
}
```
New unique IDs are generated for the agent itself and all its tools/variables — internal references between them (e.g. a prompt mentioning a tool) are automatically rewritten to point at the new IDs, so nothing breaks.

**Special case — migrating a legacy (pre-`nodes`) agent to the modern architecture:**
```json
{
  "fromAgentId": "existing_agent_id",
  "agentName": "My Converted Agent"
}
```
This creates a brand-new node-based agent and automatically migrates the old `vg_systemPrompt`/`vg_initPrompt` fields into the new start node's `instructions`, copies all tools/variables (with fresh IDs), and migrates KB documents. This is the correct, supported way to move an old agent onto the current architecture — don't try to do it by hand.

### 4.7 Agent usage (credits & LLM token consumption for one agent)

```
POST /agents/{agent_id}/usage
```
Returns credit and LLM token usage stats for a single agent (compare to Workspace Usage, §11.5, which is account-wide). Useful for building your own per-agent cost dashboard, or alerting if one agent's spend spikes unexpectedly.

---

## 5. Tools

**What a "tool" is, in API terms:** a connection between the agent and an external API/webhook (see Master Reference §4 for the conceptual/dashboard side). Programmatically, a Tool is just a stored description of *how to call that external endpoint*, plus *what parameters it needs* — the LLM decides at conversation time whether/when to invoke it, based on the `description` you write.

### 5.1 List tools for an agent

```
GET /agents/{agentId}/tools
```
Returns every tool attached to that agent, including each tool's parameter (`fields`) configuration.

💡 Reference a tool inside agent instructions using `{{tool:tool_id}}` — this is how you "point" the prompt at a specific tool by ID.

### 5.2 Get one tool by ID

```
GET /tools/{toolId}
```
Full config: parameter fields, server URL, channel restrictions. Useful to inspect before making an update, so you know exactly what you're changing.

### 5.3 Create a tool

```
POST /agents/{agentId}/tools
```
```json
{
  "tool": {
    "name": "Get Weather",
    "description": "Fetches current weather data for a given location",
    "serverUrl": "https://api.example.com/weather",
    "method": "GET",
    "fields": [
      {
        "id": "location",
        "key": "city",
        "type": "string",
        "in": "query",
        "description": "City name for weather lookup",
        "required": true
      }
    ]
  }
}
```

**Field-by-field meaning:**
- `name` and `description` are **required**. The `description` is what the LLM reads to decide *when* to call this tool — vague descriptions cause the agent to either never use the tool or use it at the wrong moment (see Master Reference §4.4's warning about tool-response clarity — the same principle applies to how you describe the tool itself).
- `fields` — the list of parameters this tool accepts. Each field needs:
  - `key` — the actual parameter name sent to your server
  - `type` — data type (`string`, `number`, `boolean`, etc.)
  - `in` — **where** this parameter goes in the HTTP request: `"query"` (part of the URL, like `?city=London`), `"body"` (part of the JSON payload), or `"header"` (part of the request headers)
  - `description` — explains to the LLM what this specific parameter is for
  - `required` — whether the LLM must collect this value from the user before calling the tool

**Restricting which channels can use a tool:** add `channels: ["web-chat", "whatsapp"]` to limit a tool to specific deployment channels (see Master Reference §10 for the full channel list) — useful if a tool only makes sense on some channels (e.g. a "send SMS confirmation" tool that shouldn't fire from a voice call).

### 5.4 Update a tool

```
PATCH /tools/{toolId}
```
```json
{
  "tool": {
    "name": "Updated Tool Name",
    "description": "Updated description for the AI",
    "disabled": false
  }
}
```
Partial update — only sent fields change. 💡 Set `disabled: true` to temporarily turn a tool off **without deleting it** — useful when debugging ("is this tool causing the weird behavior?") or during maintenance on the external API it calls.

### 5.5 Delete a tool

```
DELETE /tools/{toolId}
```
⚠️ **Irreversible.** Any `{{tool:tool_id}}` references in agent instructions will simply stop working (the LLM will no longer be able to call it) — they are not automatically cleaned up from the prompt text, so go remove those references yourself. Variables associated with the tool also aren't auto-deleted; clean those up separately if they're no longer needed.

---

## 6. Variables

**What a "variable" is, in API terms:** a named slot for storing a piece of data during or across a conversation (see Master Reference §6.8 for the Canvas/dashboard concept — user's name, an order ID, a computed value, etc.). Variables let the agent "remember" things and let your prompt text reference dynamic values.

### 6.1 List variables for an agent

```
GET /agents/{agentId}/variables
```
Returns all variables with their current values.

💡 Reference a variable inside agent instructions using `{{var:variable_id}}`.

### 6.2 Get one variable by ID

```
GET /variables/{variableId}
```
Full config including current value and default value. 💡 **System variables** (`type: "system"`) are built-in — e.g. conversation ID, user info — you don't create these yourself, they already exist and are automatically populated.

### 6.3 Create a variable

```
POST /agents/{agentId}/variables
```
```json
{
  "variable": {
    "key": "user_name",
    "type": "string",
    "description": "Stores the user's name during conversation",
    "defaultValue": "",
    "isGlobal": true
  }
}
```
- `key` must be **unique within the agent** — creating a second variable with the same key returns a 400 error (an HTTP status code meaning "your request was malformed/invalid").
- `isGlobal: true` — makes the variable persist and stay accessible across **every node** in a Canvas flow, not just the node it was created in (see Master Reference §6.8 for why this matters in multi-node agents).

### 6.4 Update a variable

```
PATCH /variables/{variableId}
```
```json
{
  "variable": { "value": "John Doe", "description": "Updated description" }
}
```
- Set `value` to change the variable's **current** value (what it holds right now).
- Set `defaultValue` instead to change what it **resets to** for new/future conversations.
- ⚠️ The `key` **cannot be changed** after creation — if you need a different key, create a new variable and migrate references manually.

### 6.5 Delete a variable

```
DELETE /variables/{variableId}
```
⚠️ **Irreversible.** Any `{{var:id}}` references in agent instructions stop resolving. Tools that were configured to use this variable's value are **not** automatically updated — review your tool configs after deleting a variable to avoid a tool silently trying to reference something that no longer exists.

---

## 7. Knowledge Base (KB)

**What this is, in API terms:** programmatic control over the documents that power an agent's RAG/retrieval (see Master Reference §3 for the full conceptual explanation of chunks, embeddings, and retrieval). ⚠️ These endpoints work for **native Convocore agents only** — if your agent's `agentPlatform` is `"vf"` (Voiceflow), use Voiceflow's own API for KB management instead; Convocore's KB endpoints won't touch a VF agent's knowledge base.

### 7.1 List KB documents

```
GET /agents/{agentId}/kb
```
Sorted newest-first by timestamp. Use `page` and `pageSize` query parameters to paginate (fetch results in smaller chunks) if the KB is large.

### 7.2 Get one KB document

```
GET /agents/{agentId}/kb/{docId}
```
Includes a `chunks` array — this shows exactly how the document's text was split up for embedding/retrieval, each with a `chunkID` and its `content`. 💡 Useful for debugging retrieval quality: if the agent isn't finding the right info, inspecting the actual chunks often reveals *why* (e.g. an important fact got split awkwardly across two chunks).

### 7.3 Add a document

```
POST /agents/{agentId}/kb
```

**Adding raw text directly:**
```json
{
  "name": "Product FAQ",
  "sourceType": "doc",
  "content": "Your product FAQ content here...",
  "metadata": { "description": "Frequently asked questions about our product" },
  "tags": ["faq", "product"]
}
```

**Adding one or more specific URLs to scrape:**
```json
{
  "name": "Website Pages",
  "sourceType": "url",
  "urls": ["https://example.com/about", "https://example.com/pricing"],
  "scrapeContent": true,
  "refreshRate": "3d"
}
```

**Crawling an entire sitemap:**
```json
{
  "name": "Full Website",
  "sourceType": "sitemap",
  "sitemapUrl": "https://example.com/sitemap.xml",
  "maxPages": 100,
  "scrapeContent": true,
  "refreshRate": "7d"
}
```

`refreshRate` options: `"3d"`, `"7d"`, or `"never"` — controls how often Convocore automatically re-scrapes the source to catch content updates (same concept as the Crawler's refresh rate in Master Reference §3.6, just set here via API instead of the dashboard).

⚠️ URL and sitemap sources take time to process (scraping isn't instant) — check the document's status with `GET /agents/{agentId}/kb/{docId}` and look at its status field before assuming it's ready to use.

### 7.4 Update a KB document

```
PATCH /agents/{agentId}/kb/{docId}
```

Update metadata only (fast):
```json
{ "name": "Updated Product FAQ", "tags": ["faq", "product", "v2"] }
```

Update the actual content:
```json
{ "content": "Updated document content...", "metadata": { "description": "Updated description for better context" } }
```
⚠️ Updating `content` triggers **re-embedding** (recomputing the document's vector representation for search) — this can take noticeable time for large documents, so don't assume it's instant even though the API call itself returns quickly.

### 7.5 Delete a KB document

```
DELETE /agents/{agentId}/kb/{docId}
```
⚠️ **Irreversible** — removes the document, all its text chunks, and its vector embeddings. The agent immediately loses access to that content. 💡 If you just want to temporarily exclude a document from retrieval without permanently deleting it, consider using **tags** to filter it out instead (requires corresponding logic in how you structure retrieval — this is a workaround, not a built-in "disable" toggle for KB docs the way tools have `disabled`).

### 7.6 Search the KB directly

```
POST /agents/{agentId}/kb/search
```

**Text search** (most common — you give a question, Convocore handles turning it into a search):
```json
{ "searchQuery": "refund policy for annual subscriptions", "max_chunks": 3, "with_payload": true }
```

**Vector search** (advanced — you already have a pre-computed embedding and want to search with it directly):
```json
{ "vector": [0.12, -0.03, 0.91], "vectorDb": "postgres", "max_chunks": 5, "similarity_threshold": 0.2 }
```

💡 **Embedding**, in plain terms: a way of converting text into a list of numbers (a "vector") that captures its *meaning*, so that texts with similar meaning end up as similar-looking number-lists — this is the underlying math that makes semantic/RAG search possible. You almost never need to compute embeddings yourself; use `searchQuery` and let Convocore handle it.

Results are **chunk-level** — meaning the same source document can appear more than once in results if multiple of its chunks are independently relevant to the query.

### 7.7 KB stats

```
GET /agents/{agentId}/kb/stats
```
Returns aggregate stats about the KB's size/growth. Only counts documents that have finished processing (`PENDING` or `ERROR` status documents are excluded from the counts) — so don't be alarmed if stats don't immediately reflect a document you just added; give it time to process first.

---

## 8. Leads

**What a "lead" is, in API terms:** a captured contact record — someone who gave the agent their name/email/phone during a conversation (or was added directly via API). See Master Reference §8 for the Lead Qualification Funnel, which is the dashboard feature that *automatically* creates/scores leads from conversation content; these endpoints let you manage lead records directly and programmatically, independent of the funnel feature.

### 8.1 List all leads

```
GET /leads
```
Returns all leads for the agent(s) you have access to. Leads are usually captured **automatically** during conversations when the user provides contact info — you don't have to manually create most leads yourself; this endpoint is more often used to *read* them out for your own CRM/reporting.

### 8.2 Get one lead by ID

```
GET /leads/{id}
```
Full lead detail including `metaData`. 💡 The `convoId` field links back to the exact conversation where this lead was captured — use it with the Conversations endpoints (§9) to pull the full transcript around a specific lead.

### 8.3 Create a lead

```
POST /leads
```
```json
{
  "lead": {
    "agentId": "your_agent_id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "metaData": { "company": "Acme Inc", "source": "api", "notes": "Interested in enterprise plan" }
  }
}
```
`agentId` is required. At least one contact field (`email`, `phone`, or `name`) is strongly recommended — a lead with none of those isn't very useful. 💡 Use `metaData.source` to tag *where* a lead came from (`"chat"`, `"web"`, `"api"`, `"import"`) so you can later analyze which channels/methods actually produce leads.

### 8.4 Update a lead

```
PATCH /leads/{id}
```
```json
{ "lead": { "name": "John Smith", "metaData": { "notes": "Follow up scheduled for next week" } } }
```
Partial update. The `ts` (timestamp) field auto-updates whenever you change anything. ⚠️ You **cannot** change `agentId` after creation — if a lead needs to be reassigned to a different agent, create a fresh lead record instead.

### 8.5 Delete a lead

```
DELETE /leads/{id}
```
⚠️ **Irreversible**, but note: this only deletes the **lead record**. The underlying **conversation** (the actual chat transcript) is *not* deleted — those are separate resources (§9). Deleting a lead just removes the CRM-style contact record pointing at it.

---

## 9. Conversations

**What a "conversation" is, in API terms:** the record of one chat session between a user and an agent — every message exchanged, plus metadata (who the user was, which channel, when it started/ended). See Master Reference §9 (Conversations tab / Analytics) for the dashboard-side view of this same data.

### 9.1 List conversations for an agent

```
GET /agents/{agentId}/convos
```
Sorted newest-first. Empty conversations (ones with no meaningful content) are automatically filtered out of the results.

**Query parameters:**

| Parameter | Type | Default | Meaning |
|---|---|---|---|
| `page` | number | 1 | Which page of results to fetch |
| `limit` | number | 20 | How many conversations per page |

**What comes back for each conversation** (summary-level, not full transcript):
- **Lead-style contact fields**: `userName`, `userEmail`, `userPhone`, `userAddress`, `userCompany`, `userWebsite`, `notes`, `userProfilePic`
- **Metadata**: `ID`, `userID`, `messagesNum` (message count), `tags`, `origin` (which channel, e.g. `"web-chat"`, `"whatsapp"`), timestamps (`ts`, `firstMessageTS`, `lastMessageTS`)

### 9.2 Get one conversation

```
GET /agents/{agentId}/convos/{convoId}
```
Same fields as the list version, plus `state` (the conversation's current status, e.g. `"ai-chatting"`) and `lastModified`. This still does **not** include the full turn-by-turn message transcript — for that, use Export (§9.5).

### 9.3 Create a conversation

```
POST /agents/{agentId}/convos
```
```json
{
  "conversation": {
    "ts": 1699999999,
    "messagesNum": 0,
    "userName": "John Doe",
    "userEmail": "john@example.com",
    "userPhone": "+1234567890",
    "userCompany": "Acme Corp",
    "notes": "Customer interested in premium plan, follow up next week",
    "tags": ["new-lead"]
  }
}
```
⚠️ In normal operation, conversations are created **automatically** whenever a user interacts with an agent on any channel — you generally don't need to create them by hand. This endpoint exists mainly for edge cases like importing historical chat data from another system. `ts` (a Unix timestamp — the number of seconds/milliseconds since Jan 1 1970, the standard way computers represent a moment in time) is required; a unique conversation ID is auto-generated.

**Full list of optional lead-style fields you can attach:** `userName`, `userEmail`, `userPhone`, `userAddress`, `userCompany`, `userWebsite`, `notes`, `userProfilePic`, `tags` (array).

### 9.4 Update a conversation

```
PATCH /agents/{agentId}/convos/{convoId}
```
```json
{ "conversation": { "tags": ["support", "resolved"], "state": "completed", "title": "Product Inquiry - Resolved" } }
```
Partial update. 💡 **Tags are merged, not replaced** — if the conversation already had tags `["new-lead"]` and you PATCH with `["support", "resolved"]`, the result is all three combined (duplicates automatically removed), not just the two you sent. `lastModified` auto-updates on any change.

### 9.5 Export conversations (full transcripts)

**All conversations for an agent:**
```
GET /agents/{agentId}/convos/export
```

**One specific conversation:**
```
GET /agents/{agentId}/convos/{convoId}/export
```

This is the endpoint that gives you the **actual message-by-message transcript** (list vs. get above only give summary metadata). Response shape:
```json
{
  "success": true,
  "data": {
    "metadata": {
      "feedback": "Positive",
      "convo": { "id": "convo123", "userName": "John Doe", "userEmail": "john@example.com", "notes": "...", "tags": ["new-lead"] },
      "sessions": []
    },
    "turns": [
      { "from": "user", "messages": [{ "type": "text", "ts": "December 1st 2024, 10:30:00 am", "payload": { "message": "Hello!", "feedback": "Unset", "aiGenerated": false } }] },
      { "from": "bot", "messages": [{ "type": "text", "ts": "December 1st 2024, 10:30:02 am", "payload": { "message": "Hi! How can I help you today?", "feedback": "Positive", "aiGenerated": true } }] }
    ]
  }
}
```
Each `turn` has a `from` (`"user"` or `"bot"`) and a `messages` array. Each message has a `feedback` value (`"Positive"`, `"Negative"`, or `"Unset"` — corresponds to thumbs-up/down feedback a user might have given that specific message) and `aiGenerated` (true for bot messages, false for user messages).

**Use cases:** exporting for external analytics, backing up conversation history, building a training dataset, feeding transcripts into your own reporting/email pipeline.

### 9.6 Delete a conversation

```
DELETE /agents/{agentId}/convos/{convoId}
```
⚠️ **Irreversible** — deletes the conversation and all associated turns/sessions. Consider exporting first (§9.5) if you might need the data later.

---

## 10. Calls, Numbers & Voices

Three closely related resource groups covering telephony: making calls, managing phone numbers, and browsing available synthetic voices. See Master Reference §11 and §18 for the full conceptual/dashboard picture (Twilio setup, SIP trunking, Ultravox, etc.) — this section is the API-only view.

### 10.1 Outbound Voice Call

```
POST /calls
```
```json
{ "from": "+14155551234", "to": "+14155556789", "agentId": "your-agent-id" }
```
Initiates an outbound call using Twilio, connecting your agent to a phone number. Both `from` and `to` must be **E.164 format** (a phone number standard — always starts with `+`, then country code, then the number, no spaces or dashes, e.g. `+14155551234` not `(415) 555-1234`). The `from` number must be a Twilio number already associated with your account.

**Optional extras:** `options.messagesHistory` (feed in prior conversation context, e.g. if this call is a continuation of an earlier chat), `options.agentOverrides` (customize the agent's behavior just for this specific call, without permanently changing its configuration).

⚠️ Calls incur usage charges (see Master Reference §15.6 for the per-minute cost breakdown) — monitor usage to avoid unexpected costs, especially if triggering calls programmatically/in bulk.

### 10.2 Phone Number Management (Twilio)

All under the `/utils/twilio/*` and `/utils/*-twilio-number` paths — these are **utility endpoints** for managing the phone numbers your agents use for voice/SMS.

**Search purchasable numbers:**
```
POST /utils/twilio/available-numbers
```
```json
{ "inRegion": "CA" }
```
Returns up to 25 currently-available US local numbers; `inRegion` (a US state code) biases the search geographically.

**Buy a number:**
```
POST /utils/buy-twilio-number
```
```json
{ "number": "+14155551234", "agentId": "your-agent-id", "capabilities": ["voice", "sms"] }
```
⚠️ Requires an available phone-number slot on your plan.

**Import a number you already own:**
```
POST /utils/import-twilio-number
```
```json
{
  "twilioNumber": "+14155551234",
  "twilioAccountSid": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "twilioAccountAuthToken": "your-auth-token",
  "twilioCallerId": "PNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "agentId": "your-agent-id",
  "capabilities": ["voice", "sms"]
}
```
You'll need your Twilio **Account SID** and **Auth Token** from the Twilio Console. Convocore configures the correct webhooks automatically.

**Verify/repair webhooks:**
```
POST /utils/twilio/check-number
```
```json
{ "phoneNumberSid": "PNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", "isImportedNumber": false }
```

**Release a number:**
```
POST /utils/twilio/release-number
```
```json
{ "phoneNumberSid": "PNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", "isImportedNumber": false }
```
⚠️ For platform-rented numbers, this is **permanent**. For imported numbers, only the Convocore-side link is removed.

**Link a number for SMS use:**
```
POST /utils/twilio/sync-sms
```
```json
{ "twilioNumberId": "PNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", "agentId": "agent_123" }
```

### 10.3 Voices API (browsing/searching TTS voices)

TTS = Text-to-Speech. These are **read-only, credit-free** utility endpoints.

**List every supported voice provider:**
```
GET /voices/providers
```

**Search across all providers at once:**
```
GET /voices
```
Filter by `language`, `gender`, `accent`, `providers[]`.

**Browse one specific provider's catalog:**
```
GET /voices/{provider}
```
```bash
curl "https://eu-gcp-api.vg-stuff.com/v3/voices/elevenlabs?language=en&gender=female&limit=25" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Get one specific voice's detail:**
```
GET /voices/{provider}/{voiceId}
```
Returns metadata plus a `previewUrl` MP3.

---

## 11. SMS

**What this is:** sending text messages from an agent's connected Twilio number — either a message you write yourself, or one the AI generates. See Master Reference §19 for how a number becomes SMS-capable in the first place.

### 11.1 Send a single SMS

```
POST /sms
```

**Direct send** (you write the exact text):
```json
{
  "agentId": "your-agent-id",
  "to": "+15551234567",
  "message": "Hi Jane — following up on your appointment.",
  "campaignId": "campaign-123",
  "leadInfo": { "username": "Jane", "email": "jane@example.com" }
}
```

**AI-generated opener** (`mode: "agent"` — you give the AI an instruction, it writes the message):
```json
{
  "agentId": "your-agent-id",
  "to": "+15551234567",
  "mode": "agent",
  "leadInfo": { "username": "Jane", "company": "Acme Corp" },
  "options": {
    "initialPrompt": "Write a short friendly SMS to remind them about tomorrow's appointment.",
    "sendViaEdge": true
  }
}
```

`to` (and `from`, if provided) must be E.164 format. The agent must have an SMS-capable Twilio number connected. 💡 Use `options.dryRun: true` to **test the routing** (which from-number would be used, which mode, how many SMS "segments" the message would take — SMS has a character-per-segment limit, and long messages get split and billed as multiple segments) **without actually sending anything** — useful for validating configuration before going live.

### 11.2 Bulk-send SMS to a list of leads

```
POST /smsLeads
```
```json
{
  "agentId": "your-agent-id",
  "message": "Hi! Quick follow-up from our team.",
  "mode": "direct",
  "leads": [
    { "userPhone": "+15551234567", "username": "Jane" },
    { "userID": "+15559876543", "username": "Bob" }
  ],
  "contactMethodsPriority": ["userPhone", "userID", "phone"]
}
```
Each lead object is passed through as `leadInfo` for its own send, so `mode: "agent"` can personalize the opener per-recipient (e.g. using their name). `contactMethodsPriority` tells Convocore which field to try first when looking for a phone number on each lead object, in case your lead records aren't perfectly consistent about which field holds the number.

---

## 12. Campaigns

**What this is:** the API side of the outbound Campaigns feature (Master Reference §21.1) — automated outreach to a group of leads, primarily voice calls or WhatsApp templates.

The Campaigns resource group is present in the V3 API's resource list and the OpenAPI spec (`campaigns.json`), covering create/list/get/update/delete/start/pause/stop operations mirroring the dashboard's Campaigns tab described in the Master Reference doc. The full field-by-field request schema wasn't present in the fetched documentation source — **before building against this resource, fetch `/api-reference/v3/openapi/campaigns.json` directly** (or the individual `/api-reference/v3/campaigns/*` pages if published) for exact field names, since guessing the shape risks mismatched requests. The dashboard-level settings (target lead group, concurrency slots, delay between calls, initial prompt, call analysis summary prompt, post-call metrics, scheduling window/timezone/working days — Master Reference §21.1) are a reliable guide to *what fields to expect*, even without the exact JSON schema in hand.

---

## 13. Custom Metrics

**What this is:** programmatic definition and querying of agent-specific KPIs (Key Performance Indicators — a business metric you've decided is important to track, e.g. customer satisfaction score). See Master Reference §21.2 for the dashboard/conceptual view.

### 13.1 Create a metric

```
POST /agents/{agentId}/custom-metrics
```

**Number type** (ratings, counts, durations):
```json
{ "metric": { "key": "customer_satisfaction", "description": "Customer satisfaction rating (1-10)", "type": "number" } }
```

**Boolean type** (yes/no):
```json
{ "metric": { "key": "issue_resolved", "description": "Whether the customer's issue was resolved", "type": "boolean" } }
```

**Enum type** (fixed set of categories — ⚠️ requires an `options` array with at least one value):
```json
{ "metric": { "key": "sentiment", "description": "Customer sentiment analysis", "type": "enum", "options": ["positive", "negative", "neutral"] } }
```

**String type** (open-ended text):
```json
{ "metric": { "key": "feedback", "description": "Customer feedback comments", "type": "string" } }
```

**Key rules:** unique per agent, case-sensitive, max 100 characters, descriptive naming recommended (`customer_satisfaction` not `cs` — the description is also what helps the agent understand *when* to populate this metric during a conversation). Once created, the agent **automatically starts tracking** the metric — no extra wiring needed.

### 13.2 List metrics

```
GET /agents/{agentId}/custom-metrics
```
Paginate large collections with `limit` and `startAfterId`:
```javascript
// First page
const page1 = await fetch('/v3/agents/{agentId}/custom-metrics?limit=20');
// Next page — use the last metric's ID from page1 as the cursor
const page2 = await fetch(`/v3/agents/{agentId}/custom-metrics?limit=20&startAfterId=${lastMetricId}`);
```
💡 **`startAfterId` = cursor-based pagination**: instead of "give me page 2," you say "give me results starting right after this specific item's ID" — more reliable than page-number pagination when items can be added/removed between requests.

Each result includes `isSystem` — `true` for built-in platform metrics, which **cannot be deleted or updated** via API.

### 13.3 Get one metric

```
GET /agents/{agentId}/custom-metrics/{metricId}
```

### 13.4 Update a metric

```
PATCH /agents/{agentId}/custom-metrics/{metricId}
```
```json
{ "metric": { "description": "Updated description for the metric" } }
```
Partial update. You can also expand an enum's options:
```json
{ "metric": { "options": ["very_positive", "positive", "neutral", "negative", "very_negative"] } }
```
⚠️ Changing a metric's `type` doesn't convert historical data — old values keep their old shape. If data-integrity matters, create a new metric instead of changing an existing one's type.

### 13.5 Delete a metric

```
DELETE /agents/{agentId}/custom-metrics/{metricId}
```
Stops **future** tracking. ⚠️ Does **not** delete historical data already recorded — past values remain queryable via the data endpoints below. System metrics (`isSystem: true`) can never be deleted.

### 13.6 Get data for one metric

```
GET /agents/{agentId}/custom-metrics/{metricKey}/data?startTs=...&endTs=...
```
Returns aggregated stats (average/sum/min/max for numbers, counts per category for enums/booleans) for a time range. Add `&includeTimeSeries=true` to also get individual data points with timestamps — **off by default** to keep responses small (can grow a response from ~10KB to ~2MB depending on range/volume, so only enable when you actually need point-by-point detail).

### 13.7 Get data for ALL metrics at once

```
GET /agents/{agentId}/custom-metrics/data?startTs=...&endTs=...
```
One request instead of N — ideal for a dashboard overview showing every KPI at a glance.

---

## 14. Crawler

**What this is:** the API side of the Crawler feature (Master Reference §3.6) — scheduled, job-based scraping of websites to feed a Knowledge Base, more powerful than the basic in-KB URL scraper.

### 14.1 Create a crawler job

```
POST /workspaces/{workspaceId}/crawler/jobs
```
Starts processing in the background immediately. Supports single-page jobs, multi-URL jobs, and full-crawl jobs (via `crawlOptions` — matching the dashboard's match/unmatch URL patterns and page limits from Master Reference §3.6). You can also register outbound webhooks for `page_scraped`, `job_completed`, and `job_failed` events, so your own system gets notified as the job progresses instead of having to poll for status.

💡 **Credits are estimated at submission but actually charged per successfully scraped page** — if a page fails to scrape, you aren't charged for it. Set `useProxy: true` only when genuinely needed (e.g. a site that blocks normal scraping) — proxy scraping costs more credits per page.

⚠️ **Crawler jobs are immutable after creation** — you cannot edit settings on an existing job. If you need different settings, delete the job (§14.2) and create a new one.

### 14.2 Delete a crawler job

```
DELETE /workspaces/{workspaceId}/crawler/jobs/{jobId}
```
Removes the job record and its stored scraped page documents.

### 14.3 Get one job (status/progress)

```
GET /workspaces/{workspaceId}/crawler/jobs/{jobId}
```
Read-only (jobs can't be updated, only read or deleted). Use this for polling progress, checking final status, or inspecting your webhook configuration.

### 14.4 List jobs

```
GET /workspaces/{workspaceId}/crawler/jobs
```
Paginated (`page`, `limit`). Each entry includes status, page counts, estimated credits, per-page billing rate, and a webhook config summary.

### 14.5 Get one scraped page (full content)

```
GET /workspaces/{workspaceId}/crawler/jobs/{jobId}/pages/{pageId}
```
Returns the full markdown/HTML payload for that page — useful for preview screens, export pipelines, or reviewing exactly what content was captured before importing it into a KB.

### 14.6 List scraped pages (summary)

```
GET /workspaces/{workspaceId}/crawler/jobs/{jobId}/pages
```
Lighter-weight than fetching each page individually — returns URL, title, description, character counts, and a failed-page marker for every page in the job. Use this to build a review UI before deciding which pages to actually import into a KB.

---

## 15. Workspaces

**What this is:** the top-level container for your account — agents, team members, billing, and workspace-wide settings all live under a workspace. See Master Reference §14/§23 for the whitelabel/agency concept, which builds on top of workspaces.

### 15.1 List your workspaces

```
GET /workspaces
```
Returns every workspace you have access to — as owner or as a team member.

### 15.2 Get one workspace

```
GET /workspaces/{id}
```
Full detail including team members and configuration.

### 15.3 Create a workspace

```
POST /workspaces
```
```json
{ "workspaceName": "My Team Workspace", "workspaceEmails": ["teammate1@example.com", "teammate2@example.com"] }
```
`workspaceName` is required. Anyone listed in `workspaceEmails` receives an invitation email. ⚠️ How many workspaces (and seats within them) you can create depends on your subscription plan.

### 15.4 Update a workspace

```
PATCH /workspaces/{id}
```
```json
{ "updates": { "workspaceName": "Updated Workspace Name", "marketplaceProfile": { "username": "my-unique-username", "description": "We build AI agents" } } }
```
Partial update. `marketplaceProfile.username` must be globally unique — set this up if you want to publish/share agents on Convocore's marketplace.

### 15.5 Delete a workspace

```
DELETE /workspaces/{id}
```
⚠️ **Irreversible and severe** — permanently removes every agent, every conversation, every lead, every tool, every variable, and all team access in that workspace. Only workspace owners can do this, and you cannot delete your **primary** workspace (the one your account defaults to).

### 15.6 Workspace usage (account-wide)

```
POST /workspaces/{uid}/usage
```
```json
{ "range": { "start": 1700000000000, "end": 1700086400000 }, "logsPage": 1 }
```
Timestamps in Unix **milliseconds** (note: this differs from some other endpoints that use seconds — always double check which unit an endpoint expects). This is the workspace-wide equivalent of Agent Usage (§4.7) and mirrors the dashboard's Usage Tab (Master Reference §21.3) — total credits, tokens, and cost across **every** agent in the workspace, not just one.

---

## 16. Organizations (Orgs)

**What this is:** the API view of the multi-workspace / agency structure — see Master Reference §14 and §23–24 for the full whitelabel/agency conceptual picture (an "org" here roughly corresponds to what the dashboard calls a client organization or an agency's broader structure spanning multiple workspaces).

### 16.1 List all organizations you can access

```
GET /orgs
```
Paginated (`page`, `pageSize`). Returns every org where you're a member or admin.

### 16.2 Get an organization's agents

```
GET /orgs/{orgId}/agents
```
All agents belonging to that org — useful for managing agents across multiple workspaces under one organizational umbrella (an agency managing several client workspaces, for instance).

### 16.3 Get an organization's clients (workspaces)

```
GET /orgs/{orgId}/clients
```
⚠️ Requires organization admin access. Returns the individual client workspaces/teams that make up the organization.

---

## 17. WebSocket Interact (Real-Time Conversations)

### 17.1 What a WebSocket is, and why this is different from everything above

Every endpoint so far has been **REST**: your code sends one request, waits, gets one response back, done. That's fine for "create an agent" or "fetch a list of leads" — but it's the wrong shape for an actual back-and-forth conversation, where you want the AI's reply to start appearing *while it's still being generated* (like watching someone type in real time), not all-at-once after a delay.

A **WebSocket** solves this by opening one **persistent connection** that stays open and lets both sides send messages to each other at any time, in either direction — more like a phone call than a series of letters. This is the exact mechanism that powers Convocore's own chat widget.

### 17.2 Connecting

```
wss://<region>-gcp-api.vg-stuff.com/interact
```
`<region>` is `eu` or `na` — same region rule as everywhere else in this document. `wss://` is the secure (encrypted) version of the WebSocket protocol, the same relationship `https://` has to `http://`.

### 17.3 Sending a message — the `InteractObject`

Once connected, you send exactly **one** JSON object to start/continue a conversation turn:

```typescript
{
  agentId: "your-agent-id",
  convoId: "your-convo-id",
  bucket: "voiceglow-eu" | "(default)",   // matches your region: eu vs na
  prompt: "Hello, how can you help me?",   // the user's message
  agentData: {
    ownerID: "user-id",   // your own internal user identifier
    userID: "user-id"
  },
  // Optional — extra context about who's chatting and where from
  lightConvoData: {
    userName: "John Doe",
    userEmail: "john@example.com",
    userPhone: "+1234567890",
    origin: "web-chat" | "discord" | "messenger" | "instagram" | "gb-chat"
  }
}
```

**Field meanings:**
- `agentId` — which agent should handle this turn
- `convoId` — which conversation this belongs to (you choose/generate this ID yourself and reuse it across turns in the same conversation, so the agent has continuity/memory of earlier messages)
- `bucket` — a region marker; use `"voiceglow-eu"` for EU or `"(default)"` for NA (an asymmetry worth noting — it's not simply `"eu"`/`"na"`)
- `prompt` — the actual text the user typed/said
- `agentData` — identifies the end-user to Convocore's own systems (used for e.g. per-user interaction limits, Master Reference §2.5)
- `lightConvoData` — optional metadata that helps personalize the response and gets attached to the resulting conversation record (matches the lead-style fields you'd otherwise set via the Conversations REST endpoints, §9.3)

### 17.4 Receiving the response — the message stream

The server streams back **multiple** messages over the same connection as it generates the reply, each shaped like:

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

**What each `type` means:**

| `type` | What it carries | When you'd see it |
|---|---|---|
| `"sync_chat_history"` | Prior conversation turns (`turns` array) | Sent early, to sync your client with the existing conversation state (e.g. if the user reloaded the page mid-conversation) |
| `"metadata"` | `sources` — which KB documents were used to ground the answer | Useful for showing "this answer was based on: [doc names]" in your UI |
| `"debug"` | Internal diagnostic info | Development/troubleshooting only |
| `"chunk"` | A `chunk` of response text, plus its `chunkIndex` (position in sequence) | The bulk of messages — this is the actual reply, arriving piece by piece; concatenate chunks **in `chunkIndex` order** to reconstruct the full message as it streams in |
| `"action"` | An action the client should take — e.g. `{ type: "request_handoff" }` | Signals your UI to trigger the human-handoff flow (Master Reference §7) — the agent itself is telling you "this needs a human" |

`ui_engine: boolean` — flags whether this response contains UI Engine content (buttons/cards/carousels — Master Reference §5) that your client needs to render specially rather than as plain text.

### 17.5 Closing the connection

The server closes the WebSocket with close code `1000` (the standard "normal, successful closure" code in the WebSocket protocol) once it's done streaming the full response for that turn. Your client can then either close its side too, or open (send) another `InteractObject` on a **new** connection to continue the conversation — this is a **one-turn-per-connection** design ("single bi-directional channel used to drive one agent turn"), not one persistent connection for the entire conversation lifetime.

### 17.6 Minimal worked example (JavaScript)

```javascript
const ws = new WebSocket("wss://eu-gcp-api.vg-stuff.com/interact");

ws.onopen = () => {
  ws.send(JSON.stringify({
    agentId: "your-agent-id",
    convoId: "convo_" + crypto.randomUUID(),  // generate once, reuse for the whole conversation
    bucket: "voiceglow-eu",
    prompt: "Hello, how can you help me?",
    agentData: { ownerID: "user_123", userID: "user_123" },
    lightConvoData: { userName: "Jane", origin: "web-chat" }
  }));
};

let fullReply = "";

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === "chunk") {
    fullReply += data.chunk;
    console.log("Streaming so far:", fullReply);
  }
  if (data.type === "action" && data.action?.type === "request_handoff") {
    console.log("Agent is requesting human handoff!");
  }
};

ws.onclose = () => {
  console.log("Turn complete. Final reply:", fullReply);
};

ws.onerror = (error) => {
  console.error("WebSocket error:", error);
};
```

### 17.7 When to use WebSocket Interact vs. REST

| Scenario | Use |
|---|---|
| Building a custom chat UI where users type and expect live, streaming replies | WebSocket Interact |
| Backend automation, scheduled tasks, bulk operations, CRM sync | REST (§4–§16) |
| You just need to *read* past conversation data | REST Conversations (§9) |
| You need to *simulate* a live conversation turn (e.g. testing) | WebSocket Interact |

---

## 18. Error Handling & HTTP Status Codes

**What a "status code" is:** a 3-digit number every HTTP response includes, telling you at a glance whether the request succeeded and, if not, roughly why. You'll see these throughout the resource sections above.

| Code | Category | Meaning here |
|---|---|---|
| `200` | Success | Request worked, here's your data |
| `400` | Client error — bad request | Something about *your* request was invalid — e.g. a duplicate variable `key` (§6.3), a missing required field |
| `404` | Client error — not found | The resource (agent, tool, conversation, etc.) doesn't exist, or you don't have access to it — e.g. updating an agent that doesn't exist |
| `429` | Client error — rate limited | You've sent too many requests too quickly. Convocore enforces rate limits per plan; implement retry-with-backoff (wait progressively longer between retries) rather than hammering the endpoint again immediately |
| `INTERNAL_SERVER_ERROR` (typically `500`) | Server error | Something went wrong on Convocore's side — sometimes returned deliberately with a friendly message (e.g. Buy a Number, §10.2, returns this with an "upgrade your plan" message when you've hit a quota, which is really more of a plan-limit error dressed as a server error) |

**General pattern for irreversible operations** (deletes, mostly): the response is typically `{ "success": true, "message": "..." }` on success. Always check `success` in your code rather than assuming a 200 status code alone means the specific operation you wanted actually happened.

**Practical advice:**
- Always read the `message` field on errors — Convocore's error messages tend to be specific enough to act on directly (e.g. "exceeded your slot quota")
- For anything irreversible (marked ⚠️ throughout this doc), consider exporting/backing up first even if your code doesn't strictly require it
- Implement retries with exponential backoff for `429` and `5xx` errors; don't retry `400`/`404` without fixing the underlying request first, since retrying an invalid request just fails again

---

## 19. Glossary (Every Term Used in This Document)

| Term | Plain-English meaning |
|---|---|
| **API** | A defined way for code to talk to a service, instead of a human using its UI |
| **REST** | A common API style using HTTP requests/URLs/methods and (usually) JSON |
| **Endpoint** | One specific URL + HTTP method combination that does one thing |
| **Base URL** | The common prefix every request in an API surface starts with |
| **Region** | Which data center (EU or NA) your workspace's data lives in |
| **Bearer token** | A secret string sent in the `Authorization` header to prove who you are |
| **Workspace secret** | An auth key scoped to your whole workspace |
| **Agent secret** | An auth key scoped to one specific agent |
| **Resource** | A "thing" the API manages — Agent, Tool, Conversation, etc. |
| **CRUD** | Create, Read, Update, Delete — the four basic operations on a resource |
| **GET / POST / PATCH / DELETE** | HTTP methods: GET = read, POST = create, PATCH = partially update, DELETE = remove |
| **Partial update / deep merge** | A PATCH only changes the fields you send; everything else stays as-is, even inside nested objects/arrays |
| **JSON** | A text format for structured data — `{"key": "value"}` pairs, arrays, nesting |
| **Query parameter** | Extra info added to a URL after a `?`, e.g. `?page=2&limit=20` |
| **Pagination** | Splitting a large result set into smaller "pages" you fetch one at a time |
| **Cursor-based pagination** | Pagination using "give me results after this specific ID" instead of a page number |
| **Node** | One step/prompt-block in an agent's Canvas flow; every agent has at least a `__start__` node |
| **`agentPlatform`** | Field distinguishing native Convocore agents (`"vg"`) from Voiceflow-imported ones (`"vf"`) |
| **KB (Knowledge Base)** | The set of documents an agent can search to ground its answers in facts |
| **RAG (Retrieval Augmented Generation)** | The technique of searching a KB first, then feeding what's found to the LLM alongside the question |
| **Embedding / vector** | A list of numbers representing a piece of text's *meaning*, used to power semantic search |
| **Chunk** | A KB document is split into smaller pieces ("chunks") for embedding/search — search results are chunk-level, not whole-document-level |
| **Tool** | A connection letting the agent call an external API/webhook mid-conversation |
| **Variable** | A named slot for storing data during/across a conversation |
| **Lead** | A captured contact record (name/email/phone) from a conversation |
| **Conversation / convo** | The record of one chat session — messages, metadata, timestamps |
| **Turn** | One message exchange unit in a conversation — from either `"user"` or `"bot"` |
| **E.164** | The international phone number format: `+`, country code, number, no spaces/dashes |
| **TTS (Text-to-Speech)** | Converting written text into spoken audio |
| **STT (Speech-to-Text)** | Converting spoken audio into written text (the reverse of TTS) |
| **WebSocket** | A persistent, two-way connection for real-time communication (vs. REST's one-request-one-response model) |
| **`wss://`** | The secure/encrypted version of the WebSocket protocol |
| **Streaming** | Sending a response in pieces as it's generated, rather than all at once when complete |
| **Webhook** | A URL you provide that Convocore calls automatically when something happens (the reverse of you calling Convocore's API) |
| **Rate limit** | A cap on how many requests you can make in a given time window |
| **Idempotency** | Making the same request multiple times has the same effect as making it once — relevant when designing retry logic |
| **Unix timestamp** | A number representing a point in time, counted in seconds (or sometimes milliseconds — check per-endpoint) since Jan 1, 1970 |
| **SID (Twilio)** | A unique identifier string Twilio assigns to things like accounts and phone numbers |
| **Deep merge** | Merging a partial update into an existing object at every nested level, not just the top level |

---

## 20. Worked End-to-End Example: Building a Support Agent Entirely via API

This walks through creating a functioning customer support agent using **only API calls** — no dashboard clicks — to show how the resource groups above compose together. (Compare to Master Reference §16's dashboard-driven build playbook — same end result, different route.)

```bash
# All examples assume: BASE=https://eu-gcp-api.vg-stuff.com/v3
#                       KEY=your workspace secret

# 1. Create the agent
curl -X POST "$BASE/agents" \
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{
    "agent": {
      "title": "Acme Support Bot",
      "description": "Handles customer support for Acme Corp",
      "agentPlatform": "vg",
      "nodes": [{
        "id": "__start__",
        "instructions": "You are the AI customer support assistant for Acme Corp. You help customers with questions about our products, services, policies, and troubleshooting.\n\n{kb_context}\n{about_context}\n\nAlways check the knowledge base before answering factual questions. If you dont know something, say so honestly. Offer to connect with a human agent for complex issues.",
        "llmConfig": { "modelId": "gpt-4o", "temperature": 0.3, "maxTokens": 1024 }
      }]
    }
  }'
# → returns { "data": { "ID": "agent_abc123", "SECRET_API_KEY": "vg_xxxx", ... } }
# Save agent_abc123 for the next steps.

# 2. Add a Knowledge Base document
curl -X POST "$BASE/agents/agent_abc123/kb" \
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{
    "name": "Return Policy",
    "sourceType": "doc",
    "content": "# Return Policy\n\nCustomers may return items within 30 days of purchase for a full refund...",
    "metadata": { "description": "Explains Acme'"'"'s return and refund policy" },
    "tags": ["policy", "returns"]
  }'

# 3. Create a support ticket tool (calls your own backend)
curl -X POST "$BASE/agents/agent_abc123/tools" \
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{
    "tool": {
      "name": "Create Support Ticket",
      "description": "Creates a support ticket when a customer has an unresolved issue that needs human follow-up.",
      "serverUrl": "https://your-backend.example.com/tickets",
      "method": "POST",
      "fields": [
        { "id": "email", "key": "customerEmail", "type": "string", "in": "body", "description": "Customer'"'"'s email address", "required": true },
        { "id": "issue", "key": "issueDescription", "type": "string", "in": "body", "description": "Brief description of the issue", "required": true }
      ]
    }
  }'

# 4. Create a variable to track customer tier
curl -X POST "$BASE/agents/agent_abc123/variables" \
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{ "variable": { "key": "customer_tier", "type": "string", "description": "The customer'"'"'s subscription tier (free/pro/enterprise)", "defaultValue": "free", "isGlobal": true } }'

# 5. Set up a custom metric to track resolution
curl -X POST "$BASE/agents/agent_abc123/custom-metrics" \
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{ "metric": { "key": "issue_resolved", "description": "Whether the customer'"'"'s issue was resolved in this conversation", "type": "boolean" } }'

# 6. Verify everything by fetching the full agent config
curl "$BASE/agents/agent_abc123" -H "Authorization: Bearer $KEY"
```

**What this achieved:** an agent with a scoped support-focused system prompt (with the required `{kb_context}`/`{about_context}` variables from Master Reference §2.2), one KB document, one custom tool for ticket escalation, one variable for personalization, and one metric for tracking resolution rate — all buildable, versionable, and repeatable via a script instead of manual dashboard work. You could now:
- Export this as a template (§4.6) to duplicate for other clients
- Wire it up to the WebSocket Interact protocol (§17) for a custom chat UI
- Deploy it to channels via the dashboard or the standard widget snippet (Master Reference §10.1) — deployment itself isn't API-driven, it's a copy-paste embed snippet tied to the agent ID

---

## 21. Not Covered / Where to Look Next

This document covers every resource group referenced in the V3 API's own resource list (Master Reference §12.1) plus the WebSocket protocol and the legacy V2 surface at a pointer-level. What's genuinely thin or absent:

**Campaigns (§12):** field-level request/response schemas weren't available in the fetched source — the dashboard-level concepts (Master Reference §21.1) are a reliable guide to what fields exist, but exact JSON shapes should be confirmed against `/api-reference/v3/openapi/campaigns.json` before writing integration code.

**OpenAPI / AsyncAPI machine-readable specs:** every resource group has a corresponding OpenAPI JSON file (e.g. `agents.json`, `tools.json`, `campaigns.json` — full list in Master Reference §27) and the Interact channel has an AsyncAPI YAML spec. These are the authoritative, machine-readable source of truth (the kind of file that can auto-generate a client SDK) — this document is a human-readable companion to them, not a replacement. If you're generating client code automatically, pull the spec files directly rather than hand-translating this document.

**V2/legacy endpoints:** pointer-level only (§4's analogous V2 paths exist under `/v2/agents/{agent_id}/*` — kb, convos, analytics, interact, state) since V3 is the recommended path for all new work and V2 is explicitly legacy-maintenance-only per Convocore's own docs.

**Rate limit specifics** (exact requests-per-minute numbers per plan tier) weren't published in the fetched source — treat `429` handling (§18) as a certainty to code for, but don't hardcode assumed limits; check your plan's dashboard or ask support for current numbers if you're building high-volume automation.

If/when any of the above is needed in more depth, pull the specific OpenAPI spec file or endpoint page from `docs.convocore.ai` (index at `https://docs.convocore.ai/llms.txt`) or the `convocore_llms-full.txt` project file — extend this document rather than guessing.

---

## Document Changelog

- **v1** (this version) — initial comprehensive API reference, companion to `Convocore_Master_Reference_v2.md`. Covers Authentication, Base URLs/regions, and all V3 REST resource groups (Agents, Tools, Variables, Knowledge Base, Leads, Conversations, Calls/Numbers/Voices, SMS, Campaigns [partial], Custom Metrics, Crawler, Workspaces, Organizations), plus the WebSocket Interact real-time protocol, error-handling conventions, a full glossary, and one worked end-to-end example. Sourced from the `convocore_llms-full.txt` project file.
