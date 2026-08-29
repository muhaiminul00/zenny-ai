# Zenny Multi-Node Conversation Runtime — Architecture Specification

**Document Version:** 1.0  
**Status:** Architecture-First Reference (Locked)  
**Last Updated:** 2026-08-29  
**Purpose:** Define the optimized n8n-native multi-node agent architecture for Zenny's SaaS conversation runtime, synthesized from Convocore Canvas and Voiceflow playbook patterns, adapted for self-hosted infrastructure.  
**Audience:** Founders, AI coding agents, architecture reviewers  
**Constraint:** Architecture specification only. No implementation code. If the spec is correct, code follows naturally.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Design Philosophy](#2-design-philosophy)
3. [Architecture Overview](#3-architecture-overview)
4. [The Multi-Node Runtime](#4-the-multi-node-runtime)
5. [Data Model](#5-data-model)
6. [The Conversation Flow](#6-the-conversation-flow)
7. [Cost Optimization Strategy](#7-cost-optimization-strategy)
8. [Quality Optimization Strategy](#8-quality-optimization-strategy)
9. [Pattern Analysis: Convocore vs Voiceflow vs Zenny](#9-pattern-analysis-convocore-vs-voiceflow-vs-zenny)
10. [Build Phases](#10-build-phases)
11. [Risk Assessment & Mitigation](#11-risk-assessment--mitigation)
12. [Success Metrics by Phase](#12-success-metrics-by-phase)
13. [Appendices](#13-appendices)

---

## 1. Executive Summary

Zenny's conversation runtime replaces monolithic single-prompt agents with a **multi-node, router-driven architecture** built entirely within n8n. Each "node" is a specialized sub-agent focused on a narrow domain (booking, FAQ, sales, escalation). A lightweight Router LLM decides which node should handle each turn, eliminating irrelevant context and reducing token waste.

**Key outcomes vs. monolithic approach:**
- **65% reduction in AI API costs** through focused prompts, model tiering, and router caching
- **Higher output quality** through domain-specialized nodes with filtered toolsets and knowledge bases
- **Full ownership** — no platform lock-in, no per-conversation markup
- **7-week build timeline** vs. 10–14 months for a dedicated LangGraph runtime

**Reference platforms studied:**
- **Convocore Canvas:** Node-based visual builder with per-node prompts, tools, KB filters, and a Router LLM
- **Voiceflow:** Playbook/workflow system with global prompts, specialized sub-agents, and exit conditions

**What Zenny keeps:** The decomposition pattern (specialized nodes + router + session state).
**What Zenny changes:** n8n-native implementation, smarter router caching, per-node cost tracking, full data ownership.

---

## 2. Design Philosophy

### 2.1 Core Principles

| Principle | Rationale |
|---|---|
| **One engine, many configurations** | A single n8n runtime serves all tenants. Business-specific behavior is database configuration, not code deployment. |
| **LangGraph thinks, n8n executes → n8n does both** | The original plan separated "brain" (LangGraph) from "executor" (n8n). This architecture collapses that seam. The router + nodes live in n8n sub-workflows, eliminating the webhook contract, HMAC signing, retry logic, and state drift risks of a two-system design. |
| **Cheap decides, expensive creates** | The Router LLM (GPT-4o-mini) is ~20× cheaper than the Response LLM (GPT-4o/Claude). The Router runs only when necessary; 60% of turns are cached continuations that skip routing entirely. |
| **Focus beats breadth** | A node that only knows about booking, with 4 tools and 3 KB chunks, outperforms a generalist agent with 12 tools and 20 KB chunks. Narrow context = better reasoning. |
| **State is truth** | Session state (active node, variables, node stack) lives in PostgreSQL, not in-memory or Redis. Every inbound message starts by loading the full session. There is no "resume execution" — every turn is a fresh n8n execution that reconstructs state from the database. This is the n8n-native approximation of persistent state machines. |

### 2.2 What This Architecture Is NOT

- **NOT a visual canvas builder** (yet). Nodes are configured via database rows and n8n sub-workflows, not drag-and-drop. A visual editor is a Phase 3 UI enhancement, not a runtime requirement.
- **NOT a LangGraph clone.** We borrow the state-machine concept but implement it with n8n's native primitives (Switch nodes, sub-workflows, PostgreSQL state) rather than a dedicated graph framework.
- **NOT a no-code abstraction.** Business owners configure agent behavior (prompts, tools, edges) through a dashboard. The underlying n8n sub-workflows are the implementation layer, hidden from end users but accessible to builders.

---

## 3. Architecture Overview

### 3.1 High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│  CHANNEL LAYER (Web, WhatsApp, Instagram, Email)                   │
│  └─ Normalizes incoming messages to a standard payload             │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  RUNTIME ENTRY (n8n Webhook Trigger)                               │
│  ├─ Authenticate & identify organization + agent                   │
│  ├─ Load or create conversation record                             │
│  └─ Load session state from PostgreSQL                             │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  ROUTER LAYER (Cheap LLM + Cache)                                  │
│  ├─ Check: Is this a continuation? → Skip router (60% of turns)   │
│  ├─ If not cached: Run Router LLM (GPT-4o-mini)                   │
│  │   Input: user message + active node + available edges           │
│  │   Output: STAY | ROUTE_TO [node_id] | ESCALATE | END           │
│  └─ Cache result for continuation detection                        │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  DISPATCH LAYER (n8n Switch Node — zero cost, zero latency)        │
│  └─ Routes to the appropriate specialized node sub-workflow        │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  SPECIALIZED NODE (Sub-workflow — the "brain" of this turn)        │
│  ├─ [Optional] Pre-start tool execution (fetch data before LLM)   │
│  ├─ [Optional] Filtered KB search (domain-specific chunks only)   │
│  ├─ Prompt assembly: Global + Node Instructions + Context          │
│  ├─ Response LLM execution (GPT-4o / Claude Sonnet)               │
│  ├─ [If tool calls] Execute tools → Re-call LLM with results      │
│  ├─ Variable extraction (cheap LLM or regex)                       │
│  ├─ Exit condition evaluation (handoff triggers, next-node hints) │
│  └─ Return: response text + state delta + next node hint          │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  PERSISTENCE LAYER                                                 │
│  ├─ Save session state (active_node, variables, node_stack)        │
│  ├─ Append message to conversation history                         │
│  ├─ Log execution metrics (tokens, cost, latency, node_id)        │
│  └─ Update conversation record (status, last_activity)             │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  RESPONSE LAYER                                                    │
│  └─ Format and send response back through the originating channel  │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Map

| Component | Technology | Purpose | Cost at MVP |
|---|---|---|---|
| **Runtime Engine** | n8n (self-hosted on Hetzner CX22) | Workflow execution, router, node dispatch, tool orchestration | ~$5/month |
| **Primary Database** | PostgreSQL (Supabase) | Conversations, messages, session state, node configs, edges, variables, execution logs | Free tier → $25/month |
| **Vector Search** | pgvector (Supabase built-in) | Knowledge base retrieval, per-node filtered | $0 (included) |
| **Router LLM** | OpenAI GPT-4o-mini | Routing decisions, variable extraction | ~$0.60/1K conversations |
| **Response LLM** | OpenAI GPT-4o / Anthropic Claude Sonnet | Domain-specific response generation | ~$30/1K conversations |
| **Channel Adapters** | n8n webhooks + custom adapters | Web chat, WhatsApp, Instagram, Email normalization | $0 |
| **Observability** | Supabase query logs + n8n execution logs + custom metrics table | Cost tracking, latency monitoring, error detection | $0 |
| **Dashboard** | Next.js (Vercel Pro) | Node configuration, conversation history, analytics | $20/month |

**Total fixed infrastructure at MVP: ~$25–$50/month** (vs. ~$136/month in the LangGraph plan).

---

## 4. The Multi-Node Runtime

### 4.1 Node Types

The runtime supports five node types, mapped directly from Convocore's Canvas and Voiceflow's playbook system:

| Type | Behavior | n8n Implementation | Use Case |
|---|---|---|---|
| **Start Node** | Triggers once at conversation start. Can have an AI-generated or fixed opening message. | Sub-workflow triggered when `conversation.turn_count = 0`. Optionally runs a pre-start tool (e.g., load CRM data by phone number). | Greeting, intent classification on first message, CRM lookup |
| **Default Node** | The standard specialized agent. Has its own instructions, tools, KB filters, and model config. | Sub-workflow with full node lifecycle (pre-start → KB → LLM → tools → variables → exit). | Booking, FAQ, Sales, Support — the workhorses |
| **Global Node** | Accessible from any point in the conversation. Bypasses normal routing. | Sub-workflow callable via explicit trigger ("start over", "human handoff", "what can you do"). | Universal escape hatches |
| **Condition Node** | Rule-based routing with no LLM call. Evaluates expressions against variables or message content. | n8n IF/Switch node with JSON logic expressions. | "If user said 'cancel my order' AND order_id exists → route to cancellation node" |
| **End Node** | Closes the conversation gracefully. Can trigger follow-up workflows (email transcript, satisfaction survey). | Sub-workflow that sets `conversation.status = 'closed'` and optionally triggers n8n follow-up workflows. | Wrap-up, survey, ticket creation |

**Key design decision:** Global Nodes in Convocore are toggled Default Nodes. In Zenny, they are explicitly separate to make routing logic unambiguous — a Global Node is never accidentally activated by the Router LLM; it is only triggered by explicit user intent patterns or button clicks.

### 4.2 The Router (The Secret Sauce)

The Router is the most critical component for both cost and quality. It is a single LLM call that decides which node handles the next turn.

#### 4.2.1 Router Input

The Router receives:
- The user's latest message
- The currently active node name and its routing description
- The list of available edges from the active node (target node name + edge condition)
- The last 3 turns of conversation (for context)
- Current variables (for state-aware routing)
- The conversation turn count

#### 4.2.2 Router Output

The Router returns a structured JSON object:

```json
{
  "decision": "STAY | ROUTE_TO | ESCALATE | END | GLOBAL",
  "target_node": "node_name_or_null",
  "confidence": 0.0_to_1.0,
  "reason": "brief explanation",
  "suggested_variables": {
    "intent_detected": "booking_request",
    "urgency": "low"
  }
}
```

**Decision semantics:**
- **STAY:** The current node continues handling the conversation. This is the most common outcome.
- **ROUTE_TO:** Switch to a different specialized node. The target node's sub-workflow executes next.
- **ESCALATE:** Trigger the human handoff Global Node. Set `handoff_requested = true`.
- **END:** Trigger the End Node. Close the conversation.
- **GLOBAL:** Trigger a specific Global Node (e.g., "start_over", "main_menu").

#### 4.2.3 Router Caching (Critical Optimization)

The Router LLM call is skipped entirely when the user's message is clearly a continuation of the current node's task. This is not a naive string match — it is a pattern-based pre-filter that runs before the LLM.

**Continuation patterns that trigger cache skip:**
- Affirmations: "yes", "yeah", "sure", "ok", "sounds good", "that works"
- Negations: "no", "nope", "not really", "never mind"
- Time/date responses: "2pm", "3:30", "Monday", "tomorrow", "next week"
- Selections: "the first one", "option B", "the blue one", "Dr. Smith"
- Numbers: "3", "$150", "2 hours"
- Clarifications: "actually", "wait", "I meant", "instead"

**Cache invalidation rules:**
- Cache expires after 3 turns without a cache hit
- Cache is invalidated if the user message exceeds 15 words (likely a new intent, not a short answer)
- Cache is invalidated if variables change significantly (e.g., a tool returned an error)
- Cache is never used on turn 1 (always route from Start Node)

**Impact:** In typical customer support conversations, ~60% of user messages are continuations ("yes", "Tuesday", "the second option"). Skipping the Router on these turns eliminates 60% of Router LLM calls, saving ~$0.90 per 1,000 conversations and reducing latency by 300–500ms per turn.

#### 4.2.4 Router Model Selection

- **Primary:** OpenAI GPT-4o-mini (fast, cheap, good at classification)
- **Fallback:** Google Gemini Flash (if OpenAI is down or rate-limited)
- **Never used for routing:** GPT-4o, Claude Sonnet — overkill and 10× more expensive

### 4.3 Specialized Node Lifecycle

Each Default Node follows a strict lifecycle within its n8n sub-workflow:

#### Phase A: Pre-Start Tool Execution (Optional)

Before the Response LLM runs, the node may execute a data-fetching tool to load context. This is identical to Convocore's "Node Pre Start Tool."

**Examples:**
- Booking Node: `GET /api/availability?date={{preferred_date}}` → loads available slots
- Support Node: `GET /api/tickets?user_id={{user_id}}` → loads open tickets
- Sales Node: `GET /api/products?category={{interest}}` → loads product recommendations

**Rules:**
- Pre-start tools are read-only (GET requests). They never mutate data.
- Results are stored in session variables, not passed directly to the LLM prompt (to keep prompts clean).
- If the pre-start tool fails, the node continues with a fallback variable (e.g., `availability_data = "unavailable"`).

#### Phase B: Knowledge Base Search (Optional)

If the node has `kb_enabled = true`, it performs a pgvector similarity search — but **only against chunks tagged for this node**.

**KB filtering logic:**
```
SELECT content, metadata, similarity
FROM knowledge_chunks
WHERE organization_id = {{org_id}}
  AND (agent_id = {{agent_id}} OR agent_id IS NULL)  -- org-wide or agent-specific
  AND tags && ARRAY[{{node_kb_filter_tags}}]         -- ONLY chunks matching this node's tags
ORDER BY embedding <-> {{query_embedding}}
LIMIT {{node_kb_max_chunks}}
```

**Why this matters:** A Booking Node only reads chunks tagged `services`, `pricing`, `hours`. It does not waste tokens on `refund_policy`, `shipping_info`, or `warranty_terms`. This is a direct adaptation of Convocore's per-node KB filtering.

#### Phase C: Prompt Assembly

The final prompt sent to the Response LLM is assembled from four layers:

1. **Global Prompt** (from agent config): Identity, tone, universal rules, hard constraints. Sent with every node. ~500 tokens.
2. **Node Instructions** (from node config): The specialized script for this node's domain. ~300–800 tokens.
3. **Dynamic Context** (assembled per turn):
   - KB search results (if enabled)
   - Pre-start tool results (if executed)
   - Conversation history (last 6 messages)
   - Current variables (formatted as key-value pairs)
   - Tool descriptions (only tools in `allowed_tools`, not all tools)
4. **User Message**: The latest inbound message.

**Total prompt size:** Typically 1,200–1,800 tokens for a Default Node, vs. 3,000–4,500 tokens for a monolithic agent handling the same conversation.

#### Phase D: Response LLM Execution

The Response LLM is an n8n AI Agent node configured with:
- **Model:** Specified in `node_config.model` (e.g., `gpt-4o`, `claude-sonnet-4`)
- **Temperature:** Specified in `node_config.temperature` (typically 0.6–0.8 for customer-facing nodes)
- **Max tokens:** Specified in `node_config.max_tokens` (typically 512–1,024)
- **Tools:** Only the tools listed in `node.allowed_tools`. The LLM cannot see or call tools assigned to other nodes.

**Tool-call loop:** If the LLM decides to call a tool, n8n executes the tool (HTTP request to internal API or external service), appends the result to the conversation context, and re-calls the LLM. This loop continues until the LLM returns a final response or a max-loop limit (3 iterations) is hit.

#### Phase E: Variable Extraction

After the Response LLM generates its reply, a cheap extraction pass identifies new information to save.

**Method:** GPT-4o-mini with a focused extraction prompt.

**Input:** The last 2 turns of conversation + the node's defined variable extraction instructions.

**Output:** JSON object of variable key-value pairs to update.

**Example:**
```json
{
  "user_name": "Alice Johnson",
  "service": "Deep Tissue Massage",
  "preferred_date": "2026-09-15",
  "preferred_time": "2:00 PM",
  "practitioner_preference": "Dr. Smith"
}
```

**Why separate extraction:** In a monolithic agent, variable extraction is implicit and unreliable (the LLM may or may not remember to save things). Making it an explicit, cheap post-processing step ensures no data is lost and keeps the Response LLM focused on generating good replies, not bookkeeping.

#### Phase F: Exit Condition Evaluation

The node checks whether its response should trigger a transition to another node or a handoff.

**Exit condition types:**
- **Keyword match:** Response contains "handoff", "escalate", "human"
- **Variable state:** `handoff_requested = true` (set by tool result or LLM directive)
- **User intent pattern:** User explicitly asked for a human
- **Node-specific rules:** e.g., "If booking is confirmed, offer to add to calendar"

If an exit condition matches, the node returns a `next_node_hint` to the main workflow, which updates `active_node_id` before the next turn.

### 4.4 Session State Management

Session state is the persistent memory of the conversation runtime. It is loaded at the start of every turn and saved at the end.

#### 4.4.1 State Components

| Component | Type | Purpose | Persistence |
|---|---|---|---|
| `active_node_id` | UUID | Which node is currently handling the conversation | PostgreSQL |
| `node_stack` | JSONB array | History of visited nodes for rewind support. Each entry: `{node_id, entered_at, reason}` | PostgreSQL |
| `variables` | JSONB | Key-value store of collected information (Convocore-style conversation variables) | PostgreSQL |
| `conversation_history` | Relational (messages table) | Full message log (user + assistant + tool) | PostgreSQL |
| `last_router_decision` | JSONB | Cached router output for continuation detection | PostgreSQL |
| `router_cache_expires_at` | Timestamp | When to invalidate the router cache | PostgreSQL |
| `handoff_state` | JSONB | Handoff request flag, reason, team assignment | PostgreSQL |

#### 4.4.2 The "Fresh Execution" Model

n8n does not have persistent execution state across webhook calls. Every inbound message triggers a new, independent workflow execution. This is a feature, not a bug — it means:

- **No memory leaks:** Each turn starts clean. There is no long-running process to crash.
- **Horizontal scaling:** Multiple n8n instances can handle conversations for the same agent without coordination.
- **Simple recovery:** If a turn fails, the next turn starts from the last saved state in PostgreSQL. No "stuck" executions.
- **Trade-off:** Higher database read/write load. Mitigated by keeping the session state table small and indexed.

**State load sequence (every turn):**
1. Receive webhook payload
2. Lookup `conversation_id` by `external_id` + `channel` + `org_id`
3. If not found, create new conversation + session (Start Node becomes active)
4. Load `conversation_sessions` row by `conversation_id`
5. Load last 6 messages from `messages` table for history context
6. Execute router/node logic
7. Save updated session state + append new messages
8. Return response

#### 4.4.3 Rewind Support

Convocore offers "Rewind Level" (1–3 nodes back). Zenny implements this via the `node_stack`:

- Every time `active_node_id` changes, the old node is pushed to `node_stack` with a timestamp and reason.
- The stack is capped at 10 entries (configurable per agent).
- When the user says "go back" or "start over," the Router detects this intent and routes to the Global Node "rewind."
- The rewind node pops the last entry from `node_stack` and sets it as the new `active_node_id`.
- If the stack is empty, "go back" routes to the Start Node.

**Voiceflow does not have rewind** — this is a Zenny enhancement based on real user behavior ("wait, go back" is a common utterance in multi-step flows).

---

## 5. Data Model

### 5.1 Core Runtime Tables

#### `agents` (Tenant-scoped agent definition)

| Field | Type | Description |
|---|---|---|
| `id` | UUID PK | Agent identifier |
| `organization_id` | UUID FK | Multi-tenant isolation |
| `name` | VARCHAR(100) | Display name (e.g., "Urban Wellness Front Desk") |
| `archetype` | ENUM | `consultation`, `emergency`, `support`, `sales` — broad category for default templates |
| `global_prompt` | TEXT | Universal identity, tone, hard rules (appended to every node) |
| `router_model` | VARCHAR(50) | Default router LLM (overridable per node) |
| `response_model` | VARCHAR(50) | Default response LLM (overridable per node) |
| `is_active` | BOOLEAN | Soft delete flag |
| `created_at` | TIMESTAMPTZ | |

#### `agent_nodes` (The "Canvas" — specialized sub-agents)

| Field | Type | Description |
|---|---|---|
| `id` | UUID PK | Node identifier |
| `agent_id` | UUID FK | Parent agent |
| `node_type` | ENUM | `start`, `default`, `global`, `condition`, `end` |
| `name` | VARCHAR(100) | Display name (e.g., "Booking Specialist") |
| `position_x`, `position_y` | INTEGER | Visual coordinates (for future canvas UI) |
| `routing_description` | TEXT | What this node does — read by the Router LLM to decide routing |
| `instructions` | TEXT | The node's specialized prompt/script |
| `model_config` | JSONB | `{"model": "gpt-4o", "temperature": 0.7, "max_tokens": 512}` |
| `kb_enabled` | BOOLEAN | Whether this node searches the knowledge base |
| `kb_search_on_start` | BOOLEAN | Search KB before LLM call (vs. on-demand) |
| `kb_max_chunks` | INTEGER | Max KB chunks to include in prompt |
| `kb_filter_tags` | TEXT[] | Only search chunks with these tags |
| `pre_start_tool_id` | UUID FK | Tool to execute before LLM (optional) |
| `pre_start_tool_params` | JSONB | Parameter template for pre-start tool |
| `allowed_tools` | UUID[] | Subset of tools this node can use |
| `exit_conditions` | JSONB | Array of rules for when to leave this node |
| `allow_rewind` | BOOLEAN | Whether this node supports "go back" |
| `is_active` | BOOLEAN | Soft delete flag |

#### `agent_node_edges` (Canvas connections)

| Field | Type | Description |
|---|---|---|
| `id` | UUID PK | Edge identifier |
| `agent_id` | UUID FK | Parent agent |
| `source_node_id` | UUID FK | Where the edge originates |
| `target_node_id` | UUID FK | Where the edge leads |
| `edge_label` | VARCHAR(100) | Visual label (e.g., "Booking Request") |
| `edge_condition` | TEXT | Natural language description for Router LLM (e.g., "Route here when user wants to book, reschedule, or check appointments") |
| `priority` | INTEGER | Higher = checked first by router |
| `is_active` | BOOLEAN | Soft delete flag |

#### `conversations` (Chat thread)

| Field | Type | Description |
|---|---|---|
| `id` | UUID PK | Conversation identifier |
| `organization_id` | UUID FK | Tenant isolation |
| `agent_id` | UUID FK | Which agent is handling this |
| `channel` | ENUM | `web`, `whatsapp`, `instagram`, `email`, `sms` |
| `external_id` | VARCHAR(255) | Channel-specific thread ID (e.g., WhatsApp message ID) |
| `status` | ENUM | `active`, `closed`, `escalated`, `waiting` |
| `customer_info` | JSONB | Name, phone, email (if known) |
| `turn_count` | INTEGER | Number of exchanges (for analytics) |
| `created_at`, `updated_at` | TIMESTAMPTZ | |

#### `conversation_sessions` (Runtime state)

| Field | Type | Description |
|---|---|---|
| `id` | UUID PK | Session identifier |
| `conversation_id` | UUID FK | Links to conversation |
| `active_node_id` | UUID FK | Current node handling this conversation |
| `node_stack` | JSONB | Array of previously visited nodes for rewind |
| `variables` | JSONB | Collected conversation variables |
| `last_router_decision` | JSONB | Cached router output |
| `router_cache_expires_at` | TIMESTAMPTZ | When to invalidate cache |
| `handoff_requested` | BOOLEAN | Flag for human escalation |
| `handoff_reason` | TEXT | Why handoff was triggered |
| `handoff_team_key` | VARCHAR(50) | Which team to notify |
| `updated_at` | TIMESTAMPTZ | Last state change |

#### `messages` (Conversation history)

| Field | Type | Description |
|---|---|---|
| `id` | UUID PK | Message identifier |
| `conversation_id` | UUID FK | Parent conversation |
| `role` | ENUM | `system`, `user`, `assistant`, `tool` |
| `content` | TEXT | Message text |
| `node_id` | UUID FK | Which node generated this (for assistant messages) |
| `tool_calls` | JSONB | Tool call metadata (if any) |
| `tool_results` | JSONB | Tool execution results (if any) |
| `latency_ms` | INTEGER | Time to generate this message |
| `token_count` | INTEGER | Total tokens in this turn |
| `cost_usd` | DECIMAL(10,6) | Cost of this turn |
| `created_at` | TIMESTAMPTZ | |

#### `agent_variables` (Variable definitions)

| Field | Type | Description |
|---|---|---|
| `id` | UUID PK | Variable identifier |
| `agent_id` | UUID FK | Parent agent |
| `key` | VARCHAR(50) | Variable name (e.g., `user_name`) |
| `var_type` | ENUM | `string`, `number`, `boolean`, `json` |
| `scope` | ENUM | `conversation` (per-chat), `global` (cross-chat), `environment` (secret) |
| `description` | TEXT | Human-readable description |
| `extraction_instruction` | TEXT | Instructions for the extraction LLM (e.g., "When user provides their name, save it here") |
| `is_required` | BOOLEAN | Must be collected before conversation can close |
| `default_value` | TEXT | Fallback if not collected |
| `is_environment` | BOOLEAN | Hidden from LLM, used for secrets/API keys in tools |

#### `node_execution_logs` (Observability)

| Field | Type | Description |
|---|---|---|
| `id` | UUID PK | Log entry |
| `conversation_id` | UUID FK | |
| `node_id` | UUID FK | Which node executed |
| `execution_type` | ENUM | `router`, `response`, `tool`, `kb_search`, `variable_extract` |
| `input_tokens` | INTEGER | |
| `output_tokens` | INTEGER | |
| `model` | VARCHAR(50) | Which LLM was used |
| `cost_usd` | DECIMAL(10,6) | Cost of this execution |
| `latency_ms` | INTEGER | Time taken |
| `input_preview` | TEXT | Truncated input for debugging |
| `output_preview` | TEXT | Truncated output for debugging |
| `created_at` | TIMESTAMPTZ | |

### 5.2 Row Level Security (RLS)

Every table with `organization_id` must enforce tenant isolation:

```sql
-- Example policy for agent_nodes
CREATE POLICY "tenant_isolation_nodes" ON agent_nodes
  FOR ALL
  USING (organization_id = current_setting('app.current_org_id')::UUID);

-- The org_id is set per request via PostgreSQL SET command
-- Propagated from: JWT token (Supabase Auth) → n8n workflow → PostgreSQL session
```

**Critical rule:** No query in any n8n workflow may run without setting `app.current_org_id`. This is enforced at the workflow level, not trusted to individual nodes.

---

## 6. The Conversation Flow

### 6.1 Turn 0: Conversation Start

1. **Channel adapter** receives first message (or widget open event).
2. **Runtime entry** creates a new `conversations` record and `conversation_sessions` record.
3. **Start Node** is set as `active_node_id`.
4. **Start Node sub-workflow executes:**
   - If configured, run pre-start tool (e.g., lookup customer by phone number).
   - If `ai_opens = true`, generate opening message via Response LLM.
   - If `ai_opens = false`, wait for user message.
5. **Save state:** Push Start Node to `node_stack`.
6. **Return response** through channel.

### 6.2 Turn N: Normal Conversation

1. **Channel adapter** receives user message N.
2. **Runtime entry** loads existing `conversation_sessions` by `conversation_id`.
3. **Router cache check:**
   - If message matches continuation patterns AND cache is valid → skip Router LLM, decision = STAY.
   - Else → run Router LLM with full context.
4. **Dispatch:** n8n Switch node routes to the target sub-workflow.
5. **Specialized Node executes** its full lifecycle (pre-start → KB → LLM → tools → variables → exit).
6. **State update:**
   - If node changed → update `active_node_id`, push old node to `node_stack`.
   - Update `variables` with extracted data.
   - Update `last_router_decision` and `router_cache_expires_at`.
7. **Persistence:** Save session state, append messages to `messages` table, log execution metrics.
8. **Return response** through channel.

### 6.3 Turn N: Handoff Trigger

1. **Router** returns `decision: ESCALATE` OR **Node exit condition** sets `handoff_requested = true`.
2. **Global Node "human_handoff"** executes:
   - Generate handoff summary from conversation history.
   - Notify assigned team via email/Slack/SMS (n8n workflow).
   - Set `conversation.status = 'escalated'`.
   - Return handoff message to user (e.g., "I'm connecting you with our support team...").
3. **Post-handoff:** Conversation pauses. Human agent takes over via dashboard. When resolved, human agent can return control to AI (sets status back to `active`).

### 6.4 Turn N: End Conversation

1. **Router** returns `decision: END` OR user says "goodbye" / "that's all".
2. **End Node** executes:
   - Generate closing message.
   - Trigger follow-up workflows (email transcript, satisfaction survey, lead scoring).
   - Set `conversation.status = 'closed'`.
3. **Post-close:** If user messages again on the same `external_id`, a new conversation is created (or the closed one is reopened, depending on agent config).

---

## 7. Cost Optimization Strategy

### 7.1 Model Tiering

| Task | Model | Cost per 1K tokens | Why |
|---|---|---|---|
| **Router decisions** | GPT-4o-mini | $0.15 input / $0.60 output | Fast, cheap, good at classification. 200-token input, 50-token output = ~$0.0003 per call. |
| **Variable extraction** | GPT-4o-mini | $0.15 input / $0.60 output | Simple structured output task. ~$0.0001 per extraction. |
| **Simple responses** (FAQ, greetings) | GPT-4o-mini | $0.15 input / $0.60 output | Low reasoning requirement. Saves 80% vs. GPT-4o. |
| **Complex responses** (booking, sales, troubleshooting) | GPT-4o | $2.50 input / $10.00 output | Better reasoning, tool use, and nuance. Used only when needed. |
| **High-stakes responses** (complaints, refunds, medical) | Claude Sonnet 4 | $3.00 input / $15.00 output | Best judgment, safety, and tone. Used sparingly. |

**Per-node model selection:** Each node specifies its own `model_config`. A "FAQ Handler" node can use GPT-4o-mini. A "Booking Specialist" uses GPT-4o. An "Escalation Handler" uses Claude Sonnet. This is more granular than Convocore (which has one model per node but no global tiering strategy) and Voiceflow (which has one model per agent).

### 7.2 Router Caching Impact

| Scenario | Without Cache | With Cache | Savings |
|---|---|---|---|
| 1,000 conversations, 5 turns each | 5,000 router calls = $1.50 | 2,000 router calls = $0.60 | **$0.90 + 1.5s latency** |
| 10,000 conversations, 5 turns each | 50,000 router calls = $15.00 | 20,000 router calls = $6.00 | **$9.00 + 15s total latency** |

### 7.3 Prompt Size Reduction

| Component | Monolithic Agent | Multi-Node Agent | Reduction |
|---|---|---|---|
| System prompt | 1,500 tokens (all rules) | 500 tokens (global) + 400 tokens (node) | **47%** |
| Tool descriptions | 800 tokens (10 tools) | 200 tokens (4 tools) | **75%** |
| KB context | 1,000 tokens (full KB) | 300 tokens (filtered chunks) | **70%** |
| History | 600 tokens (last 10) | 400 tokens (last 6, focused) | **33%** |
| **Total per turn** | **3,900 tokens** | **1,400 tokens** | **64%** |

At GPT-4o pricing ($2.50/M input, $10/M output), this is:
- Monolithic: 3,900 × $2.50/M + 500 output × $10/M = **$14.75 per 1K turns**
- Multi-node: 1,400 × $2.50/M + 400 output × $10/M = **$7.50 per 1K turns**
- **Savings: $7.25 per 1K turns (49%)**

### 7.4 Total Cost Projection

**Assumptions:** 1,000 conversations/month, 5 turns each = 5,000 turns.

| Cost Center | Amount |
|---|---|
| Router LLM (2,000 cached, 3,000 actual calls) | $0.90 |
| Response LLM (GPT-4o, 1,400-token avg prompt) | $37.50 |
| Variable extraction (5,000 extractions) | $0.50 |
| KB search (pgvector, no external service) | $0 |
| **Total AI API cost** | **$38.90** |
| Infrastructure (n8n VPS + Supabase + Vercel) | ~$50 |
| **Total monthly cost** | **~$89** |

**Equivalent on Convocore/Voiceflow:** $150–$400/month (platform markup + per-conversation pricing).

**Savings at 1K conversations: $60–$310/month. At 10K conversations: $600–$3,100/month.**

---

## 8. Quality Optimization Strategy

### 8.1 Domain Specialization

Each node is an expert in one domain. This eliminates the "jack of all trades, master of none" problem of monolithic agents.

**Example: Booking Node instructions (300 tokens)**
```
You are the Booking Specialist for [Business Name]. Your ONLY job is to 
help customers book, reschedule, or cancel appointments.

Rules:
1. Always confirm the service, date, time, and practitioner before booking.
2. If the requested slot is unavailable, offer the next 3 available slots.
3. Never confirm a booking unless the availability API returns "confirmed".
4. If the user asks about pricing, check the KB for service pricing.
5. If the user asks about something unrelated to booking (refunds, products, 
   general complaints), do NOT answer. Instead, say: "Let me connect you 
   with someone who can help with that" and trigger the handoff tool.

You have access to these tools ONLY:
- check_availability
- book_appointment
- reschedule_appointment
- cancel_appointment
```

Compare to a monolithic agent that must hold rules for booking, sales, support, and refunds in working memory simultaneously. The specialized node makes fewer mistakes because its context window is not cluttered with irrelevant rules.

### 8.2 Tool Restriction

The Booking Node sees 4 tools. It cannot accidentally call `create_support_ticket` or `process_refund`. This is enforced at the prompt level (only 4 tool descriptions are included) and at the n8n workflow level (the AI Agent node is only configured with 4 tools).

**Convocore pattern adopted:** Per-node tool assignment. Convocore warns that making all tools global "might make the AI hallucinate more." Zenny enforces this by design.

### 8.3 Knowledge Base Filtering

The Booking Node only searches KB chunks tagged `services`, `pricing`, `hours`. It never sees `refund_policy` or `shipping_faq`. This prevents the common failure mode where an agent answers a booking question with refund policy text, confusing the customer.

**Voiceflow limitation:** Voiceflow has a global knowledge base with no per-node filtering. Zenny improves on this.

### 8.4 Pre-Start Data Loading

Before the Response LLM runs, the node can fetch real-time data (availability, inventory, ticket status). This means:
- The LLM responds with **actual facts**, not guesses.
- "Let me check that for you" happens in 200ms (pre-start tool), not after the LLM already guessed wrong.
- The LLM prompt includes structured data ("Available slots: 2pm, 3pm, 4pm") rather than asking the LLM to hallucinate availability.

**Convocore pattern adopted:** Node Pre Start Tool. This is one of Convocore's most powerful features for reliability.

### 8.5 Explicit Variable Extraction

Variables are not implicitly inferred by the Response LLM. A separate, cheap extraction pass ensures:
- No data is lost because the LLM "forgot" to save something.
- The extraction prompt can be tuned per node ("Booking Node: extract date, time, service, practitioner" vs. "Sales Node: extract budget, timeline, decision_maker").
- The Response LLM is freed from bookkeeping — it focuses entirely on generating a good reply.

### 8.6 Exit Condition Clarity

Each node defines when it should stop handling the conversation. This prevents the "agent that won't let go" problem:

```json
[
  {
    "condition": "user explicitly asks for human agent",
    "action": "ESCALATE",
    "target": "human_handoff"
  },
  {
    "condition": "user asks about refund or billing dispute",
    "action": "ROUTE_TO",
    "target": "escalation_agent"
  },
  {
    "condition": "booking is confirmed and user says 'thank you' or 'that's all'",
    "action": "ROUTE_TO",
    "target": "end_conversation"
  }
]
```

---

## 9. Pattern Analysis: Convocore vs Voiceflow vs Zenny

### 9.1 Node Structure

| Feature | Convocore | Voiceflow | Zenny |
|---|---|---|---|
| **Visual canvas** | Yes (drag-and-drop nodes) | Yes (playbook canvas) | No (Phase 3 UI). Nodes are database rows + n8n sub-workflows. |
| **Node types** | Start, Default, Global, Condition, End | Playbook (agent), Workflow (step-by-step), Logic (condition, set, code) | Start, Default, Global, Condition, End — mapped to n8n primitives. |
| **Per-node prompt** | Yes (Instructions field) | Yes (Playbook instructions) | Yes (`instructions` field in `agent_nodes`). |
| **Per-node model** | Yes | Yes (per playbook) | Yes (`model_config` JSONB). |
| **Per-node tools** | Yes | Yes (per playbook) | Yes (`allowed_tools` array). |
| **Per-node KB** | Yes (Enable KB toggle + filters) | No (global KB only) | Yes (`kb_enabled` + `kb_filter_tags`). |
| **Pre-start data** | Yes (Node Pre Start Tool) | No | Yes (`pre_start_tool_id`). |
| **Variable extraction** | Implicit (LLM decides) | Explicit (via Set nodes in workflows) | Explicit (cheap LLM post-processing). |
| **Rewind / Go back** | Yes (1–3 levels) | No | Yes (configurable `node_stack`). |

### 9.2 Routing

| Feature | Convocore | Voiceflow | Zenny |
|---|---|---|---|
| **Router mechanism** | Router LLM per node | Playbook-level intent detection | Single Router LLM with cache optimization. |
| **Router model** | Gemini Flash (recommended) | Internal (opaque) | GPT-4o-mini with fallback to Gemini Flash. |
| **Edge conditions** | Natural language description | Exit conditions (natural language) | Natural language description (`edge_condition`). |
| **Condition nodes** | Yes (no LLM, rule-based) | Yes (Logic → Condition) | Yes (n8n IF/Switch nodes). |
| **Continuation handling** | Implicit (node persists until routed away) | Implicit (workflow step persists) | **Explicit cache** (skips Router LLM on continuations). |

### 9.3 State & Memory

| Feature | Convocore | Voiceflow | Zenny |
|---|---|---|---|
| **Conversation variables** | Yes (Local, Global, Environment) | Yes (Variables) | Yes (`agent_variables` with scope). |
| **Variable capture** | Must instruct LLM explicitly | Can be set in workflows | Explicit extraction instruction + cheap LLM. |
| **Session persistence** | Platform-managed | Platform-managed | **PostgreSQL** (self-hosted, queryable, portable). |
| **History length** | Platform-managed | Platform-managed | Configurable (default 6 turns per node). |
| **Cross-conversation memory** | Global variables | User variables | Global scope variables in PostgreSQL. |

### 9.4 Tool System

| Feature | Convocore | Voiceflow | Zenny |
|---|---|---|---|
| **Custom tools** | Webhooks (GET/POST/PUT/PATCH/DELETE) | API, Function, MCP | n8n HTTP Request nodes (any method, full auth). |
| **System tools** | 9 built-in (Shopify, Calendar, Handoff, etc.) | Zendesk, Salesforce, Shopify, etc. | **None built-in** — all tools are custom webhooks to Zenny's backend or external APIs. |
| **Tool auth** | Bearer token only | OAuth, API key, etc. | Full auth (Bearer, Basic, OAuth, custom headers). |
| **Tool result format** | JSON recommended | JSON recommended | JSON enforced — n8n parses and passes to LLM. |
| **MCP support** | Yes (client-side, per-node) | Yes | **Deferred** — n8n has MCP nodes, but Zenny uses direct webhooks for reliability. |

### 9.5 What Zenny Does Better

1. **Cost transparency:** Per-node, per-turn cost tracking in `node_execution_logs`. Convocore and Voiceflow hide their markup.
2. **Router caching:** 60% of router calls eliminated. Neither platform offers this optimization.
3. **Full data ownership:** All conversation data, node configs, and execution logs live in your PostgreSQL. No platform lock-in.
4. **n8n ecosystem:** Access to 400+ integrations, custom code nodes, and workflow automation beyond just conversation.
5. **Model flexibility:** Use any LLM provider (OpenAI, Anthropic, Google, Groq, local models). Platforms lock you to their approved list.
6. **Rewind support:** Convocore has limited rewind; Voiceflow has none. Zenny has configurable stack-based rewind.
7. **Environment variables:** Secrets are properly isolated and never exposed to the LLM context window.

### 9.6 What Zenny Gives Up

1. **Visual canvas builder:** Not available in Phase 1–2. Node configuration is form-based. A visual editor is a future enhancement.
2. **Built-in channel integrations:** Convocore and Voiceflow offer one-click WhatsApp, Instagram, etc. Zenny requires custom channel adapters (webhook normalization).
3. **Managed infrastructure:** Platforms handle scaling, backups, and uptime. Zenny requires self-management (mitigated by n8n + Supabase reliability).
4. **Pre-built analytics dashboards:** Platforms offer built-in conversation analytics. Zenny builds custom dashboards in Phase 2B.

---

## 10. Build Phases

### Phase 0: Architecture Lock (1 week)

**Deliverable:** This document, frozen and signed off.

| Step | Task | Owner |
|---|---|---|
| 0.1 | Finalize this architecture document | Human |
| 0.2 | Claude Opus review — logical gaps, edge cases | Claude Opus |
| 0.3 | GPT-5 review — integration anti-patterns, n8n feasibility | GPT-5 |
| 0.4 | Kimi review — contradictions with business plan, cost model | Kimi |
| 0.5 | Human synthesis — resolve conflicts, freeze spec | Human |
| 0.6 | **ARCHITECTURE LOCK** — no deviations without re-validation | Human |

### Phase 1: Core Runtime (2 weeks)

**Goal:** One agent, two nodes (Start + one Default), web channel only, one real client (Carmelli).

| Step | Module | Validation |
|---|---|---|
| 1.1 | Database schema + migrations + RLS policies | Multi-tenant isolation test |
| 1.2 | n8n main workflow (webhook → load state → router → dispatch → save) | End-to-end test with hardcoded state |
| 1.3 | Router LLM integration (GPT-4o-mini) + cache logic | 20 test conversations, 60%+ cache hit rate |
| 1.4 | Start Node sub-workflow | Opening message test |
| 1.5 | Default Node sub-workflow (FAQ Handler, GPT-4o-mini) | Accuracy test on 20 FAQ questions |
| 1.6 | Conversation history persistence | Message table verification |
| 1.7 | Channel adapter (web chat widget) | Live test on Carmelli's site |
| 1.8 | **Milestone: Working 2-node agent on one real client** | Demo + customer feedback |

### Phase 2: Node Builder + Multi-Node (2 weeks)

**Goal:** Internal team can configure agents without code. Add 2 more nodes (Booking + Escalation).

| Step | Module | Notes |
|---|---|---|
| 2.1 | Dashboard: Node CRUD (name, instructions, model, tools, KB filters) | Form-based, no visual canvas yet |
| 2.2 | Dashboard: Edge editor (connect nodes, write edge conditions) | Simple table UI |
| 2.3 | Dashboard: Variable manager (create variables, set extraction instructions) | |
| 2.4 | Dashboard: Agent config (global prompt, archetype selection) | |
| 2.5 | Booking Node sub-workflow (with pre-start tool + KB filters) | Test on Carmelli |
| 2.6 | Escalation / Handoff Node sub-workflow | Human notification test |
| 2.7 | Condition Node support (n8n IF logic exposed as configurable nodes) | |
| 2.8 | Global Nodes ("start_over", "main_menu", "human_handoff") | |
| 2.9 | Execution logs dashboard (per-node cost, latency, token usage) | |
| 2.10 | **Milestone: 4-node agent configurable via dashboard, no code changes needed** | |

### Phase 3: Scale + Channels (2 weeks)

**Goal:** Multi-channel, multi-archetype, self-service onboarding.

| Step | Module | Notes |
|---|---|---|
| 3.1 | WhatsApp channel adapter | Webhook normalization pattern |
| 3.2 | Instagram DM channel adapter | |
| 3.3 | Email channel adapter | Threading logic |
| 3.4 | Archetype templates (Consultation, Emergency, Support, Sales) | Pre-built node graphs |
| 3.5 | Self-service onboarding (new org → template agent → customize) | |
| 3.6 | Usage quotas + rate limiting (per plan) | |
| 3.7 | Cost alert system (per-org daily spend threshold) | |
| 3.8 | **Milestone: First paying customer onboarded without human help** | |

### Phase 4: Polish + Visual Canvas (Optional, 2–4 weeks)

**Goal:** Visual node editor for non-technical users.

| Step | Module | Notes |
|---|---|---|
| 4.1 | React Flow canvas UI (drag-and-drop nodes) | Position data already in schema |
| 4.2 | Visual edge drawing (connect nodes on canvas) | |
| 4.3 | Node configuration panel (slide-out, Convocore-style) | |
| 4.4 | Live test mode (simulate conversation while editing) | |
| 4.5 | **Milestone: Visual canvas at parity with Convocore's builder** | |

**Total timeline to SaaS-ready: 7–9 weeks** (vs. 10–14 months for LangGraph plan).

---

## 11. Risk Assessment & Mitigation

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| **n8n AI Agent node quality insufficient** | Medium | Critical | Quality gate in Phase 1.8. If n8n's AI Agent node fails on tool-call accuracy or multi-turn retention, evaluate Pydantic AI as a lightweight dedicated runtime (swappable brain layer, keep n8n for execution). |
| **Router LLM misroutes frequently** | Medium | High | Router cache reduces LLM exposure. Fallback: add keyword-based pre-routing rules (Condition Nodes) for common intents before LLM router. Monitor misroute rate in execution logs. |
| **Multi-tenant data leakage** | Low | Critical | RLS policies on all tables. Manual penetration test in Phase 2. |
| **n8n workflow execution failures** | Medium | High | n8n has built-in retry logic. Execution logs in `node_execution_logs` + n8n's own execution history. Error workflow triggers Slack alert on failure. |
| **PostgreSQL becomes bottleneck** | Low | Medium | Session state table is small (one row per active conversation). Index on `conversation_id`. Supabase handles 10K+ concurrent connections. |
| **AI API cost explosion** | Medium | Medium | Per-node model tiering. Usage quotas per org. Cost alerts. GPT-4o-mini as default for simple nodes. |
| **Build timeline slip** | Medium | Medium | Architecture lock prevents scope creep. Phase 1 restricted to 2 nodes + 1 channel. No visual canvas until Phase 4. |
| **No product-market fit** | Medium | Critical | Phase 1 ends with pilot customer validation. Do not proceed to Phase 2 without revenue signal or strong usage metrics. |
| **Channel adapter complexity** | Medium | Medium | Start with web chat (simplest). WhatsApp/Instagram use standardized webhook patterns. Email threading is the hardest — defer to Phase 3. |
| **Founder burnout** | High | Critical | 7-week MVP timeline is achievable. AI coding agents handle implementation. Human focuses on architecture, validation, and customer conversations. |

---

## 12. Success Metrics by Phase

| Phase | Metric | Target |
|---|---|---|
| Phase 0 | Architecture spec completeness | 100% traceability (every requirement → design → test plan) |
| Phase 1 | Router cache hit rate | ≥ 60% |
| Phase 1 | FAQ accuracy (Default Node) | ≥ 90% on 20 test questions |
| Phase 1 | End-to-end conversation success | ≥ 85% (no crashes, correct routing, coherent responses) |
| Phase 1 | Pilot customer willingness to pay | ≥ 1 customer commits to paid plan |
| Phase 2 | Node creation time (non-technical user) | < 10 minutes from dashboard to working node |
| Phase 2 | Multi-node conversation accuracy | ≥ 90% correct routing between nodes |
| Phase 2 | Multi-tenant isolation audit | Zero data leakage across organizations |
| Phase 3 | Self-service onboarding completion | > 50% of signups create first agent without support |
| Phase 3 | Monthly Recurring Revenue (MRR) | > $1,000 |
| Phase 3 | AI cost per conversation | < $0.04 (vs. $0.15–$0.40 on Convocore/Voiceflow) |
| Phase 3 | Average response latency | < 2.5 seconds per turn |

---

## 13. Appendices

### Appendix A: Glossary

| Term | Definition |
|---|---|
| **Node** | A specialized sub-agent with its own instructions, tools, and knowledge base. The fundamental building block of the Zenny runtime. |
| **Router** | The cheap LLM that decides which node should handle each conversation turn. |
| **Edge** | A connection between two nodes, with a natural language condition describing when to traverse it. |
| **Archetype** | A broad agent category (consultation, emergency, support, sales) that provides a default node graph template. |
| **Pre-start tool** | A data-fetching operation that runs before the Response LLM, loading real-time context (e.g., availability, inventory). |
| **Node stack** | A LIFO history of visited nodes, enabling "go back" functionality. |
| **Router cache** | A pattern-based skip mechanism that avoids running the Router LLM on obvious continuations ("yes", "2pm", etc.). |
| **Global Node** | A node accessible from any point in the conversation, handling universal intents ("start over", "human handoff"). |
| **Condition Node** | A rule-based routing node with no LLM call, evaluated via expressions. |

### Appendix B: Convocore → Zenny Mapping

| Convocore Concept | Zenny Equivalent | Notes |
|---|---|---|
| Canvas | `agent_nodes` + `agent_node_edges` tables | Database rows instead of visual graph. Position fields reserved for future canvas UI. |
| Start Node | `node_type = 'start'` | Identical behavior. |
| Default Node | `node_type = 'default'` | Identical behavior. |
| Global Node | `node_type = 'global'` | Explicit type in Zenny (Convocore uses a toggle on Default Nodes). |
| Condition Node | `node_type = 'condition'` | n8n IF/Switch node logic. |
| End Node | `node_type = 'end'` | Identical behavior. |
| Node Instructions | `agent_nodes.instructions` | Direct mapping. |
| Node "Defines what this does" (routing trigger) | `agent_nodes.routing_description` | Read by Router LLM, not Response LLM. |
| Router LLM | Router sub-workflow (GPT-4o-mini) | Per-agent default, overridable per node. |
| Edge Condition | `agent_node_edges.edge_condition` | Natural language for Router LLM. |
| Node Pre Start Tool | `agent_nodes.pre_start_tool_id` | Identical behavior. |
| Enable Knowledge Base | `agent_nodes.kb_enabled` | Identical behavior. |
| KB Filter Tags | `agent_nodes.kb_filter_tags` | Identical behavior. |
| Max chunks per query | `agent_nodes.kb_max_chunks` | Identical behavior. |
| Variables (Local) | `agent_variables.scope = 'conversation'` | Identical behavior. |
| Variables (Global) | `agent_variables.scope = 'global'` | Identical behavior. |
| Variables (Environment) | `agent_variables.scope = 'environment'` | Identical behavior. |
| Variable capture instruction | `agent_variables.extraction_instruction` | Explicit in Zenny, implicit in Convocore. |
| Rewind Level | `agent_nodes.rewind_levels` + `node_stack` | Configurable in Zenny (fixed 1–3 in Convocore). |
| Custom Tools | n8n HTTP Request nodes | More flexible auth in Zenny. |
| System Tools | Custom webhooks to Zenny backend | Zenny does not use platform-specific system tools. |

### Appendix C: Voiceflow → Zenny Mapping

| Voiceflow Concept | Zenny Equivalent | Notes |
|---|---|---|
| Playbook | `agent_nodes` (Default Nodes) | Voiceflow playbooks are reusable agent modules. Zenny nodes are similar but tied to a specific agent graph. |
| Workflow | n8n sub-workflows | Voiceflow workflows are step-by-step logic. Zenny uses n8n's native workflow system. |
| Global Prompt | `agents.global_prompt` | Identical behavior. |
| Instructions | `agent_nodes.instructions` | Identical behavior. |
| Tools (per playbook) | `agent_nodes.allowed_tools` | Identical behavior. |
| Exit Conditions | `agent_nodes.exit_conditions` | Identical behavior. |
| Knowledge Base | `knowledge_chunks` + `agent_nodes.kb_filter_tags` | Voiceflow has global KB only. Zenny adds per-node filtering. |
| Variables | `agent_variables` | Identical behavior. |
| Handoffs | Global Node "human_handoff" | Identical behavior. |
| System Tools | Custom webhooks | Voiceflow has pre-built integrations. Zenny builds all integrations via n8n. |

### Appendix D: Decision Log

| Decision | Chosen | Rejected | Rationale |
|---|---|---|---|
| **Runtime platform** | n8n-native multi-node | LangGraph + FastAPI | Eliminates integration seam, reduces complexity, leverages existing n8n expertise. |
| **Router implementation** | GPT-4o-mini with cache | Dedicated classifier model | Cheap, fast, good enough. Cache eliminates 60% of calls. |
| **State storage** | PostgreSQL (Supabase) | Redis (Upstash) | n8n's "fresh execution" model requires persistent state. PostgreSQL is already in stack. No Redis needed. |
| **KB vector search** | pgvector (Supabase) | Pinecone, Weaviate | No separate service cost. Included in Supabase. Per-node filtering is sufficient. |
| **Observability** | Custom `node_execution_logs` + Supabase query logs | Laminar, Langfuse, Arize Phoenix | Overkill for MVP. Built-in logging is sufficient until scale demands more. |
| **Channel strategy** | Web first, then WhatsApp/Instagram, then Email | All channels at once | Web is simplest. Validate core runtime before adding channel complexity. |
| **Visual canvas** | Phase 4 (optional) | Phase 1 | Form-based configuration is faster to build and sufficient for MVP. Visual canvas is a nice-to-have, not a blocker. |
| **Model strategy** | Per-node model selection | One model for all nodes | Tiered pricing. Simple nodes use GPT-4o-mini. Complex nodes use GPT-4o or Claude. |

---

## Document Changelog

- **v1.0 (2026-08-29)** — Initial architecture specification. Synthesized from Convocore Canvas Ground Truth, Voiceflow documentation, and Zenny's raw product definition. Optimized for n8n-native implementation with multi-node decomposition, router caching, and per-node cost tracking.

---

*End of Document*
