# Convocore MCP Server Reference (v1)

> **DOC PREFERENCE (2026-08-14, BC-057b):** CURRENT — technical backing reference. As of BC-057b (2026-08-14), the MCP server's live calls fail identically to raw REST (`403 Business plan or higher` on `list_agents`) — same underlying block, not an MCP-specific issue. Manual Canvas UI is the fallback build method until this clears. See `Wiki/reference/convocore-doc-status.md`.

> **Companion document to `Convocore_Master_Reference_v3.md`** (dashboard/conceptual) **and `Convocore_API_Reference_v1.md`** (REST/WebSocket API). Those two documents explain what Convocore is and how to control it via the dashboard or raw HTTP. **This document covers a third, narrower surface: the Convocore MCP server** — what it lets an AI coding agent (like Claude Code) do to a Convocore workspace directly from within a coding session, and — just as important — what it does not let you do.
>
> **Scope:** This is not a re-explanation of Convocore concepts (agents, nodes, KB, tools, leads, etc.) — see the Master Reference for that. This document's job is narrowly: *what does the MCP server add or change versus the dashboard and the REST API*.
>
> **Source:** Compiled by directly introspecting the live `convocore` MCP server connected in this project's `.mcp.json` (server package `moe003/convocore-mcp`, run via Docker) — every tool schema below was fetched from the running server, and every "real example" was captured from an actual live call against this project's Convocore workspace on 2026-07-27. Anywhere this document infers rather than confirms, it says so explicitly.

---

## 0. Read This First — Core Concepts in Plain English

If you haven't worked with MCP before, these ideas unlock everything else in this document.

**MCP (Model Context Protocol)** — an open standard that lets an AI agent (like Claude Code) connect to external systems through a common interface, instead of every integration needing its own bespoke code. An **MCP server** is a small program that exposes a specific system's capabilities (here: Convocore) as a defined set of **tools** the AI can call, similar in spirit to a REST API but designed specifically for AI agents to discover and use at runtime.

**Tool** — one callable action the MCP server exposes, e.g. "list all agents" or "create a knowledge-base document." Each tool has a **name**, a **description** (plain-English text telling the AI what the tool does and when to use it — this is what the AI actually reads to decide whether to call it), and an **input schema** (the exact parameters it accepts, their types, and which are required).

**Resource** (MCP concept) — a different kind of thing an MCP server can expose: a piece of readable content (like a file or a data record) addressable by a URI, that the AI can read directly without "calling" it like a tool. Not all MCP servers expose resources — see §3.

**Prompt** (MCP concept) — a third kind of thing an MCP server can expose: a pre-written, parameterized prompt template the server offers for the AI (or a human, via slash-command-style UI) to invoke. Also not universal — see §3.

**stdio** — "standard input/output," the plumbing method this particular MCP server uses to talk to Claude Code: instead of running as a network service you connect to over HTTP, the server process is launched locally (here, inside a Docker container) and communicates by reading/writing plain text over its stdin/stdout streams. This is why `.mcp.json` for this server specifies a `command` (`docker`) and `args` to launch it, rather than a URL.

**Schema** — a formal description of what shape a piece of data must have (which fields exist, their types, which are required). Each MCP tool's input schema is what Claude Code validates a call against *before* sending it to the server — if you're missing a required field or use the wrong type, the call fails locally without ever reaching Convocore.

**Workspace secret vs. agent secret** — per the API Reference (§2), Convocore has two credential scopes. This MCP server is configured with a **workspace secret** (see §7 below) — in theory this should grant access to every resource in the workspace, the same as using that key directly against the REST API. In practice, live testing found this is **not entirely true** — see §4.9's "Unauthorized workspace scope" finding.

---

## 1. Overview — What This MCP Server Is, In One Paragraph

The Convocore MCP server (`moe003/convocore-mcp`) is a thin, **agent-management-focused** wrapper around a subset of the Convocore V3 REST API (see API Reference §1 for the three API surfaces Convocore exposes — this MCP server only ever talks to V3 REST under the hood, never the WebSocket Interact surface). It exposes 22 tools covering three resource groups in depth — **Agents**, **Knowledge Base**, and **Conversations** — plus two Agent-usage/search tools that are present in the schema but return an authorization error against this workspace's credentials (a live-confirmed finding, not a guess). Every other REST resource group documented in the API Reference (Tools/function-calling, Variables, Leads, Calls/Numbers/Voices, SMS, Campaigns, Custom Metrics, Crawler, Workspaces, Orgs) has **no corresponding MCP tool at all** — see §5 for the full boundary table.

The practical shape of this: **the MCP server is good for reading and reshaping an agent's core identity, prompt, and knowledge base, and for reading/managing conversation records — but it cannot touch tools, variables, leads, telephony, SMS, campaigns, custom metrics, the crawler, or workspace/org administration.** For any of those, you still need the REST API directly or the dashboard.

---

## 2. How to Connect (Summary — full detail in §7)

This server is already connected in this project via `.mcp.json`:

```json
{
  "mcpServers": {
    "convocore": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-e", "WORKSPACE_SECRET", "-e", "CONVOCORE_API_REGION=na-gcp", "moe003/convocore-mcp:latest"],
      "env": {
        "WORKSPACE_SECRET": "<redacted — see your local .mcp.json>"
      }
    }
  }
}
```

Claude Code (or any MCP-capable client configured this way) launches the `moe003/convocore-mcp:latest` Docker image fresh for each session, over stdio, with the workspace secret and region injected as environment variables. See §7 for the full breakdown, auth notes, and gotchas.

---

## 3. Resources & Prompts

> ⚠️ **Partially superseded 2026-07-27 (§11.2).** The "Prompts" finding below was accurate for v2.1.0/Docker and is **no longer accurate** for v2.3.8/npx — kept unedited below for audit-trail purposes, corrected here: **source code (`Moe03/convocore-mcp`'s `src/index.ts`) confirms two real MCP prompts now exist**, `integrate_website_widget` and `generate_widget_css`, registered via `ListPromptsRequestSchema`/`GetPromptRequestSchema` handlers that did not exist (or at least weren't reachable) in the version originally audited. **Resources remain confirmed absent** — no `ListResourcesRequestSchema` handler exists anywhere in the current source, consistent with the original live `ListMcpResourcesTool` finding. Neither prompt was invoked/tested this round (§11.9) — their existence is source-confirmed, their behavior is not.

Per §0's definitions, MCP servers can expose **resources** and **prompts** in addition to tools. This server was checked directly:

- **Resources:** `ListMcpResourcesTool` was called against the `convocore` server → result: *"No resources found. MCP servers may still provide tools even if they have no resources."* **Confirmed: this server exposes zero MCP resources** (still true as of v2.3.8 per source inspection).
- **Prompts (original v2.1.0/Docker finding, now superseded — see box above):** no MCP prompts from this server surfaced anywhere in the available tool/skill listing for this session (Convocore MCP prompts would appear as invocable slash-command-style entries if present, the same way project skills do). **No evidence of any exposed prompts.** This is inferred from absence rather than a direct "list prompts" call, since no such tool exists in the Claude Code harness — noted here as the honest boundary of what could be verified.

**Practical implication:** as of v2.1.0, everything this server offered was a **tool call**, with no resources or prompts. As of v2.3.8, that's still true for resources, but **two real prompts now exist** (`integrate_website_widget`, `generate_widget_css`) — check for slash-command-style invocable prompts when using the current version, don't assume the "tools only" model still holds.

---

## 4. Full Tool Reference

22 tools total, grouped by resource area. For each tool: exact name, the description string the server itself provides (verbatim — this is literally what the AI reads to decide when to use it), the full input schema, and a real example where one was safely captured live. Destructive tools (delete/create/update against real workspace data) were **not** exercised live to avoid mutating this project's actual agents — their schemas are still shown in full, sourced directly from the live server's tool definitions (not guessed).

### 4.1 Agent tools

#### `list_agents`
> **Description (verbatim):** "List all your ConvoCore agents - no parameters needed!"

**Input schema:** none — `{}`, no required or optional parameters.

**Real example (live call, this workspace):**
Returns `{ success, message, data: [...] }` where each element is a **full agent object** — not a lightweight summary the way the REST API's `GET /agents` list endpoint is documented to be (API Reference §4.1 explicitly notes the REST list endpoint gives "a lighter summary"). The MCP version returned the complete config for both agents in this workspace, including the entire `nodes` array (Canvas flow), voice config, UI tabs, theme, and every dashboard-configurable field — **86,000+ characters across 2 agents**, large enough that the tool result was written to a file rather than inlined. Truncated real excerpt (one agent):

```json
{
  "success": true,
  "message": "Agents retrieved successfully",
  "data": [
    {
      "id": "mpapFWb3SWHZQ46UsoR3",
      "title": "Zenny AI",
      "description": "24/7 Quick Response Team For TeenX",
      "agentPlatform": "vg",
      "enableNodes": true,
      "vg_defaultModel": "gemini-2.5-flash",
      "nodes": [
        { "id": "__start__", "name": "Start", "instructions": "### 1. SYSTEM ROLE & CONTEXT\nYou are \"TeenX Connect,\"...", "type": "start", "llmConfig": { "modelId": "gemini-2.5-flash", "temperature": 0.7, "maxTokens": 2024 }, "rf": { "position": { "x": 0, "y": 0 }, ... } },
        { "id": "wdPvPI2JNDRgtcWsjbBF", "name": "Node wdPvP", "description": "<iframe ... youtube ...>", "type": "note" }
      ],
      "voiceConfig": { "transcriber": { "provider": "deepgram", "modelId": "nova-2" }, "speechGen": { "provider": "google-live" } }
    }
  ]
}
```
💡 **Live-confirmed finding:** `list_agents` returning *full* agent detail (not a summary) is a genuine behavioral difference from the documented REST `GET /agents` endpoint — useful to know before assuming this call is "cheap"/lightweight the way the REST list endpoint is.

---

#### `get_agent`
> **Description (verbatim):** "Retrieve details of a specific ConvoCore agent. NOTE: The agent's main prompt is in nodes[0].instructions (first node in nodes array)."

**Input schema:**

| Field | Type | Required |
|---|---|---|
| `agentId` | string | ✅ |

**Real example (live call):** `get_agent(agentId: "okD4RvhZ9VgEJ0GFcws3")` → `{ success: true, message: "Agent retrieved successfully", data: { ...full agent object... } }`. Response was 60.7KB (too large to inline in full; matches the shape of one `list_agents` element above, including internal fields like `internal.accountCreationConfig` and every node's full `instructions`/`llmConfig`/`rf` data).

---

#### `create_agent`
> **Description (verbatim):** "Create a new ConvoCore AI agent. IMPORTANT: ConvoCore uses \"nodes\" for advanced AI - the FIRST node in the nodes array contains the MAIN prompt/instructions that control the agent. When creating an agent, set nodes[0].instructions for the primary behavior."

**Input schema:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | ✅ | — |
| `description` | string | ❌ | — |
| `nodes` | array | ❌ | Generic/untyped array in the schema itself; description says "The FIRST node (nodes[0]) should contain the main prompt in its instructions field. Example: `[{ instructions: "Main agent prompt", name: "Main Node" }]`" |
| `theme` | string | ❌ | e.g. `blue-light`, `custom-blue-dark` |
| `voiceConfig` | object | ❌ | transcriber/speechGen config |
| `disabled` | boolean | ❌ | — |
| `light` | boolean | ❌ | "Enable light mode (no chat history retention for privacy)" |
| `autoOpenWidget` | boolean | ❌ | — |
| `enableVertex` | boolean | ❌ | "Enable Vertex AI for the agent" |
| `additionalConfig` | object | ❌ | "Additional agent configuration fields" — an escape hatch for anything not otherwise exposed as a named parameter |

**Not live-tested** (would create a real new agent in the workspace). Schema is sourced directly from the live server's tool definition, not inferred.

⚠️ **Note on `nodes` typing:** the JSON Schema for this parameter is just `{"type": "array"}` — no nested schema for what a node object may contain. This matters a lot for §5.4 (Canvas boundary question) — see there for the full analysis.

---

#### `update_agent`
> **Description (verbatim):** "Update an existing ConvoCore agent. CRITICAL: To change the agent's main prompt/instructions, update nodes[0].instructions (first node in nodes array). This is the PRIMARY prompt that controls agent behavior. Other nodes are for advanced multi-step workflows."

**Input schema:** same field set as `create_agent` plus a required `agentId`; all other fields optional (partial update, matching the REST API's documented `PATCH` deep-merge semantics — API Reference §4.4).

| Field | Type | Required |
|---|---|---|
| `agentId` | string | ✅ |
| `title`, `description`, `theme` | string | ❌ |
| `nodes` | array | ❌ |
| `voiceConfig`, `additionalConfig` | object | ❌ |
| `disabled`, `light`, `autoOpenWidget`, `enableVertex` | boolean | ❌ |

**Not live-tested** (would mutate a real agent's live config — deliberately avoided without explicit user go-ahead). Schema sourced directly from the live tool definition.

---

#### `delete_agent`
> **Description (verbatim):** "Delete a ConvoCore agent permanently"

**Input schema:** `agentId` (string, required) — only parameter.

**Not live-tested** (irreversible, deletes all associated tools/variables too per API Reference §4.5 — never exercised against real data without explicit destructive-action confirmation).

---

#### `export_agent`
> **Description (verbatim):** "Export an agent template for backup or migration"

**Input schema:** `agentId` (string, required) — only parameter.

Mirrors REST `GET /agents/{agentId}/export-template` (API Reference §4.6) — expected shape per that doc: `{ agentTemplate: { name, agentData, tools, variables, nodes, workspaceId } }`, with the agent's `SECRET_API_KEY` deliberately excluded for security. **Not live-tested** in this session (no destructive risk, but skipped for scope/time — would be safe to run if needed for a real backup).

---

#### `import_agent`
> **Description (verbatim):** "Import an agent from a template"

**Input schema:**

| Field | Type | Required |
|---|---|---|
| `agentTemplate` | object | ✅ | "The agent template object (from export)" |
| `agentName` | string | ✅ |
| `fromAgentId` | string | ❌ | "Optional source agent ID" |

Mirrors REST `POST /agents/import-template`'s two modes (API Reference §4.6): full template import, or the `fromAgentId` legacy-migration shortcut. **Not live-tested** (would create a real new agent).

---

#### `get_agent_usage`
> **Description (verbatim):** "Get agent usage statistics and credits consumed"

**Input schema:**

| Field | Type | Required |
|---|---|---|
| `agentId` | string | ✅ |
| `range` | object (`{ from, to }`, ISO date strings) | ❌ |

**Real example (live call) — FAILED:**
```
get_agent_usage(agentId: "okD4RvhZ9VgEJ0GFcws3")
→ Error: MCP error -32603: Unauthorized workspace scope
```
🔴 **Live-confirmed boundary finding:** this tool exists in the schema and accepts a well-formed call, but the workspace-secret credential configured for this MCP server is rejected by Convocore's backend for this specific operation. This directly contradicts the general expectation (API Reference §2) that a workspace secret "can act on anything in your workspace." See §4.9 disambiguation and §7's setup gotchas.

---

### 4.2 Agent search

#### `search_agents`
> **Description (verbatim):** "Search for ConvoCore agents (requires workspaceId from dashboard)"

**Input schema:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `workspaceId` | string | ✅ | "Your workspace/org ID (get this from ConvoCore dashboard)" |
| `search` | string | ❌ | query text |
| `sortBy` | string | ❌ | `newest` / `oldest` / `alphabetical` (default `newest`) |
| `starredOnly` | boolean | ❌ | default `false` |
| `page` | number | ❌ | default `1` |
| `limit` | number | ❌ | default `50` |

**Real example (live call) — FAILED:**
```
search_agents(workspaceId: "test")
→ Error: MCP error -32603: Unauthorized workspace scope
```
🔴 Same failure mode as `get_agent_usage` — see §4.9. Note this tool also requires you to already know your `workspaceId`, obtainable only from the dashboard (not from any other MCP tool in this server — there is no `list_workspaces` tool, see §5).

---

### 4.3 Knowledge Base (KB) tools — VG agents only

All five KB tools carry the same platform restriction as the REST API's KB endpoints (API Reference §7): **native (`vg`) agents only.** If an agent's `agentPlatform` is `"vf"` (Voiceflow-imported), none of these will work — use Voiceflow's own tooling instead (Master Reference §1.4–1.5).

#### `list_kb_docs`
> **Description (verbatim):** "List all knowledge base documents for an agent"

**Input schema:**

| Field | Type | Required | Default |
|---|---|---|---|
| `agentId` | string | ✅ | — |
| `page` | number | ❌ | 1 |
| `pageSize` | number | ❌ | 20 |

**Real example (live call):** `list_kb_docs(agentId: "okD4RvhZ9VgEJ0GFcws3")` →
```json
{
  "success": true,
  "message": "KB retrieved successfully",
  "data": [
    {
      "ID": "eee7bc80b1a49394d937",
      "agentId": "okD4RvhZ9VgEJ0GFcws3",
      "url": "https://patisserie-valerie.co.uk/en-ie/blogs/news/christmas-collection-2024",
      "sourceType": "url",
      "name": "Christmas Cakes Blog | Patisserie Valerie",
      "status": "ERROR",
      "refreshRate": "3d",
      "nextRefreshAt": 1785042058,
      "chunksIds_JSON_STRING": "[9019077275,2116402380,...]",
      "dimensions": 1536,
      "tags": [],
      "content": ""
    }
  ],
  "total": 105,
  "pageSize": 20,
  "hasMore": true,
  "nextCursor": "eyJ2IjoxLCJtIjoidHMiLCJrIjpbMTc4NDk3MDA2Nl0sImlkIjoiZDI2YWRkNjU0YTEwZTc4MmM1NzEifQ",
  "totalPages": 6,
  "currentPage": 1
}
```
💡 **Real findings from this call:** (1) pagination uses **both** `page`/`pageSize` request params *and* returns a `nextCursor` for cursor-based continuation — a hybrid not spelled out in the tool description. (2) `content` was empty string for every URL-sourced doc (content lives in the `chunks`, fetched per-doc — see `get_kb_doc` below). (3) Real-world data quality note (unrelated to MCP itself, but worth flagging): every URL-sourced doc in this particular agent's KB showed `status: "ERROR"` — a live example of exactly the kind of failure the Master Reference (§3.5) says to debug via KB Preview.

---

#### `get_kb_doc`
> **Description (verbatim):** "Get a single knowledge base document"

**Input schema:** `agentId` (string, required), `docId` (string, required).

**Real example (live call):** `get_kb_doc(agentId: "okD4RvhZ9VgEJ0GFcws3", docId: "d26add654a10e782c571")` →
```json
{
  "success": true,
  "message": "KB retrieved successfully",
  "data": {
    "vgKbDoc": { "ID": "d26add654a10e782c571", "url": "...", "status": "ERROR", "content": "IN CONTENT URL", "...": "..." },
    "data": { "documentID": "d26add654a10e782c571", "data": { "type": "url", "name": "...", "description": "..." }, "status": { "type": "ERROR", "data": { "content": "IN CONTENT URL" } } },
    "chunks": [ { "chunkID": "d26add654a10e782c571_0", "content": "IN CONTENT URL" } ]
  }
}
```
💡 **Real finding:** the response nests **three overlapping representations** of the same document (`vgKbDoc`, `data`, `chunks`) rather than one flat object — noticeably more complex than the REST API's documented single-object shape with a `chunks` array (API Reference §7.2). If building anything downstream of this tool, parse defensively — don't assume a flat shape.

---

#### `create_kb_doc`
> **Description (verbatim):** "Add a document to an agent's knowledge base (VG agents only)"

**Input schema:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `agentId` | string | ✅ | — |
| `name` | string | ✅ | Document name |
| `sourceType` | enum: `doc` \| `url` \| `sitemap` | ✅ | — |
| `content` | string | conditionally required | "required for sourceType: doc" |
| `urls` | array of string | ❌ | for `sourceType: url` |
| `sitemapUrl` | string | ❌ | for `sourceType: sitemap` |
| `maxPages` | number | ❌ | "Max pages from sitemap" |
| `scrapeContent` | boolean | ❌ | — |
| `refreshRate` | enum: `6h` \| `12h` \| `24h` \| `7d` \| `never` | ❌ | default `never` |
| `tags` | array of string | ❌ | — |
| `metadata` | object | ❌ | "Additional metadata" |

Directly mirrors REST `POST /agents/{agentId}/kb` (API Reference §7.3) — same three source-type modes, same field names. 💡 Note the MCP `refreshRate` enum (`6h/12h/24h/7d/never`) is **more granular than the REST doc's documented options** (`"3d"`, `"7d"`, or `"never"` per API Reference §7.3) — worth double-checking which set is actually authoritative against a live test before relying on `6h`/`12h`/`24h` values. **Not live-tested** (would add real content to a live agent's KB).

---

#### `update_kb_doc`
> **Description (verbatim):** "Update a knowledge base document (VG agents only)"

**Input schema:** `agentId` (✅), `docId` (✅), plus optional `name`, `content`, `url`, `tags` (array), `refreshRate` (same enum as above), `metadata`. **Not live-tested** (would mutate real KB content — updating `content` also triggers re-embedding per API Reference §7.4, which is not instant).

---

#### `delete_kb_doc`
> **Description (verbatim):** "Delete a knowledge base document (VG agents only)"

**Input schema:** `agentId` (✅), `docId` (✅). **Not live-tested** (irreversible per API Reference §7.5).

---

#### `get_kb_stats`
> **Description (verbatim):** "Get knowledge base statistics for an agent (VG agents only)"

**Input schema:** `agentId` (string, required) — only parameter.

**Real example (live call):** `get_kb_stats(agentId: "okD4RvhZ9VgEJ0GFcws3")` →
```json
{ "success": true, "message": "Successfully fetched KB stats", "data": { "charCount": 1938782, "docsCount": 83 } }
```
💡 Note `docsCount: 83` here vs. `total: 105` from `list_kb_docs` above — consistent with the REST API's documented behavior (API Reference §7.7) that stats only count **finished-processing** documents, excluding `PENDING`/`ERROR` ones. Given the widespread `ERROR` status seen in `list_kb_docs`, this ~22-document gap is a real, live-observed illustration of that rule, not a discrepancy/bug.

🔴 **Coverage gap vs. REST:** there is **no MCP equivalent of `POST /agents/{agentId}/kb/search`** (API Reference §7.6, direct KB search/retrieval-preview). If you want to test what a query would actually retrieve (the dashboard's "Preview KB" feature, Master Reference §3.5), MCP cannot do this — use the REST endpoint or dashboard.

---

### 4.4 Conversation tools

#### `list_conversations`
> **Description (verbatim):** "List all conversations for an agent"

**Input schema:** `agentId` (✅), `page` (number, default 1), `limit` (number, default 20).

**Real example (live call):** `list_conversations(agentId: "okD4RvhZ9VgEJ0GFcws3", limit: 3)` →
```json
{
  "success": true,
  "message": "Conversations retrieved successfully",
  "data": [
    { "ID": "7EKgZfeuq82eFA0", "origin": "web-chat", "messagesNum": 5, "ts": 1784460223, "tags": [], "lastMessageTS": 1784460223, "leadScore": 0, "funnelStepsMatched": [], "funnelScoreHistory": [], "funnelNotificationSent": false },
    { "ID": "0DrUrYjIvXtsrBg", "origin": "web-chat", "messagesNum": 3, "ts": 1784456267, "tags": [], "lastMessageTS": 1784456267, "leadScore": 0, "funnelStepsMatched": [], "funnelScoreHistory": [], "funnelNotificationSent": false }
  ],
  "hasMore": false,
  "nextCursor": null,
  "limit": 3,
  "cached": false
}
```
💡 Real finding: every conversation record already carries **Lead Qualification Funnel** fields (`leadScore`, `funnelStepsMatched`, `funnelScoreHistory`, `funnelNotificationSent` — Master Reference §8) inline, even though this agent doesn't appear to have the funnel actively scoring (all zero/empty). Also note the response includes `cached: false` — an undocumented-in-schema field suggesting server-side response caching exists for this endpoint.

---

#### `get_conversation`
> **Description (verbatim):** "Get details of a single conversation"

**Input schema:** `agentId` (✅), `convoId` (✅). **Not live-tested this session** (no destructive risk — skipped for scope; expected shape per the pattern above plus `state`/`lastModified` per API Reference §9.2).

---

#### `create_conversation`
> **Description (verbatim):** "Create a new conversation for an agent"

**Input schema:** `agentId` (✅), `conversation` (object, required — "minimum: `{ ts: timestamp }`"). Mirrors REST §9.3 — mainly an edge-case/import tool, since conversations are normally created automatically by real user interactions. **Not live-tested** (would create a fake conversation record in real data).

---

#### `update_conversation`
> **Description (verbatim):** "Update an existing conversation"

**Input schema:** `agentId` (✅), `convoId` (✅), `conversation` (object, required — fields to update). **Not live-tested** (would mutate a real conversation record; note REST §9.4's tag-merge behavior likely applies here too since this is presumably a thin PATCH wrapper, but that was not directly confirmed for the MCP path specifically).

---

#### `delete_conversation`
> **Description (verbatim):** "Delete a conversation"

**Input schema:** `agentId` (✅), `convoId` (✅). **Not live-tested** (irreversible).

---

#### `assign_conversation`
> **Description (verbatim):** "Assign a conversation to a user for manual delegation"

**Input schema:**

| Field | Type | Required |
|---|---|---|
| `agentId` | string | ✅ |
| `convoId` | string | ✅ |
| `assignToUserId` | string | ✅ |
| `delegatedBy` | string | ❌ | "Optional: ID of user delegating" |

🟡 **Possible MCP-only capability:** no corresponding endpoint for assigning/delegating a conversation to a specific user appears in `Convocore_API_Reference_v1.md`'s Conversations section (§9) as read for this document. This may be (a) a genuinely MCP-specific convenience tool, (b) wrapping a real but undocumented REST endpoint, or (c) related to the dashboard's Live Handoff "Continue chat yourself" / assignment flow (Master Reference §7) exposed here for the first time in API form. **Not confirmed either way — flagged honestly as uncertain, not asserted as fact.** Not live-tested (would reassign a real conversation).

---

#### `export_conversation` / `export_all_conversations`
> **Descriptions (verbatim):** "Export a single conversation" / "Export all conversations for an agent"

**Input schemas:**
- `export_conversation`: `agentId` (✅), `convoId` (✅), `format` (enum `json`|`csv`, default `json`)
- `export_all_conversations`: `agentId` (✅), `format` (enum `json`|`csv`, default `json`)

Mirror REST `GET /agents/{agentId}/convos/{convoId}/export` and `.../convos/export` (API Reference §9.5) — expected to return the full turn-by-turn transcript shape shown there (`metadata` + `turns[]` with `from`/`messages`). 💡 One real addition visible in the schema: **CSV export as a first-class option** — the REST API doc as read only shows a JSON response shape, with no explicit mention of a `format=csv` mode. Whether this is an MCP-only convenience or an undocumented REST query param wasn't confirmed live (not tested, to avoid pulling/exposing real user PII from live conversations unnecessarily). **Not live-tested.**

---

### 4.9 Cross-cutting finding: "Unauthorized workspace scope"

Two tools — `get_agent_usage` and `search_agents` — both failed identically against this workspace's configured `WORKSPACE_SECRET`:

```
MCP error -32603: Unauthorized workspace scope
```

This is a **live-confirmed, reproducible finding**, not a guess. Both calls were well-formed (matched the documented schema exactly) and failed at the server/auth layer, not at input validation. Two things both tools have in common: both operate at a **workspace-wide** level rather than being scoped to a single already-known agent ID the credential clearly has rights to. A plausible read: this MCP server's workspace-secret credential is somehow more restricted in practice than the API Reference's documented claim that a workspace secret "can act on anything in your workspace" (§2) — but this document only asserts what was directly observed (the error), not the underlying cause, which was not independently diagnosed against the raw REST API in this session. If you need agent usage/cost stats or cross-workspace agent search, **fall back to the REST API directly** (`POST /agents/{agent_id}/usage`, or the dashboard's Usage tab) and verify whether the same credential succeeds there — that would isolate whether this is an MCP-server-specific bug or a genuine account/credential permission gap.

---

## 5. The Capability Boundary — MCP vs. REST API vs. Dashboard

This is the most important section. Table below maps every REST resource group (per API Reference §0's list) to its MCP coverage.

> ⚠️ **Version note:** the table below was originally written against the Docker-based server (v2.1.0). A 2026-07-27 retest against the npx-based server (**v2.3.8** — see §11) found this MCP server had grown from 22 to **50 tools**, and several rows below are now **superseded**. Rows still accurate as of v2.3.8 are unmarked; superseded rows are marked **⟳ SUPERSEDED — see §11** with the corrected verdict inline.

| Resource group | REST API coverage (per API Reference) | MCP coverage | Verdict |
|---|---|---|---|
| **Agents** | Full CRUD + export/import + usage (§4) | `list_agents`, `get_agent`, `create_agent`, `create_agent_from_template`, `update_agent`, `delete_agent`, `export_agent`, `import_agent`, `get_agent_usage`*, `search_agents`** | **Full CRUD via MCP.** ⟳ **SUPERSEDED (§11.6):** `search_agents` no longer errors as of v2.3.8 (workspace resolved internally, no `workspaceId` param) but now silently returns 0 results even for known agents — a *different* bug, not fixed. `get_agent_usage`* still fails identically ("Unauthorized workspace scope", now a clean structured 401) — genuinely unresolved. |
| **Tools** (function-calling / webhooks) | Full CRUD (§5) | **None.** No `list_tools`/`create_tool`/etc. exist in this server, even at v2.3.8 | **Still not reachable via MCP at all** — use REST or dashboard's Tools tab (confirmed still true in §11's full 50-tool inventory) |
| **Variables** | Full CRUD (§6) | **None.** No variable tools exist, even at v2.3.8 | **Still not reachable via MCP at all** — use REST or dashboard |
| **Knowledge Base** | Full CRUD + search + stats (§7) | `list_kb_docs`, `get_kb_doc`, `create_kb_doc`, `update_kb_doc`, `delete_kb_doc`, `get_kb_stats`, plus new: `import_file_to_kb` (§11.7) | **Full CRUD + stats via MCP**, now also file-to-KB import (buggy as shipped — §11.7). Still missing: KB search/retrieval-preview (`POST .../kb/search`) — not exposed |
| **Leads** | Full CRUD (§8) | **None.** No lead tools exist, even at v2.3.8 | **Still not reachable via MCP at all** — use REST or dashboard's Leads/Conversations views |
| **Conversations** | Full CRUD + export (§9) | `list_conversations`, `get_conversation`, `create_conversation`, `update_conversation`, `update_conversation_messages` (new), `delete_conversation`, `export_conversation`, `export_all_conversations`, `assign_conversation` (now confirmed real — README documents its endpoint) | **Full CRUD + export via MCP on paper.** ⟳ **SUPERSEDED (§11.5):** in practice, every single-item operation on an MCP-created conversation (`get`/`update`/`update_conversation_messages`/`assign`/`delete`) still fails with "Conversation not found" — confirmed still-present, real backend bug, not fixed by the version bump. Export still blocked by a `chat-export-api` billing add-on this workspace lacks. |
| **Calls, Numbers & Voices** (telephony) | Full coverage incl. Twilio number mgmt, voice browsing (§10) | `buy_twilio_number`, `import_twilio_number`, `release_twilio_number`, `check_twilio_number`, `sync_sms_twilio_number` (numbers), plus a full **Voice** category: `list_voice_providers`, `list_voice_models`, `search_voices`, `list_provider_voices`, `get_voice` | ⟳ **SUPERSEDED (§11.7) — now reachable via MCP.** Voice browsing tools are live-confirmed working (real 313-voice search result). Twilio number-management tools exist with real schemas but were **not live-tested** (would cost real recurring money / require a real Twilio account) — documented schema-only. |
| **SMS** | Send + bulk-send (§11) | `sync_sms_twilio_number` assigns a number for SMS; no direct "send SMS" tool | **Still not reachable via MCP at all for actually sending SMS** — only number-assignment is covered |
| **Campaigns** | CRUD + start/pause/stop (§12) | **None.** No campaign tools, even at v2.3.8 | **Still not reachable via MCP at all** |
| **Custom Metrics** | Full CRUD + data query (§13) | **None.** No custom-metric tools, even at v2.3.8 | **Still not reachable via MCP at all** |
| **Crawler** | Create/list/get/delete jobs, list/get pages (§14) | **None** as a dedicated Crawler tool, but the new `scrape_url` tool covers the single-page use case | **Mostly still not reachable via MCP** — no job-based/multi-page crawler equivalent; `scrape_url` only covers one URL at a time (§11.7, not live-tested this round but schema-confirmed) |
| **Workspaces** | Full CRUD + usage (§15) | **None.** No `list_workspaces`/`get_workspace`, even at v2.3.8 | **Still not reachable via MCP at all** — moot for `search_agents` now, since workspace resolution is internal as of v2.3.8, but still no way to manage workspaces themselves |
| **Organizations (Orgs)** | List/get agents/get clients (§16) | **None.** | **Still not reachable via MCP at all** |
| **WebSocket Interact** (live streaming conversation) | Full protocol (§17) | `interact_with_agent` (new) — runs one real turn over the `/interact` WebSocket and returns an aggregated result | ⟳ **SUPERSEDED (§11.7) — now reachable via MCP.** Live-tested: successfully opened a WSS connection and got a response back, though the specific test also surfaced a real backend crash bug in node routing (§11.7) — the *capability* is confirmed real, but fragile against non-trivial Canvas flows. Explicitly consumes real ConvoCore credits per the tool's own warning — not a dry-run. |

### 5.1 Summary in one sentence

**Original (v2.1.0/Docker) finding:** MCP was an "agent lifecycle + KB + conversation records" tool, not a general Convocore API client — three resource groups (out of thirteen) got meaningful coverage.

⟳ **UPDATED as of v2.3.8/npx (§11):** the picture is now broader but messier. **Six** resource groups have real MCP surface (Agents, Knowledge Base, Conversations, Calls/Numbers/Voices, WebSocket Interact, and a new cross-cutting **File I/O** category with no REST equivalent at all), plus brand-new **Widget Deployment & CSS** and **Static Reference** categories that don't map to any REST resource group but materially change what MCP can do end-to-end (§11.7). Seven groups (Tools, Variables, Leads, SMS-sending, Campaigns, Custom Metrics, Workspaces, Orgs) remain completely unreachable. Critically, **broader tool coverage did not mean uniformly more reliable behavior** — some of the original bugs are now fixed (node writes, `get_kb_doc`), one silently got worse (`search_agents`), and testing the new `interact_with_agent` tool surfaced a brand-new backend crash bug. See §11 for the full accounting.

### 5.2 Full CRUD vs. partial, within covered groups

- **Agents:** genuinely full CRUD (create/read/update/delete) plus the REST API's two special operations (export/import-as-template), plus the new `create_agent_from_template` convenience path. ⟳ As of v2.3.8, node-array writes (`nodes[].instructions`/`description`/`llmConfig`/new nodes) **work correctly** (§11.3–11.4) — a full reversal of the original finding. `get_agent_usage` is still broken (§11.6); `search_agents` no longer errors but returns empty results regardless of query (§11.6).
- **Knowledge Base:** full CRUD plus stats, all confirmed working at v2.3.8 including the `get_kb_doc` "not found" bug being fixed (§11.4). The new `import_file_to_kb` shortcut has a real validation bug as shipped (§11.7). The one remaining gap is KB *search* — still not exposed via MCP; use REST's `POST .../kb/search` or the dashboard's Preview KB feature.
- **Conversations:** full CRUD plus export (both single and bulk) *on paper*; in practice, `create`/`list` work but every single-item lookup/mutation still hits "Conversation not found" at v2.3.8 (§11.5) — unchanged from the original finding despite the version jump.

### 5.3 Anything MCP does that the REST reference doesn't document?

`assign_conversation` (§4.4) — the original uncertainty here is resolved: the current `Moe03/convocore-mcp` README explicitly documents its real endpoint as `POST /agents/{agentId}/convos/{convoId}/assign` (confirmed live in §11.5's structured 404, which showed the exact endpoint path), so this is a real, documented (by the MCP project, not by `Convocore_API_Reference_v1.md`) REST endpoint, not an MCP-only fabrication. ⟳ **New as of v2.3.8 (§11.7):** the Widget Deployment & CSS tools (`get_website_embed_code`, `get_agent_custom_css`, `update_agent_custom_css`, `get_widget_css_styling_guide`) and the Static Reference tools (`get_pricing_info`, `get_ui_engine_spec`, `get_channel_integration_spec`) do things no REST endpoint in `Convocore_API_Reference_v1.md` documents at all — these are genuinely MCP-server-side value-adds (some are static knowledge baked into the server, not API calls; others write to real agent fields like `customCSS` that the REST reference never covered).

### 5.4 The Canvas question — can MCP edit both node prompt fields?

This was the single most important thing to verify concretely per the task brief, so here is the direct answer with its actual evidentiary basis:

Per Master Reference §6.3, every Canvas node has **two separate fields**: **Instructions** (the node's own response-generating prompt) and a second, distinct **"Defines what this node does"** routing-trigger field read only by the Router LLM (confirmed in raw API data to correspond to the node object's `description` key — visible directly in this session's live `list_agents`/`get_agent` output, e.g. node `wdPvPI2JNDRgtcWsjbBF`'s `description` field held routing/display text distinct from any `instructions` field).

**What's confirmed reachable via MCP:** `create_agent`/`update_agent` both explicitly document `nodes[0].instructions` as the way to set a node's main prompt, and this is directly consistent with (and presumably a thin wrapper over) the REST API's own documented node-update contract (API Reference §4.4's table of settable node fields: `id`, `instructions`, `name`, `llmConfig` — **note this REST table itself does not list a `description`/routing field as officially settable either**, even though `get_agent` calls clearly show that field is *readable*).

**UPDATE — 2026-07-27, resolved by live testing (§10):** this question is no longer unconfirmed. A disposable test agent was created and every write path into the `nodes` array was exercised directly — writing `instructions` alone, `description` alone, a full node object, adding a brand-new second node, setting `isGlobal`/`global`, setting `llmConfig`, and attempting a condition-node-shaped entry. **All seven attempts silently failed to persist**, including `instructions` itself — the one field both the tool description and the REST API document as the primary, supported way to set a node's prompt. See §10 for the exact calls and before/after diffs. The finding below is superseded by that result; kept here struck through for record-keeping:

> ~~Both the REST API and this MCP server confirm read access to a node's routing-description field, and confirm write access to `instructions`. Neither surface documents write access to the routing-description field as a supported operation.~~ **Superseded — §10 found `nodes[].instructions` writes are also non-functional via this MCP server, not just the routing-description field.**

**Corrected conclusion:** as of this MCP server version, **no field inside the `nodes` array can be reliably written through `create_agent` or `update_agent`** — not `instructions`, not `description`, not `llmConfig`, not a brand-new node, regardless of whether a partial or fully-specified node object is sent. Calls report `success: true` and even advance the agent's `lastModified` timestamp, but a follow-up `get_agent` shows the node data unchanged from Convocore's default template. **Treat the dashboard's Canvas editor (or the raw REST API directly, independently re-verified) as the only currently confirmed way to change a node's `instructions`, `description`, or any other node-level field — do not rely on this MCP server's `create_agent`/`update_agent` tools for that, despite what their descriptions claim.** Agent-level (non-`nodes`) fields, like the top-level `description`, write correctly through the same tool (§10 Setup/Test 1) — the defect is scoped specifically to the `nodes` array.

**Also confirmed via §10, not just inferred:** node **edge/wiring data** — the default node shape includes a `childrenNodes` array (empty by default) as the apparent wiring field, alongside `isGlobal` (boolean, present and `false` by default) for the Global Node toggle. No `edges`/`connections`/`next`/`targetId` field exists anywhere in a node object. Since the entire `nodes` write path is non-functional (previous paragraph), none of these are writable via MCP either, moot as the question now is. **Visual Canvas flow editing — wiring nodes together, positioning them, toggling Global Node, editing Condition Node edge logic, and even basic prompt-instruction editing — is confirmed dashboard-only (or direct-REST-only, independently of this MCP server) as of this test.**

---

> ## ⟳⟳ SECOND UPDATE — 2026-07-27, npx / v2.3.8 retest (§11.3–11.4): the bug above is FIXED. Read this box, not the struck-through analysis above, for the current answer.
>
> Everything in §5.4 up to this point describes the **Docker-based v2.1.0 server** and is now **historical** — kept in place, unedited, as an audit trail of what was true on that version. A follow-up retest against the **npx-based v2.3.8 server** (§11, same day, different session) found the node-write bug **completely fixed**, plus a genuinely new and important detail about *why* it was likely broken:
>
> - **The underlying REST API now enforces `nodes[].description` and `nodes[].llmConfig` as required fields on `create_agent`** — omitting them (as the v2.1.0-era testing always did, since the tool description only mentioned `instructions`) now returns a clean, structured 400 validation error instead of silently no-op'ing. This strongly suggests the *old* silent-failure behavior was the API/MCP server rejecting an incomplete node object in a way that failed to surface as an error to the caller — a real bug that has since been replaced with honest validation.
> - Once the required fields are supplied, **every write path tested now works, confirmed independently via `get_agent` after each call**: `instructions` alone, `description` alone (the routing-trigger field — **this is the concrete, positive answer to this section's original question: yes, MCP can now write the routing-description field**), `llmConfig` with specific model/temperature/token values, adding a brand-new second node while preserving the first (genuine deep-merge), the `isGlobal` toggle, a `type: "condition"` node, and even the `childrenNodes` wiring array itself.
> - **New caveat replacing the old one:** `childrenNodes` accepting a bare array of ID strings (`["node_2"]`) writes successfully with no validation error, but **crashes the actual `/interact` runtime** with `TypeError: Cannot create property 'condition' on string 'node_2'` — meaning the *storage* layer now accepts node writes far more liberally than the *routing engine* can safely consume. See §11.7 for the full reproduction. **Practical implication: MCP can now build a multi-node Canvas flow, but wiring nodes together via `childrenNodes` needs real-world validation against `interact_with_agent` (or the dashboard's Test Mode) before trusting it in production — the object shape `childrenNodes` actually expects at the routing layer is not documented anywhere and is likely NOT a bare ID-string array.**
>
> **Corrected conclusion (supersedes the boxed conclusion above):** as of v2.3.8/npx, `create_agent`/`update_agent` **can** reliably write every node-level field tested, including the routing-description field — this is a genuine, positive capability the original v2.1.0 audit did not have. The remaining caveat is not "MCP can't write nodes," it's "MCP can write node-wiring data that the runtime doesn't know how to safely route through yet." Full detail, exact calls, and the crash reproduction: §11.3–11.4 and §11.7.

### 5.5 Things confirmed dashboard-only / unreachable from either MCP or REST-as-documented

Per the task brief's specific checklist:

| Capability | Reachable via MCP? | Reachable via REST (documented)? | Verdict |
|---|---|---|---|
| Canvas visual flow editing (node wiring, positions, Condition Nodes) | 🟡 Partial as of v2.3.8 — node *data* (instructions/description/llmConfig/isGlobal/type/childrenNodes) is writable (§5.4 update, §11.3–11.4); visual `rf` canvas *position* data was not tested either round | ❌ (not in documented settable fields) | **Mostly dashboard-only** — node content now scriptable via MCP; visual layout still isn't |
| Node routing-trigger ("Defines what this node does") field — write | ✅ **Confirmed working as of v2.3.8** (§11.3, §5.4 update) — was ❌ on v2.1.0/Docker | ❌ (not in documented settable fields) | **MCP-reachable as of v2.3.8** — REST doc itself remains outdated on this point |
| Deploying/embedding a widget (getting the snippet, activating a channel) | ✅ **Confirmed working as of v2.3.8** — `get_website_embed_code` returns a real, ready-to-paste snippet with live agent ID + region filled in (§11.7) | Not a REST resource group in the API Reference — deployment is snippet/config-based (Master Reference §10), not an API call | **MCP-reachable as of v2.3.8** for the *snippet*; activating a channel (WhatsApp/Instagram/etc.) itself still isn't covered |
| Custom widget CSS (read/write `customCSS`) | ✅ **New as of v2.3.8** — `get_agent_custom_css`, `update_agent_custom_css`, `get_widget_css_styling_guide` all live-tested and round-tripped correctly (§11.7) | Not documented as a resource group in the API Reference | **MCP-reachable as of v2.3.8** — this entire capability didn't exist in the original 22-tool audit |
| Whitelabel / agency configuration | ❌ | Not covered in the API Reference's resource groups read for this doc | **Still dashboard-only** |
| Billing | ❌ | Not covered | **Still dashboard-only** |
| Tools (function-calling config) | ❌ (confirmed still absent in the full 50-tool v2.3.8 inventory, §11.1) | ✅ REST | **Still REST or dashboard, not MCP** |
| Variables | ❌ (confirmed still absent in the full 50-tool v2.3.8 inventory, §11.1) | ✅ REST | **Still REST or dashboard, not MCP** |
| Live conversation (actually chatting with an agent programmatically) | ✅ **New as of v2.3.8** — `interact_with_agent` opens a real WSS connection and returns an aggregated turn result; live-tested successfully, though it also surfaced a real backend crash on a non-trivial flow (§11.7) | ✅ WebSocket Interact | **MCP-reachable as of v2.3.8** — consumes real credits per-turn, same as a genuine user interaction |

---

## 6. MCP Client-Side Note: Canvas Nodes' "MCP Servers" Feature

> ⚠️ **This entire section is documented, not live-tested — and, further, could not be independently corroborated via public web search or Convocore's own docs site during research for this document.** It is included because it was described directly by the person requesting this document, based on their own familiarity with the dashboard, and is architecturally the *inverse* of everything in §1–§5 above — worth documenting clearly and separately so it is never confused with the introspected MCP-server content in this document.

**What this is, per the description given:** separate from the MCP *server* this whole document is about (Convocore exposing tools *to* an external AI agent like Claude Code), each Canvas node in the dashboard reportedly has its own **"MCP Servers" section** that lets *that node* act as an MCP *client* — connecting outward to and using tools from other MCP servers (the example given was Supabase's own MCP server) as if they were regular node Tools (§4.3 of the Master Reference / Canvas §6.12's "Tools" mechanism).

**How this differs from the subject of this document, conceptually:**

| | This document's subject (§1–§5) | Canvas node's "MCP Servers" feature |
|---|---|---|
| Direction | Convocore is the MCP **server**; Claude Code (or another coding agent) is the **client** | A Canvas node is the MCP **client**; some other system (e.g. Supabase) is the **server** |
| Where it runs | Local to your coding session (stdio, Docker) | Presumably server-side, inside Convocore's own runtime, invoked during a live conversation |
| What it lets you do | Manage/build Convocore agents, KB, conversations from outside Convocore | Let an agent's *own conversational responses* call out to external MCP tools at chat-time — e.g. an agent node querying a Supabase database live during a user conversation |
| Verification status in this document | **Live-tested** — every claim in §1–§5 traces to an actual tool call or a live server response | **Not tested, not independently found in public docs** — sourced from the requester's own description only |

**Research attempted, and what was actually found:** a live search of `docs.convocore.ai`'s indexed pages located the real **Tools Integration** page (`docs.convocore.ai/canvas/features/tools-integration`), which documents Canvas nodes' standard Tools tab (Add Tool → Tool Name / Server URL / Request Method / Variables, plus the `{` text-editor shortcut and a built-in Test Tool feature — all consistent with Master Reference §6.12 and API Reference §5). **That fetched page did not contain any "MCP Servers" section or any mention of MCP/Model Context Protocol.** Searches of Convocore's docs index (`llms.txt`), general web search, and the `moe003/convocore-mcp` Docker Hub listing (which has no published overview) turned up nothing further. This could mean the feature is: newer than what's currently indexed/published, gated to certain plans/workspaces, named differently than described, or simply not yet publicly documented at the URL patterns searched.

**Recommended next step if this matters for the build:** check directly inside the Convocore dashboard, on an actual Canvas node's settings panel (look for it near or inside the existing Tools tab), rather than relying on either this document or public search — this is the only way to get a live-verified answer, and should be a five-minute dashboard check next time the Canvas editor is open.

---

## 7. Setup / Connection Reference

> ⚠️ **Superseded 2026-07-27 — see §11.1.** This project's `.mcp.json` now uses **npx**, not Docker (switched specifically to escape the Docker image's ~9-month staleness — v2.1.0 vs. the npm package's current v2.3.8). The Docker config below is preserved as **historical/fallback reference** (still valid, still works, just outdated) — a full backup lives at `.mcp.json.docker-backup-2026-07-27` in the project root if reverting is ever needed. **The current live config is documented in §7.3.**

### 7.1 How it's actually run (Docker — historical, v2.1.0)

This server connects via **stdio** (§0) — not a hosted HTTP/SSE endpoint. Claude Code launches it as a local subprocess for the duration of the session, using the config that was present in this project's `.mcp.json` until 2026-07-27:

```json
{
  "mcpServers": {
    "convocore": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-e", "WORKSPACE_SECRET", "-e", "CONVOCORE_API_REGION=na-gcp", "moe003/convocore-mcp:latest"],
      "env": {
        "WORKSPACE_SECRET": "<your workspace secret — do not commit this value to a public repo>"
      }
    }
  }
}
```

**Field-by-field:**
- `command: "docker"` + `args` — the actual launch invocation is `docker run -i --rm -e WORKSPACE_SECRET -e CONVOCORE_API_REGION=na-gcp moe003/convocore-mcp:latest`. `-i` keeps stdin open (required for stdio-based MCP communication); `--rm` deletes the container the moment the session ends (no persistent local state between sessions).
- `-e WORKSPACE_SECRET` / `-e CONVOCORE_API_REGION=na-gcp` — passes two environment variables into the container: the auth credential, and the API region (`na-gcp` here — matches the REST API's NA-region base URL pattern per API Reference §3; presumably `eu-gcp` is the EU equivalent, not directly tested).
- `env.WORKSPACE_SECRET` — the actual secret value, supplied by Claude Code's own process environment into the Docker container. This is the **workspace secret** credential type per API Reference §2 — meaning (in theory, modulo §4.9's finding) it should be able to act on every agent in the workspace, not just one.
- `moe003/convocore-mcp:latest` — the Docker image. Docker Hub shows this publisher also ships a pinned `2.1.0` tag (53.1MB); `.mcp.json` here uses `:latest`, meaning the exact tool set/behavior could shift under you on a future session if the publisher pushes an update — worth being aware of if a tool's behavior ever seems to have changed without this document being updated. **This is exactly what happened — see §7.3.**

### 7.2 Prerequisites

- **Docker** installed and running locally (the harness shells out to `docker run` directly — if Docker isn't installed/running, the MCP server simply won't start, and none of the `mcp__convocore__*` tools would appear).
- A valid **Convocore workspace secret** (Dashboard → workspace switcher → workspace settings, per API Reference §2) — this is the only credential this server's config uses; there's no separate per-agent secret option exposed in this `.mcp.json` shape.
- Correct **region** value (`na-gcp` used here) matching your actual workspace's data-center region (API Reference §3's EU/NA distinction) — using the wrong region is the same silent-failure risk called out in the API Reference (§3: "a wrong-region request doesn't always fail loudly").

### 7.3 Current live config — npx, v2.3.8 (as of 2026-07-27, see §11.1)

```json
{
  "mcpServers": {
    "convocore": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "convocore-mcp"],
      "env": {
        "WORKSPACE_SECRET": "<redacted — see local .mcp.json>",
        "CONVOCORE_API_REGION": "na-gcp"
      }
    }
  }
}
```

**Why `cmd /c npx ...` and not bare `npx ...`:** on Windows, `npx` resolves to `npx.cmd` (a batch file). The README's plain `"command": "npx", "args": ["-y", "convocore-mcp"]` form **failed to connect at all** in this environment (zero tools registered after a restart) — confirmed via manually running the identical command in Bash, which worked fine, isolating the failure to how the harness spawns processes on Windows specifically, not the command/package/credentials. The README anticipates exactly this under its own "Windows note" and documents the `cmd /c` wrapper as the fix, which resolved it on the second attempt. **If setting this up fresh on a non-Windows machine, the plain `npx`/`args: ["-y", "convocore-mcp"]` form from §11.1/the README should work without the `cmd` wrapper** — this wasn't independently tested on Mac/Linux.

**Advantages over the Docker config (§7.1):** always resolves to npm's `latest` (currently 2.3.8, vs. Docker's stuck-at-2.1.0 — see §11's intro), no Docker daemon dependency, matches the upstream project's own "recommended" method.

**Trade-off worth knowing:** `run_command` (§11.2, §11.9) now runs with **direct access to the actual host machine**, not a disposable `--rm`'d Docker container. This was flagged to and acknowledged by the user before switching (§11's intro) — anyone reconnecting this server via npx on a new machine should be aware of the same trade-off before assuming it's a "safe default."

### 7.4 Setup gotchas actually observed across both sessions

1. **"Unauthorized workspace scope" on `get_agent_usage`** — see §4.9, still present at v2.3.8 per §11.6. Not a connection failure (the server is clearly connected and authenticated for every other tool), but a genuine, still-unresolved account/workspace permission gap worth testing for *before* building a workflow that depends on it.
2. **`search_agents` is unreliable** — errored outright on v2.1.0/Docker (§4.9); silently returns zero results regardless of query on v2.3.8/npx (§11.6). Don't build a workflow that depends on this tool actually finding agents — use `list_agents` and filter client-side instead, which is also literally what this MCP server's own maintainer-provided instructions recommend.
3. **Large default responses** — `list_agents` in particular returns full agent objects (not summaries), which can be large enough to spill into a separate result file rather than being inlined directly (observed here: 86KB+ for 2 agents, 90KB+ for 3). Worth knowing before calling it inside a tight context budget, or before iterating over many agents in a loop.
4. **`:latest`/unpinned npm version** — neither the original Docker config's `:latest` tag nor the current npx config's unpinned `convocore-mcp` (no `@version`) pin a specific release. This is exactly how the project drifted from being current to being 9 months stale in the first place (§11's intro) — if reproducibility matters, consider pinning explicitly (e.g. `npx -y convocore-mcp@2.3.8`) and revisiting the pin deliberately rather than trusting `latest` to always be current.
5. **Secret hygiene** — the raw `WORKSPACE_SECRET` value lives in plaintext in `.mcp.json` in this project (both the historical Docker version and the current npx version). Treat that file — and its backup, `.mcp.json.docker-backup-2026-07-27` — with the same care as any other secret-bearing config (don't commit either to a public remote, don't paste their contents into shared docs/chats) — this document deliberately redacts the value for that reason.
6. **Windows process-spawning quirk (§7.3, §11.1)** — bare `npx` as the `command` failed silently (zero tools, no error surfaced to the user) rather than failing loudly; only manually reproducing the exact command outside the harness revealed it actually worked fine standalone, isolating the issue to harness-level process spawning on Windows. If a fresh MCP connection ever registers zero tools after a config change, don't assume the config is wrong — try running the exact command manually first, the way this was diagnosed.

---

## 8. Glossary

| Term | Plain-English meaning |
|---|---|
| **MCP (Model Context Protocol)** | An open standard letting an AI agent connect to external systems (like Convocore) through a common, discoverable interface of tools/resources/prompts, instead of bespoke one-off integration code per system. |
| **MCP server** | A program that exposes one system's capabilities to an MCP-capable AI client. Here: the `moe003/convocore-mcp` Docker image, exposing a slice of Convocore. |
| **MCP client** | The AI application connecting to and calling an MCP server's tools. Here: Claude Code. (Also used, confusingly, for the *inverse* relationship in §6 — a Convocore Canvas node acting as a client to some *other* MCP server.) |
| **Tool** | One callable action an MCP server exposes — a name, a description (read by the AI to decide when/why to call it), and an input schema. |
| **Resource** (MCP) | A passively-readable piece of content an MCP server can expose by URI, distinct from an actively-called tool. This server exposes zero. |
| **Prompt** (MCP) | A server-provided, parameterized prompt template. No evidence this server exposes any. |
| **stdio** | "Standard input/output" — the local-process communication method this server uses (vs. a networked HTTP/SSE MCP server). Requires the server to run as a local subprocess (here, inside Docker) for the life of the session. |
| **Schema** (tool input schema) | The formal, machine-checked shape of a tool's parameters — field names, types, which are required — validated before a call ever reaches the server. |
| **Workspace secret / agent secret** | Convocore's two credential scopes (API Reference §2). This MCP server is configured with a workspace secret. |
| **VG / VF (agent platform)** | `agentPlatform` field values: `"vg"` = native Convocore agent (Canvas/node-based); `"vf"` = Voiceflow-imported agent, with narrower feature support (Master Reference §1.4–1.5). KB tools in this MCP server only work on `vg` agents. |
| **Node (`nodes` array)** | The data structure representing an agent's actual behavior — even a simple single-prompt agent is stored as one node (`id: "__start__"`) with an `instructions` field. See Master Reference §6 and API Reference §4.2. |
| **Router LLM** | The separate model instance (configurable independently of any node's own response-generating model) that decides which Canvas node handles each incoming message, by reasoning over each node's routing-description field (Master Reference §6.5). Not directly controllable via this MCP server (§5.4). |
| **Deep merge / PATCH semantics** | How Convocore's update endpoints handle partial updates — sending one field (or one node, matched by ID) only changes that field/node, leaving everything else untouched (API Reference §4.4). This MCP server's `update_agent`/`update_conversation`/etc. tools are presumed to inherit this behavior as thin wrappers, though not independently re-confirmed for every tool in this session. |
| **`-32603`** | The generic JSON-RPC "internal error" code — MCP's underlying wire protocol is JSON-RPC 2.0, and this code means "the server understood your well-formed request but failed to fulfill it," as opposed to a request-shape validation error. Both live-observed failures in this document (§4.9) returned this code. |

---

## 9. Not Covered / Uncertain — Honest Gaps in This Document

- ~~Every tool marked "not live-tested" in §4... deliberately, to avoid mutating or deleting real data in this workspace's two live agents~~ **RESOLVED — 2026-07-27 (§10).** A disposable test agent (`MCP Capability Test — safe to delete`, ID `hvLBqMlkMOzzZMTC0ZzC`) was created specifically so every previously-untested write/delete path could be exercised safely, without touching `Zenny AI` or `Bakery Assistant`. §10 covers: `create_agent`, `update_agent` (7 distinct field/shape variants), `delete_agent`, the full KB CRUD cycle, and the full conversation CRUD cycle including `assign_conversation` and both export tools. Still genuinely untested after §10: `export_agent`, `import_agent` (skipped — no destructive risk but no test need either), and `get_conversation`/`update_conversation`/`delete_conversation`'s *successful*-path behavior specifically (all three hit the "Conversation not found" bug from §10 Test 8 before their actual logic could be exercised).
- ~~Root cause of the "Unauthorized workspace scope" errors (§4.9) was not diagnosed further~~ **PARTIALLY RESOLVED — §10 Test 9.** Re-running both failing tools against a brand-new agent produced the identical error, confirming the failure is **workspace-wide / credential-level, not scoped to a specific agent's history or permissions.** What remains unconfirmed: whether the same `WORKSPACE_SECRET` value succeeds when used directly against the equivalent raw REST endpoints outside MCP — that specific cross-check (REST vs. MCP, same credential) was not performed and would isolate whether this is an MCP-server-specific bug or a genuine account-level permission gap.
- ~~§5.4's Canvas routing-field write question is deliberately left as "unconfirmed"~~ **RESOLVED — §10.** Not only the routing-description field but the *entire* `nodes` array write path (`instructions`, `description`, `llmConfig`, new-node addition, `isGlobal`, condition-node shape) was tested against a disposable agent and found universally non-functional. See updated §5.4 for the full conclusion.
- **New finding from §10, not previously known:** `get_kb_doc` and `get_conversation` (plus, by extension, `assign_conversation`, `update_conversation`, `delete_conversation` — all of which do their own internal lookup first) return a "not found" error for records that demonstrably exist (confirmed present via `list_kb_docs`/`list_conversations` in the same test run). This looks like a real, reproducible bug in this MCP server's single-item lookup path for records created via the API/MCP itself — not something inferred, but not root-caused either (untested: whether the same records become fetchable after a longer delay, or whether this only affects API-created records vs. ones created through real user conversations/dashboard actions).
- **New finding from §10, not previously known:** `export_conversation` and `export_all_conversations` both fail with a *different*, clearly-labeled error — `"Chat Export API addon required. Subscribe to chat-export-api to use this endpoint."` — meaning conversation export is gated behind a separate paid add-on on this workspace's plan, independent of the MCP layer entirely. This should be treated as a billing/plan fact, not an MCP bug — worth knowing before assuming export tools are usable.
- **§6 (Canvas node "MCP Servers" client feature)** rests entirely on the requester's own description plus a documented absence in the one real Convocore docs page found and fetched (`tools-integration`) — this is the weakest-sourced section in this document and is labeled as such throughout. Confirming it needs a direct look inside the dashboard's Canvas node settings panel, which wasn't accessible from this session. **Not addressed by §10** (out of scope for that live-capability test, which was MCP-server-side only).
- **EU region behavior** — this server was only observed configured for `na-gcp`; whether an `eu-gcp` (or similarly named) region value works identically was not tested.
- **Still-unconfirmed error shapes** — §10 surfaced two new error strings (`"Conversation not found"`, `"Chat Export API addon required..."`) beyond the original `"Unauthorized workspace scope"`, but other realistic failure modes (invalid `agentId` entirely, malformed `nodes` array shapes beyond what was tried, hitting a rate limit) still weren't deliberately triggered.
- **The `moe003/convocore-mcp` Docker image itself** has no published overview/README on Docker Hub, and no independent GitHub source repository was located during research — meaning there is no external documentation to cross-check this document's tool-schema findings against beyond the live server's own self-reported schemas (which is itself the most authoritative source available, but it is the *only* source).
- **One known leftover from §10 testing:** a single empty test conversation (`hvLBqMlkMOzzZMTC0ZzC_6PEQ79eypvmGKkpIo44h`) could not be deleted via MCP (it hit the same "Conversation not found" bug as the other single-item lookups) before its parent agent was deleted. Since the parent test agent (`hvLBqMlkMOzzZMTC0ZzC`) was successfully deleted and confirmed absent from `list_agents`, this orphaned conversation record should not be reachable or visible anywhere in the dashboard going forward — flagged here only for completeness, not as an active cleanup item.

---

## 10. Live Capability Test — 2026-07-27

> **Purpose:** closes the open questions flagged in §5.4 and §9 by testing every claim live against a **disposable test agent** created solely for this purpose — never against `Zenny AI` or `Bakery Assistant`. Every call and result below is real; nothing in this section is inferred or guessed. Test agent: **`MCP Capability Test — safe to delete`**, ID `hvLBqMlkMOzzZMTC0ZzC`, created and permanently deleted within this test run.

### 10.1 Setup

**Call:** `create_agent(title: "MCP Capability Test — safe to delete", nodes: [{ id: "__start__", instructions: "test instructions v1", name: "Start" }])`
**Result:** `success: true`, new agent ID `hvLBqMlkMOzzZMTC0ZzC` returned. But the returned `nodes[0]` already showed Convocore's **default template** — `instructions: "Greet the user warmly and tell him that you are ready to help him."` and `description: "This is the start node of the LLM chain."` — not the `"test instructions v1"` that was sent.
**Follow-up `get_agent`:** confirmed the same default-template node data — the custom `instructions` sent at creation time never took effect.
**Default node shape observed** (everything present on `nodes[0]` immediately after creation, whether requested or not): `id`, `name`, `description`, `instructions`, `isGlobal` (`false`), `toolsIds` (`[]`), `childrenNodes` (`[]`), `llmConfig` (`{ modelId, temperature, maxTokens }`), `toolUseBias` (`0.5`), `autoRerouter` (`{ enabled: false, level: 1 }`), `type` (`"start"`), `kb` (`{ enabled: true, maxChunks: 3 }`). Every one of these fields is **auto-populated by the server with a default value**, not merely present-but-empty — meaning a freshly created agent never has an "absent" node field to speak of.
**Verdict:** 🔴 **`create_agent`'s `nodes` parameter is a no-op.** The agent is created, but with Convocore's standard default-template node content, never the caller-supplied `instructions`.

### 10.2 Test 1 — Write the routing-trigger `description` field

**Call:** `update_agent(agentId: "hvLBqMlkMOzzZMTC0ZzC", nodes: [{ id: "__start__", description: "ROUTER_TEST_MARKER: use this node when testing MCP" }])`
**Result:** `success: true`, `lastModified` advanced (1785141221 → 1785141252) — the call was accepted and processed something server-side.
**Follow-up `get_agent`:** `description` still read `"This is the start node of the LLM chain."` — **unchanged.** `instructions` also still read the default template — unchanged.
**Verdict:** 🔴 **FAILED.** The write did not persist. `lastModified` ticking up shows the call reached the server and did *something* (touched the record), but the `nodes` sub-object itself was not updated.

**Follow-up isolation test (not in the original brief, added because the create-time failure in §10.1 raised doubt about whether `instructions` writes work via MCP at all):** `update_agent(agentId, nodes: [{ id: "__start__", instructions: "UPDATED_INSTRUCTIONS_TEST_v2" }])` → same pattern: `success: true`, `lastModified` advanced, but `get_agent` showed the default template unchanged. A third attempt sent the **entire** node object back with every field populated (not a partial patch) and only `instructions` changed to `"FULL_OBJECT_TEST_v3"` — same result, no change. **Three independent attempts, three silent failures**, ruling out "partial object" or "missing sibling fields" as the cause.

### 10.3 Test 2 — Multi-node add + deep-merge preservation

**Call:** `update_agent(agentId, nodes: [{ id: "__start__", ...unchanged... }, { id: "node_2", name: "Second Node", instructions: "second node instructions", description: "second node routing trigger", type: "default" }])` — both nodes sent in the same call.
**Result:** `success: true`, `lastModified` advanced.
**Follow-up `get_agent`:** `nodes` array still contained **only** `__start__`, still at default-template content. **`node_2` was never added.**
**Verdict:** 🔴 **FAILED.** Consistent with §10.2 — the entire `nodes` write path is a no-op, so there was nothing for deep-merge semantics to even apply to. `__start__`'s data "surviving" is not evidence of working deep-merge; it survived because nothing about `nodes` was ever actually written, full stop.

### 10.4 Test 3 — Global Node toggle

**Call (combined with Tests 5 & 6 below into one request, since the pattern was already established and each is a cheap addition to a single call):** `update_agent(agentId, nodes: [..., { id: "node_2", name: "Second Node", isGlobal: true, global: true, type: "default" }, ...])` — tried both `isGlobal` and `global` key names simultaneously.
**Result:** `success: true`.
**Follow-up `get_agent`:** `node_2` still did not exist at all (per §10.3) — neither key name had anything to attach to, since the node itself was never created.
**Verdict:** 🔴 **FAILED** (moot — blocked by the same root-cause `nodes` write failure as Tests 1–2, not a distinct finding about the toggle specifically).

### 10.5 Test 4 — Edges / wiring field inspection

Per §10.1's default node shape, the field that best matches "stores connections to other nodes" is **`childrenNodes`** (an array, empty `[]` by default on a freshly created node). No `edges`, `connections`, `next`, or `targetId` field exists anywhere in any node object observed in this test or in the earlier real `Zenny AI`/`Bakery Assistant` data reviewed for §4.
**Verdict:** ✅ **Confirmed field name: `childrenNodes`.** (Whether it is writable is moot given §10.2–10.4's findings — the whole `nodes` array is non-functional to write via this server regardless of which field inside it you target.)

### 10.6 Test 5 — Condition Node attempt

**Call:** included in the same combined request as Test 3 — `{ id: "cond_1", name: "Condition Test", type: "condition", nodeType: "condition", edgeCondition: "Route here when user says test" }`.
**Result:** `success: true`.
**Follow-up `get_agent`:** `cond_1` does not exist anywhere in the `nodes` array.
**Verdict:** 🔴 **FAILED**, same root cause as Tests 1–4. As expected going in, this was exploratory — but it confirms the failure is total, not limited to editing pre-existing nodes.

### 10.7 Test 6 — `llmConfig` round-trip

**Call:** included in the same combined request — `{ id: "__start__", llmConfig: { modelId: "gpt-4o", temperature: 0.3, maxTokens: 500 } }`.
**Result:** `success: true`.
**Follow-up `get_agent`:** `llmConfig` on `__start__` still read the original default (`modelId: "gemini-2.5-flash"`, `temperature: 0.7`, `maxTokens: 2024`) — **not** the requested `gpt-4o` / `0.3` / `500`.
**Verdict:** 🔴 **FAILED**, consistent with every other node-field write in this test run.

**Isolation control (confirms the bug is scoped to `nodes`, not to `update_agent` generally):** `update_agent(agentId, description: "AGENT_LEVEL_DESC_TEST")` (a **top-level**, non-`nodes` field) → `success: true`, and a follow-up `get_agent` confirmed `description: "AGENT_LEVEL_DESC_TEST"` **did** persist correctly. **This isolates the defect precisely to the `nodes` array** — `update_agent` itself works; specifically its handling of the `nodes` parameter does not.

### 10.8 Test 7 — KB tools end-to-end

| Step | Call | Result |
|---|---|---|
| Create | `create_kb_doc(agentId, name: "MCP Test Doc", sourceType: "doc", content: "...KB_TEST_MARKER_v1.")` | ✅ `success: true`, doc ID `T9xS8zJbpBpaMzL0lGJk`, `status: "SUCCESS"` |
| Get (immediately after) | `get_kb_doc(agentId, docId: "T9xS8zJbpBpaMzL0lGJk")` | 🔴 `MCP error -32603: Failed to fetch KB document` — retried once, same error |
| Stats | `get_kb_stats(agentId)` | ✅ `{ charCount: 106, docsCount: 1 }` — correctly reflected the new doc |
| List (cross-check) | `list_kb_docs(agentId)` | ✅ showed the doc present with `status: "SUCCESS"` and full metadata — confirming it genuinely exists despite `get_kb_doc` failing |
| Update | `update_kb_doc(agentId, docId, content: "UPDATED_CONTENT_MARKER_v2...")` | ✅ `success: true`, response directly echoed the new content — this one **did** round-trip correctly |
| Delete | `delete_kb_doc(agentId, docId)` | ✅ `success: true` |
| Confirm deletion | `list_kb_docs(agentId)` | ✅ `data: [], total: 0` — deletion confirmed |

**Verdict:** ✅ **Mostly working** — create/stats/update/delete all functioned correctly and persisted as expected (a real, positive contrast to §10.1–10.7's `nodes` findings). 🔴 **One clear bug:** `get_kb_doc` failed for a document that demonstrably existed (per `list_kb_docs` and `get_kb_stats` in the same test), even after a retry.

### 10.9 Test 8 — Conversation tools + `assign_conversation`

| Step | Call | Result |
|---|---|---|
| Create | `create_conversation(agentId, conversation: { ts: ..., userName: "MCP Test User", userEmail: "mcptest@example.com", tags: ["mcp-test"] })` | ✅ `success: true`, convo ID `hvLBqMlkMOzzZMTC0ZzC_6PEQ79eypvmGKkpIo44h` (note: **API/MCP-created conversation IDs are prefixed with the agent ID** — `{agentId}_{suffix}` — unlike the short, unprefixed IDs seen on real user-generated conversations in §4.4's `list_conversations` example) |
| Get (immediately after) | `get_conversation(agentId, convoId)` | 🔴 `MCP error -32603: Conversation not found` — retried once, same error |
| List (cross-check) | `list_conversations(agentId)` | ✅ showed the conversation present with correct `userName`/`userEmail`/`tags` — confirming it genuinely exists despite `get_conversation` failing |
| Assign | `assign_conversation(agentId, convoId, assignToUserId: <workspace owner ID>)` | 🔴 `MCP error -32603: Conversation not found` — same lookup failure, so **its actual assignment behavior could not be observed**; it does appear to perform a real lookup rather than being a no-op, since it fails the same way `get_conversation` does on the same unfindable ID |
| Update | `update_conversation(agentId, convoId, conversation: { tags: [...], notes: "UPDATE_TEST_MARKER" })` | 🔴 `MCP error -32603: Conversation not found` — same failure |
| Export (single) | `export_conversation(agentId, convoId)` | 🔴 **Different error:** `"Chat Export API addon required. Subscribe to chat-export-api to use this endpoint."` |
| Export (all) | `export_all_conversations(agentId)` | 🔴 Same add-on-required error as above |
| Delete | `delete_conversation(agentId, convoId)` | 🔴 `MCP error -32603: Conversation not found` — could not clean this record up directly (see §9's note on the resulting harmless orphan) |

**Verdict:** 🟡 **Partial / blocked.** `create_conversation` and `list_conversations` work correctly. Every single-item operation (`get`, `assign`, `update`, `delete`) hit the same "Conversation not found" bug as `get_kb_doc` in §10.8 — a **cross-cutting pattern**, not isolated to one tool: items created via this MCP server's create endpoints are visible in list endpoints but not resolvable by their own ID through get/update/delete/assign endpoints. `export_conversation`/`export_all_conversations` are separately blocked by a **plan/billing gate** (`chat-export-api` add-on), unrelated to the ID-lookup bug — this workspace's plan does not currently include that add-on.

### 10.10 Test 9 — Auth boundary re-test

**Calls:** `get_agent_usage(agentId: "hvLBqMlkMOzzZMTC0ZzC")` and `search_agents(workspaceId: "test")`, both against the brand-new test agent/an arbitrary workspace ID.
**Result:** both failed identically to the original §4.9 finding: `MCP error -32603: Unauthorized workspace scope`.
**Verdict:** ✅ **Confirms the failure is workspace-wide / credential-scoped, not specific to a particular agent's history, age, or permissions.** A brand-new agent created moments earlier by the same credential hits the identical wall — ruling out "maybe it only fails for agents predating this MCP server session" or similar agent-specific theories.

### 10.11 Cleanup

**Call:** `delete_agent(agentId: "hvLBqMlkMOzzZMTC0ZzC")` → `success: true`, `"Agent deleted successfully with 0 associated documents"`.
**Confirmation:** `list_agents()` re-run and grepped for the test agent's title and ID — **zero matches**; response size matched the original 2-agent baseline exactly. **Deletion confirmed.**

### 10.12 Summary table

| # | Test | Verdict |
|---|---|---|
| Setup | `create_agent` custom `nodes[0].instructions` | 🔴 Silent no-op — default template used instead |
| 1 | `update_agent` — write `description` (routing field) | 🔴 Silent no-op |
| 1b | `update_agent` — write `instructions` (partial, then full object) | 🔴 Silent no-op (2 more attempts, both failed) |
| 1c | `update_agent` — write top-level agent `description` (control) | ✅ Works correctly |
| 2 | `update_agent` — add new node while preserving existing | 🔴 New node never added |
| 3 | `update_agent` — `isGlobal`/`global` toggle | 🔴 Moot — node itself never created |
| 4 | Inspect node shape for wiring field | ✅ `childrenNodes` confirmed as the field; empty by default |
| 5 | `update_agent` — condition-node-shaped entry | 🔴 Never created |
| 6 | `update_agent` — `llmConfig` | 🔴 Silent no-op |
| 7 | KB tools (create/get/stats/list/update/delete) | 🟡 5 of 6 work; `get_kb_doc` fails on an existing doc |
| 8 | Conversation tools (create/get/list/assign/update/export/delete) | 🟡 create+list work; get/assign/update/delete all hit "not found"; export blocked by billing add-on |
| 9 | Auth boundary re-test (`get_agent_usage`, `search_agents`) | 🔴 Same "Unauthorized workspace scope" — confirmed workspace-wide, not agent-specific |
| Cleanup | `delete_agent` + confirm via `list_agents` | ✅ Works correctly, confirmed |

---

## 11. Live Capability Retest — npx / v2.3.8 — 2026-07-27

> **Purpose:** the Docker image (`moe003/convocore-mcp:latest`) was found to be stuck at **v2.1.0**, ~9 months behind the maintainer's current npm-published release (**v2.3.8**, per a separate investigation the same day — the Docker Hub *username* `moe003` is correct and current, the maintainer's GitHub account was renamed `moe003`→`Moe03` but Docker Hub publishing target was not; the *image itself* is just stale because Docker publishes are gated behind a `v*` git tag push that stopped happening while npm releases continued). This section switches the live connection from Docker to **npx** (the README's own "recommended" method) and re-runs a full capability audit — not just a recheck of §10's findings, but a fresh audit including everything new. **Every finding below applies specifically to v2.3.8/npx — always check this version tag before trusting a finding from this document.**

### 11.1 Connection setup — what it actually took

Per explicit instruction, this was done carefully rather than assumed to "just work":

1. **Checked the documented invocation first** — fetched `Moe03/convocore-mcp`'s README directly rather than guessing. It specifies `npx -y convocore-mcp` as "Option A: npx (recommended)", with the same `WORKSPACE_SECRET`/`CONVOCORE_API_REGION` env vars as the Docker config.
2. **Backed up the working Docker config** to `.mcp.json.docker-backup-2026-07-27` (full original content preserved) before touching the live file.
3. **First attempt failed.** Updated `.mcp.json` to `{ "command": "npx", "args": ["-y", "convocore-mcp"], ... }` exactly as documented, restarted the session — **zero `mcp__convocore__*` tools registered at all**, not even the old ones. This is a real, reproducible connection failure, not a guess.
4. **Diagnosed rather than thrashed:** ran the identical `npx -y convocore-mcp` command manually via Bash with the same env vars — it worked perfectly, printing the exact expected `ConvoCore MCP Server running on stdio` startup line. This isolated the failure to *how the harness spawns the process on Windows*, not the command, package, or credentials.
5. **Applied the README's own documented fix:** its "Windows note" says to wrap with `cmd /c` if bare `npx` fails to spawn (Windows `npx` resolves to `npx.cmd`, a batch file some process-launch APIs can't invoke directly). Updated to `{ "command": "cmd", "args": ["/c", "npx", "-y", "convocore-mcp"], ... }`.
6. **Second restart succeeded** — the harness announced 23 previously-seen tool names reconnecting plus 30 newly-visible tool names, and (strong independent confirmation) the session received the server's own MCP `instructions` payload for the first time, which only happens on a genuine fresh handshake.
7. **Version confirmed two ways:** `npm view convocore-mcp version` → `2.3.8` (npm registry `latest`); then located the actual npm-cache-resolved package on disk (`.../npm-cache/_npx/<hash>/node_modules/convocore-mcp/package.json`) and confirmed its `"version": "2.3.8"` directly — not inferred, read from the exact file npx executed.
8. **One maintainer-side inconsistency noted:** the server's own MCP protocol metadata (`Server({ name: 'convocore-mcp', version: '2.2.0' })` in source) is stale relative to `package.json`'s `2.3.8` — a hardcoded string the maintainer forgot to bump, not a connection problem on our end. Don't trust the MCP handshake's self-reported version string for this server; trust the npm package version instead.

**Net result: connected via `cmd /c npx -y convocore-mcp`, confirmed running v2.3.8.**

### 11.2 Step 0 — Tool inventory diff

Source-verified directly from `Moe03/convocore-mcp`'s `src/index.ts` (the `tools: Tool[]` array and the `PROMPTS` array), not just the README (which is itself slightly stale — see below).

**Headline numbers:** 22 tools (v2.1.0) → **50 tools** (v2.3.8). Zero MCP resources, same as before. **Two MCP prompts now exist** (`integrate_website_widget`, `generate_widget_css`) — a direct reversal of §3's "confirmed absent" finding, which was accurate for v2.1.0 and is no longer accurate for v2.3.8. (Not deeply tested this round — they're slash-command-style prompt templates, lower priority than the 28 new tools; flagged in §11.9 as not covered.)

**All 22 original tools are still present, same names.** None disappeared. Two have materially changed behavior (documented in their respective test sections below): `create_agent`/`update_agent` (stricter node validation) and `search_agents` (no longer needs `workspaceId`).

**28 genuinely new tools**, grouped by category:

| Category | New tools | REST/dashboard equivalent existed before? |
|---|---|---|
| **Agent creation shortcut** | `create_agent_from_template` | No — new, opinionated workflow (scrape → pick colors/voice → create) not documented in the API Reference |
| **Widget Deployment & CSS** | `get_website_embed_code`, `get_widget_css_styling_guide`, `get_agent_custom_css`, `update_agent_custom_css` | Dashboard-only per the original audit (§5.5) — now MCP-reachable, see §11.7 |
| **File I/O** (local files, not Convocore data) | `inspect_file`, `read_text_file`, `read_pdf`, `read_docx`, `read_spreadsheet`, `read_image`, `import_file_to_kb` | No REST equivalent at all — this is local-filesystem/URL file parsing bridged into KB import |
| **Utility** | `sleep`, `run_command` | No REST equivalent — `run_command` is a genuine host-shell executor (§11.9 — not live-tested, per explicit user decision) |
| **Voice** | `list_voice_providers`, `list_voice_models`, `search_voices`, `list_provider_voices`, `get_voice` | REST has a Voices API (API Reference §10.3) but it wasn't MCP-exposed before; now fully covered and richer (12 providers, 313+ voices in one search) |
| **Telephony (Twilio)** | `buy_twilio_number`, `import_twilio_number`, `release_twilio_number`, `check_twilio_number`, `sync_sms_twilio_number` | REST covered this (API Reference §10.2) but it wasn't MCP-exposed before; now covered — not live-tested (real money / real Twilio account required), schema-only in §11.9 |
| **Live interaction** | `interact_with_agent` | REST/WebSocket Interact existed (API Reference §17) but was completely unreachable via MCP before; now reachable — see §11.7 for the crash finding |
| **Conversation transcript editing** | `update_conversation_messages` | New — full transcript replacement, distinct from `update_conversation`'s lighter metadata patch |
| **Static reference/knowledge** | `get_ui_engine_spec`, `get_channel_integration_spec`, `get_pricing_info` | No REST equivalent — these are static knowledge baked into the MCP server itself, not API calls |

💡 **The README undersells this:** it claims "24 tools" and its own HTTP-mapping table lists only 26 of the 50 (omitting the entire File I/O, Voice, and Static Reference categories, and `sleep`/`run_command`) — a real documentation gap in the upstream project, not something to trust blindly. **Source code (`src/index.ts`), not the README, is the ground truth for this server's actual tool count and behavior**, confirmed directly rather than assumed.

### 11.3 Node write tests (1–3) — FIXED

Created a fresh disposable test agent, **`MCP Capability Test v2 — safe to delete`** (ID `38gvUAHuQ5I8tupEfpX4`), same discipline as §10 — never touching `Zenny AI` or `Bakery Assistant`.

**Setup call, attempt 1** (mirroring §10's exact original call): `create_agent(title, enableNodes: true, nodes: [{ id: "__start__", instructions: "test instructions v1", name: "Start" }])` → **FAILED**, but with a real, structured 400 validation error (not a silent no-op like v2.1.0):
```
issues: [
  { path: ["agent","nodes",0,"description"], message: "Required" },
  { path: ["agent","nodes",0,"llmConfig"],    message: "Required" }
]
```
This is itself a major, positive finding: **the underlying REST API now validates node objects strictly and tells you exactly what's missing**, instead of silently accepting an incomplete payload and discarding it — almost certainly the actual root cause of §10's original "silent no-op" bug.

**Setup call, attempt 2** (with `description` + `llmConfig` supplied): `create_agent(..., nodes: [{ id: "__start__", instructions: "test instructions v1", description: "ROUTER_TEST_MARKER: create-time description", name: "Start", llmConfig: {...} }])` → **SUCCESS**, and independently confirmed via a follow-up `get_agent`: both `instructions` and `description` persisted **exactly as sent**.

**Test 1 — write `description` alone via `update_agent`:** `update_agent(agentId, nodes: [{ id: "__start__", description: "ROUTER_TEST_MARKER_v2: updated via update_agent" }])` (deliberately partial, no `instructions`/`llmConfig` resent) → **SUCCESS**, confirmed via independent `get_agent`: `description` updated to the new value, `instructions` and `llmConfig` **preserved unchanged** — genuine, working PATCH deep-merge.

**Test 1b — write `instructions` alone:** same pattern → **SUCCESS**, confirmed independently.

**Test 2 — add a second node while preserving the first:** `update_agent(agentId, nodes: [{ id: "__start__", ...full unchanged object... }, { id: "node_2", name: "Second Node", instructions: "second node instructions", description: "second node routing trigger", llmConfig: {...} }])` → **SUCCESS**, confirmed independently: both nodes present, `__start__` untouched.

**Verdict: Tests 1 and 2 are FIXED.** Every write attempted succeeded and was independently confirmed via a follow-up `get_agent`, matching the same verification discipline as §10.

### 11.4 Node write tests (3–6) — also FIXED

**Test 3 — Global Node toggle:** `update_agent(agentId, nodes: [{ id: "node_2", ...unchanged..., isGlobal: true }, { id: "cond_1", name: "Condition Test", type: "condition", instructions: "...", description: "Route here when user says test", llmConfig: {...} }])` (combined with Test 5 in one call) → **SUCCESS**, confirmed independently: `node_2.isGlobal: true` persisted.

**Test 5 — condition-node-shaped entry:** same call as above → **SUCCESS**, confirmed independently: `cond_1` exists with `type: "condition"` persisted exactly as sent. (§10's version of this test failed outright — the node was never created at all.)

**Test 4 — wiring field inspection:** confirmed (again) that **`childrenNodes`** is the field name, same as §10. New this round: it's **writable**, not just present-but-inert — see the important caveat in §11.7.

**Test 6 — `llmConfig` round-trip with specific values:** `update_agent(agentId, nodes: [{ id: "__start__", llmConfig: { modelId: "gpt-4o", temperature: 0.3, maxTokens: 500 }, childrenNodes: ["node_2"] }])` → **SUCCESS**, confirmed independently: exact values (`gpt-4o`, `0.3`, `500`) persisted, and `childrenNodes: ["node_2"]` also persisted (see §11.7 for what happened when this was actually exercised at runtime).

**Verdict: Tests 3, 4, 5, 6 all FIXED / now-confirmed-working**, a complete reversal of every §10 finding in this category. One new, narrower caveat replaces the old blanket "nodes are unwritable" finding — see §11.7.

**One secondary observation, not chased further:** attempting to *clear* `__start__.childrenNodes` by sending `childrenNodes: []` did not clear it — the field remained `["node_2"]` on the next `get_agent`. This suggests empty-array values may be treated as "no change" by the deep-merge logic rather than "set to empty" — a minor, separate gotcha worth knowing if you ever need to *remove* a node from another node's wiring via MCP, not something this retest had time to isolate further.

### 11.5 Conversation tools — STILL BROKEN (unchanged from §10)

Created a fresh test conversation (`create_conversation`) — **succeeded**, real ID format `{agentId}_{suffix}`, same as §10. Confirmed present via `list_conversations` — **succeeded**.

Then, exactly as in §10, every single-item operation failed:

| Tool | Result |
|---|---|
| `get_conversation` | 🔴 Still fails — but now with a clean, structured 404: `{ status: 404, code: "NOT_FOUND", endpoint: "/agents/{agentId}/convos/{convoId}" }` instead of an opaque generic MCP error. Retried once (in case of a propagation delay, as originally suspected) and cross-checked via `list_conversations` (which found it fine) — still 404. |
| `assign_conversation` | 🔴 Same 404, now showing the real endpoint: `POST /agents/{agentId}/convos/{convoId}/assign` — this incidentally *proves* the endpoint is real (§5.3's uncertainty resolved) even though it doesn't work on API/MCP-created conversations |
| `update_conversation` | 🔴 Same 404 |
| `update_conversation_messages` (new tool) | 🔴 Same 404 — the brand-new transcript-replacement tool inherits the exact same bug |
| `export_conversation` / `export_all_conversations` | 🔴 Different, unrelated failure: `403 FORBIDDEN — "Chat Export API addon required. Subscribe to chat-export-api to use this endpoint."` — confirmed still gated behind the same billing add-on as §10, now with a clean structured error |
| `delete_conversation` | 🔴 Same 404 |

**Verdict: STILL PRESENT, unchanged in substance from §10** — this is a genuine backend (REST API) bug, not something the MCP client version controls, so a client-side version bump alone was never going to fix it. The *only* change is error-reporting quality: v2.3.8 surfaces clean, structured, HTTP-status-aware errors (`status`, `code`, `endpoint`, `method`) for every failure instead of the opaque `MCP error -32603` strings from v2.1.0/Docker — a real UX improvement in the MCP server's error handling, independent of whether the underlying bugs are fixed.

### 11.6 Auth boundary re-test — one fixed, one differently broken

`get_agent_usage(agentId: "38gvUAHuQ5I8tupEfpX4")` → 🔴 **STILL FAILS**, identical `"Unauthorized workspace scope"`, now as a clean structured 401 (`endpoint: "/agents/{agentId}/usage"`, `method: POST`). Confirmed genuinely unresolved, not an MCP-version issue — this is a real account/workspace permission gap on the REST API side.

`search_agents(search: "MCP Capability Test")` → 🟡 **No longer errors**, but returns `{ agents: [], total: 0 }` — **zero results**, despite the schema confirming `workspaceId` is no longer required (resolved internally, matching the source code and the server's own MCP instructions: *"search_agents may 404 on some workspaces — use list_agents or get_agent instead"*). Re-tested with `search: "Bakery"` (should match the real, known `Bakery Assistant` agent) and with **no search filter at all** — both returned `total: 0`. Cross-checked `list_agents` in parallel — it correctly shows all real agents, proving the workspace/credential is fine and this is `search_agents`-specific.

**Verdict: `get_agent_usage` is unchanged/still broken. `search_agents`'s original failure mode (loud auth error) is fixed, but it's been replaced by a different, arguably worse failure mode (silent, always-empty results) — not a clean fix.** The maintainer's own MCP server instructions already hint this tool is unreliable on some workspaces ("may 404... use list_agents instead") — our workspace apparently hits the "always empty" variant of that same underlying unreliability rather than a 404.

### 11.7 New-tool testing — rich findings, including a real crash bug

**Static reference tools** — `get_pricing_info(section: "plans")`, `get_ui_engine_spec(section: "meta")`, `get_channel_integration_spec(section: "sms")` — all three ✅ **worked perfectly**, real structured data returned (real plan pricing incl. credit conversion `$0.001/credit`; real UI Engine streaming semantics; real confirmation that `sync_sms_twilio_number` etc. are the "currentMcpTools" for SMS). No credits consumed, as documented.

**Voice tools** — `list_voice_providers()` → ✅ full real list of 12 providers (ElevenLabs, Deepgram, Cartesia, Rime AI, OpenAI, Google Cloud, Google Live, Ultravox, Grok Live, MiniMax, PlayHT, Azure) with real capability flags and model lists. `search_voices(language: "en", gender: "female", limit: 3)` → ✅ real result: 313 total matches across 12 providers, with two providers (`playht`, `azure`) honestly reported as failed in this call (`fetch failed`, `401`) rather than silently omitted — good error transparency.

**Widget Deployment & CSS tools** — the single biggest boundary reversal this round:
- `get_website_embed_code(agentId, mode: "popup-bottom-right")` → ✅ returned a complete, real, ready-to-paste HTML snippet with the actual agent ID and region filled in. 💡 **Real finding:** the CDN URL returned is `https://cdn.convocore.ai/vg_live_build/...` — **different from** the `vg-bunny-cdn.b-cdn.net` URL documented in `Convocore_Master_Reference_v3.md` §10.1's "Universal popup snippet" — evidence Convocore has migrated CDNs since that document was written; the MCP tool's output should now be treated as more current than that snippet.
- `get_agent_custom_css(agentId)` → ✅ correctly returned `""` (empty) on the fresh test agent.
- `update_agent_custom_css(agentId, customCSS: ".vg-header { background: #226D7A !important; }")` → ✅ wrote successfully, confirmed via a follow-up `get_agent_custom_css` read-back, then cleared with an empty string → ✅ confirmed cleared. Full round-trip works.
- **Verdict: this entire capability area — reading and writing an agent's live embed snippet and custom CSS — did not exist in the original 22-tool audit and is now fully functional.** This directly overturns two rows of the original §5.5 table (see updated table above).

**File I/O tools** — created a tiny throwaway local text file. `inspect_file(path)` → ✅ correct kind/mime/size/line-count/token-estimate. `read_text_file(path)` → ✅ returned exact file content. `sleep(seconds: 1)` → ✅ slept ~1013ms, correct. `import_file_to_kb(agentId, path, name: "File IO Import Test")` → 🔴 **FAILED** with a real bug: `400 BAD_REQUEST`, `metadata.description Required` — the same kind of "REST API now requires a field the MCP tool doesn't supply" pattern seen in §11.3's `create_agent` fix, except here it was **not** fixed — `import_file_to_kb` doesn't pass a `metadata.description`, so it's currently broken as shipped. Interesting inconsistency: plain `create_kb_doc` (§10/§11, still tested working) does **not** require `metadata.description` — only this newer convenience wrapper appears to trigger the stricter validation path.

**`interact_with_agent` — worked, but surfaced a real backend crash:** called with `agentId` (the test agent, which by this point had the multi-node flow from §11.3–11.4 including `childrenNodes: ["node_2"]`), a fresh `convoId`, `prompt: "start"`, `isTest: true`, `disableRecordHistory: true` (deliberately bounded: single greeting turn, marked as a test interaction, no persisted history to clean up). **Result:**
```json
{ "assistantText": "TypeError: Cannot create property 'condition' on string 'node_2'", "closeCode": 1000, "durationMs": 1554, "chunkCount": 1 }
```
This is a **real, live-confirmed backend crash**, not an MCP artifact — the WebSocket connection succeeded (`closeCode: 1000`, clean close) and returned a real server-side stack-trace-flavored error as the "assistant" text. Root cause, inferred from the message: the routing engine expects `childrenNodes` entries to be **objects** (so it can attach a `condition` property to each one for edge-condition logic — see Master Reference §6.7's Condition Node concept) but received a **bare string** (`"node_2"`), because that's the shape §11.4's Test 6 successfully wrote with zero validation error. **This is the single most actionable finding of this retest:** the storage layer (`create_agent`/`update_agent`) now accepts `childrenNodes` as a plain array of ID strings with no complaint, but the runtime (`interact_with_agent`, and presumably the dashboard's real routing engine too) expects something richer — almost certainly per-edge objects carrying condition data, not bare IDs. **Do not wire nodes together via a bare `childrenNodes: [id, id, ...]` array and assume it'll route correctly — validate any multi-node flow built via MCP against `interact_with_agent` or the dashboard's Test Mode before trusting it, since the write succeeding is not evidence the flow will actually run.**

**Verdict: five of six new-tool categories tested worked correctly (static reference, voice, widget/CSS, most of file I/O, live interaction as a capability); two concrete bugs found (`import_file_to_kb`'s missing `metadata.description`, and the `childrenNodes` string-vs-object runtime crash).**

### 11.8 Cleanup

`delete_agent(agentId: "38gvUAHuQ5I8tupEfpX4")` → ✅ `"Agent deleted successfully with 0 associated documents"`. Confirmed via `list_agents` + grep for the test agent's title/ID — zero matches, response size matched the 2-agent baseline exactly. **Deletion confirmed**, same discipline as §10.

One known leftover, same pattern as §10: the test conversation created in §11.5 could not be deleted via MCP (same "not found" bug), but its parent agent is gone, so it should not be reachable anywhere going forward.

### 11.9 Not covered this round (honest gaps)

- **`run_command`** — deliberately **not called**, per explicit user decision after this retest's own Step 0 (§11.2) surfaced it as a new capability. Its full schema is documented directly from source (§11.2's table); its actual behavior was never exercised. This is the single most consequential capability gap in this document: connecting via npx means this tool would run with **direct host-machine shell access** (not the sandboxed, `--rm`'d Docker container the original audit's tools ran inside) — a materially different risk profile than everything else in this document, and worth re-reading §11.1's connection-method tradeoff in that light before relying on this server for anything beyond what was tested here.
- **The 5 Twilio number-management tools** (`buy_twilio_number`, `import_twilio_number`, `release_twilio_number`, `check_twilio_number`, `sync_sms_twilio_number`) — not live-tested. `buy_twilio_number` costs real recurring money ($3/month per number per its own description); the other four require a real Twilio account/real phone numbers this workspace may or may not have. Schemas documented in full in §11.2's source-derived table.
- **`create_agent_from_template`** — not live-tested this round (would have meant creating and cleaning up a second test agent; the underlying `create_agent` + node-write path it depends on was already thoroughly validated in §11.3–11.4). Full schema captured from source in §11.2's research.
- **`scrape_url`** — not live-tested (would consume credits scraping a real page; lower priority than the tools that touch core agent/KB/conversation data this retest was scoped around).
- **The two new MCP prompts** (`integrate_website_widget`, `generate_widget_css`) — confirmed to exist in source code (a direct reversal of §3's "confirmed absent" finding), but not invoked/tested this round.
- **`update_conversation_messages`'s actual replace-transcript behavior** — the call made in §11.5 hit the same "Conversation not found" wall as every other single-item conversation operation, so its *distinguishing* behavior (full turn-history replacement) was never actually exercised, only its failure mode on an unreachable conversation.
- **Root cause of `search_agents`'s always-empty results (§11.6)** — not diagnosed further; would require testing against a different workspace or directly inspecting the REST API's `/agents/search` response to isolate whether this is workspace-specific or universal.
- **EU region behavior** — still untested; this server has only ever been exercised against `na-gcp` across both audit rounds.

### 11.10 Summary table — v2.1.0/Docker (§10) vs. v2.3.8/npx (§11)

| # | Finding | §10 (v2.1.0/Docker) | §11 (v2.3.8/npx) |
|---|---|---|---|
| Connection method | — | Docker, worked on first documented attempt | npx failed once (Windows spawn issue), fixed with documented `cmd /c` wrapper — see §11.1 |
| Tool count | — | 22 | 50 (+2 MCP prompts) |
| `create_agent`/`update_agent` — write `instructions` | 🔴 Silent no-op | ✅ **FIXED** — works, now requires `description`+`llmConfig` on create (real validation) |
| — write `description` (routing field) | 🔴 Silent no-op | ✅ **FIXED** |
| — add new node | 🔴 Silent no-op | ✅ **FIXED** |
| — `isGlobal` toggle | 🔴 Silent no-op (moot, node never created) | ✅ **FIXED** |
| — condition-node shape | 🔴 Silent no-op (moot) | ✅ **FIXED** |
| — `llmConfig` | 🔴 Silent no-op | ✅ **FIXED** |
| — `childrenNodes` wiring field | Confirmed as field name only, unwritable | ✅ Writable at storage layer, but 🔴 **NEW BUG**: bare ID-string array crashes `interact_with_agent`'s routing engine |
| KB tools (create/get/stats/list/update/delete) | 🟡 5/6 — `get_kb_doc` failed on existing doc | ✅ **FIXED** — all 6 work, including `get_kb_doc` |
| Conversation single-item ops (get/update/assign/delete) | 🔴 "Conversation not found" | 🔴 **STILL BROKEN** — identical bug, now with clean structured 404s instead of opaque errors |
| Conversation export | 🔴 Blocked by `chat-export-api` billing add-on | 🔴 **STILL BLOCKED** — same add-on requirement |
| `get_agent_usage` | 🔴 "Unauthorized workspace scope" | 🔴 **STILL BROKEN** — identical error, now a clean structured 401 |
| `search_agents` | 🔴 "Unauthorized workspace scope" | 🟡 **DIFFERENTLY BROKEN** — no longer errors, but always returns 0 results |
| Widget embed snippet | ❌ Not MCP-reachable | ✅ **NEW CAPABILITY** — `get_website_embed_code` works |
| Custom widget CSS | ❌ Not MCP-reachable | ✅ **NEW CAPABILITY** — full read/write round-trip confirmed |
| Live conversation (WebSocket Interact) | ❌ Not MCP-reachable | ✅ **NEW CAPABILITY** — `interact_with_agent` works, but surfaced the `childrenNodes` crash bug |
| Voice browsing | ❌ Not MCP-reachable | ✅ **NEW CAPABILITY** — full provider + 313-voice search confirmed |
| File I/O (local files → KB) | ❌ Not MCP-reachable | 🟡 **NEW CAPABILITY, PARTIALLY BROKEN** — inspect/read work; `import_file_to_kb` fails validation |
| Host shell execution (`run_command`) | ❌ Not MCP-reachable | ⚠️ **NEW CAPABILITY, NOT TESTED** — deliberate, user-directed, due to host-level risk under npx (§11.9) |

---

## 12. Live Capability Retest — Real Agent, New Workspace — 2026-08-03

> **Purpose:** every previous MCP capability test in this document (§10, §11) used a **disposable test agent** created and deleted solely for testing. This section runs the same full battery against a **real, manually-created agent** — `NextGen AI Assistant` — in a different test workspace, with every operation *except* `delete_agent` explicitly authorized. Goal: confirm the previous findings hold (or don't) under real-agent conditions, not just throwaway-agent conditions, and check whether anything material changed since the last full retest.

### 12.1 Setup — credential switch and target confirmation

**Step 1 — credential update.** `.mcp.json`'s `WORKSPACE_SECRET` changed from the prior value to `vg_sBw7SK2YCeuY8ryoAn16`. As established in §11.1, editing `.mcp.json` does not take effect on a running MCP connection — confirmed again here: a `list_agents` call immediately after the edit still returned the *old* workspace's agents (`Bakery Assistant`, `Zenny AI`). A session restart was required and requested; after restart, `list_agents` correctly returned the new workspace's two agents (`Zenny-UI`, `NextGen AI Assistant`), confirming the new credential connected successfully.

**Step 2 — target agent confirmed.** **`NextGen AI Assistant` = agentId `tFqkr0YqWG9f96roFutN`** (found via `list_agents`, no `search_agents` needed since only 2 agents exist in this workspace).

### 12.2 Tool inventory — same server version, no changes

A fresh `ToolSearch` for all `mcp__convocore__*` tools returned **53 tools** — every one matching a name already documented in §11.2's category tables (the 22 originals + the 28-tool new-category breakdown + `scrape_url`, which §11.2's own summary text undercounted in its "28 genuinely new tools" tally but did separately document by name elsewhere in that section). **No new tool names, no removed tools, no renamed tools** since §11.

**Server version re-confirmed identical:** `npm view convocore-mcp version` → `2.3.8` (same as §11.1's finding — no run_command needed or used, checked via the Bash tool directly, honoring this session's explicit run_command prohibition). **This workspace is running the exact same MCP server version as every previous test in this document.**

### 12.3 Node write battery — real agent, same result: all confirmed working

**Baseline (`get_agent`):** `NextGen AI Assistant` had one real node (`__start__`) with substantial real production instructions (a full "lead AI consultant for NextGen AI Solutions" persona, ~1,400 characters, plus a separate `voiceInstructions` field for voice mode), `llmConfig.modelId: "Qwen/Qwen3.5-397B-A17B"`, `temperature: 0.7`, `maxTokens: 2024`. This was recorded before any writes, for exact before/after comparison.

**Test approach:** per instructions, additive changes were preferred. Two `update_agent` calls were made, both **additive only** — the real `__start__` node's `instructions`/`description`/`llmConfig`/`voiceInstructions` were never touched or overwritten:

1. **Call 1:** added `childrenNodes: ["mcp_test_node"]` to `__start__`, plus a brand-new node `mcp_test_node` (`instructions`, `description` [routing-trigger field], `llmConfig`, `isGlobal: true`) — testing new-node creation, `description` write, `llmConfig` write, `isGlobal` toggle, and `childrenNodes` wiring in one call.
2. **Call 2:** added a second brand-new node, `mcp_test_condition` (`type: "condition"`, `instructions`, `description`, `llmConfig`) — testing the condition-node shape.

**Both calls: ✅ succeeded, confirmed via the returned `data.nodes` array in each response** (not just trusted from `success: true`) — `__start__`'s real instructions/description/llmConfig/voiceInstructions were byte-for-byte unchanged except for the added `childrenNodes` field; both new nodes appeared exactly as specified, including `isGlobal: true` and `type: "condition"`.

**Verdict: every node-write capability found working in §11.3–11.4 (disposable agent) is confirmed working identically on this real, manually-created agent.** No regression, no difference in behavior between disposable and real agents for this capability.

### 12.4 KB tools — full round trip, real agent

Agent's KB was empty going in (`list_kb_docs` → `total: 0`; matches `enableKnowledgeBase: false` seen in the agent's own config). `get_kb_stats` on this empty KB → 🔴 **`500 Internal Server Error`, `"undefined" is not valid JSON"`** — **the exact same bug found in §8.6/§10.1, reproduced again, on a third agent/workspace now.** This bug is evidently a general, unfixed empty-KB edge case, not scoped to any one workspace.

Full CRUD cycle with a clearly-labeled test doc (`"MCP Capability Retest — safe to delete"`):

| Step | Result |
|---|---|
| `create_kb_doc` | ✅ Success, doc ID `Fj8veOuItU96A9AfipFN` |
| `get_kb_doc` | ✅ Full content returned correctly |
| `list_kb_docs` | ✅ Doc appears correctly |
| `update_kb_doc` | ✅ Content updated correctly, confirmed in response |
| `delete_kb_doc` | ✅ Success |
| `list_kb_docs` (confirm) | ✅ `total: 0` — cleanup confirmed, KB back to its original empty state |

**Verdict: full KB CRUD confirmed working on a real agent, and the test document was fully cleaned up — no trace left behind.**

### 12.5 Conversation tools — bug reconfirmed on a third workspace

Created a fresh test conversation via `create_conversation` (not touching any of the agent's real conversations, per instructions) — succeeded, ID `tFqkr0YqWG9f96roFutN_n1o0bv496SJ8rkMZM4SF` (the same REST-created `{agentId}_{suffix}` shape flagged as the bug trigger in §8.3). Confirmed present via `list_conversations`. Then:

| Tool | Result |
|---|---|
| `get_conversation` | 🔴 `404 Conversation not found` |
| `update_conversation` | 🔴 `404 Conversation not found` |
| `assign_conversation` | 🔴 `404 Conversation not found` |
| `export_conversation` | 🔴 `403 Chat Export API addon required` (separate, known billing gate) |
| `delete_conversation` | 🔴 `404 Conversation not found` |

**Verdict: the REST-created-conversation bug and the export billing gate both reproduce identically on this third workspace, via MCP tools specifically (not just raw REST as tested in `Convocore_REST_Live_Test_v1.md` §2/§7/§8).** This confirms the bug is universal — not specific to any one workspace, credential, or agent — and confirms the MCP wrapper faithfully surfaces it either way. The one leftover test conversation record could not be deleted (same "not found" bug blocking its own cleanup) — harmless, same pattern as every prior session.

### 12.6 Tools / Variables — still not exposed

Per §12.2's inventory, **no `create_tool`/`list_tools`/`create_variable`/`list_variables`-style tools exist anywhere in this server's 53-tool set.** Tools and Variables remain completely unreachable via MCP, unchanged from every previous finding in this document (§5's boundary table). Nothing new to test here.

### 12.7 Newly-discovered tools — none found

§12.2 found zero tool names not already documented in §11.2. There is nothing new to test in this category this round.

### 12.8 Re-confirming known bugs — three confirmed unchanged, one inconsistent result

| Known bug/behavior | This session's result |
|---|---|
| REST-created vs. WebSocket-originated conversation lookup distinction | ✅ **Confirmed unchanged** — REST-created conversation hit the identical 404 pattern (§12.5) |
| `kb/stats` 500 error on empty KB | ✅ **Confirmed unchanged** — reproduced identically on this agent's empty KB (§12.4) |
| `get_agent_usage` — "Unauthorized workspace scope" | ✅ **Confirmed unchanged** — identical 401 error, same message, on this new workspace/credential (rules out "maybe it was specific to the old workspace's credential" as an explanation) |
| `search_agents` — silently returns zero results | ✅ **Confirmed unchanged** — searched `"NextGen"` (a real, matching agent name in this workspace) → `total: 0`, same as §11.6's finding on the prior workspace |
| `childrenNodes` wiring crash in `interact_with_agent` | 🟡 **Did NOT reproduce this time** — see §12.9 |

### 12.9 The `childrenNodes` crash — inconsistent result, reported honestly rather than overclaimed

§11.7 found that writing `childrenNodes` as a bare array of ID strings (e.g. `["node_2"]`) crashed `interact_with_agent`'s routing engine with `TypeError: Cannot create property 'condition' on string 'node_2'`, and `Convocore_REST_Live_Test_v1.md` §1 independently reproduced the identical crash via a raw WebSocket connection with zero MCP involvement — about as solid a confirmation as this document has for any bug.

**This session re-ran the equivalent setup** — `__start__.childrenNodes: ["mcp_test_node"]`, structurally identical (single-entry bare-string array) — and called `interact_with_agent(agentId, convoId: "mcp-retest-childrennodes-crash-check", prompt: "start", isTest: true, disableRecordHistory: true)`.

**Result: no crash.** The response shows a clean turn, including a real debug log line — `"Switching Nodes: __start__ -> mcp_test_node - Instructions: This is a test node added by an MCP capability retest..."` — confirming the router successfully evaluated and followed the `childrenNodes` wiring, then generated a normal reply (`"Hello! I'm the NextGen AI Assistant. How can I help you today?"`), closed cleanly (`closeCode: 1000, closeReason: "turn_complete"`).

**This is reported as a genuine inconsistency, not as "the bug is fixed."** Nothing here confirms the underlying issue was resolved upstream — a single non-crash on a different agent, in a different workspace, is not strong enough evidence to overturn a bug that was independently reproduced twice before (once via MCP, once via raw WebSocket, in §11.7 and `Convocore_REST_Live_Test_v1.md` §1). Plausible explanations, none confirmed: the crash may be conditional on something not controlled for here (e.g. whether a `type: "condition"` node is *also* present and reachable at the same routing decision point — this session's `mcp_test_condition` node was added in a separate call and was not wired into `childrenNodes` alongside `mcp_test_node`, unlike the original crash setup which had both an untyped node and a condition node as siblings); it could be workspace/agent-specific; or it could be genuinely non-deterministic. **Practical guidance unchanged from §11.7/`Convocore_REST_Live_Test_v1.md` §1: do not treat `childrenNodes` bare-ID-array writes as reliably safe to route through — this session's clean result is one data point, not a retraction of the two independent crash reproductions on record.**

### 12.10 Summary of every real change made to `NextGen AI Assistant` (for manual review/cleanup)

Per instructions, an explicit list of everything modified on this real agent during testing, so it can be reviewed or reverted manually:

1. **`nodes[0]` (`__start__`) — added `childrenNodes: ["mcp_test_node"]`.** No other field on this node was touched; its real `instructions`, `description`, `llmConfig`, and `voiceInstructions` are exactly as they were before this session.
2. **New node added: `mcp_test_node`** — `name: "MCP Capability Test Node"`, `instructions`, `description: "MCP_TEST_ROUTING_MARKER: route here only during MCP capability testing"`, `llmConfig` (gemini-2.5-flash), `isGlobal: true`.
3. **New node added: `mcp_test_condition`** — `name: "MCP Test Condition Node"`, `type: "condition"`, `instructions`, `description: "MCP_TEST_CONDITION_MARKER: route here when user says test"`, `llmConfig` (gemini-2.5-flash).
4. **One orphaned conversation record**, created and left behind because `delete_conversation` hit the known "not found" bug: `tFqkr0YqWG9f96roFutN_n1o0bv496SJ8rkMZM4SF`, tagged `mcp-retest`, empty (0 real messages — `interact_with_agent`'s test turn in §12.9 used a *different*, separate convoId and had `disableRecordHistory: true`, so it left no trace at all). Harmless, but present.

**Not changed:** the agent was never deleted (hard restriction honored throughout); its title, description, theme, voiceConfig, top-level settings, and the real `__start__` node's actual content were never modified; `run_command` was never called (hard restriction honored — the one Bash/npm-version check in §12.2 used this session's own Bash tool, not the MCP `run_command` tool, per the explicit distinction in the task's own instructions).

**Recommendation for manual cleanup, if desired:** the two test nodes (`mcp_test_node`, `mcp_test_condition`) and the `childrenNodes` wiring on `__start__` can be removed via the dashboard's Canvas editor, or by another `update_agent` call sending a `nodes` array with only `__start__` (unclear whether the API supports *removing* nodes this way vs. only adding/updating — not tested this session, since removal wasn't part of the requested battery). The orphaned conversation record is inert and doesn't require action.

---

## Changelog

| Date | Change |
|---|---|
| 2026-08-03 | **§12 added** — full capability retest against a real, manually-created agent (`NextGen AI Assistant`, `tFqkr0YqWG9f96roFutN`) in a third workspace, with every operation except `delete_agent` authorized. Credential switch required the same restart-to-reconnect step as §11.1. Tool inventory (53 tools), server version (2.3.8), and every previously-known bug/behavior were re-confirmed **unchanged** on real-agent/real-workspace conditions: node writes (all working), KB CRUD (all working), `kb/stats`-on-empty-KB 500 error (still present), REST-created-conversation 404 bug (still present, now confirmed via MCP specifically on a third workspace), export billing gate (still present), `get_agent_usage` 401 (still present), `search_agents` empty-results bug (still present). **One inconsistent result, reported honestly rather than as a fix:** the `childrenNodes` bare-array crash found in §11.7 and independently reproduced via raw WebSocket in `Convocore_REST_Live_Test_v1.md` §1 did **not** reproduce this session under a structurally similar setup — flagged as an open inconsistency, not a confirmed fix, since two prior independent reproductions outweigh one clean run. §12.10 lists every real change made to the test agent (two additive test nodes + wiring, one orphaned empty test conversation) for manual review. |
| 2026-07-27 | v1 published — full live introspection of the Convocore MCP server (schemas, safe read-only live examples, capability boundary vs. REST/dashboard, Canvas node dual-prompt-field analysis left as unconfirmed pending live write-testing). |
| 2026-07-27 | **§10 added** — live capability test against a disposable test agent (`hvLBqMlkMOzzZMTC0ZzC`, created and deleted within the test). Resolved §5.4's Canvas-write question (`nodes` array writes via `create_agent`/`update_agent` are confirmed **non-functional** for every field tested — `instructions`, `description`, `llmConfig`, new-node addition, `isGlobal`, condition-node shape — while agent-level top-level field writes work correctly). Surfaced two new bugs/gates not previously known: (1) single-item `get`/`update`/`delete`/`assign` lookups fail with "Conversation not found" / "Failed to fetch KB document" for records that demonstrably exist per list endpoints; (2) conversation export tools are gated behind a separate `chat-export-api` billing add-on, unrelated to MCP itself. §5.4 and §9 updated in place to cite these findings; original text preserved with strikethrough where superseded rather than deleted outright, for audit-trail purposes. |
| 2026-07-27 | **§11 added — connection switched from Docker (v2.1.0, stale ~9mo) to npx (v2.3.8, current) and a full capability audit re-run**, not just a recheck of §10. Required a real troubleshooting step: bare `npx` failed to connect on Windows (zero tools registered), diagnosed by manually reproducing the command outside the harness, fixed via the README's documented `cmd /c` wrapper. Server tool count jumped 22→50 (+2 MCP prompts, reversing §3's "confirmed absent" finding for prompts). **Major reversal:** §5.4/§10's "nodes array is completely unwritable" finding is now **FIXED** — every node field (`instructions`, `description`/routing-trigger, `llmConfig`, new nodes, `isGlobal`, condition-node shape, `childrenNodes`) writes correctly and independently-confirmed via `get_agent`, traced to the REST API now enforcing `description`+`llmConfig` as required fields on node creation (previously silently accepted incomplete payloads). **New bug found in the process:** `childrenNodes` accepts a bare ID-string array with no validation error, but crashes the real `/interact` runtime (`TypeError: Cannot create property 'condition' on string`) — the storage layer is now more permissive than the routing engine can safely consume. §10's conversation-record bugs (`get`/`update`/`assign`/`delete` all "not found") and `get_agent_usage`'s auth error are **confirmed still present**, unchanged by the version bump (real backend bugs, not MCP-client-side). `search_agents` traded one bug for another: no longer errors, but now always returns zero results. **Major new capability areas confirmed working:** Widget Deployment & CSS (embed snippet + customCSS read/write — reverses two §5.5 "dashboard-only" rows), Voice browsing (12 providers, 313+ voices), Live Interaction (`interact_with_agent`, real WebSocket turn, consumes real credits), File I/O (local file parsing, with a real bug in `import_file_to_kb`'s missing `metadata.description`). `run_command` (genuine host-shell executor) was found in Step 0 but **deliberately not tested** per explicit user decision, given it now runs with real host-machine access under npx rather than inside a disposable Docker container — flagged prominently in §7.3 and §11.9 as the most consequential open item in this document. §3, §5 (table + 5.1–5.5), §7 (restructured into historical-Docker/current-npx), and §9 all updated in place citing §11; original text preserved with strikethrough/superseded-boxes rather than deleted, for audit-trail purposes. `.mcp.json.docker-backup-2026-07-27` created for instant revert if ever needed. |

---

## STEP COMPLETION SUMMARY

- **What was written:** `Convocore_MCP_Reference_v1.md` — full introspection of the live Convocore MCP server (22 tools across Agents/KB/Conversations, zero resources, no confirmed prompts), a capability-boundary table against all 13 REST resource groups, a concrete answer to the Canvas dual-prompt-field question (§5.4), a clearly-separated and honestly-labeled note on the dashboard-only "MCP Servers" Canvas node feature (§6, unverified), full setup/connection detail (§7), a glossary, and an explicit gaps section (§9).
- **Decisions made:** treated every live tool-call result as ground truth and clearly distinguished it from inferred/documented-elsewhere claims throughout; declined to run destructive tool calls (create/update/delete) against the workspace's two real agents; redacted the live `WORKSPACE_SECRET` value from the document despite it being visible in the local `.mcp.json`.
- **Open questions flagged:** root cause of the "Unauthorized workspace scope" errors (§4.9/§9); whether the Canvas node "MCP Servers" client feature actually exists as described (§6/§9); whether the `nodes` array passthrough can actually write the routing-description field or Canvas edge/wiring data (§5.4).
- **Ready for architect review:** YES
